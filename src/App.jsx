import { useState } from "react";

// 언론사 도메인 → 이름 맵핑
const mediaMap = {
  "chosun.com": "조선일보",
  "joongang.co.kr": "중앙일보",
  "donga.com": "동아일보",
  "hani.co.kr": "한겨레",
  "kyunghyang.com": "경향신문",
  "kbs.co.kr": "KBS",
  "sbs.co.kr": "SBS",
  "imbc.com": "MBC",
  "ytn.co.kr": "YTN",
  "yna.co.kr": "연합뉴스",
  "news.mt.co.kr": "머니투데이",
  "hankookilbo.com": "한국일보",
  "dt.co.kr": "디지털타임즈",
  "kmib.co.kr": "국민일보",
  "v.daum.net": "다음 뉴스",
};

// ✅ Render 배포된 백엔드 URL (프록시)
const BASE_URL = "https://news-proxy-aukx.onrender.com";

// 시간 표시 함수
function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = (now - past) / 1000;
  if (diff < 60) return `${Math.floor(diff)}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}달 전`;
  return `${Math.floor(diff / 31536000)}년 전`;
}

// ✅ 구글 뉴스 (프록시 통해 XML 파싱, 최대 100개 확보)
async function fetchGoogleNews(keyword) {
  try {
    const response = await fetch(
      `${BASE_URL}/google-news?q=${encodeURIComponent(keyword)}`
    );
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const items = Array.from(xml.querySelectorAll("item"));

    return items.slice(0, 100).map((item) => {
      let title = item.querySelector("title")?.textContent || "";
      let link = item.querySelector("link")?.textContent || "";
      let pubDate = item.querySelector("pubDate")?.textContent || "";
      let source = item.querySelector("source")?.textContent || "구글뉴스";
      let description = item.querySelector("description")?.textContent || "";

      if (title.includes(" - ")) {
        const parts = title.split(" - ");
        title = parts[0].trim();
        source = parts[1].trim();
      }

      return { title, description, link, source, pubDate };
    });
  } catch (err) {
    console.error("구글 뉴스 파싱 오류", err);
    return [];
  }
}

// ✅ 네이버 뉴스 (프록시 사용, 최대 100개 확보)
async function fetchNaverNews(keyword) {
  try {
    const response = await fetch(
      `${BASE_URL}/app-news/server?q=${encodeURIComponent(keyword)}&display=100`
    );
    const data = await response.json();
    let items = data.items || [];

    return items.map((item) => {
      let source = "네이버뉴스";
      if (item.originallink) {
        try {
          const urlObj = new URL(item.originallink);
          const domain = urlObj.hostname.replace("www.", "");
          source = mediaMap[domain] || domain;
        } catch {
          source = "언론사 미확인";
        }
      }
      return {
        title: item.title.replace(/<[^>]+>/g, ""),
        description: item.description?.replace(/<[^>]+>/g, "") || "",
        link: item.link,
        source,
        pubDate: item.pubDate,
      };
    });
  } catch (err) {
    console.error("네이버 뉴스 오류", err);
    return [];
  }
}

// 뉴스 박스
function NewsBox({ side, query, setQuery }) {
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query) {
      alert("키워드를 입력하세요!");
      return;
    }

    // ✅ pool: 구글 100 + 네이버 100 = 최대 200
    const [googleNews, naverNews] = await Promise.all([
      fetchGoogleNews(query),
      fetchNaverNews(query),
    ]);

    let allNews = [...googleNews, ...naverNews];
    const keyword = query.toLowerCase();

    const titleMatches = allNews
      .filter((item) => item.title.toLowerCase().includes(keyword))
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const contentMatches = allNews
      .filter(
        (item) =>
          !item.title.toLowerCase().includes(keyword) &&
          item.description.toLowerCase().includes(keyword)
      )
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // ✅ pool은 최대 200개 확보, 표출은 50개 제한
    const finalResults = [...titleMatches, ...contentMatches].slice(0, 50);

    setResults(finalResults);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder={`검색어 입력 (${side})`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          검색
        </button>
      </div>
      <ul className="space-y-2">
        {results.map((item, idx) => (
          <li
            key={idx}
            className="border-b pb-2 hover:bg-gray-50 transition p-1 flex flex-wrap items-center"
          >
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-blue-700 hover:underline flex-1"
            >
              {item.title}
            </a>
            <span className="ml-2 text-sm text-red-600 font-semibold whitespace-nowrap">
              {timeAgo(item.pubDate)}
            </span>
            <span className="ml-2 text-sm text-blue-800 font-semibold whitespace-nowrap">
              [{item.source}]
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 전체 앱
export default function App() {
  const [leftQuery, setLeftQuery] = useState("");
  const [rightQuery, setRightQuery] = useState("");

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        📰 뉴스 대시보드 (구글 100 + 네이버 100 pool, 표출 50개)
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NewsBox side="왼쪽" query={leftQuery} setQuery={setLeftQuery} />
        <NewsBox side="오른쪽" query={rightQuery} setQuery={setRightQuery} />
      </div>
    </div>
  );
}
