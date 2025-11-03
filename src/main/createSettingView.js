const { BrowserView } = require("electron");
const path = require("path");

let settingView = null;

function createSettingView(mainWindow) {
  if (settingView) return;

  settingView = new BrowserView({
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.addBrowserView(settingView);

  // 设定位置与大小（位于 header 下方）
  const bounds = mainWindow.getBounds();
  settingView.setBounds({
    x: bounds.width - 320,
    y: 50,
    width: 300,
    height: 380,
  });

  settingView.setAutoResize({ width: false, height: false });
  settingView.webContents.loadURL(
    MAIN_WINDOW_WEBPACK_ENTRY.replace("index.html", "settings.html")
  );

  settingView.webContents.on("did-finish-load", () => {
    console.log("SettingMenu loaded");
  });
}

function removeSettingView(mainWindow) {
  if (settingView) {
    mainWindow.removeBrowserView(settingView);
    settingView.destroy();
    settingView = null;
  }
}

module.exports = { createSettingView, removeSettingView };
