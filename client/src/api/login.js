import { get, post, put, del } from './index';

export async function login(data) {
  try {
    const params = {
      userId: data.userId,
      userName: data.userName,
    }
    const res = await post('/user/login', params);
    return res;
  } catch (error) {
    return Promise.reject(error);
  } 
}

export async function loginOut() {
  try {
    const res = await post('/user/logout');
    return res;
  } catch (error) {
    return Promise.reject(error);
  } 
}