import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tabs,
  Tag,
  Typography,
  Space,
  Button,
  message,
  ConfigProvider,
  theme as antTheme,
} from 'antd';
import { CopyOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { updateAgent } from '../../api/agent';
import { getLlmList } from '../../api/llm';
import type { AgentDetail, AgentChatConfig, UpdateAgentReq } from '../../types/agent';
import ChangeConfirmModal from '../../components/ChangeConfirmModal';
import type { ChangeItem } from '../../components/ChangeConfirmModal';
import { useTheme } from '../../contexts/ThemeContext';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DetailModalProps {
  open: boolean;
  agent: AgentDetail | null;
  onClose: () => void;
}

// 字段标签映射
const fieldLabels: Record<string, string> = {
  name: '名称',
  desc: '描述',
  icon: '图标URL',
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
  is_service_tier: '服务等级保障',
};

// 会话模式映射
const chatTypeMap: Record<number, string> = {
  0: '每次新会话',
  1: 'SessionID控制',
  2: '永久会话',
};

const DetailModal: React.FC<DetailModalProps> = ({ open, agent, onClose }) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [pendingData, setPendingData] = useState<UpdateAgentReq | null>(null);
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 获取LLM列表
  const { data: llmData } = useQuery({
    queryKey: ['llmList'],
    queryFn: () => getLlmList(),
    enabled: open, // 只有模态框打开时才请求
  });

  // 根据llm_id查找LLM信息
  const currentLlm = agent?.llm_info || llmData?.llm_detail?.find(
    (llm) => llm.llm_id === agent?.agent_chat_config?.llm_id
  );

  // 主题相关颜色
  const bgColor = isDark ? '#1a2332' : '#fafafa';
  const borderColor = isDark ? '#2a3a4d' : '#e8e8e8';
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : '#333';

  // 重置表单
  useEffect(() => {
    if (open && agent) {
      const config = agent.agent_chat_config || {};
      
      // 确保所有字段都有默认值
      const initialValues = {
        name: agent.name || '',
        desc: agent.desc || '',
        icon: agent.icon || '',
        llm_id: config.llm_id !== undefined ? config.llm_id : undefined,
        is_think: config.is_think !== undefined ? config.is_think : false,
        reasoning_effort: config.reasoning_effort || undefined,
        max_context_tokens: config.max_context_tokens !== undefined ? config.max_context_tokens : 4096,
        max_think_tokens: config.max_think_tokens !== undefined ? config.max_think_tokens : 1024,
        is_service_tier: config.is_service_tier !== undefined ? config.is_service_tier : false,
        response_format: config.response_format || 'text',
        frequency_penalty: config.frequency_penalty !== undefined ? config.frequency_penalty : 0,
        presence_penalty: config.presence_penalty !== undefined ? config.presence_penalty : 0,
        temperature: config.temperature !== undefined ? config.temperature : 0.7,
        top_p: config.top_p !== undefined ? config.top_p : 0.9,
        system_prompt: config.system_prompt || '',
        chat_type: config.chat_type !== undefined ? config.chat_type : 1, // SessionID控制
        chat_round: config.chat_round !== undefined ? config.chat_round : 10,
        stop: config.stop?.join(', ') || '',
        enable_tools: config.enable_tools?.join(', ') || '',
      };
      
      // 使用 setTimeout 确保表单已经挂载
      setTimeout(() => {
        form.setFieldsValue(initialValues);
      }, 0);
      
      setIsEditing(false);
    }
  }, [open, agent]); // 移除 form 依赖

  const updateMutation = useMutation({
    mutationFn: updateAgent,
    onSuccess: () => {
      message.success('保存成功');
      queryClient.invalidateQueries({ queryKey: ['agentList'] });
      setConfirmOpen(false);
      setIsEditing(false); // 确保退出编辑模式
      onClose(); // 关闭模态框
    },
    onError: () => {
      message.error('保存失败');
    },
  });

  if (!agent) return null;

  const config = agent.agent_chat_config || {};

  // 计算变更项 - 更智能的比较逻辑
  const calculateChanges = (values: Record<string, unknown>): ChangeItem[] => {
    const changeList: ChangeItem[] = [];
    const originalConfig = config;

    // 基础字段 - 严格相等比较
    if (values.name !== agent.name) {
      changeList.push({ field: 'name', label: fieldLabels.name, oldValue: agent.name, newValue: values.name as string });
    }
    if (values.desc !== agent.desc) {
      changeList.push({ field: 'desc', label: fieldLabels.desc, oldValue: agent.desc || '', newValue: values.desc as string || '' });
    }
    if (values.icon !== agent.icon) {
      changeList.push({ field: 'icon', label: fieldLabels.icon, oldValue: agent.icon || '', newValue: values.icon as string || '' });
    }

    // 配置字段 - 更智能的比较
    const configFields = [
      'llm_id', 'temperature', 'top_p', 'frequency_penalty', 'presence_penalty',
      'is_think', 'reasoning_effort', 'max_context_tokens', 'max_think_tokens',
      'chat_type', 'chat_round', 'response_format', 'is_service_tier',
      'system_prompt', 'stop', 'enable_tools'
    ];

    configFields.forEach((field) => {
      const oldVal = originalConfig[field as keyof AgentChatConfig];
      const newVal = values[field];
      
      // 处理 undefined 新值的情况 - 这意味着该字段未被编辑
      if (newVal === undefined) {
        return;
      }
      
      // 特殊处理布尔值字段
      if (field === 'is_think' || field === 'is_service_tier') {
        const oldBool = Boolean(oldVal);
        const newBool = Boolean(newVal);
        if (oldBool !== newBool) {
          changeList.push({ 
            field, 
            label: fieldLabels[field], 
            oldValue: oldBool ? '开启' : '关闭', 
            newValue: newBool ? '开启' : '关闭' 
          });
        }
      }
      // 特殊处理数字字段
      else if (['temperature', 'top_p', 'frequency_penalty', 'presence_penalty', 
                'max_context_tokens', 'max_think_tokens', 'chat_round'].includes(field)) {
        const oldNum = oldVal === undefined || oldVal === null ? undefined : Number(oldVal);
        const newNum = newVal === undefined || newVal === null || newVal === '' ? undefined : Number(newVal);
        
        // 如果都是 undefined 或者数值相等，则没有变化
        if (oldNum !== newNum) {
          // 忽略 NaN 情况
          if ((oldNum !== undefined && isNaN(oldNum)) || (newNum !== undefined && isNaN(newNum))) {
            return;
          }
          
          // 如果新值是默认值且原值未定义，不算变更
          const defaultValueMap: Record<string, number> = {
            'temperature': 0.7,
            'top_p': 0.9,
            'frequency_penalty': 0,
            'presence_penalty': 0,
            'max_context_tokens': 4096,
            'max_think_tokens': 1024,
            'chat_round': 10
          };
          
          if (oldNum === undefined && newNum === defaultValueMap[field]) {
            return;
          }
          
          changeList.push({ 
            field, 
            label: fieldLabels[field], 
            oldValue: oldNum === undefined ? '-' : oldNum, 
            newValue: newNum === undefined ? '-' : newNum 
          });
        }
      }
      // 特殊处理 llm_id 字段
      else if (field === 'llm_id') {
        const oldLlmId = oldVal === undefined || oldVal === null ? undefined : Number(oldVal);
        const newLlmId = newVal === undefined || newVal === null || newVal === '' ? undefined : Number(newVal);
        
        if (oldLlmId !== newLlmId) {
          // 获取对应的 LLM 信息
          const oldLlm = llmData?.llm_detail?.find(llm => llm.llm_id === oldLlmId);
          const newLlm = llmData?.llm_detail?.find(llm => llm.llm_id === newLlmId);
          
          const oldDisplay = oldLlm ? `${oldLlm.llm_name} (${oldLlm.supplier_model_id})` : `ID: ${oldLlmId}`;
          const newDisplay = newLlm ? `${newLlm.llm_name} (${newLlm.supplier_model_id})` : `ID: ${newLlmId}`;
          
          changeList.push({ 
            field, 
            label: fieldLabels[field], 
            oldValue: oldLlmId === undefined ? '-' : oldDisplay, 
            newValue: newLlmId === undefined ? '-' : newDisplay 
          });
        }
      }
      // 特殊处理聊天类型
      else if (field === 'chat_type') {
        const oldType = oldVal === undefined || oldVal === null ? undefined : Number(oldVal);
        const newType = newVal === undefined || newVal === null || newVal === '' ? undefined : Number(newVal);
        
        if (oldType !== newType) {
          // 忽略 NaN 情况
          if ((oldType !== undefined && isNaN(oldType)) || (newType !== undefined && isNaN(newType))) {
            return;
          }
          
          // 默认值处理
          if (oldType === undefined && newType === 1) { // 1 = SessionID控制
            return;
          }
          
          changeList.push({
            field,
            label: fieldLabels[field],
            oldValue: oldType === undefined ? '-' : chatTypeMap[oldType] || String(oldType),
            newValue: newType === undefined ? '-' : chatTypeMap[newType] || String(newType),
          });
        }
      }
      // 文本字段
      else if (field === 'reasoning_effort' || field === 'response_format') {
        const oldStr = oldVal === undefined || oldVal === null ? '' : String(oldVal);
        const newStr = newVal === undefined || newVal === null ? '' : String(newVal);
        
        if (oldStr !== newStr) {
          // 默认值处理
          if (oldStr === '' && (newStr === 'medium' || newStr === 'text')) {
            return;
          }
          
          changeList.push({ 
            field, 
            label: fieldLabels[field], 
            oldValue: oldStr || '-', 
            newValue: newStr || '-' 
          });
        }
      }
      // 系统提示词
      else if (field === 'system_prompt') {
        const oldPrompt = oldVal === undefined || oldVal === null ? '' : String(oldVal);
        const newPrompt = newVal === undefined || newVal === null ? '' : String(newVal);
        
        if (oldPrompt.trim() !== newPrompt.trim()) {
          changeList.push({ 
            field, 
            label: fieldLabels[field], 
            oldValue: oldPrompt || '-', 
            newValue: newPrompt || '-' 
          });
        }
      }
      // 数组字段
      else if (field === 'stop' || field === 'enable_tools') {
        const oldArray = Array.isArray(oldVal) ? oldVal : (oldVal ? String(oldVal).split(',').map(s => s.trim()).filter(Boolean) : []);
        const newArray = newVal ? String(newVal).split(',').map(s => s.trim()).filter(Boolean) : [];
        
        const arraysEqual = oldArray.length === newArray.length && 
          oldArray.every((item, index) => item === newArray[index]);
        
        if (!arraysEqual) {
          changeList.push({ 
            field, 
            label: fieldLabels[field], 
            oldValue: oldArray.length > 0 ? oldArray.join(', ') : '-', 
            newValue: newArray.length > 0 ? newArray.join(', ') : '-' 
          });
        }
      }
    });

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

      // 构建请求数据 - 保留原始值，只覆盖有变化的字段
      const updateData: UpdateAgentReq = {
        agent_id: agent.agent_id,
        name: values.name ?? agent.name,
        desc: values.desc ?? agent.desc,
        icon: values.icon ?? agent.icon,
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
          enable_tools: values.enable_tools ? (values.enable_tools as string).split(',').map((s: string) => s.trim()).filter(Boolean) : config.enable_tools,
        },
      };

      setChanges(changeList);
      setPendingData(updateData);
      setConfirmOpen(true);
      setIsEditing(false); // 保存时关闭编辑模式
    } catch {
      message.error('请检查表单填写');
    }
  };

  // 确认保存
  const handleConfirmSave = () => {
    if (pendingData) {
      updateMutation.mutate(pendingData);
    }
  };

  // 查看模式的内容
  const ViewContent = () => (
    <>
      <div style={{ marginBottom: 16, padding: '12px 16px', background: bgColor, borderRadius: 8, border: `1px solid ${borderColor}` }}>
        <Space size="large">
          <div>
            <Text type="secondary">ID</Text>
            <div><Text strong>{agent.agent_id}</Text></div>
          </div>
          <div>
            <Text type="secondary">状态</Text>
            <div>
              <Tag color={agent.status === 0 ? 'success' : 'default'}>
                {agent.status === 0 ? '正常' : '已禁用'}
              </Tag>
            </div>
          </div>
          <div>
            <Text type="secondary">API Key</Text>
            <div>
              <Text code copyable style={{ fontSize: 12 }}>{agent.api_key}</Text>
            </div>
          </div>
        </Space>
      </div>

      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <div style={{ padding: '16px 0' }}>
                <InfoRow label="名称" value={agent.name} />
                <InfoRow label="描述" value={agent.desc} />
                <InfoRow 
                  label="图标" 
                  value={
                    agent.icon ? (
                      <img 
                        src={agent.icon} 
                        alt="Agent图标" 
                        style={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: 8, 
                          objectFit: 'cover',
                          border: `1px solid ${borderColor}`,
                        }} 
                      />
                    ) : '-'
                  } 
                />
                <InfoRow label="创建时间" value={agent.create_time ? new Date(agent.create_time * 1000).toLocaleString('zh-CN') : '-'} />
                <InfoRow label="更新时间" value={agent.update_time ? new Date(agent.update_time * 1000).toLocaleString('zh-CN') : '-'} />
              </div>
            ),
          },
          {
            key: 'model',
            label: '模型配置',
            children: (
              <div style={{ padding: '16px 0' }}>
                <InfoRow label="模型名称" value={currentLlm?.llm_name || '-'} />
                <InfoRow label="供应商" value={<Tag color="blue">{currentLlm?.supplier_name || '-'}</Tag>} />
                <InfoRow label="供应商模型ID" value={<code>{currentLlm?.supplier_model_id || '-'}</code>} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <InfoRow label="温度" value={config.temperature} />
                  <InfoRow label="Top P" value={config.top_p} />
                  <InfoRow label="频率惩罚" value={config.frequency_penalty} />
                  <InfoRow label="存在惩罚" value={config.presence_penalty} />
                </div>
                <InfoRow label="响应格式" value={config.response_format || '默认'} />
                <InfoRow label="停止词" value={config.stop?.join(', ') || '-'} />
              </div>
            ),
          },
          {
            key: 'think',
            label: '深度思考',
            children: (
              <div style={{ padding: '16px 0' }}>
                <InfoRow label="启用状态" value={<Tag color={config.is_think ? 'green' : 'default'}>{config.is_think ? '已开启' : '已关闭'}</Tag>} />
                <InfoRow label="思考力度" value={config.reasoning_effort || '默认'} />
                <InfoRow label="最大上下文Token" value={config.max_context_tokens} />
                <InfoRow label="最大思考Token" value={config.max_think_tokens} />
                <InfoRow label="服务等级保障" value={<Tag color={config.is_service_tier ? 'green' : 'default'}>{config.is_service_tier ? '开启' : '关闭'}</Tag>} />
              </div>
            ),
          },
          {
            key: 'chat',
            label: '会话配置',
            children: (
              <div style={{ padding: '16px 0' }}>
                <InfoRow label="会话模式" value={chatTypeMap[config.chat_type!] || '-'} />
                <InfoRow label="历史轮数" value={config.chat_round} />
                <InfoRow label="可用工具" value={config.enable_tools?.join(', ') || '-'} />
              </div>
            ),
          },
          {
            key: 'prompt',
            label: '系统提示词',
            children: (
              <div style={{ padding: '16px 0' }}>
                <Space style={{ marginBottom: 8 }}>
                  <Text strong>系统提示词</Text>
                  {config.system_prompt && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(config.system_prompt || '');
                        message.success('已复制');
                      }}
                    />
                  )}
                </Space>
                <Paragraph
                  style={{
                    padding: 12,
                    background: bgColor,
                    borderRadius: 8,
                    maxHeight: 200,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    marginBottom: 0,
                    color: textColor,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  {config.system_prompt || '-'}
                </Paragraph>
              </div>
            ),
          },
        ]}
      />
    </>
  );

  // 编辑模式的内容
  const EditContent = () => (
    <Form form={form} layout="vertical" size="small">
      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <div style={{ padding: '16px 0' }}>
                <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                  <Input placeholder="请输入Agent名称" />
                </Form.Item>
                <Form.Item name="desc" label="描述">
                  <TextArea rows={2} placeholder="请输入描述" />
                </Form.Item>
                <Form.Item name="icon" label="图标URL">
                  <Input placeholder="请输入图标URL" />
                </Form.Item>
              </div>
            ),
          },
          {
            key: 'model',
            label: '模型配置',
            children: (
              <div style={{ padding: '16px 0' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                <Form.Item name="stop" label="停止词" extra="多个停止词用逗号分隔">
                  <Input placeholder="如: stop1, stop2" />
                </Form.Item>
              </div>
            ),
          },
          {
            key: 'think',
            label: '深度思考',
            children: (
              <div style={{ padding: '16px 0' }}>
                <Form.Item name="is_think" label="启用深度思考" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="reasoning_effort" label="思考力度">
                  <Select allowClear placeholder="默认">
                    <Select.Option value="low">低</Select.Option>
                    <Select.Option value="medium">中</Select.Option>
                    <Select.Option value="high">高</Select.Option>
                  </Select>
                </Form.Item>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Form.Item name="max_context_tokens" label="最大上下文Token">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="max_think_tokens" label="最大思考Token">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <Form.Item name="is_service_tier" label="服务等级保障" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </div>
            ),
          },
          {
            key: 'chat',
            label: '会话配置',
            children: (
              <div style={{ padding: '16px 0' }}>
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
                <Form.Item name="enable_tools" label="可用工具" extra="多个工具用逗号分隔">
                  <Input placeholder="如: tool1, tool2" />
                </Form.Item>
              </div>
            ),
          },
          {
            key: 'prompt',
            label: '系统提示词',
            children: (
              <div style={{ padding: '16px 0' }}>
                <Form.Item name="system_prompt" label="系统提示词">
                  <TextArea rows={8} placeholder="请输入系统提示词" />
                </Form.Item>
              </div>
            ),
          },
        ]}
      />
    </Form>
  );

  // 主题配置
  const themeConfig = isDark ? {
    algorithm: antTheme.darkAlgorithm,
    token: {
      colorBgContainer: '#1a2332',
      colorBgElevated: '#1a2332',
      colorBorder: '#2a3a4d',
    },
  } : undefined;

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 32 }}>
            <span>Agent 详情 - {agent.name}</span>
            {!isEditing ? (
              <Button type="primary" ghost size="small" onClick={() => {
                setIsEditing(true);
                // 切换到编辑模式时确保表单字段被正确设置
                if (agent) {
                  const config = agent.agent_chat_config || {};
                  const initialValues = {
                    name: agent.name || '',
                    desc: agent.desc || '',
                    icon: agent.icon || '',
                    llm_id: config.llm_id !== undefined ? config.llm_id : undefined,
                    is_think: config.is_think !== undefined ? config.is_think : false,
                    reasoning_effort: config.reasoning_effort || undefined,
                    max_context_tokens: config.max_context_tokens !== undefined ? config.max_context_tokens : 4096,
                    max_think_tokens: config.max_think_tokens !== undefined ? config.max_think_tokens : 1024,
                    is_service_tier: config.is_service_tier !== undefined ? config.is_service_tier : false,
                    response_format: config.response_format || 'text',
                    frequency_penalty: config.frequency_penalty !== undefined ? config.frequency_penalty : 0,
                    presence_penalty: config.presence_penalty !== undefined ? config.presence_penalty : 0,
                    temperature: config.temperature !== undefined ? config.temperature : 0.7,
                    top_p: config.top_p !== undefined ? config.top_p : 0.9,
                    system_prompt: config.system_prompt || '',
                    chat_type: config.chat_type !== undefined ? config.chat_type : 1, // SessionID控制
                    chat_round: config.chat_round !== undefined ? config.chat_round : 10,
                    stop: config.stop?.join(', ') || '',
                    enable_tools: config.enable_tools?.join(', ') || '',
                  };
                  
                  setTimeout(() => {
                    form.setFieldsValue(initialValues);
                  }, 0);
                }
              }}>
                编辑
              </Button>
            ) : (
              <Space>
                <Button size="small" icon={<CloseOutlined />} onClick={() => {
                  setIsEditing(false);
                  // 重置表单到初始状态
                  if (agent) {
                    const config = agent.agent_chat_config || {};
                    const initialValues = {
                      name: agent.name || '',
                      desc: agent.desc || '',
                      icon: agent.icon || '',
                      llm_id: config.llm_id !== undefined ? config.llm_id : undefined,
                      is_think: config.is_think !== undefined ? config.is_think : false,
                      reasoning_effort: config.reasoning_effort || undefined,
                      max_context_tokens: config.max_context_tokens !== undefined ? config.max_context_tokens : 4096,
                      max_think_tokens: config.max_think_tokens !== undefined ? config.max_think_tokens : 1024,
                      is_service_tier: config.is_service_tier !== undefined ? config.is_service_tier : false,
                      response_format: config.response_format || 'text',
                      frequency_penalty: config.frequency_penalty !== undefined ? config.frequency_penalty : 0,
                      presence_penalty: config.presence_penalty !== undefined ? config.presence_penalty : 0,
                      temperature: config.temperature !== undefined ? config.temperature : 0.7,
                      top_p: config.top_p !== undefined ? config.top_p : 0.9,
                      system_prompt: config.system_prompt || '',
                      chat_type: config.chat_type !== undefined ? config.chat_type : 1, // SessionID控制
                      chat_round: config.chat_round !== undefined ? config.chat_round : 10,
                      stop: config.stop?.join(', ') || '',
                      enable_tools: config.enable_tools?.join(', ') || '',
                    };
                    
                    setTimeout(() => {
                      form.setFieldsValue(initialValues);
                    }, 0);
                  }
                }}>
                  取消
                </Button>
                <Button type="primary" size="small" icon={<SaveOutlined />} onClick={handleSave} loading={updateMutation.isPending} disabled={updateMutation.isPending}>
                  保存
                </Button>
              </Space>
            )}
          </div>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={720}
        destroyOnClose
      >
        {isEditing ? <EditContent /> : <ViewContent />}
      </Modal>

      <ChangeConfirmModal
        open={confirmOpen}
        title="确认修改 Agent 配置"
        changes={changes}
        loading={updateMutation.isPending}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </ConfigProvider>
  );
};

// 信息行组件
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ marginBottom: 12, display: 'flex' }}>
    <Text type="secondary" style={{ width: 120, flexShrink: 0 }}>{label}</Text>
    <Text>{value ?? '-'}</Text>
  </div>
);

export default DetailModal;
