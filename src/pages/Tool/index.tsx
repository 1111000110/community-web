import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tooltip,
  Card,
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { getToolList } from '../../api/tool';
import type { ToolDetail } from '../../types/tool';
import DetailModal from './DetailModal';

const { Text } = Typography;

const ToolPage: React.FC = () => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolDetail | null>(null);

  // 获取工具列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['toolList'],
    queryFn: () => getToolList(),
  });

  const handleDetail = (tool: ToolDetail) => {
    setSelectedTool(tool);
    setDetailModalOpen(true);
  };

  const columns: ColumnsType<ToolDetail> = [
    {
      title: '工具名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
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
            工具列表
          </Typography.Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data?.tool_list || []}
          rowKey="name"
          loading={isLoading}
          scroll={{ x: 800 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <DetailModal
        open={detailModalOpen}
        tool={selectedTool}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
};

export default ToolPage;