const { Menu, Notification, clipboard } = require("electron");

// 背景色强制的域名白名单：命中后不注入背景（保持网站原样）
// 说明：这里用 hostname（已去 www.）匹配
const BACKGROUND_COLOR_BYPASS_HOSTNAMES = new Set([
  // 示例：如果某些站点本身对暗色/透明背景处理得很好，可以加入白名单
  "weread.qq.com",
  "bing.com",
  "google.com",
  "evanspace.icu",
]);
const DEFAULT_SHORTCUT_HOST_TO_ID = new Map([
  ["evanspace.icu", "id-slack-001"],
  ["weread.qq.com", "id-weread-001"],
  ["xiaohongshu.com", "id-redbook-001"],
  ["douyin.com", "id-douyin-001"],
  ["zhihu.com", "id-zhihu-001"],
  ["bilibili.com", "id-bilibili-001"],
  ["fanqienovel.com", "id-fanqiexs-001"],
]);

function _normalizeHostname(inputUrl) {
  if (!inputUrl || typeof inputUrl !== "string") return "";
  try {
    const u = new URL(inputUrl);
    return (u.hostname || "").replace(/^www\./i, "").toLowerCase();
  } catch (e) {
    return "";
  }
}

function _alreadyBookmarkedByDomain(getShortcuts, targetUrl) {
  const targetHost = _normalizeHostname(targetUrl);
  if (!targetHost) return false;

  const shortcuts = (typeof getShortcuts === "function" && getShortcuts()) || [];
  return shortcuts.some((it) => _normalizeHostname(it && it.url) === targetHost);
}

function _getMatchedDefaultShortcutId(targetUrl) {
  const host = _normalizeHostname(targetUrl);
  if (!host) return "";
  return DEFAULT_SHORTCUT_HOST_TO_ID.get(host) || "";
}

function _notify(appName, title, body) {
  try {
    if (Notification && Notification.isSupported()) {
      new Notification({
        // Windows 通知中心顶部展示名（开发态）
        appID: appName,
        title,
        body,
      }).show();
    }
  } catch (e) {
    // 通知失败不影响主流程
  }
}

function _applyWhiteBackground(view) {
  try {
    const url = view && view.webContents && view.webContents.getURL?.();
    const host = _normalizeHostname(url);
    if (host && BACKGROUND_COLOR_BYPASS_HOSTNAMES.has(host)) {
      return;
    }

    // 根据主题决定背景色：亮色白 / 暗色深色
    // 说明：暗色取值尽量与主窗口 dark theme 的背景一致
    const theme =
      (view && view.__hideCatThemeGetter && view.__hideCatThemeGetter()) ||
      "light";
    const bg = theme === "dark" ? "#1E1E1E" : "#FFFFFF";

    // 1) webContents 级背景色（在页面透明时也会生效）
    if (view && view.webContents && typeof view.webContents.setBackgroundColor === "function") {
      view.webContents.setBackgroundColor(bg);
    }

    // 2) 页面级 CSS，覆盖透明站点的 html/body 背景
    // 说明：insertCSS 返回 key，但这里不需要移除，保持最小实现
    view.webContents.insertCSS(
      `html, body { background: ${bg} !important; background-color: ${bg} !important; }`
    );
  } catch (e) {
    // ignore
  }
}

/**
 * 绑定 BrowserView 事件（右键菜单/加载状态/白底等），避免 windowControl.addTab 过长
 */
function bindBrowserViewEvents({
  view,
  mainWindow,
  key,
  getScale,
  getTheme,
  addShortcut,
  getShortcuts,
  getHiddenDefaultShortcutIds,
  unhideDefaultShortcut,
  appName = "躲躲猫",
}) {
  if (!view || !view.webContents) return;

  // 将主题读取方法挂到 view 上，供 _applyWhiteBackground 使用（避免循环依赖 store）
  view.__hideCatThemeGetter = typeof getTheme === "function" ? getTheme : undefined;

  // 新窗口打开：直接在当前 view 内打开
  view.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    // 拦截非 HTTP/HTTPS 协议的链接，避免触发系统弹窗
    if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
      console.log(`[setWindowOpenHandler] 拦截非标准协议链接: ${targetUrl}`);
      return { action: "deny" };
    }
    view.webContents.loadURL(targetUrl);
    return { action: "deny" };
  });

  // 拦截页面内导航，阻止非 HTTP/HTTPS 协议（如 bytedance://、snssdk://）触发系统弹窗
  view.webContents.on("will-navigate", (event, url) => {
    if (url && !/^https?:\/\//i.test(url)) {
      console.log(`[will-navigate] 拦截非标准协议链接: ${url}`);
      event.preventDefault();
    }
  });

  // 拦截 frame 内的导航请求
  view.webContents.on("will-frame-navigate", (details) => {
    const url = details.url;
    if (url && !/^https?:\/\//i.test(url)) {
      console.log(`[will-frame-navigate] 拦截非标准协议链接: ${url}`);
      details.preventDefault();
    }
  });

  view.webContents.on(
    "did-fail-load",
    (e, errorCode, errorDescription, validatedURL) => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.webContents.send("tab-load-failed", {
        key,
        errorCode,
        errorDescription,
        url: validatedURL,
      });
    }
  );

  view.webContents.on("dom-ready", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const url = view.webContents.getURL?.() || "";
    const title = view.webContents.getTitle?.() || "";
    mainWindow.webContents.send("tab-loaded", { key, url, title });
  });

  view.webContents.on("did-finish-load", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const url = view.webContents.getURL?.() || "";
    mainWindow.webContents.send("tab-finish", { key, url });

    // 加载完成后确保缩放比例立即生效
    const scale = (typeof getScale === "function" && getScale()) || 1.0;
    view.webContents.setZoomFactor(scale);

    // 避免透明站点露出 React skeleton：强制白底
    _applyWhiteBackground(view);
  });

  // 右键菜单
  view.webContents.on("context-menu", (_, params) => {
    try {
      const menu = Menu.buildFromTemplate([
        {
          label: "后退",
          enabled: !!view.webContents.canGoBack && view.webContents.canGoBack(),
          click: () => {
            try {
              view.webContents.goBack();
            } catch (e) {}
          },
        },
        {
          label: "前进",
          enabled: !!view.webContents.canGoForward && view.webContents.canGoForward(),
          click: () => {
            try {
              view.webContents.goForward();
            } catch (e) {}
          },
        },
        { type: "separator" },
        {
          label: "重新加载",
          click: () => {
            try {
              view.webContents.reload();
            } catch (e) {}
          },
        },
        {
          label: "复制链接",
          click: () => {
            try {
              // 优先复制当前右键指向的链接（比如超链接/图片链接），否则复制当前页面 URL
              const linkUrl = (params && params.linkURL) || "";
              const pageUrl = (params && params.pageURL) || view.webContents.getURL();
              const target = (linkUrl || pageUrl || "").trim();
              if (!target) return;

              clipboard.writeText(target);
            } catch (e) {}
          },
        },
        { type: "separator" },
        {
          label: "收藏到快捷入口",
          click: () => {
            if (!mainWindow || mainWindow.isDestroyed()) return;

            // params.pageURL 通常更准确（尤其是 iframe / 特殊页面）
            const pageUrl = (params && params.pageURL) || view.webContents.getURL();
            const title = (view.webContents.getTitle && view.webContents.getTitle()) || pageUrl;

            // 1) 系统内置快捷入口：域名命中则不新增；若该默认项被隐藏则直接恢复显示
            const defaultId = _getMatchedDefaultShortcutId(pageUrl);
            if (defaultId) {
              const hiddenIds =
                (typeof getHiddenDefaultShortcutIds === "function" &&
                  getHiddenDefaultShortcutIds()) ||
                [];
              const hiddenSet = new Set(Array.isArray(hiddenIds) ? hiddenIds : []);

              if (hiddenSet.has(defaultId) && typeof unhideDefaultShortcut === "function") {
                unhideDefaultShortcut(defaultId);
                _notify(appName, "已恢复默认快捷入口", title);
                return;
              }

              _notify(appName, "已存在快捷入口", title);
              return;
            }

            // 域名去重：同域名存在则不重复添加
            if (_alreadyBookmarkedByDomain(getShortcuts, pageUrl)) {
              _notify(appName, "已存在快捷入口", title);
              return;
            }

            const updated = addShortcut({
              name: title,
              url: pageUrl,
            });

            _notify(appName, "已收藏到快捷入口", title);

            // 通知渲染进程刷新快捷入口
            mainWindow.webContents.send("shortcuts-updated", updated);
          },
        },
      ]);

      menu.popup({ window: mainWindow });
    } catch (e) {
      // ignore
    }
  });
}

module.exports = {
  bindBrowserViewEvents,
};
