# Contributing to cc-agent-harness

## Agent review + verify（每个任务必做）

无论由人类还是 AI Agent 提交改动，在结束任务前请完成：

1. **Agent 审查**：对照需求检查 diff、边界情况、CLI/生成物行为与文档一致性。
2. **自动化验证**：在仓库根目录运行：

   ```bash
   pnpm agent-review
   ```

   该命令依次执行 TypeScript 检查（`lint`）、带阈值的覆盖率测试（`test:coverage`）、构建（`build`）、E2E（`test:e2e`，需已生成 `dist/`）。全部通过后方可认为任务完成。

CI（`.github/workflows/ci.yml`）与上述门禁一致；推送前本地运行可减少返工。

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm lint` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm test:coverage` | 带覆盖率 |
| `pnpm build` | tsup 构建 |
| `pnpm agent-review` | 审查门禁（lint + test:coverage + build + test:e2e） |
| `pnpm verify` | lint + test（单元，不含 e2e）+ build + test:e2e |

## 发布

`prepublishOnly` 会运行 `pnpm verify`，请确保发布前测试与构建已通过。
