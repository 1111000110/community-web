import React, { useState, useEffect } from 'react';
import { Modal, Typography, Avatar, Space, Button, ConfigProvider, theme as antTheme } from 'antd';
import { ExclamationCircleOutlined, RobotOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { AgentDetail } from '../../types/agent';

const { Text, Paragraph } = Typography;

interface DeleteConfirmModalProps {
  open: boolean;
  agent: AgentDetail | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  agent,
  loading,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [countdown, setCountdown] = useState(3);
  const [canDelete, setCanDelete] = useState(false);

  // 重置倒计时
  useEffect(() => {
    if (open) {
      setCountdown(3);
      setCanDelete(false);
    }
  }, [open]);

  // 倒计时逻辑
  useEffect(() => {
    if (!open || canDelete) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanDelete(true);
    }
  }, [open, countdown, canDelete]);

  if (!agent) return null;

  const config = agent.agent_chat_config || {};

  // 主题配置
  const themeConfig = isDark ? {
    algorithm: antTheme.darkAlgorithm,
    token: {
      colorBgContainer: '#1a2332',
      colorBgElevated: '#1a2332',
      colorBorder: '#2a3a4d',
    },
  } : undefined;

  const bgColor = isDark ? '#1a2332' : '#fafafa';
  const borderColor = isDark ? '#2a3a4d' : '#e8e8e8';
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : '#333';
  const dangerBg = isDark ? 'rgba(255, 77, 79, 0.1)' : '#fff2f0';
  const dangerBorder = isDark ? 'rgba(255, 77, 79, 0.3)' : '#ffccc7';

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>确认删除 Agent</span>
          </Space>
        }
        open={open}
        onCancel={onCancel}
        footer={
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDelete}
              loading={loading}
              onClick={onConfirm}
            >
              {canDelete ? '确认删除' : `请等待 ${countdown} 秒`}
            </Button>
          </Space>
        }
        width={520}
        centered
      >
        <div
          style={{
            padding: '16px',
            background: dangerBg,
            border: `1px solid ${dangerBorder}`,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#ff4d4f' }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            此操作不可恢复，删除后 Agent 将无法使用！
          </Text>
        </div>

        <div
          style={{
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          {/* 头像和名称 */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Avatar
              src={agent.icon}
              icon={<RobotOutlined />}
              size={56}
              style={{ backgroundColor: '#1677ff', marginRight: 16 }}
            />
            <div>
              <Text strong style={{ fontSize: 16, display: 'block' }}>
                {agent.name}
              </Text>
              <Text type="secondary">ID: {agent.agent_id}</Text>
            </div>
          </div>

          {/* 描述 */}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>描述</Text>
            <div>
              <Text style={{ color: textColor }}>{agent.desc || '-'}</Text>
            </div>
          </div>

          {/* 系统提示词 */}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>系统提示词</Text>
            <Paragraph
              style={{
                padding: 12,
                background: isDark ? '#0f1a2e' : '#f5f5f5',
                borderRadius: 6,
                maxHeight: 120,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                marginBottom: 0,
                marginTop: 4,
                fontSize: 13,
                color: textColor,
                border: `1px solid ${borderColor}`,
              }}
            >
              {config.system_prompt || '-'}
            </Paragraph>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default DeleteConfirmModal;
