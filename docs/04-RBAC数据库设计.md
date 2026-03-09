# RBAC 鏁版嵁搴撹璁★紙Prisma锛?
## 1. 璁捐鐩爣

- 鐢ㄦ埛銆佽鑹层€佹潈闄愪笁灞?RBAC
- 鍏ㄩ儴涓婚敭浣跨敤 `String + cuid()`
- 鍏崇郴閫氳繃 Prisma 绠＄悊锛堟棤鐗╃悊澶栭敭锛?
## 2. 鏂囦欢鎷嗗垎

- 鍏ュ彛锛歚prisma/schema/schema.prisma`
- 鍗曡〃鏂囦欢锛?  - `modules/user.prisma`
  - `modules/user_credential.prisma`
  - `modules/role.prisma`
  - `modules/permission.prisma`
  - `modules/auth_session.prisma`
  - `modules/audit_log.prisma`
- 鍏崇郴鏂囦欢锛?  - `modules/permission_control_relations.prisma`

## 3. 琛ㄨ璁?
### `users`

- 涓婚敭锛歚id`
- 鍏抽敭瀛楁锛歚username`銆乣email`銆乣avatar`銆乣status`銆乣lastLoginAt`
- 瀹¤瀛楁锛歚createdAt`銆乣updatedAt`銆乣deletedAt`
- 绱㈠紩锛歚status`

### `user_credentials`

- 涓婚敭锛歚id`
- 涓€瀵逛竴瀛楁锛歚userId`锛堝敮涓€锛?- 鍏抽敭瀛楁锛歚passwordHash`銆乣passwordSalt`銆乣passwordUpdatedAt`

### `roles`

- 涓婚敭锛歚id`
- 鍏抽敭瀛楁锛歚code`锛堝敮涓€锛夈€乣name`銆乣description`

### `permissions`

- 涓婚敭锛歚id`
- 鍏抽敭瀛楁锛歚code`锛堝敮涓€锛夈€乣type`銆乣resource`銆乣action`
- 绱㈠紩锛歚type`銆乣resource + action`

### `user_roles`锛堝叧绯昏〃锛?
- 涓婚敭锛歚id`
- 鍏抽敭瀛楁锛歚userId`銆乣roleId`銆乣assignedAt`銆乣assignedBy`
- 绾︽潫锛歚@@unique([userId, roleId])`
- 绱㈠紩锛歚userId`銆乣roleId`

### `role_permissions`锛堝叧绯昏〃锛?
- 涓婚敭锛歚id`
- 鍏抽敭瀛楁锛歚roleId`銆乣permissionId`銆乣assignedAt`
- 绾︽潫锛歚@@unique([roleId, permissionId])`
- 绱㈠紩锛歚roleId`銆乣permissionId`

### `auth_sessions`

- 涓婚敭锛歚id`
- 鍏抽敭瀛楁锛歚sid`锛堝敮涓€锛夈€乣userId`銆乣accessExpiresAt`銆乣refreshExpiresAt`
- 绱㈠紩锛歚userId`銆乣refreshExpiresAt`

### `audit_logs`

- 涓婚敭锛歚id`
- 鍏抽敭瀛楁锛歚actorUserId`銆乣action`銆乣targetType`銆乣targetId`銆乣metadata`
- 绱㈠紩锛歚actorUserId`銆乣action`銆乣createdAt`

## 4. 鏋氫妇璁捐

- `UserStatus`锛歚ACTIVE` / `DISABLED` / `LOCKED`
- `PermissionType`锛歚API` / `MENU` / `ACTION`
- `AuditAction`锛歚LOGIN` / `LOGOUT` / `CREATE` / `UPDATE` / `DELETE` / `ASSIGN_ROLE` / `REVOKE_ROLE`

