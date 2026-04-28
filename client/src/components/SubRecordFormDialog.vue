<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="modal-close" @click="close">&times;</button>
        </div>

        <Transition name="toast-fade">
          <div v-if="toastMsg" class="modal-toast" :class="toastType">
            <span>{{ toastMsg }}</span>
          </div>
        </Transition>

        <div class="modal-body">
          <div class="form-grid">
            <label class="field-item" v-for="field in schema" :key="field.key"
              :class="{ 'has-error': fieldErrors[field.key], 'span-full': field.spanFull || field.type === 'rows' || field.type === 'kvlist' || field.type === 'tags' }">
              <span>{{ field.label }} <i v-if="field.required" class="required">*</i></span>

              <input v-if="field.type === 'text' || field.type === 'number'"
                v-model="form[field.key]"
                :type="field.type"
                :placeholder="field.placeholder || `请输入${field.label}`"
                @input="clearError(field.key)" />

              <select v-else-if="field.type === 'select'"
                v-model="form[field.key]"
                @change="clearError(field.key)">
                <option value="" v-if="!field.required">{{ field.placeholder || `请选择${field.label}` }}</option>
                <option v-for="opt in field.options" :key="opt.value || opt" :value="opt.value || opt">
                  {{ opt.label || opt }}
                </option>
              </select>

              <textarea v-else-if="field.type === 'textarea'"
                v-model="form[field.key]"
                :rows="field.rows || 3"
                :placeholder="field.placeholder || `请输入${field.label}`"
                @input="clearError(field.key)"></textarea>

              <input v-else-if="field.type === 'date'"
                v-model="form[field.key]"
                type="date"
                @change="clearError(field.key)" />

              <textarea v-else-if="field.type === 'json'"
                v-model="form[field.key]"
                :rows="field.rows || 4"
                :placeholder="field.placeholder || '请输入 JSON 格式数据'"
                @input="clearError(field.key)"></textarea>

              <!-- 标签输入 -->
              <div v-else-if="field.type === 'tags'" class="tags-wrap">
                <div class="tags-chips">
                  <span v-for="(tag, idx) in form[field.key]" :key="idx" class="tag-chip">
                    {{ tag }}
                    <button type="button" class="tag-remove" @click="removeTag(field.key, idx)">&times;</button>
                  </span>
                </div>
                <input
                  :placeholder="field.placeholder || '输入后按回车添加'"
                  @keydown.enter.prevent="addTag(field.key, $event)"
                  @keydown.,.prevent="addTag(field.key, $event)"
                  class="tag-input"
                />
              </div>

              <!-- 键值对列表 -->
              <div v-else-if="field.type === 'kvlist'" class="kvlist-wrap">
                <div v-for="(row, idx) in form[field.key]" :key="idx" class="kvlist-row">
                  <input v-model="row.key" :placeholder="field.keyPlaceholder || '键'" class="kv-key" />
                  <input v-model="row.value" :placeholder="field.valuePlaceholder || '值'" class="kv-value" />
                  <button type="button" class="row-remove" @click="removeKvRow(field.key, idx)">&times;</button>
                </div>
                <button type="button" class="row-add" @click="addKvRow(field.key)">+ 添加键值对</button>
              </div>

              <!-- 动态行（数组对象） -->
              <div v-else-if="field.type === 'rows'" class="rows-wrap">
                <div v-for="(row, idx) in form[field.key]" :key="idx" class="rows-item">
                  <div class="rows-fields">
                    <label v-for="sf in field.fields" :key="sf.key" class="rows-field">
                      <span>{{ sf.label }}</span>
                      <input v-if="sf.type === 'text' || sf.type === 'number'" v-model="row[sf.key]" :type="sf.type" :placeholder="sf.placeholder" />
                      <select v-else-if="sf.type === 'select'" v-model="row[sf.key]">
                        <option value="">请选择</option>
                        <option v-for="opt in sf.options" :key="opt" :value="opt">{{ opt }}</option>
                      </select>
                      <textarea v-else-if="sf.type === 'textarea'" v-model="row[sf.key]" :rows="sf.rows || 2" :placeholder="sf.placeholder"></textarea>
                    </label>
                  </div>
                  <button type="button" class="row-remove" @click="removeRow(field.key, idx)">&times;</button>
                </div>
                <button type="button" class="row-add" @click="addRow(field.key, field)">+ {{ field.addLabel || '添加行' }}</button>
              </div>

              <em v-if="fieldErrors[field.key]" class="field-error">{{ fieldErrors[field.key] }}</em>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="ghost-btn" @click="close">取消</button>
          <button class="primary-btn" @click="save" :disabled="saving">
            {{ saving ? '保存中...' : (mode === 'new' ? '添加记录' : '保存修改') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'new' },
  title: { type: String, default: '记录表单' },
  schema: { type: Array, required: true },
  record: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'save'])

const visible = ref(false)
const saving = ref(false)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) loadForm()
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const form = reactive({})
const fieldErrors = reactive({})

const initForm = () => {
  Object.keys(form).forEach(k => delete form[k])
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  props.schema.forEach(f => {
    if (f.type === 'tags') {
      form[f.key] = []
    } else if (f.type === 'kvlist') {
      form[f.key] = [{ key: '', value: '' }]
    } else if (f.type === 'rows') {
      form[f.key] = [makeEmptyRow(f)]
    } else {
      form[f.key] = f.default !== undefined ? f.default : ''
    }
    fieldErrors[f.key] = ''
  })
}

const makeEmptyRow = (field) => {
  const row = {}
  field.fields.forEach(sf => {
    row[sf.key] = sf.default !== undefined ? sf.default : ''
  })
  return row
}

const loadForm = () => {
  initForm()
  if (props.mode === 'edit' && props.record) {
    props.schema.forEach(f => {
      if (props.record[f.key] === undefined) return
      const val = props.record[f.key]

      if (f.type === 'date' && val) {
        form[f.key] = new Date(val).toISOString().slice(0, 10)
      } else if (f.type === 'json' && typeof val === 'object') {
        form[f.key] = JSON.stringify(val, null, 2)
      } else if (f.type === 'tags') {
        if (Array.isArray(val)) form[f.key] = val.map(v => typeof v === 'string' ? v : stringifyValue(v))
        else if (typeof val === 'string') {
          try { const p = JSON.parse(val); form[f.key] = Array.isArray(p) ? p : [val] } catch { form[f.key] = val ? [val] : [] }
        } else form[f.key] = []
      } else if (f.type === 'kvlist') {
        let obj = {}
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) obj = val
        else if (typeof val === 'string') {
          try { const p = JSON.parse(val); if (typeof p === 'object' && !Array.isArray(p)) obj = p } catch { /* ignore */ }
        }
        const entries = Object.entries(obj)
        form[f.key] = entries.length > 0
          ? entries.map(([k, v]) => ({ key: k, value: typeof v === 'string' ? v : JSON.stringify(v) }))
          : [{ key: '', value: '' }]
      } else if (f.type === 'rows') {
        if (Array.isArray(val) && val.length > 0) {
          form[f.key] = val.map(item => {
            const row = makeEmptyRow(f)
            f.fields.forEach(sf => {
              if (item[sf.key] !== undefined) row[sf.key] = item[sf.key]
            })
            return row
          })
        } else {
          form[f.key] = [makeEmptyRow(f)]
        }
      } else {
        form[f.key] = val ?? ''
      }
    })
  }
}

// ---- Tag operations ----
const addTag = (key, event) => {
  const val = event.target.value.trim()
  if (val && !form[key].includes(val)) {
    form[key].push(val)
  }
  event.target.value = ''
}

const removeTag = (key, idx) => {
  form[key].splice(idx, 1)
}

// ---- Kvlist operations ----
const addKvRow = (key) => {
  form[key].push({ key: '', value: '' })
}

const removeKvRow = (key, idx) => {
  if (form[key].length > 1) {
    form[key].splice(idx, 1)
  } else {
    form[key][0].key = ''
    form[key][0].value = ''
  }
}

// ---- Rows operations ----
const addRow = (key, field) => {
  form[key].push(makeEmptyRow(field))
}

const removeRow = (key, idx) => {
  if (form[key].length > 1) {
    form[key].splice(idx, 1)
  } else {
    // 清空最后一行
    const row = form[key][0]
    Object.keys(row).forEach(k => { row[k] = '' })
  }
}

const stringifyValue = (v) => {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v && typeof v === 'object') {
    if (v.name) return v.name
    if (v.text) return v.text
    return JSON.stringify(v)
  }
  return String(v ?? '')
}

const clearError = (field) => { fieldErrors[field] = '' }

const toastMsg = ref('')
const toastType = ref('info')
let toastTimer = null
const showToast = (msg, type = 'error') => {
  toastMsg.value = msg
  toastType.value = type
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 4000)
}

const close = () => {
  visible.value = false
}

const validate = () => {
  Object.keys(fieldErrors).forEach(k => fieldErrors[k] = '')
  let valid = true
  props.schema.forEach(f => {
    if (f.type === 'tags') {
      if (f.required && form[f.key].length === 0) {
        fieldErrors[f.key] = `${f.label}至少需要一个`
        valid = false
      }
      return
    }
    if (f.type === 'kvlist') {
      if (f.required && !form[f.key].some(r => r.key.trim())) {
        fieldErrors[f.key] = `${f.label}至少需要一项`
        valid = false
      }
      return
    }
    if (f.type === 'rows') {
      if (f.required && !form[f.key].some(r => f.fields.some(sf => r[sf.key] && String(r[sf.key]).trim()))) {
        fieldErrors[f.key] = `${f.label}至少需要一项`
        valid = false
      }
      return
    }
    if (f.required && (!form[f.key] || (typeof form[f.key] === 'string' && !form[f.key].trim()))) {
      fieldErrors[f.key] = `${f.label}不能为空`
      valid = false
    }
    if (f.type === 'json' && form[f.key]) {
      try {
        JSON.parse(form[f.key])
      } catch {
        fieldErrors[f.key] = `${f.label} 不是有效的 JSON 格式`
        valid = false
      }
    }
    if (f.type === 'number' && form[f.key] !== '' && isNaN(Number(form[f.key]))) {
      fieldErrors[f.key] = `${f.label} 必须是数字`
      valid = false
    }
  })
  if (!valid) showToast('请修正标红的表单项后重试', 'error')
  return valid
}

const save = async () => {
  if (!validate()) return
  saving.value = true

  const data = {}
  props.schema.forEach(f => {
    const val = form[f.key]
    if (f.type === 'tags') {
      const arr = val.filter(t => t && t.trim())
      data[f.key] = arr.length > 0 ? arr : null
    } else if (f.type === 'kvlist') {
      const obj = {}
      val.forEach(row => { if (row.key && row.key.trim()) obj[row.key.trim()] = row.value || '' })
      data[f.key] = Object.keys(obj).length > 0 ? obj : null
    } else if (f.type === 'rows') {
      const arr = val.filter(row => f.fields.some(sf => row[sf.key] && String(row[sf.key]).trim()))
      data[f.key] = arr.length > 0 ? arr : null
    } else if (f.type === 'json' && val) {
      try {
        data[f.key] = JSON.parse(val)
      } catch {
        data[f.key] = val
      }
    } else if (f.type === 'number' && val !== '') {
      data[f.key] = Number(val)
    } else if (val === '' || val === null || val === undefined) {
      data[f.key] = null
    } else {
      data[f.key] = val
    }
  })

  emit('save', data)
  saving.value = false
}
</script>

<style lang="less" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.modal-box {
  position: relative;
  width: min(90vw, 720px);
  max-height: 90vh;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);

  h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }
}

.modal-close {
  width: 28px; height: 28px; border: none; background: transparent;
  font-size: 22px; color: var(--text-muted); cursor: pointer;
  border-radius: 8px; display: grid; place-items: center;
  transition: background 0.15s;
  &:hover { background: rgba(148, 163, 184, 0.12); }
}

.modal-body {
  flex: 1; overflow-y: auto; padding: 14px 18px;
}

.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 10px 18px 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.modal-toast {
  position: absolute; top: 52px; left: 50%; transform: translateX(-50%);
  z-index: 10; padding: 8px 20px; border-radius: 10px;
  font-size: 13px; font-weight: 500; white-space: nowrap; pointer-events: none;
  &.error { background: rgba(255, 100, 100, 0.12); color: #d32f2f; border: 1px solid rgba(255, 100, 100, 0.25); }
  &.success { background: rgba(61, 217, 165, 0.12); color: #2e7d52; border: 1px solid rgba(61, 217, 165, 0.25); }
  &.info { background: rgba(90, 141, 238, 0.12); color: #3a5fa0; border: 1px solid rgba(90, 141, 238, 0.25); }
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-6px); }

.form-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
}

.field-item {
  display: grid; gap: 4px;
  &.span-full { grid-column: 1 / -1; }
  & > span {
    color: var(--text-secondary); font-size: 13px; font-weight: 500;
    .required { color: var(--accent-rose); font-style: normal; }
  }
  input, select, textarea {
    width: 100%; min-height: 36px; border: 1px solid rgba(148, 163, 184, 0.14);
    background: #f8fbff; color: var(--text-primary); border-radius: 10px;
    padding: 0 10px; outline: none; font-size: 13px; font-family: inherit;
    box-sizing: border-box; transition: border-color 0.2s;
    &:focus { border-color: rgba(92, 225, 230, 0.3); }
  }
  textarea { height: auto; padding: 8px 10px; resize: vertical; }
  &.has-error input, &.has-error select, &.has-error textarea {
    border-color: #e74c3c; background: rgba(231, 76, 60, 0.03);
  }
}

.field-error {
  display: block; margin: 0; font-style: normal;
  font-size: 11px; color: #e74c3c; line-height: 1.4;
}

// Tags 样式
.tags-wrap {
  display: flex; flex-direction: column; gap: 6px;
}
.tags-chips {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.tag-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 6px;
  background: rgba(92, 225, 230, 0.08); color: #2e9ea6;
  font-size: 12px; border: 1px solid rgba(92, 225, 230, 0.18);
}
.tag-remove {
  width: 16px; height: 16px; border: none; background: transparent;
  color: rgba(46, 158, 166, 0.5); cursor: pointer; font-size: 14px;
  display: grid; place-items: center; border-radius: 4px;
  &:hover { background: rgba(46, 158, 166, 0.1); color: #2e9ea6; }
}
.tag-input { min-height: 32px !important; }

// Kvlist 样式
.kvlist-wrap, .rows-wrap {
  display: flex; flex-direction: column; gap: 6px;
}
.kvlist-row {
  display: grid; grid-template-columns: 1fr 2fr auto; gap: 6px; align-items: center;
  .kv-key { min-height: 32px; }
  .kv-value { min-height: 32px; }
}
.rows-item {
  display: flex; gap: 6px; align-items: flex-start;
  padding: 8px; border-radius: 10px; border: 1px solid rgba(148, 163, 184, 0.1); background: #f9fbff;
}
.rows-fields {
  flex: 1; display: grid; gap: 6px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
.rows-field {
  display: grid; gap: 2px;
  span { font-size: 11px; color: var(--text-muted); }
  input, select, textarea { min-height: 30px; font-size: 12px; }
}
.row-remove {
  width: 24px; height: 24px; border: none; background: rgba(255, 100, 100, 0.06);
  color: #d32f2f; cursor: pointer; border-radius: 6px; font-size: 16px;
  display: grid; place-items: center; flex-shrink: 0;
  &:hover { background: rgba(255, 100, 100, 0.14); }
}
.row-add {
  min-height: 30px; border: 1px dashed rgba(92, 225, 230, 0.3); background: transparent;
  color: #2e9ea6; cursor: pointer; border-radius: 8px; font-size: 12px;
  padding: 0 12px;
  &:hover { background: rgba(92, 225, 230, 0.04); }
}

.primary-btn {
  min-height: 36px; padding: 0 16px; border-radius: 12px; font-size: 13px;
  background: linear-gradient(135deg, var(--accent-cyan), #9ce7ff);
  color: #fff; border: none; cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.ghost-btn {
  min-height: 36px; padding: 0 16px; border-radius: 12px; font-size: 13px;
  border: 1px solid rgba(90, 141, 238, 0.16); background: #f5f9ff;
  color: var(--text-primary); cursor: pointer;
}

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .field-item.span-full { grid-column: 1; }
  .kvlist-row { grid-template-columns: 1fr 1fr auto; }
  .rows-fields { grid-template-columns: 1fr; }
}
</style>
