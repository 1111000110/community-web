import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  message,
  Card,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { getLlmList, createLlm } from '../../api/llm';
import type { LlmDetail, CreateLlmReq } from '../../types/llm';
import CreateModal from './CreateModal';
import DetailModal from './DetailModal';

const { Text } = Typography;

const LlmPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLlm, setSelectedLlm] = useState<LlmDetail | null>(null);

  // 获取LLM列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['llmList'],
    queryFn: () => getLlmList(),
  });

  // 创建LLM
  const createMutation = useMutation({
    mutationFn: createLlm,
    onSuccess: () => {
      message.success('创建成功');
      setCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['llmList'] });
    },
    onError: () => {
      message.error('创建失败');
    },
  });

  const handleDetail = (llm: LlmDetail) => {
    setSelectedLlm(llm);
    setDetailModalOpen(true);
  };

  const columns: ColumnsType<LlmDetail> = [
    {
      title: 'ID',
      dataIndex: 'llm_id',
      key: 'llm_id',
      width: 80,
      render: (id) => <Text type="secondary">{id}</Text>,
    },
    {
      title: '模型名称',
      dataIndex: 'llm_name',
      key: 'llm_name',
      width: 200,
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: '供应商',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      width: 150,
      render: (supplier) => <Tag color="blue">{supplier}</Tag>,
    },
    {
      title: '供应商模型ID',
      dataIndex: 'supplier_model_id',
      key: 'supplier_model_id',
      width: 200,
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: '模型类型',
      dataIndex: 'llm_type',
      key: 'llm_type',
      width: 100,
      render: (type) => {
        const typeMap: Record<number, { text: string; color: string }> = {
          1: { text: '对话模型', color: 'green' },
          2: { text: '嵌入模型', color: 'blue' },
          3: { text: '图像模型', color: 'purple' },
        };
        const typeInfo = typeMap[type] || { text: '未知', color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 0 ? 'success' : status === -1 ? 'error' : 'default'}>
          {status === 0 ? '正常' : status === -1 ? '已删除' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'desc',
      key: 'desc',
      width: 200,
      ellipsis: true,
      render: (desc) => (
        <Tooltip title={desc}>
          <Text type="secondary">{desc || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleDetail(record)}
            >
              详情
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Typography.Title level={5} style={{ margin: 0 }}>
            LLM 模型列表
          </Typography.Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              添加 LLM
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data?.llm_detail || []}
          rowKey="llm_id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <CreateModal
        open={createModalOpen}
        loading={createMutation.isPending}
        onCancel={() => setCreateModalOpen(false)}
        onOk={(values: CreateLlmReq) => createMutation.mutate(values)}
      />

      <DetailModal
        open={detailModalOpen}
        llm={selectedLlm}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
};

export default LlmPage;
