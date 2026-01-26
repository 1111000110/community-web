import React, { useState, useEffect } from 'react';
import {
  Layout,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Typography,
  Avatar,
  Tag,
  Divider,
  Form,
  message,
  Collapse,
  Tooltip,
  Modal,
} from 'antd';
import {
  RobotOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateAgent } from '../../api/agent';
import { getLlmList } from '../../api/llm';
import { getToolList } from '../../api/tool';
import type { AgentDetail, AgentChatConfig, UpdateAgentReq } from '../../types/agent';
import type { ToolDetail } from '../../types/tool';
import ChangeConfirmModal from '../../components/ChangeConfirmModal';
import type { ChangeItem } from '../../components/ChangeConfirmModal';

const { Sider } = Layout;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface AgentSidebarProps {
  agent: AgentDetail;
  isDark: boolean;
  bgColor: string;
  borderColor: string;
  mutedColor: string;
  subtleBg: string;
  onBack: () => void;
}

// 字段标签映射
const fieldLabels: Record<string, string> = {
  name: '名称',
  desc: '描述',
  llm_id: '模型',
  temperature: '温度',
  top_p: 'Top P',
  frequency_penalty: '频率惩罚',
  presence_penalty: '存在惩罚',
  is_think: '深度思考',
  reasoning_effort: '思考力度',
  max_context_tokens: '最大上下文Token',
  max_think_tokens: '最大思考Token',
  chat_type: '会话模式',
  chat_round: '历史轮数',
  response_format: '响应格式',
  system_prompt: '系统提示词',
  stop: '停止词',
  enable_tools: '可用工具',
  // 工具配置
  'kb.knowledge_list': '知识库列表',
  'kb.top_k': '知识库返回数量',
  'kb.score_threshold': '知识库分数阈值',
  'web.top_k': '网页返回数量',
  'web.recency_days': '时间范围(天)',
  'web.allow_domains': '允许域名',
  'web.block_domains': '阻止域名',
  'web.max_calls_per_turn': '每轮最大调用',
};

const chatTypeMap: Record<number, string> = {
  0: '每次新会话',
  1: 'SessionID控制',
  2: '永久会话',
};

// 信息项组件（查看模式）
const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ marginBottom: 12 }}>
    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 14 }}>{value || '-'}</Text>
  </div>
);

const AgentSidebar: React.FC<AgentSidebarProps> = ({
  agent,
  isDark,
  bgColor,
  borderColor,
  mutedColor,
  subtleBg,
  onBack,
}) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [pendingData, setPendingData] = useState<UpdateAgentReq | null>(null);
  const [fullScreenPromptOpen, setFullScreenPromptOpen] = useState(false);
  const [currentPromptValue, setCurrentPromptValue] = useState('');
  const queryClient = useQueryClient();

  // 在编辑模式下获取LLM列表
  const { data: llmData } = useQuery({
    queryKey: ['llmList'],
    queryFn: () => getLlmList(),
    enabled: isEditing, // 只在编辑模式下加载
  });

  // 在编辑模式下获取工具列表
  const { data: toolData } = useQuery({
    queryKey: ['toolList'],
    queryFn: () => getToolList(),
    enabled: isEditing, // 只在编辑模式下加载
  });

  const config = agent.agent_chat_config || {};

  // 使用 Agent 自带的 LLM 信息
  const currentLlm = agent.llm_info;

  // 重置表单
  useEffect(() => {
    if (agent) {
      const toolConfig = config.tool_config || {};
      form.setFieldsValue({
        name: agent.name,
        desc: agent.desc,
        llm_id: config.llm_id,
        is_think: config.is_think,
        reasoning_effort: config.reasoning_effort,
        max_context_tokens: config.max_context_tokens,
        max_think_tokens: config.max_think_tokens,
        is_service_tier: config.is_service_tier,
        response_format: config.response_format,
        frequency_penalty: config.frequency_penalty,
        presence_penalty: config.presence_penalty,
        temperature: config.temperature,
        top_p: config.top_p,
        system_prompt: config.system_prompt,
        chat_type: config.chat_type,
        chat_round: config.chat_round,
        stop: config.stop?.join(', ') || '',
        enable_tools: config.enable_tools || [], // 改为数组格式
        // 工具配置 - 知识库
        kb_knowledge_list: toolConfig.kb?.knowledge_list?.join(', ') || '',
        kb_top_k: toolConfig.kb?.top_k,
        kb_score_threshold: toolConfig.kb?.score_threshold,
        // 工具配置 - 网页搜索
        web_top_k: toolConfig.web?.top_k,
        web_recency_days: toolConfig.web?.recency_days,
        web_allow_domains: toolConfig.web?.allow_domains?.join(', ') || '',
        web_block_domains: toolConfig.web?.block_domains?.join(', ') || '',
        web_max_calls_per_turn: toolConfig.web?.max_calls_per_turn,
      });
    }
  }, [agent, form, config]);

  const updateMutation = useMutation({
    mutationFn: updateAgent,
    onSuccess: () => {
      message.success('保存成功');
      queryClient.invalidateQueries({ queryKey: ['agentList'] });
      setConfirmOpen(false);
      setIsEditing(false);
    },
    onError: () => {
      message.error('保存失败');
    },
  });

  // 计算变更项
  const calculateChanges = (values: Record<string, unknown>): ChangeItem[] => {
    const changeList: ChangeItem[] = [];

    // 基础字段
    if (values.name !== agent.name) {
      changeList.push({ field: 'name', label: fieldLabels.name, oldValue: agent.name, newValue: values.name as string });
    }
    if (values.desc !== agent.desc) {
      changeList.push({ field: 'desc', label: fieldLabels.desc, oldValue: agent.desc, newValue: values.desc as string });
    }

    // 配置字段
    const configFields = [
      'temperature', 'top_p', 'frequency_penalty', 'presence_penalty',
      'is_think', 'reasoning_effort', 'max_context_tokens', 'max_think_tokens',
      'chat_type', 'chat_round', 'response_format',
    ];

    configFields.forEach((field) => {
      const oldVal = config[field as keyof AgentChatConfig];
      const newVal = values[field];
      if (field === 'chat_type') {
        if (oldVal !== newVal) {
          changeList.push({
            field,
            label: fieldLabels[field],
            oldValue: chatTypeMap[oldVal as number] || '-',
            newValue: chatTypeMap[newVal as number] || '-',
          });
        }
      } else if (oldVal !== newVal) {
        changeList.push({ field, label: fieldLabels[field], oldValue: oldVal as React.ReactNode, newValue: newVal as React.ReactNode });
      }
    });

    // 特殊处理 llm_id 字段
    const oldLlmId = config.llm_id;
    const newLlmId = values.llm_id as number;
    if (oldLlmId !== newLlmId) {
      // 获取对应的 LLM 信息
      const oldLlm = llmData?.llm_detail?.find(llm => llm.llm_id === oldLlmId);
      const newLlm = llmData?.llm_detail?.find(llm => llm.llm_id === newLlmId);
      
      const oldDisplay = oldLlm ? `${oldLlm.llm_name} (${oldLlm.supplier_model_id})` : `ID: ${oldLlmId}`;
      const newDisplay = newLlm ? `${newLlm.llm_name} (${newLlm.supplier_model_id})` : `ID: ${newLlmId}`;
      
      changeList.push({ 
        field: 'llm_id',
        label: fieldLabels.llm_id, 
        oldValue: oldLlmId === undefined ? '-' : oldDisplay, 
        newValue: newLlmId === undefined ? '-' : newDisplay 
      });
    }

    // 系统提示词 - 显示完整内容
    if (values.system_prompt !== config.system_prompt) {
      changeList.push({
        field: 'system_prompt',
        label: fieldLabels.system_prompt,
        oldValue: config.system_prompt || '',
        newValue: (values.system_prompt as string) || '',
      });
    }

    // 数组字段比较 - 修复工具字段比较逻辑
    const oldStop = config.stop?.join(', ') || '';
    const newStop = values.stop as string || '';
    if (oldStop !== newStop) {
      changeList.push({ field: 'stop', label: fieldLabels.stop, oldValue: oldStop || '-', newValue: newStop || '-' });
    }

    // 修复工具字段比较逻辑 - 使用数组比较
    const oldToolsArray = config.enable_tools || [];
    const newToolsArray = Array.isArray(values.enable_tools) ? values.enable_tools : [];
    
    // 比较数组内容是否相同
    const arraysEqual = oldToolsArray.length === newToolsArray.length && 
      oldToolsArray.every((item, index) => item === newToolsArray[index]);
    
    if (!arraysEqual) {
      changeList.push({ 
        field: 'enable_tools', 
        label: fieldLabels.enable_tools, 
        oldValue: oldToolsArray.length > 0 ? oldToolsArray.join(', ') : '-', 
        newValue: newToolsArray.length > 0 ? newToolsArray.join(', ') : '-' 
      });
    }

    // 工具配置变更检测
    const oldToolConfig = config.tool_config || {};
    
    // 知识库配置
    const oldKbList = oldToolConfig.kb?.knowledge_list?.join(', ') || '';
    const newKbList = values.kb_knowledge_list as string || '';
    if (oldKbList !== newKbList) {
      changeList.push({ field: 'kb.knowledge_list', label: fieldLabels['kb.knowledge_list'], oldValue: oldKbList || '-', newValue: newKbList || '-' });
    }
    if (oldToolConfig.kb?.top_k !== values.kb_top_k) {
      changeList.push({ field: 'kb.top_k', label: fieldLabels['kb.top_k'], oldValue: oldToolConfig.kb?.top_k, newValue: values.kb_top_k as number });
    }
    if (oldToolConfig.kb?.score_threshold !== values.kb_score_threshold) {
      changeList.push({ field: 'kb.score_threshold', label: fieldLabels['kb.score_threshold'], oldValue: oldToolConfig.kb?.score_threshold, newValue: values.kb_score_threshold as number });
    }
    
    // 网页搜索配置
    if (oldToolConfig.web?.top_k !== values.web_top_k) {
      changeList.push({ field: 'web.top_k', label: fieldLabels['web.top_k'], oldValue: oldToolConfig.web?.top_k, newValue: values.web_top_k as number });
    }
    if (oldToolConfig.web?.recency_days !== values.web_recency_days) {
      changeList.push({ field: 'web.recency_days', label: fieldLabels['web.recency_days'], oldValue: oldToolConfig.web?.recency_days, newValue: values.web_recency_days as number });
    }
    const oldAllowDomains = oldToolConfig.web?.allow_domains?.join(', ') || '';
    const newAllowDomains = values.web_allow_domains as string || '';
    if (oldAllowDomains !== newAllowDomains) {
      changeList.push({ field: 'web.allow_domains', label: fieldLabels['web.allow_domains'], oldValue: oldAllowDomains || '-', newValue: newAllowDomains || '-' });
    }
    const oldBlockDomains = oldToolConfig.web?.block_domains?.join(', ') || '';
    const newBlockDomains = values.web_block_domains as string || '';
    if (oldBlockDomains !== newBlockDomains) {
      changeList.push({ field: 'web.block_domains', label: fieldLabels['web.block_domains'], oldValue: oldBlockDomains || '-', newValue: newBlockDomains || '-' });
    }
    if (oldToolConfig.web?.max_calls_per_turn !== values.web_max_calls_per_turn) {
      changeList.push({ field: 'web.max_calls_per_turn', label: fieldLabels['web.max_calls_per_turn'], oldValue: oldToolConfig.web?.max_calls_per_turn, newValue: values.web_max_calls_per_turn as number });
    }

    return changeList;
  };

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const changeList = calculateChanges(values);

      if (changeList.length === 0) {
        message.info('没有修改任何内容');
        return;
      }

      // 保留原始值，只覆盖有变化的字段
      const updateData: UpdateAgentReq = {
        agent_id: agent.agent_id,
        name: values.name ?? agent.name,
        desc: values.desc ?? agent.desc,
        agent_chat_config: {
          // 保留所有原始配置
          ...config,
          // 覆盖表单中的值
          llm_id: values.llm_id ?? config.llm_id,
          temperature: values.temperature ?? config.temperature,
          top_p: values.top_p ?? config.top_p,
          frequency_penalty: values.frequency_penalty ?? config.frequency_penalty,
          presence_penalty: values.presence_penalty ?? config.presence_penalty,
          is_think: values.is_think ?? config.is_think,
          reasoning_effort: values.reasoning_effort ?? config.reasoning_effort,
          max_context_tokens: values.max_context_tokens ?? config.max_context_tokens,
          max_think_tokens: values.max_think_tokens ?? config.max_think_tokens,
          chat_type: values.chat_type ?? config.chat_type,
          chat_round: values.chat_round ?? config.chat_round,
          response_format: values.response_format ?? config.response_format,
          system_prompt: values.system_prompt ?? config.system_prompt,
          is_service_tier: values.is_service_tier ?? config.is_service_tier,
          stop: values.stop ? (values.stop as string).split(',').map((s: string) => s.trim()).filter(Boolean) : config.stop,
          enable_tools: values.enable_tools ? values.enable_tools as string[] : config.enable_tools,
          // 工具配置
          tool_config: {
            kb: {
              knowledge_list: values.kb_knowledge_list ? (values.kb_knowledge_list as string).split(',').map((s: string) => s.trim()).filter(Boolean) : config.tool_config?.kb?.knowledge_list,
              top_k: values.kb_top_k ?? config.tool_config?.kb?.top_k,
              score_threshold: values.kb_score_threshold ?? config.tool_config?.kb?.score_threshold,
            },
            web: {
              top_k: values.web_top_k ?? config.tool_config?.web?.top_k,
              recency_days: values.web_recency_days ?? config.tool_config?.web?.recency_days,
              allow_domains: values.web_allow_domains ? (values.web_allow_domains as string).split(',').map((s: string) => s.trim()).filter(Boolean) : config.tool_config?.web?.allow_domains,
              block_domains: values.web_block_domains ? (values.web_block_domains as string).split(',').map((s: string) => s.trim()).filter(Boolean) : config.tool_config?.web?.block_domains,
              max_calls_per_turn: values.web_max_calls_per_turn ?? config.tool_config?.web?.max_calls_per_turn,
            },
          },
        },
      };

      setChanges(changeList);
      setPendingData(updateData);
      setConfirmOpen(true);
    } catch {
      message.error('请检查表单填写');
    }
  };

  const handleConfirmSave = () => {
    if (pendingData) {
      updateMutation.mutate(pendingData);
    }
  };

  // 全屏编辑系统提示词
  const handleFullScreenPrompt = () => {
    const currentValue = form.getFieldValue('system_prompt') || '';
    setCurrentPromptValue(currentValue);
    setFullScreenPromptOpen(true);
  };

  const handlePromptSave = () => {
    form.setFieldValue('system_prompt', currentPromptValue);
    setFullScreenPromptOpen(false);
  };

  const handlePromptCancel = () => {
    setFullScreenPromptOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    const toolConfig = config.tool_config || {};
    form.setFieldsValue({
      name: agent.name,
      desc: agent.desc,
      ...config,
      stop: config.stop?.join(', ') || '',
      enable_tools: config.enable_tools || [],
      // 工具配置
      kb_knowledge_list: toolConfig.kb?.knowledge_list?.join(', ') || '',
      kb_top_k: toolConfig.kb?.top_k,
      kb_score_threshold: toolConfig.kb?.score_threshold,
      web_top_k: toolConfig.web?.top_k,
      web_recency_days: toolConfig.web?.recency_days,
      web_allow_domains: toolConfig.web?.allow_domains?.join(', ') || '',
      web_block_domains: toolConfig.web?.block_domains?.join(', ') || '',
      web_max_calls_per_turn: toolConfig.web?.max_calls_per_turn,
    });
  };

  // 查看模式内容
  const ViewContent = () => (
    <div style={{ padding: '16px 20px' }}>
      {/* 基本信息 */}
      <Text strong style={{ fontSize: 13, color: mutedColor, display: 'block', marginBottom: 12 }}>
        基本信息
      </Text>
      <InfoItem label="描述" value={agent.desc} />
      <InfoItem label="创建时间" value={agent.create_time ? new Date(agent.create_time * 1000).toLocaleString() : '-'} />
      <InfoItem label="更新时间" value={agent.update_time ? new Date(agent.update_time * 1000).toLocaleString() : '-'} />
      
      <Divider style={{ margin: '16px 0', borderColor: borderColor }} />
      
      {/* 模型配置 */}
      <Text strong style={{ fontSize: 13, color: mutedColor, display: 'block', marginBottom: 12 }}>
        模型配置
      </Text>
      <InfoItem label="模型名称" value={currentLlm?.llm_name || '未知模型'} />
      <InfoItem label="供应商" value={<Tag color="blue">{currentLlm?.supplier_name || '-'}</Tag>} />
      <InfoItem label="供应商模型ID" value={<code>{currentLlm?.supplier_model_id || '-'}</code>} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <InfoItem label="温度" value={config.temperature} />
        <InfoItem label="Top P" value={config.top_p} />
        <InfoItem label="频率惩罚" value={config.frequency_penalty} />
        <InfoItem label="存在惩罚" value={config.presence_penalty} />
      </div>
      <InfoItem label="响应格式" value={config.response_format || '默认'} />
      <InfoItem label="停止词" value={config.stop?.length ? config.stop.join(', ') : '-'} />
      
      <Divider style={{ margin: '16px 0', borderColor: borderColor }} />
      
      {/* 深度思考 */}
      <Text strong style={{ fontSize: 13, color: mutedColor, display: 'block', marginBottom: 12 }}>
        深度思考
      </Text>
      <InfoItem
        label="启用状态"
        value={<Tag color={config.is_think ? 'green' : 'default'}>{config.is_think ? '已开启' : '已关闭'}</Tag>}
      />
      {config.is_think && (
        <>
          <InfoItem label="思考努力程度" value={config.reasoning_effort || '默认'} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <InfoItem label="最大上下文Token" value={config.max_context_tokens} />
            <InfoItem label="最大思考Token" value={config.max_think_tokens} />
          </div>
        </>
      )}
      
      <Divider style={{ margin: '16px 0', borderColor: borderColor }} />
      
      {/* 会话配置 */}
      <Text strong style={{ fontSize: 13, color: mutedColor, display: 'block', marginBottom: 12 }}>
        会话配置
      </Text>
      <InfoItem
        label="会话模式"
        value={<Tag color="processing">{chatTypeMap[config.chat_type!] || '-'}</Tag>}
      />
      <InfoItem label="历史轮数" value={config.chat_round} />
      <InfoItem label="可用工具" value={config.enable_tools?.length ? config.enable_tools.join(', ') : '-'} />
      
      <Divider style={{ margin: '16px 0', borderColor: borderColor }} />
      
      {/* 工具配置 */}
      <Text strong style={{ fontSize: 13, color: mutedColor, display: 'block', marginBottom: 12 }}>
        工具配置
      </Text>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>知识库检索 (KB)</Text>
      <div style={{ paddingLeft: 8, marginBottom: 12 }}>
        <InfoItem label="知识库列表" value={config.tool_config?.kb?.knowledge_list?.join(', ') || '-'} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoItem label="返回数量" value={config.tool_config?.kb?.top_k} />
          <InfoItem label="分数阈值" value={config.tool_config?.kb?.score_threshold} />
        </div>
      </div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>网页搜索 (Web)</Text>
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoItem label="返回数量" value={config.tool_config?.web?.top_k} />
          <InfoItem label="时间范围(天)" value={config.tool_config?.web?.recency_days} />
          <InfoItem label="每轮最大调用" value={config.tool_config?.web?.max_calls_per_turn} />
        </div>
        <InfoItem label="允许域名" value={config.tool_config?.web?.allow_domains?.join(', ') || '-'} />
        <InfoItem label="阻止域名" value={config.tool_config?.web?.block_domains?.join(', ') || '-'} />
      </div>
      
      <Divider style={{ margin: '16px 0', borderColor: borderColor }} />
      
      {/* 系统提示词 */}
      <Text strong style={{ fontSize: 13, color: mutedColor, display: 'block', marginBottom: 12 }}>
        系统提示词
      </Text>
      <div style={{ position: 'relative' }}>
        <Paragraph
          style={{
            fontSize: 13,
            color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#333',
            whiteSpace: 'pre-wrap',
            marginBottom: 0,
            background: subtleBg,
            padding: 12,
            borderRadius: 8,
            maxHeight: 200,
            overflow: 'auto',
            border: `1px solid ${borderColor}`,
          }}
        >
          {config.system_prompt || '-'}
        </Paragraph>
        <Button
          type="text"
          icon={<ExpandOutlined />}
          onClick={handleFullScreenPrompt}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 2,
            color: '#1890ff',
            background: isDark ? 'rgba(26, 35, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
          }}
          title="全屏编辑"
        />
      </div>
    </div>
  );

  // 编辑模式内容
  const EditContent = () => (
    <Form form={form} layout="vertical" size="small" style={{ padding: '16px 20px' }}>
      <Collapse
        defaultActiveKey={['basic', 'model', 'think', 'chat', 'tools', 'prompt']}
        ghost
        items={[
          {
            key: 'basic',
            label: <Text strong style={{ color: mutedColor }}>基本信息</Text>,
            children: (
              <>
                <Form.Item name="name" label="名称" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="desc" label="描述">
                  <TextArea rows={2} />
                </Form.Item>
              </>
            ),
          },
          {
            key: 'model',
            label: <Text strong style={{ color: mutedColor }}>模型配置</Text>,
            children: (
              <>
                <Form.Item
                  name="llm_id"
                  label="选择模型"
                  rules={[{ required: true, message: '请选择模型' }]}
                >
                  <Select
                    placeholder="请选择一个 LLM 模型"
                    showSearch
                    optionFilterProp="children"
                    loading={!llmData}
                  >
                    {llmData?.llm_detail
                      ?.filter((llm) => llm.status === 0)
                      .map((llm) => (
                        <Select.Option key={llm.llm_id} value={llm.llm_id}>
                          <Space>
                            <span>{llm.llm_name}</span>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              ({llm.supplier_name} - {llm.supplier_model_id})
                            </span>
                          </Space>
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Form.Item name="temperature" label="温度">
                    <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="top_p" label="Top P">
                    <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="frequency_penalty" label="频率惩罚">
                    <InputNumber min={-2} max={2} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="presence_penalty" label="存在惩罚">
                    <InputNumber min={-2} max={2} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <Form.Item name="response_format" label="响应格式">
                  <Select allowClear placeholder="默认">
                    <Select.Option value="text">text</Select.Option>
                    <Select.Option value="json_object">json_object</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="stop" label="停止词" extra="逗号分隔">
                  <Input />
                </Form.Item>
              </>
            ),
          },
          {
            key: 'think',
            label: <Text strong style={{ color: mutedColor }}>深度思考</Text>,
            children: (
              <>
                <Form.Item name="is_think" label="启用" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="reasoning_effort" label="思考力度">
                  <Select allowClear placeholder="默认">
                    <Select.Option value="low">低</Select.Option>
                    <Select.Option value="medium">中</Select.Option>
                    <Select.Option value="high">高</Select.Option>
                  </Select>
                </Form.Item>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Form.Item name="max_context_tokens" label="上下文Token">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="max_think_tokens" label="思考Token">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </>
            ),
          },
          {
            key: 'chat',
            label: <Text strong style={{ color: mutedColor }}>会话配置</Text>,
            children: (
              <>
                <Form.Item name="chat_type" label="会话模式">
                  <Select>
                    <Select.Option value={0}>每次新会话</Select.Option>
                    <Select.Option value={1}>SessionID控制</Select.Option>
                    <Select.Option value={2}>永久会话</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="chat_round" label="历史轮数">
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="enable_tools" label="可用工具">
                  <Select
                    mode="multiple"
                    placeholder="请选择可用的工具"
                    showSearch
                    optionFilterProp="children"
                    loading={!toolData}
                    options={toolData?.tool_list?.map((tool: ToolDetail) => ({
                      label: tool.name,
                      value: tool.name,
                      desc: tool.description,
                    })) || []}
                    optionRender={(option) => (
                      <Tooltip title={option.data.desc} placement="right">
                        <div>{option.label}</div>
                      </Tooltip>
                    )}
                  />
                </Form.Item>
              </>
            ),
          },
          {
            key: 'tools',
            label: <Text strong style={{ color: mutedColor }}>工具配置</Text>,
            children: (
              <>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>知识库检索 (KB)</Text>
                <Form.Item name="kb_knowledge_list" label="知识库列表" extra="逗号分隔">
                  <Input placeholder="kb1, kb2" />
                </Form.Item>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Form.Item name="kb_top_k" label="返回数量">
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="kb_score_threshold" label="分数阈值">
                    <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8, marginTop: 12 }}>网页搜索 (Web)</Text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Form.Item name="web_top_k" label="返回数量">
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="web_recency_days" label="时间范围(天)">
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="web_max_calls_per_turn" label="每轮最大调用">
                    <InputNumber min={1} max={50} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <Form.Item name="web_allow_domains" label="允许域名" extra="逗号分隔">
                  <Input placeholder="example.com" />
                </Form.Item>
                <Form.Item name="web_block_domains" label="阻止域名" extra="逗号分隔">
                  <Input placeholder="blocked.com" />
                </Form.Item>
              </>
            ),
          },
          {
            key: 'prompt',
            label: <Text strong style={{ color: mutedColor }}>系统提示词</Text>,
            children: (
              <div style={{ position: 'relative' }}>
                <Form.Item name="system_prompt">
                  <TextArea 
                    rows={6} 
                    placeholder="系统提示词" 
                    defaultValue={config.system_prompt || ''}
                  />
                </Form.Item>
                <Button
                  type="text"
                  icon={<ExpandOutlined />}
                  onClick={handleFullScreenPrompt}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    zIndex: 2,
                    color: '#1890ff',
                    background: isDark ? 'rgba(26, 35, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                  }}
                  title="全屏编辑"
                />
              </div>
            ),
          },
        ]}
      />
    </Form>
  );

  return (
    <>
      <Sider
        width={280}
        theme={isDark ? 'dark' : 'light'}
        style={{
          background: bgColor,
          borderRight: `1px solid ${borderColor}`,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          overflow: 'auto',
        }}
      >
        {/* 顶部操作栏 */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginLeft: -8 }}>
            返回
          </Button>
          {!isEditing ? (
            <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
              编辑
            </Button>
          ) : (
            <Space>
              <Button size="small" icon={<CloseOutlined />} onClick={handleCancelEdit}>
                取消
              </Button>
              <Button type="primary" size="small" icon={<SaveOutlined />} onClick={handleSave}>
                保存
              </Button>
            </Space>
          )}
        </div>

        {/* Agent头像和名称 */}
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: `1px solid ${borderColor}` }}>
          <Avatar
            src={agent.icon}
            icon={<RobotOutlined />}
            size={64}
            style={{ backgroundColor: '#1677ff', marginBottom: 12 }}
          />
          <Title level={5} style={{ margin: '0 0 4px 0' }}>
            {agent.name}
          </Title>
          <Space size={4}>
            <Tag color={agent.status === 0 ? 'success' : 'default'}>
              {agent.status === 0 ? '正常' : '已禁用'}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>ID: {agent.agent_id}</Text>
          </Space>
        </div>

        {/* 内容区域 */}
        {isEditing ? <EditContent /> : <ViewContent />}
      </Sider>

      {/* 全屏编辑系统提示词弹窗 */}
      <Modal
        title="编辑系统提示词"
        open={fullScreenPromptOpen}
        onOk={handlePromptSave}
        onCancel={handlePromptCancel}
        width="80%"
        styles={{
          body: {
            height: '70vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 12, color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#666' }}>
            在此处编辑Agent的系统提示词，定义其角色和行为规范
          </div>
          <TextArea
            value={currentPromptValue}
            onChange={(e) => setCurrentPromptValue(e.target.value)}
            placeholder="请输入系统提示词..."
            style={{ 
              flex: 1, 
              resize: 'none',
              background: isDark ? '#1a2332' : '#fff',
              color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#000'
            }}
            autoFocus
          />
        </div>
      </Modal>

      <ChangeConfirmModal
        open={confirmOpen}
        title="确认修改 Agent 配置"
        changes={changes}
        loading={updateMutation.isPending}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default AgentSidebar;
