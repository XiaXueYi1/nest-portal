# Auth 模块说明

## 目标

提供应用内统一认证能力：登录、续签、状态检查、登出、一键下线。

## 核心设计

- 技术栈：`@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`
- 凭证形态：access + refresh 双 token（HttpOnly Cookie）
- 会话管理：Stateless JWT（无服务端会话存储）
- 鉴权方式：全局 `AccessTokenGuard`，公开接口使用 `@Public()`

## 接口

- `POST /auth/login`
  - 校验账号密码
  - 下发双 token cookie
  - 返回：`accessExpiresIn`、`refreshExpiresIn`
- `POST /auth/refresh`
  - 使用 refresh token 续签
  - 重发双 token
- `GET /auth/status`
  - 前端判断是否已登录
  - 当 access token 剩余时间小于阈值（默认 300 秒）时自动续签
- `POST /auth/logout`
  - 清除客户端 Cookie（已签发的 JWT 在过期前仍有效）
- `POST /auth/logout-all`
  - 清除客户端 Cookie（stateless 限制：无法撤销已签发的 JWT）

## 安全策略

- Access/Refresh 使用不同密钥与过期时间
- JWT 校验 `iss`、`aud`、签名、过期时间
- Cookie 使用 `HttpOnly`，生产环境启用 `Secure`
- 所有认证相关响应统一 `Cache-Control: no-store`
