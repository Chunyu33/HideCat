# Electron 自动更新配置指南

## 已完成的功能配置

### 1. 后端配置 (Main Process)
- ✅ 已配置 `autoUpdate.js` - 包含完整的自动更新逻辑
- ✅ 已配置 `ipcHandlers.js` - 添加了更新相关的 IPC 处理器
- ✅ 已配置 `package.json` - 设置了 GitHub 发布配置

### 2. 前端配置 (Renderer Process)
- ✅ 已创建 `UpdateChecker.jsx` - 更新检查组件
- ✅ 已配置 `preload.js` - 添加了更新相关的 API 桥接

## 使用说明

### 1. 在设置页面集成更新检查器
在你的设置页面中引入更新检查器组件：

```jsx
import UpdateChecker from '../components/UpdateChecker';

// 在设置页面中添加
<UpdateChecker />
```

### 2. 发布新版本到 GitHub
1. 更新 `package.json` 中的版本号
2. 创建 GitHub Release：
```bash
# 提交代码
git add .
git commit -m "发布版本 x.x.x"
git tag vx.x.x
git push origin main --tags
```

3. 在 GitHub 上创建 Release：
   - 访问 https://github.com/Chunyu33/HideCat/releases
   - 点击 "Draft a new release"
   - 输入标签版本 (如 v1.2.1)
   - 添加发布说明
   - 上传构建好的应用文件

### 3. 构建发布版本
```bash
npm run make
```

## 功能特性

- 🔄 **自动检查更新** - 应用启动时自动检查
- 📱 **手动检查** - 用户可手动触发检查
- 📊 **进度显示** - 下载进度可视化
- 🔔 **通知提醒** - 发现更新时弹出通知
- ⚡ **一键安装** - 下载完成后可立即重启安装

## 注意事项

1. **GitHub Token 配置** (可选)
   如果需要私有仓库或更高的 API 限制，可以配置 GitHub Token：
   - 在 GitHub 生成 Personal Access Token
   - 设置环境变量：`GH_TOKEN=your_token`

2. **开发环境**
   - 开发模式下自动更新功能会被禁用
   - 仅在打包后的生产环境中生效

3. **首次发布**
   - 首次配置需要发布一个正式版本到 GitHub
   - 后续版本会自动检测并更新

## 故障排除

如果更新功能不工作，检查：
1. GitHub 仓库配置是否正确
2. 版本号是否已更新
3. 发布文件是否已上传到 GitHub Release
4. 网络连接是否正常