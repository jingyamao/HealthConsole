<template>
  <div class="floating-ai" :class="{ open: isOpen }">
    <!-- 展开的聊天窗口 -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="floating-panel">
        <div class="floating-header">
          <div class="floating-header-left">
            <span class="floating-dot"></span>
            <span>医疗 AI 助手</span>
          </div>
          <div class="floating-header-actions">
            <button class="floating-header-btn" @click="clearChat" title="清空对话">✕</button>
            <button class="floating-header-btn" @click="isOpen = false" title="最小化">−</button>
          </div>
        </div>

        <div class="floating-body" ref="bodyRef">
          <div v-if="messages.length === 0 && !loading" class="floating-empty">
            <p>你好，我是医疗 AI 助手</p>
            <p class="floating-empty-sub">可以问我患者数据、医学知识或病历分析相关问题</p>
          </div>

          <div v-for="(msg, i) in messages" :key="i" class="floating-msg" :class="msg.role">
            <div class="floating-msg-content" v-html="formatMiniMsg(msg.content)"></div>
            <button
              v-if="msg.role === 'assistant' && msg.content"
              class="msg-copy-btn"
              @click="copyMsg(msg.content)"
              title="复制"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>

          <div v-if="loading" class="floating-msg assistant">
            <div class="floating-msg-content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="floating-composer">
          <input
            v-model="input"
            class="floating-input"
            placeholder="输入问题..."
            @keydown.enter="send"
            :disabled="loading"
          />
          <button class="floating-send" :class="{ active: input.trim() && !loading }" @click="send" :disabled="!input.trim() || loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 浮动按钮 -->
    <button class="floating-btn" @click="toggle" :class="{ active: isOpen }">
      <svg v-if="!isOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { postAIChat } from '@/api/aiChat'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'

const route = useRoute()
const isOpen = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref(loadMessages())
const bodyRef = ref(null)

const STORAGE_KEY = 'floating_ai_messages'

function loadMessages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
}

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => scrollBottom())
  }
}

const clearChat = () => {
  messages.value = []
  saveMessages()
}

const copyMsg = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

const scrollBottom = () => {
  nextTick(() => {
    const el = bodyRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

const formatMiniMsg = (content) => {
  if (!content) return ''
  try {
    return marked.parse(content)
  } catch {
    return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')
  }
}

const send = async () => {
  const msg = input.value.trim()
  if (!msg || loading.value) return

  messages.value.push({ role: 'user', content: msg })
  input.value = ''
  saveMessages()
  scrollBottom()
  loading.value = true

  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const res = await postAIChat({
      userId: userInfo.id || 'anonymous',
      sessionId: `float_${userInfo.id || 'anon'}`,
      message: msg
    })
    const reply = res?.data?.output || res?.output || '抱歉，暂时无法回复。'
    messages.value.push({ role: 'assistant', content: reply })
    saveMessages()
    scrollBottom()
  } catch {
    messages.value.push({ role: 'assistant', content: '网络错误，请稍后重试。' })
  } finally {
    loading.value = false
  }
}

// 路由切换到 AI 对话页面时自动关闭
watch(() => route.path, (path) => {
  if (path === '/ai') isOpen.value = false
})
</script>

<style lang="less" scoped>
.floating-ai {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.floating-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: scale(1.06);
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
  }

  &.active {
    background: linear-gradient(135deg, #ef4444, #f97316);
  }
}

.floating-panel {
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.floating-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  flex-shrink: 0;
}
.floating-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.floating-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
}
.floating-header-actions { display: flex; gap: 4px; }
.floating-header-btn {
  width: 28px; height: 28px;
  border: none; background: rgba(255,255,255,0.15);
  color: #fff; cursor: pointer; border-radius: 8px;
  font-size: 14px; display: grid; place-items: center;
  &:hover { background: rgba(255,255,255,0.25); }
}

.floating-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.floating-empty {
  text-align: center;
  color: var(--text-secondary);
  margin: auto;
  p { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary); }
  .floating-empty-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; font-weight: 400; }
}

.floating-msg {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  max-width: 90%;

  &.user {
    align-self: flex-end;
    .floating-msg-content {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border-radius: 14px 14px 4px 14px;
    }
  }

  &.assistant {
    align-self: flex-start;
    .floating-msg-content {
      background: #f3f4f6;
      color: var(--text-primary);
      border-radius: 14px 14px 14px 4px;
    }
  }
}
.floating-msg-content {
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.65;
  word-break: break-word;

  &.typing {
    display: flex; gap: 5px; padding: 10px 14px;
    span {
      width: 6px; height: 6px; border-radius: 50%;
      background: #9ca3af;
      animation: mini-typing 1.4s infinite ease-in-out both;
      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
    }
  }

  :deep(p) { margin: 2px 0; }
  :deep(ul), :deep(ol) { margin: 2px 0; padding-left: 16px; }
  :deep(li) { margin: 1px 0; }
  :deep(code) { font-size: 11px; background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 3px; }
  :deep(pre) { font-size: 11px; background: rgba(0,0,0,0.04); padding: 6px 8px; border-radius: 6px; overflow-x: auto; margin: 4px 0; }
  :deep(strong) { font-weight: 600; }
  :deep(table) { font-size: 11px; border-collapse: collapse; }
  :deep(th), :deep(td) { border: 1px solid rgba(0,0,0,0.1); padding: 3px 6px; }
}
.msg-copy-btn {
  opacity: 0;
  width: 24px; height: 24px;
  border: none; background: rgba(0,0,0,0.05);
  cursor: pointer; border-radius: 6px;
  display: grid; place-items: center;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.floating-msg:hover .msg-copy-btn { opacity: 1; }

.floating-composer {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  flex-shrink: 0;
}
.floating-input {
  flex: 1;
  min-height: 34px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 10px;
  padding: 0 10px;
  outline: none;
  font-size: 13px;
  background: #f9fafb;
  &:focus { border-color: #6366f1; }
}
.floating-send {
  width: 34px; height: 34px;
  border: none; border-radius: 10px;
  background: rgba(99, 102, 241, 0.1);
  color: #9ca3af;
  cursor: pointer; display: grid; place-items: center;
  transition: background 0.15s, color 0.15s;
  &.active {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
  }
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@keyframes mini-typing {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

@media (max-width: 480px) {
  .floating-panel {
    width: calc(100vw - 20px);
    height: 460px;
  }
  .floating-ai {
    bottom: 12px;
    right: 12px;
  }
}
</style>
