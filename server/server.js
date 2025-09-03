// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS 설정 (테스트 단계에서는 모든 도메인 허용, 실제 배포 시엔 GitHub Pages 도메인만 허용 권장)
app.use(
  cors({
    origin: "*", // 👉 나중에 "https://weathersketch.github.io" 로 제한하는게 안전
  })
);

// 🔑 네이버 API 인증 정보
const CLIENT_ID = "0VwonD3u7IIukfxflhGV";
const CLIENT_SECRET = "Y4AXvmuUGf";

// ✅ 네이버 뉴스 프록시
app.get("/app-news/server", async (req, res) => {
  const q = req.query.q;
  const display = req.query.display || 50; // 기본 50개, 필요 시 클라이언트에서 &display=100 지정 가능

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    q
  )}&display=${display}&sort=date`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("네이버 API 호출 오류:", error);
    res.status(500).json({ error: "네이버 뉴스 API 호출 실패" });
  }
});

// ✅ 구글 뉴스 프록시 (RSS → XML 그대로 전달)
app.get("/google-news", async (req, res) => {
  const q = req.query.q;
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    q
  )}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const response = await fetch(rssUrl);
    const text = await response.text();

    // ✅ 올바른 XML 헤더로 반환
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.send(text);
  } catch (error) {
    console.error("구글 뉴스 프록시 오류:", error);
    res.status(500).json({ error: "구글 뉴스 API 호출 실패" });
  }
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
