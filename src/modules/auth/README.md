# Auth 模块说明

## 目标

提供应用内统一认证能力：登录、状态检查、登出。

## 核心设计

- 技术栈：`@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`
- 凭证形态：单一 JWT token（HttpOnly Cookie）
- 会话管理：Stateless JWT（无服务端会话存储）
- 鉴权方式：全局 `AccessTokenGuard`，公开接口使用 `@Public()`

## 接口

- `POST /auth/login`
  - 校验账号密码
  - 下发 token cookie（默认 30 分钟过期）
  - 返回：`expiresIn`
- `GET /auth/status`
  - 前端判断是否已登录
  - 返回：`authenticated`、`username`
- `POST /auth/logout`
  - 清除客户端 Cookie

## 安全策略

- JWT 校验 `iss`、`aud`、签名、过期时间
- Cookie 使用 `HttpOnly`，生产环境启用 `Secure`
- 所有认证相关响应统一 `Cache-Control: no-store`
