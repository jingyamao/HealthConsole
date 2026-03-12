import prisma from '../prisma/index.js';

/**
 * 用户模型 - 处理用户相关的数据库操作
 */
class UserModel {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} - 创建的用户对象
   */
  async createUser(userData) {
    try {
      const user = await this.prisma.user.create({
        data: {
          userId: userData.userId,
          userName: userData.userName,
          loginTime: new Date(),
          lastActiveTime: new Date(),
          status: 'active'
        }
      });
      
      console.log('✅ 用户创建成功:', user);
      return {
        success: true,
        data: user
      };
      
    } catch (error) {
      console.error('❌ 用户创建失败:', error);
      
      // 处理唯一约束冲突
      if (error.code === 'P2002') {
        return {
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: '用户ID已存在',
            field: error.meta?.target
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '数据库操作失败',
          details: error.message
        }
      };
    }
  }

  /**
   * 根据用户ID查找用户
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 用户对象
   */
  async findUserById(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { userId }
      });
      
      if (user) {
        console.log('✅ 用户查找成功:', user);
        return {
          success: true,
          data: user
        };
      } else {
        console.log('⚠️ 用户不存在:', userId);
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
          message: '数据库查询失败',
          details: error.message
        }
      };
    }
  }

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 更新后的用户对象
   */
  async updateUser(userId, updateData) {
    try {
      const user = await this.prisma.user.update({
        where: { userId },
        data: {
          userName: updateData.userName,
          lastActiveTime: new Date()
        }
      });
      
      console.log('✅ 用户更新成功:', user);
      return {
        success: true,
        data: user
      };
      
    } catch (error) {
      console.error('❌ 用户更新失败:', error);
      
      if (error.code === 'P2025') {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '数据库更新失败',
          details: error.message
        }
      };
    }
  }

  /**
   * 更新用户最后活跃时间
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 更新结果
   */
  async updateLastActiveTime(userId) {
    try {
      const user = await this.prisma.user.update({
        where: { userId },
        data: {
          lastActiveTime: new Date()
        }
      });
      
      console.log('✅ 用户活跃时间更新成功:', user);
      return {
        success: true,
        data: user
      };
      
    } catch (error) {
      console.error('❌ 用户活跃时间更新失败:', error);
      
      if (error.code === 'P2025') {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '数据库更新失败',
          details: error.message
        }
      };
    }
  }
  /**
   * 删除用户
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteUser(userId) {
    try {
      await this.prisma.user.delete({
        where: { userId }
      });
      
      console.log('✅ 用户删除成功:', userId);
      return {
        success: true,
        data: { message: '用户删除成功' }
      };
      
    } catch (error) {
      console.error('❌ 用户删除失败:', error);
      
      if (error.code === 'P2025') {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '数据库删除失败',
          details: error.message
        }
      };
    }
  }

  /**
   * 获取所有用户列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 用户列表
   */
  async getAllUsers(options = {}) {
    try {
      const { limit = 50, offset = 0, status = 'all' } = options;
      
      const where = status !== 'all' ? { status } : {};
      
      const users = await this.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          lastActiveTime: 'desc'
        }
      });
      
      console.log('✅ 用户列表获取成功，共', users.length, '个用户');
      return {
        success: true,
        data: users
      };
      
    } catch (error) {
      console.error('❌ 用户列表获取失败:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '数据库查询失败',
          details: error.message
        }
      };
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} - 统计信息
   */
  async getUserStats() {
    try {
      const totalUsers = await this.prisma.user.count();
      const activeUsers = await this.prisma.user.count({
        where: { status: 'active' }
      });
      
      const recentUsers = await this.prisma.user.count({
        where: {
          lastActiveTime: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
          }
        }
      });
      
      console.log('✅ 用户统计获取成功');
      return {
        success: true,
        data: {
          totalUsers,
          activeUsers,
          recentUsers,
          inactiveUsers: totalUsers - activeUsers
        }
      };
      
    } catch (error) {
      console.error('❌ 用户统计获取失败:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '数据库查询失败',
          details: error.message
        }
      };
    }
  }
}

export default UserModel;
