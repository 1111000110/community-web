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
  Switch,
  Tag,
  Badge,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { getAgentList, runAgent, runAgentStream } from '../../api/agent';
import type { AgentMessageDetail, RunAgentStreamResp } from '../../types/agent';
import { useTheme } from '../../contexts/ThemeContext';
import AgentSidebar from './AgentSidebar';
import PromptReplacementModal from './PromptReplacementModal';

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  toolCalls?: {
    id: string;
    name: string;
    arguments: string;
    result?: string;
  }[];
  toolResult?: string;
}

const MessageItem: React.FC<{
  msg: ChatMessage;
  agent: any;
  isDark: boolean;
  bgColor: string;
  borderColor: string;
  subtleBg: string;
}> = ({ msg, agent, isDark, bgColor, borderColor, subtleBg }) => {
  // 如果已经有内容，默认折叠思考和工具；如果是新生成的消息（一开始没内容），则默认展开，等内容生成时再自动折叠
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(!msg.content);
  const [isToolsExpanded, setIsToolsExpanded] = useState(!msg.content);
  const hasContentRef = useRef(!!msg.content);

  useEffect(() => {
    // 当内容开始生成时（从无到有），自动折叠思考和工具
    if (!hasContentRef.current && msg.content) {
      setIsReasoningExpanded(false);
      setIsToolsExpanded(false);
      hasContentRef.current = true;
    }
  }, [msg.content]);

  const renderReasoning = () => {
    if (!msg.reasoning) return null;
    return (
      <Card
        size="small"
        style={{
          marginBottom: 8,
          background: subtleBg,
          border: `1px dashed ${borderColor}`,
          borderRadius: 8,
        }}
        styles={{
          body: { padding: '8px 12px' }
        }}
      >
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            marginBottom: isReasoningExpanded ? 8 : 0
          }}
          onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
        >
          {isReasoningExpanded ? <CaretDownOutlined style={{ fontSize: 10, marginRight: 6 }} /> : <CaretRightOutlined style={{ fontSize: 10, marginRight: 6 }} />}
          <Text type="secondary" style={{ fontSize: 12 }}>
            💭 思考过程
          </Text>
        </div>
        {isReasoningExpanded && (
          <Paragraph
            type="secondary"
            style={{ fontSize: 13, marginBottom: 0 }}
          >
            {msg.reasoning}
          </Paragraph>
        )}
      </Card>
    );
  };

  const renderTools = () => {
    if (!msg.toolCalls || msg.toolCalls.length === 0) return null;
    return (
      <div style={{ marginBottom: 8 }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            marginBottom: 8
          }}
          onClick={() => setIsToolsExpanded(!isToolsExpanded)}
        >
          {isToolsExpanded ? <CaretDownOutlined style={{ fontSize: 10, marginRight: 6 }} /> : <CaretRightOutlined style={{ fontSize: 10, marginRight: 6 }} />}
          <Text type="secondary" style={{ fontSize: 12 }}>
            🛠️ 工具调用 ({msg.toolCalls.length})
          </Text>
        </div>
        
        {isToolsExpanded && msg.toolCalls.map((toolCall) => (
          <Card
            key={toolCall.id}
            size="small"
            style={{
              marginBottom: 8,
              background: isDark ? 'rgba(250, 173, 20, 0.1)' : '#fffbe6',
              border: `1px solid ${isDark ? 'rgba(250, 173, 20, 0.3)' : '#ffe58f'}`,
              borderRadius: 8,
            }}
          >
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Space>
                  <ToolOutlined style={{ color: '#faad14' }} />
                  <Text strong style={{ fontSize: 13 }}>
                    调用工具: {toolCall.name}
                  </Text>
                  {toolCall.result ? (
                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>
                      完成
                    </Tag>
                  ) : (
                    <Tag icon={<LoadingOutlined />} color="processing" style={{ margin: 0 }}>
                      执行中
                    </Tag>
                  )}
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>参数:</Text>
                  <div 
                    style={{ 
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.02)', 
                      padding: '4px 8px', 
                      borderRadius: 4,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      marginTop: 4,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'inherit'
                    }}
                  >
                    {toolCall.arguments}
                  </div>
                </div>
                {toolCall.result && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>结果:</Text>
                    <div 
                      style={{ 
                        background: isDark ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.1)', 
                        padding: '4px 8px', 
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        marginTop: 4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: 200,
                        overflow: 'auto',
                        color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'inherit'
                      }}
                    >
                      {toolCall.result}
                    </div>
                  </div>
                )}
              </Space>
            </Space>
          </Card>
        ))}
      </div>
    );
  };

  const renderToolResult = () => {
    if (!msg.toolResult) return null;
    return (
      <Card
        size="small"
        style={{
          marginTop: 8,
          background: '#fffbe6',
          border: `1px solid #ffe58f`,
          borderRadius: 8,
        }}
      >
        <Text type="warning" style={{ fontSize: 12 }}>
          🛠️ 工具执行结果
        </Text>
        <Paragraph
          type="warning"
          style={{ fontSize: 13, marginBottom: 0, marginTop: 4 }}
        >
          {msg.toolResult}
        </Paragraph>
      </Card>
    );
  };

  return (
    <div
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
        <div style={{ minWidth: 0, width: '100%' }}>
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
          
          {/* Assistant 消息顺序：思考 -> 工具 -> 回答 */}
          {msg.role === 'assistant' && (
            <>
              {renderReasoning()}
              {renderTools()}
              {renderToolResult()}
            </>
          )}

          {/* User 消息直接显示，Assistant 消息显示内容 */}
          {(msg.role === 'user' || msg.content) && (
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
          )}
        </div>
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const { theme, toggleTheme } = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamEnabled, setStreamEnabled] = useState(true); // 默认开启流式
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [promptReplacement, setPromptReplacement] = useState<Record<string, string>>({});
  const eventSourceRef = useRef<EventSource | import('../../api/agent').StreamClient | null>(null);
  const assistantMessageRef = useRef<{
    content: string;
    reasoning: string;
    toolCalls: Record<string, { id: string; name: string; arguments: string; result?: string }>;
  }>({ content: '', reasoning: '', toolCalls: {} });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 清理事件源连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理流式响应
  const handleStreamResponse = (data: RunAgentStreamResp) => {
    try {
      switch (data.type) {
        case 'message_start':
          // 消息开始
          console.log('Stream started');
          break;
        case 'content':
          // 内容块
          const contentData = JSON.parse(data.data);
          assistantMessageRef.current.content += contentData.content;
          
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              // 更新最后一条助手消息
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: assistantMessageRef.current.content,
              };
              return newMessages;
            } else {
              // 添加新消息
              return [
                ...prev,
                {
                  role: 'assistant',
                  content: assistantMessageRef.current.content,
                },
              ];
            }
          });
          break;
        case 'reasoning':
          // 推理内容
          const reasoningData = JSON.parse(data.data);
          assistantMessageRef.current.reasoning += reasoningData.content;
          
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                reasoning: assistantMessageRef.current.reasoning,
              };
              return newMessages;
            } else {
              return [
                ...prev,
                {
                  role: 'assistant',
                  content: '',
                  reasoning: assistantMessageRef.current.reasoning,
                },
              ];
            }
          });
          break;
        case 'tool_call':
        case 'tool_call_chunk':
          // 工具调用
          const toolCallData = JSON.parse(data.data);
          // 兼容 tool_call 和 tool_call_chunk
          const tool_id = toolCallData.tool_id;
          const name = toolCallData.name || toolCallData.tool_name;
          // tool_call 使用 arguments, tool_call_chunk 使用 args_chunk
          const args = toolCallData.arguments || toolCallData.args_chunk || '';
          
          if (!assistantMessageRef.current.toolCalls[tool_id]) {
            assistantMessageRef.current.toolCalls[tool_id] = {
              id: tool_id,
              name: name || '', // tool_call_chunk 可能在后续包中才包含 name，但通常第一个包会有
              arguments: '',
            };
          }
          
          // 如果是新的名字（之前可能为空），更新名字
          if (name && !assistantMessageRef.current.toolCalls[tool_id].name) {
            assistantMessageRef.current.toolCalls[tool_id].name = name;
          }
          
          assistantMessageRef.current.toolCalls[tool_id].arguments += args;
          
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            const currentToolCalls = Object.values(assistantMessageRef.current.toolCalls);
            
            if (lastMsg && lastMsg.role === 'assistant') {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                toolCalls: currentToolCalls,
              };
              return newMessages;
            } else {
              return [
                ...prev,
                {
                  role: 'assistant',
                  content: '',
                  toolCalls: currentToolCalls,
                },
              ];
            }
          });
          break;
        case 'tool_result':
          // 工具结果
          const toolData = JSON.parse(data.data);
          
          // 尝试获取 ID (支持多种可能的字段名)
          const toolResultId = toolData.tool_id || toolData.id || toolData.tool_call_id;
          
          // 1. 更新 assistantMessageRef 中的数据，确保后续的 tool_call 不会覆盖结果
          let targetTool = null;
          const toolCallsMap = assistantMessageRef.current.toolCalls;
          
          if (toolResultId && toolCallsMap[toolResultId]) {
            targetTool = toolCallsMap[toolResultId];
          } else {
             // 如果没有 ID 或按 ID 没找到，尝试按名称匹配
             // 关键修复：找到第一个名称匹配且还没有结果的工具调用
             const tools = Object.values(toolCallsMap);
             targetTool = tools.find(t => t.name === toolData.tool_name && !t.result);
             
             if (!targetTool) {
               // 回退到查找最后一个同名的
               targetTool = [...tools].reverse().find(t => t.name === toolData.tool_name);
             }
          }
          
          if (targetTool) {
            targetTool.result = toolData.result;
            
            // 2. 同步更新到 messages 状态
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...lastMsg,
                  // 直接使用 assistantMessageRef 中的最新数据
                  toolCalls: Object.values(assistantMessageRef.current.toolCalls),
                };
                return newMessages;
              }
              // 兼容旧逻辑
              return [
                ...prev,
                {
                  role: 'assistant',
                  content: '',
                  toolResult: `工具 ${toolData.tool_name} 执行结果: ${toolData.result}`,
                },
              ];
            });
          }
          break;
        case 'message_end':
          // 消息结束
          setIsStreaming(false);
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
          // 重置助手消息引用
          assistantMessageRef.current = { content: '', reasoning: '', toolCalls: {} };
          break;
        case 'error':
          // 错误
          const errorData = JSON.parse(data.data);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `错误: ${errorData.message}`,
            },
          ]);
          setIsStreaming(false);
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
          break;
      }
    } catch (error) {
      console.error('Error parsing stream data:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `数据解析错误: ${(error as Error).message}`,
        },
      ]);
      setIsStreaming(false);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    }
  };

  // 获取Agent信息（优先使用缓存，但允许读取最新数据）
  const { data: agentListData } = useQuery({
    queryKey: ['agentList'],
    queryFn: () => getAgentList(),
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
    refetchOnMount: false, // 挂载时不重新请求，直接使用缓存
    refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
  });

  const agentRecord = agentListData?.agent_list?.find(
    (a) => a.agent_detail.agent_id === Number(agentId)
  );

  const agent = agentRecord ? {
    ...agentRecord.agent_detail,
    llm_info: agentRecord.llm_detail,
  } : null;

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

    if (streamEnabled) {
      // 使用流式API
      setIsStreaming(true);
      assistantMessageRef.current = { content: '', reasoning: '', toolCalls: {} };

      const agentMessage: AgentMessageDetail = {
        agent_id: agent.agent_id,
        agent_session_id: sessionId,
        message_agent_session_id: sessionId,
        role: 'user',
        message_type: 0,
        message_content: input,
      };

      // 关闭之前的连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // 创建新的 SSE 连接
      const eventSource = runAgentStream({
        agent_id: agent.agent_id,
        api_key: agent.api_key || '',
        agent_message: agentMessage,
        prompt_replacement: promptReplacement,
      });

      eventSourceRef.current = eventSource;

      // 使用自定义的 StreamClient
      eventSource.addEventListener('message', (data) => {
        try {
          const parsedData: RunAgentStreamResp = typeof data === 'string' ? JSON.parse(data) : data;
          handleStreamResponse(parsedData);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      });

      eventSource.addEventListener('error', (error) => {
        console.error('SSE error:', error);
        setIsStreaming(false);
        eventSource.close();
        eventSourceRef.current = null;
      });

      // 监听连接关闭事件
      eventSource.addEventListener('close', () => {
        console.log('Stream connection closed');
        setIsStreaming(false);
        eventSourceRef.current = null;
      });

      // 如果 StreamClient 支持 close 事件，监听流完成
      if (typeof eventSource.addEventListener === 'function') {
        // 当流结束时，也会触发完成处理
        eventSourceRef.current = eventSource;
      }
    } else {
      // 使用传统API
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
        prompt_replacement: promptReplacement,
      });
    }

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
          <Space size="small">
            <Tag icon={<ThunderboltOutlined />} color={streamEnabled ? 'orange' : 'default'}>
              流式返回
            </Tag>
            <Switch
              checked={streamEnabled}
              onChange={setStreamEnabled}
              checkedChildren="开启"
              unCheckedChildren="关闭"
              disabled={runMutation.isPending || isStreaming}
            />
          </Space>
          <Space>
            <Tooltip title="Prompt 参数配置">
              <Badge count={Object.keys(promptReplacement).length} size="small" offset={[-5, 5]}>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => setIsSettingsVisible(true)}
                  style={{ fontSize: 18 }}
                />
              </Badge>
            </Tooltip>
            <Tooltip title={isDark ? '切换到白天模式' : '切换到黑夜模式'}>
              <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                style={{ fontSize: 18 }}
              />
            </Tooltip>
          </Space>
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
                  <MessageItem
                    key={index}
                    msg={msg}
                    agent={agent}
                    isDark={isDark}
                    bgColor={bgColor}
                    borderColor={borderColor}
                    subtleBg={subtleBg}
                  />
                ))}
                {(runMutation.isPending || (isStreaming && messages[messages.length - 1]?.role !== 'assistant')) && (
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
                        <Text type="secondary">{isStreaming ? '流式接收中...' : '思考中...'}</Text>
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
                disabled={runMutation.isPending || isStreaming}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={runMutation.isPending || isStreaming}
                disabled={(!input.trim() && !runMutation.isPending && !isStreaming)}
                style={{ height: 'auto', borderRadius: '0 8px 8px 0', minWidth: 80 }}
              >
                发送
              </Button>
            </Space.Compact>
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              {streamEnabled ? (
                <Text type="warning">流式模式：实时接收AI生成内容</Text>
              ) : (
                <Text type="secondary">普通模式：等待AI完整回复</Text>
              )}
            </div>
          </div>
        </div>
      </Layout>

      <PromptReplacementModal
        visible={isSettingsVisible}
        onCancel={() => setIsSettingsVisible(false)}
        onOk={(values) => {
          setPromptReplacement(values);
          setIsSettingsVisible(false);
        }}
        initialValues={promptReplacement}
        isDark={isDark}
      />
    </Layout>
  );
};

export default ChatPage;