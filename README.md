# Jazz Dashboard

A Spotify-style Jazz analytics dashboard built with React, Vite, Tailwind-style utility classes, Chart.js, Flask, and SQL Server.

## Project Overview

This project visualizes jazz playlist data and turns raw song records into an interactive dashboard for exploration and reporting.

Main features:
- Top 10 jazz songs from `http://localhost:3000/top_songs`
- Artist ranking from `http://localhost:3000/artist_rank`
- Chart.js based visual analytics
- Spotify-inspired dark UI with interactive cards and hover effects
- Bonus analysis panels for report-ready database insights
- AI-style song descriptions generated from song metadata and reference summaries

## Tech Stack

### Frontend
- React
- Vite
- Chart.js
- CSS utility styling

### Backend
- Flask
- Flask-CORS
- pandas
- pyodbc
- SQL Server

## Project Structure

```text
frontend/
  src/
    components/
    hooks/
    utils/
  package.json
SQL.py
requirements.txt
start-jazz-dashboard.ps1
start-jazz-dashboard.cmd
```

## Data Sources

- Local API endpoints served by `SQL.py`
- Jazz playlist CSV files in the project root
- SQL Server database `JazzDB`
- Reference summaries based on Wikipedia topics for top songs

## Analyses Included

### 1. Top Songs Analysis
The dashboard highlights the 10 most popular jazz songs in the dataset and shows:
- song title
- artist
- album cover
- popularity
- artist count / collaboration size
- AI-generated song description

Current Top 10 songs include:
1. Don't Know Why
2. Come Away With Me
3. By Your Side
4. What A Wonderful World
5. It Runs Through Me
6. My Baby Just Cares for Me
7. The Girl From Ipanema
8. Cheek To Cheek
9. Dream A Little Dream Of Me
10. Solitude

### 2. Artist Ranking Analysis
This analysis ranks artists by total popularity score.

SQL idea:
```sql
SELECT a.name AS artist, SUM(s.popularity) AS score
FROM Artist a
JOIN Song s ON a.aid = s.aid
GROUP BY a.name
ORDER BY score DESC;
```

Current results:
- Bill Charlap Trio: 777 total popularity
- Hara Noda: 744 total popularity
- Norah Jones: 723 total popularity

Interpretation:
Bill Charlap Trio has the strongest overall influence in the current dataset when influence is measured by total popularity accumulated across songs.

### 3. Artist Influence Analysis
This analysis combines:
- song count
- average popularity
- total popularity

SQL idea:
```sql
SELECT a.name, COUNT(*) AS song_count, AVG(s.popularity) AS avg_popularity, SUM(s.popularity) AS total_popularity
FROM Artist a
JOIN Song s ON a.aid = s.aid
GROUP BY a.name
ORDER BY total_popularity DESC;
```

Current findings:
- Bill Charlap Trio: 16 songs, average popularity 48.0, total popularity 777
- Hara Noda: 14 songs, average popularity 53.0, total popularity 744
- Norah Jones: 13 songs, average popularity 55.0, total popularity 723

Interpretation:
This shows that impact is not only about average popularity. Some artists rank high because they appear consistently across many songs.

### 4. Playlist Effectiveness Analysis
This analysis compares playlists by song count and average popularity.

SQL idea:
```sql
SELECT playlist_name, COUNT(*) AS total_songs, AVG(popularity) AS avg_popularity
FROM Song
GROUP BY playlist_name
ORDER BY avg_popularity DESC;
```

Current findings:
- Jazz in the Background: 370 songs, average popularity 50
- Jazz Vibes: 300 songs, average popularity 50
- Jazz Classics: 250 songs, average popularity 50
- Jazz for Study: 200 songs, average popularity 50
- Jazz for Sleep: 159 songs, average popularity 50

Interpretation:
The strongest playlists are not only popular but also large, suggesting that some playlists consistently collect well-performing jazz tracks.

### 5. Popularity Distribution Analysis
This analysis groups songs into popularity levels.

SQL idea:
```sql
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
  END;
```

Current findings:
- Medium: 141 songs
- Low: 3062 songs
- High: 0 songs in the current output

Interpretation:
Most songs in this dataset are long-tail jazz tracks rather than highly commercial hits.

### 6. Collaboration Analysis
This analysis checks whether more collaborators are associated with higher popularity.

SQL idea:
```sql
SELECT num_artists, AVG(popularity) AS avg_popularity, COUNT(*) AS song_count
FROM Song
GROUP BY num_artists
ORDER BY num_artists;
```

Current findings:
- 1 artist: average popularity 47.0, 2570 songs
- 2 artists: average popularity 47.0, 366 songs
- 3 artists: average popularity 44.0, 165 songs
- 4 artists: average popularity 41.0, 77 songs

Interpretation:
Collaboration does not automatically increase popularity. In this dataset, one-artist and two-artist songs perform similarly, while larger collaborations trend downward.

### 7. Overall Dataset Summary
Current dataset summary:
- Total songs: 3203
- Average popularity: 46.0
- Average duration: 4.05 minutes

Top playlist counts:
- Jazz in the Background: 370
- Jazz Vibes: 300
- Jazz Classics: 250
- Chilled Jazz: 247
- Jazz for Study: 200

## How to Run

### Backend
```powershell
py -3 SQL.py
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

### One-click start
```powershell
powershell -ExecutionPolicy Bypass -File .\start-jazz-dashboard.ps1
```

## What This Project Demonstrates

This dashboard is not only a frontend visualization project. It also demonstrates:
- database querying and aggregation
- API design for analytics endpoints
- SQL-based reporting logic
- interactive dashboard UI design
- transforming raw data into interpretable insights

## Future Improvements

- Convert AI song descriptions to fully polished Chinese report text
- Add filters by playlist, artist, and popularity band
- Add export to PDF / presentation summaries
- Connect to a hosted database and deployed frontend
