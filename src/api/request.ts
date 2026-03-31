import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from '@ai-flow/components/common/AntdStaticFunction';
import { getRuntimeBaseURL, getRuntimeProjectId, getRuntimeToken } from '@ai-flow/utils/runtime';

// 定义通用响应结构
interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
}

const config: AxiosRequestConfig = {
  // 从环境变量获取 Base URL，开发环境为 /api，生产环境为实际地址
  baseURL: getRuntimeBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

const request: AxiosInstance = axios.create(config);

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    config.baseURL = getRuntimeBaseURL();

    // 从运行时配置或 LocalStorage 获取 Token
    const token = getRuntimeToken();
    const projectId = getRuntimeProjectId();
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    if (projectId) {
      config.headers['x-project-id'] = projectId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    const res = response.data;
    
    // 业务逻辑处理
    if (res.code === 1000) {
        return res;
    }

    // 业务失败
    if (res.code === 1001) {
        message.error(res?.message || '业务处理失败');
        return Promise.reject(new Error(res?.message || 'Error'));
    }

    // 401: 未授权
    if (res.code === 401) {
        message.error(res?.message || '登录已失效，请重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(new Error(res?.message || 'Unauthorized'));
    }

    // 403: 无权限
    if (res.code === 403) {
        message.error(res?.message || '无权访问该资源');
        return Promise.reject(new Error(res?.message || 'Forbidden'));
    }

    // 500: 服务器错误
    if (res.code === 500) {
        message.error(res?.message || '服务器内部错误');
        return Promise.reject(new Error(res?.message || 'Server Error'));
    }

    // 其他未知错误
    if (res.code !== 200) { // 兼容部分旧接口可能返回 200
        message.error(res?.message || '系统错误');
        return Promise.reject(new Error(res?.message || 'Error'));
    } else {
        return res;
    }
  },
  (error) => {
    // 处理 HTTP 状态码错误
    let msg = '';
    const status = error.response?.status;
    
    switch (status) {
      case 400: msg = '请求错误'; break;
      case 401: msg = '未授权，请登录'; break;
      case 403: msg = '拒绝访问'; break;
      case 404: msg = '请求地址出错'; break;
      case 500: msg = '服务器内部错误'; break;
      default: msg = '网络连接故障';
    }
    
    message.error(msg);
    return Promise.reject(error);
  }
);

export default request;
