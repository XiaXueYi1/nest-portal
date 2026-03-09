# User 模块说明

## 目标

提供用户基础 CRUD（增删改查），采用软删除策略。

## 接口

- `POST /user/create`：创建用户
- `GET /user/list`：查询用户列表（未删除）
- `GET /user/:id`：查询单个用户
- `PATCH /user/:id`：更新用户
- `DELETE /user/:id`：软删除用户

## 规则

- `username` 与 `email` 唯一
- `password` 仅接收明文入参，服务端会加密后存储
- 所有用户返回对象（VO）不包含 `password`
- 默认不返回已软删除用户（`deletedAt != null`）
- 删除操作仅更新 `deletedAt`
