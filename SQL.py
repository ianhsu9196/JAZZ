import os
import json
from contextlib import closing
from functools import lru_cache
from urllib.parse import quote
from urllib.request import urlopen

import pandas as pd
import pyodbc
from flask import Flask, jsonify
from flask_cors import CORS

APP_HOST = os.getenv('JAZZ_API_HOST', '0.0.0.0')
APP_PORT = int(os.getenv('JAZZ_API_PORT', '3000'))
DB_CONNECTION_STRING = os.getenv(
    'JAZZ_DB_CONNECTION',
    'DRIVER={SQL Server};SERVER=LAPTOP-66QDHQO7\\SQLEXPRESS;DATABASE=JazzDB;Trusted_Connection=yes;',
)

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': '*'}})

DATA_MODE = 'csv-fallback'
BOOTSTRAP_ERROR = ''
ITUNES_SEARCH_API = 'https://itunes.apple.com/search'
FALLBACK_COVER = 'https://placehold.co/600x600/111111/1DB954?text=Jazz+Cover'
WIKIPEDIA_SEARCH_API = 'https://{language}.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&utf8=1&format=json&srlimit=1'
WIKIPEDIA_SUMMARY_API = 'https://{language}.wikipedia.org/api/rest_v1/page/summary/{title}'
MANUAL_WIKIPEDIA_SUMMARIES = {
    "Don't Know Why": "The song was written by Jesse Harris and became widely known through Norah Jones's 2002 debut album Come Away with Me. It won major Grammy Awards and is often treated as one of her signature recordings.",
    "Come Away With Me": "This is a gentle ballad by Norah Jones from her 2002 debut album Come Away with Me. It helped define her early sound and became one of the standout tracks associated with the album.",
    "By Your Side": "By Your Side is a 2000 single by Sade from the album Lovers Rock. It is often remembered as one of the group's warmest and most emotionally direct songs.",
    "What A Wonderful World": "Louis Armstrong recorded What a Wonderful World in 1967, and the song became one of his most iconic recordings. Its lyrics celebrate beauty, kindness, and everyday human warmth.",
    "It Runs Through Me": "It Runs Through Me appears on Tom Misch's album Geography and features De La Soul. The track blends jazz, soul, and hip-hop influences in a relaxed modern groove.",
    "My Baby Just Cares for Me - 2013 Remastered Version": "My Baby Just Cares for Me is a classic song later made especially famous by Nina Simone's version. Her recording gained renewed attention decades later and remains one of her best-known performances.",
    "The Girl From Ipanema": "The Girl from Ipanema is one of the best-known bossa nova songs in the world. The recording associated with Stan Getz, Joao Gilberto, and Astrud Gilberto helped bring Brazilian music to a global audience.",
    "Cheek To Cheek": "Cheek to Cheek is a classic American standard written by Irving Berlin for the film Top Hat. It has remained popular through many jazz and pop interpretations.",
    "Dream A Little Dream Of Me - Single Version": "Dream a Little Dream of Me is a long-lasting standard from the 1930s that has been recorded by many artists. It remains known for its dreamy melody and intimate mood.",
    "Solitude": "Solitude, also known as (In My) Solitude, is a Duke Ellington composition that later became a jazz standard. Billie Holiday's interpretations are often linked with the song's melancholic atmosphere.",
}

def get_connection():
    return pyodbc.connect(DB_CONNECTION_STRING)


@lru_cache(maxsize=256)
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


def _extract_song_summary(summary_text):
    summary = (summary_text or '').replace('\n', ' ').strip()
    if not summary:
        return ''
    return summary


def _search_wikipedia_page(language, query):
    url = WIKIPEDIA_SEARCH_API.format(language=language, query=quote(query))

    with urlopen(url, timeout=8) as response:
        payload = json.loads(response.read().decode('utf-8'))

    search_results = payload.get('query', {}).get('search', [])
    if not search_results:
        return ''

    return search_results[0].get('title', '')


def _fetch_wikipedia_summary(language, page_title):
    if not page_title:
        return ''

    url = WIKIPEDIA_SUMMARY_API.format(language=language, title=quote(page_title.replace(' ', '_')))

    with urlopen(url, timeout=8) as response:
        payload = json.loads(response.read().decode('utf-8'))

    return payload.get('extract', '')


@lru_cache(maxsize=256)
def lookup_song_wikipedia_summary(title, artist):
    manual_summary = MANUAL_WIKIPEDIA_SUMMARIES.get(title)
    if manual_summary:
        return manual_summary

    search_queries = [
        f'{title} {artist} song',
        f'{title} song',
        f'{title} {artist}',
    ]

    for language in ('zh', 'en'):
        for query in search_queries:
            try:
                page_title = _search_wikipedia_page(language, query)
                summary = _fetch_wikipedia_summary(language, page_title)
                extracted_summary = _extract_song_summary(summary)
                if extracted_summary:
                    return extracted_summary
            except Exception:
                continue

    return f'Based on the available metadata, {title} is a jazz track by {artist} with a distinctive mood and strong musical identity.'


def generate_song_ai_summary(title, artist, popularity, num_artists, album_name, wikipedia_summary):
    popularity_level = 'high visibility' if popularity >= 70 else 'steady momentum' if popularity >= 60 else 'a distinctive profile'
    collaboration_text = (
        'The performance feels more focused because it is carried by a single main voice.'
        if num_artists <= 1
        else f'The song brings together {num_artists} credited artists, which gives the arrangement a more layered character.'
    )

    base_summary = (wikipedia_summary or '').strip()
    if not base_summary:
        base_summary = f'{title} stands out as a memorable jazz recording by {artist}.'

    return (
        f'AI 介紹：〈{title}〉收錄於《{album_name}》，由 {artist} 演唱，'
        f'在目前榜單中屬於 {popularity_level} 的作品。'
        f'{collaboration_text} {base_summary}'
    )


def load_source_data():
    tracks = pd.read_csv('Jazz_playlist_tracks.csv')
    tracks.columns = tracks.columns.str.lower()
    tracks = tracks.rename(columns={'track_name': 'name', 'artists': 'artist_name'})

    selected_columns = [
        'name',
        'popularity',
        'duration_ms',
        'artist_name',
        'playlist_name',
        'num_artists',
    ]
    available_columns = [column for column in selected_columns if column in tracks.columns]
    cleaned = tracks[available_columns].copy()

    cleaned['duration_ms'] = pd.to_numeric(cleaned['duration_ms'], errors='coerce')
    cleaned['popularity'] = pd.to_numeric(cleaned['popularity'], errors='coerce')
    cleaned['num_artists'] = pd.to_numeric(cleaned.get('num_artists', 1), errors='coerce').fillna(1)
    cleaned['playlist_name'] = cleaned['playlist_name'].fillna('Unknown Playlist').astype(str)
    cleaned['playlist_name'] = cleaned['playlist_name'].str.strip()

    cleaned = cleaned.dropna(subset=['name', 'artist_name', 'duration_ms', 'popularity'])
    cleaned['duration_mins'] = cleaned['duration_ms'] / 60000
    cleaned['genre'] = 'Jazz'
    cleaned['artist_name'] = cleaned['artist_name'].astype(str).str.strip()
    cleaned['name'] = cleaned['name'].astype(str).str.strip()
    cleaned['num_artists'] = cleaned['num_artists'].astype(int).clip(lower=1)

    return cleaned.reset_index(drop=True)


SOURCE_DATA = load_source_data()


def rebuild_database(dataframe):
    with closing(get_connection()) as connection:
        cursor = connection.cursor()
        cursor.execute(
            '''
            IF OBJECT_ID('Song', 'U') IS NOT NULL DROP TABLE Song;
            IF OBJECT_ID('Artist', 'U') IS NOT NULL DROP TABLE Artist;
            '''
        )
        connection.commit()

        cursor.execute(
            '''
            CREATE TABLE Artist (
                aid INT IDENTITY PRIMARY KEY,
                name NVARCHAR(200)
            );
            '''
        )
        cursor.execute(
            '''
            CREATE TABLE Song (
                sid INT IDENTITY PRIMARY KEY,
                title NVARCHAR(200),
                aid INT,
                popularity INT,
                duration FLOAT,
                playlist_name NVARCHAR(200),
                genre NVARCHAR(100),
                num_artists INT,
                FOREIGN KEY (aid) REFERENCES Artist(aid)
            );
            '''
        )
        connection.commit()

        artist_map = {}
        for row in dataframe.itertuples(index=False):
            if row.artist_name not in artist_map:
                cursor.execute('INSERT INTO Artist(name) OUTPUT INSERTED.aid VALUES (?)', row.artist_name)
                artist_map[row.artist_name] = cursor.fetchone()[0]

            cursor.execute(
                '''
                INSERT INTO Song(title, aid, popularity, duration, playlist_name, genre, num_artists)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''',
                row.name,
                artist_map[row.artist_name],
                int(row.popularity),
                float(row.duration_mins),
                row.playlist_name or 'Unknown Playlist',
                row.genre,
                int(row.num_artists),
            )

        connection.commit()


def bootstrap_storage():
    global DATA_MODE, BOOTSTRAP_ERROR

    try:
        rebuild_database(SOURCE_DATA)
        DATA_MODE = 'sql'
        BOOTSTRAP_ERROR = ''
        print('Jazz data loaded into SQL Server successfully.')
    except Exception as error:  # pragma: no cover - startup diagnostics only
        DATA_MODE = 'csv-fallback'
        BOOTSTRAP_ERROR = str(error)
        print(f'SQL bootstrap failed, using CSV fallback instead. Reason: {error}')


bootstrap_storage()


def top_songs_from_dataframe():
    songs = (
        SOURCE_DATA.sort_values(['popularity', 'name'], ascending=[False, True])
        .head(10)
        .reset_index(drop=True)
    )
    payload = []
    for index, row in songs.iterrows():
        metadata = lookup_song_metadata(row['name'], row['artist_name'])
        wikipedia_summary = lookup_song_wikipedia_summary(row['name'], row['artist_name'])
        payload.append(
            {
                'id': int(index + 1),
                'title': row['name'],
                'artist': row['artist_name'],
                'popularity': int(row['popularity']),
                'genre': row['genre'],
                'num_artists': int(row['num_artists']),
                'summary': generate_song_ai_summary(
                    row['name'],
                    row['artist_name'],
                    int(row['popularity']),
                    int(row['num_artists']),
                    metadata.get('album_name', 'Jazz Collection'),
                    wikipedia_summary,
                ),
                **metadata,
            }
        )
    return payload


def artist_rank_from_dataframe():
    ranking = (
        SOURCE_DATA.groupby('artist_name', as_index=False)['popularity']
        .sum()
        .rename(columns={'artist_name': 'artist', 'popularity': 'score'})
        .sort_values(['score', 'artist'], ascending=[False, True])
        .head(10)
        .reset_index(drop=True)
    )
    return [
        {'id': int(index + 1), 'artist': row['artist'], 'score': int(row['score'])}
        for index, row in ranking.iterrows()
    ]


def dashboard_summary_from_dataframe():
    playlist_distribution = (
        SOURCE_DATA.groupby('playlist_name', as_index=False)
        .size()
        .rename(columns={'size': 'count'})
        .sort_values(['count', 'playlist_name'], ascending=[False, True])
        .head(5)
        .reset_index(drop=True)
    )

    popularity_trend = (
        SOURCE_DATA[['name', 'popularity']]
        .sort_values(['popularity', 'name'], ascending=[False, True])
        .head(10)
        .reset_index(drop=True)
    )

    return {
        'playlistDistribution': [
            {'playlist': row['playlist_name'], 'count': int(row['count'])}
            for _, row in playlist_distribution.iterrows()
        ],
        'popularityTrend': [
            {'title': row['name'], 'popularity': int(row['popularity'])}
            for _, row in popularity_trend.iterrows()
        ],
        'overview': {
            'totalSongs': int(len(SOURCE_DATA)),
            'averagePopularity': round(float(SOURCE_DATA['popularity'].mean()), 1),
            'averageDuration': round(float(SOURCE_DATA['duration_mins'].mean()), 2),
        },
    }


def artist_influence_from_dataframe():
    artist_influence = (
        SOURCE_DATA.groupby('artist_name', as_index=False)
        .agg(song_count=('name', 'count'), avg_popularity=('popularity', 'mean'), total_popularity=('popularity', 'sum'))
        .rename(columns={'artist_name': 'artist'})
        .sort_values(['total_popularity', 'avg_popularity'], ascending=[False, False])
        .head(10)
        .reset_index(drop=True)
    )

    return [
        {
            'artist': row['artist'],
            'song_count': int(row['song_count']),
            'avg_popularity': round(float(row['avg_popularity']), 1),
            'total_popularity': int(row['total_popularity']),
        }
        for _, row in artist_influence.iterrows()
    ]


def playlist_effectiveness_from_dataframe():
    playlist_effectiveness = (
        SOURCE_DATA.groupby('playlist_name', as_index=False)
        .agg(total_songs=('name', 'count'), avg_popularity=('popularity', 'mean'))
        .sort_values(['avg_popularity', 'total_songs'], ascending=[False, False])
        .head(10)
        .reset_index(drop=True)
    )

    return [
        {
            'playlist_name': row['playlist_name'],
            'total_songs': int(row['total_songs']),
            'avg_popularity': round(float(row['avg_popularity']), 1),
        }
        for _, row in playlist_effectiveness.iterrows()
    ]


def popularity_distribution_from_dataframe():
    distribution = SOURCE_DATA.copy()
    distribution['popularity_level'] = pd.cut(
        distribution['popularity'],
        bins=[-1, 59, 79, float('inf')],
        labels=['Low', 'Medium', 'High'],
    )
    grouped = (
        distribution.groupby('popularity_level', observed=False, as_index=False)
        .size()
        .rename(columns={'size': 'count'})
    )

    order = {'High': 0, 'Medium': 1, 'Low': 2}
    grouped['sort_order'] = grouped['popularity_level'].map(order)
    grouped = grouped.sort_values('sort_order').drop(columns='sort_order')

    return [
        {'popularity_level': row['popularity_level'], 'count': int(row['count'])}
        for _, row in grouped.iterrows()
    ]


def collaboration_analysis_from_dataframe():
    collaboration = (
        SOURCE_DATA.groupby('num_artists', as_index=False)
        .agg(avg_popularity=('popularity', 'mean'), song_count=('name', 'count'))
        .sort_values('num_artists', ascending=True)
        .reset_index(drop=True)
    )

    return [
        {
            'num_artists': int(row['num_artists']),
            'avg_popularity': round(float(row['avg_popularity']), 1),
            'song_count': int(row['song_count']),
        }
        for _, row in collaboration.iterrows()
    ]


@app.route('/health')
def health():
    if DATA_MODE == 'sql':
        try:
            with closing(get_connection()) as connection:
                cursor = connection.cursor()
                cursor.execute('SELECT COUNT(*) FROM Song')
                song_count = cursor.fetchone()[0]
                cursor.execute('SELECT COUNT(*) FROM Artist')
                artist_count = cursor.fetchone()[0]

            return jsonify(
                {
                    'status': 'ok',
                    'storage': 'sql',
                    'songs': song_count,
                    'artists': artist_count,
                }
            )
        except Exception as error:  # pragma: no cover - runtime diagnostics only
            return jsonify({'status': 'error', 'storage': 'sql', 'message': str(error)}), 500

    artist_count = SOURCE_DATA['artist_name'].nunique()
    return jsonify(
        {
            'status': 'ok',
            'storage': 'csv-fallback',
            'songs': int(len(SOURCE_DATA)),
            'artists': int(artist_count),
            'message': BOOTSTRAP_ERROR,
        }
    )


@app.route('/top_songs')
def top_songs():
    if DATA_MODE == 'sql':
        with closing(get_connection()) as connection:
            cursor = connection.cursor()
            cursor.execute(
                '''
                SELECT TOP 10 s.sid, s.title, a.name AS artist, s.popularity, s.genre, s.num_artists
                FROM Song s
                JOIN Artist a ON a.aid = s.aid
                ORDER BY s.popularity DESC, s.title ASC
                '''
            )
            rows = cursor.fetchall()

        payload = []
        for row in rows:
            metadata = lookup_song_metadata(row.title, row.artist)
            wikipedia_summary = lookup_song_wikipedia_summary(row.title, row.artist)
            payload.append(
                {
                    'id': row.sid,
                    'title': row.title,
                    'artist': row.artist,
                    'popularity': row.popularity,
                    'genre': row.genre,
                    'num_artists': row.num_artists,
                    'summary': generate_song_ai_summary(
                        row.title,
                        row.artist,
                        int(row.popularity),
                        int(row.num_artists),
                        metadata.get('album_name', 'Jazz Collection'),
                        wikipedia_summary,
                    ),
                    **metadata,
                }
            )

        return jsonify(payload)

    return jsonify(top_songs_from_dataframe())


@app.route('/artist_rank')
def artist_rank():
    if DATA_MODE == 'sql':
        with closing(get_connection()) as connection:
            cursor = connection.cursor()
            cursor.execute(
                '''
                SELECT TOP 10 a.aid, a.name AS artist, SUM(s.popularity) AS score
                FROM Artist a
                JOIN Song s ON a.aid = s.aid
                GROUP BY a.aid, a.name
                ORDER BY score DESC, a.name ASC
                '''
            )
            rows = cursor.fetchall()

        return jsonify([{'id': row.aid, 'artist': row.artist, 'score': row.score} for row in rows])

    return jsonify(artist_rank_from_dataframe())


@app.route('/dashboard_summary')
def dashboard_summary():
    if DATA_MODE == 'sql':
        with closing(get_connection()) as connection:
            cursor = connection.cursor()

            cursor.execute(
                '''
                SELECT TOP 5 playlist_name, COUNT(*) AS track_count
                FROM Song
                GROUP BY playlist_name
                ORDER BY track_count DESC, playlist_name ASC
                '''
            )
            playlist_rows = cursor.fetchall()

            cursor.execute(
                '''
                SELECT TOP 10 title, popularity
                FROM Song
                ORDER BY popularity DESC, title ASC
                '''
            )
            top_song_rows = cursor.fetchall()

            cursor.execute(
                '''
                SELECT
                    COUNT(*) AS total_songs,
                    CAST(AVG(popularity) AS FLOAT) AS average_popularity,
                    CAST(AVG(duration) AS FLOAT) AS average_duration
                FROM Song
                '''
            )
            aggregate_row = cursor.fetchone()

        return jsonify(
            {
                'playlistDistribution': [
                    {'playlist': row.playlist_name, 'count': row.track_count} for row in playlist_rows
                ],
                'popularityTrend': [
                    {'title': row.title, 'popularity': row.popularity} for row in top_song_rows
                ],
                'overview': {
                    'totalSongs': aggregate_row.total_songs or 0,
                    'averagePopularity': round(aggregate_row.average_popularity or 0, 1),
                    'averageDuration': round(aggregate_row.average_duration or 0, 2),
                },
            }
        )

    return jsonify(dashboard_summary_from_dataframe())


@app.route('/analysis_overview')
def analysis_overview():
    if DATA_MODE == 'sql':
        with closing(get_connection()) as connection:
            cursor = connection.cursor()

            cursor.execute(
                '''
                SELECT TOP 10
                    a.name AS artist,
                    COUNT(*) AS song_count,
                    CAST(AVG(s.popularity) AS FLOAT) AS avg_popularity,
                    SUM(s.popularity) AS total_popularity
                FROM Artist a
                JOIN Song s ON a.aid = s.aid
                GROUP BY a.name
                ORDER BY total_popularity DESC, avg_popularity DESC
                '''
            )
            influence_rows = cursor.fetchall()

            cursor.execute(
                '''
                SELECT TOP 10
                    playlist_name,
                    COUNT(*) AS total_songs,
                    CAST(AVG(popularity) AS FLOAT) AS avg_popularity
                FROM Song
                GROUP BY playlist_name
                ORDER BY avg_popularity DESC, total_songs DESC
                '''
            )
            playlist_rows = cursor.fetchall()

            cursor.execute(
                '''
                SELECT
                    CASE
                        WHEN popularity >= 80 THEN 'High'
                        WHEN popularity >= 60 THEN 'Medium'
                        ELSE 'Low'
                    END AS popularity_level,
                    COUNT(*) AS count
                FROM Song
                GROUP BY
                    CASE
                        WHEN popularity >= 80 THEN 'High'
                        WHEN popularity >= 60 THEN 'Medium'
                        ELSE 'Low'
                    END
                ORDER BY CASE
                    WHEN CASE
                        WHEN popularity >= 80 THEN 'High'
                        WHEN popularity >= 60 THEN 'Medium'
                        ELSE 'Low'
                    END = 'High' THEN 1
                    WHEN CASE
                        WHEN popularity >= 80 THEN 'High'
                        WHEN popularity >= 60 THEN 'Medium'
                        ELSE 'Low'
                    END = 'Medium' THEN 2
                    ELSE 3
                END
                '''
            )
            distribution_rows = cursor.fetchall()

            cursor.execute(
                '''
                SELECT
                    num_artists,
                    CAST(AVG(popularity) AS FLOAT) AS avg_popularity,
                    COUNT(*) AS song_count
                FROM Song
                GROUP BY num_artists
                ORDER BY num_artists
                '''
            )
            collaboration_rows = cursor.fetchall()

        return jsonify(
            {
                'artistInfluence': [
                    {
                        'artist': row.artist,
                        'song_count': row.song_count,
                        'avg_popularity': round(row.avg_popularity, 1),
                        'total_popularity': row.total_popularity,
                    }
                    for row in influence_rows
                ],
                'playlistEffectiveness': [
                    {
                        'playlist_name': row.playlist_name,
                        'total_songs': row.total_songs,
                        'avg_popularity': round(row.avg_popularity, 1),
                    }
                    for row in playlist_rows
                ],
                'popularityDistribution': [
                    {'popularity_level': row.popularity_level, 'count': row.count}
                    for row in distribution_rows
                ],
                'collaborationAnalysis': [
                    {
                        'num_artists': row.num_artists,
                        'avg_popularity': round(row.avg_popularity, 1),
                        'song_count': row.song_count,
                    }
                    for row in collaboration_rows
                ],
            }
        )

    return jsonify(
        {
            'artistInfluence': artist_influence_from_dataframe(),
            'playlistEffectiveness': playlist_effectiveness_from_dataframe(),
            'popularityDistribution': popularity_distribution_from_dataframe(),
            'collaborationAnalysis': collaboration_analysis_from_dataframe(),
        }
    )


if __name__ == '__main__':
    app.run(host=APP_HOST, port=APP_PORT)
