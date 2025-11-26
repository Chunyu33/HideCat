import React, { useState, useEffect, useRef } from "react";
import { Tabs, Button, message, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import HomePage from "./HomePage";
import useTabEvents from "../hooks/useTabEvents"; // 保持使用
import WebViewSkeleton from "../components/WebViewSkeleton"; // 骨架屏组件
import "./css/main.css";

// Tab 常量
const HOME_TAB_KEY = "tab-home";
const initialItems = [
  {
    key: HOME_TAB_KEY,
    label: "主页",
    children: "LOADING_HOME",
    closable: false,
    // status: undefined 默认
  },
];
const MAX_TABS = 12;

const MainPage = () => {
  const [activeKey, setActiveKey] = useState(HOME_TAB_KEY);
  const [items, setItems] = useState(initialItems);
  const [loadingTabs, setLoadingTabs] = useState(() => new Set());
  const [failedTabs, setFailedTabs] = useState({});
  const itemsRef = useRef(items); // 保持最新 items 的引用

  // 保持 ref 与 state 同步，方便异步回调读取到最新 items
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // 使用 useTabEvents 来处理来自主进程的 tab 事件，
  // applyUpdater 会接收一个 updater 函数 (k, item) => newItem，
  // 我们在这里把它合并到 setItems 中，并同步更新 loadingTabs/failedTabs。
  useTabEvents((updater) => {
    setItems((prevItems) => {
      // 只响应加载失败事件
      const nextItems = prevItems.map((it) => {
        try {
          const updated = updater(it.key, it);
          if (updated?.status === "failed") {
            return updated; // 只更新失败状态的 tab
          }
          return it; // 其他状态不变
        } catch {
          return it;
        }
      });

      // 仅维护 failedTabs
      const nextFailed = {};
      nextItems.forEach((it) => {
        if (it?.status === "failed")
          nextFailed[it.key] = it.error || "加载失败";
      });

      setFailedTabs((_) => nextFailed);

      return nextItems;
    });
  });

  // 当 activeKey 变化时，自动告诉主进程切换 BrowserView
  // 这样任何地方 setActiveKey 都会同步到主进程
  useEffect(() => {
    if (window.electronAPI && activeKey) {
      // ipcRenderer.invoke 返回 Promise，因此可以 await（这里直接调用即可）
      window.electronAPI.setActiveTab(activeKey).catch((e) => {
        // 忽略或记录错误
        console.warn("setActiveTab failed", e);
      });
    }
  }, [activeKey]);

  const onChange = (key) => {
    setActiveKey(key);
  };

  // -----------------------------
  // 新建 tab：改为 async 顺序，先请求主进程创建 view (如果是网页),
  // 然后再更新 React state 并激活 activeKey
  // -----------------------------
  const handleNewTab = async (url = "about:blank", label = "新标签页") => {
    if (items.length >= MAX_TABS) {
      message.warning(`最多只能添加 ${MAX_TABS} 个标签页。`);
      return;
    }

    // ✅ 让主进程生成唯一 key
    const newKey = await window.electronAPI.createNewTab();

    const isWeb = url !== "about:blank";

    // 在前端先创建 tab UI
    const newTab = {
      key: newKey,
      label,
      children: isWeb ? (
        <WebViewSkeleton />
      ) : (
        <HomePage
          onNewTab={handleNewTab}
          onUpdateTab={updateTab}
          currentKey={newKey}
        />
      ),
      url,
      status: isWeb ? "loading" : "idle",
    };

    setItems((prev) => [...prev, newTab]);
    setActiveKey(newKey);

    // 如果是网页，再通知主进程加载
    if (isWeb) {
      await window.electronAPI.addTab(newKey, url);
    }
  };

  // 更新tab
  const updateTab = async (targetKey, url, label) => {
    // 更新前端 UI 状态
    setItems((prev) =>
      prev.map((it) => {
        if (it.key === targetKey) {
          return {
            ...it,
            label,
            url,
            status: "idle",
            children: <WebViewSkeleton />,
          };
        }
        return it;
      })
    );

    // 通知主进程在这个 tab 加载新页面
    // ✅ 先告诉主进程切换当前活动标签（保证加载目标是对的）
    await window.electronAPI.setActiveTab(targetKey);
    // ✅ 然后再通知主进程加载新的网页
    await window.electronAPI.addTab(targetKey, url);
  };

  // -----------------------------
  // 删除 tab
  // -----------------------------
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

    if (window.electronAPI && window.electronAPI.removeTab) {
      window.electronAPI.removeTab(targetKey).catch(() => {});
      // 不直接 setActiveTab 这里，由 useEffect(activeKey) 来处理新激活逻辑
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

  // 新建按钮
  const operations = (
    <Button
      title="新增标签页"
      type="text"
      icon={<PlusOutlined />}
      onClick={() => handleNewTab("about:blank", "新标签页")}
      disabled={items.length >= MAX_TABS}
      style={{ marginRight: 8, opacity: items.length >= MAX_TABS ? 0.5 : 1 }}
      aria-label="Add Tab"
    />
  );

  // 渲染逻辑
  const mappedItems = items.map((item) => {
    if (item.key === HOME_TAB_KEY && item.children === "LOADING_HOME") {
      return {
        ...item,
        children: (
          <HomePage
            onNewTab={handleNewTab}
            onUpdateTab={updateTab}
            currentKey={item.key}
          />
        ),
      };
    }

    // 如果 useTabEvents 已把 status 设置为 loading，则显示占位符
    if (loadingTabs.has(item.key) || item?.status === "loading") {
      return { ...item, children: <WebViewSkeleton /> };
    }

    if (failedTabs[item.key] || item?.status === "failed") {
      return {
        ...item,
        children: (
          <div style={{ padding: 20 }}>
            加载失败：{failedTabs[item.key] || item?.error || "未知错误"}
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

export default MainPage;
