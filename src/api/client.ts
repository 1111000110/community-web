import axios from 'axios';
import { message } from 'antd';

const client = axios.create({
  baseURL: '',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
client.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 后端返回格式: { code: 0, message: "...", data: {...} }
    if (res.code === 0) {
      return res.data;
    } else {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message));
    }
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '请求失败';
    message.error(msg);
    return Promise.reject(error);
  }
);

export default client;
