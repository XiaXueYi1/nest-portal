# RBAC 数据库设计（Prisma）

## 1. 设计目标

- 用户、角色、权限三层 RBAC
- 全部主键使用 `String + cuid()`
- 关系通过 Prisma 管理（无物理外键）

## 2. 文件拆分

- 入口：`prisma/schema/schema.prisma`
- 单表文件：
  - `modules/user.prisma`
  - `modules/user_credential.prisma`
  - `modules/role.prisma`
  - `modules/permission.prisma`
  - `modules/auth_session.prisma`
  - `modules/audit_log.prisma`
- 关系文件：
  - `modules/permission_control_relations.prisma`

## 3. 表设计

### `users`

- 主键：`id`
- 关键字段：`username`、`email`、`avatar`、`status`、`lastLoginAt`
- 审计字段：`createdAt`、`updatedAt`、`deletedAt`
- 索引：`status`

### `user_credentials`

- 主键：`id`
- 一对一字段：`userId`（唯一）
- 关键字段：`passwordHash`、`passwordSalt`、`passwordUpdatedAt`

### `roles`

- 主键：`id`
- 关键字段：`code`（唯一）、`name`、`description`

### `permissions`

- 主键：`id`
- 关键字段：`code`（唯一）、`type`、`resource`、`action`
- 索引：`type`、`resource + action`

### `user_roles`（关系表）

- 主键：`id`
- 关键字段：`userId`、`roleId`、`assignedAt`、`assignedBy`
- 约束：`@@unique([userId, roleId])`
- 索引：`userId`、`roleId`

### `role_permissions`（关系表）

- 主键：`id`
- 关键字段：`roleId`、`permissionId`、`assignedAt`
- 约束：`@@unique([roleId, permissionId])`
- 索引：`roleId`、`permissionId`

### `auth_sessions`

- 主键：`id`
- 关键字段：`sid`（唯一）、`userId`、`accessExpiresAt`、`refreshExpiresAt`
- 索引：`userId`、`refreshExpiresAt`

### `audit_logs`

- 主键：`id`
- 关键字段：`actorUserId`、`action`、`targetType`、`targetId`、`metadata`
- 索引：`actorUserId`、`action`、`createdAt`

## 4. 枚举设计

- `UserStatus`：`ACTIVE` / `DISABLED` / `LOCKED`
- `PermissionType`：`API` / `MENU` / `ACTION`
- `AuditAction`：`LOGIN` / `LOGOUT` / `CREATE` / `UPDATE` / `DELETE` / `ASSIGN_ROLE` / `REVOKE_ROLE`
