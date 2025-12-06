const { globalShortcut } = require('electron');
const windowControl = require('./windowControl');


function showWindow() {
  windowControl.showWindow(100);
  windowControl.setAutoShow(false);
}
function registerShortcuts() {
  // Mac 快捷键 - 使用 Cmd 键替代 Alt，使用 Command+E 等常用组合
  globalShortcut.register('Cmd+D', () => showWindow());
  // 备用快捷键 - Mac 常用组合
  globalShortcut.register('Cmd+G', () => showWindow());
  // 使用 Cmd+Q 退出，这是 Mac 应用的标准退出快捷键
  globalShortcut.register('Cmd+Q', () => windowControl.quit());
  // 保留一个备用方案
  globalShortcut.register('Cmd+Shift+Space', () => showWindow());

  // 尝试使用不同的 Esc 注册方式
  let escRegistered = globalShortcut.register('Escape', () => {
    // 按下 Esc 键时，关闭鼠标移入窗口显示状态，并隐藏窗口
    windowControl.setAutoShow(true);
    windowControl.hideImmediately();
    console.log('\nEscape key pressed - mouse status monitoring has been resumed.');
  });
  
  console.log('Escape registration result:', escRegistered);
  
  // 如果 Escape 不行，尝试 Esc
  if (!escRegistered) {
    console.log('Escape failed, trying Esc...');
    let escRegistered2 = globalShortcut.register('Esc', () => {
      // 按下 Esc 键时，关闭鼠标移入窗口显示状态，并隐藏窗口
      windowControl.setAutoShow(true);
      windowControl.hideImmediately();
      console.log('\nEsc key pressed - mouse status monitoring has been resumed.');
    });
    console.log('Esc registration result:', escRegistered2);
  }
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { registerShortcuts, unregisterShortcuts };
