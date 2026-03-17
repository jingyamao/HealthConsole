import { get, post, put, del } from './index';

// 发送AI聊天请求
export async function postAIChat(data) {
  try {
    const params = {
      userId: data.userId,
      sessionId: data.sessionId,
      message: data.message,
    }
    const res = await post('/ai/chat', params);
    return res;
  } catch (error) {
    return Promise.reject(error);
  }
}

// 创建新会话
export async function postNewSession(data) {
  try {
    const params = {
      userId: data.userId,
      firstMessage: data.firstMessage
    }
    const res = await post('/ai/conversations', params);
    return res;
  } catch (error) {
    return Promise.reject(error);
  }
}

// 更新会话标题
export async function putNewTitle(data) {
  try {
    const params = {
      sessionId: data.sessionId,
      title: data.title,
    }
    const res = await put(`/ai/conversations/${params.sessionId}/title`, params);
    return res;
  } catch (error) {
    return Promise.reject(error);
  }
}

// 获取消息列表
export async function getChatHistory(data) {
  try{
    const params = {
      userId: data.userId,
      sessionId: data.sessionId,
    }
    // sessionId 作为路径参数
    const res = await get(`/ai/chat-history/${params.sessionId}`);
    return res;
  } catch (error) {
    return Promise.reject(error);
  }
}

// 获取会话列表
export async function getSessionList(data) {
  try {
    const params = {
      userId: data.userId,
    }
    const res = await get(`/ai/conversations/${params.userId}`);
    return res;
  } catch (error) {
    return Promise.reject(error);
  }
}

// 删除会话
export async function deleteSession(data) {
  try {
    const params = {
      userId: data.userId,
      sessionId: data.sessionId,
    }
    const res = await del(`/ai/conversations/${params.sessionId}`);
    return res;
  } catch (error) {
    return Promise.reject(error);
  }
}