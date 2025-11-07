export const handleUpdateTab = async (key, url, tabName, cb) => {
  await window.electronAPI.setActiveTab(key);
  await window.electronAPI.addTab(key, url);
  if (cb && typeof cb === "function") {
    cb();
  }
};
