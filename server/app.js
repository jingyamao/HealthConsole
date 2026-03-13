import 'dotenv/config';
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import koaStatic from "koa-static";
import session from "koa-session";
import router from "./router/index.js";
import { errorHandler } from "./middleware/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = new Koa();

// 会话配置
const sessionConfig = {
  key: 'health-console-session',
  maxAge: 86400000,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
  secure: false,
  sameSite: 'lax',
};

app.keys = [process.env.SESSION_SECRET || 'health-console-secret-key'];

process.on("uncaughtException", (err, origin) => {
  console.log(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
});

// 使用会话中间件
app.use(session(sessionConfig, app));

// 静态文件服务
app.use(koaStatic(join(__dirname, "../client/dist")));

// 解析请求体
app.use(bodyParser());

// 错误处理中间件
app.use(errorHandler());

// 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 404处理
app.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = {
    success: false,
    error: { code: 'NOT_FOUND', message: '请求的资源不存在' }
  };
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`\n🚀 HealthConsole Server is running on http://127.0.0.1:${PORT}\n`);

  console.log('📋 API 路由列表:');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 用户认证相关
  console.log('🔐 用户认证接口');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  POST   /api/user/login              用户登录');
  console.log('  POST   /api/user/logout             用户登出');
  console.log('');

  // AI 对话相关
  console.log('🤖 AI 对话接口');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  POST   /api/ai/chat                 AI 聊天（在现有会话中对话）');
  console.log('  POST   /api/ai/conversations        创建新会话');
  console.log('  GET    /api/ai/conversations/:userId  获取用户的所有会话');
  console.log('  GET    /api/ai/chat-history/:sessionId 获取会话的聊天记录');
  console.log('  PUT    /api/ai/conversations/:sessionId/title  更新会话标题');
  console.log('  DELETE /api/ai/conversations/:sessionId        删除会话');
  console.log('');

  // 系统相关
  console.log('🔧 系统接口');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  GET    /api/health                  健康检查');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('💡 使用示例:');
  console.log('  1. 用户登录: POST /api/user/login { userId, userName }');
  console.log('  2. 创建会话: POST /api/ai/conversations { userId, title }');
  console.log('  3. AI 对话: POST /api/ai/chat { message, sessionId, userId }');
  console.log('  4. 查看历史: GET /api/ai/chat-history/:sessionId');
  console.log('');
});
