import React from 'react';
import { Modal, Form, Input, Select } from 'antd';
import type { CreateLlmReq } from '../../types/llm';

const { TextArea } = Input;

interface CreateModalProps {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onOk: (values: CreateLlmReq) => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ open, loading, onCancel, onOk }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
      form.resetFields();
    } catch (error) {
      // 表单验证失败
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="添加 LLM 模型"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          llm_type: 1,
        }}
      >
        <Form.Item
          name="llm_name"
          label="模型名称"
          rules={[{ required: true, message: '请输入模型名称' }]}
        >
          <Input placeholder="例如：豆包-128K" />
        </Form.Item>

        <Form.Item
          name="supplier_name"
          label="供应商"
          rules={[{ required: true, message: '请输入供应商' }]}
        >
          <Input placeholder="例如：doubao、openai、deepseek" />
        </Form.Item>

        <Form.Item
          name="supplier_model_id"
          label="供应商模型ID"
          rules={[{ required: true, message: '请输入供应商模型ID' }]}
        >
          <Input placeholder="例如：doubao-pro-128k" />
        </Form.Item>

        <Form.Item
          name="llm_type"
          label="模型类型"
          rules={[{ required: true, message: '请选择模型类型' }]}
        >
          <Select>
            <Select.Option value={1}>对话模型</Select.Option>
            <Select.Option value={2}>嵌入模型</Select.Option>
            <Select.Option value={3}>图像模型</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="desc"
          label="描述"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <TextArea rows={3} placeholder="请输入模型描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateModal;
