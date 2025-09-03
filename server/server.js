import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());

// ✅ 네이버 뉴스 프록시
app.get("/app-news/server", async (req, res) => {
  const q = req.query.q;
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    q
  )}&display=50&sort=date`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": "0VwonD3u7IIukfxflhGV",
        "X-Naver-Client-Secret": "Y4AXvmuUGf",
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("네이버 API 호출 오류:", error);
    res.status(500).json({ error: "네이버 뉴스 API 호출 실패" });
  }
});

// ✅ 구글 뉴스 프록시
app.get("/google-news", async (req, res) => {
  const q = req.query.q;
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    q
  )}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const response = await fetch(rssUrl);
    const text = await response.text();
    res.send(text); // XML 그대로 전달
  } catch (error) {
    console.error("구글 뉴스 호출 오류:", error);
    res.status(500).json({ error: "구글 뉴스 API 호출 실패" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
