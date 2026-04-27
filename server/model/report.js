import prisma from '../prisma/index.js';

/**
 * 获取患者统计报表
 */
export async function getPatientReport() {
  try {
    const [totalPatients, genderDistribution, aiConsented, allPatients] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.groupBy({
        by: ['gender'],
        _count: { id: true }
      }),
      prisma.patient.count({ where: { aiConsent: true } }),
      prisma.patient.findMany({ select: { age: true, address: true } })
    ]);

    // 年龄段分布
    const ageGroups = [
      { label: '18-35 岁', value: 0 },
      { label: '36-50 岁', value: 0 },
      { label: '51-65 岁', value: 0 },
      { label: '65 岁以上', value: 0 }
    ];
    allPatients.forEach(p => {
      const age = p.age || 0;
      if (age >= 18 && age <= 35) ageGroups[0].value++;
      else if (age >= 36 && age <= 50) ageGroups[1].value++;
      else if (age >= 51 && age <= 65) ageGroups[2].value++;
      else if (age > 65) ageGroups[3].value++;
    });

    // 转换为百分比
    if (totalPatients > 0) {
      ageGroups.forEach(g => {
        g.value = Math.round((g.value / totalPatients) * 100);
      });
    }

    // 性别分布
    const genderMap = {};
    genderDistribution.forEach(g => { genderMap[g.gender] = g._count.id; });

    // 地区分布
    const regionMap = {};
    allPatients.forEach(p => {
      const region = p.address ? p.address.substring(0, 6) : '未知';
      regionMap[region] = (regionMap[region] || 0) + 1;
    });
    const regionDistribution = Object.entries(regionMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      success: true,
      data: {
        totalPatients,
        aiCoverage: totalPatients > 0 ? Math.round((aiConsented / totalPatients) * 100) : 0,
        genderDistribution: genderMap,
        ageGroups,
        regionDistribution
      }
    };
  } catch (error) {
    console.error('❌ 获取患者报表失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 获取诊疗统计报表
 */
export async function getDiagnosisReport() {
  try {
    const [diagnosisCount, typeDistribution, treatmentCount, progressNoteCount] = await Promise.all([
      prisma.diagnosis.groupBy({
        by: ['diagnosisName'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      prisma.diagnosis.groupBy({
        by: ['type'],
        _count: { id: true }
      }),
      prisma.treatmentPlan.count(),
      prisma.progressNote.count()
    ]);

    const diagnosisRanking = diagnosisCount.map((d, i) => ({
      index: String(i + 1).padStart(2, '0'),
      name: d.diagnosisName,
      count: d._count.id
    }));

    const typeMap = {};
    typeDistribution.forEach(t => { typeMap[t.type] = t._count.id; });

    return {
      success: true,
      data: {
        diagnosisRanking,
        diagnosisTypeDistribution: typeMap,
        totalTreatments: treatmentCount,
        totalProgressNotes: progressNoteCount
      }
    };
  } catch (error) {
    console.error('❌ 获取诊疗报表失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 获取费用统计报表
 */
export async function getFinancialReport() {
  try {
    const [financialData, paymentStats] = await Promise.all([
      prisma.financialInfo.aggregate({
        _sum: { totalCost: true, insuranceCoverage: true, selfPayment: true },
        _count: { id: true }
      }),
      prisma.financialInfo.groupBy({
        by: ['paymentStatus'],
        _count: { id: true },
        _sum: { totalCost: true }
      })
    ]);

    const totalCost = financialData._sum.totalCost || 0;
    const insuranceCoverage = financialData._sum.insuranceCoverage || 0;
    const selfPayment = financialData._sum.selfPayment || 0;
    const totalRecords = financialData._count.id || 0;

    const insurancePercent = totalCost > 0 ? Math.round((insuranceCoverage / totalCost) * 100) : 0;
    const selfPercent = totalCost > 0 ? Math.round((selfPayment / totalCost) * 100) : 0;
    const avgCost = totalRecords > 0 ? Math.round(totalCost / totalRecords) : 0;

    const paymentDistribution = {};
    paymentStats.forEach(p => {
      paymentDistribution[p.paymentStatus] = {
        count: p._count.id,
        totalCost: Math.round(p._sum.totalCost || 0)
      };
    });

    // 异常账单数（费用超过50000的）
    const abnormalBills = await prisma.financialInfo.count({
      where: { totalCost: { gt: 50000 } }
    });

    return {
      success: true,
      data: {
        totalCost: Math.round(totalCost),
        insuranceCoverage: Math.round(insuranceCoverage),
        selfPayment: Math.round(selfPayment),
        insurancePercent,
        selfPercent,
        avgCost,
        totalRecords,
        abnormalBills,
        paymentDistribution
      }
    };
  } catch (error) {
    console.error('❌ 获取费用报表失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
