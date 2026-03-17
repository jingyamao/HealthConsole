import pkg from '../generated/prisma/index.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

/**
 * 创建新的对话会话
 * @param {string} userId - 用户ID
 * @param {string} title - 会话标题
 * @returns {Promise<Object>} - 创建的会话
 */
export async function createConversation(userId, title = null) {
  try {
    // 先查找或创建 AiUser
    let aiUser = await prisma.aiUser.findUnique({
      where: { userId }
    });

    if (!aiUser) {
      aiUser = await prisma.aiUser.create({
        data: { userId, userName: `用户${userId}` }
      });
    }

    // 生成默认标题
    const conversationTitle = title || `新对话 ${new Date().toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    const conversation = await prisma.conversation.create({
      data: {
        userId: aiUser.id,
        title: conversationTitle,
        status: 'active'
      }
    });

    console.log('✅ 创建会话成功:', conversation.id, conversation.title);

    return {
      success: true,
      data: conversation
    };
  } catch (error) {
    console.error('❌ 创建会话失败:', error);
    return {
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message }
    };
  }
}

/**
 * 保存聊天消息
 * @param {string} conversationId - 会话ID
 * @param {string} userId - 用户ID
 * @param {string} role - 角色 (user/assistant)
 * @param {string} content - 消息内容
 * @returns {Promise<Object>} - 保存的消息
 */
export async function saveMessage(conversationId, userId, role, content) {
  try {
    // 确保会话存在
    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    // 如果会话不存在，创建新会话
    if (!conversation) {
      const createResult = await createConversation(userId);
      if (!createResult.success) {
        return createResult;
      }
      conversation = createResult.data;
    }

    // 创建消息
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role,
        content
      }
    });

    // 更新会话的更新时间
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return {
      success: true,
      data: message
    };
  } catch (error) {
    console.error('❌ 保存消息失败:', error);
    return {
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message }
    };
  }
}

/**
 * 获取会话的聊天记录
 * @param {string} conversationId - 会话ID
 * @returns {Promise<Array>} - 消息列表
 */
export async function getChatHistory(conversationId) {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
      }
    });

    return messages;
  } catch (error) {
    console.error('❌ 获取聊天记录失败:', error);
    return [];
  }
}

/**
 * 根据ID获取会话信息
 * @param {string} conversationId - 会话ID
 * @returns {Promise<Object|null>} - 会话信息
 */
export async function getConversationById(conversationId) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return conversation;
  } catch (error) {
    console.error('❌ 获取会话信息失败:', error);
    return null;
  }
}

/**
 * 获取用户的所有会话
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} - 会话列表
 */
export async function getUserConversations(userId) {
  try {
    const aiUser = await prisma.aiUser.findUnique({
      where: { userId },
      include: {
        conversations: {
          where: { status: 'active' },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { messages: true }
            }
          }
        }
      }
    });

    if (!aiUser) {
      return [];
    }

    // 格式化返回数据
    return aiUser.conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      status: conv.status,
      messageCount: conv._count.messages,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

  } catch (error) {
    console.error('❌ 获取用户会话失败:', error);
    return [];
  }
}

/**
 * 删除会话
 * @param {string} conversationId - 会话ID
 * @returns {Promise<Object>} - 删除结果
 */
export async function deleteConversation(conversationId) {
  try {
    // 将会话状态改为 archived，而不是真正删除
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'archived' }
    });

    console.log('✅ 会话已归档:', conversationId);

    return {
      success: true,
      data: { message: '会话删除成功' }
    };
  } catch (error) {
    console.error('❌ 删除会话失败:', error);
    return {
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message }
    };
  }
}

/**
 * 更新会话标题
 * @param {string} conversationId - 会话ID
 * @param {string} title - 新标题
 * @returns {Promise<Object>} - 更新结果
 */
export async function updateConversationTitle(conversationId, title) {
  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title }
    });

    console.log('✅ 更新会话标题成功:', conversationId, title);

    return {
      success: true,
      data: conversation
    };
  } catch (error) {
    console.error('❌ 更新会话标题失败:', error);
    return {
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message }
    };
  }
}

/**
 * 获取会话详情
 * @param {string} conversationId - 会话ID
 * @returns {Promise<Object>} - 会话详情
 */
export async function getConversationDetail(conversationId) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true
          }
        }
      }
    });

    if (!conversation) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '会话不存在' }
      };
    }

    return {
      success: true,
      data: conversation
    };
  } catch (error) {
    console.error('❌ 获取会话详情失败:', error);
    return {
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message }
    };
  }
}
