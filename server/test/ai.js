import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.ALI_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export async function generateAIQuestions({ 
  language, 
  questionType, 
  count 
}) {
  // 参数校验
  if (!['js', 'go'].includes(language)) {
    throw new Error('仅支持 js 和 go 语言类型');
  }
  if (count < 1 || count > 10) {
    throw new Error('题目数量需在1-10之间');
  }

  // 构造提示词
  const questionTypeMap = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    PROGRAMMING: '编程题'
  };

  const systemPrompt = `你是一个严格的技术面试题生成器，请遵守以下规则生成题目：
  1. 仅输出严格符合要求的JSON数组，不要包含任何注释、解释或其他文本
  2. 语言：${language.toUpperCase()}
  3. 类型：${questionTypeMap[questionType]}
  4. 数量：${count}道
  5. 格式要求：
    ${questionType === 'PROGRAMMING' ? 
    '- answer字段必须包含完整代码' : 
    '- options必须只包含4个选项，answer为正确选项字母'}
  6. 必须包含字段：title, content,${questionType !== 'PROGRAMMING' ? ', options' : ''}, answer, language
  7. 输出示例：
  ${JSON.stringify({
    title: "异步编程与Promise链的理解",
    content: "问题描述...",
    ...(questionType !== 'PROGRAMMING' && { 
      options: ["选项A内容", "选项B内容", "选项C内容", "选项D内容"] 
    }),
    questionType: questionType,
    answer: questionType === 'PROGRAMMING' ? 
      "function solution() { ... }" : ['A','B','...'],
    language
  }, null, 2)}
  8. 特别注意：
    - JSON键名必须使用双引号
    - 禁止在JSON外添加任何内容
    - 字符串值必须使用双引号
    - 代码块内容必须转义双引号并且需要包含合适的缩进符号和换行符号
    - 多选题的答案必须包含两个以上的选项
    - options字段每个选项内容无需以ABCD开头,每个选项中不要出现中文句号
    - 编程题的answer字段必须包含完整代码
    - 单选题和多选题的options字段只允许包含4个选项
    `;

  try {
    const completion = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请生成符合要求的题目" }
      ],
    });

    const result = completion.choices[0].message.content;
    
    // 解析并验证结果
    let questions; // 提升变量作用域
    try {
      questions = JSON.parse(result);
      
      questions.forEach((q, index) => {
        if (!q.title) throw new Error(`第${index + 1}题缺少标题`);
        if (!q.content) throw new Error(`第${index + 1}题缺少内容描述`);
        if (questionType === 'PROGRAMMING') {
          if (q.options) throw new Error('编程题不应包含选项');
          if (!q.content) throw new Error('编程题必须包含内容描述');
        } else {
          if (!q.options || q.options.length !== 4) {
            throw new Error('选择题必须包含4个选项');
          }
        }
        if (!q.answer) throw new Error(`第${index + 1}题缺少答案`);
      });
    } catch (error) {
      console.error(`解析失败: ${error.message}，原始响应：${result}`);
      throw error;
    }

    return questions; // 正确返回已解析的questions
  } catch (error) {
    console.error(`AI生成失败: ${error.message}`);
    throw new Error('题目生成失败，请检查提示词或API配置');
  }
}

// 使用示例
// generateAIQuestions({
//   language: 'js',
//   questionType: 'PROGRAMMING',
//   count: 2
// }).then(console.log);
// 使用示例
// generateAIQuestions({
//   language: 'js',
//   questionType: 'MULTIPLE_CHOICE',
//   count: 2
// }).then(console.log);
