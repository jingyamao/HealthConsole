import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // 接口基础路径
  timeout: 60000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const { data } = response;
    return data;
  },
  (error) => {
    // 不在此处弹窗，由各组件自行处理错误
    return Promise.reject(error);
  }
);

const get = (url, params = {}, config = {}) => {
  const { baseURL, headers } = config;
  return new Promise((resolve, reject) => {
    instance({
      method: 'get',
      url,
      params,
      headers: { ...instance.defaults.headers, ...headers },
    }).then(res => {
      resolve(res);
    }).catch(err => {
      reject(err);
    });
  });
};

const post = (url, params = {}, config = {}) => {
  const { baseURL, headers } = config;
  return new Promise((resolve, reject) => {
    instance({
      method: 'post',
      url,
      data: params,
      baseURL,
      headers: { ...instance.defaults.headers, ...headers },
    }).then(res => {
      resolve(res);
    }).catch(err => {
      reject(err);
    });
  });
};

const put = (url, params = {}, config = {}) => {
  const { baseURL, headers } = config;
  return new Promise((resolve, reject) => {
    instance({
      method: 'put',
      url,
      data: params,
      baseURL,
      headers: { ...instance.defaults.headers, ...headers },
    }).then(res => {
      resolve(res);
    }).catch(err => {
      reject(err);
    });
  });
};

const del = (url, params = {}, config = {}) => {
  const { baseURL, headers } = config;
  return new Promise((resolve, reject) => {
    instance({
      method: 'delete',
      url,
      data: params,
      baseURL,
      headers: { ...instance.defaults.headers, ...headers },
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