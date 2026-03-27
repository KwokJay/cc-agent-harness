# Phase 4 计划：产品化、标准与自诊断（草案）

> 状态：规划  
> 前置：**Phase 3** 完成（MCP/Toolpack 生态、轻量 state、Ralph 与多 Agent **生成物**、提取与 monorepo 加固，约至 v0.7.x）  
> 对齐：文章中 **Harness-as-a-Product、Harness 标准化、自诊断 Harness、从 Prompt 工程到 Harness 工程** 等趋势——本阶段侧重 **v1.0 级体验、规范输出、可观测与扩展市场**。

## 阶段目标（一句话）

将 **cc-agent-harness** 从「好用的 CLI 脚手架」提升为 **可对外宣讲的 Harness 基线产品**：稳定 semver、机器可读的 harness 清单、可选的诊断与遥测（本地优先）、社区/商业扩展面清晰。

## 版本与主题建议

| 版本区间 | 主题 | 核心交付 |
|---------|------|----------|
| **v0.6.0** | Harness 清单标准 | 生成 `.harness/manifest.json`（或 `harness.manifest.json`）：工具列表、skill 数、toolpack、生成时间、harness 版本；供 CI 与其他工具消费 |
| **v0.6.1** | 导出与互操作 | `agent-harness export`：导出聚合规则摘要（单 Markdown 或 JSON）供非支持工具使用；与 manifest 同源数据 |
| **v0.6.2** | 自诊断 Harness | `agent-harness diagnose`：深度检查（schema、skill 分发、verify 可执行性、MCP 文件 JSON 合法、路径可写）；输出人类报告 + `--json` |
| **v0.6.3** | 迁移与升级 | `agent-harness migrate <fromVersion>`：只读提示 + 可选自动补丁（如 config 字段重命名、路径弃用） |
| **v0.6.4-rc** | 冻结与文档 | API/CLI 稳定性审查；README / 官网级 Quickstart；破坏性变更清单 |
| **v0.6.5** | 正式版 | 承诺 semver；发布渠道（npm）与 tag 策略固定；安全披露入口（SECURITY.md） |

## 任务清单（可拆 issue）

### A. 标准与清单

- [ ] manifest schema 版本字段（`manifestVersion`）与向后兼容策略
- [ ] 文档：**Harness Manifest 规范**（字段说明、示例、与 `doctor` / `diagnose` 的关系）

### B. 自诊断

- [ ] `diagnose` 与 `doctor` 职责划分：`doctor` 轻量日常；`diagnose` 深度排障（可调用 `verify`、解析 YAML、试跑关键命令）
- [ ] 可插拔检查项（为将来社区 rule pack 预留接口，可先仅内置）

### C. 产品化

- [ ] 官网或 docs 站点（可选：VitePress / 单页），与仓库 README 双链
- [ ] **Toolpack 市场** 索引页（可静态生成列表，不必自建后端）
- [ ] 遥测：**默认关闭**；若开启，仅匿名 CLI 版本与命令名（需 OPT-IN 与环境变量），符合合规描述

### D. 工程与治理

- [ ] `SECURITY.md`、Responsible disclosure
- [ ] 发布自动化（release-please / changesets 二选一）
- [ ] 性能预算：`resolve` / `generate` 在大型 monorepo fixture 上的基准测试（防回归）

### E. 长期研究（不阻塞 v1.0）

- [ ] **可选**本地守护进程或 Editor 扩展：订阅文件变更触发增量 `doctor`（独立 repo 亦可）
- [ ] 与 **Agent Protocol / 开放 Harness 标准**（若行业形成）对齐 manifest 导出

## 成功标准（Phase 4 结束时）

1. 新用户可在 **5 分钟内**按文档完成 init → verify → doctor，且理解各命令分工。  
2. **manifest + export** 至少被一个外部场景消费（文档示例或示例 CI job 即可）。  
3. `diagnose` 能覆盖 **80%** 常见配置错误类问题（可量化：内置检查项数量与 fixture）。  
4. **v1.0.0** 发布后 **90 天**内 semver 无未经文档的 CLI 破坏性变更。

## 风险与原则

| 风险 | 原则 |
|------|------|
| 功能膨胀导致 CLI 难懂 | 子命令分组、`--help` 分层、默认路径保持简单 |
| 遥测与隐私争议 | 默认关闭，文档显著说明 |
| v1.0 承诺过重 | rc 周期不少于 2–4 周，收集 issue |

## 相关文档

- [PHASE2_PLAN.md](./PHASE2_PLAN.md)  
- [PHASE3_PLAN.md](./PHASE3_PLAN.md)

---

*本文件随迭代更新；以 `CHANGELOG` 与版本 tag 为准。*
