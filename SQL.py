import json
import os
import subprocess
import tempfile
from contextlib import closing
from functools import lru_cache
from urllib.parse import quote
from urllib.request import urlopen

import numpy as np
import pandas as pd
import pyodbc
from flask import Flask, jsonify
from flask_cors import CORS

APP_HOST = os.getenv('JAZZ_API_HOST', '0.0.0.0')
APP_PORT = int(os.getenv('JAZZ_API_PORT', '3000'))
DB_CONNECTION_STRING = os.getenv('JAZZ_DB_CONNECTION', '').strip()

ITUNES_SEARCH_API = 'https://itunes.apple.com/search'
FALLBACK_COVER = 'https://placehold.co/600x600/111111/1DB954?text=Jazz+Cover'
ENABLE_BOOT_METADATA_LOOKUP = os.environ.get('ENABLE_BOOT_METADATA_LOOKUP', '0') == '1'
COUNTRY_POOL = [
    'United States', 'United Kingdom', 'France', 'Brazil', 'Japan',
    'Canada', 'Italy', 'Sweden', 'Germany', 'Australia',
]

MANUAL_SUMMARIES = {
    "Don't Know Why": '這首歌最初由 Jesse Harris 創作，後來因 Norah Jones 收錄於首張專輯《Come Away with Me》而廣為人知，也成為她最具代表性的作品之一。',
    'Come Away With Me': '這是一首帶有溫柔爵士與抒情氛圍的作品，奠定了 Norah Jones 早期最鮮明的音樂形象。',
    'By Your Side': '這首歌由 Sade 於 2000 年推出，整體旋律溫暖而真摯，常被視為她的重要代表作之一。',
    'What A Wonderful World': 'Louis Armstrong 透過這首歌描寫世界的美好與溫暖，因此它成為最具代表性的爵士經典之一。',
    'It Runs Through Me': '這首歌結合爵士、靈魂與嘻哈元素，展現出現代爵士跨風格融合的特色。',
    'My Baby Just Cares for Me - 2013 Remastered Version': '這首作品原本就是經典歌曲，而 Nina Simone 的演唱版本更讓它廣受歡迎，也成為她最具辨識度的代表作之一。',
    'The Girl From Ipanema': '這首歌是全球最知名的巴莎諾瓦作品之一，也是爵士與巴西音樂結合的經典範例。',
    'Cheek To Cheek': '這是一首歷久不衰的經典標準曲，長期被不同世代的爵士與流行歌手翻唱。',
    'Dream A Little Dream Of Me - Single Version': '這首歌旋律夢幻而親密，橫跨流行與爵士兩個世界，是傳唱度很高的標準曲。',
    'Solitude': '這首作品帶有濃厚的憂鬱氣質，後來成為經典爵士標準曲，也常與 Billie Holiday 的詮釋連結在一起。',
}

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': '*'}})

DATA_MODE = 'csv-fallback'
BOOTSTRAP_ERROR = ''
SONG_MODEL = pd.DataFrame()
ARTIST_METRICS = pd.DataFrame()
PLAYLIST_METRICS = pd.DataFrame()
ERA_METRICS = pd.DataFrame()
RECOMMENDATION_MAP = {}
TOP_SONG_IDS = []


def get_connection():
    if DB_CONNECTION_STRING:
        return pyodbc.connect(DB_CONNECTION_STRING)

    available_drivers = set(pyodbc.drivers())
    preferred_drivers = ['ODBC Driver 18 for SQL Server', 'ODBC Driver 17 for SQL Server', 'SQL Server']
    selected_driver = next((driver for driver in preferred_drivers if driver in available_drivers), 'SQL Server')
    connection_string = (
        f'DRIVER={{{selected_driver}}};'
        'SERVER=127.0.0.1,1433;'
        'DATABASE=JazzDB;'
        'UID=jazz_user;'
        'PWD=Jazz123!@#;'
        'Encrypt=no;'
        'TrustServerCertificate=yes;'
    )
    return pyodbc.connect(connection_string)


@lru_cache(maxsize=256)
def sql_literal(value):
    if value is None or pd.isna(value):
        return 'NULL'
    if isinstance(value, (bool, np.bool_)):
        return '1' if value else '0'
    if isinstance(value, (int, np.integer)):
        return str(int(value))
    if isinstance(value, (float, np.floating)):
        return str(float(value))
    return "N'" + str(value).replace("'", "''") + "'"


def run_sql_script(script_text):
    with tempfile.NamedTemporaryFile('w', suffix='.sql', delete=False, encoding='utf-8') as handle:
        handle.write(script_text)
        temp_path = handle.name
    try:
        subprocess.run(
            [
                'powershell',
                '-Command',
                (
                    "Invoke-Sqlcmd -ServerInstance '127.0.0.1,1433' "
                    "-Database 'JazzDB' "
                    "-Username 'jazz_user' "
                    "-Password 'Jazz123!@#' "
                    f"-InputFile '{temp_path}'"
                ),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='ignore',
        )
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


def build_insert_batches(table_name, columns, dataframe, batch_size=200):
    statements = []
    rows = dataframe[columns].to_dict(orient='records')
    for index in range(0, len(rows), batch_size):
        batch = rows[index:index + batch_size]
        values_sql = []
        for row in batch:
            values_sql.append('(' + ', '.join(sql_literal(row[column]) for column in columns) + ')')
        statements.append(f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES\n" + ',\n'.join(values_sql) + ';\n')
    return statements


def lookup_song_metadata(title, artist):
    try:
        term = quote(f'{title} {artist}')
        url = f'{ITUNES_SEARCH_API}?term={term}&entity=song&limit=1&country=us'
        with urlopen(url, timeout=8) as response:
            payload = json.loads(response.read().decode('utf-8'))

        result = (payload.get('results') or [None])[0]
        if not result:
            return {
                'cover_art': FALLBACK_COVER,
                'album_name': 'Jazz Collection',
                'track_url': '',
                'preview_url': '',
            }

        return {
            'cover_art': (result.get('artworkUrl100') or FALLBACK_COVER).replace('100x100bb', '600x600bb'),
            'album_name': result.get('collectionName') or 'Jazz Collection',
            'track_url': result.get('trackViewUrl') or result.get('collectionViewUrl') or '',
            'preview_url': result.get('previewUrl') or '',
        }
    except Exception:
        return {
            'cover_art': FALLBACK_COVER,
            'album_name': 'Jazz Collection',
            'track_url': '',
            'preview_url': '',
        }


def build_song_intro(row):
    popularity = float(row.get('popularity', 0))
    num_artists = int(row.get('num_artists', 1))
    title = row.get('title', 'Unknown Song')
    artist = row.get('artist_name', 'Unknown Artist')
    album_name = row.get('album_name', 'Jazz Collection')
    tempo = round(float(row.get('tempo', 0)), 1)
    energy = round(float(row.get('energy', 0)), 2)
    danceability = round(float(row.get('danceability', 0)), 2)
    valence = round(float(row.get('valence', 0)), 2)

    popularity_text = '高辨識度' if popularity >= 70 else '穩定受歡迎' if popularity >= 60 else '風格鮮明'
    collaboration_text = (
        '這首歌以單人演唱為主，因此情緒與聲線表現更集中。'
        if num_artists <= 1
        else f'這首歌由 {num_artists} 位音樂人共同參與，讓整體聲音層次更豐富。'
    )
    feature_text = (
        f'它的節奏大約為 {tempo} BPM，energy 約 {energy}、danceability 約 {danceability}、valence 約 {valence}，'
        '呈現出兼具節奏感與情緒氛圍的爵士特質。'
    )
    base_summary = MANUAL_SUMMARIES.get(title, f'〈{title}〉是 {artist} 的代表性爵士作品之一，具有鮮明旋律與穩定的聆聽吸引力。')
    return (
        f'歌曲介紹：〈{title}〉收錄於《{album_name}》，由 {artist} 演唱，在目前榜單中屬於{popularity_text}的作品。'
        f'{collaboration_text}{feature_text}{base_summary}'
    )


def assign_country(value):
    return COUNTRY_POOL[abs(hash(str(value))) % len(COUNTRY_POOL)]


def build_user_behavior(song_feature_df):
    records = []
    for _, row in song_feature_df.iterrows():
        base_popularity = float(row['popularity'])
        base_energy = float(row['energy'])
        base_valence = float(row['valence'])
        for user_id in range(1, 25):
            seed = (int(row['song_id']) * 37 + user_id * 17) % 100
            play_count = max(1, int(base_popularity / 5) + (seed % 6))
            rating = min(5.0, max(2.5, round(2.8 + base_energy * 1.4 + base_valence * 0.8 + ((seed % 12) / 20), 1)))
            liked = 1 if rating >= 4.0 else 0
            if seed % 3 != 0 or play_count >= 10:
                records.append({'user_id': user_id, 'song_id': int(row['song_id']), 'play_count': play_count, 'liked': liked, 'rating': rating})
    return pd.DataFrame(records)


def load_relational_model():
    tracks = pd.read_csv('Jazz_playlist_tracks.csv').rename(columns={'name': 'title'})
    tracks_data = pd.read_csv('Jazz_playlist_tracks_data.csv').rename(columns={'track_name': 'title', 'duration': 'duration_ms'})
    playlists = pd.read_csv('Jazz_playlist_data.csv')

    merged = tracks_data.merge(
        tracks[['track_id', 'title', 'artist_id', 'artist_name', 'num_artists', 'playlist_id', 'playlist_name']],
        on=['track_id', 'playlist_id'],
        how='left',
        suffixes=('_feature', ''),
    )

    merged['title'] = merged['title'].fillna(merged['title_feature']).fillna('Unknown Song')
    merged['playlist_name'] = merged['playlist_name'].fillna('Unknown Playlist')
    merged['duration_ms'] = pd.to_numeric(merged['duration_ms'], errors='coerce').fillna(0)
    merged['duration_mins'] = merged['duration_ms'] / 60000
    for column in ['popularity', 'danceability', 'energy', 'valence', 'loudness', 'tempo']:
        merged[column] = pd.to_numeric(merged[column], errors='coerce').fillna(0)
    merged['key'] = pd.to_numeric(merged['key'], errors='coerce').fillna(0).astype(int)
    merged['num_artists'] = pd.to_numeric(merged['num_artists'], errors='coerce').fillna(1).astype(int)
    merged['song_id'] = np.arange(1, len(merged) + 1)
    merged['genre'] = 'Jazz'
    merged['release_year'] = pd.to_datetime(merged['release_date'], errors='coerce').dt.year.fillna(2000).astype(int)
    merged['decade'] = (merged['release_year'] // 10 * 10).astype(int).astype(str) + 's'
    merged['album_title'] = merged['album_id'].apply(lambda value: f'Album {value}')
    merged['country'] = merged['artist_id'].apply(assign_country)

    playlist_map = playlists[['playlist_id', 'playlist_name', 'owner_id', 'owner_name', 'total_followers']].copy()
    playlist_map['total_followers'] = pd.to_numeric(playlist_map['total_followers'], errors='coerce').fillna(0)
    merged = merged.merge(playlist_map, on=['playlist_id', 'playlist_name'], how='left')
    merged['total_followers'] = merged['total_followers'].fillna(0)

    if ENABLE_BOOT_METADATA_LOOKUP:
        metadata_rows = []
        for _, row in merged.sort_values(['popularity', 'title'], ascending=[False, True]).head(10).iterrows():
            metadata_rows.append({'song_id': int(row['song_id']), **lookup_song_metadata(row['title'], row['artist_name'])})
        metadata_df = pd.DataFrame(metadata_rows)
        merged = merged.merge(metadata_df, on='song_id', how='left')
    else:
        merged['cover_art'] = FALLBACK_COVER
        merged['track_url'] = ''
        merged['preview_url'] = ''
        merged['album_name'] = merged['album_title']
    merged['album_name'] = merged['album_name'].fillna(merged['album_title'])
    merged['cover_art'] = merged['cover_art'].fillna(FALLBACK_COVER)
    merged['track_url'] = merged['track_url'].fillna('')
    merged['preview_url'] = merged['preview_url'].fillna('')
    merged['summary'] = merged.apply(build_song_intro, axis=1)

    artists = merged[['artist_id', 'artist_name', 'country']].drop_duplicates().rename(columns={'artist_name': 'name'}).reset_index(drop=True)
    albums = merged[['album_id', 'album_title', 'release_year']].drop_duplicates().rename(columns={'album_title': 'title'}).reset_index(drop=True)
    song_table = merged[[
        'song_id', 'title', 'artist_id', 'tempo', 'key', 'genre', 'duration_mins', 'popularity', 'release_year', 'decade',
        'playlist_id', 'playlist_name', 'num_artists', 'artist_name', 'album_name', 'cover_art', 'track_url', 'preview_url', 'summary', 'total_followers'
    ]].rename(columns={'duration_mins': 'duration'})
    audio_features = merged[['song_id', 'energy', 'danceability', 'valence', 'loudness']].copy()
    user_behavior = build_user_behavior(song_table.merge(audio_features, on='song_id', how='left'))

    return {
        'songs': song_table,
        'artists': artists,
        'albums': albums,
        'song_album': merged[['song_id', 'album_id']].drop_duplicates().reset_index(drop=True),
        'song_playlist': merged[['song_id', 'playlist_id']].drop_duplicates().reset_index(drop=True),
        'audio_features': audio_features,
        'user_behavior': user_behavior,
        'playlists': playlists[['playlist_id', 'playlist_name', 'owner_id', 'owner_name', 'total_followers']].copy(),
    }


def enrich_song_model(song_table, audio_features, user_behavior):
    enriched = song_table.merge(audio_features, on='song_id', how='left')
    behavior_metrics = user_behavior.groupby('song_id', as_index=False).agg(play_count=('play_count', 'sum'), likes=('liked', 'sum'), avg_rating=('rating', 'mean'))
    enriched = enriched.merge(behavior_metrics, on='song_id', how='left')
    enriched['play_count'] = enriched['play_count'].fillna(0)
    enriched['likes'] = enriched['likes'].fillna(0)
    enriched['avg_rating'] = enriched['avg_rating'].fillna(0)
    play_scaled = enriched['play_count'] / max(float(enriched['play_count'].max()), 1.0) * 100
    rating_scaled = enriched['avg_rating'] / 5.0 * 100
    enriched['heat_score'] = ((play_scaled * 0.5) + (enriched['popularity'] * 0.3) + (rating_scaled * 0.2)).round(1)
    return enriched


def build_artist_metrics(song_model):
    grouped = song_model.groupby(['artist_id', 'artist_name'], as_index=False).agg(
        total_play_count=('play_count', 'sum'),
        avg_rating=('avg_rating', 'mean'),
        avg_popularity=('popularity', 'mean'),
        heat_score=('heat_score', 'mean'),
        song_count=('song_id', 'count'),
    )
    grouped['avg_rating'] = grouped['avg_rating'].round(2)
    grouped['avg_popularity'] = grouped['avg_popularity'].round(1)
    grouped['heat_score'] = grouped['heat_score'].round(1)
    return grouped.sort_values(['heat_score', 'total_play_count'], ascending=[False, False]).reset_index(drop=True)


def build_playlist_metrics(song_model):
    grouped = song_model.groupby('playlist_name', as_index=False).agg(total_songs=('song_id', 'count'), avg_popularity=('popularity', 'mean'), avg_heat=('heat_score', 'mean'))
    grouped['avg_popularity'] = grouped['avg_popularity'].round(1)
    grouped['avg_heat'] = grouped['avg_heat'].round(1)
    return grouped.sort_values(['avg_popularity', 'total_songs'], ascending=[False, False]).reset_index(drop=True)


def label_era(row):
    labels = {
        '1950s': '經典搖擺與咆勃交會，速度相對平穩。',
        '1960s': '偏向經典爵士與巴莎諾瓦，節奏較柔和。',
        '1970s': '融合風格開始增加，節奏與能量逐步上升。',
        '1980s': '錄音更精緻，音色與流行元素逐漸增加。',
        '1990s': '都會爵士與跨界元素變多，節奏更容易親近。',
        '2000s': '現代爵士與抒情作品並存，整體節奏更流暢。',
        '2010s': '融合、Lo-fi 與跨界合作增加，聽感更現代。',
    }
    return labels.get(row['decade'], '不同時代的爵士風格在節奏、能量與情緒表現上各有特色。')


def build_era_metrics(song_model):
    grouped = song_model.groupby('decade', as_index=False).agg(
        avg_tempo=('tempo', 'mean'), avg_popularity=('popularity', 'mean'), avg_energy=('energy', 'mean'), avg_danceability=('danceability', 'mean'), song_count=('song_id', 'count')
    ).sort_values('decade').reset_index(drop=True)
    grouped['avg_tempo'] = grouped['avg_tempo'].round(1)
    grouped['avg_popularity'] = grouped['avg_popularity'].round(1)
    grouped['avg_energy'] = grouped['avg_energy'].round(2)
    grouped['avg_danceability'] = grouped['avg_danceability'].round(2)
    grouped['style_label'] = grouped.apply(label_era, axis=1)
    return grouped


def cosine_similarity_matrix(features):
    matrix = features.to_numpy(dtype=float)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1
    normalized = matrix / norms
    return normalized @ normalized.T


def build_recommendation_map(song_model):
    feature_columns = ['tempo', 'energy', 'danceability', 'valence', 'popularity']
    working = song_model[['song_id', 'title', 'artist_name', *feature_columns]].copy()
    for column in feature_columns:
        series = working[column].astype(float)
        std = float(series.std()) or 1.0
        working[column] = (series - float(series.mean())) / std

    similarity = cosine_similarity_matrix(working[feature_columns])
    song_ids = working['song_id'].tolist()
    recommendations = {}
    top_song_ids = song_model.sort_values(['popularity', 'title'], ascending=[False, True]).head(10)['song_id'].tolist()

    for index, song_id in enumerate(song_ids):
        if song_id not in top_song_ids:
            continue
        source_title = song_model.loc[song_model['song_id'] == song_id, 'title'].iloc[0]
        candidate_indexes = np.argsort(similarity[index])[::-1]
        picks = []
        for candidate_index in candidate_indexes:
            candidate_song_id = song_ids[candidate_index]
            if candidate_song_id == song_id:
                continue
            candidate_row = song_model[song_model['song_id'] == candidate_song_id].iloc[0]
            picks.append({'song_id': int(candidate_song_id), 'title': candidate_row['title'], 'artist': candidate_row['artist_name'], 'similarity': round(float(similarity[index][candidate_index]), 3), 'reason': f'在 tempo、energy、danceability 與 valence 上和〈{source_title}〉最接近。'})
            if len(picks) == 3:
                break
        recommendations[str(int(song_id))] = picks
    return recommendations


def correlation_items(song_model):
    columns = ['tempo', 'energy', 'danceability', 'valence', 'loudness', 'popularity']
    corr = song_model[columns].corr(numeric_only=True).round(2)
    return [{'x': x, 'y': y, 'value': float(corr.loc[x, y])} for x in columns for y in columns]


def valence_distribution(song_model):
    bins = pd.cut(song_model['valence'], bins=[-0.01, 0.33, 0.66, 1.0], labels=['低情緒', '中性情緒', '高情緒'])
    grouped = bins.value_counts().reindex(['低情緒', '中性情緒', '高情緒']).fillna(0)
    return [{'label': label, 'count': int(count)} for label, count in grouped.items()]


def relational_schema_overview():
    return {'tables': [
        {'name': 'Artists', 'columns': ['artist_id', 'name', 'country']},
        {'name': 'Albums', 'columns': ['album_id', 'title', 'release_year']},
        {'name': 'Songs', 'columns': ['song_id', 'title', 'artist_id', 'tempo', 'musical_key', 'genre', 'duration', 'popularity']},
        {'name': 'Song_Album', 'columns': ['song_id', 'album_id']},
        {'name': 'Audio_Features', 'columns': ['song_id', 'energy', 'danceability', 'valence', 'loudness']},
        {'name': 'User_Behavior', 'columns': ['user_id', 'song_id', 'play_count', 'liked', 'rating']},
        {'name': 'Playlists', 'columns': ['playlist_id', 'playlist_name', 'owner_id', 'owner_name', 'total_followers']},
        {'name': 'Song_Playlist', 'columns': ['song_id', 'playlist_id']},
    ]}


def rebuild_database(model):
    with closing(get_connection()) as connection:
        cursor = connection.cursor()
        cursor.execute('''
            IF OBJECT_ID('Song_Playlist', 'U') IS NOT NULL DROP TABLE Song_Playlist;
            IF OBJECT_ID('User_Behavior', 'U') IS NOT NULL DROP TABLE User_Behavior;
            IF OBJECT_ID('Audio_Features', 'U') IS NOT NULL DROP TABLE Audio_Features;
            IF OBJECT_ID('Song_Album', 'U') IS NOT NULL DROP TABLE Song_Album;
            IF OBJECT_ID('Songs', 'U') IS NOT NULL DROP TABLE Songs;
            IF OBJECT_ID('Playlists', 'U') IS NOT NULL DROP TABLE Playlists;
            IF OBJECT_ID('Albums', 'U') IS NOT NULL DROP TABLE Albums;
            IF OBJECT_ID('Artists', 'U') IS NOT NULL DROP TABLE Artists;
        ''')
        connection.commit()

        cursor.execute('CREATE TABLE Artists (artist_id NVARCHAR(100) PRIMARY KEY, name NVARCHAR(255), country NVARCHAR(100));')
        cursor.execute('CREATE TABLE Albums (album_id NVARCHAR(100) PRIMARY KEY, title NVARCHAR(255), release_year INT);')
        cursor.execute('CREATE TABLE Playlists (playlist_id NVARCHAR(100) PRIMARY KEY, playlist_name NVARCHAR(255), owner_id NVARCHAR(100), owner_name NVARCHAR(255), total_followers FLOAT);')
        cursor.execute('CREATE TABLE Songs (song_id INT PRIMARY KEY, title NVARCHAR(255), artist_id NVARCHAR(100), tempo FLOAT, [key] INT, genre NVARCHAR(100), duration FLOAT, popularity FLOAT, release_year INT, decade NVARCHAR(20), FOREIGN KEY (artist_id) REFERENCES Artists(artist_id));')
        cursor.execute('CREATE TABLE Song_Album (song_id INT, album_id NVARCHAR(100), PRIMARY KEY (song_id, album_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id), FOREIGN KEY (album_id) REFERENCES Albums(album_id));')
        cursor.execute('CREATE TABLE Audio_Features (song_id INT PRIMARY KEY, energy FLOAT, danceability FLOAT, valence FLOAT, loudness FLOAT, FOREIGN KEY (song_id) REFERENCES Songs(song_id));')
        cursor.execute('CREATE TABLE User_Behavior (user_id INT, song_id INT, play_count INT, liked BIT, rating FLOAT, PRIMARY KEY (user_id, song_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id));')
        cursor.execute('CREATE TABLE Song_Playlist (song_id INT, playlist_id NVARCHAR(100), PRIMARY KEY (song_id, playlist_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id), FOREIGN KEY (playlist_id) REFERENCES Playlists(playlist_id));')
        connection.commit()

        for row in model['artists'].itertuples(index=False):
            cursor.execute('INSERT INTO Artists(artist_id, name, country) VALUES (?, ?, ?)', str(row.artist_id), row.name, row.country)
        for row in model['albums'].itertuples(index=False):
            cursor.execute('INSERT INTO Albums(album_id, title, release_year) VALUES (?, ?, ?)', str(row.album_id), row.title, int(row.release_year))
        for row in model['playlists'].itertuples(index=False):
            cursor.execute('INSERT INTO Playlists(playlist_id, playlist_name, owner_id, owner_name, total_followers) VALUES (?, ?, ?, ?, ?)', str(row.playlist_id), row.playlist_name, str(row.owner_id), row.owner_name, float(row.total_followers))
        for row in model['songs'].itertuples(index=False):
            cursor.execute('INSERT INTO Songs(song_id, title, artist_id, tempo, [key], genre, duration, popularity, release_year, decade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', int(row.song_id), row.title, str(row.artist_id), float(row.tempo), int(row.key), row.genre, float(row.duration), float(row.popularity), int(row.release_year), row.decade)
        for row in model['song_album'].itertuples(index=False):
            cursor.execute('INSERT INTO Song_Album(song_id, album_id) VALUES (?, ?)', int(row.song_id), str(row.album_id))
        for row in model['audio_features'].itertuples(index=False):
            cursor.execute('INSERT INTO Audio_Features(song_id, energy, danceability, valence, loudness) VALUES (?, ?, ?, ?, ?)', int(row.song_id), float(row.energy), float(row.danceability), float(row.valence), float(row.loudness))
        for row in model['user_behavior'].itertuples(index=False):
            cursor.execute('INSERT INTO User_Behavior(user_id, song_id, play_count, liked, rating) VALUES (?, ?, ?, ?, ?)', int(row.user_id), int(row.song_id), int(row.play_count), int(row.liked), float(row.rating))
        for row in model['song_playlist'].itertuples(index=False):
            cursor.execute('INSERT INTO Song_Playlist(song_id, playlist_id) VALUES (?, ?)', int(row.song_id), str(row.playlist_id))
        connection.commit()


def rebuild_database_via_invoke_sqlcmd(model):
    schema_sql = '''
IF OBJECT_ID('Song_Playlist', 'U') IS NOT NULL DROP TABLE Song_Playlist;
IF OBJECT_ID('User_Behavior', 'U') IS NOT NULL DROP TABLE User_Behavior;
IF OBJECT_ID('Audio_Features', 'U') IS NOT NULL DROP TABLE Audio_Features;
IF OBJECT_ID('Song_Album', 'U') IS NOT NULL DROP TABLE Song_Album;
IF OBJECT_ID('Songs', 'U') IS NOT NULL DROP TABLE Songs;
IF OBJECT_ID('Playlists', 'U') IS NOT NULL DROP TABLE Playlists;
IF OBJECT_ID('Albums', 'U') IS NOT NULL DROP TABLE Albums;
IF OBJECT_ID('Artists', 'U') IS NOT NULL DROP TABLE Artists;

CREATE TABLE Artists (artist_id NVARCHAR(100) PRIMARY KEY, name NVARCHAR(255), country NVARCHAR(100));
CREATE TABLE Albums (album_id NVARCHAR(100) PRIMARY KEY, title NVARCHAR(255), release_year INT);
CREATE TABLE Playlists (playlist_id NVARCHAR(100) PRIMARY KEY, playlist_name NVARCHAR(255), owner_id NVARCHAR(100), owner_name NVARCHAR(255), total_followers FLOAT);
CREATE TABLE Songs (song_id INT PRIMARY KEY, title NVARCHAR(255), artist_id NVARCHAR(100), tempo FLOAT, [key] INT, genre NVARCHAR(100), duration FLOAT, popularity FLOAT, release_year INT, decade NVARCHAR(20), FOREIGN KEY (artist_id) REFERENCES Artists(artist_id));
CREATE TABLE Song_Album (song_id INT, album_id NVARCHAR(100), PRIMARY KEY (song_id, album_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id), FOREIGN KEY (album_id) REFERENCES Albums(album_id));
CREATE TABLE Audio_Features (song_id INT PRIMARY KEY, energy FLOAT, danceability FLOAT, valence FLOAT, loudness FLOAT, FOREIGN KEY (song_id) REFERENCES Songs(song_id));
CREATE TABLE User_Behavior (user_id INT, song_id INT, play_count INT, liked BIT, rating FLOAT, PRIMARY KEY (user_id, song_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id));
CREATE TABLE Song_Playlist (song_id INT, playlist_id NVARCHAR(100), PRIMARY KEY (song_id, playlist_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id), FOREIGN KEY (playlist_id) REFERENCES Playlists(playlist_id));
'''
    run_sql_script(schema_sql)

    table_batches = [
        build_insert_batches('Artists', ['artist_id', 'name', 'country'], model['artists']),
        build_insert_batches('Albums', ['album_id', 'title', 'release_year'], model['albums']),
        build_insert_batches('Playlists', ['playlist_id', 'playlist_name', 'owner_id', 'owner_name', 'total_followers'], model['playlists']),
        build_insert_batches('Songs', ['song_id', 'title', 'artist_id', 'tempo', '[key]', 'genre', 'duration', 'popularity', 'release_year', 'decade'], model['songs'].rename(columns={'key': '[key]'})),
        build_insert_batches('Song_Album', ['song_id', 'album_id'], model['song_album']),
        build_insert_batches('Audio_Features', ['song_id', 'energy', 'danceability', 'valence', 'loudness'], model['audio_features']),
        build_insert_batches('User_Behavior', ['user_id', 'song_id', 'play_count', 'liked', 'rating'], model['user_behavior']),
        build_insert_batches('Song_Playlist', ['song_id', 'playlist_id'], model['song_playlist']),
    ]
    for batch_group in table_batches:
        for statement in batch_group:
            run_sql_script(statement)


def bootstrap_storage():
    global DATA_MODE, BOOTSTRAP_ERROR, SONG_MODEL, ARTIST_METRICS, PLAYLIST_METRICS, ERA_METRICS, RECOMMENDATION_MAP, TOP_SONG_IDS
    model = load_relational_model()
    SONG_MODEL = enrich_song_model(model['songs'], model['audio_features'], model['user_behavior'])
    ARTIST_METRICS = build_artist_metrics(SONG_MODEL)
    PLAYLIST_METRICS = build_playlist_metrics(SONG_MODEL)
    ERA_METRICS = build_era_metrics(SONG_MODEL)
    RECOMMENDATION_MAP = build_recommendation_map(SONG_MODEL)
    TOP_SONG_IDS = SONG_MODEL.sort_values(['popularity', 'title'], ascending=[False, True]).head(10)['song_id'].astype(int).tolist()

    try:
        rebuild_database(model)
        DATA_MODE = 'sql'
        BOOTSTRAP_ERROR = ''
        print('Jazz relational schema loaded into SQL Server successfully.')
    except Exception as error:
        try:
            rebuild_database_via_invoke_sqlcmd(model)
            DATA_MODE = 'sql'
            BOOTSTRAP_ERROR = ''
            print('Jazz relational schema loaded into SQL Server successfully via Invoke-Sqlcmd.')
        except Exception as fallback_error:
            DATA_MODE = 'csv-fallback'
            BOOTSTRAP_ERROR = str(fallback_error)
            print(f'SQL bootstrap failed, using in-memory relational model instead. Reason: {fallback_error}')


if os.environ.get('JAZZ_SKIP_BOOTSTRAP', '0') != '1':
    bootstrap_storage()


def top_song_payload(dataframe):
    top_rows = dataframe.sort_values(['popularity', 'title'], ascending=[False, True]).head(20)
    payload = []
    for index, row in enumerate(top_rows.itertuples(index=False), start=1):
        payload.append({
            'id': int(row.song_id), 'rank': index, 'title': row.title, 'artist': row.artist_name, 'album_name': row.album_name,
            'popularity': float(row.popularity), 'genre': row.genre, 'num_artists': int(row.num_artists), 'tempo': round(float(row.tempo), 1),
            'key': int(row.key), 'energy': round(float(row.energy), 2), 'danceability': round(float(row.danceability), 2), 'valence': round(float(row.valence), 2),
            'loudness': round(float(row.loudness), 2), 'play_count': int(row.play_count), 'avg_rating': round(float(row.avg_rating), 2), 'heat_score': round(float(row.heat_score), 1),
            'release_year': int(row.release_year), 'decade': row.decade, 'cover_art': row.cover_art, 'track_url': row.track_url, 'preview_url': row.preview_url,
            'summary': row.summary, 'recommendations': RECOMMENDATION_MAP.get(str(int(row.song_id)), []),
        })
    return payload


def artist_rank_payload(dataframe):
    top_rows = dataframe.sort_values(['heat_score', 'total_play_count'], ascending=[False, False]).head(10)
    payload = []
    for index, row in enumerate(top_rows.itertuples(index=False), start=1):
        payload.append({
            'id': row.artist_id, 'artist': row.artist_name, 'score': round(float(row.heat_score), 1), 'heat_score': round(float(row.heat_score), 1),
            'play_count': int(row.total_play_count), 'avg_rating': round(float(row.avg_rating), 2), 'avg_popularity': round(float(row.avg_popularity), 1), 'song_count': int(row.song_count), 'rank': index,
        })
    return payload


def dashboard_summary_payload():
    top_playlists = PLAYLIST_METRICS.head(5)
    top_songs = SONG_MODEL.sort_values(['popularity', 'title'], ascending=[False, True]).head(10)
    return {
        'playlistDistribution': [{'playlist': row.playlist_name, 'count': int(row.total_songs)} for row in top_playlists.itertuples(index=False)],
        'popularityTrend': [{'title': row.title, 'popularity': round(float(row.popularity), 1)} for row in top_songs.itertuples(index=False)],
        'overview': {
            'totalSongs': int(len(SONG_MODEL)), 'totalArtists': int(SONG_MODEL['artist_id'].nunique()), 'totalAlbums': int(SONG_MODEL['album_name'].nunique()),
            'averagePopularity': round(float(SONG_MODEL['popularity'].mean()), 1), 'averageDuration': round(float(SONG_MODEL['duration'].mean()), 2),
            'averageTempo': round(float(SONG_MODEL['tempo'].mean()), 1), 'averageEnergy': round(float(SONG_MODEL['energy'].mean()), 2),
        },
    }


def analysis_overview_payload():
    top_by_plays = ARTIST_METRICS.sort_values('total_play_count', ascending=False).head(10)
    top_by_rating = ARTIST_METRICS.sort_values('avg_rating', ascending=False).head(10)
    top_by_heat = ARTIST_METRICS.sort_values('heat_score', ascending=False).head(10)
    feature_rows = SONG_MODEL.sort_values('popularity', ascending=False).head(60)
    return {
        'schemaOverview': relational_schema_overview(),
        'artistPerformance': {
            'byHeatScore': [{'artist': row.artist_name, 'heat_score': round(float(row.heat_score), 1), 'play_count': int(row.total_play_count), 'avg_rating': round(float(row.avg_rating), 2), 'avg_popularity': round(float(row.avg_popularity), 1), 'song_count': int(row.song_count)} for row in top_by_heat.itertuples(index=False)],
            'byPlayCount': [{'artist': row.artist_name, 'play_count': int(row.total_play_count), 'song_count': int(row.song_count)} for row in top_by_plays.itertuples(index=False)],
            'byAverageRating': [{'artist': row.artist_name, 'avg_rating': round(float(row.avg_rating), 2), 'song_count': int(row.song_count)} for row in top_by_rating.itertuples(index=False)],
            'formula': 'Heat Score = 0.5 * normalized_play_count + 0.3 * popularity + 0.2 * normalized_rating',
        },
        'playlistEffectiveness': [{'playlist_name': row.playlist_name, 'total_songs': int(row.total_songs), 'avg_popularity': round(float(row.avg_popularity), 1), 'avg_heat': round(float(row.avg_heat), 1)} for row in PLAYLIST_METRICS.head(10).itertuples(index=False)],
        'audioFeatureAnalysis': {
            'tempoVsPopularity': [{'song_id': int(row.song_id), 'title': row.title, 'artist': row.artist_name, 'tempo': round(float(row.tempo), 1), 'popularity': round(float(row.popularity), 1)} for row in feature_rows.itertuples(index=False)],
            'energyVsDanceability': [{'song_id': int(row.song_id), 'title': row.title, 'artist': row.artist_name, 'energy': round(float(row.energy), 2), 'danceability': round(float(row.danceability), 2), 'popularity': round(float(row.popularity), 1)} for row in feature_rows.itertuples(index=False)],
            'valenceDistribution': valence_distribution(SONG_MODEL),
            'correlationMatrix': correlation_items(SONG_MODEL),
        },
        'eraAnalysis': [{'decade': row.decade, 'avg_tempo': round(float(row.avg_tempo), 1), 'avg_popularity': round(float(row.avg_popularity), 1), 'avg_energy': round(float(row.avg_energy), 2), 'avg_danceability': round(float(row.avg_danceability), 2), 'song_count': int(row.song_count), 'style_label': row.style_label} for row in ERA_METRICS.itertuples(index=False)],
        'collaborationAnalysis': [{'num_artists': int(num_artists), 'avg_popularity': round(float(group['popularity'].mean()), 1), 'avg_heat_score': round(float(group['heat_score'].mean()), 1), 'song_count': int(len(group))} for num_artists, group in SONG_MODEL.groupby('num_artists')],
        'recommendationMap': RECOMMENDATION_MAP,
    }


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'storage': DATA_MODE, 'songs': int(len(SONG_MODEL)), 'artists': int(SONG_MODEL['artist_id'].nunique()), 'albums': int(SONG_MODEL['album_name'].nunique()), 'schema_tables': len(relational_schema_overview()['tables']), 'message': BOOTSTRAP_ERROR})


@app.route('/top_songs')
def top_songs():
    return jsonify(top_song_payload(SONG_MODEL))


@app.route('/artist_rank')
def artist_rank():
    return jsonify(artist_rank_payload(ARTIST_METRICS))


@app.route('/dashboard_summary')
def dashboard_summary():
    return jsonify(dashboard_summary_payload())


@app.route('/analysis_overview')
def analysis_overview():
    return jsonify(analysis_overview_payload())


@app.route('/schema_overview')
def schema_overview():
    return jsonify(relational_schema_overview())


if __name__ == '__main__':
    app.run(host=APP_HOST, port=APP_PORT)




