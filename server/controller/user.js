import UserModel from "../model/user.js";

const userModel = new UserModel();

/**
 * 用户登录
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function login(ctx) {
  try {
    const { userId, userName } = ctx.request.body;

    // 参数验证
    if (!userId || typeof userId !== 'string') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: '用户ID不能为空且必须是字符串'
        }
      };
      return;
    }

    if (!userName || typeof userName !== 'string') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_USER_NAME',
          message: '用户名不能为空且必须是字符串'
        }
      };
      return;
    }

    // 验证用户ID格式
    if (userId.length < 3 || userId.length > 50) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_USER_ID_LENGTH',
          message: '用户ID长度必须在3-50个字符之间'
        }
      };
      return;
    }

    // 验证用户名格式
    if (userName.length < 2 || userName.length > 100) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_USER_NAME_LENGTH',
          message: '用户名长度必须在2-100个字符之间'
        }
      };
      return;
    }

    console.log('🔑 用户登录请求:', { userId, userName });

    // 检查用户是否已存在
    const existingUser = await userModel.findUserById(userId);

    let user;
    let isNewUser = false;

    if (existingUser.success && existingUser.data) {
      // 用户已存在，更新最后活跃时间
      const updateResult = await userModel.updateLastActiveTime(userId);
      if (!updateResult.success) {
        console.warn('⚠️ 更新用户活跃时间失败:', updateResult.error);
      }
      user = existingUser.data;
      console.log('✅ 用户登录成功（已存在用户）:', user);
    } else {
      // 用户不存在，创建新用户
      const createResult = await userModel.createUser({
        userId,
        userName
      });

      if (!createResult.success) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          error: {
            code: 'USER_CREATION_FAILED',
            message: '用户创建失败',
            details: createResult.error
          }
        };
        return;
      }

      user = createResult.data;
      isNewUser = true;
      console.log('✅ 新用户创建成功:', user);
    }

    // 设置会话信息
    ctx.session = ctx.session || {};
    ctx.session.userId = user.userId;
    ctx.session.userName = user.userName;
    ctx.session.loginTime = new Date().toISOString();
    ctx.session.isNewUser = isNewUser;

    // 返回成功响应
    ctx.body = {
      success: true,
      data: {
        message: isNewUser ? '注册并登录成功' : '登录成功',
        user: {
          userId: user.userId,
          userName: user.userName,
          loginTime: user.loginTime,
          lastActiveTime: user.lastActiveTime,
          status: user.status
        },
        session: {
          userId: ctx.session.userId,
          userName: ctx.session.userName,
          loginTime: ctx.session.loginTime,
          isNewUser: isNewUser
        },
        metadata: {
          isNewUser: isNewUser,
          timestamp: new Date().toISOString()
        }
      }
    };

  } catch (error) {
    console.error('❌ 用户登录错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误',
        details: error.message
      }
    };
  }
}

/**
 * 用户登出
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function logout(ctx) {
  try {
    const userId = ctx.session?.userId;

    console.log('🚪 用户登出请求:', userId);

    // 清除会话
    if (ctx.session) {
      ctx.session = null;
    }

    ctx.body = {
      success: true,
      data: {
        message: '登出成功',
        userId: userId,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ 用户登出错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误',
        details: error.message
      }
    };
  }
}
