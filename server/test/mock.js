import Mock from "mockjs";
import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

// 生成测试题目
const questions = Array.from({ length: 100 }, () => {
  const type = Mock.Random.pick(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'PROGRAMMING']);
  // 新增语言类型（70%中文，30%英文）
  const language = Mock.Random.pick(['js', 'js', 'js', 'go']); 
  
  // 根据语言生成不同选项
  const options = type === 'PROGRAMMING' ? null : [
    language === 'js' || language === 'go' 
      ? Mock.Random.csentence(5, 10) 
      : Mock.Random.sentence(3, 5),
    Mock.Random.csentence(5, 10),
    Mock.Random.csentence(5, 10),
    Mock.Random.csentence(5, 10)
  ];

  return {
    title: `${Mock.Random.ctitle(5, 8)}题`,
    content: Mock.Random.cparagraph(),
    questionType: type,
    language,  // 新增语言字段
    options: type !== 'PROGRAMMING' ? options : null,
    answer: (() => {
      if (type === 'SINGLE_CHOICE') {
        return Mock.Random.pick(['A', 'B', 'C', 'D']);
      }
      if (type === 'MULTIPLE_CHOICE') {
        // 直接返回数组格式
        return Mock.Random.pick([['A','B'], ['A','C'], ['B','D']]);
      }
      return Mock.Random.string(10, 50);
    })()
  };
});

async function init() {
  // 清空现有数据
  await prisma.$transaction([
    // prisma.user.deleteMany(),
    prisma.question.deleteMany()
  ]);

  // 插入测试数据
  // await prisma.user.createMany({ data: users });
  await prisma.question.createMany({ data: questions });
}

init();
