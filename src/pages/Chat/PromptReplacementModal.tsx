import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Typography } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SettingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface PromptReplacementModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: Record<string, string>) => void;
  initialValues?: Record<string, string>;
  isDark: boolean;
}

const PromptReplacementModal: React.FC<PromptReplacementModalProps> = ({
  visible,
  onCancel,
  onOk,
  initialValues = {},
  isDark,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      // Convert object to array for Form.List
      const pairs = Object.entries(initialValues).map(([key, value]) => ({ key, value }));
      form.setFieldsValue({ pairs: pairs.length > 0 ? pairs : [{ key: '', value: '' }] });
    }
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const replacementMap: Record<string, string> = {};
      if (values.pairs) {
        values.pairs.forEach((pair: { key: string; value: string }) => {
          if (pair && pair.key && pair.key.trim()) {
            replacementMap[pair.key.trim()] = pair.value;
          }
        });
      }
      onOk(replacementMap);
    });
  };

  const bgColor = isDark ? '#1f1f1f' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const borderColor = isDark ? '#303030' : '#d9d9d9';

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>Prompt 参数配置</span>
        </Space>
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={600}
      okText="确认"
      cancelText="取消"
      styles={{
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
        },
      }}
      // Modal 自身的 style 属性不支持直接设置 content 的背景色，
      // 但 antd v5 的 ConfigProvider 可以在上层控制，或者使用 styles.content (如果支持) 或者通过 className
      // 这里简单处理，如果 isDark 为真，外层 ConfigProvider 应该已经处理了
      // 如果没有，我们可能需要手动处理一些样式，但尽量依赖 antd 的 theme token
    >
      <div style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          配置 Key-Value 参数，用于在 Agent 执行时动态替换 Prompt 中的变量。
        </Text>
        
        <Form form={form} layout="vertical" name="prompt_replacement_form">
          <Form.List name="pairs">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'key']}
                      rules={[{ required: true, message: '请输入 Key' }]}
                      style={{ width: 200, marginBottom: 0 }}
                    >
                      <Input placeholder="Key (e.g. user_name)" />
                    </Form.Item>
                    <div style={{ lineHeight: '32px', color: textColor }}>:</div>
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      rules={[{ required: true, message: '请输入 Value' }]}
                      style={{ width: 280, marginBottom: 0 }}
                    >
                      <Input placeholder="Value (e.g. Alice)" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加参数
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </div>
    </Modal>
  );
};

export default PromptReplacementModal;
