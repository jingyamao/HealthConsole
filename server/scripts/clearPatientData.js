import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * 清空患者相关数据脚本
 * 按照依赖关系顺序删除所有患者相关表的数据
 */
async function clearPatientData() {
  console.log('\n🗑️  开始清空患者相关数据...\n');
  
  try {
    // 按照依赖关系从外到内删除
    console.log('1️⃣  删除向量数据 (vector_store)...');
    const vectorResult = await prisma.vectorStore.deleteMany({});
    console.log(`   ✅ 已删除 ${vectorResult.count} 条向量记录\n`);
    
    console.log('2️⃣  删除病程记录 (progress_notes)...');
    const progressNoteResult = await prisma.progressNote.deleteMany({});
    console.log(`   ✅ 已删除 ${progressNoteResult.count} 条病程记录\n`);
    
    console.log('3️⃣  删除费用信息 (financial_info)...');
    const financialInfoResult = await prisma.financialInfo.deleteMany({});
    console.log(`   ✅ 已删除 ${financialInfoResult.count} 条费用记录\n`);
    
    console.log('4️⃣  删除医疗团队 (medical_team)...');
    const medicalTeamResult = await prisma.medicalTeam.deleteMany({});
    console.log(`   ✅ 已删除 ${medicalTeamResult.count} 条医疗团队记录\n`);
    
    console.log('5️⃣  删除既往病史 (medical_history)...');
    const medicalHistoryResult = await prisma.medicalHistory.deleteMany({});
    console.log(`   ✅ 已删除 ${medicalHistoryResult.count} 条病史记录\n`);
    
    console.log('6️⃣  删除当前症状 (current_symptoms)...');
    const currentSymptomResult = await prisma.currentSymptom.deleteMany({});
    console.log(`   ✅ 已删除 ${currentSymptomResult.count} 条症状记录\n`);
    
    console.log('7️⃣  删除体格检查 (physical_examination)...');
    const physicalExamResult = await prisma.physicalExamination.deleteMany({});
    console.log(`   ✅ 已删除 ${physicalExamResult.count} 条体检记录\n`);
    
    console.log('8️⃣  删除检查结果 (examination_results)...');
    const examResultResult = await prisma.examinationResult.deleteMany({});
    console.log(`   ✅ 已删除 ${examResultResult.count} 条检查结果记录\n`);
    
    console.log('9️⃣  删除诊断记录 (diagnoses)...');
    const diagnosisResult = await prisma.diagnosis.deleteMany({});
    console.log(`   ✅ 已删除 ${diagnosisResult.count} 条诊断记录\n`);
    
    console.log('🔟  删除治疗方案 (treatment_plans)...');
    const treatmentPlanResult = await prisma.treatmentPlan.deleteMany({});
    console.log(`   ✅ 已删除 ${treatmentPlanResult.count} 条治疗方案记录\n`);
    
    console.log('1️⃣1️⃣  删除患者基本信息 (patients)...');
    const patientResult = await prisma.patient.deleteMany({});
    console.log(`   ✅ 已删除 ${patientResult.count} 条患者记录\n`);
    
    // 统计信息
    const totalDeleted = 
      vectorResult.count +
      progressNoteResult.count +
      financialInfoResult.count +
      medicalTeamResult.count +
      medicalHistoryResult.count +
      currentSymptomResult.count +
      physicalExamResult.count +
      examResultResult.count +
      diagnosisResult.count +
      treatmentPlanResult.count +
      patientResult.count;
    
    console.log('═'.repeat(60));
    console.log('✅ 数据清空完成！');
    console.log('═'.repeat(60));
    console.log(`📊 总计删除：${totalDeleted} 条记录`);
    console.log('\n各表删除详情:');
    console.log(`   - vector_store: ${vectorResult.count}`);
    console.log(`   - progress_notes: ${progressNoteResult.count}`);
    console.log(`   - financial_info: ${financialInfoResult.count}`);
    console.log(`   - medical_team: ${medicalTeamResult.count}`);
    console.log(`   - medical_history: ${medicalHistoryResult.count}`);
    console.log(`   - current_symptoms: ${currentSymptomResult.count}`);
    console.log(`   - physical_examination: ${physicalExamResult.count}`);
    console.log(`   - examination_results: ${examResultResult.count}`);
    console.log(`   - diagnoses: ${diagnosisResult.count}`);
    console.log(`   - treatment_plans: ${treatmentPlanResult.count}`);
    console.log(`   - patients: ${patientResult.count}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ 清空数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
clearPatientData()
  .then(() => {
    console.log('👋 脚本执行完成\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
