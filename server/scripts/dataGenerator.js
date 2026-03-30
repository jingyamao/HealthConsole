import dotenv from "dotenv";

dotenv.config();

import patientDataGenerator from '../services/langchain/tools/generators/patientDataGenerator.js';
import medicalKnowledgeGenerator from '../services/langchain/tools/generators/medicalKnowledgeGenerator.js';

/**
 * 数据生成工具脚本
 * 用于生成患者数据和医疗知识文档
 * 
 * 使用方法：
 *   node scripts/dataGenerator.js patient     - 生成 5 个患者数据
 *   node scripts/dataGenerator.js knowledge   - 生成 5 份医疗知识文档（联网）
 *   node scripts/dataGenerator.js all        - 生成患者数据 + 医疗知识文档
 *   node scripts/dataGenerator.js list        - 查看推荐的知识文档主题
 *   node scripts/dataGenerator.js topic "主题" - 生成指定主题的医疗文档
 */

const args = process.argv.slice(2);
const command = args[0] || 'help';

/**
 * 清空患者数据
 */
async function clearPatients() {
  console.log('\n' + '='.repeat(60));
  console.log('🗑️  开始清空患者数据');
  console.log('='.repeat(60));
  
  const { exec } = await import('child_process');
  
  return new Promise((resolve, reject) => {
    exec('node scripts/clearPatientData.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ 清空数据失败:', error);
        reject(error);
      } else {
        console.log(stdout);
        if (stderr) {
          console.error(stderr);
        }
        resolve();
      }
    });
  });
}

/**
 * 生成患者数据
 */
async function generatePatients() {
  console.log('\n' + '='.repeat(60));
  console.log('🏥 开始生成患者医疗数据');
  console.log('='.repeat(60));
  
  try {
    // 可选：先清空现有数据
    const shouldClear = args.includes('--clear');
    if (shouldClear) {
      await clearPatients();
    }
    
    // 获取生成数量（从命令行参数或默认值）
    const count = parseInt(args[1]) || patientDataGenerator.defaultCount;
    
    // 生成患者数据
    console.log(`📋 计划生成：${count} 个患者`);
    const result = await patientDataGenerator.generateAndStore(count);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 患者数据生成结果:');
    console.log(`   - 状态：${result.success ? '成功' : '失败'}`);
    console.log(`   - 生成数量：${result.count || 0}`);
    if (result.details) {
      console.log(`   - 成功入库：${result.details.insertedCount} 人`);
      console.log(`   - 入库失败：${result.details.failedCount} 人`);
    }
    console.log('='.repeat(60));
    
    return result;
  } catch (error) {
    console.error('❌ 生成患者数据失败:', error);
    throw error;
  }
}

/**
 * 生成医疗知识文档
 * @param {Array<string>} customTopics - 自定义主题列表
 */
async function generateKnowledge(customTopics = null) {
  console.log('\n' + '='.repeat(60));
  console.log('📚 开始生成医疗知识文档（联网模式）');
  console.log('='.repeat(60));
  
  try {
    // 获取生成数量（从命令行参数或默认值 1）
    const count = parseInt(args[1]) || 1;
    
    console.log(`📋 计划生成：${count} 份文档\n`);
    
    const result = await medicalKnowledgeGenerator.generateBatch(count, customTopics);
    
    if (result.success) {
      console.log('\n' + '='.repeat(60));
      console.log('📊 医疗知识文档生成结果:');
      console.log(`   - 状态：成功`);
      console.log(`   - 成功生成：${result.count} 份`);
      
      if (result.documents && result.documents.length > 0) {
        console.log('\n   📄 生成的文档：');
        result.documents.forEach((doc, index) => {
          console.log(`      ${index + 1}. ${doc.title}`);
          console.log(`         路径：${doc.filePath}`);
        });
      }
      
      console.log('='.repeat(60));
    } else {
      console.error('❌ 生成失败:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 生成医疗知识文档失败:', error);
    throw error;
  }
}

/**
 * 执行全部生成任务
 */
async function generateAll() {
  console.log('\n' + '#'.repeat(60));
  console.log('# 🚀 开始执行全量数据生成');
  console.log('#    1. 生成患者数据（不联网）');
  console.log('#    2. 生成医疗知识文档（联网）');
  console.log('#'.repeat(60));
  
  try {
    // 步骤 1：生成患者数据
    console.log('\n\n>>> 步骤 1/2：生成患者数据');
    await generatePatients();
    
    console.log('\n\n>>> 步骤 2/2：生成医疗知识文档');
    await generateKnowledge();
    
    console.log('\n' + '#'.repeat(60));
    console.log('# ✅ 全量数据生成完成！');
    console.log('#'.repeat(60));
    
  } catch (error) {
    console.error('❌ 全量数据生成失败:', error);
    throw error;
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🏥 数据生成工具 - 使用说明

用法：
  node scripts/dataGenerator.js <命令> [选项]

命令：
  patient [数量]        生成患者数据（默认 5 个）
                        示例：patient 10 生成 10 个患者
  
  patient --clear       生成前先清空现有数据
  
  knowledge [数量]      生成医疗知识文档（默认 1 份，联网）
                        示例：knowledge 5 生成 5 份文档
  
  topic "<主题>"        生成指定主题的医疗文档
  
  all [患者数] [文档数]  生成患者数据 + 医疗知识文档
                        --clear: 生成前先清空现有患者数据
  
  list                  显示推荐的知识文档主题列表
  
  help                  显示帮助信息

示例：
  node scripts/dataGenerator.js patient
  node scripts/dataGenerator.js patient 10
  node scripts/dataGenerator.js patient 20
  node scripts/dataGenerator.js patient --clear
  node scripts/dataGenerator.js knowledge
  node scripts/dataGenerator.js knowledge 5
  node scripts/dataGenerator.js topic "2 型糖尿病诊疗指南"
  node scripts/dataGenerator.js all
  node scripts/dataGenerator.js all --clear
  node scripts/dataGenerator.js list
  `);
}

/**
 * 显示推荐主题列表
 */
function showTopicList() {
  const topics = medicalKnowledgeGenerator.getRecommendedTopics();
  
  console.log('\n📋 推荐的知识文档主题列表：\n');
  
  // 按类别分组
  const categories = {};
  topics.forEach(topic => {
    let category = '其他';
    if (topic.includes('血压') || topic.includes('冠心病') || topic.includes('心房') || topic.includes('血脂')) {
      category = '心血管疾病';
    } else if (topic.includes('糖尿病') || topic.includes('甲状腺') || topic.includes('骨质') || topic.includes('痛风')) {
      category = '内分泌疾病';
    } else if (topic.includes('哮喘') || topic.includes('慢阻肺') || topic.includes('肺栓塞') || topic.includes('肺炎')) {
      category = '呼吸系统';
    } else if (topic.includes('胃食管') || topic.includes('炎症性肠病') || topic.includes('肝硬化') || topic.includes('幽门')) {
      category = '消化系统';
    } else if (topic.includes('卒中') || topic.includes('癫痫') || topic.includes('帕金森') || topic.includes('痴呆')) {
      category = '神经系统';
    } else if (topic.includes('类风湿') || topic.includes('红斑狼疮') || topic.includes('肾脏') || topic.includes('肿瘤') || topic.includes('抗菌')) {
      category = '其他疾病';
    }
    
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(topic);
  });
  
  Object.entries(categories).forEach(([category, topicList]) => {
    console.log(`【${category}】`);
    topicList.forEach(topic => {
      console.log(`  - ${topic}`);
    });
    console.log('');
  });
  
  console.log('\n使用方法：');
  console.log('  node scripts/dataGenerator.js topic "主题名称"');
  console.log('  node scripts/dataGenerator.js knowledge 10');
}

// 主入口
async function main() {
  console.log('\n🏥 HealthConsole 数据生成工具');
  console.log('   基于小米 MIMO 大模型\n');
  
  switch (command) {
    case 'patient':
      await generatePatients();
      break;
      
    case 'knowledge':
      const count = parseInt(args[1]) || 5;
      const topics = medicalKnowledgeGenerator.getRecommendedTopics().slice(0, count);
      await generateKnowledge(topics);
      break;
      
    case 'topic':
      if (!args[1]) {
        console.error('❌ 请指定主题');
        console.log('   用法：node scripts/dataGenerator.js topic "主题名称"');
        process.exit(1);
      }
      await generateKnowledge([args[1]]);
      break;
      
    case 'all':
      await generateAll();
      break;
      
    case 'list':
      showTopicList();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
  
  console.log('\n👋 完成！\n');
  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ 执行失败:', error);
  process.exit(1);
});
