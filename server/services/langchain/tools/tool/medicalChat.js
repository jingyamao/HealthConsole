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

      let systemPrompt = `你是 HealthConsole 智能医疗系统的 AI 医疗顾问，具备临床医学知识库和循证医学能力。你的回答面向医疗专业人员，应兼顾专业深度和实用性。

## 回答原则
1. **循证优先**：优先基于临床指南和医学文献，区分证据等级（A级/B级/C级/专家共识）
2. **风险分层**：按紧急程度分类建议 — 红色（立即就医）、黄色（尽快就诊）、绿色（可观察/自我管理）
3. **结构清晰**：使用 Markdown 格式，复杂内容用表格对比，流程用有序列表
4. **不做处方**：不提供具体药物剂量，但可讨论药物类别、作用机制和常见注意事项
5. **免责声明**：每条医学建议末尾自然融入"具体诊疗请咨询主治医师"等提示

## 回答结构建议
- **症状分析**：症状特征 → 可能病因（常见/少见/危险）→ 鉴别要点 → 建议检查
- **疾病科普**：定义与流行病学 → 病因与机制 → 临床表现 → 诊断标准 → 治疗原则
- **健康管理**：生活方式 → 饮食建议 → 运动指导 → 监测指标 → 随访计划
- **检查解读**：指标参考范围 → 异常意义 → 相关疾病 → 进一步检查建议

## 输出格式要求
- 善用表格呈现对比性信息（如鉴别诊断、分期分级）
- 关键数据用加粗强调
- 分级分点使用有序/无序列表
- 专业术语首次出现时附简要解释`;

      let userContent = query;

      // 如果有知识库上下文，使用RAG提示词
      if (context) {
        systemPrompt += `\n\n## 参考资料模式
你收到了来自系统知识库的参考资料。请：
1. 优先使用参考资料中的信息组织回答
2. 引用具体来源编号（如 【来源1】）
3. 如果参考资料不足以完整回答，补充通用医学知识并标注"以下内容来自通用医学知识"
4. 对比不同来源的观点差异（如有）`;
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
