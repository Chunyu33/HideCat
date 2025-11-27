import React, { useState } from "react";
import { Modal, Form, Input, InputNumber, message } from "antd";

/**
 * props:
 * - open: 是否显示
 * - onAdd: 添加完成时回调({ name, url, sort })
 * - onClose: 关闭回调
 */
const AddShortcutModal = ({ open, onAdd, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const { name, url, sort = 0 } = values;

      // 简单 URL 校验
      if (!/^https?:\/\//.test(url)) {
        message.warning("URL 应以 http:// 或 https:// 开头");
        return;
      }

      setLoading(true);
      onAdd?.({ ...values, sort: sort || 0 });
      form.resetFields();
      setLoading(false);
      message.success(`已添加快捷方式: ${name}`);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      title="添加快捷入口"
      open={open}
      okText="添加"
      cancelText="取消"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      styles={{
        maxHeight: "60vh",
        overflowY: "auto",
        padding: "12px 20px",
      }}
    >
      <Form
        form={form}
        initialValues={{ name: "", url: "", sort: 0 }}
        style={{
          marginTop: '20px'
        }}
      >
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: "请输入名称" }]}
        >
          <Input placeholder="例如：知乎" />
        </Form.Item>
        <Form.Item
          label="网址"
          name="url"
          rules={[{ required: true, message: "请输入网址" }]}
        >
          <Input placeholder="例如：https://www.zhihu.com" />
        </Form.Item>
        <Form.Item
          label="排序"
          name="sort"
          tooltip="数字越小，排序越靠前"
          rules={[
            { required: false },
            {
              validator: (_, value) => {
                if (value === undefined || value === null || value === '') {
                  return Promise.resolve();
                }
                if (typeof value !== 'number' || isNaN(value)) {
                  return Promise.reject(new Error('请输入有效的数字'));
                }
                if (value < 0) {
                  return Promise.reject(new Error('排序值不能小于0'));
                }
                if (!Number.isInteger(value)) {
                  return Promise.reject(new Error('请输入整数'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber 
            min={0} 
            placeholder="例如：1" 
            style={{ width: '100%' }}
            controls={false}
            onChange={(value) => {
              // 实时过滤输入值，只保留数字
              if (value && typeof value === 'string') {
                const numericValue = value.replace(/[^\d]/g, '');
                if (numericValue !== value) {
                  form.setFieldValue('sort', numericValue ? parseInt(numericValue) : 0);
                }
              }
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddShortcutModal;
