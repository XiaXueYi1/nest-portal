# Feature

Role Module PRD

# Background & Goal

- 为后台管理系统提供角色（Role）生命周期管理能力：创建、查询、更新、删除。
- 提供角色与权限（Permission）的绑定能力，支撑 RBAC 授权链路。
- 为用户与角色关系管理提供稳定接口，支撑“给用户授予/回收角色”。

# Scope

## In Scope

- 角色基础 CRUD。
- 角色分页查询与筛选。
- 角色-权限分配（覆盖式更新）。
- 查询角色详情时返回权限集合。
- 查询用户已分配角色。

## Out of Scope

- 权限点（Permission）定义平台。
- 组织架构/租户级别数据隔离。
- 前端页面交互细节。

# API

## 1) 角色管理

- `POST /role/create`
  - 创建角色。
- `GET /role/list`
  - 分页查询角色列表。
  - query: `page`, `pageSize`, `keyword`（匹配 `name/code`）。
- `GET /role/:id`
  - 查询角色详情（含权限列表）。
- `PATCH /role/:id`
  - 更新角色基础信息（`name`, `description`）。
- `DELETE /role/:id`
  - 删除角色（软删除或受限删除，见规则）。

## 2) 角色授权

- `PUT /role/:id/permissions`
  - 覆盖设置角色权限。
  - body: `permissionIds: string[]`。
- `GET /role/:id/permissions`
  - 查询角色当前权限。

## 3) 用户角色关系

- `GET /user/:id/roles`
  - 查询用户已有角色。
- `PUT /user/:id/roles`
  - 覆盖设置用户角色。
  - body: `roleIds: string[]`。

# Request / Response (Core)

## Role DTO

- `id: string`
- `code: string`（系统唯一）
- `name: string`
- `description?: string`
- `createdAt: string`
- `updatedAt: string`

## Role List Response

- `list: RoleDTO[]`
- `total: number`
- `page: number`
- `pageSize: number`

## Assign Permissions Request

- `permissionIds: string[]`

# Permission

- `role.create`
- `role.list`
- `role.read`
- `role.update`
- `role.delete`
- `role.assignPermission`
- `user.assignRole`

# Database

- `roles`
  - 主体信息：`id`, `code`, `name`, `description`, `createdAt`, `updatedAt`
- `role_permissions`
  - 关系信息：`roleId`, `permissionId`, `assignedAt`
  - 唯一约束：`(roleId, permissionId)`
- `user_roles`
  - 关系信息：`userId`, `roleId`, `assignedAt`, `assignedBy`
  - 唯一约束：`(userId, roleId)`

# Business Rules

1. `code` 全局唯一，创建后不可变。
2. 角色名称可重复与否以业务定义为准；默认建议可重复但需提示。
3. 删除角色前需校验是否仍被用户绑定：
   - 若存在绑定，返回业务错误（推荐）。
4. 角色权限更新采用“覆盖写”语义：
   - 先移除旧关系，再批量写入新关系。
5. 空权限集是合法输入（代表清空该角色权限）。
6. 所有写操作应记录审计日志（创建、更新、删除、授权）。

# Validation

- `code`: 3~64，字母/数字/下划线/中划线。
- `name`: 1~128。
- `description`: 0~255。
- `page`: 默认 1。
- `pageSize`: 默认 10，最大 100。

# Error Cases

- 角色不存在。
- `code` 冲突。
- 权限 ID 不存在。
- 角色删除时仍被用户引用。
- 鉴权失败（无 token / token 失效 / 权限不足）。

# Acceptance Criteria

1. 可成功创建角色，并在列表中检索到。
2. 角色详情可返回完整权限集合。
3. 覆盖更新权限后，旧权限不残留。
4. 未授权用户访问角色管理接口返回 403/401。
5. 分页接口返回结构统一：`list/total/page/pageSize`。
