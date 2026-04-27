import prisma from '../prisma/index.js';

/**
 * 创建新用户
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>} - 创建的用户对象
 */
export async function createUser(userData) {
  try {
    const user = await prisma.aiUser.create({
      data: {
        userId: userData.userId,
        userName: userData.userName
      }
    });

    return {
      success: true,
      data: user
    };

  } catch (error) {
    console.error('❌ 用户创建失败:', error);

    if (error.code === 'P2002') {
      return {
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: '用户ID已存在'
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    };
  }
}

/**
 * 根据用户ID查找用户
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 用户对象
 */
export async function findUserById(userId) {
  try {
    const user = await prisma.aiUser.findUnique({
      where: { userId }
    });

    if (user) {
      return {
        success: true,
        data: user
      };
    } else {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      };
    }

  } catch (error) {
    console.error('❌ 用户查找失败:', error);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    };
  }
}

/**
 * 更新用户最后活跃时间
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 更新结果
 */
export async function updateLastActiveTime(userId) {
  try {
    const user = await prisma.aiUser.update({
      where: { userId },
      data: { updatedAt: new Date() }
    });

    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('❌ 更新活跃时间失败:', error);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    };
  }
}
