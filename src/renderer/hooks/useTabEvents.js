// src/hooks/useTabEvents.js
import { useEffect } from "react";

/**
 * useTabEvents(applyUpdater)
 *
 * applyUpdater: (updaterFn) => void
 *   - updaterFn: (key, item) => newItem
 *
 * 说明：
 * 这个 hook 不直接操作 state，而是把“对单个 tab 的更新函数”交给
 * 外层组件去执行（通过 applyUpdater）。这样组件可以决定如何
 *把更新合并到当前 items（比如用 setItems(prev => prev.map(...))）。
 */
export default function useTabEvents(applyUpdater) {
  useEffect(() => {
    if (!window.electronAPI || typeof applyUpdater !== "function") return;

    // tab 开始加载（主进程发送 tab-loading）
    const offLoading = window.electronAPI.onTabLoading(({ key, url }) => {
      // 将一个 updater 函数交给上层去 apply
      applyUpdater((k, item) => (k === key ? { ...item, status: "loading", url } : item));
    });

    // DOM ready（主进程发送 tab-loaded）
    const offLoaded = window.electronAPI.onTabLoaded(({ key, url, title }) => {
      applyUpdater((k, item) =>
        k === key ? { ...item, status: "dom-ready", title: title || item?.title || item.label } : item
      );
    });

    // 完全加载完成（主进程发送 tab-finish）
    const offFinish = window.electronAPI.onTabFinish(({ key, url }) => {
      applyUpdater((k, item) =>
        k === key ? { ...item, status: "loaded", url, isLoaded: true } : item
      );
      console.log("preload.js 监听网页完全加载完成 --- finish", key, url);
    });

    // 加载失败
    const offFailed = window.electronAPI.onTabLoadFailed(({ key, errorCode, errorDescription }) => {
      applyUpdater((k, item) =>
        k === key ? { ...item, status: "failed", error: errorDescription || `错误 ${errorCode}` } : item
      );
    });

    // cleanup：调用 preload 返回的卸载函数（如果存在）
    return () => {
      try {
        offLoading && offLoading();
        offLoaded && offLoaded();
        offFinish && offFinish();
        offFailed && offFailed();
      } catch (e) {
        // safety
      }
    };
  }, [applyUpdater]);
}
