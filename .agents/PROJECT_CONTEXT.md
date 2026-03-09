Backend stack:

NestJS
TypeScript
Prisma
PostgreSQL
Redis

Architecture:

src/modules
src/common
src/config
src/setup

Database rules:

String @id @default(cuid())
relationMode = "prisma"

Auth:

JWT + Redis session

RBAC enabled.