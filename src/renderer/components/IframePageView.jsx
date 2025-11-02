import React from "react";
import { Spin } from "antd";

const IframePageView = ({ url }) => {
  // 注意：Antd 的 Spin 组件通常用于包裹需要加载的内容，
  // 但 iframe 加载状态难以完美同步。这里仅作示例。

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* ⚠️ 警告: 使用 iframe 嵌入外部内容需要仔细考虑安全性 ⚠️ */}
      <iframe
        src={url}
        style={{
          border: "none",
          width: "100%",
          height: "100%",
          display: "block",
        }}
        // sandbox="allow-scripts allow-forms allow-same-origin" // 增加安全限制，但可能破坏某些网站
        title={`WebView for ${url}`}
      />
    </div>
  );
};

export default IframePageView;
