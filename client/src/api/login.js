import { get, post, put, del } from './index';

export async function login(params) {
  try {
    // const res = await post('/login', params);
    const res = '666'
    return res;
  } catch (error) {
    return Promise.reject(error);
  } 
}