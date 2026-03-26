# Phase 2 计划：从脚手架到可验证 Harness（草案）

> 状态：规划  
> 前置：Phase 1（v0.2.1–v0.3.0 能力）已合入 `master`  
> 对齐：Agent Harness 文章中的「验证闭环、状态与记忆、工具编排」等方向（长期目标分步落地）

## 阶段目标（一句话）

在**不破坏现有 init/update/doctor 体验**的前提下，补齐 **Skill 合并真正进生成管线**、**可观测的更新与校验**、**与 CI/本地一致的 verify**，并为后续「运行时 harness」预留扩展点。

## 版本与主题建议（可按需调整）

| 版本区间 | 主题 | 核心交付 |
|---------|------|----------|
| **v0.3.1** | Skill 合并落地 | `generateFiles` 对 `.harness/skills/**/SKILL.md` 走 `parseSkillFile` + `mergeSkill`；`GenerateResult` 报告 merge 决策；补集成测试 |
| **v0.3.2** | Toolpack 与列表一致 | `registry` 与 `discoverToolpacks` 统一数据源；`list toolpacks` 展示 `builtin` / `local` 来源；init 可选包列表与 discovery 对齐 |
| **v0.3.3** | 验证命令与配置 | 新增 `agent-harness verify`（或 `check`）：读 `config.workflows`，在子进程中执行校验命令并汇总退出码；`doctor` 可选调用轻量 verify |
| **v0.3.4** | 分析与模板收尾 | `analyzer.ts` 大段字符串迁到 `src/templates/skills/*`；`PROJECT-ANALYSIS` / `INDEX` / `EXTRACTION-TASK` 快照测试 |
| **v0.4.0** | E2E 与覆盖率门禁 | `tests/e2e/`：临时目录 `init` → `doctor` → `update --dry-run`；CI 启用 `test:coverage` 与阈值（或分 job） |

## 任务清单（可拆 issue）

### A. Skill 与生成管线

- [ ] 在 `generator` 中识别 harness skill 路径，磁盘已有文件时调用 `mergeSkill`（默认 `keep-manual`；`update --full` 可走 `overwrite`）
- [ ] 生成新 skill 时写入 frontmatter：`version`、`source`、`generated_at`、`harness_version`（与 Phase 1 解析器一致）
- [ ] `doctor`：`skill-source` 检查（plan 中曾列，可与分发路径交叉验证）

### B. Toolpack 一致性

- [ ] `getOptionalToolpacks` / `getToolpack` 基于 `discoverToolpacks(cwd)` 或单一注册表，避免 builtin 双份定义
- [ ] `list toolpacks` 输出列：`id`、`source`、`version`

### C. 验证与可观测性

- [ ] `verify` 子命令：解析 `workflows.verification.checks`，映射到 `workflows.commands`，顺序或并行执行（先顺序更稳妥）
- [ ] `update --dry-run` 可选输出与 `diffPlan` 对齐的 `removed` 提示（若 config 含 `generated_files`）

### D. 工程与文档

- [ ] 发布版本号：将 `package.json` / CLI `--version` 与 `CHANGELOG` 从 `[Unreleased]` 收口到具体版本（如 `0.3.1`）
- [ ] `README`：补充 Phase 2 能力预告与 `verify` 文档
- [ ] 每条 PR / 任务结束仍执行 **`pnpm agent-review`**

## 明确延后（Phase 3+ 候选）

- 真正的**运行时**状态机、会话记忆存储、Ralph 循环内置调度（与当前「静态脚手架」边界不同，需单独架构）
- npm scope `@agent-harness/toolpack-*` 自动发现
- JIT 工具组装 / MCP 清单标准化

## 下一步行动（本周可执行）

1. 从 **v0.3.1 Skill 合并进 generator** 开分支，写 2–3 个集成测试锁定行为。  
2. 评审：`mergeSkill` 与 **incremental** 模式同时启用时的优先级（建议：先 merge 再比较最终 content 是否写盘）。  
3. 合并后打 tag / 发 patch 版本，便于下游 demo 项目升级验证。

---

*本文件随迭代更新；与产品路线图冲突时以仓库 `CHANGELOG` 与里程碑讨论为准。*
