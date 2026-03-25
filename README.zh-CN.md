<p align="center"><code>npm install -g agent-harness</code></p>
<p align="center"><strong>agent-harness</strong> 是一个面向 AI 辅助开发工作流的、厂商中立的 CLI 与 TypeScript 工具包。</p>
<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a></p>

它帮助团队统一项目初始化、`AGENTS.md` 生成、技能发现、健康检查和验证流水线，同时避免被某一家模型供应商或某一种 agent 框架绑定。

---

## 快速开始

### 安装并使用

使用 npm 全局安装：

```shell
npm install -g agent-harness
```

然后在项目目录中初始化：

```shell
agent-harness setup
agent-harness doctor
agent-harness verify
```

### 从源码开发

本仓库要求 `Node >=22`，本地开发使用 `pnpm`。

```shell
pnpm install
pnpm build
pnpm test
pnpm lint
```

## 它能做什么

- 生成统一的 `.harness/` 项目骨架，并按模板产出 `AGENTS.md`。
- 加载分层 YAML 配置，并通过 Zod 做结构校验。
- 使用厂商中立的 `low` / `medium` / `high` 档位路由 agent 与模型。
- 发现、校验并脚手架化可复用技能。
- 检测当前项目类型，并为 TypeScript、Python、Rust 提供默认验证命令。
- 执行项目健康检查，以及可配置的 build、test、lint 验证流水线。
- 以 TypeScript 库形式暴露同一套能力，便于程序化集成。

## 常用命令

| 命令 | 说明 |
|------|------|
| `agent-harness setup` | 初始化 `.harness/` 并生成 `AGENTS.md` |
| `agent-harness update` | 同步模板和配置 |
| `agent-harness doctor` | 对当前项目执行健康检查 |
| `agent-harness verify` | 运行配置好的验证流水线 |
| `agent-harness run <task>` | 执行命名工作流或适配器提供的命令 |
| `agent-harness list <resource>` | 列出 `skills`、`agents`、`commands` 或 `templates` |
| `agent-harness config show` | 输出合并后的配置 |
| `agent-harness config validate` | 校验配置文件是否合法 |
| `agent-harness schema generate` | 生成配置对应的 JSON Schema |
| `agent-harness scaffold skill <name>` | 创建一个新的 skill 脚手架 |

## 配置

项目级配置位于 `.harness/harness.config.yaml`，可选的用户级默认配置位于 `~/.harness/config.yaml`。

```yaml
project:
  name: my-project
  language: typescript
  description: "My AI-assisted project"

agents:
  delegation_first: true
  model_routing:
    low: low
    medium: medium
    high: high
  providers:
    low: "gpt-4o-mini"
    medium: "claude-sonnet-4-20250514"
    high: "o3"
  definitions: []

skills:
  directories:
    - ".harness/skills"
  auto_detect: true

workflows:
  commands:
    build: "npm run build"
    test: "npm test"
    lint: "npm run lint"
  verification:
    checks: ["build", "test", "lint"]

templates:
  agents_md:
    variant: standard
    custom_rules: []
```

### 模型档位

`agent-harness` 的模型路由是厂商中立的。agent 和工作流只感知 `low`、`medium`、`high` 三个档位，`providers` 负责把这些档位映射到真实模型 ID。

```yaml
agents:
  providers:
    low: "gpt-4o-mini"
    medium: "claude-sonnet-4-20250514"
    high: "o3"
```

## 程序化 API

```typescript
import {
  loadConfig,
  AgentRegistry,
  discoverSkills,
  routeModel,
  inferComplexity,
  runHealthChecks,
  render,
} from "agent-harness";

const config = await loadConfig();
const registry = new AgentRegistry(config.agents.definitions);
const agent = registry.get("executor");
const tier = routeModel(
  inferComplexity("refactor the auth module"),
  config.agents.model_routing,
);
const skills = await discoverSkills(config.skills.directories);
const report = await runHealthChecks([]);
const output = render("Hello {{name}}", { name: "World" });
```

## 内置适配器

内置适配器会自动检测项目类型，并提供默认命令和健康检查。

| 适配器 | 检测方式 | 常见命令 |
|--------|----------|----------|
| TypeScript | `tsconfig.json` 或 `package.json` | `build`、`test`、`lint` |
| Python | `pyproject.toml`、`setup.py` 或 `requirements.txt` | `test`、`lint`、`fmt` |
| Rust | `Cargo.toml` | `fmt`、`test`、`clippy`、`build` |

## Skills

Skill 是一个包含 `SKILL.md` 文件的目录，文件头使用 YAML frontmatter：

```markdown
---
name: my-skill
description: What this skill does
---

# My Skill

Usage instructions here.
```

可通过下面的命令快速创建：

```shell
agent-harness scaffold skill my-skill -d "Description of the skill"
```

## 架构概览

生成后的项目结构：

```text
.harness/
  harness.config.yaml
  skills/
AGENTS.md
```

核心源码结构：

```text
src/
  config/        Schema、默认值、分层配置加载
  agent/         Agent 注册表与模型档位路由
  adapter/       项目类型检测与语言适配器
  skill/         Skill 发现、校验、脚手架
  health/        健康检查与报告
  template/      模板渲染与文件生成
  hook/          生命周期 Hook 发现与分发
  feature/       Feature 注册表
  plugin/        插件接口与注册表
  context/       上下文组装流水线
  audit/         追加写入式审计日志
  cli/           CLI 命令实现
```

## 文档

- [`docs/getting-started.md`](./docs/getting-started.md)
- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/config-reference.md`](./docs/config-reference.md)
- [`docs/adapter-guide.md`](./docs/adapter-guide.md)
- [`docs/plugin-guide.md`](./docs/plugin-guide.md)

## License

MIT
