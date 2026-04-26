import React from "react";
import { Modal, List, Typography, Button, Popconfirm, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import Favicon from "./Favicon";

const { Text } = Typography;

const ShortcutListModal = ({
  open,
  shortcuts = [],
  onSelect,
  onDelete,
  onClose,
}) => {
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
      styles={{
        header: {
          background: "var(--background-secondary)",
          color: "var(--text-color)",
        },
        content: {
          background: "var(--background-secondary)",
          color: "var(--text-color)",
        },
      }}
    >
      <List
        style={{
          height: "60vh",
          overflowY: "auto",
          borderRadius: 8,
          padding: "6px 8px",
          background: "var(--background-secondary)",
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
              color: "var(--text-color)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--hover-bg-color)";
              e.currentTarget.style.boxShadow = "0 1px 3px var(--shadow-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              onClick={() => onSelect?.(item)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Favicon url={item.url} size={20} />
              <div style={{ overflow: "hidden" }}>
                <Text
                  strong
                  ellipsis
                  style={{
                    display: "block",
                    maxWidth: 260,
                    color: "var(--text-color)",
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  type="secondary"
                  ellipsis
                  style={{
                    display: "block",
                    maxWidth: 260,
                    color: "var(--text-color-secondary)",
                  }}
                >
                  {item.url}
                </Text>
              </div>
            </div>
            {/* 删除按钮：
                - 自定义快捷入口：真删除
                - 默认快捷入口：若 delAble=true，则允许“删除=隐藏” */}
            {(!item.system || item.delAble) ? (
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
                  onClick={(e) => e.stopPropagation()}
                  danger
                  style={{
                    color: "var(--text-color-secondary)",
                  }}
                />
              </Popconfirm>
            ) : null}
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default ShortcutListModal;
