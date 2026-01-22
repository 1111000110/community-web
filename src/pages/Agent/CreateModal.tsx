import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Typography,
  Space,
  Tabs,
  Collapse,
  Row,
  Col,
  Tooltip,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getLlmList } from '../../api/llm';
import { getToolList } from '../../api/tool';
import type { CreateAgentReq } from '../../types/agent';
import type { ToolDetail } from '../../types/tool';

interface CreateModalProps {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onOk: (values: CreateAgentReq) => void;
}

const { TextArea } = Input;
const { Text } = Typography;

// 参数说明配置
const paramTooltips = {
  temperature: (
    <div style={{ maxWidth: 300 }}>
      <p><strong>温度 (Temperature)</strong></p>
      <p>控制输出的随机性。值越高，回复越多样化但可能不太准确；值越低，回复越确定和保守。</p>
      <p><strong>参考值：</strong></p>
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        <li>代码生成/精确问答：0.1-0.3</li>
        <li>通用对话/客服：0.5-0.7</li>
        <li>创意写作/头脑风暴：0.8-1.2</li>
      </ul>
    </div>
  ),
  top_p: (
    <div style={{ maxWidth: 300 }}>
      <p><strong>Top P (核采样)</strong></p>
      <p>从累积概率达到P的候选词中采样。与温度一起控制多样性，通常只调整一个即可。</p>
      <p><strong>参考值：</strong></p>
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        <li>精确任务：0.1-0.3</li>
        <li>通用场景：0.7-0.9</li>
        <li>创意场景：0.9-1.0</li>
      </ul>
    </div>
  ),
  frequency_penalty: (
    <div style={{ maxWidth: 300 }}>
      <p><strong>频率惩罚 (Frequency Penalty)</strong></p>
      <p>根据词语在文本中出现的<strong>次数</strong>进行惩罚。正值减少重复用词，负值增加重复。</p>
      <p><strong>参考值：</strong></p>
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        <li>默认/正常对话：0</li>
        <li>避免啰嗦/写文章：0.3-0.8</li>
        <li>需要一致性表述：-0.5-0</li>
      </ul>
    </div>
  ),
  presence_penalty: (
    <div style={{ maxWidth: 300 }}>
      <p><strong>存在惩罚 (Presence Penalty)</strong></p>
      <p>根据词语<strong>是否出现过</strong>进行惩罚（不考虑次数）。正值鼓励新话题，负值让模型更专注当前话题。</p>
      <p><strong>参考值：</strong></p>
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        <li>默认/问答场景：0</li>
        <li>开放式对话/探索新话题：0.3-0.8</li>
        <li>深入单一话题：-0.5-0</li>
      </ul>
    </div>
  ),
};

// 带帮助图标的Label组件
const LabelWithTooltip: React.FC<{ label: string; tooltip: React.ReactNode }> = ({ label, tooltip }) => (
  <Space size={4}>
    {label}
    <Tooltip title={tooltip} placement="top">
      <QuestionCircleOutlined style={{ color: '#999', cursor: 'pointer' }} />
    </Tooltip>
  </Space>
);

const CreateModal: React.FC<CreateModalProps> = ({
  open,
  loading,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();

  // 获取LLM列表
  const { data: llmData } = useQuery({
    queryKey: ['llmList'],
    queryFn: () => getLlmList(),
    enabled: open, // 只有模态框打开时才请求
  });

  // 获取工具列表
  const { data: toolData } = useQuery({
    queryKey: ['toolList'],
    queryFn: () => getToolList(),
    enabled: open, // 只有模态框打开时才请求
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理停止词（逗号分隔转数组）
      const stopWords = values.stop
        ? values.stop.split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined;
      
      // 处理可用工具（逗号分隔转数组）
      const enableTools = values.enable_tools
        ? values.enable_tools.split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined;

      const req: CreateAgentReq = {
        name: values.name,
        desc: values.desc,
        icon: values.icon,
        agent_chat_config: {
          llm_id: values.llm_id,
          system_prompt: values.system_prompt,
          temperature: values.temperature,
          top_p: values.top_p,
          max_context_tokens: values.max_context_tokens,
          max_think_tokens: values.max_think_tokens,
          is_think: values.is_think,
          reasoning_effort: values.reasoning_effort,
          is_service_tier: values.is_service_tier,
          chat_type: values.chat_type,
          chat_round: values.chat_round,
          response_format: values.response_format,
          frequency_penalty: values.frequency_penalty,
          presence_penalty: values.presence_penalty,
          stop: stopWords,
          enable_tools: enableTools,
          tool_config: (values.kb_top_k || values.web_top_k) ? {
            kb: values.kb_top_k ? {
              top_k: values.kb_top_k,
              score_threshold: values.kb_score_threshold,
              knowledge_list: values.kb_knowledge_list
                ? values.kb_knowledge_list.split(',').map((s: string) => s.trim()).filter(Boolean)
                : undefined,
            } : undefined,
            web: values.web_top_k ? {
              top_k: values.web_top_k,
              recency_days: values.web_recency_days,
              max_calls_per_turn: values.web_max_calls,
              allow_domains: values.web_allow_domains
                ? values.web_allow_domains.split(',').map((s: string) => s.trim()).filter(Boolean)
                : undefined,
              block_domains: values.web_block_domains
                ? values.web_block_domains.split(',').map((s: string) => s.trim()).filter(Boolean)
                : undefined,
            } : undefined,
          } : undefined,
        },
      };
      onOk(req);
    } catch (error) {
      // 表单验证失败
        console.error(error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入Agent名称' }]}
          >
            <Input placeholder="例如：智能客服助手" />
          </Form.Item>

          <Form.Item name="desc" label="描述">
            <TextArea rows={2} placeholder="描述这个Agent的功能" />
          </Form.Item>

          <Form.Item name="icon" label="图标URL">
            <Input placeholder="Agent头像图片地址（可选）" />
          </Form.Item>

          <Form.Item
            name="system_prompt"
            label="系统提示词"
            rules={[{ required: true, message: '请输入系统提示词' }]}
          >
            <TextArea
              rows={4}
              placeholder="定义Agent的角色和行为规范..."
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'model',
      label: '模型配置',
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
                ?.filter((llm) => llm.status === 0) // 只显示正常状态的模型
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

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="temperature"
                label={<LabelWithTooltip label="温度 [0-2]" tooltip={paramTooltips.temperature} />}
              >
                <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="top_p"
                label={<LabelWithTooltip label="Top P [0-1]" tooltip={paramTooltips.top_p} />}
              >
                <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="max_context_tokens" label="最大上下文Token">
                <InputNumber min={256} max={128000} step={256} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="frequency_penalty"
                label={<LabelWithTooltip label="频率惩罚 [-2,2]" tooltip={paramTooltips.frequency_penalty} />}
              >
                <InputNumber min={-2} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="presence_penalty"
                label={<LabelWithTooltip label="存在惩罚 [-2,2]" tooltip={paramTooltips.presence_penalty} />}
              >
                <InputNumber min={-2} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="response_format" label="返回格式">
                <Select>
                  <Select.Option value="text">text</Select.Option>
                  <Select.Option value="json_object">json_object</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="stop" label="停止词">
            <Input placeholder="多个停止词用逗号分隔" />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'thinking',
      label: '深度思考',
      children: (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="is_think" label="启用深度思考" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reasoning_effort" label="思考力度">
                <Select allowClear>
                  <Select.Option value="low">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="max_think_tokens" label="最大思考Token">
                <InputNumber min={0} max={32000} step={256} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="is_service_tier" label="TPM保障包" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'session',
      label: '会话配置',
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="chat_type" label="会话模式">
                <Select>
                  <Select.Option value={0}>每次新会话</Select.Option>
                  <Select.Option value={1}>SessionID控制</Select.Option>
                  <Select.Option value={2}>永久会话</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="chat_round" label="历史轮数上限">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'tools',
      label: '工具配置',
      children: (
        <>
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

          <Collapse
            items={[
              {
                key: 'kb',
                label: '知识库检索配置',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="kb_top_k" label="返回文档数">
                          <InputNumber min={1} max={20} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="kb_score_threshold" label="相似度阈值 [0-1]">
                          <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="kb_knowledge_list" label="知识库列表">
                      <Input placeholder="多个知识库ID用逗号分隔" />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'web',
                label: '联网搜索配置',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="web_top_k" label="返回结果数">
                          <InputNumber min={1} max={20} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="web_recency_days" label="时间范围(天)">
                          <InputNumber min={1} max={365} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="web_max_calls" label="每轮最大调用">
                          <InputNumber min={1} max={10} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="web_allow_domains" label="域名白名单">
                      <Input placeholder="多个域名用逗号分隔" />
                    </Form.Item>
                    <Form.Item name="web_block_domains" label="域名黑名单">
                      <Input placeholder="多个域名用逗号分隔" />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </>
      ),
    },
  ];

  return (
    <Modal
      title="创建 Agent"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={720}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          temperature: 0.7,
          top_p: 0.9,
          max_context_tokens: 4096,
          max_think_tokens: 1024,
          is_think: false,
          reasoning_effort: 'medium',
          is_service_tier: false,
          chat_type: 1,
          chat_round: 10,
          response_format: 'text',
          frequency_penalty: 0,
          presence_penalty: 0,
        }}
      >
        <Tabs items={tabItems} />
      </Form>
    </Modal>
  );
};

export default CreateModal;
