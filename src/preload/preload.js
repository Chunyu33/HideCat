const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  hideWindow: (ms = 0) => ipcRenderer.invoke("hide-window", ms),
  showWindow: () => ipcRenderer.invoke("show-window"),

  // 窗口样式
  setOpacity: (val) => ipcRenderer.invoke("set-opacity", val),
  getOpacity: () => ipcRenderer.invoke("get-opacity"),
  setScale: (val) => ipcRenderer.invoke("set-scale", val),
  getScale: () => ipcRenderer.invoke("get-scale"),

  // 自动隐藏功能
  setAutoHide: (enabled, count) =>
    ipcRenderer.invoke("set-auto-hide", { enabled, count }),
  getAutoHide: () => ipcRenderer.invoke("get-auto-hide"),

  // 额外功能
  cancelHideTimer: () => ipcRenderer.invoke("cancel-hide-timer"),
  triggerHideImmediately: () => ipcRenderer.invoke("trigger-hide-immediately"),

  // tab窗口功能
  /**
   * @description 通知主进程创建一个新的 BrowserView
   * @param {string} key - 新 Tab 的唯一标识符
   * @param {string} url - 待加载的 URL
   */
  addTab: (key, url) => {
    ipcRenderer.send("tab:add", { key, url });
  },

  /**
   * @description 通知主进程切换当前激活的 BrowserView
   * @param {string} key - 激活 Tab 的唯一标识符
   */
  setActiveTab: (key) => {
    ipcRenderer.send("tab:set-active", key);
  },

  /**
   * @description 通知主进程移除一个 BrowserView
   * @param {string} key - 待移除 Tab 的唯一标识符
   */
  removeTab: (key) => {
    ipcRenderer.send("tab:remove", key);
  },

  /**
   * @description 获取 Tab 内容区域的尺寸，用于 BrowserView 布局计算 (可选，但推荐)
   * @returns {Promise<object>} 返回 { width, height, x, y }
   */
  getContentBounds: () => {
    // 主进程将通过这个消息请求布局信息
    return ipcRenderer.invoke("tab:get-content-bounds");
  },
});
