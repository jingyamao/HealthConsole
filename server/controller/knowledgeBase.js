import * as kbModel from '../model/knowledgeBase.js';

export async function list(ctx) {
  try {
    const { page = 1, pageSize = 20, keyword = '', category = '' } = ctx.query;
    const result = await kbModel.list({
      page: parseInt(page), pageSize: parseInt(pageSize), keyword, category
    });
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取知识库列表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function detail(ctx) {
  try {
    const { id } = ctx.params;
    const result = await kbModel.getById(id);
    ctx.status = result.success ? 200 : (result.error.code === 'NOT_FOUND' ? 404 : 500);
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取知识库详情错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function create(ctx) {
  try {
    const data = ctx.request.body;
    if (!data.title) {
      ctx.status = 400;
      ctx.body = { success: false, error: { code: 'MISSING_TITLE', message: '文档标题不能为空' } };
      return;
    }
    const result = await kbModel.create(data);
    ctx.status = result.success ? 201 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 创建知识库文档错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function update(ctx) {
  try {
    const { id } = ctx.params;
    const data = ctx.request.body;
    const result = await kbModel.update(id, data);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 更新知识库文档错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function remove(ctx) {
  try {
    const { id } = ctx.params;
    const result = await kbModel.remove(id);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 删除知识库文档错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function stats(ctx) {
  try {
    const result = await kbModel.getStats();
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取知识库统计错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}
