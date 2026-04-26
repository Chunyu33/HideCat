# HideCat（躲躲猫）

一个基于 `Electron + React + Vite + Ant Design` 的桌面轻浏览器应用。  
它的目标是：让你用最小干扰的方式，在工作与日常浏览之间快速切换。

当前项目已开源。

## 功能介绍

### 1) 主窗口与交互
- 无边框主窗口，支持手动拖拽、最小化、最大化/还原、关闭
- 托盘常驻（显示窗口 / 隐藏窗口 / 退出）
- 支持窗口置顶
- 自动隐藏模式（鼠标离开隐藏、移入显示）

### 2) 标签页浏览（BrowserView）
- 多标签浏览，支持新增、切换、关闭
- 支持后退、前进、刷新、回到主页
- 页面加载状态同步（加载中 / 完成 / 失败）
- 非标准协议拦截（避免系统弹窗干扰）

### 3) 首页快捷入口
- 内置默认快捷入口 + 用户自定义快捷入口
- 支持新增、删除、排序字段（数值越小越靠前）
- 默认入口删除为“隐藏”机制（可恢复）
- BrowserView 右键菜单支持“收藏到快捷入口”
- 自动加载网站 favicon（失败自动回退默认图标）

### 4) 设置中心
- 通用设置：
  - 自动隐藏
  - 透明边框（需重启生效）
  - 窗口透明度
  - 自动适配缩放 / 手动网页缩放
  - 主题（浅色 / 深色 / 跟随系统）
  - 搜索引擎（Bing / Google）
- 快捷键设置：
  - 显示窗口 / 隐藏窗口 / 退出应用全局快捷键可录制与保存
  - 支持恢复默认、冲突回退
- 意见反馈与关于页

### 5) 自动更新
- 基于 `electron-updater`
- 支持手动检查更新
- 支持自动检查、下载进度、下载后重启安装
- 发布源配置为 GitHub Releases

### 6) 主题与视觉
- 支持亮/暗主题切换
- 主界面动态背景
- 设置页与主界面主题联动

## 项目架构

项目采用 Electron 典型三层架构：

1. **Main 进程（`src/main`）**
   - 窗口生命周期管理
   - BrowserView 标签管理
   - 全局快捷键注册
   - 持久化配置（`electron-store`）
   - 自动更新与系统能力（托盘、通知、外链）

2. **Preload 桥接层（`src/preload`）**
   - 通过 `contextBridge` 暴露白名单 API 到渲染层
   - 统一 IPC 通道，避免渲染层直接使用 Node 能力

3. **Renderer 渲染层（`src/renderer`）**
   - React 页面与组件
   - Tab UI 与设置 UI
   - Zustand 状态管理（快捷入口）
   - 与 Main 进程通过 `window.electronAPI` 通信

## 关键模块说明

- `src/main/main.js`：应用入口，创建主窗口/托盘，注册 IPC 与全局快捷键
- `src/main/windowControl.js`：窗口控制、自动隐藏、BrowserView、快捷入口与主题/搜索设置核心逻辑
- `src/main/ipcHandlers.js`：IPC 路由注册
- `src/main/shortcuts.js`：全局快捷键管理与冲突处理
- `src/main/browserViewBindings.js`：BrowserView 事件绑定（加载状态、右键菜单、收藏快捷入口）
- `src/main/autoUpdate.js`：自动更新流程
- `src/preload/preload.js`：渲染层 API 暴露
- `src/renderer/pages/main.jsx`：主页面与标签页容器
- `src/renderer/pages/HomePage.jsx` / `HomePageOnly.jsx`：主页（搜索 + 快捷入口）
- `src/renderer/components/SettingMenu.jsx`：设置中心

## 目录结构

```text
src
├─ assets/                 # 图标与静态资源
├─ main/                   # Electron Main 进程
│  ├─ main.js
│  ├─ windowControl.js
│  ├─ ipcHandlers.js
│  ├─ browserViewBindings.js
│  ├─ shortcuts.js
│  ├─ autoUpdate.js
│  └─ store.js
├─ preload/                # 预加载脚本
│  └─ preload.js
├─ renderer/               # React 渲染层
│  ├─ App.jsx
│  ├─ pages/
│  ├─ components/
│  ├─ hooks/
│  ├─ services/
│  └─ store/
└─ scripts/
   └─ generateIcons.js     # SVG 生成 PNG/ICO 图标脚本
```

## 技术栈

- Electron 39
- React 18
- Vite 7
- Ant Design 5
- Zustand
- electron-store
- electron-updater

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run start
```

> 渲染层由 Vite 提供开发服务；Electron 主进程通过 `cross-env NODE_ENV=development electron .` 启动。

### 构建渲染层

```bash
npm run build:renderer
```

### 打包应用

```bash
npm run make
```

## 图标生成

图标源文件为：`src/assets/icon.svg`  
生成脚本：`src/scripts/generateIcons.js`

执行：

```bash
node src/scripts/generateIcons.js
```

会生成：
- `src/assets/app.png`
- `src/assets/app.ico`

## 开源与许可证

本项目已开源，使用 MIT License。详见根目录 `LICENSE` 文件。

## 作者

- Evan Lau（刘春渝）
- Email: `1378813463@qq.com`
- GitHub: `https://github.com/Chunyu33/HideCat`
