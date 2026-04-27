import 'dotenv/config';
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import koaStatic from "koa-static";
import session from "koa-session";
import cors from "@koa/cors";
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

// CORS 中间件
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

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

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 HealthConsole Server running on http://127.0.0.1:${PORT}`);
});
