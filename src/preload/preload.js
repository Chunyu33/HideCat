const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("toggle-maximize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  hideWindow: (ms = 0) => ipcRenderer.invoke("hide-window", ms),
  showWindow: () => ipcRenderer.invoke("show-window"),
  dragWindow: () => ipcRenderer.invoke("drag-window"),
  stopDragging: () => ipcRenderer.send("stop-dragging"),
  startWindowResize: (direction) =>
    ipcRenderer.invoke("start-window-resize", direction),
  stopWindowResize: () => ipcRenderer.send("stop-window-resize"),
  togglePinWindow: () => ipcRenderer.invoke("toggle-pin-window"),

  // 打开外部链接
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // 设置窗口
  openSettingsWindow: () => ipcRenderer.invoke("open-settings-window"),
  closeSettingsWindow: () => ipcRenderer.invoke("close-settings-window"),

  navigateView: (action) => ipcRenderer.send("navigate-view", action),

  // 窗口样式
  setOpacity: (val) => ipcRenderer.invoke("set-opacity", val),
  getOpacity: () => ipcRenderer.invoke("get-opacity"),
  setTransparentBorder: (enabled) =>
    ipcRenderer.invoke("set-transparent-border", enabled),
  getTransparentBorder: () => ipcRenderer.invoke("get-transparent-border"),
  setScale: (val) => ipcRenderer.invoke("set-scale", val),
  getScale: () => ipcRenderer.invoke("get-scale"),
  setAutoZoom: (enabled) => ipcRenderer.invoke("set-auto-zoom", enabled),
  getAutoZoom: () => ipcRenderer.invoke("get-auto-zoom"),

  // 自动隐藏功能
  setAutoHide: (enabled, count) =>
    ipcRenderer.invoke("set-auto-hide", { enabled, count }),
  getAutoHide: () => ipcRenderer.invoke("get-auto-hide"),

  // 全局快捷键（可自定义）
  getGlobalShortcuts: () => ipcRenderer.invoke("get-global-shortcuts"),
  setGlobalShortcuts: (overrides) =>
    ipcRenderer.invoke("set-global-shortcuts", overrides),
  resetGlobalShortcuts: () => ipcRenderer.invoke("reset-global-shortcuts"),
  setShortcutRecordingPaused: (paused) =>
    ipcRenderer.invoke("set-shortcut-recording-paused", paused),

  // tab窗口功能
  getActiveKey: () => ipcRenderer.invoke("get-active-key"),
  addTab: (key, url) => ipcRenderer.invoke("add-tab", { key, url }),
  removeTab: (key) => ipcRenderer.invoke("remove-tab", key),
  setActiveTab: (key) => ipcRenderer.invoke("set-active-tab", key),
  createNewTab: () => ipcRenderer.invoke("create-new-tab"),

  // 窗口加载状态事件监听
  onTabLoading: (cb) => {
    const listener = (_, data) => cb && cb(data);
    ipcRenderer.on("tab-loading", listener);
    return () => ipcRenderer.removeListener("tab-loading", listener);
  },
  onTabLoaded: (cb) => {
    const listener = (_, data) => cb && cb(data);
    ipcRenderer.on("tab-loaded", listener);
    return () => ipcRenderer.removeListener("tab-loaded", listener);
  },
  onTabLoadFailed: (cb) => {
    const listener = (_, data) => cb && cb(data);
    ipcRenderer.on("tab-load-failed", listener);
    return () => ipcRenderer.removeListener("tab-load-failed", listener);
  },
  onTabFinish: (cb) => {
    const listener = (_, data) => cb && cb(data);
    ipcRenderer.on("tab-finish", listener);
    return () => ipcRenderer.removeListener("tab-finish", listener);
  },

  // 快捷入口
  getShortcuts: () => ipcRenderer.invoke("get-shortcuts"),
  addShortcut: (item) => ipcRenderer.invoke("add-shortcut", item),
  updateShortcut: (item) => ipcRenderer.invoke("update-shortcut", item),
  removeShortcut: (id) => ipcRenderer.invoke("remove-shortcut", id),

  // 默认快捷入口隐藏（非删除）
  getHiddenDefaultShortcuts: () => ipcRenderer.invoke("get-hidden-default-shortcuts"),
  hideDefaultShortcut: (id) => ipcRenderer.invoke("hide-default-shortcut", id),
  unhideDefaultShortcut: (id) => ipcRenderer.invoke("unhide-default-shortcut", id),

  // 快捷入口更新通知
  // 主进程在 BrowserView 右键菜单“收藏到快捷入口”成功后，会发送 shortcuts-updated
  onShortcutsUpdated: (cb) => {
    const listener = (_, shortcuts) => cb && cb(shortcuts);
    ipcRenderer.on("shortcuts-updated", listener);
    return () => ipcRenderer.removeListener("shortcuts-updated", listener);
  },

  // 主题切换
  setTheme: (theme) => ipcRenderer.invoke("set-theme", theme),
  getTheme: () => ipcRenderer.invoke("get-theme"),
  onThemeChanged: (callback) => {
    const handler = (_, theme) => callback(theme); // 只传递 theme
    ipcRenderer.on("theme-changed", handler);
    return () => ipcRenderer.removeListener("theme-changed", handler); // 返回取消函数
  },

  // 搜索引擎
  setSearchEngine: (engine) => ipcRenderer.invoke("set-search-engine", engine),
  getSearchEngine: () => ipcRenderer.invoke("get-search-engine"),
  onSearchEngineChanged: (callback) => {
    const handler = (_, engine) => callback && callback(engine);
    ipcRenderer.on("search-engine-changed", handler);
    return () => ipcRenderer.removeListener("search-engine-changed", handler);
  },

  // 自动更新
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  
  // 更新事件监听器
  onUpdateStatus: (callback) => {
    const handler = (_, status) => callback && callback(status);
    ipcRenderer.on("update-status", handler);
    return () => ipcRenderer.removeListener("update-status", handler);
  },
  onUpdateAvailable: (callback) => {
    const handler = (_, info) => callback && callback(info);
    ipcRenderer.on("update-available", handler);
    return () => ipcRenderer.removeListener("update-available", handler);
  },
  onUpdateNotAvailable: (callback) => {
    const handler = (_, info) => callback && callback(info);
    ipcRenderer.on("update-not-available", handler);
    return () => ipcRenderer.removeListener("update-not-available", handler);
  },
  onDownloadProgress: (callback) => {
    const handler = (_, progress) => callback && callback(progress);
    ipcRenderer.on("download-progress", handler);
    return () => ipcRenderer.removeListener("download-progress", handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_, info) => callback && callback(info);
    ipcRenderer.on("update-downloaded", handler);
    return () => ipcRenderer.removeListener("update-downloaded", handler);
  },
  onUpdateError: (callback) => {
    const handler = (_, error) => callback && callback(error);
    ipcRenderer.on("update-error", handler);
    return () => ipcRenderer.removeListener("update-error", handler);
  },
  onUpdateCheckResult: (callback) => {
    console.log('\n===onUpdateCheckResult========== callback registered')
    const handler = (_, result) => {
      console.log('preload: update-check-result received:', result)
      callback && callback(result);
    };
    ipcRenderer.on("update-check-result", handler);
    return () => ipcRenderer.removeListener("update-check-result", handler);
  },
});

(() => {
  const edgeSize = 8;
  let transparentResizeEnabled = false;
  let resizing = false;
  let resizeDirection = "";

  ipcRenderer.invoke("get-transparent-border").then((enabled) => {
    transparentResizeEnabled = !!enabled;
  }).catch(() => {});

  const isBrowserViewPage = () => {
    return !location.href.startsWith("http://localhost:5173") &&
      !location.href.startsWith("file://") &&
      !location.search.includes("window=");
  };

  const getResizeDirection = (event) => {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    const north = !isBrowserViewPage() && clientY <= edgeSize;
    const south = clientY >= innerHeight - edgeSize;
    const west = clientX <= edgeSize;
    const east = clientX >= innerWidth - edgeSize;

    if (north && west) return "nw";
    if (north && east) return "ne";
    if (south && west) return "sw";
    if (south && east) return "se";
    if (north) return "n";
    if (south) return "s";
    if (west) return "w";
    if (east) return "e";
    return "";
  };

  const getCursor = (direction) => {
    if (direction === "n" || direction === "s") return "ns-resize";
    if (direction === "e" || direction === "w") return "ew-resize";
    if (direction === "nw" || direction === "se") return "nwse-resize";
    if (direction === "ne" || direction === "sw") return "nesw-resize";
    return "";
  };

  const setCursor = (cursor) => {
    if (document?.body) {
      document.body.style.cursor = cursor;
    }
  };

  const stopResize = () => {
    if (!resizing) return;
    resizing = false;
    resizeDirection = "";
    setCursor("");
    ipcRenderer.send("stop-window-resize");
  };

  window.addEventListener("mousemove", (event) => {
    if (!transparentResizeEnabled || resizing || event.buttons !== 0) return;
    const direction = getResizeDirection(event);
    setCursor(getCursor(direction));
  }, true);

  window.addEventListener("mousedown", (event) => {
    if (!transparentResizeEnabled || event.button !== 0) return;
    const direction = getResizeDirection(event);
    if (!direction) return;

    resizing = true;
    resizeDirection = direction;
    setCursor(getCursor(resizeDirection));
    ipcRenderer.invoke("start-window-resize", resizeDirection);
    event.preventDefault();
    event.stopPropagation();
  }, true);

  window.addEventListener("mouseup", stopResize, true);
  window.addEventListener("blur", stopResize, true);
  window.addEventListener("mouseleave", () => {
    if (!resizing) setCursor("");
  }, true);
})();
