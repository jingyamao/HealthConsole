<template>
  <div class="ai-chat-page">
    <aside class="session-panel" :class="{ collapsed: isSidebarCollapsed }">
      <div class="panel-top">
        <button class="new-chat-btn" @click="createNewChat">
          <el-icon><Plus /></el-icon>
          <span>新建对话</span>
        </button>
      </div>

      <div class="session-search">
        <el-icon><Search /></el-icon>
        <input v-model="sessionKeyword" placeholder="搜索会话..." />
      </div>

      <div class="session-list">
        <button
          v-for="(session, index) in filteredSessions"
          :key="session.sessionId || session.id || index"
          class="session-card"
          :class="{ active: currentAIChat.sessionId === (session.sessionId || session.id) }"
          @click="switchSession(session.sessionId || session.id)"
        >
          <div class="session-main">
            <input
              v-if="editingSessionId === (session.sessionId || session.id)"
              v-model="editingTitle"
              class="session-title-input"
              @blur="saveTitle(session)"
              @keydown.enter="saveTitle(session)"
              @keydown.esc="cancelEdit"
              @click.stop
            />
            <template v-else>
              <span class="session-title">{{ session.title || '新会话' }}</span>
            </template>
          </div>

          <div class="session-actions">
            <button class="action-btn edit" @click.stop="startEdit(session)">
              <el-icon><Edit /></el-icon>
            </button>
            <button class="action-btn delete" @click.stop="handleDeleteSession(session.sessionId || session.id)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </button>

        <div v-if="filteredSessions.length === 0" class="empty-sessions">
          <p>{{ sessionKeyword ? '没有匹配的会话' : '暂无会话，开始新对话吧' }}</p>
        </div>
      </div>
    </aside>

    <section class="chat-workspace">
      <header class="chat-topbar">
        <div class="topbar-left">
          <button class="icon-btn toggle-btn" @click="toggleSidebar">
            <el-icon><Fold v-if="!isSidebarCollapsed" /><Expand v-else /></el-icon>
          </button>
          <h2>{{ currentAIChat.title || '新对话' }}</h2>
        </div>

        <div class="topbar-actions">
          <button class="icon-btn" @click="exportChat" title="导出聊天记录">
            <el-icon><Download /></el-icon>
          </button>
        </div>
      </header>

      <div class="chat-body" ref="messagesContainer">
        <div v-if="currentAIChat.messages.length === 0 && !isLoading" class="empty-state">
          <div class="empty-illustration"></div>
          <h3>医疗 AI 助手</h3>
          <p>我可以帮你查询患者数据、搜索医学知识、分析病历或解答医疗问题。</p>

          <div class="tool-hints">
            <div class="hint-group">
              <span class="hint-label">数据库查询</span>
              <span class="hint-desc">询问患者统计、疾病分布、费用分析等问题，我会从数据库中查询真实数据</span>
            </div>
            <div class="hint-group">
              <span class="hint-label">知识库检索</span>
              <span class="hint-desc">搜索临床指南、诊疗规范等医学文档，引用来源为你解答</span>
            </div>
            <div class="hint-group">
              <span class="hint-label">医疗咨询</span>
              <span class="hint-desc">解答症状分析、疾病科普、用药参考等医学问题</span>
            </div>
          </div>

          <div class="quick-prompts">
            <span class="prompts-label">试试这些：</span>
            <div class="prompts-row">
              <button class="prompt-chip" @click="sendQuickPrompt('最近一周收了多少高血压患者？')">📊 患者数据查询</button>
              <button class="prompt-chip" @click="sendQuickPrompt('糖尿病的诊断标准和治疗方案是什么？')">🔍 知识库检索</button>
              <button class="prompt-chip" @click="sendQuickPrompt('请介绍一下知识库中有哪些文档')">📋 知识库概览</button>
              <button class="prompt-chip" @click="sendQuickPrompt('冠心病的常见症状和预防措施有哪些？')">🏥 医疗咨询</button>
            </div>
          </div>
        </div>

        <div
          v-for="(message, index) in currentAIChat.messages"
          :key="index"
          class="message-row"
          :class="message.role"
        >
          <div class="message-avatar">
            <img v-if="message.role === 'user'" src="@/assets/1.png" alt="用户" />
            <img v-else src="@/assets/2.png" alt="AI" />
          </div>

          <div class="message-bubble-wrap">
            <div class="message-bubble markdown-body" :class="{ streaming: message.streaming }" v-html="formatMessage(message.content, message.streaming)"></div>
            <div class="message-meta-row">
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              <button
                v-if="message.role === 'assistant' && message.content && !message.streaming"
                class="msg-copy-btn"
                @click="copyMsg(message.content)"
                title="复制消息"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div v-if="isLoading && currentAIChat.sessionId === loadingSessionId && !currentAIChat.messages.some(m => m.streaming)" class="message-row assistant loading">
          <div class="message-avatar">
            <img src="@/assets/2.png" alt="AI" />
          </div>
          <div class="message-bubble-wrap">
            <div class="typing-card">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="showScrollBtn"
        class="scroll-bottom-btn"
        @click="scrollToBottom"
      >
        <el-icon><Bottom /></el-icon>
      </button>

      <footer class="chat-composer">
        <div class="composer-box">
          <textarea
            v-model="inputMessage"
            class="chat-input"
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            @keydown.enter.prevent="sendMessage"
            @input="autoResize"
            ref="inputRef"
            :disabled="isLoading"
          ></textarea>
          <button
            class="send-btn"
            :class="{ active: inputMessage.trim() && !isLoading }"
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isLoading"
          >
            <el-icon><Promotion /></el-icon>
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import { Plus, Edit, Delete, Fold, Expand, Download, Promotion, Search, Bottom } from '@element-plus/icons-vue'
import { useAIChatStore } from '@/stores/aiChat'

// 配置 marked（只配置一次）
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false,
  smartypants: false
})

const aiChatStore = useAIChatStore()
const { allAIChatSessionList, currentAIChat, currentAIChatList } = storeToRefs(aiChatStore)

const inputMessage = ref('')
const isLoading = ref(false)
const loadingSessionId = ref('')
const isSidebarCollapsed = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)
const editingSessionId = ref(null)
const editingTitle = ref('')
const sessionKeyword = ref('')
const showScrollBtn = ref(false)

const filteredSessions = computed(() => {
  const keyword = sessionKeyword.value.trim().toLowerCase()
  const list = allAIChatSessionList.value || []
  if (!keyword) return list
  return list.filter(s => (s.title || '').toLowerCase().includes(keyword))
})

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const checkScreenWidth = () => {
  isSidebarCollapsed.value = window.innerWidth < 900
}

const createNewChat = () => {
  if (!currentAIChat.value.sessionId && currentAIChat.value.messages.length === 0) {
    return
  }

  currentAIChat.value = {
    sessionId: '',
    title: '',
    messages: []
  }

  inputMessage.value = ''
  cancelEdit()
  scrollToBottom()
}

const switchSession = async (sessionId) => {
  try {
    await aiChatStore.switchCurrentAIChat(sessionId)
    if (window.innerWidth < 900) {
      isSidebarCollapsed.value = true
    }
    scrollToBottom()
  } catch (error) {
    ElMessage.error('切换会话失败')
  }
}

const getSessionId = (session) => session.sessionId || session.id

const startEdit = (session) => {
  editingSessionId.value = getSessionId(session)
  editingTitle.value = session.title || '新会话'
}

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
        sessionId,
        title: newTitle
      })
      session.title = newTitle
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

const cancelEdit = () => {
  editingSessionId.value = null
  editingTitle.value = ''
}

const handleDeleteSession = async (sessionId = currentAIChat.value.sessionId) => {
  if (!sessionId) {
    ElMessage.warning('当前没有可删除的会话')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除这个会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await aiChatStore.deleteSessionRequest(sessionId)
    allAIChatSessionList.value = allAIChatSessionList.value.filter(
      item => getSessionId(item) !== sessionId
    )
    currentAIChatList.value = currentAIChatList.value.filter(
      item => item.sessionId !== sessionId
    )
    localStorage.setItem('currentAIChatList', JSON.stringify(currentAIChatList.value))

    if (currentAIChat.value.sessionId === sessionId) {
      currentAIChat.value = {
        sessionId: '',
        title: '',
        messages: []
      }
    }

    ElMessage.success('删除会话成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除会话失败')
    }
  }
}

// 打字机：根据字符决定延迟
const getCharDelay = (char, index, total) => {
  // 标点符号后稍作停顿
  if ('。！？；：\n'.includes(char)) return 80
  if ('，、,.!?;:'.includes(char)) return 40
  // 空格快速跳过
  if (char === ' ') return 5
  // 基础速度随进度加快（前 20% 慢，后 80% 逐步加速）
  const progress = index / total
  const base = progress < 0.2 ? 30 : progress < 0.5 ? 20 : 12
  return base
}

// 打字机动画核心：通过替换数组元素触发 Vue 响应式更新
const typewriterAnimate = (messages, assistantIndex, fullText, onTick) => {
  return new Promise((resolve) => {
    const totalLen = fullText.length
    if (totalLen === 0) { resolve(); return }

    let charIndex = 0
    let lastTime = 0
    let acc = 0

    const step = (timestamp) => {
      if (!lastTime) lastTime = timestamp
      acc += timestamp - lastTime
      lastTime = timestamp

      const delay = getCharDelay(fullText[charIndex] || '', charIndex, totalLen)

      while (acc >= delay && charIndex < totalLen) {
        acc -= delay
        charIndex++
      }

      // 通过替换数组元素触发 Vue 响应式更新
      const current = messages[assistantIndex]
      messages[assistantIndex] = {
        ...current,
        content: fullText.substring(0, charIndex)
      }

      if (onTick) onTick()

      if (charIndex < totalLen) {
        requestAnimationFrame(step)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(step)
  })
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  currentAIChat.value.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  })

  inputMessage.value = ''
  autoResize()
  scrollToBottom()
  isLoading.value = true
  loadingSessionId.value = currentAIChat.value.sessionId

  if (!currentAIChat.value.sessionId) {
    try {
      await aiChatStore.postNewSessionRequest({
        firstMessage: message
      })
    } catch (error) {
      // 移除刚添加的用户消息
      currentAIChat.value.messages.pop()
      ElMessage.error('创建会话失败')
      isLoading.value = false
      loadingSessionId.value = ''
      return
    }
  }

  // 锁定当前 sessionId，防止 await 期间切换会话导致写错位置
  const targetSessionId = currentAIChat.value.sessionId

  let assistantIdx = -1
  try {
    const res = await aiChatStore.postAIChatStreamRequest({
      sessionId: targetSessionId,
      message
    })

    // 在 currentAIChatList 中找到原始会话（可能已被切换走）
    const targetChat = currentAIChatList.value.find(
      c => c.sessionId === targetSessionId
    )
    if (!targetChat) {
      ElMessage.error('会话已丢失，请重试')
      isLoading.value = false
      return
    }

    const messages = targetChat.messages
    const fullText = res?.data?.message || ''

    // 在 API 返回后 push assistant 消息，确保 index 可靠
    messages.push({
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      streaming: true
    })
    assistantIdx = messages.length - 1

    // 打字机逐字显示
    await typewriterAnimate(messages, assistantIdx, fullText, () => {
      // 如果当前仍在目标会话中，才滚动
      if (currentAIChat.value.sessionId === targetSessionId) {
        scrollToBottom()
      }
    })

    // 打字完成
    if (assistantIdx >= 0 && assistantIdx < messages.length) {
      messages[assistantIdx] = { ...messages[assistantIdx], streaming: false }
    }

    // 更新会话标题
    if (res?.data?.title) {
      targetChat.title = res.data.title
    }

    try {
      localStorage.setItem('currentAIChatList', JSON.stringify(currentAIChatList.value))
    } catch (e) {
      // localStorage 写入失败不影响主流程
    }
  } catch (error) {
    console.error('[Chat] 发送失败:', error)
    // 移除空的 assistant 消息（如果有的话）
    const targetChat = currentAIChatList.value.find(
      c => c.sessionId === targetSessionId
    )
    if (targetChat) {
      const msgs = targetChat.messages
      const lastMsg = msgs[msgs.length - 1]
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.streaming && !lastMsg.content) {
        msgs.pop()
      }
    }
    ElMessage.error('发送消息失败，请重试')
  } finally {
    isLoading.value = false
    loadingSessionId.value = ''
  }
}

const sendQuickPrompt = (prompt) => {
  inputMessage.value = prompt
  sendMessage()
}

const exportChat = () => {
  const messages = currentAIChat.value.messages
  if (messages.length === 0) {
    ElMessage.warning('没有可导出的聊天记录')
    return
  }

  const content = messages.map((m) => {
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

const formatMessage = (content, isStreaming) => {
  if (!content) return ''

  try {
    if (isStreaming) {
      // 流式时：轻量渲染，保证速度
      let text = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      // 行内代码
      text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>')
      // 加粗 / 斜体
      text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 标题
      text = text.replace(/^### (.+)$/gm, '<h4>$1</h4>')
      text = text.replace(/^## (.+)$/gm, '<h3>$1</h3>')
      text = text.replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // 列表项
      text = text.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
      // 换行
      text = text.replace(/\n/g, '<br>')
      return text
    }
    return marked.parse(content)
  } catch (error) {
    return content.replace(/\n/g, '<br>')
  }
}

const copyMsg = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const autoResize = () => {
  nextTick(() => {
    const textarea = inputRef.value
    if (textarea) {
      textarea.style.height = '48px'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`
    }
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      container.scrollTop = container.scrollHeight
      showScrollBtn.value = false
    }
  })
}

const checkScrollPosition = () => {
  const container = messagesContainer.value
  if (!container) return
  const threshold = 120
  showScrollBtn.value = container.scrollHeight - container.scrollTop - container.clientHeight > threshold
}

watch(() => currentAIChat.value.messages, scrollToBottom, { deep: true })

onMounted(() => {
  aiChatStore.initAIChatPage()
  checkScreenWidth()
  window.addEventListener('resize', checkScreenWidth)
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      container.addEventListener('scroll', checkScrollPosition)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenWidth)
  const container = messagesContainer.value
  if (container) {
    container.removeEventListener('scroll', checkScrollPosition)
  }
})
</script>

<style lang="less" scoped>
.ai-chat-page {
  position: relative;
  display: flex;
  height: 100%;
  gap: 10px;
  padding: 12px;
  background:
    radial-gradient(circle at top left, rgba(86, 182, 213, 0.06), transparent 22%),
    linear-gradient(180deg, #fbfdff, #f5f9ff);
}

.session-panel,
.chat-workspace {
  background: #ffffff;
  border: 1px solid rgba(142, 164, 188, 0.14);
  border-radius: 22px;
  box-shadow: 0 8px 20px rgba(125, 150, 180, 0.1);
}

.session-panel {
  width: 220px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s ease, min-width 0.3s ease, opacity 0.3s ease;
  flex-shrink: 0;

  &.collapsed {
    width: 0;
    min-width: 0;
    opacity: 0;
    border-width: 0;
    pointer-events: none;
    overflow: hidden;
  }
}

.panel-top {
  padding: 10px 10px 8px;
  flex-shrink: 0;
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(91, 139, 255, 0.3);
  }
}

.session-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 10px 8px;
  padding: 8px 10px;
  border-radius: 14px;
  background: #f7fbff;
  border: 1px solid rgba(142, 164, 188, 0.12);
  color: var(--text-muted);

  input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    color: var(--text-primary);
    font-size: 13px;
  }
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.session-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 4px;
  border: 1px solid rgba(142, 164, 188, 0.1);
  border-radius: 16px;
  background: #f8fbff;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(86, 182, 213, 0.14);
    box-shadow: 0 4px 12px rgba(125, 150, 180, 0.1);
  }

  &.active {
    background: linear-gradient(135deg, rgba(90, 141, 238, 0.1), rgba(86, 182, 213, 0.1));
    border-color: rgba(86, 182, 213, 0.16);
  }
}

.session-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.session-title {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-title-input {
  width: 100%;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid rgba(86, 182, 213, 0.26);
  background: #ffffff;
  color: var(--text-primary);
  outline: none;
  font-size: 13px;
}

.session-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &:hover {
    &.edit {
      background: rgba(86, 182, 213, 0.1);
      border-color: rgba(86, 182, 213, 0.16);
      color: var(--accent-cyan);
    }

    &.delete {
      background: rgba(255, 125, 144, 0.1);
      border-color: rgba(255, 125, 144, 0.16);
      color: var(--accent-rose);
    }
  }
}

.empty-sessions {
  padding: 24px 14px;
  text-align: center;

  p {
    color: var(--text-muted);
    font-size: 13px;
  }
}

.chat-workspace {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.chat-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(142, 164, 188, 0.12);
  background: rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  h2 {
    margin: 0;
    font-size: 18px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.topbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  width: 38px;
  height: 38px;
  display: inline-grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid rgba(142, 164, 188, 0.14);
  background: #f7fbff;
  color: var(--text-secondary);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: #f0f5ff;
    color: var(--accent-blue);
    transform: translateY(-1px);
  }
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}

.empty-state {
  max-width: 480px;
  margin: 30px auto 0;
  padding: 20px;
  border-radius: 24px;
  text-align: center;
  background: #ffffff;
  border: 1px solid rgba(142, 164, 188, 0.14);
  box-shadow: 0 8px 20px rgba(125, 150, 180, 0.1);

  h3 {
    margin: 10px 0 4px;
    font-size: 22px;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.7;
    font-size: 14px;
  }
}

.empty-illustration {
  width: 72px;
  height: 72px;
  margin: 0 auto;
  border-radius: 22px;
  background:
    radial-gradient(circle at 30% 30%, rgba(86, 182, 213, 0.2), transparent 42%),
    linear-gradient(135deg, #edf6ff, #f8fcff);
  border: 1px solid rgba(86, 182, 213, 0.16);
}

.tool-hints {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  text-align: left;
}

.hint-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(90, 141, 238, 0.03);
  border: 1px solid rgba(142, 164, 188, 0.08);
}

.hint-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-blue);
  white-space: nowrap;
  min-width: 72px;
  padding-top: 1px;
}

.hint-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.quick-prompts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.prompts-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.prompts-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.prompt-chip {
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(90, 141, 238, 0.14);
  background: rgba(90, 141, 238, 0.06);
  color: var(--accent-blue);
  font-size: 13px;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(90, 141, 238, 0.12);
    transform: translateY(-1px);
  }
}

.message-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  &.user {
    flex-direction: row-reverse;

    .message-bubble-wrap {
      align-items: flex-end;
    }

    .message-bubble {
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
      color: #ffffff;
      border-color: transparent;
    }
  }
}

.message-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(125, 150, 180, 0.16);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.message-bubble-wrap {
  max-width: min(720px, 75%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-bubble,
.typing-card {
  width: fit-content;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(142, 164, 188, 0.14);
  box-shadow: 0 4px 12px rgba(125, 150, 180, 0.08);
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 14px;
  min-height: 20px;
  word-break: break-word;

  &.streaming::after {
    content: '';
    display: inline-block;
    width: 2px;
    height: 16px;
    background: var(--accent-cyan);
    margin-left: 3px;
    vertical-align: text-bottom;
    animation: blink 0.7s step-end infinite;
  }

  &.streaming:empty::before {
    content: ' ';
    display: inline-block;
    width: 0;
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.message-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.message-time {
  color: var(--text-muted);
  font-size: 11px;
}

.msg-copy-btn {
  opacity: 0;
  width: 26px;
  height: 26px;
  border: none;
  background: rgba(0,0,0,0.05);
  cursor: pointer;
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: opacity 0.15s, background 0.15s;

  &:hover {
    background: rgba(90,141,238,0.12);
    color: var(--accent-blue);
  }
}

.message-row:hover .msg-copy-btn {
  opacity: 1;
}

.typing-card {
  display: flex;
  gap: 6px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-cyan);
    animation: typing 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

.scroll-bottom-btn {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(142, 164, 188, 0.14);
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(125, 150, 180, 0.14);
  color: var(--text-secondary);
  display: grid;
  place-items: center;
  z-index: 5;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateX(-50%) translateY(-2px);
    box-shadow: 0 6px 16px rgba(125, 150, 180, 0.2);
  }
}

.markdown-body {
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 8px 0 4px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--text-primary);
  }
  :deep(h1) { font-size: 1.5em; padding-bottom: 4px; border-bottom: 1px solid rgba(142, 164, 188, 0.12); }
  :deep(h2) { font-size: 1.3em; padding-bottom: 3px; border-bottom: 1px solid rgba(142, 164, 188, 0.08); }
  :deep(h3) { font-size: 1.15em; }
  :deep(h4) { font-size: 1.05em; }
  :deep(p) { margin: 4px 0; line-height: 1.75; }
  :deep(ul), :deep(ol) { margin: 4px 0; padding-left: 20px; }
  :deep(li) { margin: 2px 0; line-height: 1.6; }
  :deep(li input[type="checkbox"]) { margin-right: 4px; }

  :deep(code) {
    background: rgba(90, 141, 238, 0.08);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.88em;
    color: #c7254e;
  }

  .code-block {
    margin: 6px 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(142, 164, 188, 0.14);

    .code-header {
      padding: 4px 10px;
      background: rgba(90, 141, 238, 0.06);
      border-bottom: 1px solid rgba(142, 164, 188, 0.1);
      font-size: 11px;
      color: var(--text-muted);
      font-family: 'SF Mono', monospace;
    }

    pre {
      margin: 0;
      padding: 10px 12px;
      background: #f8fbff;
      overflow-x: auto;

      code {
        background: transparent;
        padding: 0;
        color: var(--text-primary);
        font-size: 13px;
        line-height: 1.6;
      }
    }
  }

  :deep(pre) {
    background: #f8fbff;
    padding: 10px 12px;
    border-radius: 10px;
    overflow-x: auto;
    margin: 6px 0;
    border: 1px solid rgba(142, 164, 188, 0.1);
  }
  :deep(pre code) {
    background: transparent;
    padding: 0;
    color: var(--text-primary);
    font-size: 13px;
  }

  :deep(blockquote) {
    border-left: 3px solid var(--accent-cyan);
    margin: 6px 0;
    padding: 6px 12px;
    background: rgba(92, 225, 230, 0.04);
    border-radius: 0 8px 8px 0;
    color: var(--text-secondary);
    font-style: italic;
  }

  :deep(a) {
    color: var(--accent-blue);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
    &:hover { border-bottom-color: var(--accent-blue); }
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 13px;
    border: 1px solid rgba(142, 164, 188, 0.14);
    border-radius: 8px;
    overflow: hidden;
  }
  :deep(table th), :deep(table td) {
    border: 1px solid rgba(142, 164, 188, 0.14);
    padding: 6px 10px;
    text-align: left;
  }
  :deep(table th) {
    background: linear-gradient(135deg, rgba(90, 141, 238, 0.08), rgba(92, 225, 230, 0.06));
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }
  :deep(table td) { background: #fbfdff; }
  :deep(table tr:hover td) { background: rgba(90, 141, 238, 0.03); }

  :deep(hr) {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(142, 164, 188, 0.2), transparent);
    margin: 10px 0;
  }

  :deep(strong) { color: var(--text-primary); font-weight: 600; }
  :deep(em) { color: var(--text-secondary); }
  :deep(del) { color: var(--text-muted); }

  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
    margin: 4px 0;
  }
}

.chat-composer {
  padding: 10px 12px 12px;
  background: #ffffff;
  border-top: 1px solid rgba(142, 164, 188, 0.12);
  flex-shrink: 0;
}

.composer-box {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 18px;
  background: #f7fbff;
  border: 1px solid rgba(142, 164, 188, 0.14);
}

.chat-input {
  flex: 1;
  min-height: 42px;
  max-height: 180px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.send-btn {
  width: 40px;
  height: 40px;
  display: inline-grid;
  place-items: center;
  border-radius: 12px;
  border: none;
  background: rgba(90, 141, 238, 0.12);
  color: var(--text-muted);
  flex-shrink: 0;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;

  &.active {
    background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
    color: #ffffff;
  }

  &:hover {
    transform: translateY(-1px);
  }
}

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

@media (max-width: 1080px) {
  .session-panel {
    width: 200px;
    min-width: 200px;
  }
}

@media (max-width: 900px) {
  .ai-chat-page {
    padding: 6px;
    gap: 0;
  }

  /* 侧边栏保持 flex 子元素，用 width 折叠 */
  .session-panel {
    width: 180px;
    min-width: 180px;
    border-radius: 18px;
    flex-shrink: 0;

    &.collapsed {
      width: 0;
      min-width: 0;
      opacity: 0;
      border-width: 0;
      pointer-events: none;
    }
  }

  .chat-workspace {
    border-radius: 18px;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .ai-chat-page {
    padding: 6px;
  }

  .session-panel {
    width: 160px;
    min-width: 160px;

    &.collapsed {
      width: 0;
      min-width: 0;
    }
  }

  .chat-topbar,
  .chat-body,
  .chat-composer {
    padding-left: 8px;
    padding-right: 8px;
  }

  .topbar-left h2 {
    font-size: 16px;
  }

  .message-bubble-wrap {
    max-width: 85%;
  }
}
</style>
