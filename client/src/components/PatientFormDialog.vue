<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ mode === 'new' ? '新增患者' : '编辑患者' }}</h3>
          <button class="modal-close" @click="close">&times;</button>
        </div>

        <!-- toast -->
        <Transition name="toast-fade">
          <div v-if="toastMsg" class="modal-toast" :class="toastType">
            <span>{{ toastMsg }}</span>
          </div>
        </Transition>

        <div class="modal-body">
          <h4 class="form-section-title">基础信息</h4>
          <div class="form-grid">
            <label class="field-item" :class="{ 'has-error': fieldErrors.name }">
              <span>姓名 <i class="required">*</i></span>
              <input v-model="form.name" placeholder="请输入患者姓名" @input="clearError('name')" />
              <em v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</em>
            </label>
            <label class="field-item" :class="{ 'has-error': fieldErrors.gender }">
              <span>性别</span>
              <select v-model="form.gender" @change="clearError('gender')">
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
              <em v-if="fieldErrors.gender" class="field-error">{{ fieldErrors.gender }}</em>
            </label>
            <label class="field-item" :class="{ 'has-error': fieldErrors.age }">
              <span>年龄</span>
              <input v-model.number="form.age" type="number" placeholder="请输入年龄" @input="clearError('age')" />
              <em v-if="fieldErrors.age" class="field-error">{{ fieldErrors.age }}</em>
            </label>
            <label class="field-item" :class="{ 'has-error': fieldErrors.phone }">
              <span>手机号</span>
              <input v-model="form.phone" placeholder="请输入手机号" @input="clearError('phone')" />
              <em v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</em>
            </label>
            <label class="field-item" :class="{ 'has-error': fieldErrors.idCard }">
              <span>身份证号</span>
              <input v-model="form.idCard" placeholder="请输入身份证号" @input="clearError('idCard')" />
              <em v-if="fieldErrors.idCard" class="field-error">{{ fieldErrors.idCard }}</em>
            </label>
            <label class="field-item">
              <span>医保类型</span>
              <select v-model="form.insurance">
                <option value="">请选择</option>
                <option value="城镇职工医保">城镇职工医保</option>
                <option value="城乡居民医保">城乡居民医保</option>
                <option value="商业保险">商业保险</option>
                <option value="生育保险">生育保险</option>
                <option value="退休医保">退休医保</option>
                <option value="自费">自费</option>
              </select>
            </label>
            <label class="field-item">
              <span>居住地</span>
              <input v-model="form.address" placeholder="请输入居住地" />
            </label>
            <label class="field-item">
              <span>血型</span>
              <select v-model="form.bloodType">
                <option value="">请选择</option>
                <option value="A">A型</option>
                <option value="B">B型</option>
                <option value="AB">AB型</option>
                <option value="O">O型</option>
              </select>
            </label>
            <label class="field-item">
              <span>职业</span>
              <input v-model="form.occupation" placeholder="请输入职业" />
            </label>
            <label class="field-item">
              <span>AI 数据同意</span>
              <select v-model="form.aiConsent">
                <option :value="false">未同意</option>
                <option :value="true">已同意</option>
              </select>
            </label>
          </div>

          <h4 class="form-section-title">诊疗信息</h4>
          <div class="form-grid single">
            <label class="field-item">
              <span>主诉</span>
              <textarea v-model="form.complaint" rows="2" placeholder="患者主要症状描述"></textarea>
            </label>
            <label class="field-item">
              <span>主诊断</span>
              <input v-model="form.diagnosis" placeholder="请输入主诊断" />
            </label>
            <label class="field-item">
              <span>治疗方案</span>
              <textarea v-model="form.plan" rows="2" placeholder="治疗方案描述"></textarea>
            </label>
            <label class="field-item">
              <span>AI 备注</span>
              <textarea v-model="form.aiNotes" rows="2" placeholder="AI 辅助分析备注"></textarea>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="ghost-btn" @click="close">取消</button>
          <button class="ghost-btn" @click="fillMock" v-if="mode === 'new'">填入示例</button>
          <button class="primary-btn" @click="savePatient" :disabled="saving">
            {{ saving ? '保存中...' : (mode === 'new' ? '创建患者' : '保存修改') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { createPatient, updatePatient, getPatientById } from '@/api/patient'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'new' },
  patientId: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const visible = ref(false)
const saving = ref(false)

// 同步外部 v-model
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) loadForm()
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const form = reactive({
  name: '',
  gender: '男',
  age: null,
  phone: '',
  idCard: '',
  insurance: '',
  address: '',
  bloodType: '',
  occupation: '',
  aiConsent: false,
  complaint: '',
  diagnosis: '',
  plan: '',
  aiNotes: ''
})

const fieldErrors = reactive({
  name: '',
  gender: '',
  age: '',
  phone: '',
  idCard: ''
})

const resetForm = () => {
  form.name = ''
  form.gender = '男'
  form.age = null
  form.phone = ''
  form.idCard = ''
  form.insurance = ''
  form.address = ''
  form.bloodType = ''
  form.occupation = ''
  form.aiConsent = false
  form.complaint = ''
  form.diagnosis = ''
  form.plan = ''
  form.aiNotes = ''
  clearAllErrors()
}

const clearError = (field) => { fieldErrors[field] = '' }
const clearAllErrors = () => {
  Object.keys(fieldErrors).forEach(k => { fieldErrors[k] = '' })
  toastMsg.value = ''
}

// ---- toast ----
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

const loadForm = async () => {
  resetForm()
  if (props.mode === 'edit' && props.patientId) {
    try {
      const res = await getPatientById(props.patientId)
      if (res?.success) {
        const p = res.data
        form.name = p.name || ''
        form.gender = p.gender || '男'
        form.age = p.age
        form.phone = p.phone || ''
        form.idCard = p.idCard || ''
        form.insurance = p.insurance || ''
        form.address = p.address || ''
        form.bloodType = p.bloodType || ''
        form.occupation = p.occupation || ''
        form.aiConsent = p.aiConsent || false
        if (p.aiNotes?.text) form.aiNotes = p.aiNotes.text
        else if (typeof p.aiNotes === 'string') form.aiNotes = p.aiNotes
        if (p.currentSymptoms?.length) form.complaint = p.currentSymptoms[0].mainComplaint || ''
        if (p.diagnoses?.length) form.diagnosis = p.diagnoses[0].diagnosisName || ''
        if (p.treatmentPlans?.length) {
          const tp = p.treatmentPlans[0]
          if (tp.medication?.text) form.plan = tp.medication.text
          else if (Array.isArray(tp.medication)) form.plan = tp.medication.map(m => m.name || m).join('、')
          else if (typeof tp.medication === 'string') form.plan = tp.medication
          else form.plan = ''
        }
      }
    } catch (error) {
      showToast(error?.response?.data?.error?.message || '加载患者信息失败', 'error')
    }
  }
}

const fillMock = () => {
  clearAllErrors()
  const rand = () => Math.floor(Math.random() * 10)
  form.name = '示例患者' + Math.floor(Math.random() * 100)
  form.gender = '女'
  form.age = 36
  form.phone = '138' + Array.from({ length: 8 }, rand).join('')
  form.idCard = '310101' + Array.from({ length: 12 }, rand).join('')
  form.insurance = '城镇职工医保'
  form.address = '上海市浦东新区'
  form.bloodType = 'A'
  form.occupation = '教师'
  form.complaint = '近一周头晕、血压波动明显。'
  form.diagnosis = '高血压待进一步评估'
  form.plan = '建议完善血压监测并进行生活方式干预。'
  form.aiNotes = 'AI 建议关注夜间血压与药物依从性。'
}

const validate = () => {
  clearAllErrors()
  let valid = true
  if (!form.name || !form.name.trim()) {
    fieldErrors.name = '请填写患者姓名'; valid = false
  }
  if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) {
    fieldErrors.phone = '手机号格式不正确'; valid = false
  }
  if (form.idCard && !/^\d{17}[\dXx]$/.test(form.idCard)) {
    fieldErrors.idCard = '身份证号格式不正确'; valid = false
  }
  if (form.age !== null && form.age !== undefined && (form.age < 0 || form.age > 150)) {
    fieldErrors.age = '年龄应在 0-150 之间'; valid = false
  }
  if (!valid) showToast('请修正标红的表单项后重试', 'error')
  return valid
}

const handleBackendError = (err) => {
  if (!err) { showToast('保存失败', 'error'); return }
  const { code, message } = err
  if (code === 'MISSING_NAME') {
    fieldErrors.name = message || '姓名不能为空'
    showToast(message || '姓名不能为空', 'error')
  } else if (code === 'DUPLICATE') {
    const msg = message || '信息已存在'
    if (form.phone) fieldErrors.phone = '该手机号已存在'
    if (form.idCard) fieldErrors.idCard = '该身份证号已存在'
    if (!fieldErrors.phone && !fieldErrors.idCard) {
      fieldErrors.phone = '手机号或身份证重复'
      fieldErrors.idCard = '手机号或身份证重复'
    }
    showToast(msg, 'error')
  } else if (code === 'NOT_FOUND') {
    showToast(message || '患者不存在', 'error')
  } else {
    showToast(message || '保存失败', 'error')
  }
}

const savePatient = async () => {
  if (!validate()) return
  saving.value = true
  try {
    const data = {
      name: form.name, gender: form.gender, age: form.age,
      phone: form.phone || null, idCard: form.idCard || null,
      insurance: form.insurance || null, address: form.address || null,
      bloodType: form.bloodType || null, occupation: form.occupation || null,
      aiConsent: form.aiConsent,
      complaint: form.complaint || null, diagnosis: form.diagnosis || null,
      plan: form.plan || null, aiNotes: form.aiNotes || null
    }
    let res
    if (props.mode === 'edit') {
      res = await updatePatient(props.patientId, data)
    } else {
      res = await createPatient(data)
    }
    if (res?.success) {
      showToast(props.mode === 'new' ? '患者档案已创建' : '患者信息已更新', 'success')
      setTimeout(() => {
        visible.value = false
        emit('saved')
      }, 800)
    } else {
      handleBackendError(res?.error)
    }
  } catch (error) {
    const backendErr = error?.response?.data?.error
    if (backendErr) {
      handleBackendError(backendErr)
    } else {
      const status = error?.response?.status
      if (status === 409) {
        fieldErrors.phone = '手机号或身份证号与已有患者重复'
        fieldErrors.idCard = '手机号或身份证号与已有患者重复'
        showToast('手机号或身份证号与已有患者重复', 'error')
      } else if (status === 400) {
        showToast('请求参数错误，请检查填写内容', 'error')
      } else if (status === 404) {
        showToast('患者不存在', 'error')
      } else if (status >= 500) {
        showToast('服务器异常，请稍后重试', 'error')
      } else {
        showToast(`请求失败（${status || '网络错误'}）`, 'error')
      }
    }
  } finally {
    saving.value = false
  }
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
  width: min(90vw, 780px);
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

.form-section-title {
  margin: 0 0 8px; padding-bottom: 4px; font-size: 14px; font-weight: 600;
  color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  & + .form-section-title { margin-top: 14px; }
}

.form-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  &.single { grid-template-columns: 1fr; }
}

.field-item {
  display: grid; gap: 3px;
  & > span { color: var(--text-secondary); font-size: 12px; .required { color: var(--accent-rose); font-style: normal; } }
  input, select, textarea {
    width: 100%; height: 34px; border: 1px solid rgba(148, 163, 184, 0.12);
    background: #f8fbff; color: var(--text-primary); border-radius: 10px;
    padding: 0 10px; outline: none; font-size: 13px; font-family: inherit;
    box-sizing: border-box; transition: border-color 0.2s;
    &:focus { border-color: rgba(92, 225, 230, 0.3); }
  }
  textarea { height: auto; min-height: 56px; padding: 8px 10px; resize: vertical; }
  &.has-error input, &.has-error select, &.has-error textarea {
    border-color: #e74c3c; background: rgba(231, 76, 60, 0.03);
    &:focus { border-color: #e74c3c; }
  }
}

.field-error {
  display: block; margin: 0; padding: 0; font-style: normal;
  font-size: 11px; color: #e74c3c; line-height: 1.4;
}

.primary-btn {
  min-height: 36px; padding: 0 12px; border-radius: 12px; font-size: 13px;
  background: linear-gradient(135deg, var(--accent-cyan), #9ce7ff);
  color: #fff; border: none; cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.ghost-btn {
  min-height: 36px; padding: 0 12px; border-radius: 12px; font-size: 13px;
  border: 1px solid rgba(90, 141, 238, 0.16); background: #f5f9ff;
  color: var(--text-primary); cursor: pointer;
}

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
