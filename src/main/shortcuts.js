const { globalShortcut } = require('electron');
const windowControl = require('./windowControl');


function showWindow() {
  windowControl.showWindow(100);
  windowControl.setAutoShow(false);
}
function registerShortcuts() {
  globalShortcut.register('Alt+F', () => showWindow());
  // 备用快捷键
  globalShortcut.register('Ctrl+E', () => showWindow());

  globalShortcut.register('Esc', () => {
    // 按下 Esc 键时，关闭鼠标移入窗口显示状态，并隐藏窗口
    windowControl.setAutoShow(true);
    windowControl.hideImmediately();
    console.log('\nEsc Esc Esc mouse status monitoring has been resumed.');
  });
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { registerShortcuts, unregisterShortcuts };
