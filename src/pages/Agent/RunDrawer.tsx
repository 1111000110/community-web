import React, { useState } from 'react';
import {
  Drawer,
  Input,
  Button,
  Space,
  Typography,
  Spin,
  Card,
  Empty,
} from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { runAgent } from '../../api/agent';
import type { AgentDetail, AgentMessageDetail } from '../../types/agent';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface RunDrawerProps {
  open: boolean;
  agent: AgentDetail | null;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
}

const RunDrawer: React.FC<RunDrawerProps> = ({ open, agent, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const runMutation = useMutation({
    mutationFn: runAgent,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.agent_message.message_content,
          reasoning: data.agent_message.reasoning_content,
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || !agent) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);

    const agentMessage: AgentMessageDetail = {
      agent_id: agent.agent_id,
      agent_session_id: sessionId,
      message_agent_session_id: sessionId,
      role: 'user',
      message_type: 0,
      message_content: input,
    };

    runMutation.mutate({
      agent_id: agent.agent_id,
      api_key: agent.api_key || '',
      agent_message: agentMessage,
    });

    setInput('');
  };

  const handleClose = () => {
    setMessages([]);
    setInput('');
    onClose();
  };

  return (
    <Drawer
      title={
        <Space>
          <RobotOutlined />
          <span>运行 Agent: {agent?.name}</span>
        </Space>
      }
      placement="right"
      width={520}
      open={open}
      onClose={handleClose}
      styles={{ body: { display: 'flex', flexDirection: 'column', padding: 0 } }}
    >
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          background: '#f5f5f5',
        }}
      >
        {messages.length === 0 ? (
          <Empty
            description="发送消息开始对话"
            style={{ marginTop: 100 }}
          />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {messages.map((msg, index) => (
              <Card
                key={index}
                size="small"
                style={{
                  background: msg.role === 'user' ? '#e6f4ff' : '#fff',
                  marginLeft: msg.role === 'user' ? 40 : 0,
                  marginRight: msg.role === 'assistant' ? 40 : 0,
                }}
              >
                <Space align="start">
                  {msg.role === 'user' ? (
                    <UserOutlined style={{ color: '#1677ff' }} />
                  ) : (
                    <RobotOutlined style={{ color: '#52c41a' }} />
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Text strong>
                      {msg.role === 'user' ? '你' : agent?.name}
                    </Text>
                    {msg.role === 'user' ? (
                      <Paragraph style={{ marginBottom: 0, marginTop: 4 }}>
                        {msg.content}
                      </Paragraph>
                    ) : (
                      <div className="markdown-body" style={{ marginTop: 4 }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    {msg.reasoning && (
                      <Paragraph
                        type="secondary"
                        style={{
                          fontSize: 12,
                          marginTop: 8,
                          padding: 8,
                          background: '#fafafa',
                          borderRadius: 4,
                        }}
                      >
                        {msg.reasoning}
                      </Paragraph>
                    )}
                  </div>
                </Space>
              </Card>
            ))}
            {runMutation.isPending && (
              <Card size="small">
                <Space>
                  <Spin size="small" />
                  <Text type="secondary">思考中...</Text>
                </Space>
              </Card>
            )}
          </Space>
        )}
      </div>

      <div
        style={{
          padding: 16,
          borderTop: '1px solid #f0f0f0',
          background: '#fff',
        }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={runMutation.isPending}
          >
            发送
          </Button>
        </Space.Compact>
      </div>
    </Drawer>
  );
};

export default RunDrawer;
