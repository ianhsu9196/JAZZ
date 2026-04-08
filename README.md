# Jazz Dashboard

Spotify 風格的爵士樂資料分析 Dashboard，使用 React、Vite、Chart.js、Flask 與 SQL Server 建立，將爵士歌單資料轉成可以互動瀏覽與報告展示的分析頁面。

## 專案畫面

![Jazz Dashboard Screenshot](frontend/public/dashboard-screenshot.png)

## 專案簡介

這個專案的目標是把爵士樂歌單資料做成一個具有現代感的互動式 Dashboard，讓使用者可以同時查看：
- Top 10 Jazz Songs
- Artist Ranking
- 歌手影響力分析
- 播放清單效果分析
- 熱門歌曲分布分析
- 多人合作分析

前端介面採用深色 Spotify Dashboard 風格，並加上卡片式設計、圖表、滑鼠互動與歌曲細節視窗，讓分析結果更容易閱讀與展示。

## 研究動機

在音樂資料分析中，只列出歌曲名稱或資料表內容通常不夠直觀，因此本專案希望把資料庫中的爵士樂資料轉換成可視化資訊，進一步回答以下問題：

1. 哪些歌曲在資料集中最熱門？
2. 哪些藝人在整體資料中最有影響力？
3. 哪些播放清單最容易聚集高流行度歌曲？
4. 爵士歌曲的流行度主要落在哪些區間？
5. 合作人數增加是否真的會讓歌曲更受歡迎？

## 使用技術

### 前端
- React
- Vite
- Chart.js
- CSS utility style 設計

### 後端
- Flask
- Flask-CORS
- pandas
- pyodbc
- SQL Server

### 資料來源
- `Jazz_playlist_tracks.csv`
- `Jazz_playlist_data.csv`
- `Jazz_playlist_tracks_data.csv`
- SQL Server 資料庫 `JazzDB`

## 專案結構

```text
frontend/
  src/
    components/
    hooks/
    utils/
  public/
  package.json
SQL.py
requirements.txt
start-jazz-dashboard.ps1
start-jazz-dashboard.cmd
README.md
```

## 系統功能

### 1. Top Songs
從 API `http://localhost:3000/top_songs` 顯示 Top 10 爵士歌曲，內容包含：
- 歌曲名稱
- 歌手名稱
- 專輯封面
- 流行度
- 合作人數
- AI 生成歌曲介紹文

### 2. Artist Ranking
從 API `http://localhost:3000/artist_rank` 顯示藝人排行榜，並以圖表呈現藝人的整體分數。

### 3. Bonus Analysis
另外加入四個進階分析：
- 歌手影響力分析
- 播放清單效果分析
- 熱門歌曲分布分析
- 多人合作分析

## 分析方法

### 1. Top Songs 分析
選出流行度最高的前 10 首爵士歌曲，並在前端顯示歌曲資訊與介紹文字。

### 2. Artist Ranking 分析
將每位藝人對應歌曲的流行度加總，作為該藝人的總分。

SQL 概念：
```sql
SELECT a.name AS artist, SUM(s.popularity) AS score
FROM Artist a
JOIN Song s ON a.aid = s.aid
GROUP BY a.name
ORDER BY score DESC;
```

### 3. 歌手影響力分析
統計每位藝人的：
- 歌曲數量
- 平均流行度
- 總流行度

SQL 概念：
```sql
SELECT 
    a.name,
    COUNT(*) AS song_count,
    AVG(s.popularity) AS avg_popularity,
    SUM(s.popularity) AS total_popularity
FROM Artist a
JOIN Song s ON a.aid = s.aid
GROUP BY a.name
ORDER BY total_popularity DESC;
```

### 4. 播放清單效果分析
分析每個 playlist 的歌曲數量與平均流行度。

SQL 概念：
```sql
SELECT 
    playlist_name,
    COUNT(*) AS total_songs,
    AVG(popularity) AS avg_popularity
FROM Song
GROUP BY playlist_name
ORDER BY avg_popularity DESC;
```

### 5. 熱門歌曲分布分析
把歌曲依流行度分成 `High / Medium / Low` 三種區間。

SQL 概念：
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

### 6. 多人合作分析
比較 `num_artists` 與平均流行度之間的關係。

SQL 概念：
```sql
SELECT 
    num_artists,
    AVG(popularity) AS avg_popularity,
    COUNT(*) AS song_count
FROM Song
GROUP BY num_artists
ORDER BY num_artists;
```

## 分析結果

### 1. Top Songs 結果
目前 Top 10 歌曲為：
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

### 2. Artist Ranking 結果
目前排行榜前 3 名為：
- Bill Charlap Trio：777
- Hara Noda：744
- Norah Jones：723

分析結論：
Bill Charlap Trio 在目前資料集中擁有最高的總流行度，因此可以視為整體影響力最強的藝人。

### 3. 歌手影響力分析結果
前幾名藝人如下：
- Bill Charlap Trio：16 首歌，平均流行度 48.0，總流行度 777
- Hara Noda：14 首歌，平均流行度 53.0，總流行度 744
- Norah Jones：13 首歌，平均流行度 55.0，總流行度 723

分析結論：
影響力不只取決於平均流行度，也和歌曲數量有關。有些藝人雖然平均流行度不是最高，但因為作品數量多，因此總影響力更高。

### 4. 播放清單效果分析結果
排名前幾名的 playlist 為：
- Jazz in the Background：370 首歌，平均流行度 50
- Jazz Vibes：300 首歌，平均流行度 50
- Jazz Classics：250 首歌，平均流行度 50
- Jazz for Study：200 首歌，平均流行度 50
- Jazz for Sleep：159 首歌，平均流行度 50

分析結論：
效果較好的播放清單通常不只平均流行度穩定，歌曲數量也明顯較多，代表這些 playlist 更容易聚集受歡迎的爵士曲目。

### 5. 熱門歌曲分布分析結果
目前分布如下：
- Medium：141 首
- Low：3062 首
- High：0 首

分析結論：
大部分歌曲集中在低流行度區間，說明這份資料集偏向長尾型爵士曲目，而不是主流商業熱門歌單。

### 6. 多人合作分析結果
目前統計如下：
- 1 位藝人：平均流行度 47.0，歌曲數 2570
- 2 位藝人：平均流行度 47.0，歌曲數 366
- 3 位藝人：平均流行度 44.0，歌曲數 165
- 4 位藝人：平均流行度 41.0，歌曲數 77

分析結論：
合作人數增加不一定會讓歌曲更受歡迎。在目前資料中，單人與雙人合作的平均表現接近，但多人合作反而呈現下降趨勢。

### 7. 整體資料摘要
- 總歌曲數：3203
- 平均流行度：46.0
- 平均時長：4.05 分鐘

熱門 playlist 數量：
- Jazz in the Background：370
- Jazz Vibes：300
- Jazz Classics：250
- Chilled Jazz：247
- Jazz for Study：200

## 專案特色

- Spotify 風格深色介面
- 現代化卡片式 Dashboard
- Top Songs 與 Artist Ranking 可互動點擊
- 使用 Chart.js 畫圖
- 加入 AI 生成歌曲介紹文
- 可直接作為資料庫專題展示作品

## 如何執行

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

## 專案成果總結

這個專案不只是前端介面展示，也包含：
- 資料庫查詢與聚合分析
- SQL 分析邏輯設計
- API 設計
- 前後端整合
- 視覺化圖表呈現
- 將原始資料轉換成可解讀的分析結果

因此它同時具備：
- 前端實作價值
- 資料分析價值
- 資料庫課程專題展示價值

## 未來可擴充方向

- 將 AI Summary 全部優化成更自然的中文敘述
- 加入更多篩選功能，例如 playlist / artist / popularity range
- 新增匯出 PDF 報告功能
- 部署前端與 API 到雲端
