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
    query: z.string().describe("用户的医疗健康问题"),
    context: z.string().optional().describe("来自知识库的参考资料（如有）"),
    history: z.string().optional().describe("会话历史记录（如有）")
  }),
  func: async ({ query, context, history }) => {
    try {
      console.log("🏥 执行医疗对话:", query);

      let systemPrompt = `你是 HealthConsole 智能医疗系统的医疗助手，具备丰富的医学知识。

请遵循以下原则：
1. 提供专业、准确的医疗建议
2. 对于严重症状，建议及时就医
3. 使用通俗易懂的语言解释医学概念
4. 不要给出具体的药物剂量建议
5. 强调建议仅供参考，不能替代专业医生诊断
6. 支持 Markdown 格式输出（表格、列表、加粗等）`;

      let userContent = query;

      // 如果有知识库上下文，使用RAG提示词
      if (context) {
        systemPrompt += `\n\n你是基于参考资料回答的专业助手。请优先使用参考资料中的信息回答问题。如果参考资料不足以回答，可以补充通用医学知识。引用时请标注来源编号。`;
        userContent = `${context}\n\n用户问题：${query}`;
      }

      // 如果有会话历史，注入到对话中
      const messages = [{ role: "system", content: systemPrompt }];
      if (history) {
        messages.push({ role: "user", content: `[会话历史]\n${history}` });
        messages.push({ role: "assistant", content: "好的，我已了解之前的对话内容。请继续。" });
      }
      messages.push({ role: "user", content: userContent });

      const response = await defaultLLM.invoke(messages);

      return response.content;

    } catch (error) {
      console.error("❌ 医疗对话失败:", error);
      return `抱歉，医疗对话处理失败: ${error.message}`;
    }
  }
});
