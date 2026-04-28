import prisma from '../prisma/index.js';

export async function getPatientFullContext(patientId) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        medicalHistories: true,
        currentSymptoms: true,
        physicalExaminations: true,
        examinationResults: true,
        diagnoses: true,
        treatmentPlans: true,
        progressNotes: { orderBy: { noteDate: 'desc' }, take: 10 },
        financialInfos: true,
        medicalTeams: true
      }
    });

    if (!patient) {
      return { success: false, error: { code: 'NOT_FOUND', message: '患者不存在' } };
    }

    return { success: true, data: patient };
  } catch (error) {
    console.error('❌ 获取患者完整数据失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 保存 AI 综合分析结果。新分析替换旧分析，但保留 suggestion。
 */
export async function saveAiAnalysis(patientId, analysisResult) {
  try {
    // 先读取现有 aiNotes，保留其中的 suggestion
    const existing = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { aiNotes: true }
    });

    const aiNotes = typeof existing?.aiNotes === 'object' && existing.aiNotes !== null
      ? { ...existing.aiNotes }
      : {};

    aiNotes.analysis = analysisResult;
    aiNotes.analyzedAt = new Date().toISOString();

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: { aiNotes, vectorVersion: aiNotes.analyzedAt }
    });

    return { success: true, data: patient };
  } catch (error) {
    console.error('❌ 保存 AI 分析结果失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 保存 AI 诊疗建议。新建议替换旧建议，但保留 analysis。
 */
export async function saveAiSuggestion(patientId, suggestionText) {
  try {
    const existing = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { aiNotes: true }
    });

    const aiNotes = typeof existing?.aiNotes === 'object' && existing.aiNotes !== null
      ? { ...existing.aiNotes }
      : {};

    aiNotes.suggestion = suggestionText;
    aiNotes.suggestedAt = new Date().toISOString();

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: { aiNotes }
    });

    return { success: true, data: patient };
  } catch (error) {
    console.error('❌ 保存 AI 建议失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getAiStats() {
  try {
    const [totalPatients, aiAnalyzed, highRisk] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({
        where: { aiNotes: { not: null } }
      }),
      prisma.patient.count({
        where: {
          aiNotes: {
            path: ['analysis', 'riskLevel'],
            equals: 'high'
          }
        }
      })
    ]);

    return {
      success: true,
      data: {
        totalPatients,
        aiAnalyzed,
        aiCoverage: totalPatients > 0 ? Math.round((aiAnalyzed / totalPatients) * 100) : 0,
        highRisk,
        pendingReview: totalPatients - aiAnalyzed
      }
    };
  } catch (error) {
    console.error('❌ 获取 AI 统计失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
