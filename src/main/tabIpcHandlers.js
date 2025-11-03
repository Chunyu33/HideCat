const { ipcMain, BrowserView } = require("electron");

// 1. 存储 BrowserView 实例的 Map：[tabKey: string] -> BrowserView
const views = new Map();
let mainWindow = null;
let tabContentBounds = null; // 存储 Tab 内容区域的计算尺寸

// 假设 Tab Bar 高度约为 38px (Ant Design small size Tabs)
const TAB_BAR_HEIGHT = 38;

// ------------------------------------------------------------------
// 辅助函数：计算 BrowserView 的精确边界
// ------------------------------------------------------------------
async function calculateBounds(window) {
    if (!window || window.isDestroyed()) return null;

    let size;
    try {
        // 1. 安全地调用 getSize()
        size = window.getSize(); 
    } catch (e) {
        console.error("Error calling window.getSize():", e);
        return null; // 如果调用失败，返回 null
    }

    // 2. 检查返回值是否是有效的数组
    if (!Array.isArray(size) || size.length < 2) {
        console.error("window.getSize() returned invalid value:", size);
        return null;
    }

    // 3. 安全地解构赋值
    const width = size[0];
    const height = size[1];

    const TAB_BAR_HEIGHT = 38; 

    return {
        x: 0,
        y: TAB_BAR_HEIGHT,
        width: width,
        height: height - TAB_BAR_HEIGHT
    };
}

// ------------------------------------------------------------------
// IPC 处理器注册函数
// ------------------------------------------------------------------
function registerTabIpcHandlers(window) {
  mainWindow = window;

  // 窗口尺寸变化时重新计算布局
  mainWindow.on("resize", async () => {
    tabContentBounds = await calculateBounds(mainWindow);
    // 调整所有已存在 BrowserView 的尺寸
    views.forEach((view) => {
      if (view.webContents.isDestroyed() === false) {
        view.setBounds(tabContentBounds);
      }
    });
  });

  // 确保在窗口加载完成后计算一次边界并激活主页
  // mainWindow.webContents.once("did-finish-load", async () => {
  //   tabContentBounds = await calculateBounds(mainWindow);
  //   ipcMain.emit("tab:set-active", null, "tab-home");
  // });

  // =========================================================
  // Tab IPC HANDLERS
  // =========================================================

  // 接收 Tab 添加请求
  ipcMain.on("tab:add", async (event, { key, url }) => {
    if (views.has(key)) return;

    // 确保边界已计算
    if (!tabContentBounds) {
      tabContentBounds = await calculateBounds(mainWindow);
    }

    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // 其他安全设置...
      },
    });
    mainWindow.addBrowserView(view);

    view.setBounds(tabContentBounds);
    view.webContents.loadURL(url);
    view.setAutoResize({ width: true, height: true });

    views.set(key, view);
    console.log(`\n Added tab: ${key}`, views);
  });

  // 接收 Tab 切换请求
  ipcMain.on("tab:set-active", (event, key) => {
    const activeView = views.get(key);

    // 遍历所有视图，将非激活视图移到后台
    views.forEach((view, currentKey) => {
      if (currentKey === key) {
        // 激活的视图：移到最前 (如果有的话)
        mainWindow.setTopBrowserView(view);
        view.setBounds(tabContentBounds);
      } else {
        // 非激活的视图：将其移到主窗口之外 (隐藏)
        // 另一种做法是设置 setVisible(false) 但 Electron 官方未提供此API
        view.setBounds({ x: -9999, y: 0, width: 0, height: 0 });
      }
    });

    // 如果激活的是主页 ('tab-home') 或一个不存在的 Tab，确保没有 BrowserView 在屏幕内
    if (!activeView) {
      views.forEach((view) =>
        view.setBounds({ x: -9999, y: 0, width: 0, height: 0 })
      );
    }
    console.log("\n switch tab", views);
  });

  // 接收 Tab 移除请求
  ipcMain.on("tab:remove", (event, key) => {
    const view = views.get(key);
    if (view) {
      mainWindow.removeBrowserView(view);
      view.webContents.destroy();
      views.delete(key);
    }
    console.log("\r\n remove tab", views);
  });

  // 接收 getContentBounds 请求
  ipcMain.handle("tab:get-content-bounds", async () => {
    if (!tabContentBounds) {
      tabContentBounds = await calculateBounds(mainWindow);
    }
    return tabContentBounds;
  });

  // 返回当前已注册的 BrowserView 数量（可选）
  return {
    getBrowserViewCount: () => views.size,
  };
}

module.exports = { registerTabIpcHandlers };
