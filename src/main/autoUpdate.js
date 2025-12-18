const { autoUpdater } = require("electron-updater");
const { app, BrowserWindow, dialog } = require("electron");

let mainWindowRef = null;

// 检查是否为开发环境
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

/**
 * 向所有窗口发送消息
 * @param {string} channel - IPC 频道名称
 * @param {any} data - 要发送的数据
 */
function sendToAllWindows(channel, data) {
  const allWindows = BrowserWindow.getAllWindows();
  console.log(`[Updater] 向 ${allWindows.length} 个窗口发送 ${channel}`);
  
  allWindows.forEach((win) => {
    if (win && !win.isDestroyed() && win.webContents) {
      try {
        win.webContents.send(channel, data);
        console.log(`[Updater] ✅ 成功发送 ${channel} 到窗口 ${win.id}`);
      } catch (error) {
        console.error(`[Updater] ❌ 发送 ${channel} 到窗口 ${win.id} 失败:`, error.message);
      }
    }
  });
}

/**
 * 配置自动更新器
 */
function configureUpdater() {
  // 不自动下载：由用户在弹窗/设置页触发下载，体验更可控
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // 开发环境下强制启用更新检查（仅用于测试）
  if (isDev) {
    autoUpdater.forceDevUpdateConfig = true;
  }

  // 设置更新日志输出（如果 electron-log 可用）
  try {
    autoUpdater.logger = require("electron-log");
    autoUpdater.logger.transports.file.level = "info";
  } catch (error) {
    console.log("[Updater] electron-log 不可用，使用 console 输出日志");
  }
}

/**
 * 初始化自动更新检查
 * @param {BrowserWindow} win - 主窗口引用
 * @param {Object} options - 配置选项
 * @param {boolean} options.autoCheck - 是否自动检查更新（默认 true）
 * @param {number} options.checkInterval - 检查更新间隔（毫秒，默认 1 小时）
 */
function checkUpdate(win, options = {}) {
  const { autoCheck = true, checkInterval = 60 * 60 * 1000 } = options;
  
  mainWindowRef = win;
  configureUpdater();

  console.log("[Updater] 初始化完成，主窗口 ID:", win.id);

  // 监听窗口关闭，清理引用
  win.on("closed", () => {
    console.log("[Updater] 主窗口已关闭，清理引用");
    mainWindowRef = null;
  });

  // 启动自动检查更新
  if (autoCheck && !isDev) {
    console.log("[Updater] 启动自动检查更新，间隔:", checkInterval / 1000 / 60, "分钟");
    startAutoCheck(checkInterval);
  }
}

/**
 * 启动自动检查更新（定时检查）
 * @param {number} interval - 检查间隔（毫秒）
 */
function startAutoCheck(interval = 60 * 60 * 1000) {
  // 应用启动时立即检查一次
  setTimeout(() => {
    console.log("[Updater] 执行首次自动检查");
    autoCheckForUpdates();
  }, 10000); // 延迟 10 秒，等待应用完全启动

  // 设置定时检查
  setInterval(() => {
    console.log("[Updater] 执行定时自动检查");
    autoCheckForUpdates();
  }, interval);
}

/**
 * 自动检查更新（静默检查，发现新版本弹窗提示）
 */
function autoCheckForUpdates() {
  if (isDev) {
    console.log("[Updater] 开发模式：跳过自动检查");
    return;
  }

  console.log("[Updater] 自动检查更新...");

  autoUpdater
    .checkForUpdates()
    .then((result) => {
      console.log("[Updater] 自动检查完成:", result);
      // 如果有更新，会触发 update-available 事件，由事件监听器处理弹窗
    })
    .catch((error) => {
      console.error("[Updater] 自动检查失败:", error.message);
      // 静默失败，不打扰用户
    });
}

/**
 * 手动检查更新
 */
function checkForUpdates() {
  console.log("[Updater] 手动检查更新被调用");
  
  configureUpdater();

  // 向所有窗口发送检查中状态
  sendToAllWindows("update-status", "checking");

  // 开发环境下模拟检查更新
  if (isDev) {
    console.log("[Updater] 开发模式：模拟检查更新");
    
    const result = {
      success: true,
      isDev: true,
      message: "开发模式下无法检查更新",
      version: app.getVersion() + " (dev)",
    };
    
    console.log("[Updater] 发送模拟更新结果:", result);
    
    // 模拟网络延迟
    setTimeout(() => {
      sendToAllWindows("update-check-result", result);
      console.log("[Updater] 开发模式检查完成");
    }, 500);
    
    return;
  }

  // 生产环境：真实检查更新
  console.log("[Updater] 生产模式：开始检查更新");
  
  autoUpdater
    .checkForUpdates()
    .then((result) => {
      console.log("[Updater] ✅ 检查更新成功:", result);

      const currentVersion = app.getVersion();
      const nextVersion = result?.updateInfo?.version;
      const isUpdateAvailable = !!(nextVersion && nextVersion !== currentVersion);

      sendToAllWindows("update-check-result", {
        success: true,
        currentVersion,
        isUpdateAvailable,
        updateInfo: result.updateInfo,
      });
    })
    .catch((error) => {
      console.error("[Updater] ❌ 检查更新失败:", error.message);
      
      sendToAllWindows("update-check-result", {
        success: false,
        error: error.message,
      });
    });
}

/**
 * 退出并安装更新
 */
function quitAndInstall() {
  console.log("[Updater] 退出并安装更新");
  autoUpdater.quitAndInstall();
}

// ========================================
// 监听自动更新事件
// ========================================

autoUpdater.on("checking-for-update", () => {
  console.log("[Updater] 事件: checking-for-update");
  sendToAllWindows("update-status", "checking");
});

autoUpdater.on("update-available", (info) => {
  console.log("[Updater] 事件: update-available", info);
  sendToAllWindows("update-available", info);
  
  // 弹出系统原生对话框提示用户
  const dialogOpts = {
    type: 'info',
    buttons: ['立即更新', '稍后提醒'],
    title: '发现新版本',
    message: `发现新版本 ${info.version}`,
    detail: `当前版本: ${app.getVersion()}\n新版本: ${info.version}\n\n点击"立即更新"开始下载并安装更新。`,
  };
  
  dialog.showMessageBox(mainWindowRef, dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      // 用户点击"立即更新"
      console.log("[Updater] 用户确认更新，开始下载");
      sendToAllWindows("update-status", "downloading");
      autoUpdater.downloadUpdate().catch((err) => {
        console.error("[Updater] ❌ 下载更新失败:", err?.message || err);
        sendToAllWindows("update-error", err?.message || String(err));
      });
    } else {
      // 用户点击"稍后提醒"
      console.log("[Updater] 用户选择稍后更新");
    }
  });
});

autoUpdater.on("update-not-available", (info) => {
  console.log("[Updater] 事件: update-not-available", info);
  sendToAllWindows("update-not-available", info);
});

autoUpdater.on("download-progress", (progressObj) => {
  console.log("[Updater] 事件: download-progress", progressObj.percent + "%");
  sendToAllWindows("download-progress", progressObj);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("[Updater] 事件: update-downloaded", info);
  sendToAllWindows("update-downloaded", info);
  
  // 下载完成后弹出对话框询问是否立即安装
  const dialogOpts = {
    type: 'info',
    buttons: ['立即重启', '稍后重启'],
    title: '更新已下载',
    message: '新版本已下载完成',
    detail: `版本 ${info.version} 已下载完成。\n\n点击"立即重启"安装更新，或选择"稍后重启"在下次启动时自动安装。`,
  };
  
  dialog.showMessageBox(mainWindowRef, dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      // 用户点击"立即重启"
      console.log("[Updater] 用户确认立即重启安装");
      setImmediate(() => autoUpdater.quitAndInstall());
    } else {
      // 用户点击"稍后重启"
      console.log("[Updater] 用户选择稍后重启，下次启动时自动安装");
      // autoInstallOnAppQuit = true 会在下次退出时自动安装
    }
  });
});

autoUpdater.on("error", (error) => {
  console.error("[Updater] 事件: error", error.message);
  sendToAllWindows("update-error", error.message);
});

// ========================================
// 导出模块
// ========================================

module.exports = {
  checkUpdate,
  checkForUpdates,
  quitAndInstall,
  startAutoCheck, // 导出自动检查函数
};