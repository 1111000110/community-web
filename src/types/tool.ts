// 工具详情
export interface ToolDetail {
  name: string;
  description: string;
  parameters_json: string;
}

// 获取工具列表响应
export interface GetToolListResp {
  tool_list: ToolDetail[];
}

// 获取工具列表请求
export interface GetToolListReq {}