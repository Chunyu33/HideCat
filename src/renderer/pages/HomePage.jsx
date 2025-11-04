import React, { useState } from "react";
import { Input, Typography, Button, Space, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import BrowserMark from "../components/BrowserMark";
import "./css/homepage.css";

const { Title, Text } = Typography;
const { Search } = Input;

const shortcuts = [
  { name: "SlackeFish", url: "https://www.evanspace.icu" },
  { name: "小红书", url: "https://www.xiaohongshu.com" },
  { name: "抖音", url: "https://www.douyin.com/" },
  { name: "知乎", url: "https://www.zhihu.com" },
  { name: "Bilibili", url: "https://www.bilibili.com" },
  { name: "番茄小说", url: "https://fanqienovel.com/" },
];

const BING_SEARCH_URL = "https://www.bing.com/search?q=";

const HomePage = ({ onNewTab, onUpdateTab, currentKey }) => {
  const [searchValue, setSearchValue] = useState("");

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
        {shortcuts.map((item, index) => (
          <div
            key={index}
            className="shortcut-item"
            onClick={() => handleShortcutClick(item)}
          >
            <div className="shortcut-icon">
              <BrowserMark size={22} />
            </div>
            <Text className="shortcut-text">{item.name}</Text>
          </div>
        ))}
      </Space>
    </div>
  );
};

export default HomePage;
