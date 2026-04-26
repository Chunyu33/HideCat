import React, { useState, useEffect } from "react";
import { Input, Typography, Space, Tooltip, message } from "antd";
import { SearchOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import Favicon from "../components/Favicon";
import defaultShortcuts from "../services/defaultShortcuts";
import {
  buildSearchUrl,
  getSearchPlaceholder,
  useSearchEngine,
} from "../services/searchEngine";
import ShortcutListModal from "../components/ShortcutListModal";
import AddShortcutModal from "../components/AddShortcutModal";
import { useShortcutStore } from "../store/useShortcutStore";
import "./css/homepage.css";
import WebViewSkeleton from "../components/WebViewSkeleton"; // 骨架屏
import CatBadgeCanvas from "../components/CatBadgeCanvas";

const { Title, Text } = Typography;
const { Search } = Input;

// 此组件仅处理主页 没有tab相关的逻辑
const HomePageOnly = ({ onUpdateTab, currentKey }) => {
  const [searchValue, setSearchValue] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [isSkeletonVisible, setSkeletonVisible] = useState(false);
  const [hiddenDefaultShortcutIds, setHiddenDefaultShortcutIds] = useState([]);
  const searchEngine = useSearchEngine("bing");

  const { shortcuts, initialized, initShortcuts, addShortcut, deleteShortcut } =
    useShortcutStore();

  useEffect(() => {
    if (!initialized) {
      initShortcuts();
    }
  }, [initialized, initShortcuts]);

  useEffect(() => {
    // 初始化：从主进程读取“被隐藏的默认快捷入口”列表
    // 说明：默认快捷入口的删除行为是“隐藏”，所以需要单独维护一份 id 列表
    const initHidden = async () => {
      const ids = await window.electronAPI.getHiddenDefaultShortcuts?.();
      setHiddenDefaultShortcutIds(Array.isArray(ids) ? ids : []);
    };
    initHidden();
  }, []);

  useEffect(() => {
    // 监听主进程通知：当 BrowserView 右键“收藏到快捷入口”后，自动刷新主页快捷入口
    // 这里采用最小实现：收到事件后重新从 store 拉取一次列表，避免在渲染层重复拼装逻辑
    const off = window.electronAPI.onShortcutsUpdated?.((payload) => {
      initShortcuts();

      // 若主进程顺带通知了隐藏列表，也一并刷新（兼容 payload 为数组/对象/空）
      if (payload && Array.isArray(payload.hiddenDefaultShortcutIds)) {
        setHiddenDefaultShortcutIds(payload.hiddenDefaultShortcutIds);
      }
    });

    return () => {
      if (typeof off === "function") off();
    };
  }, [initShortcuts]);

  // 合并默认和用户快捷方式并按排序字段排序（数字越小越靠前）
  const hiddenSet = new Set(hiddenDefaultShortcutIds || []);
  const visibleDefaultShortcuts = defaultShortcuts.filter((it) => {
    // 兼容 defaultShortcuts.js 里没加 isDel/delAble 的老数据
    if (hiddenSet.has(it.id)) return false;
    if (it.isDel === true) return false;
    return true;
  });

  const allShortcuts = [...visibleDefaultShortcuts, ...shortcuts].sort((a, b) => {
    const sortA = a.sort || 0;
    const sortB = b.sort || 0;
    return sortA - sortB;
  });

  // 搜索功能
  const handleSearch = (value) => {
    if (!value) {
      message.warning("请输入搜索关键词或网址");
      return;
    }

    let targetUrl = value;
    let tabName = value;

    if (value.includes(".") && value.length > 5 && !value.startsWith("http")) {
      targetUrl = "http://" + value;
    } else if (!value.includes(".")) {
      targetUrl = buildSearchUrl(value, searchEngine);
      tabName = `搜索: ${value}`;
    }
    // 显示骨架屏
    setSkeletonVisible(true);
    onUpdateTab(currentKey, targetUrl, tabName, hideWebViewSkeleton);
    setSearchValue("");
  };

  // 点击快捷方式打开
  const handleShortcutClick = (item) => {
    // 显示骨架屏
    setSkeletonVisible(true);
    // 2. 加载网页
    onUpdateTab(currentKey, item.url, item.name, hideWebViewSkeleton);
  };

  const hideWebViewSkeleton = () => {
    setTimeout(() => {
      setSkeletonVisible(false); // 延迟隐藏骨架屏
    }, 1600);
  };

  // 特殊按钮（添加、更多）
  const displayedShortcuts = [
    ...allShortcuts.slice(0, 10),
    { name: "更多", url: "more", icon: <MoreOutlined /> },
    { name: "添加", url: "add", icon: <PlusOutlined /> },
  ];

  const handleSpecialClick = (item) => {
    if (item.url === "add") {
      setShowAddModal(true);
    } else if (item.url === "more") {
      setShowMoreModal(true);
    } else {
      handleShortcutClick(item);
    }
  };

  const handleAddShortcut = async (newItem) => {
    await addShortcut(newItem);
    message.success("已添加快捷方式");
  };

  const handleDeleteShortcut = async (item) => {
    // 默认快捷入口：delAble=true 才允许“删除=隐藏”
    if (item?.system) {
      if (!item?.delAble) return;
      await window.electronAPI.hideDefaultShortcut?.(item.id);
      message.success("已隐藏快捷入口");
      return;
    }

    // 自定义快捷入口：保持原有逻辑（真删除 store 里的数据）
    await deleteShortcut(item.id);
    message.success("已删除快捷方式");
  };

  return (
    <div
      className="home-page"
      style={{
        minWidth: 350,
        textAlign: "center",
        padding: "60px 20px",
      }}
    >
      {/* 展示骨架屏 */}
      {isSkeletonVisible && <WebViewSkeleton />}

      <div className="cat-title-shell">
        <CatBadgeCanvas className="cat-title-badge" type="paw" size={26} />
        <Title
          className="cat-title"
          level={1}
          style={{
            color: "var(--text-color-title)",
            fontSize: "2.6rem",
            fontWeight: 300,
            marginBottom: 0,
            userSelect: "none",
          }}
        >
          躲躲猫
        </Title>
        <CatBadgeCanvas className="cat-title-badge" type="paw" size={26} />
        <CatBadgeCanvas className="cat-title-corner-paw" type="paw" size={18} />
      </div>

      <Search
        placeholder={getSearchPlaceholder(searchEngine)}
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onSearch={handleSearch}
        style={{
          width: "min(600px, 90%)",
          marginBottom: 50,
        }}
      />

      <Space
        size={24}
        wrap
        align="center"
        style={{
          justifyContent: "center",
          rowGap: 30,
          maxWidth: 600,
        }}
      >
        {displayedShortcuts.map((item, index) => (
          <div
            key={index}
            className="shortcut-item"
            onClick={() => handleSpecialClick(item)}
            style={{ cursor: "pointer" }}
          >
            <div className="shortcut-icon">
              {item.icon || <Favicon url={item.url} size={22} />}
            </div>
            <Tooltip title={item.name} placement="bottom" color="var(--button-bg-hover)"
              styles={{ body: { color: "var(--text-color)" } }}>
              <Text className="shortcut-text">{item.name}</Text>
            </Tooltip>
          </div>
        ))}
      </Space>

      {/* 更多模态框 */}
      <ShortcutListModal
        open={showMoreModal}
        shortcuts={allShortcuts}
        onSelect={(item) => {
          setShowMoreModal(false);
          handleShortcutClick(item);
        }}
        onDelete={(item) => handleDeleteShortcut(item)}
        onClose={() => setShowMoreModal(false)}
      />

      {/* 添加模态框 */}
      <AddShortcutModal
        open={showAddModal}
        onAdd={handleAddShortcut}
        onClose={() => setShowAddModal(false)}
      />

      {/* <footer className="copyright">
        Copyright © {new Date().getFullYear()} 躲躲猫. All rights reserved.
      </footer> */}
    </div>
  );
};

export default HomePageOnly;
