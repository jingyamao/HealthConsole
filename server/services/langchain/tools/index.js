// 导入所有工具
import { medicalChatTool } from "./tool/medicalChat.js";
import { intentRecognitionTool } from "./tool/intentRecognition.js";
import { databaseQueryTool } from "./tool/databaseQuery.js";
import {
  vectorSearchTool,
  patientCaseSearchTool,
  knowledgeBaseSearchTool,
  addDocumentTool,
  listKnowledgeBaseTool,
  vectorTools
} from "./tool/vectorSearch.js";

// 导出所有工具
export {
  medicalChatTool,
  intentRecognitionTool,
  databaseQueryTool,
  vectorSearchTool,
  patientCaseSearchTool,
  knowledgeBaseSearchTool,
  addDocumentTool,
  listKnowledgeBaseTool,
  vectorTools
};

// 当前启用的工具列表（用于Agent）
export const activeTools = [
  intentRecognitionTool,  // 意图识别
  medicalChatTool,        // 医疗对话
  vectorSearchTool,       // 向量搜索
  databaseQueryTool,      // 数据库查询
  listKnowledgeBaseTool   // 知识库列表
];

// 所有可用的向量工具
export const availableVectorTools = [
  vectorSearchTool,
  patientCaseSearchTool,
  knowledgeBaseSearchTool,
  addDocumentTool,
  listKnowledgeBaseTool
];
