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

