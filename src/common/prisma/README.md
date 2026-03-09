# Prisma 模块说明

## 目标

提供全局可注入的 Prisma 数据库访问能力。

## 组成

- `prisma.service.ts`：封装 PrismaClient 生命周期（connect/disconnect）
- `prisma.module.ts`：全局模块，导出 `PrismaService`

## 使用方式

在任意 service 里注入：

```ts
constructor(private readonly prisma: PrismaService) {}
```
