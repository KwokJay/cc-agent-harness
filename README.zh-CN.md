<p align="center"><code>npm install -g cc-agent-harness</code></p>
<p align="center"><strong>cc-agent-harness</strong> — 面向仓库本地的 AI 辅助开发 Harness：一条 CLI 在多种 AI 编程工具之间生成规则、skills 与治理产物。</p>
<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a></p>

---

**CLI 名称（v0.7.0 起）：** 命令为 `harn`。安装仍为 `npm install -g cc-agent-harness`（包名不变）。旧文档可能出现 `agent-harness`。

## 适合谁

**产品叙事（POS-02）：** 以 **三类 ICP**、**黄金路径可验证** 与 **能力分级** 讲价值，而非平铺功能清单。详见 **[docs/POSITIONING.md](./docs/POSITIONING.md)**；流程见 **[docs/GOLDEN-PATHS.md](./docs/GOLDEN-PATHS.md)**。

- **多仓库技术负责人**：在 Cursor / Claude Code / Codex 等工具间统一标准  
- **内部标准化推动者**：需要 `verify`、`manifest`、`export` 做审计与说明  
- **开源维护者**：为贡献者提供一致的起点（`AGENTS.md`、各工具规则）

**不适合：** 只要托管治理、或单工具且无同步需求。详见 **[docs/POSITIONING.md](./docs/POSITIONING.md)**。

**能力分级：** **[docs/CAPABILITY-MATRIX.md](./docs/CAPABILITY-MATRIX.md)** — *First-class*（Cursor、Claude Code、Codex）与 *baseline*（Copilot、OpenCode、Windsurf、Trae、Augment）。

**可复制流程：** **[docs/GOLDEN-PATHS.md](./docs/GOLDEN-PATHS.md)** — 后端、前端、monorepo 示例。

**可复现的 ROI 证明：** **[docs/ROI.md](./docs/ROI.md)** — manifest 的 adoption/health、`jq` 示例，并链接到 `ROI-BASELINE.md`。

## 它做什么

`cc-agent-harness` 一条命令为你的项目生成完整的 AI 开发 Harness。它自动检测项目类型，让你选择使用的 AI 编程工具，然后把规则文件、skills、约束和配置生成到每个工具对应的正确路径下。

**支持的项目类型**: 前端、后端、全栈、monorepo、文档（自动检测 12+ 种语言）

**支持的 AI 工具**（分级）：**First-class** — Cursor、Claude Code、OpenAI Codex。**Baseline** — GitHub Copilot、OpenCode、Windsurf、Trae、Augment。各维度的边界见上方能力矩阵。

**运行环境：** Node.js **>= 22**（见 `package.json` 的 `engines`）。安装后可用 `harn -V` / `harn --version` 确认 CLI 版本。

## 快速开始

```shell
npm install -g cc-agent-harness

cd your-project
harn init
```

流程说明与生成物清单：**[docs/GOLDEN-PATHS.md](./docs/GOLDEN-PATHS.md)**。

交互式流程会依次：
1. 检测项目类型和语言
2. 展示 workspace 下的子项目
3. 让你选择使用的 AI 编程工具
4. 选择可选工具包
5. 生成 harness 文件
6. 自动提取项目 skills
7. 调用 AI 工具执行深度 skill 提取

## 生成结果示例

以后端项目 + Cursor + Claude Code 为例：

```text
AGENTS.md                                    跨工具通用 AI 指令
CLAUDE.md                                    Claude Code 入口（导入 AGENTS.md）
CHANGELOG.md                                 基于 git 历史自动生成
.cursor/rules/project.mdc                    Cursor 项目规则
.cursor/rules/coding.mdc                     Cursor 编码规范
.cursor/rules/skill-*.mdc                    Cursor skill 规则
.claude/skills/{name}/SKILL.md               Claude Code 原生 skills
.claude/commands/verify.md                   Claude Code 验证命令
.harness/config.yaml                         Harness 配置
.harness/skills/                             Skill 源（备份）
.harness/skills/skill-creator/SKILL.md       Skill 创建方法论
.harness/skills/EXTRACTION-TASK.md           AI 深度提取任务
.harness/skills/PROJECT-ANALYSIS.md          静态分析结果
.harness/skills/INDEX.md                     Skill 索引
.harness/workflows/ralph-loop.md             Ralph 风格验证循环（文档）
.harness/workflows/multi-agent-patterns.md   多 Agent 角色模式（文档）
.harness/recommended-tools.md                推荐工具与粘贴目标（静态）
.harness/state/harness-version.txt           上次 init/update 时的 CLI 版本
```

## Skill 分发机制

Skills 以 `.harness/skills/` 作为标准源，然后分发到各工具的原生路径：

| 工具 | 原生 skill 路径 |
|------|----------------|
| Cursor | `.cursor/rules/skill-{name}.mdc` |
| Claude Code | `.claude/skills/{name}/SKILL.md` |
| Copilot | `.github/instructions/{name}.instructions.md` |
| Codex | `.agents/skills/{name}/SKILL.md` |
| OpenCode | `.opencode/skills/{name}/SKILL.md` |

## 两步 Skill 提取

**第一步（静态分析）**: 脚手架扫描项目文件，从依赖、目录结构、配置和测试模式中生成基础 skills。

**第二步（自动提取 vs 手动兜底）**：

- **自动**：见 [docs/CAPABILITY-MATRIX.md](./docs/CAPABILITY-MATRIX.md) 中的 `extractionAuto` — 仅 **Claude Code** 与 **Codex** 具备脚本化 CLI 路径。Harness 按 **Claude Code → Codex → Cursor → Copilot → OpenCode** 尝试；无 CLI 或 PATH 中找不到时会跳过并输出明确原因。
- **手动兜底**（始终可用）：在任意已配置的 AI 工具中打开 `.harness/skills/EXTRACTION-TASK.md`。自动化优先级列表外的工具（如 Windsurf、Trae、Augment）深度提取依赖此路径。

## 内置约束

Harness 在 AGENTS.md 和各工具规则文件中注入治理规则：

- **文档规则**: 所有文档必须放在 `.harness/docs/{feature-name}/` 下
- **Changelog 规则**: 每次有意义的变更后必须更新 `CHANGELOG.md`

## 命令

```shell
harn init                     # 交互式初始化
harn init -p backend -t cursor,claude-code  # 非交互式
harn init -n my-app -p backend -t cursor,claude-code  # 项目显示名（--name）
harn init ... --skip-skill-extraction       # 跳过第二步 AI 提取（CI / 冒烟）
harn init ... --skip-docs                   # 不生成 .harness/docs/ 目录结构
harn init ... --overwrite                   # 覆盖已有生成文件
harn doctor                   # 检查 harness 健康状态
harn doctor --json            # 机器可读输出
harn doctor --verify          # Doctor 通过后执行配置中的验证命令
harn diagnose                 # 深度诊断（MCP JSON 合法性、验证命令映射、目录可写性）
harn diagnose --json          # 机器可读诊断报告
harn diagnose --run-verify    # 诊断后执行 workflows.verification.checks
harn manifest                 # 重新生成 .harness/manifest.json
harn manifest --json          # 写入 manifest 并打印 JSON
harn export                   # 输出 Harness 摘要（Markdown，与 manifest 同源数据）
harn export -f json -o out.json             # -f/--format：md（默认）或 json；-o/--out：输出文件
harn migrate 0.5.0            # 查看迁移计划（dry-run）
harn migrate 0.5.0 --apply    # 执行已注册补丁（0.5.0 起首个带真实配置补丁的 from-version：补全缺失的 generated_files）
harn verify                   # 按 config 运行 workflows.verification.checks
harn update                   # 刷新生成的文件（默认增量）
harn update --dry-run         # 预览；对比 generated_files 列出不再纳入计划的文件
harn update --full            # 强制全量再生（相对默认的增量模式）
harn update --overwrite       # 强制覆盖所有生成文件
harn list tools               # 列出支持的 AI 工具
harn list projects            # 列出支持的项目类型
harn list toolpacks           # 可选工具包（含 source、version）
harn mcp merge [name]         # 合并 MCP server 到 .cursor/mcp.json（--file / 管道 JSON）
harn -V                       # 打印 CLI 版本（同 harn --version）
```

### CLI 参考（全部参数）

| 命令 | 参数 |
|------|------|
| **`harn init`** | `-p` / `--project`：`frontend`、`backend`、`fullstack`、`monorepo`、`docs` · `-t` / `--tools`：逗号分隔工具 id（见下） · `-n` / `--name`：项目名 · `--toolpacks`：逗号分隔工具包 id · `--skip-docs` · `--skip-skill-extraction` · `--overwrite` |
| **`harn doctor`** | `--json` · `--verify` |
| **`harn diagnose`** | `--json` · `--run-verify` |
| **`harn manifest`** | `--json` |
| **`harn export`** | `-f` / `--format`：`md` 或 `json` · `-o` / `--out`：文件路径 |
| **`harn migrate`** | `<fromVersion>` · `--apply` |
| **`harn update`** | `--dry-run` · `--full` · `--overwrite` |
| **`harn mcp merge`** | 可选 server `name` · `-f` / `--file` · `--dry-run` |

**`-t` / `--tools` 工具 id**（非交互）：`cursor`、`claude-code`、`copilot`、`codex`、`opencode`、`windsurf`、`trae`、`augment`，与 `harn list tools` 一致。内置 `--help` 可能只列部分 id；**以上表为准**。

**全局：** `harn --help`、`harn -h`、`harn -V`、`harn --version`、`harn <子命令> --help`。

### 再生成与稳定自定义规则

`harn update` 默认**增量**刷新；`--full` 强制走全量再生；`--overwrite` 强制覆盖生成文件。再次执行仍可能整文件覆盖无法 merge 的生成物（例如在 `AGENTS.md` 里手写内容可能丢失）。**长期有效的团队规则**请写在 **`.harness/config.yaml`** 的 **`custom_rules`**（字符串列表）中，以便合并进跨工具生成内容。详见 **[docs/GOLDEN-PATHS.md](./docs/GOLDEN-PATHS.md)**。

### 治理循环（Governance loop）

初始化后建议循环：**`harn update`** → **`harn verify`** → **`harn diagnose --json`**，并用 **`harn manifest`** / **`harn export`** 更新清单。详见 **[docs/MANIFEST.md](./docs/MANIFEST.md)**（含 CI 中用 `diagnose` + `jq` 门禁的示例）。

## MCP 配置路径（参考）

| 工具 / 产品 | 常见 MCP 或扩展配置位置 |
|-------------|-------------------------|
| Cursor | `.cursor/mcp.json`（`mcpServers`） |
| Claude Code | 见 Anthropic 官方文档中的 MCP / 插件说明 |
| OpenAI Codex | 见 OpenAI 开发者文档 |
| OpenCode | `opencode.json` 与厂商文档 |
| GitHub Copilot | VS Code / Copilot 扩展设置 |

合并 Cursor MCP 示例：`echo '{"command":"npx","args":["-y","pkg"]}' | harn mcp merge my-server`。可选 Schema：`schemas/cursor-mcp.json`。

Harness manifest schema：`schemas/harness-manifest.json`，字段说明见 [docs/MANIFEST.md](./docs/MANIFEST.md)。

可选工具包索引：[docs/toolpacks-index.md](./docs/toolpacks-index.md)（`pnpm run generate:toolpack-index` 重新生成）。

## 验证状态（本地）

`harn verify` 会在 `.harness/state/last-verify.json` 写入摘要（不含密钥）。`doctor` 在未运行、上次失败或超过约 7 天未验证时会提示。`.harness/state/harness-version.txt` 记录上次 init/update 刷新生成物时使用的 CLI 版本。`.harness/state/` 可由团队选择提交或加入 `.gitignore`。

## 可选工具包

除内置与 `.harness/toolpacks/` 本地包外，若依赖中存在 **`@agent-harness/toolpack-*`** 或 **`agent-harness-toolpack-*`**，且 `package.json` 含 `agent-harness.toolpack` 字段，会被自动发现（`list toolpacks` 中 `source=npm`）。作者说明见 [docs/TOOLPACK-AUTHOR.md](./docs/TOOLPACK-AUTHOR.md)。

| 工具包 | 分类 | 说明 |
|--------|------|------|
| context-mode | 上下文工程 | MCP 上下文沙箱 + 会话连续性 |
| rtk | 上下文工程 | 终端输出压缩（节省 60-90% token） |
| understand-anything | 分析 | 代码库知识图谱和架构仪表板 |
| gstack | 工程支撑 | Claude Code 虚拟工程团队 skills 套件 |

```shell
harn init --toolpacks context-mode,rtk
```

## 包名与命令名

- npm 包名：`cc-agent-harness`
- CLI 命令：`harn`
- Node.js：`>= 22`

## 开发

- **完整门禁（贡献者）：** `pnpm agent-review` — lint、覆盖率测试、构建、E2E、toolpack 索引检查。详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。
- **更快反馈：** `pnpm verify` — lint、单元测试、构建、E2E、toolpack 检查（不含覆盖率阈值）。

## 更多文档

- [CHANGELOG.md](./CHANGELOG.md) — 版本与变更记录  
- [SECURITY.md](./SECURITY.md) — 安全策略  
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 开发与发布

## License

基于 [MIT License](./LICENSE) 开源。
