import client from './client';
import type {
  GetLlmListReq,
  GetLlmListResp,
  CreateLlmReq,
  CreateLlmResp,
} from '../types/llm';

// 获取LLM列表
export const getLlmList = (data?: GetLlmListReq): Promise<GetLlmListResp> => {
  return client.post('/api/ai/llm/list', data || {});
};

// 创建LLM
export const createLlm = (data: CreateLlmReq): Promise<CreateLlmResp> => {
  return client.post('/api/ai/llm/create', data);
};
