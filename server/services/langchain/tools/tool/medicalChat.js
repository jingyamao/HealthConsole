import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { defaultLLM } from "../../core/llm.js";

/**
 * 医疗对话工具
 * 用于回答医疗健康相关问题，提供症状分析、治疗建议
 */
export const medicalChatTool = new DynamicStructuredTool({
  name: "medical_chat",
  description: "用于回答医疗健康相关问题，提供症状分析、治疗建议、健康指导等专业医疗建议。",
  schema: z.object({
    query: z.string().describe("用户的医疗健康问题")
  }),
  func: async ({ query }) => {
    try {
      console.log("🏥 执行医疗对话:", query);

      const systemPrompt = `你是一位专业的医疗助手，具备丰富的医学知识。
        请遵循以下原则：
        1. 提供专业、准确的医疗建议
        2. 对于严重症状，建议及时就医
        3. 使用通俗易懂的语言解释医学概念
        4. 不要给出具体的药物剂量建议
        5. 强调建议仅供参考，不能替代专业医生诊断`;

      const response = await defaultLLM.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ]);

      return response.content;

    } catch (error) {
      console.error("❌ 医疗对话失败:", error);
      return `抱歉，医疗对话处理失败: ${error.message}`;
    }
  }
});
