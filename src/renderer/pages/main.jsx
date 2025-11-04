import React, { useState, useEffect } from "react";
import { Tabs, Button, message, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import HomePage from "./HomePage";
import useTabEvents from "../hooks/useTabEvents"; // ✅ 新增
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
  const [loadingTabs, setLoadingTabs] = useState(() => new Set());
  const [failedTabs, setFailedTabs] = useState({});

  useTabEvents((updater) => {
    setItems((prev) => prev.map((t) => updater(t.key, t)));

    // 同步更新 loading 状态
    setLoadingTabs((prev) => {
      const next = new Set(prev);
      prev.forEach((key) => {
        const item = items.find((t) => t.key === key);
        if (item?.status === "loaded" || item?.status === "failed") {
          next.delete(key);
        }
      });
      return next;
    });
  });

  const onChange = (key) => {
    setActiveKey(key);
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
      url !== "about:blank" &&
      (/^https?:\/\//i.test(url) ||
        url.startsWith("www.") ||
        url.includes(".com") ||
        url.includes(".cn") ||
        url.includes(".net") ||
        url.includes("bing.com") ||
        url.includes("search?q="));

    // -----------------------------
    // 根据类型决定内容
    // -----------------------------
    const initialChildren = isWebContent ? (
      <BrowserViewPlaceholder />
    ) : (
      <HomePage onNewTab={handleNewTab} />
    );

    const newTab = {
      label: label.substring(0, 15),
      key: newKey,
      children: initialChildren,
    };

    const newItems = [...items, newTab];
    setItems(newItems);
    setActiveKey(newKey);

    if (isWebContent) {
      setLoadingTabs((prev) => {
        const next = new Set(prev);
        next.add(newKey);
        return next;
      });
    }

    // -----------------------------
    // 通知主进程加载 BrowserView
    // -----------------------------
    setTimeout(() => {
      if (isWebContent && window.electronAPI) {
        window.electronAPI.addTab(newKey, url);
        window.electronAPI.setActiveTab(newKey);
        console.log("Loading web tab:", url);
      }
    }, 0);

    setNextUniqueId((prevId) => prevId + 1);
  };

  // ------------------------------------------------------------------
  // 删除标签页
  // ------------------------------------------------------------------
  const remove = (targetKey) => {
    let newActiveKey = activeKey;
    let targetIndex = -1;

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
        newActiveKey = HOME_TAB_KEY;
      }
    }

    if (window.electronAPI) {
      window.electronAPI.removeTab(targetKey);
      window.electronAPI.setActiveTab(newActiveKey);
    }

    setLoadingTabs((prev) => {
      const next = new Set(prev);
      next.delete(targetKey);
      return next;
    });
    setFailedTabs((prev) => {
      if (!prev[targetKey]) return prev;
      const copy = { ...prev };
      delete copy[targetKey];
      return copy;
    });

    setItems(newItems);
    setActiveKey(newActiveKey);
  };

  const onEdit = (targetKey, action) => {
    if (action === "remove" && targetKey !== HOME_TAB_KEY) {
      remove(targetKey);
    }
  };

  // ------------------------------------------------------------------
  // 新建按钮
  // ------------------------------------------------------------------
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
        onClick={() => handleNewTab("about:blank", "新标签页")}
        disabled={items.length >= MAX_TABS}
        style={{ marginRight: 8, opacity: items.length >= MAX_TABS ? 0.5 : 1 }}
        aria-label="Add Tab"
      />
    </Tooltip>
  );

  // ------------------------------------------------------------------
  // 渲染逻辑：根据 tab 状态渲染 children
  // ------------------------------------------------------------------
  const mappedItems = items.map((item) => {
    if (item.key === HOME_TAB_KEY && item.children === "LOADING_HOME") {
      return {
        ...item,
        children: <HomePage onNewTab={handleNewTab} />,
      };
    }

    if (loadingTabs.has(item.key)) {
      return { ...item, children: <BrowserViewPlaceholder /> };
    }

    if (failedTabs[item.key]) {
      return {
        ...item,
        children: (
          <div style={{ padding: 20 }}>
            加载失败：{failedTabs[item.key] || "未知错误"}
          </div>
        ),
      };
    }

    return { ...item };
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
    </div>
  );
};

export default EditableTabsPage;
