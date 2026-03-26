# Phase 3 计划：运行时邻域与生态扩展（草案）

> 状态：规划  
> 前置：**Phase 2** 完成（Skill 合并进生成管线、`verify` 子命令、E2E/覆盖率门禁等，约至 v0.4.x）  
> 对齐：Agent Harness 长文里的**状态与记忆分层、验证/Ralph 闭环、工具/MCP 编排、多 Agent 协作模式**——本阶段仍以 **CLI + 生成物** 为主，**不强制**内嵌常驻守护进程，避免与现有「脚手架」定位撕裂。

## 阶段目标（一句话）

把「Harness 工程」从**只生成文件**推进到**可编排的本地工作流**：标准化 MCP/工具清单、可安装的社区 Toolpack、更完整的提取与 monorepo 体验，并通过**生成物 + 可选薄运行时**承载会话状态与验证循环的**约定**，为 Phase 4 产品化打地基。

## 版本与主题建议

| 版本区间 | 主题 | 核心交付 |
|---------|------|----------|
| **v0.5.0** | MCP 与工具清单 | 统一生成/合并 `mcp.json`（Cursor 已有 context-mode 先例）的**模式文档 + 可选 schema**；`agent-harness mcp merge` 或 init 选项；多工具 MCP 片段模板 |
| **v0.5.1** | npm Toolpack 发现 | `node_modules` / `pnpm` 下解析 `@agent-harness/toolpack-*`（或约定 `agent-harness-toolpack-*`），与 builtin/local 合并；`list toolpacks` 显示 `npm` 来源 |
| **v0.5.2** | JIT 工具组装（静态侧） | 根据 `config` 与已选工具生成「推荐工具列表」Markdown + 各工具可粘贴的片段；**非**运行时动态拉取，而是文档化 + 校验占位 |
| **v0.5.3** | 验证与持久状态（轻量） | `.harness/state/` 下**可选**写入上次 `verify` 结果摘要（JSON）、时间戳；`doctor` 读取并提示陈旧；不替代 CI，仅本地/Dev 体验 |
| **v0.5.4** | Ralph / 自证循环（生成物） | 生成 `.harness/workflows/ralph-loop.md`（或各工具等价 commands），约定「未通过 verify 不得宣称完成」；与现有 `verify` 子命令联动 |
| **v0.5.6** | 多 Agent 模式模板 | 生成可选片段：`initializer-executor`、`supervisor` 等**角色分工**说明 + AGENTS.md 章节模板；纯文档与规则增强 |
| **v0.5.7** | Skill 提取与 monorepo | 扩展 `invokeSkillExtraction` 工具覆盖策略；复杂 workspace 的 glob/根包解析加固；提取任务模板按子包拆分（可选） |

## 任务清单（可拆 issue）

### A. MCP / 工具编排

- [ ] 抽象「向 Cursor 写入 MCP 服务器条目」为独立模块，供多个 Toolpack 复用
- [ ] 文档：各工具官方 MCP 配置路径对照表（与 README 表格同级）
- [ ] （可选）JSON Schema 或 TS 类型导出，供用户在 IDE 中校验 `mcp.json`

### B. Toolpack 生态

- [ ] npm scope 发现：扫描依赖中的 toolpack 包，读取 `package.json` 的 `agent-harness.toolpack` 字段或约定入口
- [ ] 发布一份 **toolpack 作者指南**（字段、版本、与 `generateFiles` 契约）

### C. 状态与记忆（约定优先）

- [ ] 定义 `.harness/state/` 目录规范（`last-verify.json`、`harness-version.txt` 等），**默认不写敏感信息**
- [ ] `AGENTS.md` 可选段落：Working / Session / Long-term 三层说明的**占位与链接**（实际内容由团队填）

### D. 验证闭环

- [ ] `verify` 与生成物中的「Before complete」段落使用**同一命令来源**（config），避免漂移
- [ ] Ralph 风格：生成「迭代直到 verify 全绿」的检查清单（仍由人在 IDE 中执行，或由脚本调用 `agent-harness verify`）

### E. 工程约束

- [ ] 仍遵守：**默认不新增重运行时依赖**；若引入可选依赖，需文档说明并尽量 `optionalDependencies` 或子路径导出
- [ ] 每个里程碑结束：**`pnpm agent-review`**

## 依赖与风险

| 风险 | 缓解 |
|------|------|
| npm toolpack 解析在各包管理器上行为不一致 | 先支持 pnpm + npm，yarn 单列 issue |
| 「状态目录」与用户 gitignore 习惯冲突 | 文档建议将 `.harness/state/` 加入 `.gitignore` 或说明可提交用于团队对齐 |
| 与 Phase 4「自诊断 Harness」边界重叠 | Phase 3 只做**文件级状态与文档**；复杂诊断进 Phase 4 |

## 与 Phase 2 的衔接

- Phase 2 的 **`verify` CLI** 与 **config.workflows** 是 Phase 3 的**硬前置**。
- Phase 2 延后项「npm scope toolpack」「JIT 工具组装 / MCP 标准化」在 Phase 3 落地。

## 相关文档

- 上一阶段：[PHASE2_PLAN.md](./PHASE2_PLAN.md)  
- 下一阶段：[PHASE4_PLAN.md](./PHASE4_PLAN.md)

---

*本文件随迭代更新；以 `CHANGELOG` 与实际里程碑为准。*
