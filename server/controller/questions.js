import { getQuestionsModel, getSearchQuestionsModel, postQuestionsModel,deleteQuestionModel } from "../model/index.js";
import prisma from "../prisma/index.js";
import { generateAIQuestions } from "../test/ai.js";

// 获取问题列表
export const getQuestions = async (ctx) => {
  const query = ctx.query;
  const pagenum = Math.abs(Number(query.pagenum)) || 1;
  const pagesize = Math.abs(Number(query.pagesize)) || 10;
  const skip = (pagenum - 1) * pagesize;
  try {
    const questions = await getQuestionsModel(skip, pagenum,pagesize);
    ctx.body = {
      code: 200,
      message: "success",
      data: questions,
    };
  }catch (err) {
    ctx.body = {
      code: 500,
      message: err.message,
    };
  }
}

// 获取搜索问题列表
export const getSearchQuestions = async (ctx) => {
  const query = ctx.query;
  const title = query.title || "";
  const questionType = query.questionType || "";
  const pagenum = Math.abs(Number(query.pagenum)) || 1;
  const pagesize = Math.abs(Number(query.pagesize)) || 10;
  const skip = (pagenum - 1) * pagesize;
  try {
    const questions = await getSearchQuestionsModel(title,questionType, skip,pagenum, pagesize);
    ctx.body = {
      code: 200,
      message: "success",
      data: questions,
    };
  }catch (err) {
    ctx.body = {
      code: 500,
      message: err.message,
    };
  }
}

// 发布问题
export const postQuestions = async (ctx) => {
  const { id, title, content, questionType, options, answer, language } = ctx.request.body;
  
  try {
    let question;
    if (id) {
      // 更新现有题目
      question = await prisma.question.update({
        where: { id: Number(id) },
        data: {
          title: title.trim(),
          content: content.trim(),
          questionType,
          language,
          options: (() => {
            if (questionType === 'PROGRAMMING') return null;
            const optionsArr = options.split('。').filter(o => o.trim());
            if (optionsArr.length !== 4) {
              throw new Error('选项必须包含4个有效内容（用句号分隔）');
            }
            return optionsArr;
          })(),
          answer: (() => {
            switch (questionType) {
              case 'SINGLE_CHOICE':
                return answer.trim().toUpperCase();
              case 'MULTIPLE_CHOICE':
                const answers = answer.toUpperCase().split('。')
                  .filter(c => ['A','B','C','D'].includes(c));
                if (answers.length < 1) {
                  throw new Error('多选题答案必须包含至少一个有效选项');
                }
                return answers;
              case 'PROGRAMMING':
                return answer;
            }
          })()
        }
      });
    } else {
      // 创建新题目
      question = await postQuestionsModel(title, content, questionType, options, answer, language);
    }

    ctx.body = {
      code: 200,
      message: "success",
      data: question,
    };
  } catch (err) {
    const statusCode = err.message.includes('Record not found') ? 404 : 500;
    ctx.body = {
      code: statusCode,
      message: err.message,
    };
  }
}

// 发布问题列表
export const postQuestionsList = async (ctx) => {
  const questions = ctx.request.body;
  console.log(ctx.request.body)

  try {
    const createdQuestions = await Promise.all(questions.map(async (question) => {
      const { title, content, questionType, options, answer, language } = question;
      return await postQuestionsModel(title, content, questionType, options, answer, language);
    }))
    ctx.body = {
      code: 200,
      message: "success",
      data: createdQuestions,
    }
  }catch (err) {
    ctx.body = {
      code: 500,
      message: err.message,
    };
  }
}

// 删除问题
export const deleteQuestion = async (ctx) => {
  try {
    // 从URL参数中获取编码后的字符串
    const encodedIds = ctx.query.ids;
    if (!encodedIds) {
      ctx.body = { code: 400, message: "缺少题目ID参数" };
      return;
    }
    
    // 解码并分割ID
    const decodedIds = decodeURIComponent(encodedIds);
    const ids = decodedIds.split('&'); // 分割符为&

    const result = await deleteQuestionModel(ids);
    ctx.body = {
      code: 200,
      message: "success",
      data: {
        count: result.count
      }
    };
  } catch (err) {
    ctx.body = {
      code: 500,
      message: err.message,
    };
  }
}

// 生成AI问题
export const generateAI = async (ctx) => {
  const { language, questionType, count } = ctx.request.body;
  try {
    const questions = await generateAIQuestions({ language, questionType, count });
    ctx.body = {
      code: 200,
      message: "success",
      data: questions,
    };
  }catch (err) {
    ctx.body = {
      code: 500,
      message: err.message,
    };
  }
}
