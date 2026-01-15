import React, { useState } from 'react';
import { Modal, Table, Tag, Typography, Button, ConfigProvider, theme as antTheme } from 'antd';
import { CheckCircleOutlined, ArrowRightOutlined, EyeOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

const { Text, Paragraph } = Typography;

export interface ChangeItem {
  field: string;
  label: string;
  oldValue: React.ReactNode;
  newValue: React.ReactNode;
}

interface ChangeConfirmModalProps {
  open: boolean;
  title?: string;
  changes: ChangeItem[];
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// 长文本查看弹窗
const LongTextModal: React.FC<{
  open: boolean;
  title: string;
  oldValue: string;
  newValue: string;
  onClose: () => void;
  isDark: boolean;
}> = ({ open, title, oldValue, newValue, onClose, isDark }) => {
  const bgColor = isDark ? '#1a2332' : '#fafafa';
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : '#333';
  
  return (
    <Modal
      title={`${title} 变更详情`}
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={800}
      centered
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>原值</Text>
          <div style={{ 
            padding: 12, 
            background: bgColor, 
            borderRadius: 8, 
            maxHeight: 400, 
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            color: textColor,
            border: `1px solid ${isDark ? '#2a3a4d' : '#e8e8e8'}`,
          }}>
            {oldValue || '-'}
          </div>
        </div>
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>新值</Text>
          <div style={{ 
            padding: 12, 
            background: bgColor, 
            borderRadius: 8, 
            maxHeight: 400, 
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            color: textColor,
            border: `1px solid ${isDark ? '#2a3a4d' : '#e8e8e8'}`,
          }}>
            {newValue || '-'}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const ChangeConfirmModal: React.FC<ChangeConfirmModalProps> = ({
  open,
  title = '确认修改',
  changes,
  loading,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [longTextModal, setLongTextModal] = useState<{
    open: boolean;
    title: string;
    oldValue: string;
    newValue: string;
  }>({ open: false, title: '', oldValue: '', newValue: '' });

  // 格式化显示值
  const formatValue = (value: React.ReactNode, isOld: boolean = false): React.ReactNode => {
    if (value === undefined || value === null || value === '') {
      return <Text type="secondary">-</Text>;
    }
    if (typeof value === 'boolean') {
      return <Tag color={value ? 'green' : 'default'}>{value ? '是' : '否'}</Tag>;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : <Text type="secondary">-</Text>;
    }
    if (typeof value === 'string' && value.length > 30) {
      return (
        <Paragraph 
          style={{ 
            maxWidth: 180, 
            marginBottom: 0,
            color: isOld ? (isDark ? 'rgba(255,255,255,0.45)' : '#999') : '#1677ff',
          }} 
          ellipsis={{ rows: 2 }}
        >
          {value}
        </Paragraph>
      );
    }
    return String(value);
  };

  // 判断是否为长文本字段
  const isLongTextField = (field: string) => {
    return field === 'system_prompt';
  };

  const columns = [
    {
      title: '配置项',
      dataIndex: 'label',
      key: 'label',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '原值',
      dataIndex: 'oldValue',
      key: 'oldValue',
      width: 180,
      render: (value: React.ReactNode) => (
        <div style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#999' }}>{formatValue(value, true)}</div>
      ),
    },
    {
      title: '',
      key: 'arrow',
      width: 40,
      render: () => <ArrowRightOutlined style={{ color: '#1677ff' }} />,
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      key: 'newValue',
      width: 180,
      render: (value: React.ReactNode) => (
        <div style={{ color: '#1677ff', fontWeight: 500 }}>{formatValue(value)}</div>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: unknown, record: ChangeItem) => {
        if (isLongTextField(record.field)) {
          return (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setLongTextModal({
                open: true,
                title: record.label,
                oldValue: String(record.oldValue || ''),
                newValue: String(record.newValue || ''),
              })}
            >
              查看
            </Button>
          );
        }
        return null;
      },
    },
  ];

  // 主题配置
  const themeConfig = isDark ? {
    algorithm: antTheme.darkAlgorithm,
    token: {
      colorBgContainer: '#1a2332',
      colorBgElevated: '#1a2332',
      colorBorder: '#2a3a4d',
    },
  } : undefined;

  const successBg = isDark ? 'rgba(82, 196, 26, 0.1)' : '#f6ffed';
  const successBorder = isDark ? 'rgba(82, 196, 26, 0.3)' : '#b7eb8f';

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircleOutlined style={{ color: '#1677ff' }} />
            {title}
          </div>
        }
        open={open}
        onOk={onConfirm}
        onCancel={onCancel}
        okText="确认保存"
        cancelText="取消"
        confirmLoading={loading}
        width={700}
        centered
        style={{ top: 20 }}
        className={isDark ? 'dark-modal' : ''}
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            以下配置将被修改，请确认：
          </Text>
          <Table
            dataSource={changes}
            columns={columns}
            rowKey="field"
            pagination={false}
            size="small"
            bordered
            style={{
              borderRadius: 8,
              overflow: 'hidden',
            }}
          />
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: successBg,
              border: `1px solid ${successBorder}`,
              borderRadius: 8,
            }}
          >
            <Text>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              共 <Text strong style={{ color: '#1677ff' }}>{changes.length}</Text> 项配置将被更新
            </Text>
          </div>
        </div>
      </Modal>
      
      <LongTextModal
        open={longTextModal.open}
        title={longTextModal.title}
        oldValue={longTextModal.oldValue}
        newValue={longTextModal.newValue}
        onClose={() => setLongTextModal({ ...longTextModal, open: false })}
        isDark={isDark}
      />
    </ConfigProvider>
  );
};

export default ChangeConfirmModal;
