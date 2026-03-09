---
name: git-commit-convention
description: 统一 Git 提交规范，生成可审计、可追踪的提交信息。用于需要创建 commit、整理提交内容、规范化 commit message、以及审查提交质量的场景。
---

# 目标

统一项目提交标准，保证提交信息与改动范围一致，便于审查、回滚与追踪。

# 执行流程

1. 归类改动：按功能或问题拆分提交，禁止把无关改动混在同一个 commit。
2. 质量检查：提交前执行 `pnpm run format` 与 `pnpm run build`，失败则不提交。
3. 精确暂存：仅 `git add` 本次任务相关文件，避免把临时文件、日志、环境文件带入提交。
4. 规范提交：按 Conventional Commits 生成提交信息。

# Commit Message 规范

格式：`<type>(<scope>): <subject>`

- `type`：`feat` `fix` `refactor` `docs` `test` `chore` `perf` `build` `ci`
- `scope`：建议使用模块名，如 `auth` `user` `prisma` `logger` `agents`
- `subject`：使用祈使句，简短明确，建议不超过 72 字符

示例：

- `feat(user): add password hashing and response masking`
- `fix(auth): validate login against database user credentials`
- `docs(agents): add git commit convention skill`

# 约束

- 一个 commit 只做一件事。
- 提交必须可构建。
- 禁止提交密钥、token、cookie、日志、临时产物。
- 变更 Prisma schema 时，提交中必须包含对应 migration。

# 自检清单

- 提交范围是否单一
- message 是否符合规范
- format/build 是否通过
- 文档是否同步更新
