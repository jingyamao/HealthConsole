<template>
  <div class="ai-chat-container">
    <!-- 左侧会话列表 -->
    <div class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <span class="sidebar-title">历史会话</span>
        <el-icon class="new-chat-icon" @click="createNewChat" title="新建聊天"><Plus /></el-icon>
      </div>
      
      <!-- 会话列表 -->
      <div class="session-list">
        <div
          v-for="(session, index) in allAIChatSessionList"
          :key="session.sessionId || session.id || index"
          class="session-item"
          :class="{ 'active': currentAIChat.sessionId === (session.sessionId || session.id) }"
          @click="switchSession(session.sessionId || session.id)"
        >
          <el-icon><ChatDotRound /></el-icon>
          <!-- 标题显示/编辑区域 -->
          <div class="session-title-wrapper" >
            <input
              v-if="editingSessionId === (session.sessionId || session.id)"
              v-model="editingTitle"
              class="session-title-input"
              @blur="saveTitle(session)"
              @keydown.enter="saveTitle(session)"
              @keydown.esc="cancelEdit"
            />
            <el-tooltip
              v-else
              :content="session.title || '新会话'"
              placement="top"
              :show-after="500"
            >
              <span
                class="session-title"
                @dblclick="startEdit(session)"
              >{{ session.title || '新会话' }}</span>
            </el-tooltip>
          </div>
          <div class="session-actions">
            <el-icon class="edit-icon" @click.stop="startEdit(session)"><Edit /></el-icon>
            <el-icon class="delete-icon" @click.stop="deleteSession(session.sessionId || session.id)"><Delete /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="main-chat">
      <!-- 顶部标题栏 -->
      <div class="chat-header">
        <div class="header-left">
          <el-icon class="toggle-sidebar" @click="toggleSidebar"><Fold /></el-icon>
          <span class="chat-title">{{ currentAIChat.title || '新会话' }}</span>
        </div>
        <div class="header-actions">
          <el-icon class="action-icon" @click="deleteSession"><Delete /></el-icon>
          <el-icon class="action-icon" @click="exportChat"><Download /></el-icon>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="currentAIChat.messages.length === 0 && !isLoading" class="welcome-area">
          <div class="welcome-content">
            <h2>有什么可以帮你的？</h2>
            <p>我是您的 AI 助手，可以回答您的问题、协助创作、提供建议等</p>
          </div>
        </div>
        
        <div
          v-for="(message, index) in currentAIChat.messages"
          :key="index"
          class="message-item"
          :class="message.role"
        >
          <div class="message-avatar">
            <img
              v-if="message.role === 'user'"
              src="@/assets/1.png"
              alt="用户头像"
            />
            <img
              v-else
              src="@/assets/2.png"
              alt="AI头像"
            />
          </div>
          <div class="message-content">
            <div class="message-text markdown-body" v-html="formatMessage(message.content)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <!-- 加载中提示 -->
        <div v-if="isLoading" class="message-item assistant loading">
          <div class="message-avatar">
            <img src="@/assets/2.png" alt="AI头像" />
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-wrapper">
          <textarea
            v-model="inputMessage"
            class="chat-input"
            placeholder="输入消息..."
            @keydown.enter.prevent="sendMessage"
            @input="autoResize"
            ref="inputRef"
            :disabled="isLoading"
          ></textarea>
          <div class="input-actions">
            <el-icon class="send-btn" :class="{ 'active': inputMessage.trim() && !isLoading }" @click="sendMessage">
              <Promotion />
            </el-icon>
          </div>
        </div>
        <div class="input-footer">
          <span class="hint">按 Enter 发送，Shift + Enter 换行</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import { Plus, ChatDotRound, Edit, Delete, Fold, Download, Promotion } from '@element-plus/icons-vue'
import { useAIChatStore } from '@/stores/aiChat'

const aiChatStore = useAIChatStore()
const { allAIChatSessionList, currentAIChat } = storeToRefs(aiChatStore)

// 状态
const inputMessage = ref('')
const isLoading = ref(false)
const isSidebarCollapsed = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)

// 编辑标题相关状态
const editingSessionId = ref(null)
const editingTitle = ref('')

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 检测屏幕宽度，小于768px时自动折叠侧边栏
const checkScreenWidth = () => {
  if (window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  } else {
    isSidebarCollapsed.value = false
  }
}

// 创建新聊天
const createNewChat = async () => {
  // 如果当前聊天为空（没有消息），则不创建新会话
  if (currentAIChat.value.messages.length === 0) {
    return
  } else {
    currentAIChat.value = {
      sessionId: '',
      title: '',
      messages: []
    }
  }
}

// 切换会话
const switchSession = async (sessionId) => {
  try {
    await aiChatStore.switchCurrentAIChat(sessionId)
    scrollToBottom()
  } catch (error) {
    ElMessage.error('切换会话失败')
  }
}

// 获取会话ID（兼容不同字段名）
const getSessionId = (session) => {
  return session.sessionId || session.id
}

// 开始编辑标题
const startEdit = (session) => {
  const sessionId = getSessionId(session)
  editingSessionId.value = sessionId
  editingTitle.value = session.title || '新会话'
}

// 保存标题
const saveTitle = async (session) => {
  const sessionId = getSessionId(session)
  const newTitle = editingTitle.value.trim()
  if (!newTitle) {
    ElMessage.warning('标题不能为空')
    editingTitle.value = session.title || '新会话'
    editingSessionId.value = null
    return
  }
  
  if (newTitle !== session.title) {
    try {
      await aiChatStore.putNewTitleRequest({
        sessionId: sessionId,
        title: newTitle
      })
      // 更新本地数据
      session.title = newTitle
      // 如果是当前选中的会话，也更新当前会话的标题
      if (currentAIChat.value.sessionId === sessionId) {
        currentAIChat.value.title = newTitle
      }
      ElMessage.success('修改标题成功')
    } catch (error) {
      ElMessage.error('修改标题失败')
    }
  }
  editingSessionId.value = null
}

// 取消编辑
const cancelEdit = () => {
  editingSessionId.value = null
  editingTitle.value = ''
}

// 删除会话
const deleteSession = async (sessionId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await aiChatStore.deleteSessionRequest({ sessionId })
    await aiChatStore.getSessionListRequest()
    ElMessage.success('删除会话成功')
  } catch (error) {
    // 用户取消或删除失败
  }
}

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return
  
  // 立即显示用户消息
  const userMessage = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  }
  currentAIChat.value.messages.push(userMessage)
  
  // 清空输入框
  inputMessage.value = ''
  autoResize()
  scrollToBottom()
  
  // 显示 loading
  isLoading.value = true
  
  // 如果没有当前会话，先创建新会话
  if (!currentAIChat.value.sessionId) {
    try {
      const params = {
        firstMessage: message
      }
      await aiChatStore.postNewSessionRequest(params)
    } catch (error) {
      ElMessage.error('创建会话失败')
      return
    }
  }

  try {
    // 调用 API，等待后端返回
    const res = await aiChatStore.postAIChatRequest({
      sessionId: currentAIChat.value.sessionId,
      message: message
    })
    // API 返回后，AI 回复已经通过 store 添加到列表中
    scrollToBottom()
  } catch (error) {
    ElMessage.error('发送消息失败')
  } finally {
    isLoading.value = false
  }
}

// 导出聊天
const exportChat = () => {
  const messages = currentAIChat.value.messages
  if (messages.length === 0) {
    ElMessage.warning('没有可导出的聊天记录')
    return
  }
  
  const content = messages.map(m => {
    const role = m.role === 'user' ? '用户' : 'AI'
    const time = new Date(m.timestamp).toLocaleString()
    return `[${time}] ${role}:\n${m.content}\n`
  }).join('\n---\n\n')
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `聊天记录_${currentAIChat.value.title || '新会话'}_${new Date().toLocaleDateString()}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('导出成功')
}

// 格式化消息内容
const formatMessage = (content) => {
  if (!content) return ''
  
  // 配置 marked 选项
  marked.setOptions({
    breaks: true,  // 支持换行
    gfm: true,     // 支持 GitHub Flavored Markdown
    headerIds: false,  // 不生成 header id
    mangle: false,     // 不转义邮件地址
    sanitize: false,   // 不进行 HTML 转义（使用 DOMPurify 更好，这里简化处理）
  })
  
  try {
    return marked.parse(content)
  } catch (error) {
    // 如果解析失败，返回原始文本
    return content.replace(/\n/g, '<br>')
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 自动调整输入框高度
const autoResize = () => {
  nextTick(() => {
    const textarea = inputRef.value
    if (textarea) {
      textarea.style.height = '44px'
      const newHeight = Math.min(textarea.scrollHeight, 200)
      textarea.style.height = newHeight + 'px'
    }
  })
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(() => currentAIChat.value.messages, scrollToBottom, { deep: true })

// 初始化
onMounted(() => {
  aiChatStore.initAIChatPage()
  // 初始检测屏幕宽度
  checkScreenWidth()
  // 监听窗口大小变化
  window.addEventListener('resize', checkScreenWidth)
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', checkScreenWidth)
})
</script>

<style lang="less" scoped>
.ai-chat-container {
  display: flex;
  height: 100%;
  background-color: #f9f9f9;
  overflow: hidden;

  // 侧边栏
  .sidebar {
    width: 200px;
    min-width: 200px;
    background-color: #ffffff;
    border-right: 1px solid #e5e5e5;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease, margin-left 0.3s ease;
    transform: translateX(0);

    &.collapsed {
      transform: translateX(-100%);
      margin-left: -200px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px;
      border-bottom: 1px solid #e5e5e5;

      .sidebar-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .new-chat-icon {
        font-size: 20px;
        color: #006b7d;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: all 0.2s ease;

        &:hover {
          background-color: #e8f4f8;
          transform: scale(1.1);
        }
      }
    }

    .session-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px;
      background: linear-gradient(180deg, #f0f4f8 0%, #e8eef5 100%);

      .session-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 8px;
        margin-bottom: 6px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

        &:hover {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);

          .session-actions {
            opacity: 1;
          }
        }

        &.active {
          background: linear-gradient(135deg, #006b7d 0%, #008ba3 100%);
          color: #ffffff;
          border-color: #006b7d;
          box-shadow: 0 4px 12px rgba(0, 107, 125, 0.25);

          .session-title {
            color: #ffffff;
          }

          .el-icon {
            color: #ffffff;
          }

          .session-actions .el-icon {
            color: #ffffff;

            &:hover {
              background-color: rgba(255, 255, 255, 0.2);
            }
          }
        }

        .el-icon {
          font-size: 16px;
          flex-shrink: 0;
          color: #64748b;
        }

        .session-title-wrapper {
          flex: 1;
          min-width: 0;
          margin-right: 6px;
          .session-title {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #334155;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 4px;
            transition: background-color 0.2s ease;

            &:hover {
              background-color: rgba(0, 0, 0, 0.05);
            }
          }

          .session-title-input {
            width: 100%;
            font-size: 14px;
            font-weight: 500;
            color: #334155;
            border: 2px solid #006b7d;
            border-radius: 6px;
            padding: 2px 4px;
            outline: none;
            background-color: #ffffff;

            &:focus {
              box-shadow: 0 0 0 3px rgba(0, 107, 125, 0.15);
            }
          }
        }

        .session-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;

          .el-icon {
            font-size: 14px;
            padding: 4px;
            border-radius: 4px;

            &:hover {
              background-color: rgba(0, 0, 0, 0.1);
            }

            &.delete-icon:hover {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }

  // 主聊天区域
  .main-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background-color: #ffffff;
      border-bottom: 1px solid #e5e5e5;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .toggle-sidebar {
          font-size: 20px;
          cursor: pointer;
          color: #666;

          &:hover {
            color: #006b7d;
          }
        }

        .chat-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;

        .action-icon {
          font-size: 18px;
          cursor: pointer;
          color: #666;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s ease;

          &:hover {
            background-color: #f0f0f0;
            color: #006b7d;
          }
        }
      }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;

      .welcome-area {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;

        .welcome-content {
          text-align: center;
          color: #666;

          h2 {
            font-size: 32px;
            font-weight: 600;
            color: #333;
            margin-bottom: 16px;
          }

          p {
            font-size: 16px;
            color: #999;
          }
        }
      }

      .message-item {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        animation: fadeIn 0.3s ease;

        &.user {
          flex-direction: row-reverse;

          .message-content {
            align-items: flex-end;

            .message-text {
              background: linear-gradient(135deg, #006b7d 0%, #008ba3 100%);
              color: #ffffff;
              border-radius: 18px 18px 4px 18px;
              text-align: left;  // 左对齐
            }
          }
        }

        &.assistant {
          .message-content {
            align-items: flex-start;

            .message-text {
              background-color: #ffffff;
              color: #333;
              border-radius: 18px 18px 18px 4px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
              text-align: left;  // 左对齐
            }
          }
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .message-content {
          display: flex;
          flex-direction: column;
          max-width: 70%;

          .message-text {
            padding: 6px 8px;
            font-size: 15px;
            line-height: 1.6;
            word-wrap: break-word;
            text-align: left;

            // Markdown 样式
            &.markdown-body {
              :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
                margin: 8px 0;
                font-weight: 600;
                line-height: 1.4;
              }

              :deep(h1) { font-size: 1.5em; }
              :deep(h2) { font-size: 1.3em; }
              :deep(h3) { font-size: 1.1em; }

              :deep(p) {
                margin: 0;
                line-height: 1.6;
              }

              :deep(ul), :deep(ol) {
                margin: 8px 0;
                padding-left: 20px;
              }

              :deep(li) {
                margin: 4px 0;
              }

              :deep(code) {
                background-color: rgba(0, 0, 0, 0.05);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
              }

              :deep(pre) {
                background-color: #f4f4f4;
                padding: 12px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 8px 0;

                :deep(code) {
                  background-color: transparent;
                  padding: 0;
                }
              }

              :deep(blockquote) {
                border-left: 4px solid #006b7d;
                margin: 8px 0;
                padding-left: 16px;
                color: #666;
              }

              :deep(a) {
                color: #006b7d;
                text-decoration: none;

                &:deep(:hover) {
                  text-decoration: underline;
                }
              }

              :deep(table) {
                border-collapse: collapse;
                margin: 8px 0;
                width: 100%;

                :deep(th), :deep(td) {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }

                :deep(th) {
                  background-color: #f5f5f5;
                  font-weight: 600;
                }
              }

              :deep(hr) {
                border: none;
                border-top: 1px solid #e5e5e5;
                margin: 16px 0;
              }

              :deep(strong) {
                font-weight: 600;
              }

              :deep(em) {
                font-style: italic;
              }
            }
          }

          .message-time {
            font-size: 12px;
            color: #999;
            margin-top: 6px;
          }
        }

        &.loading {
          .typing-indicator {
            display: flex;
            gap: 6px;
            padding: 20px 16px;
            background-color: #ffffff;
            border-radius: 18px 18px 18px 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

            span {
              width: 8px;
              height: 8px;
              background-color: #006b7d;
              border-radius: 50%;
              animation: typing 1.4s infinite ease-in-out both;

              &:nth-child(1) {
                animation-delay: -0.32s;
              }

              &:nth-child(2) {
                animation-delay: -0.16s;
              }
            }
          }
        }
      }
    }

    .chat-input-area {
      padding: 8px 12px 12px;
      background-color: #ffffff;
      border-top: 1px solid #e5e5e5;

      .input-wrapper {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        background-color: #f5f5f5;
        border-radius: 12px;
        padding: 8px 12px;
        border: 2px solid transparent;
        transition: all 0.3s ease;

        &:focus-within {
          background-color: #ffffff;
          border-color: #006b7d;
          box-shadow: 0 0 0 3px rgba(0, 107, 125, 0.1);
        }

        .chat-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 15px;
          line-height: 1.5;
          resize: none;
          outline: none;
          max-height: 200px;
          min-height: 44px;
          color: #333;

          &::placeholder {
            color: #999;
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        .input-actions {
          display: flex;
          align-items: center;

          .send-btn {
            font-size: 24px;
            color: #ccc;
            cursor: pointer;
            transition: all 0.2s ease;

            &.active {
              color: #006b7d;

              &:hover {
                transform: scale(1.1);
              }
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }

      .input-footer {
        display: flex;
        justify-content: center;
        margin-top: 8px;

        .hint {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}

// 动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

// 响应式
@media (max-width: 768px) {
  .ai-chat-container {
    .sidebar {
      position: fixed;
      left: 0;
      top: 60px;
      height: calc(100vh - 60px);
      z-index: 100;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);

      &.collapsed {
        transform: translateX(-100%);
        margin-left: 0;
      }

      &:not(.collapsed) {
        transform: translateX(0);
      }
    }

    .main-chat {
      .chat-header {
        padding: 12px 16px;

        .chat-title {
          font-size: 16px;
        }
      }

      .chat-messages {
        padding: 12px;

        .message-item {
          gap: 8px;

          .message-avatar {
            width: 32px;
            height: 32px;
          }

          .message-content {
            max-width: 85%;

            .message-text {
              padding: 10px 14px;
              font-size: 14px;
            }
          }
        }
      }

      .chat-input-area {
        padding: 8px;

        .input-wrapper {
          padding: 8px;
        }
      }
    }
  }
}
</style>