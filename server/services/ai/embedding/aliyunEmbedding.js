import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

// 初始化阿里云嵌入模型 - text-embedding-v2 
export const aliyunEmbeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.ALIYUN_API_KEY || process.env.ALI_API_KEY, // 使用阿里云API密钥
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", // 阿里云兼容OpenAI的接口
  },
  modelName: "text-embedding-v2", // 阿里云通义千问系列的嵌入模型
  batchSize: 32,        // 批量处理大小
  stripNewLines: true,  // 移除换行符
});

// 阿里云目前主要提供 text-embedding-v2 模型
export const aliyunTextEmbedding = aliyunEmbeddings;