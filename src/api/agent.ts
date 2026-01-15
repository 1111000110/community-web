import client from './client';
import type {
  CreateAgentReq,
  GetAgentListResp,
  GetAgentListReq,
  RunAgentReq,
  RunAgentResp,
  UpdateAgentReq,
  DeleteAgentReq,
} from '../types/agent';

// 获取Agent列表
export const getAgentList = (data?: GetAgentListReq): Promise<GetAgentListResp> => {
  return client.post('/api/ai/agent/list', data || {});
};

// 创建Agent
export const createAgent = (data: CreateAgentReq): Promise<void> => {
  return client.post('/api/ai/agent/create', data);
};

// 运行Agent
export const runAgent = (data: RunAgentReq): Promise<RunAgentResp> => {
  return client.post('/api/ai/agent/run', data);
};

// 更新Agent
export const updateAgent = (data: UpdateAgentReq): Promise<void> => {
  return client.post('/api/ai/agent/update', data);
};

// 删除Agent
export const deleteAgent = (data: DeleteAgentReq): Promise<void> => {
  return client.post('/api/ai/agent/delete', data);
};
