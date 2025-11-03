import React, { useState, useEffect } from "react";
import { Tabs, Button, message, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import HomePage from "./HomePage";
import "./css/main.css";

// 占位符组件 (BrowserView 将在主进程中覆盖这个区域)
const BrowserViewPlaceholder = () => (
  <div style={{ height: "100%", padding: 20, textAlign: "center" }}>
    <p>正在加载网页内容...</p>
  </div>
);

// Tab 常量
const HOME_TAB_KEY = "tab-home";
const initialItems = [
  {
    key: HOME_TAB_KEY,
    label: "主页",
    children: "LOADING_HOME",
    closable: false,
  },
];
const MAX_TABS = 5;

const EditableTabsPage = () => {
  const [activeKey, setActiveKey] = useState(HOME_TAB_KEY);
  const [items, setItems] = useState(initialItems);
  const [nextUniqueId, setNextUniqueId] = useState(1);

  const refreshPage = () => {
    if (!window.electronAPI || !activeKey) return;

    // 主动同步当前激活的 tab
    console.log("🔄 Sync active tab to main process:", activeKey);
    window.electronAPI.setActiveTab(activeKey);

    // 触发一次前端刷新（强制 React 更新渲染）
    setItems((prev) => [...prev]);
  };

  // ✅ 保证 React 激活 tab 与 Electron BrowserView 同步
  useEffect(() => {
    refreshPage();
  }, [activeKey]);

  // TODO: 处理窗口加载事件
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleLoading = ({ key, url }) => {
      setItems((prev) =>
        prev.map((it) =>
          it.key === key ? { ...it, children: <BrowserViewPlaceholder /> } : it
        )
      );
    };
    const handleLoaded = ({ key, title }) => {
      setItems((prev) =>
        prev.map((it) =>
          it.key === key
            ? { ...it, label: (title || it.label).substring(0, 15) }
            : it
        )
      );
      window.electronAPI.setActiveTab(activeKey);
    };
    const handleFailed = ({ key, errorDescription }) => {
      setItems((prev) =>
        prev.map((it) =>
          it.key === key
            ? {
                ...it,
                children: (
                  <div style={{ padding: 20 }}>
                    加载失败：{errorDescription}
                  </div>
                ),
              }
            : it
        )
      );
    };

    window.electronAPI.onTabLoading(handleLoading);
    window.electronAPI.onTabLoaded(handleLoaded);
    window.electronAPI.onTabLoadFailed(handleFailed);

    return () => {
      // 这里如果你的 preload 暴露了 off 方法可以取消监听
    };
  }, []);

  const onChange = (key) => {
    setActiveKey(key);
    // 【关键修改 1】: 调用 preload.js 中暴露的 setActiveTab
    if (window.electronAPI) {
      window.electronAPI.setActiveTab(key);
    }
  };

  // ------------------------------------------------------------------
  // 核心功能：添加新 Tab (接收来自 HomePage 的导航请求)
  // ------------------------------------------------------------------
  const handleNewTab = (url, label) => {
    console.log(label, ";b----, Received new tab:", url);
    if (items.length >= MAX_TABS) {
      message.warning(`最多只能添加 ${MAX_TABS} 个标签页。`);
      return;
    }

    const newId = nextUniqueId;
    const newKey = `web-tab-${newId}`;

    // -----------------------------
    // 🔍 判断是否为网页 / 搜索内容
    // -----------------------------
    const isWebContent =
      /^https?:\/\//i.test(url) || // 以 http/https 开头
      url.startsWith("www.") || // 或者是域名
      url.includes(".com") ||
      url.includes(".cn") ||
      url.includes(".net") || // 常见域名
      url.includes("bing.com") || // Bing 搜索
      url.includes("search?q="); // 搜索页

    // 根据类型决定内容
    const newTab = {
      label: label.substring(0, 15),
      key: newKey,
      children: isWebContent ? (
        <BrowserViewPlaceholder /> // 🌐 外部网页
      ) : (
        <HomePage onNewTab={handleNewTab} />
      ), // 🏠 内部内容
    };

    // -----------------------------
    // 通知主进程加载 BrowserView
    // -----------------------------
    if (isWebContent && window.electronAPI) {
      window.electronAPI.addTab(newKey, url);
      window.electronAPI.setActiveTab(newKey);
      console.log("Loading web tab:", url);
    }

    const newItems = [...items, newTab];
    setItems([...newItems]); // 强制触发一次渲染

    // 确保 BrowserView 已经加载并刷新激活状态
    setActiveKey(newKey);
    setNextUniqueId((prevId) => prevId + 1);
    refreshPage();
  };

  const remove = (targetKey) => {
    let newActiveKey = activeKey;
    let targetIndex = -1;

    // ... (查找 index 逻辑保持不变)
    items.forEach((item, i) => {
      if (item.key === targetKey) targetIndex = i;
    });
    const newItems = items.filter((item) => item.key !== targetKey);

    if (newActiveKey === targetKey) {
      let newIndex = targetIndex;
      if (newIndex >= newItems.length) newIndex = newItems.length - 1;
      if (newIndex >= 0) {
        newActiveKey = newItems[newIndex].key;
      } else {
        newActiveKey = HOME_TAB_KEY; // 如果所有 Tab 都被删除，回到主页
      }
    }

    // 【关键修改 3】: 通知主进程移除 BrowserView
    if (window.electronAPI) {
      window.electronAPI.removeTab(targetKey);
      window.electronAPI.setActiveTab(newActiveKey);
    }

    setItems(newItems);
    setActiveKey(newActiveKey);
  };

  const onEdit = (targetKey, action) => {
    // 确保主页不能被删除
    if (action === "remove" && targetKey !== HOME_TAB_KEY) {
      remove(targetKey);
    }
  };

  const operations = (
    <Tooltip
      title="点击新建标签页"
      placement="bottomRight"
      color="#4caf50"
      styles={{
        body: { color: "#fff" },
      }}
    >
      <Button
        type="text"
        icon={<PlusOutlined />}
        // 点击加号时创建一个新 Tab
        onClick={() => handleNewTab("about:blank", "新标签页")}
        disabled={items.length >= MAX_TABS}
        style={{ marginRight: 8, opacity: items.length >= MAX_TABS ? 0.5 : 1 }}
        aria-label="Add Tab"
      />
    </Tooltip>
  );

  const mappedItems = items.map((item) => {
    if (item.key === HOME_TAB_KEY && item.children === "LOADING_HOME") {
      return {
        ...item,
        // 将 handleNewTab 传入 HomePage
        children: <HomePage onNewTab={handleNewTab} />,
      };
    }
    return item;
  });

  return (
    <div className="main">
      <Tabs
        type="editable-card"
        hideAdd={true}
        activeKey={activeKey}
        onChange={onChange}
        onEdit={onEdit}
        items={mappedItems}
        tabBarExtraContent={operations}
        style={{ flexGrow: 1, height: "100%" }}
        tabBarStyle={{ marginBottom: 0 }}
        size="small"
        className="full-height-tabs"
      />
      {/* ⚠️ 提醒：需要外部 CSS 来确保 .ant-tabs-content 区域撑满并成为 BrowserView 的区域 ⚠️ */}
    </div>
  );
};

export default EditableTabsPage;
