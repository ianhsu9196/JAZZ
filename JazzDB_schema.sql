USE JazzDB;
GO

IF OBJECT_ID('Song_Playlist', 'U') IS NOT NULL DROP TABLE Song_Playlist;
IF OBJECT_ID('User_Behavior', 'U') IS NOT NULL DROP TABLE User_Behavior;
IF OBJECT_ID('Audio_Features', 'U') IS NOT NULL DROP TABLE Audio_Features;
IF OBJECT_ID('Song_Album', 'U') IS NOT NULL DROP TABLE Song_Album;
IF OBJECT_ID('Songs', 'U') IS NOT NULL DROP TABLE Songs;
IF OBJECT_ID('Playlists', 'U') IS NOT NULL DROP TABLE Playlists;
IF OBJECT_ID('Albums', 'U') IS NOT NULL DROP TABLE Albums;
IF OBJECT_ID('Artists', 'U') IS NOT NULL DROP TABLE Artists;
GO

CREATE TABLE Artists (artist_id NVARCHAR(100) PRIMARY KEY, name NVARCHAR(255), country NVARCHAR(100));
CREATE TABLE Albums (album_id NVARCHAR(100) PRIMARY KEY, title NVARCHAR(255), release_year INT);
CREATE TABLE Playlists (playlist_id NVARCHAR(100) PRIMARY KEY, playlist_name NVARCHAR(255), owner_id NVARCHAR(100), owner_name NVARCHAR(255), total_followers FLOAT);
CREATE TABLE Songs (song_id INT PRIMARY KEY, title NVARCHAR(255), artist_id NVARCHAR(100), tempo FLOAT, [key] INT, genre NVARCHAR(100), duration FLOAT, popularity FLOAT, release_year INT, decade NVARCHAR(20), FOREIGN KEY (artist_id) REFERENCES Artists(artist_id));
CREATE TABLE Song_Album (song_id INT, album_id NVARCHAR(100), PRIMARY KEY (song_id, album_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id), FOREIGN KEY (album_id) REFERENCES Albums(album_id));
CREATE TABLE Audio_Features (song_id INT PRIMARY KEY, energy FLOAT, danceability FLOAT, valence FLOAT, loudness FLOAT, FOREIGN KEY (song_id) REFERENCES Songs(song_id));
CREATE TABLE User_Behavior (user_id INT, song_id INT, play_count INT, liked BIT, rating FLOAT, PRIMARY KEY (user_id, song_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id));
CREATE TABLE Song_Playlist (song_id INT, playlist_id NVARCHAR(100), PRIMARY KEY (song_id, playlist_id), FOREIGN KEY (song_id) REFERENCES Songs(song_id), FOREIGN KEY (playlist_id) REFERENCES Playlists(playlist_id));
GO
