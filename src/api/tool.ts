import client from './client';
import type { GetToolListReq, GetToolListResp } from '../types/tool';

// 获取工具列表
export const getToolList = (params?: GetToolListReq): Promise<GetToolListResp> => {
  return client.post('/api/ai/tool/list', params || {});
};