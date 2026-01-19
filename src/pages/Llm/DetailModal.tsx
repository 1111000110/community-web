import React from 'react';
import { Modal, Descriptions, Tag } from 'antd';
import type { LlmDetail } from '../../types/llm';

interface DetailModalProps {
  open: boolean;
  llm: LlmDetail | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ open, llm, onClose }) => {
  if (!llm) return null;

  const typeMap: Record<number, { text: string; color: string }> = {
    1: { text: '对话模型', color: 'green' },
    2: { text: '嵌入模型', color: 'blue' },
    3: { text: '图像模型', color: 'purple' },
  };

  const typeInfo = typeMap[llm.llm_type] || { text: '未知', color: 'default' };

  return (
    <Modal
      title="LLM 模型详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="模型ID" span={2}>
          {llm.llm_id}
        </Descriptions.Item>
        <Descriptions.Item label="模型名称" span={2}>
          {llm.llm_name}
        </Descriptions.Item>
        <Descriptions.Item label="供应商">
          <Tag color="blue">{llm.supplier_name}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="模型类型">
          <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="供应商模型ID" span={2}>
          <code>{llm.supplier_model_id}</code>
        </Descriptions.Item>
        <Descriptions.Item label="状态" span={2}>
          <Tag color={llm.status === 0 ? 'success' : llm.status === -1 ? 'error' : 'default'}>
            {llm.status === 0 ? '正常' : llm.status === -1 ? '已删除' : '已禁用'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>
          {llm.desc || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default DetailModal;
