import prisma from '../prisma/index.js';

export async function list({ page = 1, pageSize = 20, keyword = '', category = '' }) {
  try {
    const where = {};
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } }
      ];
    }
    if (category) {
      where.category = category;
    }

    const [documents, total] = await Promise.all([
      prisma.knowledgeDocument.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, source: true, category: true,
          tags: true, isActive: true, publishDate: true,
          createdAt: true, updatedAt: true
        }
      }),
      prisma.knowledgeDocument.count({ where })
    ]);

    return {
      success: true,
      data: {
        documents,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
      }
    };
  } catch (error) {
    console.error('❌ 获取知识库列表失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const doc = await prisma.knowledgeDocument.findUnique({
      where: { id: parseInt(id) },
      include: { vectorStores: { select: { id: true, title: true, createdAt: true } } }
    });
    if (!doc) {
      return { success: false, error: { code: 'NOT_FOUND', message: '文档不存在' } };
    }
    return { success: true, data: doc };
  } catch (error) {
    console.error('❌ 获取知识库文档失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(data) {
  try {
    const doc = await prisma.knowledgeDocument.create({
      data: {
        title: data.title,
        content: data.content || '',
        source: data.source || null,
        version: data.version || null,
        tags: data.tags || [],
        category: data.category || null,
        publishDate: data.publishDate ? new Date(data.publishDate) : null,
        metadata: data.metadata || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
    return { success: true, data: doc };
  } catch (error) {
    console.error('❌ 创建知识库文档失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const doc = await prisma.knowledgeDocument.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.version !== undefined && { version: data.version }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.publishDate !== undefined && { publishDate: data.publishDate ? new Date(data.publishDate) : null }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    });
    return { success: true, data: doc };
  } catch (error) {
    console.error('❌ 更新知识库文档失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.knowledgeDocument.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '文档删除成功' } };
  } catch (error) {
    console.error('❌ 删除知识库文档失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getStats() {
  try {
    const [total, active, categories, tagRecords] = await Promise.all([
      prisma.knowledgeDocument.count(),
      prisma.knowledgeDocument.count({ where: { isActive: true } }),
      prisma.knowledgeDocument.groupBy({ by: ['category'], _count: { id: true } }),
      prisma.knowledgeDocument.findMany({ select: { tags: true } })
    ]);

    const tagCounts = {};
    tagRecords.forEach(r => {
      (r.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });

    return {
      success: true,
      data: {
        total, active, inactive: total - active,
        categories: categories.filter(c => c.category).map(c => ({ name: c.category, count: c._count.id })),
        topTags: Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([name, count]) => ({ name, count }))
      }
    };
  } catch (error) {
    console.error('❌ 获取知识库统计失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
