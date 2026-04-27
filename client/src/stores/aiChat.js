import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  postAIChat,
  postNewSession,
  putNewTitle,
  getChatHistory,
  getSessionList,
  deleteSession,
} from '@/api/aiChat'
import { useUserStore } from './user'
import { storeToRefs } from 'pinia'

export const useAIChatStore = defineStore('aiChat', () => {
  const userStore = useUserStore()
  const { userInfo } = storeToRefs(userStore)

  //当前用户所有会话列表
  const allAIChatSessionList = ref([])
  // 当前选中的AI聊天会话
  const currentAIChat = ref({
    sessionId: '',
    title: '',
    messages: [],
  })
  // 所有AI聊天会话列表
  const currentAIChatList = ref([])

  //创建新会话
  async function postNewSessionRequest(data) {
    try {
      const params = {
        userId: userInfo.value.userId,
        firstMessage: data.firstMessage,
      }
      const res = await postNewSession(params);
      currentAIChat.value.sessionId = res.data.conversation.id;
      currentAIChat.value.title = res.data.conversation.title;
      currentAIChatList.value.push(currentAIChat.value);
      // 同时更新左侧会话列表，使其立即显示新会话
      allAIChatSessionList.value.unshift({
        id: res.data.conversation.id,
        sessionId: res.data.conversation.id,
        title: res.data.conversation.title,
        createdAt: res.data.conversation.createdAt
      });
      try {
        localStorage.setItem('currentAIChatList', JSON.stringify(currentAIChatList.value));
      } catch (e) {
        console.warn('[Store] localStorage保存失败:', e)
      }
      return res;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // 发送AI聊天请求
  async function postAIChatRequest(data) {
    try {
      const params = {
        userId: userInfo.value.userId,
        sessionId: data.sessionId,
        message: data.message,
      }
      const res = await postAIChat(params);
      currentAIChat.value.messages.push({
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date().toISOString()
      });
      // 同时更新本地会话列表
      const chatIndex = currentAIChatList.value.findIndex(chat => chat.sessionId === data.sessionId);
      if (chatIndex !== -1) {
        currentAIChatList.value[chatIndex].title = res.data.title;
      }
      localStorage.setItem('currentAIChatList', JSON.stringify(currentAIChatList.value));
      return res;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // 发送AI聊天请求（返回完整响应，由组件处理打字机效果）
  async function postAIChatStreamRequest(data) {
    const params = {
      userId: userInfo.value.userId,
      sessionId: data.sessionId,
      message: data.message,
    }

    // 直接 await，错误由组件处理
    const res = await postAIChat(params)
    return res
  }
  
  // 更新会话标题
  async function putNewTitleRequest(data) {
    try {
      const params = {
        sessionId: data.sessionId,
        title: data.title,
      }
      const res = await putNewTitle(params);
      return res;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  //获取消息列表
  async function getChatHistoryRequest(sessionId) {
    try {
      const params = {
        userId: userInfo.value.userId,
        sessionId: sessionId,
      }
      const res = await getChatHistory(params);
      currentAIChat.value.messages = res.data.messages;
      return res;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  //获取会话列表
  async function getSessionListRequest() {
    try {
      const params = {
        userId: userInfo.value.userId,
      }
      const res = await getSessionList(params);
      allAIChatSessionList.value = res.data.conversations;
      return res;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  //删除会话
  async function deleteSessionRequest(payload) {
    try {
      const normalizedSessionId = typeof payload === 'string'
        ? payload
        : payload?.sessionId

      const params = {
        userId: userInfo.value.userId,
        sessionId: normalizedSessionId,
      }
      const res = await deleteSession(params);
      return res;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // 切换当前选中的AI聊天会话
  async function switchCurrentAIChat(sessionId) {
    if (sessionId === currentAIChat.value.sessionId) {
      return;
    }
    // 先在本地列表中查找
    const existingChat = currentAIChatList.value.find(chat => chat.sessionId === sessionId);
    if (existingChat) {
      currentAIChat.value = { ...existingChat };
    } else {
      try {
        const res = await getChatHistoryRequest(sessionId);
        const newChat = {
          sessionId: sessionId,
          title: res.data.title ,
          messages: res.data.messages || []
        };

        currentAIChatList.value.push(newChat);
        localStorage.setItem('currentAIChatList', JSON.stringify(currentAIChatList.value));
        
        currentAIChat.value = newChat;
      } catch (error) {
        console.error('获取会话信息失败:', error);
        throw error;
      }
    }
  }

  // 初始化ai聊天页面
  function initAIChatPage() {
    const storedChatList = localStorage.getItem('currentAIChatList');
    if (storedChatList) {
      currentAIChatList.value = JSON.parse(storedChatList);
    }
    getSessionListRequest();
  }

  return {
    currentAIChat,
    currentAIChatList,
    allAIChatSessionList,
    postNewSessionRequest,
    postAIChatRequest,
    postAIChatStreamRequest,
    putNewTitleRequest,
    getChatHistoryRequest,
    getSessionListRequest,
    deleteSessionRequest,
    switchCurrentAIChat,
    initAIChatPage,
  }
})
