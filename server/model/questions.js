import prisma from "../prisma/index.js";

// 初始化查询
export const getQuestionsModel = async (skip,pagenum, pagesize) => {
  try {
    const [data, total] = await Promise.all([
      prisma.question.findMany({
        select: {
          id: true,
          title: true,
          content: true,
          questionType: true,
          language: true, 
          options: true,
          answer: true,
          createdTime: true,
        },
        skip,
        take: pagesize,
        orderBy: {
          createdTime: "desc",
        },
      }),
      prisma.question.count()
    ]);
    
    return {
      data,
      page:{
        total,
        pagenum,
        pagesize
      }
    };
  } catch (err) {
    throw err;
  }
}

// 查询问题列表
export const getSearchQuestionsModel = async (title, questionType, skip,pagenum,pagesize) => {
  try {
    const where = {
      AND: [
        { title: { contains: title } },
        questionType && questionType !== 'ALL' 
          ? { questionType } 
          : {}
      ]
    };

    const [data, total] = await Promise.all([
      prisma.question.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          questionType: true,
          language: true, 
          options: true,
          answer: true,
          createdTime: true,
        },
        skip,
        take: pagesize,
        orderBy: {
          createdTime: "desc",
        },
      }),
      prisma.question.count({ where })
    ]);

    return {
      data,
      data,
      page:{
        total,
        pagenum,
        pagesize
      }
    };
  } catch (err) {
    throw err;
  }
};

// 发布问题
export const postQuestionsModel = async (title, content, questionType, options, answer, language) => {
  try {
    // 校验题目类型
    const validTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'PROGRAMMING'];
    if (!validTypes.includes(questionType)) {
      throw new Error('Invalid questionType');
    }

    // 校验选项格式
    let processedOptions = options;
    if (questionType !== 'PROGRAMMING') {
      processedOptions = options.split('。').filter(o => o.trim());
      if (processedOptions.length !== 4) {
        throw new Error('Options must contain exactly 4 elements separated by periods');
      }
    }

    // 校验答案格式
    let processedAnswer;
    switch (questionType) {
      case 'SINGLE_CHOICE':
        processedAnswer = answer.trim().toUpperCase();
        break;
      case 'MULTIPLE_CHOICE':
        // 处理句号分割的答案字符串
        processedAnswer = answer.toUpperCase().split('。').filter(c => ['A','B','C','D'].includes(c));
        if (processedAnswer.length < 1) {
          throw new Error('多选题必须包含至少一个有效选项（A-D）');
        }
        break;
      case 'PROGRAMMING':
        processedAnswer = answer;
        break;
    }

    return await prisma.question.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        language: language,
        questionType,
        options: questionType !== 'PROGRAMMING' ? processedOptions : null,
        answer: processedAnswer,
      },
    });
  } catch (err) {
    throw err;
  }
};

// 删除问题
export const deleteQuestionModel = async (ids) => {
  try {
    const idNumbers = ids.map(id => Number(id)).filter(id => !isNaN(id));
    
    if (idNumbers.length === 0) {
      throw new Error('无效的题目ID格式');
    }

    return await prisma.question.deleteMany({
      where: {
        id: { in: idNumbers }
      }
    });
  } catch (err) {
    throw err;
  }
}