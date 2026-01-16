import React, { useState, useRef, useEffect } from 'react';
import {
  Layout,
  Input,
  Button,
  Space,
  Typography,
  Spin,
  Card,
  Avatar,
  Empty,
  Tooltip,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { getAgentList, runAgent } from '../../api/agent';
import type { AgentMessageDetail } from '../../types/agent';
import { useTheme } from '../../contexts/ThemeContext';
import AgentSidebar from './AgentSidebar';

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const { theme, toggleTheme } = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取Agent信息（优先使用缓存，但允许读取最新数据）
  const { data: agentListData } = useQuery({
    queryKey: ['agentList'],
    queryFn: () => getAgentList(),
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
    refetchOnMount: false, // 挂载时不重新请求，直接使用缓存
    refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
  });

  const agent = agentListData?.agent_list?.find(
    (a) => a.agent_id === Number(agentId)
  );

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  if (!agent) {
    return (
      <Layout style={{ minHeight: '100vh', background: theme === 'dark' ? '#0b1220' : '#f0f2f5' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="Agent不存在">
            <Button type="primary" onClick={() => navigate('/agent')}>
              返回列表
            </Button>
          </Empty>
        </Content>
      </Layout>
    );
  }

  // 深蓝色调暗色主题
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0f1a2e' : '#fff';
  const bgColor2 = isDark ? '#0c1628' : '#f5f7fa';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.10)' : '#f0f0f0';
  const mutedColor = isDark ? 'rgba(255, 255, 255, 0.68)' : '#999';
  const subtleBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#fafafa';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧Agent信息栏（可编辑） */}
      <AgentSidebar
        agent={agent}
        isDark={isDark}
        bgColor={bgColor}
        borderColor={borderColor}
        mutedColor={mutedColor}
        subtleBg={subtleBg}
        onBack={() => navigate('/agent')}
      />

      {/* 右侧聊天区域 */}
      <Layout style={{ marginLeft: 280, background: bgColor2 }}>
        {/* 顶部标题栏 */}
        <Header
          style={{
            background: bgColor,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${borderColor}`,
            height: 56,
          }}
        >
          <Space>
            <Avatar
              src={agent.icon}
              icon={<RobotOutlined />}
              size={32}
              style={{ backgroundColor: '#1677ff' }}
            />
            <Title level={5} style={{ margin: 0 }}>
              与 {agent.name} 对话
            </Title>
          </Space>
          <Tooltip title={isDark ? '切换到白天模式' : '切换到黑夜模式'}>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ fontSize: 18 }}
            />
          </Tooltip>
        </Header>

        {/* 消息区域 */}
        <Content
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            height: 'calc(100vh - 56px - 80px)',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80 }}>
                <Avatar
                  src={agent.icon}
                  icon={<RobotOutlined />}
                  size={64}
                  style={{ backgroundColor: '#1677ff', marginBottom: 16 }}
                />
                <Title level={4} style={{ marginBottom: 8 }}>
                  开始对话
                </Title>
                <Paragraph type="secondary" style={{ maxWidth: 360, margin: '0 auto' }}>
                  {agent.desc || '输入消息开始与AI助手对话'}
                </Paragraph>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        maxWidth: '85%',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        src={msg.role === 'assistant' ? agent.icon : undefined}
                        style={{
                          backgroundColor: msg.role === 'user' ? '#1677ff' : '#52c41a',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            display: 'block',
                            marginBottom: 4,
                            textAlign: msg.role === 'user' ? 'right' : 'left',
                          }}
                        >
                          {msg.role === 'user' ? '你' : agent.name}
                        </Text>
                        <Card
                          size="small"
                          style={{
                            background: msg.role === 'user' ? '#1677ff' : bgColor,
                            border: msg.role === 'user' ? 'none' : `1px solid ${borderColor}`,
                            borderRadius: 12,
                            borderTopRightRadius: msg.role === 'user' ? 4 : 12,
                            borderTopLeftRadius: msg.role === 'user' ? 12 : 4,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                          }}
                          styles={{
                            body: {
                              color: msg.role === 'user' ? '#fff' : 'inherit',
                            },
                          }}
                        >
                          {msg.role === 'user' ? (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          ) : (
                            <div className="markdown-body">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          )}
                        </Card>
                        {msg.reasoning && (
                          <Card
                            size="small"
                            style={{
                              marginTop: 8,
                              background: subtleBg,
                              border: `1px dashed ${borderColor}`,
                              borderRadius: 8,
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              💭 思考过程
                            </Text>
                            <Paragraph
                              type="secondary"
                              style={{ fontSize: 13, marginBottom: 0, marginTop: 4 }}
                            >
                              {msg.reasoning}
                            </Paragraph>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {runMutation.isPending && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Avatar
                      icon={<RobotOutlined />}
                      src={agent.icon}
                      style={{ backgroundColor: '#52c41a', flexShrink: 0 }}
                    />
                    <Card
                      size="small"
                      style={{
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 12,
                        borderTopLeftRadius: 4,
                      }}
                    >
                      <Space>
                        <Spin size="small" />
                        <Text type="secondary">思考中...</Text>
                      </Space>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </Space>
            )}
          </div>
        </Content>

        {/* 输入区域 */}
        <div
          style={{
            background: bgColor,
            borderTop: `1px solid ${borderColor}`,
            padding: '16px 24px',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入消息，Shift+Enter换行..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                style={{
                  borderRadius: '8px 0 0 8px',
                  resize: 'none',
                }}
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
                style={{ height: 'auto', borderRadius: '0 8px 8px 0', minWidth: 80 }}
              >
                发送
              </Button>
            </Space.Compact>
          </div>
        </div>
      </Layout>
    </Layout>
  );
};

export default ChatPage;
