import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // 接口基础路径
  timeout: 60000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器
instance.interceptors.request.use((config) => {
  return config;
}, () => {
});

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const { status, data } = response;
    if (status === 200) {
      return data;
    } else {
      return Promise.reject(response);
    }
  },
  (error) => {
    const { response } = error;
    if (!response?.data) return Promise.reject(error);
    // 错误请求提示统一处理
    const { data } = response;
    return Promise.reject(error);
  }
);

const get = (url, params = {}, config = { baseURL: '', headers: {} }) => {
  const { baseURL, headers } = config;
  return new Promise((resolve, reject) => {
    instance({
      method: 'get',
      url,
      params,
      baseURL,
      headers,
    }).then(res => {
      resolve(res);
    }).catch(err => {
      reject(err);
    });
  });
};

const post = (url, params = {}, config = { baseURL: '', headers: {} }) => {
  const { baseURL, headers } = config;
  return new Promise((resolve, reject) => {
    instance({
      method: 'post',
      url,
      data: params,
      baseURL,
      headers,
    }).then(res => {
      resolve(res);
    }).catch(err => {
      reject(err);
    });
  });
};

const put = (url, params = {}, config = { baseURL: '', headers: {} }) => {
  const { baseURL, headers } = config;
  return new Promise((resolve, reject) => {
    instance({
      method: 'put',
      url,
      data: params,
      baseURL,
      headers,
    }).then(res => {
      resolve(res);
    }).catch(err => {
      reject(err);
    });
  });
};

const del = (url, params = {}, config = { baseURL: '', headers: {} }) => {
  const { baseURL, headers } = config;
  return new Promise((resolve, reject) => {
    instance({
      method: 'delete',
      url,
      data: params,
      baseURL,
      headers,
    }).then(res => {
      resolve(res);
    }).catch(err => {
      reject(err);
    });
  });
};

export {
  get,
  post,
  put,
  del,
};