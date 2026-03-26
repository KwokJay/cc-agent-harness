<p align="center"><code>npm install -g cc-agent-harness</code></p>
<p align="center"><strong>cc-agent-harness</strong> — AI 辅助开发 Harness 脚手架。根据项目类型 + AI 编程工具自动初始化项目 Harness。</p>
<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a></p>

---

## 它做什么

`cc-agent-harness` 一条命令为你的项目生成完整的 AI 开发 Harness。它自动检测项目类型，让你选择使用的 AI 编程工具，然后把规则文件、skills、约束和配置生成到每个工具对应的正确路径下。

**支持的项目类型**: 前端、后端、全栈、monorepo、文档（自动检测 12+ 种语言）

**支持的 AI 工具**: Cursor、Claude Code、GitHub Copilot、OpenAI Codex、OpenCode

## 快速开始

```shell
npm install -g cc-agent-harness

cd your-project
agent-harness init
```

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

**第二步（AI 驱动）**: 按优先级调用 AI 工具（Claude Code > Codex > Cursor > Copilot > OpenCode），使用 `skill-creator` 方法论执行深度提取。

## 内置约束

Harness 在 AGENTS.md 和各工具规则文件中注入治理规则：

- **文档规则**: 所有文档必须放在 `.harness/docs/{feature-name}/` 下
- **Changelog 规则**: 每次有意义的变更后必须更新 `CHANGELOG.md`

## 命令

```shell
agent-harness init                     # 交互式初始化
agent-harness init -p backend -t cursor,claude-code  # 非交互式
agent-harness doctor                   # 检查 harness 健康状态
agent-harness doctor --json            # 机器可读输出
agent-harness update                   # 刷新生成的文件
agent-harness list tools               # 列出支持的 AI 工具
agent-harness list projects            # 列出支持的项目类型
agent-harness list toolpacks           # 列出可选工具包
```

## 可选工具包

| 工具包 | 分类 | 说明 |
|--------|------|------|
| context-mode | 上下文工程 | MCP 上下文沙箱 + 会话连续性 |
| rtk | 上下文工程 | 终端输出压缩（节省 60-90% token） |
| understand-anything | 分析 | 代码库知识图谱和架构仪表板 |
| gstack | 工程支撑 | Claude Code 虚拟工程团队 skills 套件 |

## 包名与命令名

- npm 包名：`cc-agent-harness`
- CLI 命令：`agent-harness`

## License

基于 [MIT License](./LICENSE) 开源。
