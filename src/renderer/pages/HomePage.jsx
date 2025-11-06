import React, { useState, useEffect } from "react";
import { Input, Typography, Space, message } from "antd";
import { SearchOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import BrowserMark from "../components/BrowserMark";
import defaultShortcuts from "../services/defaultShortcuts";
import ShortcutListModal from "../components/ShortcutListModal";
import AddShortcutModal from "../components/AddShortcutModal";
import "./css/homepage.css";

const { Title, Text } = Typography;
const { Search } = Input;

const BING_SEARCH_URL = "https://www.bing.com/search?q=";

const HomePage = ({ onNewTab, onUpdateTab, currentKey }) => {
  const [searchValue, setSearchValue] = useState("");
  const [userShortcuts, setUserShortcuts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);

  // 初始加载 store 数据
  useEffect(() => {
    window.electronAPI.getShortcuts().then((res) => {
      setUserShortcuts(res || []);
    });
  }, []);

  const allShortcuts = [...defaultShortcuts, ...userShortcuts];

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
      targetUrl = BING_SEARCH_URL + encodeURIComponent(value);
      tabName = `搜索: ${value}`;
    }

    if (currentKey === "tab-home") {
      onNewTab(targetUrl, tabName);
    } else {
      onUpdateTab(currentKey, targetUrl, tabName);
    }
    setSearchValue("");
  };

  const handleShortcutClick = (item) => {
    if (currentKey === "tab-home") {
      onNewTab(item.url, item.name);
    } else {
      onUpdateTab(currentKey, item.url, item.name);
    }
  };

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

  // 添加快捷方式
  const handleAddShortcut = async (newItem) => {
    const updated = await window.electronAPI.addShortcut(newItem);
    console.log("\n--------更新完毕===", updated);
    setUserShortcuts(updated);
  };
  // 删除快捷方式
  const handleDeleteShortcut = async (id) => {
    const updated = await window.electronAPI.removeShortcut(id);
    console.log("\n--------删除完毕===", updated);
    setUserShortcuts(updated);
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
      <Title
        level={1}
        style={{
          color: "#6A7D8F",
          fontSize: "2.6rem",
          fontWeight: 300,
          marginBottom: 36,
          userSelect: "none",
        }}
      >
        SlackeFish
      </Title>

      <Search
        placeholder="在 Bing 上搜索，或者输入一个网址"
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
              {item.icon || <BrowserMark size={22} />}
            </div>
            <Text className="shortcut-text">{item.name}</Text>
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
        onDelete={(item) => {
          handleDeleteShortcut(item.id);
        }}
        onClose={() => setShowMoreModal(false)}
      />

      {/* 添加模态框 */}
      <AddShortcutModal
        open={showAddModal}
        onAdd={handleAddShortcut}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};

export default HomePage;
