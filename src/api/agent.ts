import client from './client';
import type {
  CreateAgentReq,
  GetAgentListResp,
  GetAgentListReq,
  RunAgentReq,
  RunAgentResp,
  UpdateAgentReq,
  DeleteAgentReq,
  RunAgentStreamReq,
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

// 流式运行Agent - 使用 fetch 实现 SSE
export interface StreamClient {
  addEventListener: (type: string, listener: (data: any) => void) => void;
  removeEventListener: (type: string, listener: (data: any) => void) => void;
  close: () => void;
}

export const runAgentStream = (data: RunAgentStreamReq): StreamClient => {
  // 创建一个简单的 SSE 客户端
  const listeners: Record<string, ((data: any) => void)[]> = {};
  
  const addEventListener = (type: string, listener: (data: any) => void) => {
    if (!listeners[type]) {
      listeners[type] = [];
    }
    listeners[type].push(listener);
  };
  
  const removeEventListener = (type: string, listener: (data: any) => void) => {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter(fn => fn !== listener);
    }
  };
  
  // 使用 AbortController 控制请求
  const controller = new AbortController();
  
  // 发起 POST 请求并处理 SSE 响应
  const fetchData = async () => {
    try {
      const response = await fetch(`${client.defaults.baseURL}/api/ai/agent/run/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) {
            // 流完成，触发任何可能的剩余缓冲数据
            if (buffer.trim()) {
              const lines = buffer.split('\n');
              for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                  const dataStr = line.trim().substring(6).trim();
                  if (dataStr) {
                    try {
                      const parsedData = JSON.parse(dataStr);
                      // 触发所有 'message' 事件监听器
                      if (listeners['message']) {
                        listeners['message'].forEach(listener => listener(parsedData));
                      }
                    } catch (e) {
                      console.error('Error parsing SSE data:', e);
                      // 如果解析失败，也尝试触发监听器
                      if (listeners['message']) {
                        listeners['message'].forEach(listener => listener(dataStr));
                      }
                    }
                  }
                }
              }
            }
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // 按行分割并处理 SSE 格式的数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保存最后一行（可能是不完整的）
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              const dataStr = trimmedLine.substring(6).trim();
              if (dataStr) {
                try {
                  const parsedData = JSON.parse(dataStr);
                  // 检查是否是 message_end，如果是则提前终止连接
                  if (parsedData.type === 'message_end') {
                    // 触发 'message' 事件
                    if (listeners['message']) {
                      listeners['message'].forEach(listener => listener(parsedData));
                    }
                    // 主动中断读取循环
                    setTimeout(() => {
                      controller.abort();
                      if (listeners['close']) {
                        listeners['close'].forEach(listener => listener({}));
                      }
                    }, 100); // 稍微延迟以确保消息被处理
                    continue; // 跳过后续处理
                  }
                  // 触发所有 'message' 事件监听器
                  if (listeners['message']) {
                    listeners['message'].forEach(listener => listener(parsedData));
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                  // 如果解析失败，也尝试触发监听器
                  if (listeners['message']) {
                    listeners['message'].forEach(listener => listener(dataStr));
                  }
                }
              }
            } else if (trimmedLine.startsWith('event: ') && trimmedLine.includes('close')) {
              // 如果收到 close 事件，也中断连接
              setTimeout(() => {
                controller.abort();
                if (listeners['close']) {
                  listeners['close'].forEach(listener => listener({}));
                }
              }, 100);
            }
          }
          // 如果已中断，则跳出外层循环
          if (controller.signal.aborted) {
            break;
          }
        }
      } else {
        throw new Error(`Request failed with status: ${response.status}`);
      }
    } catch (error) {
      if (!controller.signal.aborted && error !== 'AbortError') {
        // 触发错误事件
        if (listeners['error']) {
          listeners['error'].forEach(listener => listener(error));
        }
      }
    }
  };
  
  // 启动请求
  fetchData();
  
  return {
    addEventListener,
    removeEventListener,
    close: () => {
      controller.abort();
    },
  };
};

// 更新Agent
export const updateAgent = (data: UpdateAgentReq): Promise<void> => {
  return client.post('/api/ai/agent/update', data);
};

// 删除Agent
export const deleteAgent = (data: DeleteAgentReq): Promise<void> => {
  return client.post('/api/ai/agent/delete', data);
};