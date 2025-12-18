import { useEffect, useState } from "react";

const SEARCH_ENGINE_URLS = {
  bing: "https://www.bing.com/search?q=",
  google: "https://www.google.com/search?q=",
};

function normalizeSearchEngine(engine) {
  return engine === "google" ? "google" : "bing";
}

/**
 * 构建“关键词搜索”URL。
 * 注意：如果输入的是网址（包含 . 或者以 http/https 开头），调用方应该跳过本方法。
 */
export function buildSearchUrl(keyword, engine) {
  const se = normalizeSearchEngine(engine);
  const base = SEARCH_ENGINE_URLS[se] || SEARCH_ENGINE_URLS.bing;
  return base + encodeURIComponent(keyword);
}

/**
 * 搜索框 placeholder 文案（随搜索引擎配置变化）。
 */
export function getSearchPlaceholder(engine) {
  const se = normalizeSearchEngine(engine);
  const name = se === "google" ? "Google" : "Bing";
  return `在 ${name} 上搜索，或者输入一个网址`;
}

/**
 * 统一封装搜索引擎配置读取与订阅：
 * - 初次挂载时从主进程读取持久化配置
 * - 设置页变更时通过主进程广播事件立即生效
 */
export function useSearchEngine(defaultEngine = "bing") {
  const [searchEngine, setSearchEngine] = useState(
    normalizeSearchEngine(defaultEngine)
  );

  useEffect(() => {
    let off;

    (async () => {
      const se = await window.electronAPI?.getSearchEngine?.();
      if (se) setSearchEngine(normalizeSearchEngine(se));

      off = window.electronAPI?.onSearchEngineChanged?.((next) => {
        if (next) setSearchEngine(normalizeSearchEngine(next));
      });
    })();

    return () => {
      if (typeof off === "function") off();
    };
  }, []);

  return searchEngine;
}
