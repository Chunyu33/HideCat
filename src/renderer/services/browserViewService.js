export const handleNewTab = async (url, tabName) => {
  const currentKey = await window.electronAPI.getActiveKey();
  await window.electronAPI.setActiveTab(currentKey);
  await window.electronAPI.addTab(currentKey, url);
};

export const handleUpdateTab = async (key, url, tabName) => {
  await window.electronAPI.setActiveTab(key);
  await window.electronAPI.addTab(key, url);
};

