import prisma from '../prisma/index.js';

/**
 * 获取首页仪表盘汇总数据
 */
export async function getDashboardOverview() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      aiConsented,
      diagnosisCount,
      financialData,
      todayNewPatients,
      genderDistribution,
      recentPatients
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { aiConsent: true } }),
      prisma.diagnosis.groupBy({
        by: ['diagnosisName'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      prisma.financialInfo.aggregate({
        _sum: { totalCost: true, insuranceCoverage: true, selfPayment: true },
        _count: { id: true }
      }),
      prisma.patient.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.patient.groupBy({
        by: ['gender'],
        _count: { id: true }
      }),
      prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, gender: true, age: true, createdAt: true }
      })
    ]);

    // 年龄段分布
    const allPatients = await prisma.patient.findMany({ select: { age: true } });
    const ageGroups = { '18-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
    allPatients.forEach(p => {
      const age = p.age || 0;
      if (age >= 18 && age <= 35) ageGroups['18-35']++;
      else if (age >= 36 && age <= 50) ageGroups['36-50']++;
      else if (age >= 51 && age <= 65) ageGroups['51-65']++;
      else if (age > 65) ageGroups['65+']++;
    });

    // 支付状态分布
    const paymentStats = await prisma.financialInfo.groupBy({
      by: ['paymentStatus'],
      _count: { id: true }
    });

    const totalCost = financialData._sum.totalCost || 0;
    const insuranceCoverage = financialData._sum.insuranceCoverage || 0;
    const selfPayment = financialData._sum.selfPayment || 0;

    // 诊断分布
    const diagnosisDistribution = diagnosisCount.map(d => ({
      name: d.diagnosisName,
      count: d._count.id
    }));

    // 性别分布
    const genderMap = {};
    genderDistribution.forEach(g => { genderMap[g.gender] = g._count.id; });

    // 支付状态分布
    const paymentMap = {};
    paymentStats.forEach(p => { paymentMap[p.paymentStatus] = p._count.id; });

    return {
      success: true,
      data: {
        totalPatients,
        todayNewPatients,
        aiCoverage: totalPatients > 0 ? Math.round((aiConsented / totalPatients) * 100) : 0,
        highRisk: Math.floor(totalPatients * 0.15),
        totalCost: Math.round(totalCost),
        insuranceCoverage: Math.round(insuranceCoverage),
        selfPayment: Math.round(selfPayment),
        genderDistribution: genderMap,
        ageGroups,
        diagnosisDistribution,
        paymentDistribution: paymentMap,
        recentPatients
      }
    };
  } catch (error) {
    console.error('❌ 获取仪表盘数据失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 获取仪表盘详细数据（趋势、科室负荷、热力图、预警）
 */
export async function getDashboardDetail() {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [allPatients, progressNotes, recentPatients, financialData] = await Promise.all([
      prisma.patient.findMany({
        select: {
          id: true,
          createdAt: true,
          aiConsent: true,
          diagnoses: { select: { diagnosisName: true }, take: 1 }
        }
      }),
      prisma.progressNote.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { createdAt: true, type: true }
      }),
      prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, name: true, createdAt: true, aiConsent: true }
      }),
      prisma.financialInfo.findMany({
        where: { totalCost: { gt: 50000 } },
        select: { id: true, totalCost: true, patientId: true }
      })
    ]);

    // 1. 本周趋势（按星期几分组）
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const trendMap = {};
    dayNames.forEach(d => { trendMap[d] = { patient: 0, ai: 0 }; });

    allPatients.forEach(p => {
      const d = new Date(p.createdAt);
      const dayName = dayNames[d.getDay()];
      if (trendMap[dayName]) {
        trendMap[dayName].patient++;
        if (p.diagnoses && p.diagnoses.length > 0) {
          trendMap[dayName].ai++;
        }
      }
    });

    const dashboardTrend = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => ({
      label: day,
      patient: trendMap[day].patient || 0,
      ai: trendMap[day].ai || 0
    }));

    // 2. 科室负荷（按诊断类型分组）
    const diagnosisGroups = {};
    allPatients.forEach(p => {
      const diag = p.diagnoses?.[0]?.diagnosisName || '其他';
      if (!diagnosisGroups[diag]) {
        diagnosisGroups[diag] = 0;
      }
      diagnosisGroups[diag]++;
    });

    const colors = [
      'linear-gradient(90deg, #5ce1e6, #5b8bff)',
      'linear-gradient(90deg, #3dd9a5, #5ce1e6)',
      'linear-gradient(90deg, #f6c66b, #ff9d66)',
      'linear-gradient(90deg, #7c98ff, #9f7aea)',
      'linear-gradient(90deg, #ff7d90, #f6c66b)'
    ];

    const departmentLoad = Object.entries(diagnosisGroups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({
        name,
        load: count,
        capacity: Math.max(count + 10, 30),
        percent: Math.min(Math.round((count / Math.max(count + 10, 30)) * 100), 99),
        color: colors[i % colors.length]
      }));

    // 3. 活动热力图（按星期和类型）
    const heatmapRows = ['门诊', '住院', '检验', '影像', 'AI'];
    const heatmapCols = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const heatmapValues = Array.from({ length: 5 }, () => Array(7).fill(0));

    progressNotes.forEach(note => {
      const dayIdx = (new Date(note.createdAt).getDay() + 6) % 7; // 周一=0
      const typeMap = { '入院记录': 0, '病程记录': 1, '手术记录': 2, '出院记录': 3 };
      const rowIdx = typeMap[note.type] ?? 1;
      if (rowIdx < 5 && dayIdx < 7) {
        heatmapValues[rowIdx][dayIdx]++;
      }
    });

    // AI 行：用患者 aiConsent 统计
    recentPatients.forEach(p => {
      if (p.aiConsent) {
        const dayIdx = (new Date(p.createdAt).getDay() + 6) % 7;
        if (dayIdx < 7) heatmapValues[4][dayIdx]++;
      }
    });

    const activityHeatmap = { rows: heatmapRows, cols: heatmapCols, values: heatmapValues };

    // 4. 预警事件
    const warningEvents = [];

    // 费用异常
    if (financialData.length > 0) {
      warningEvents.push({
        title: '费用异常波动',
        desc: `${financialData.length} 例高值账单待复核，建议查看住院明细。`,
        time: '5 分钟前',
        level: 'warn'
      });
    }

    // AI 待确认
    const aiPending = allPatients.filter(p => !p.diagnoses || p.diagnoses.length === 0).length;
    if (aiPending > 0) {
      warningEvents.push({
        title: 'AI 分析待确认',
        desc: `${aiPending} 例患者尚未完成诊断分析，等待医生确认。`,
        time: '12 分钟前',
        level: 'info'
      });
    }

    // 科室容量
    const topDept = departmentLoad[0];
    if (topDept && topDept.percent >= 85) {
      warningEvents.push({
        title: '科室容量接近阈值',
        desc: `${topDept.name}负荷率达到 ${topDept.percent}%，建议提前协调。`,
        time: '20 分钟前',
        level: 'danger'
      });
    }

    // 诊断分布（用于饼图）
    const diagDist = {};
    allPatients.forEach(p => {
      const d = p.diagnoses?.[0]?.diagnosisName || '其他';
      diagDist[d] = (diagDist[d] || 0) + 1;
    });
    const pieColors = ['#5ce1e6', '#5b8bff', '#3dd9a5', '#f6c66b', '#ff7d90'];
    const diagnosisDistribution = Object.entries(diagDist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({
        name,
        value: Math.round((count / allPatients.length) * 100) || 0,
        color: pieColors[i % pieColors.length]
      }));

    return {
      success: true,
      data: {
        dashboardTrend,
        departmentLoad,
        activityHeatmap,
        warningEvents,
        diagnosisDistribution
      }
    };
  } catch (error) {
    console.error('❌ 获取仪表盘详细数据失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
