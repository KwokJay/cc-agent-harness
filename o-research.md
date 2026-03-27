# cc-agent-harness 深度调研

## 1. 一句话定义

`cc-agent-harness` 不是一个运行中的 agent 平台，而是一个**静态 Harness 编译器**：它读取当前项目的技术特征与用户选择的 AI 工具，然后生成一组跨工具一致、各工具原生可消费的规则文件、技能文件、配置文件和工作流文档。

源码证据：
- CLI 入口：`bin/harness.ts`
- 计划编排中心：`src/scaffold/resolver.ts`
- 写盘执行中心：`src/scaffold/generator.ts`

---

## 2. 当前版本实际提供的能力

根据 `bin/harness.ts` 与 `package.json`，当前仓库实际实现的 CLI 能力是：

1. `harn init`
2. `harn doctor`
3. `harn verify`
4. `harn mcp merge [name]`
5. `harn update`
6. `harn list tools|projects|toolpacks`

对应实现：
- `init` → `src/cli/init.ts`
- `doctor` → `src/cli/doctor.ts`
- `verify` → `src/cli/verify.ts`
- `mcp merge` → `src/cli/mcp.ts`
- `update` → `src/cli/update.ts`
- `list` 逻辑直接写在 `bin/harness.ts`

当前仓库**没有**实现 `diagnose`、`manifest`、`export`、`migrate` 这些命令；它们只出现在 `PHASE4_PLAN.md` 等路线图文档里，属于未来规划，不属于现状实现。

---

## 3. 系统目标与产品边界

`package.json` 对项目的描述是：

> Harness scaffold tool — initialize AI-assisted development environments for any project type and AI coding tool.

结合 `README.md`、`README.zh-CN.md` 与源码，系统目标可以拆成四层：

### 3.1 项目识别

自动判断当前仓库更像：
- frontend
- backend
- fullstack
- monorepo
- docs

并进一步判断语言、框架、workspace 子项目。

核心实现：`src/project-types/scanner.ts`

### 3.2 统一语义建模

把“项目类型、默认命令、验证项、技能、规则、工具选择”统一建模成一份中间计划，再把这份计划投影到不同 AI 工具的原生文件格式中。

核心实现：
- `src/project-types/types.ts`
- `src/tool-adapters/types.ts`
- `src/scaffold/resolver.ts`

### 3.3 生成 Harness 文件

生成：
- `AGENTS.md`
- `.harness/config.yaml`
- `.harness/skills/*`
- `.harness/workflows/*`
- 各工具的规则/技能文件
- `CHANGELOG.md`
- 文档占位目录

### 3.4 可选 AI 深度技能提取

先做静态分析，再调用本地 AI CLI（优先 Claude Code / Codex）执行更深一层的技能提取。

实现：`src/skill-extraction/invoker.ts`

### 3.5 明确不做的事

它不会：
- 常驻后台运行
- 维护 agent 会话状态机
- 自动编排多 agent 执行真实任务

这点在模板文档里写得很清楚：
- `src/templates/workflows/ralph-loop.ts`
- `src/templates/workflows/multi-agent-patterns.ts`

这些文件生成的是**工作流说明文档**，不是运行时执行引擎。

---

## 4. 顶层架构图

系统可以理解为 6 个层次：

1. **CLI 层**：命令注册和参数入口
2. **项目检测层**：识别项目类型、语言、框架、子项目
3. **计划编排层**：组装统一的 `ResolvedPlan`
4. **投影生成层**：为不同工具产出原生文件
5. **写盘与合并层**：把计划落地到磁盘
6. **后生命周期层**：verify / doctor / update / mcp merge

对应目录：
- `bin/`
- `src/cli/`
- `src/project-types/`
- `src/scaffold/`
- `src/tool-adapters/`
- `src/skill-extraction/`
- `src/toolpacks/`
- `src/mcp/`
- `src/config/`
- `src/template/`
- `src/templates/`

---

## 5. 主执行路径：从命令到文件

## 5.1 CLI 入口

`bin/harness.ts` 使用 `commander` 注册所有命令。设计上有一个明显特征：

- 入口很薄
- 真正逻辑全部延迟 `import()` 到 `src/cli/*`

这样做的好处：
- 启动成本低
- 顶层命令表很清楚
- 具体逻辑可以独立测试

---

## 5.2 `init` 流程

入口：`src/cli/init.ts`

完整流程：

1. 判断是否交互模式
2. 自动检测项目类型：`detectProjectType(cwd)`
3. 交互模式下用 `@inquirer/prompts` 询问：
   - 项目名
   - 项目类型
   - AI 工具
   - optional toolpacks
4. 调用 `resolve()` 生成完整计划
5. 调用 `generateFiles()` 把文件写到磁盘
6. 调用 `invokeSkillExtraction()` 做 AI 深度技能提取
7. 最后运行 `runLightDoctor()` 做轻量体检

关键代码：
- 检测：`src/cli/init.ts:36`
- 计划生成：`src/cli/init.ts:125-132`
- 写盘：`src/cli/init.ts:138-141`
- AI 提取：`src/cli/init.ts:173-193`

### 复杂点

`init` 不是简单“套模板”，而是一个编排流水线：

- 先检测项目
- 再构造统一计划
- 再投影到多工具
- 再补 AI 提取

这使得它更接近“编译”而不是“复制脚手架”。

---

## 5.3 `resolve()`：真正的架构中心

入口：`src/scaffold/resolver.ts`

`resolve()` 做的事最多，是全系统的中心函数。

它按顺序完成：

1. 得到 `project`
   - 如果用户显式指定项目类型，就走对应适配器
   - 否则自动检测
2. 获取该项目类型的：
   - 默认命令 `commands`
   - 默认验证项 `verificationChecks`
   - 默认自定义规则 `customRules`
3. 运行静态分析：`analyzeProject()`
4. 生成 `AGENTS.md`
5. 组装 `ToolAdapterContext`
6. 对每个工具调用 `toolAdapter.generate(ctx)`
7. 生成 Harness 自己的文件：
   - `.harness/config.yaml`
   - workflows 文档
   - recommended tools 文档
   - state 文件
   - skill creator
   - extraction guide
   - changelog
   - docs scaffold
   - toolpack 生成物
8. 把所有路径汇总进 `generated_files`

换句话说，`resolve()` 把大量分散的模块折叠成一个统一中间结果：

```ts
ResolvedPlan {
  project,
  tools,
  commands,
  verificationChecks,
  customRules,
  skills,
  files
}
```

这也是全系统最值得优先读懂的文件。

---

## 5.4 `generateFiles()`：写盘层不是 dumb write

入口：`src/scaffold/generator.ts`

它的职责不是“逐个写文件”这么简单，而是：

1. 判断文件是否已存在
2. 判断是不是 `.harness/skills/*/SKILL.md`
3. 如果是技能文件，则走专门的 merge 协议
4. 如果是普通文件：
   - `incremental` 模式：内容不同就更新
   - `full` 模式：直接覆盖
5. 汇总 `created / updated / unchanged / skipped / mergeApplied / mergeSkipped`

### 关键事实

只有 `.harness/skills/*/SKILL.md` 会进入专门的技能合并逻辑。

实现证据：
- 路径判断：`src/skill-extraction/skill-build.ts`
- 合并调用：`src/scaffold/generator.ts:51-71`

这意味着：

> 非 skill 文件并没有“保留人工改动”的 merge 保护；`update` 下只要内容不同，就会更新。

这是理解系统安全边界的关键。

---

## 5.5 `verify`：验证协议的执行器

入口：`src/cli/verify.ts`

它从 `.harness/config.yaml` 读取：

- `workflows.commands`
- `workflows.verification.checks`

然后按顺序执行：

1. 读取 config
2. 取出 checks 列表
3. 把 check 名映射成具体命令
4. 使用 `spawnSync(cmd, { shell: true, stdio: "inherit" })` 顺序执行
5. 记录失败项
6. 写入 `.harness/state/last-verify.json`

写入的状态包括：
- `timestamp`
- `ok`
- `failedChecks`
- `harnessVersion`
- `results`

这使 `doctor` 能检查“上次 verify 是否通过、是否过期”。

### 一个重要设计优点

验证命令不是写死在代码里，而是由 config 驱动。这样：

- 项目类型适配器提供默认命令
- config 保存最终事实源
- verify 负责执行
- 文档模板也可以复用同一组命令

这保证了“文档说什么”和“CLI 跑什么”有机会保持一致。

---

## 5.6 `doctor`：当前状态审计器

入口：`src/cli/doctor.ts`

`doctor` 不会重建计划，而是直接检查当前文件系统状态。

它检查的内容包括：

1. `.harness/config.yaml` 是否存在
2. `AGENTS.md` 是否存在
3. config 是否合法
4. 各已选工具的关键文件是否存在
5. `.harness/skills/` 下是否存在技能
6. 技能是否被正确分发到工具路径
7. 手动技能是否缺失分发
8. 技能是否有 version 元数据
9. `last-verify.json` 是否存在、是否失败、是否过期

这里最有价值的地方是：

它从“生成是否做过”升级到“生成结果是否还自洽”。

---

## 5.7 `update`：重新编译当前 Harness

入口：`src/cli/update.ts`

逻辑：

1. 读取 `.harness/config.yaml`
2. 从 config 中恢复：
   - projectName
   - projectType
   - tools
   - toolpacks
   - skipDocs
3. 再次调用 `resolveScaffold()`
4. 可选 dry-run 下用 `diffPlan()` 提示哪些旧文件已不在新 plan 中
5. 调用 `generateFiles()` 进行增量或全量写盘

### 关键边界

`generated_files` 在当前实现里更像：

- “上一次生成清单”

而不是：

- “自动垃圾回收 ownership engine”

因为系统只会在 `--dry-run` 时提示 removed，不会自动删除旧文件。

这是一个很克制的设计：避免误删，但也会积累陈旧文件。

---

## 5.8 `mcp merge`：半独立的外部状态管理

入口：
- CLI：`src/cli/mcp.ts`
- 纯逻辑：`src/mcp/cursor-mcp.ts`

它的作用非常聚焦：

- 读取 JSON 输入（stdin / file / inline）
- 解析目标 server name
- 读取当前 `.cursor/mcp.json`
- 将 server 以 shallow merge 方式写回

这里有一个重要的架构特征：

`.cursor/mcp.json` 不归 `.harness/config.yaml` 管，它是一个独立的外部状态文件。

因此 MCP 管理虽然是 CLI 的一部分，但在状态模型里是半脱离 Harness config 的。

---

## 6. 共享中间模型：系统真正的稳定轴心

如果只看模板，很容易把这个项目理解成“很多模板 + 很多 if/else”。

但真正稳定的骨架是这几组共享类型：

### 6.1 `DetectedProject`

来自 `src/project-types/types.ts`

它统一表达：
- type
- language
- framework
- signals
- subProjects

### 6.2 `WorkflowCommands`

表达默认命令体系，例如：
- build
- test
- lint
- dev

### 6.3 `ToolAdapterContext`

来自 `src/tool-adapters/types.ts`

它包含：
- 项目名称
- 项目检测结果
- `AGENTS.md` 内容
- commands
- verificationChecks
- customRules
- skills
- skillContents

各工具适配器都基于这一个上下文生成自己的原生文件。

### 6.4 `GeneratedFile`

这是最基础的输出 IR：

```ts
{ path, content, description, source?, harnessSkillSource? }
```

`resolver()` 的本质，就是不断构造 `GeneratedFile[]`。

---

## 7. 项目检测系统：为什么它比看起来复杂

核心文件：`src/project-types/scanner.ts`

它不是只看 root `package.json`，而是一个分层检测器。

### 7.1 顶层流程

1. 判断是否 workspace root
2. 扫描 workspace package dirs
3. 如果是 workspace 且有多个子项目：
   - frontend + backend → fullstack
   - 否则 monorepo
4. 如果子项目数量 >= 2：
   - 也可能推断为 fullstack / monorepo
5. 否则再做单项目检测
6. 都失败则默认 backend + unknown

### 7.2 单项目检测信号

支持的信号很多，包括：
- `package.json`
- `pyproject.toml`
- `requirements.txt`
- `go.mod`
- `Cargo.toml`
- `pom.xml`
- `build.gradle`
- `Package.swift`
- `mix.exs`
- `pubspec.yaml`
- `Gemfile`
- `composer.json`
- `build.zig`
- docs framework 配置

### 7.3 复杂点

复杂点不在“支持语言多”，而在：

- workspace 检测
- 子项目聚合判断
- root 与 subproject 的优先级
- 没有明确 workspace 配置时，会退化为目录扫描

这让它在 monorepo/fullstack 场景下很有用，但也意味着启发式误判是潜在风险。

---

## 8. Tool Adapter 系统：统一语义，多工具投影

核心文件：
- `src/tool-adapters/types.ts`
- `src/tool-adapters/index.ts`

当前支持的工具：
- cursor
- claude-code
- copilot
- codex
- opencode
- windsurf
- trae
- augment

### 8.1 设计模式

这是一个典型的 adapter registry：

- `listToolAdapters()` 返回所有适配器
- `getToolAdapter(id)` 找到一个适配器
- 每个适配器都实现 `generate(ctx)`

### 8.2 典型投影

例如：

#### Claude Code
- `CLAUDE.md`
- `.claude/commands/verify.md`
- `.claude/skills/{name}/SKILL.md`

实现：`src/tool-adapters/claude-code.ts`

#### Cursor
- `.cursor/rules/project.mdc`
- `.cursor/rules/coding.mdc`
- `.cursor/rules/skill-{name}.mdc`

实现：`src/tool-adapters/cursor.ts`

#### Codex
- `.codex/config.toml`
- `.agents/skills/{name}/SKILL.md`

实现：`src/tool-adapters/codex.ts`

### 8.3 为什么这个层很重要

这一层的价值是把“同一套 Harness 语义”映射到不同工具生态里，而不是每个工具自己维护一套完全不同的逻辑。

这也是系统能支持多工具的一条主轴。

---

## 9. 技能系统：最复杂、最值得研究的部分

核心文件：
- `src/skill-extraction/analyzer.ts`
- `src/skill-extraction/parser.ts`
- `src/skill-extraction/merger.ts`
- `src/skill-extraction/skill-build.ts`
- `src/skill-extraction/invoker.ts`

### 9.1 两阶段技能提取

#### 阶段一：静态分析

`analyzeProject()` 会从这些维度提取技能：

1. 依赖
2. 目录结构
3. 配置文件
4. 测试模式

它会生成：
- 一组 `.harness/skills/{name}/SKILL.md`
- `.harness/skills/PROJECT-ANALYSIS.md`
- `.harness/skills/INDEX.md`
- `.harness/skills/EXTRACTION-TASK.md`

#### 阶段二：AI 深度提取

`invokeSkillExtraction()` 会根据优先级尝试本地 CLI：

- `claude`
- `codex`

源码里虽然有 cursor/copilot/opencode 的优先级位，但当前实现并没有为它们生成可执行命令。

### 9.2 技能文件不是普通 Markdown

`SKILL.md` 的 frontmatter 包含系统状态：

- `name`
- `description`
- `version`
- `source`
- `generated_at`
- `harness_version`
- `body_hash`

这说明 skill 文件承担双重角色：

1. 人类可读文档
2. merge 状态机元数据

### 9.3 `mergeSkill()` 的核心规则

规则总结：

1. 没有 existing → create
2. `overwrite` 策略 → update
3. existing.source = `manual` → 永远 skip
4. existing.source = `ai-extraction` → 只有新版本更高才 update
5. existing.source = `preset/static-analysis` 且 body_hash 不一致 → 视为手工编辑，skip
6. 其他情况 → update 并递增版本

### 9.4 最关键的隐性复杂度

当前系统把 `.harness/skills` 视为“技能源目录”，但 `resolve()` 真正分发到工具的 `skillContents` 只来自：

- preset skill
- 本次静态分析得到的 skill

而不是“读取磁盘上现有 `.harness/skills/*` 作为统一源”。

这意味着：

- 新增或手改的 skill 可以存在于 `.harness/skills`
- `doctor` 可以检查到它们未分发
- 但 `update` 不一定会把它们真正同步到各工具原生目录

这是系统目前最值得注意的架构裂缝。

---

## 10. 配置、状态与所有权模型

### 10.1 主配置：`.harness/config.yaml`

schema 定义在 `src/config/schema.ts`。

它保存：
- project
- tools
- workflows.commands
- workflows.verification.checks
- custom_rules
- toolpacks
- skip_docs
- generated_files

### 10.2 本地状态：`.harness/state/`

当前实现明确落地两个状态：

- `harness-version.txt`
- `last-verify.json`

### 10.3 技能状态：`.harness/skills/*/SKILL.md`

这是唯一有专门 merge 协议的文件族。

### 10.4 工具原生文件：派生物

例如：
- `CLAUDE.md`
- `.cursor/rules/*`
- `.agents/skills/*`
- `.github/...`

它们都不是主事实源，而是从统一上下文投影出来的派生文件。

### 10.5 MCP 配置：外部半独立状态

`.cursor/mcp.json` 不受 `.harness/config.yaml` 统一管理，只通过 `mcp merge` 单独读写。

---

## 11. Toolpack 系统：扩展机制与局限

核心文件：
- `src/toolpacks/plugin.ts`
- `src/toolpacks/discovery.ts`
- `src/toolpacks/registry.ts`
- `src/toolpacks/builtin/*`

### 11.1 三种来源

1. builtin
2. npm
3. local

优先级：

`local > npm > builtin`

因为 discovery 最后执行的是 `mergeToolpackById(builtin, npm, local)`。

### 11.2 内置 toolpacks

当前内置：
- context-mode
- rtk
- understand-anything
- gstack

### 11.3 一个真实局限

local toolpack 当前只支持元数据发现，`generateFiles()` 返回空数组；也就是说它更像“注册占位”，不是完整可执行插件。

### 11.4 另一个语义缝隙

npm toolpack 的发现依赖 `cwd/node_modules`，但 registry 生成的安装命令会给出 `npm install -g ...` 一类命令。这会造成“文档说装好了”和“当前项目实际能否发现到”之间的错位。

---

## 12. 模板引擎：轻量但足够用

实现：`src/template/engine.ts`

支持能力：
- `{{var}}`
- `{{#if ...}}`
- `{{#each ...}}`
- `{{> partial}}`

它不是完整的 Handlebars，但足以支持当前模板体系。

优点：
- 无额外重依赖
- 逻辑可控
- 适合 CLI 工具

局限：
- frontmatter/模板能力都比较朴素
- 复杂模板语义会比较难演进

---

## 13. 当前架构里最优雅的地方

### 13.1 单一验证事实源

`workflows.commands + workflows.verification.checks` 同时支撑：
- runtime verify
- 生成的验证文档
- 工作流说明文档

这减少了漂移。

### 13.2 共享上下文 + 多工具投影

`ToolAdapterContext` 让多工具支持变得结构化，而不是散乱的 if/else。

### 13.3 文件型状态足够轻

没有引入数据库、守护进程、复杂缓存，符合一个 CLI scaffold 的合理边界。

### 13.4 更新足够克制

`generated_files` 只用于提示 removed，不会自动删除，降低了误删风险。

---

## 14. 当前架构里最脆弱的地方

### 14.1 技能源与工具分发源不完全一致

这是最大的结构性风险。

### 14.2 `update` 对非 skill 文件的覆盖边界不直观

很多用户可能会误以为 incremental 等于“保守保留人工改动”，但实际上不是。

### 14.3 项目检测启发式较重

在复杂 monorepo、demo 仓库、混合目录下，误判是有可能的。

### 14.4 parser/模板都偏轻量

短期足够，长期若要支持更复杂元数据和模板结构，演进空间有限。

---

## 15. 测试与质量保障

测试目录：`tests/`

### 15.1 单元测试

覆盖的关键点非常对路：

- `tests/unit/project-types/scanner.test.ts`
- `tests/unit/scaffold/resolver.test.ts`
- `tests/unit/scaffold/generator.test.ts`
- `tests/unit/scaffold/generator-incremental.test.ts`
- `tests/unit/scaffold/generator-merge.test.ts`
- `tests/unit/skill-extraction/parser.test.ts`
- `tests/unit/skill-extraction/merger.test.ts`
- `tests/unit/skill-extraction/analyzer.test.ts`
- `tests/unit/toolpacks/discovery.test.ts`
- `tests/unit/cli/verify.test.ts`
- `tests/unit/cli/mcp-merge.test.ts`
- `tests/unit/template/engine.test.ts`

这些测试基本覆盖了：
- 检测
- 计划生成
- 写盘
- 技能合并
- toolpack 发现
- verify
- MCP merge
- 模板渲染

### 15.2 E2E 测试

`tests/e2e/cli-smoke.test.ts` 覆盖：

- init
- doctor
- update --dry-run
- verify

这条链路很重要，因为它验证的正是“初始化后系统能否形成闭环”。

### 15.3 工程门禁

`package.json` 与 `CONTRIBUTING.md` 明确给出了门禁：

- `pnpm lint`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm agent-review`

CI 也直接跑 `pnpm agent-review`。

---

## 16. 路线图：现状与未来的清晰分界

现状实现主要对应 README 里已经落地的能力，以及 `Phase 2/3` 文档中较早阶段内容。

从路线图看，未来演进方向是：

### Phase 2
- skill merge 真正进入生成管线
- verify CLI
- dry-run diff
- 更强测试与覆盖率

### Phase 3
- MCP/toolpack 生态
- verify 结果持久化
- Ralph / 多 agent 相关生成物
- 更强 monorepo 支持

### Phase 4
- manifest
- diagnose
- migrate
- v1.0 产品化

因此阅读代码时要始终区分：

- **已经实现的源码行为**
- **路线图里规划但尚未实现的能力**

这份区分非常重要，否则很容易把计划文档误读成现状能力。

---

## 17. 推荐阅读顺序

如果要真正吃透这个仓库，建议按下面顺序读：

1. `bin/harness.ts`
2. `src/cli/init.ts`
3. `src/scaffold/resolver.ts`
4. `src/scaffold/generator.ts`
5. `src/project-types/scanner.ts`
6. `src/tool-adapters/types.ts`
7. `src/tool-adapters/claude-code.ts` / `cursor.ts` / `codex.ts`
8. `src/skill-extraction/parser.ts`
9. `src/skill-extraction/merger.ts`
10. `src/skill-extraction/analyzer.ts`
11. `src/toolpacks/discovery.ts`
12. `src/cli/verify.ts`
13. `src/cli/doctor.ts`

然后再回头看：

- `README.md`
- `CONTRIBUTING.md`
- `PHASE2_PLAN.md`
- `PHASE3_PLAN.md`
- `PHASE4_PLAN.md`

这样能把“现状实现”和“未来方向”接起来。

---

## 18. 最终判断

`cc-agent-harness` 的本质，不是“一个会替你干活的 AI 系统”，而是“一个把项目上下文编译成 AI 工具可消费约束与技能的静态分发系统”。

它真正复杂的地方，不在命令数量，而在：

1. **项目检测的启发式聚合**
2. **共享语义到多工具原生格式的投影**
3. **skill 文件的状态与合并协议**
4. **verify / doctor / update 之间的生命周期闭环**
5. **技能源、派生文件、外部状态之间的所有权边界**

从工程成熟度看，这个系统已经明显超过“简单脚手架模板仓库”的级别；但离“完全闭环、语义统一、可无歧义扩展”的产品化形态，还有一些关键边角需要继续收敛，尤其是 skill 分发语义与扩展发现语义。

---

*本文基于仓库 `/Users/kay/DevWorks/workspace/harness-workspace/cc-agent-harness` 中当前可读源码、测试与路线图文档整理而成。*
