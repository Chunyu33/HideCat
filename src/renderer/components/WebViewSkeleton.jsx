import React from "react";
import { Skeleton } from "antd";

const WebViewSkeleton = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "24px 32px",
        boxSizing: "border-box",
      }}
    >
      {/* 顶部搜索栏骨架 */}
      <Skeleton.Input
        active
        size="large"
        block
        style={{ width: "60%", marginBottom: 24 }}
      />

      {/* 主体骨架内容 */}
      <div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebViewSkeleton;
