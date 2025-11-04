// src/components/HomePage.js (精简版)

import React, { useState } from "react";
import { Input, Space, Typography, Button, message, Card } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import "./css/homepage.css";

const { Title, Text } = Typography;
const { Search } = Input;

// 假设的快捷入口数据
const shortcuts = [
  { name: "SlackeFish", icon: "🚀", url: "https://www.google.com" }, // 简化的图标
  { name: "小红书", icon: "📕", url: "https://www.xiaohongshu.com" },
];

const BING_SEARCH_URL = "https://www.bing.com/search?q=";

// 接受 onNewTab 属性 (由 Tab 父组件传入)
const HomePage = ({ onNewTab, onUpdateTab, currentKey }) => {
  const [searchValue, setSearchValue] = useState("");

  // 搜索框提交事件处理
  const handleSearch = (value) => {
    if (!value) {
      message.warning("请输入搜索关键词或网址");
      return;
    }

    let targetUrl = value;
    let tabName = value;

    // 简单的网址/关键词判断
    if (value.includes(".") && value.length > 5 && !value.startsWith("http")) {
      targetUrl = "http://" + value;
    } else if (!value.includes(".")) {
      // 关键词搜索
      targetUrl = BING_SEARCH_URL + encodeURIComponent(value);
      tabName = `搜索: ${value}`;
    }

    // 调用父组件传入的回调函数
    // onNewTab(targetUrl, tabName);
    // 👇 判断当前 tab 是主页还是新建页
    if (currentKey === "tab-home") {
      onNewTab(targetUrl, tabName); // 主页 -> 新开
    } else {
      onUpdateTab(currentKey, targetUrl, tabName); // 新建页 -> 替换当前
    }
    setSearchValue("");
  };

  // 快捷入口点击事件
  const handleShortcutClick = (item) => {
    // onNewTab(item.url, item.name);
    if (currentKey === "tab-home") {
      onNewTab(item.url, item.name);
    } else {
      onUpdateTab(currentKey, url, item.name);
    }
  };

  return (
    <div className="home-page">
      <Title
        level={1}
        style={{
          color: "#6A7D8F",
          fontSize: "3rem",
          fontWeight: 300,
          marginBottom: 50,
        }}
      >
        SlackeFish
      </Title>

      {/* 搜索框 */}
      <Search
        placeholder={"在 Bing 上搜索，或者输入一个网址"}
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onSearch={handleSearch}
        style={{ width: "min(600px, 90%)", marginBottom: 40 }}
      />

      {/* 快捷入口区域 */}
      <Space size={32} wrap>
        {shortcuts.map((item, index) => (
          <Card
            key={index}
            hoverable
            onClick={() => handleShortcutClick(item)}
            style={{ width: 100, borderRadius: 8, textAlign: "center" }}
            styles={{
              body: { padding: "12px 0" }, // 👈 替换为 styles 属性和 body 键
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Button
                shape="circle"
                icon={item.icon}
                size="large"
                style={{
                  marginBottom: 8,
                  backgroundColor: "#FFF",
                  borderColor: "#EFEFEF",
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </Button>
              <Text type="secondary">{item.name}</Text>
            </div>
          </Card>
        ))}
        {/* ... 添加快捷方式按钮 ... */}
      </Space>
    </div>
  );
};

export default HomePage;
