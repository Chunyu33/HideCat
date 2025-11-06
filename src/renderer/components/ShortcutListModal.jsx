import React from "react";
import { Modal, List, Typography, Button, Popconfirm, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import BrowserMark from "./BrowserMark";

const { Text } = Typography;

/**
 * props:
 * - open: 是否显示
 * - shortcuts: 快捷方式数组 [{name, url}]
 * - onSelect: 点击快捷方式时回调(item)
 * - onDelete: 删除回调(item)
 * - onClose: 关闭回调
 */
const ShortcutListModal = ({ open, shortcuts = [], onSelect, onDelete, onClose }) => {
  const handleDelete = async (item) => {
    await onDelete?.(item);
    message.success("已删除快捷方式");
  };

  return (
    <Modal
      title="全部快捷入口"
      open={open}
      footer={null}
      onCancel={onClose}
    >
      <List
        style={{
          height: "60vh",
          overflowY: "auto",
          borderRadius: 8,
          padding: "6px 8px",
          background: "#fff",
        }}
        dataSource={shortcuts}
        renderItem={(item) => (
          <List.Item
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 6,
              transition: "background 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fafafa";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              onClick={() => onSelect?.(item)}
              style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}
            >
              <BrowserMark size={20} />
              <div style={{ overflow: "hidden" }}>
                <Text strong ellipsis style={{ display: "block", maxWidth: 260 }}>
                  {item.name}
                </Text>
                <Text type="secondary" ellipsis style={{ display: "block", maxWidth: 260 }}>
                  {item.url}
                </Text>
              </div>
            </div>

            <Popconfirm
              title="确认删除？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => handleDelete(item)}
              placement="left"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()} // 防止触发 onSelect
                danger
              />
            </Popconfirm>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default ShortcutListModal;
