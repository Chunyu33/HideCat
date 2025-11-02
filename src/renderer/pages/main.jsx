// src/components/EditableTabsPage.js (最终整合版)

import React, { useState } from 'react';
import { Tabs, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import HomePage from './HomePage'; // 导入 HomePage
import IframePageView from '../components/IframePageView'; // 导入 Iframe 组件

// 初始标签页数据
const initialItems = [
  { 
    key: 'tab-home', 
    label: '主页', 
    children: 'LOADING_HOME', // 特殊标记，用于在渲染时替换成 HomePage 组件
    closable: false 
  },
];

const MAX_TABS = 5; 

const EditableTabsPage = () => {
  const [activeKey, setActiveKey] = useState(initialItems[0].key); 
  const [items, setItems] = useState(initialItems);
  const [nextUniqueId, setNextUniqueId] = useState(1); // 从 1 开始编号新 Tab

  const onChange = (key) => setActiveKey(key);

  // ------------------------------------------------------------------
  // 核心功能：添加新 Tab (接收来自 HomePage 的导航请求)
  // ------------------------------------------------------------------
  const addTab = ({ url, label, isNewTab = false }) => {
    // 如果不是新建 Tab，而是在当前 Tab 加载，这里需要更复杂的逻辑，
    // 但为简化，我们总是新建 Tab。
    
    if (items.length >= MAX_TABS) {
      message.warning(`最多只能添加 ${MAX_TABS} 个标签页。`);
      return;
    }
    
    const newId = nextUniqueId;
    const newKey = `web-tab-${newId}`;
    
    const newTab = {
      label: label.substring(0, 15), // 截断标签名防止过长
      // 传递 URL 给 IframePageView 组件
      children: <IframePageView url={url} />, 
      key: newKey,
    };
    
    const newItems = [...items, newTab];
    setItems(newItems);
    setActiveKey(newKey);
    setNextUniqueId(prevId => prevId + 1);
  };


  const remove = (targetKey) => {
    // ... (删除逻辑与之前保持一致)
    let newActiveKey = activeKey;
    let targetIndex = -1;

    items.forEach((item, i) => {
      if (item.key === targetKey) {
        targetIndex = i;
      }
    });

    const newItems = items.filter((item) => item.key !== targetKey);

    if (newActiveKey === targetKey) {
      let newIndex = targetIndex;
      if (newIndex >= newItems.length) {
        newIndex = newItems.length - 1;
      }
      if (newIndex >= 0) {
        newActiveKey = newItems[newIndex].key;
      } else {
        newActiveKey = ''; 
      }
    }

    setItems(newItems);
    setActiveKey(newActiveKey); 
  };

  const onEdit = (targetKey, action) => {
    if (action === 'remove') {
      remove(targetKey);
    }
    // 移除 'add' 分支，因为我们完全依赖自定义按钮的 addTab 函数
  };
  
  // 自定义 Tab Bar 的右侧操作按钮 (用于限制数量的按钮)
  const operations = (
    <Button 
      type="text" 
      icon={<PlusOutlined />} 
      onClick={() => addTab({ url: 'about:blank', label: '新标签页', isNewTab: true })} // 点击加号时创建空白新 Tab
      // ... (省略样式和禁用逻辑)
      disabled={items.length >= MAX_TABS}
      style={{ marginRight: 8, opacity: items.length >= MAX_TABS ? 0.5 : 1 }}
      aria-label="Add Tab"
    />
  );
  
  // ------------------------------------------------------------------
  // 渲染项映射：在渲染时将 'LOADING_HOME' 替换为 HomePage 组件
  // ------------------------------------------------------------------
  const mappedItems = items.map(item => {
    if (item.key === 'tab-home' && item.children === 'LOADING_HOME') {
      return {
        ...item,
        // 将 HomePage 组件作为第一个 Tab 的内容
        // 并将 addTab 函数作为 onNavigate 传递给 HomePage
        children: <HomePage onNavigate={addTab} />, 
      };
    }
    return item;
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Tabs
            type="editable-card"
            hideAdd={true} 
            activeKey={activeKey}
            onChange={onChange}
            onEdit={onEdit}
            items={mappedItems} // 使用映射后的 items
            tabBarExtraContent={operations}
            // 确保 Tabs 内容区域占据剩余所有空间
            style={{ flexGrow: 1, height: '100%' }}
            // 覆盖 Antd 默认样式，确保内容区高度正确
            tabBarStyle={{ marginBottom: 0 }}
            // 内容区域样式：让它撑满父级容器
            size="large"
            className="full-height-tabs"
        />
        {/* // 额外的CSS来修复 Antd Tabs 100% 高度问题:
        */}
    </div>
  );
};

export default EditableTabsPage;