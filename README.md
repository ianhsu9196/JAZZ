# Jazz Dashboard

這是一個以 Spotify 風格設計的爵士樂資料分析 Dashboard，整合 React 前端、Flask API、Chart.js 視覺化、正規化資料表設計與 SQL Server 匯入腳本，目標是把原始歌單資料整理成可以展示、分析與報告的完整專題作品。

## 專案畫面

![Jazz Dashboard Screenshot](frontend/public/dashboard-screenshot.png)

## 專案簡介

本專案以爵士樂資料集為核心，將原始 CSV 資料轉換成具有 relational schema 的資料模型，並透過互動式前端介面呈現歌曲、藝人、播放清單、音樂特徵與推薦結果。整體風格採深色 Spotify Dashboard 視覺語言，適合作為資料庫課程專題、資料分析展示與作品集專案。

## 專案目標

本專案希望回答以下問題：

1. 哪些爵士歌曲在資料集中最熱門？
2. 哪些藝人的整體表現最突出？
3. 哪些播放清單最容易聚集高熱門度歌曲？
4. 音樂特徵和熱門度之間有沒有明顯關係？
5. 不同年代的爵士歌曲是否有節奏與風格差異？
6. 合作人數增加是否會讓歌曲表現更好？
7. 能不能根據歌曲特徵做出簡單推薦系統？

## 功能總覽

### 1. 熱門歌曲
從 `http://localhost:3000/top_songs` 取得 Top 10 爵士歌曲，顯示：
- 歌名
- 歌手
- 專輯封面
- 流行度
- 合作人數
- 中文歌曲介紹
- 相似歌曲推薦

### 2. 藝人排行榜
從 `http://localhost:3000/artist_rank` 取得藝人排行，並以圖表呈現 Heat Score、播放數與排名結果。

### 3. 分析儀表板
分析頁整合：
- 藝人 Heat Score 分析
- 播放數與平均評分比較
- Tempo 與 Popularity 散點圖
- Energy 與 Danceability 散點圖
- Valence 情緒分布圓餅圖
- Correlation Matrix
- 年代分析
- 合作分析
- Relational schema 展示
- 推薦系統說明

## 資料庫設計

本專案將資料整理成以下正規化結構：

- `Artists(artist_id, name, country)`
- `Albums(album_id, title, release_year)`
- `Songs(song_id, title, artist_id, tempo, musical_key, genre, duration, popularity)`
- `Song_Album(song_id, album_id)`
- `Audio_Features(song_id, energy, danceability, valence, loudness)`
- `User_Behavior(user_id, song_id, play_count, liked, rating)`
- `Playlists(playlist_id, playlist_name, owner_id, owner_name, total_followers)`
- `Song_Playlist(song_id, playlist_id)`

這樣的設計可以支援：
- JOIN 查詢
- 藝人與播放清單聚合分析
- 音樂特徵關聯分析
- 推薦系統延伸

## 分析方法

### 1. 藝人 Heat Score
以播放數、熱門度與評分組成綜合指標：

```text
Heat Score = 0.5 * normalized_play_count + 0.3 * popularity + 0.2 * normalized_rating
```

### 2. 藝人表現分析
從三個面向比較藝人：
- Heat Score
- 播放數
- 平均評分

### 3. 播放清單效果分析
分析不同播放清單的：
- 歌曲數量
- 平均熱門度
- 平均 Heat Score

### 4. 音樂特徵分析
分析以下特徵和歌曲表現的關係：
- tempo 與 popularity
- energy 與 danceability
- valence 分布
- correlation matrix

### 5. 年代分析
依 `release_year` 比較不同年代的：
- 平均 tempo
- 平均熱門度
- 平均 energy
- 平均 danceability

### 6. 合作分析
以 `num_artists` 分析多人合作與歌曲表現之間的關係。

### 7. 推薦系統
以 cosine similarity 比對：
- tempo
- energy
- danceability
- valence
- popularity

並在歌曲詳細資訊中提供 `You may also like` 推薦清單。

## 目前分析結果摘要

### 熱門歌曲
目前前幾首代表歌曲包含：
- `Don't Know Why`
- `Come Away With Me`
- `By Your Side`
- `What A Wonderful World`
- `It Runs Through Me`

### 藝人 Heat Score
目前 Heat Score 表現較高的藝人包含：
- `Sade`
- `Tom Misch`
- `Erick the Architect`

### 播放清單效果
目前資料中表現較好的播放清單包含：
- `Easy Jazz`
- `Jazz Vibes`
- `Jazz for Sleep`
- `Jazz Rap`

### 情緒分布
資料中的歌曲主要集中於：
- `低情緒`
- `中性情緒`

代表資料集中的爵士歌曲多偏抒情、柔和或中度情緒張力。

### 合作分析
目前合作分析結果顯示：
- `1 人合作` 的歌曲數量最多
- `2 人合作` 的平均熱門度略高於單人歌曲
- 合作人數增加不一定會帶來更高表現

## 使用技術

### 前端
- React
- Vite
- Chart.js
- Utility CSS

### 後端
- Flask
- Flask-CORS
- pandas
- numpy
- pyodbc

### 資料來源
- `Jazz_playlist_tracks.csv`
- `Jazz_playlist_tracks_data.csv`
- `Jazz_playlist_data.csv`

## 專案結構

```text
frontend/
  public/
  src/
    assets/
    components/
    hooks/
    utils/
SQL.py
generate_jazzdb_sql.py
JazzDB_schema.sql
JazzDB_seed.sql
JazzDB_full_import.sql
README.md
requirements.txt
start-jazz-dashboard.ps1
start-jazz-dashboard.cmd
```

## 執行方式

### 啟動後端
```powershell
py -3 SQL.py
```

### 啟動前端
```powershell
cd frontend
npm install
npm run dev
```

### 一鍵啟動
```powershell
powershell -ExecutionPolicy Bypass -File .\start-jazz-dashboard.ps1
```

## SQL Server 匯入方式

如果本機 `pyodbc` 或 ODBC 驅動無法穩定把資料直接寫入 SQL Server，可以改用 SSMS 手動匯入。

### 已提供腳本
- [JazzDB_schema.sql](C:\Users\ianhs\Desktop\資料庫\JazzDB_schema.sql)
- [JazzDB_seed.sql](C:\Users\ianhs\Desktop\資料庫\JazzDB_seed.sql)
- [JazzDB_full_import.sql](C:\Users\ianhs\Desktop\資料庫\JazzDB_full_import.sql)

### 在 SSMS 匯入
1. 連到 `127.0.0.1,1433`
2. 選擇資料庫 `JazzDB`
3. 先執行 `JazzDB_schema.sql`
4. 再執行 `JazzDB_seed.sql`
5. 或直接執行 `JazzDB_full_import.sql`

### 重新產生腳本
```powershell
py -3 generate_jazzdb_sql.py
```

## 目前狀態說明

- 前端頁面、圖表與分析功能可正常使用
- SQL Server 的帳密登入已可在 SSMS 成功驗證
- 由於本機 `pyodbc` / ODBC client 仍存在 SSL 與 pre-login handshake 問題，API 可能仍以 `csv-fallback` 模式啟動
- 即使如此，資料庫匯入腳本已完整提供，不影響資料庫作業展示與成果說明

## 專案價值

這個專案同時具備：
- 前端介面設計與互動展示
- 音樂資料分析與圖表視覺化
- relational database 設計
- API 與前後端整合
- 適合作為資料庫課程專題、作品集與展示專案

## 未來可擴充方向

- 增加更多音樂特徵分析與篩選條件
- 加入匯出報告功能
- 進一步修正 `pyodbc` 連線問題，讓 API 直接使用 SQL 模式
- 部署前端與 API 到雲端環境
