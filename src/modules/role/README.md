# Role 模块说明

## 目标

- 提供角色 CRUD 与分页查询
- 支持角色权限绑定
- 支持用户角色关系管理

## 接口

- `POST /role/create`：创建角色
- `GET /role/list`：分页查询角色列表
- `GET /role/:id`：查询角色详情（含权限）
- `PATCH /role/:id`：更新角色基础信息
- `DELETE /role/:id`：删除角色（受限删除）
- `PUT /role/:id/permissions`：覆盖设置角色权限
- `GET /role/:id/permissions`：查询角色当前权限
- `GET /user/:id/roles`：查询用户已有角色
- `PUT /user/:id/roles`：覆盖设置用户角色

## 规则

- `code` 全局唯一且不可变
- 删除前校验是否被用户绑定
- 权限/角色分配采用覆盖写语义
