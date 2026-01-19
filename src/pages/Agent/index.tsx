import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  message,
  Card,
  Avatar,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { getAgentList, createAgent, deleteAgent } from '../../api/agent';
import { getLlmList } from '../../api/llm';
import type { AgentDetail, CreateAgentReq, LlmInfo } from '../../types/agent';
import CreateModal from './CreateModal';
import DetailModal from './DetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';

const { Text, Paragraph } = Typography;

const AgentPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 获取Agent列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['agentList', showAll],
    queryFn: () => getAgentList({ is_all: showAll }),
  });

  // 获取LLM列表用于显示
  const { data: llmData } = useQuery({
    queryKey: ['llmList'],
    queryFn: () => getLlmList(),
  });

  // 每次列表数据更新后，同步更新通用缓存（不带 showAll 参数）
  // 这样 Chat 页面可以获取到最新的列表数据
  useEffect(() => {
    if (data) {
      queryClient.setQueryData(['agentList'], data);
    }
  }, [data, queryClient]);

  // 创建Agent
  const createMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      message.success('创建成功');
      setCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['agentList'] });
    },
    onError: () => {
      message.error('创建失败');
    },
  });

  // 删除Agent
  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      message.success('删除成功');
      setDeleteModalOpen(false);
      setSelectedAgent(null);
      queryClient.invalidateQueries({ queryKey: ['agentList'] });
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  const handleRun = (agentRecord: { agent_detail: AgentDetail; llm_detail?: LlmInfo }) => {
    navigate(`/chat/${agentRecord.agent_detail.agent_id}`);
  };

  const handleDetail = (agentRecord: { agent_detail: AgentDetail; llm_detail?: LlmInfo }) => {
    setSelectedAgent(agentRecord.agent_detail);
    setDetailModalOpen(true);
  };

  const handleDelete = (agentRecord: { agent_detail: AgentDetail; llm_detail?: LlmInfo }) => {
    setSelectedAgent(agentRecord.agent_detail);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedAgent) {
      deleteMutation.mutate({
        agent_id: selectedAgent.agent_id,
        api_key: selectedAgent.api_key || '',
      });
    }
  };

  const columns: ColumnsType<{ agent_detail: AgentDetail; llm_detail?: LlmInfo }> = [
    {
      title: 'ID',
      dataIndex: ['agent_detail', 'agent_id'],
      key: 'agent_id',
      width: 80,
      render: (id) => <Text type="secondary">{id}</Text>,
    },
    {
      title: 'Agent',
      dataIndex: ['agent_detail', 'name'],
      key: 'name',
      width: 240,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.agent_detail.icon}
            icon={<RobotOutlined />}
            style={{ backgroundColor: '#1677ff' }}
          />
          <Text strong>{record.agent_detail.name}</Text>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: ['agent_detail', 'desc'],
      key: 'desc',
      width: 200,
      ellipsis: true,
      render: (desc) => (
        <Tooltip title={desc || ''}>
          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
            {desc || '-'}
          </Paragraph>
        </Tooltip>
      ),
    },
    {
      title: '模型',
      key: 'model',
      width: 180,
      render: (_, record) => {
        const llm = record.llm_detail;
        return (
          <Space direction="vertical" size={0}>
            <Tag color="blue">
              {llm?.llm_name || '未知模型'}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {llm?.supplier_name || '-'}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: ['agent_detail', 'status'],
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 0 ? 'success' : status === -1 ? 'error' : 'default'}>
          {status === 0 ? '正常' : status === -1 ? '已删除' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: ['agent_detail', 'create_time'],
      key: 'create_time',
      width: 180,
      render: (time) =>
        time ? new Date(time * 1000).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
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
          <Tooltip title="运行Agent">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleRun(record)}
              disabled={record.agent_detail.status !== 0}
            >
              运行
            </Button>
          </Tooltip>
          <Tooltip title="删除Agent">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              disabled={record.agent_detail.status === -1}
            >
              删除
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
            Agent 列表
          </Typography.Title>
          <Space>
            <Space size={4}>
              <span>显示全部</span>
              <Switch
                size="small"
                checked={showAll}
                onChange={(checked) => setShowAll(checked)}
              />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              创建 Agent
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data?.agent_list || []}
          rowKey={(record) => record.agent_detail.agent_id}
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
        onOk={(values: CreateAgentReq) => createMutation.mutate(values)}
      />

      <DetailModal
        open={detailModalOpen}
        agent={selectedAgent}
        onClose={() => setDetailModalOpen(false)}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        agent={selectedAgent}
        loading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default AgentPage;
