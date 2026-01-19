// LLM 详情
export interface LlmDetail {
  llm_id: number;
  llm_name: string;
  llm_type: number;
  status: number;
  supplier_name: string;
  supplier_model_id: string;
  desc: string;
}

// 获取 LLM 列表请求
export interface GetLlmListReq {}

// 获取 LLM 列表响应
export interface GetLlmListResp {
  llm_detail: LlmDetail[];
}

// 创建 LLM 请求
export interface CreateLlmReq {
  llm_name: string;
  llm_type: number;
  supplier_name: string;
  supplier_model_id: string;
  desc: string;
}

// 创建 LLM 响应
export interface CreateLlmResp {}
