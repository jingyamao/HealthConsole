import * as aiAnalysisModel from '../model/aiAnalysis.js';
import { defaultLLM } from '../services/langchain/core/llm.js';

/**
 * 将患者数据格式化为 AI 可读的文本上下文
 */
function formatPatientContext(patient) {
  const parts = [];

  parts.push(`## 患者基本信息`);
  parts.push(`- 姓名: ${patient.name}`);
  parts.push(`- 性别: ${patient.gender}`);
  parts.push(`- 年龄: ${patient.age || '未知'}`);
  parts.push(`- 血型: ${patient.bloodType || '未知'}`);
  parts.push(`- 医保: ${patient.insurance || '未知'}`);
  parts.push(`- 职业: ${patient.occupation || '未知'}`);

  if (patient.medicalHistories?.length) {
    parts.push(`\n## 既往病史`);
    patient.medicalHistories.forEach(h => {
      parts.push(`- [${h.type}] ${typeof h.details === 'string' ? h.details : JSON.stringify(h.details)}`);
    });
  }

  if (patient.currentSymptoms?.length) {
    parts.push(`\n## 当前症状`);
    patient.currentSymptoms.forEach(s => {
      parts.push(`- 主诉: ${s.mainComplaint}`);
      if (s.severity) parts.push(`  严重程度: ${s.severity}`);
      if (s.duration) parts.push(`  持续时间: ${s.duration}`);
      if (s.aggravatingFactors) parts.push(`  加重因素: ${s.aggravatingFactors}`);
      if (s.relievingFactors) parts.push(`  缓解因素: ${s.relievingFactors}`);
    });
  }

  if (patient.physicalExaminations?.length) {
    parts.push(`\n## 体格检查`);
    const exam = patient.physicalExaminations[0];
    if (exam.vitalSigns) parts.push(`- 生命体征: ${exam.vitalSigns}`);
    if (exam.cardiovascular) parts.push(`- 心血管: ${exam.cardiovascular}`);
    if (exam.neurological) parts.push(`- 神经系统: ${exam.neurological}`);
  }

  if (patient.examinationResults?.length) {
    parts.push(`\n## 检查结果`);
    patient.examinationResults.forEach(r => {
      if (r.laboratoryTests) parts.push(`- 实验室: ${r.laboratoryTests}`);
      if (r.imagingStudies) parts.push(`- 影像学: ${r.imagingStudies}`);
      if (r.specialTests) parts.push(`- 特殊检查: ${r.specialTests}`);
    });
  }

  if (patient.diagnoses?.length) {
    parts.push(`\n## 诊断记录`);
    patient.diagnoses.forEach(d => {
      parts.push(`- [${d.type}] ${d.diagnosisName}${d.icdCode ? ` (ICD: ${d.icdCode})` : ''}${d.doctorName ? ` - ${d.doctorName}` : ''}`);
    });
  }

  if (patient.treatmentPlans?.length) {
    parts.push(`\n## 治疗方案`);
    patient.treatmentPlans.forEach((t, i) => {
      parts.push(`### 方案 ${i + 1}`);
      if (t.medication) parts.push(`- 用药: ${typeof t.medication === 'string' ? t.medication : JSON.stringify(t.medication)}`);
      if (t.procedures) parts.push(`- 处置: ${typeof t.procedures === 'string' ? t.procedures : JSON.stringify(t.procedures)}`);
    });
  }

  if (patient.financialInfos?.length) {
    parts.push(`\n## 费用信息`);
    const f = patient.financialInfos[0];
    parts.push(`- 总费用: ¥${f.totalCost || 0}`);
    parts.push(`- 医保覆盖: ¥${f.insuranceCoverage || 0}`);
    parts.push(`- 自费: ¥${f.selfPayment || 0}`);
    parts.push(`- 支付状态: ${f.paymentStatus}`);
  }

  return parts.join('\n');
}

/**
 * POST /api/patients/:id/ai/analyze
 * 对单个患者执行 AI 综合分析
 */
export async function analyze(ctx) {
  try {
    const { patientId } = ctx.params;

    // 获取患者完整数据
    const contextResult = await aiAnalysisModel.getPatientFullContext(patientId);
    if (!contextResult.success) {
      ctx.status = 404;
      ctx.body = contextResult;
      return;
    }

    const patientContext = formatPatientContext(contextResult.data);

    const systemPrompt = `你是一位资深临床医学专家，擅长综合分析患者病历数据。
请基于提供的患者数据，进行全面的临床分析。严格按以下 JSON 格式输出分析结果（不要输出其他内容）：

{
  "riskLevel": "high/moderate/low",
  "riskSummary": "一句话总结风险评估",
  "keyFindings": ["发现1", "发现2", ...],
  "attentionPoints": ["需要关注的点1", "点2", ...],
  "diagnosisAssessment": "诊断评估说明",
  "treatmentReview": "治疗方案审查意见",
  "followUpSuggestions": "随访建议"
}

风险评估标准：
- high: 存在严重疾病、多项异常指标、或治疗方案复杂
- moderate: 需要持续监测和跟进
- low: 病情稳定、无重大异常`;

    const userPrompt = `请分析以下患者的完整病历数据并给出综合评估：\n\n${patientContext}`;

    const response = await defaultLLM.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    // 解析 AI 响应
    let analysisResult;
    try {
      const content = response.content.trim();
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = { riskLevel: 'moderate', riskSummary: content, keyFindings: [], attentionPoints: [], diagnosisAssessment: '', treatmentReview: '', followUpSuggestions: '' };
      }
    } catch {
      analysisResult = { riskLevel: 'moderate', riskSummary: response.content, keyFindings: [], attentionPoints: [], diagnosisAssessment: '', treatmentReview: '', followUpSuggestions: '' };
    }

    // 保存分析结果
    const saveResult = await aiAnalysisModel.saveAiAnalysis(patientId, analysisResult);

    if (saveResult.success) {
      ctx.body = { success: true, data: { analysis: analysisResult, message: 'AI 分析完成' } };
    } else {
      ctx.status = 500;
      ctx.body = saveResult;
    }
  } catch (error) {
    console.error('❌ AI 分析错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'AI_ERROR', message: error.message } };
  }
}

/**
 * POST /api/analysis/:patientId/suggest
 * 生成 AI 诊疗建议并持久化
 */
export async function suggest(ctx) {
  try {
    const { patientId } = ctx.params;

    const contextResult = await aiAnalysisModel.getPatientFullContext(patientId);
    if (!contextResult.success) {
      ctx.status = 404;
      ctx.body = contextResult;
      return;
    }

    const patientContext = formatPatientContext(contextResult.data);

    const systemPrompt = `你是一位资深临床医学专家。基于患者数据，提供诊疗建议。
请用 Markdown 格式输出，包含以下部分：
1. **诊断建议** - 基于现有数据的诊断分析
2. **进一步检查建议** - 建议补充的检查项目
3. **治疗优化建议** - 对当前治疗方案的优化建议
4. **生活方式指导** - 饮食、运动等生活建议
5. **随访建议** - 下次复查时间点和关注事项
6. **风险提示** - 需要警惕的并发症或风险`;

    const userPrompt = `基于以下患者数据，请提供详细的诊疗建议：\n\n${patientContext}`;

    const response = await defaultLLM.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    const suggestionText = response.content;
    const suggestedAt = new Date().toISOString();

    // 保存建议到 aiNotes
    const saveResult = await aiAnalysisModel.saveAiSuggestion(patientId, suggestionText);

    if (saveResult.success) {
      ctx.body = { success: true, data: { suggestions: suggestionText, suggestedAt } };
    } else {
      ctx.status = 500;
      ctx.body = saveResult;
    }
  } catch (error) {
    console.error('❌ AI 建议生成错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'AI_ERROR', message: error.message } };
  }
}

/**
 * GET /api/patients/:id/ai/status
 * 获取患者 AI 分析状态
 */
export async function status(ctx) {
  try {
    const { patientId } = ctx.params;

    const patient = await aiAnalysisModel.getPatientFullContext(patientId);
    if (!patient.success) {
      ctx.status = 404;
      ctx.body = patient;
      return;
    }

    const p = patient.data;
    ctx.body = {
      success: true,
      data: {
        aiConsent: p.aiConsent,
        isAnalyzed: !!p.aiNotes,
        analysis: p.aiNotes || null,
        lastAnalyzed: p.vectorVersion || null
      }
    };
  } catch (error) {
    console.error('❌ 获取 AI 状态错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * GET /api/dashboard/ai-stats
 * 获取 AI 分析统计
 */
export async function aiStats(ctx) {
  try {
    const result = await aiAnalysisModel.getAiStats();
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取 AI 统计错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}
