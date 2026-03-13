// 核心模块
export { createLLM, defaultLLM } from "./core/llm.js";
export { aliyunEmbeddings, defaultEmbeddings } from "./core/embeddings.js";
export { VectorStore, getVectorStore } from "./core/vectorStore.js";

// 工具模块（只导出启用的工具）
export { BaseTool, ToolRegistry, toolRegistry } from "./tools/tool/base.js";
export { medicalChatTool, intentRecognitionTool } from "./tools/index.js";

// 注释掉未启用的工具
// export { vectorSearchTool } from "./tools/vectorSearch.js";
// export { databaseQueryTool } from "./tools/databaseQuery.js";

// Agent 模块
export { createAgent, AgentManager, agentManager } from "./agent/agent.js";

/**
 * 初始化 LangChain 服务
 */
export async function initializeLangChain() {
  console.log("🚀 初始化 LangChain 服务...");

  try {
    // 初始化 AgentManager
    await agentManager.initialize();

    console.log("✅ LangChain 服务初始化完成");
    return true;
  } catch (error) {
    console.error("❌ LangChain 服务初始化失败:", error);
    throw error;
  }
}
