import { aliyunEmbeddings } from './services/ai/embedding/aliyunEmbedding.js';

async function testEmbedding() {
  try {
    console.log('测试阿里云嵌入模型...');
    
    // 测试单个查询
    const text = "患者头痛、发热、咳嗽";
    const embedding = await aliyunEmbeddings.embedQuery(text);
    
    console.log(`嵌入向量长度: ${embedding.length}`);
    console.log(`前5个向量值: [${embedding.slice(0, 5).join(', ')}]`);
    console.log('嵌入生成成功！');
    
    // 测试批量嵌入
    const texts = [
      "急性心肌梗死的诊断标准",
      "糖尿病的治疗方法",
      "高血压的预防措施"
    ];
    
    const embeddings = await aliyunEmbeddings.embedDocuments(texts);
    console.log(`批量生成了 ${embeddings.length} 个嵌入`);
    console.log(`每个嵌入的维度: ${embeddings[0].length}`);
    
  } catch (error) {
    console.error('嵌入测试失败:', error.message);
    if (error.message.includes('401') || error.message.includes('Authentication')) {
      console.log('请检查您的 ALI_API_KEY 是否正确设置在 .env 文件中');
    }
  }
}

testEmbedding();