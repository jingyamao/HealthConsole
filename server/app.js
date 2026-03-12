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
  maxAge: 86400000, // 1天
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
  secure: false, // 开发环境设置为false，生产环境建议设置为true
  sameSite: 'lax',
};

app.keys = ['health-console-secret-key-2024']; // 应该从环境变量读取

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
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在'
    }
  };
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 HealthConsole Server is running on http://127.0.0.1:${PORT}`);
  console.log('📋 可用API端点:');
  console.log('  - POST /api/user/login - 用户登录');
  console.log('  - POST /api/ai/chat - AI智能对话');
  console.log('  - GET /api/health - 健康检查');
  console.log('  - GET /api/info - API信息');
});