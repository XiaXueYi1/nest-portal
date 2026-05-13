Backend stack:

NestJS
TypeScript
Prisma
PostgreSQL

Architecture:

src/modules
src/common
src/config
src/setup

Database rules:

String @id @default(cuid())
relationMode = "prisma"

Auth:

Stateless JWT（Cookie 双 token）

RBAC enabled.
