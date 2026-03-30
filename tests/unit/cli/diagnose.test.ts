import { describe, it, expect, afterEach, vi } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { runDiagnose } from "../../../src/cli/diagnose.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";
import { materializeCanonicalScaffold } from "../../helpers/materialize-scaffold.js";

function validConfig(): string {
  return `
project:
  name: demo
  type: backend
  language: typescript
tools:
  - cursor
workflows:
  commands:
    lint: echo ok
  verification:
    checks:
      - lint
custom_rules: []
`;
}

describe("runDiagnose", () => {
  let fx: Fixture | undefined;

  afterEach(async () => {
    vi.restoreAllMocks();
    await fx?.cleanup();
    fx = undefined;
  });

  it("json output has no errors for minimal valid project", async () => {
    fx = await createFixture({
      ".harness/config.yaml": validConfig(),
    });
    await materializeCanonicalScaffold(fx.dir);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runDiagnose({ json: true, cwd: fx.dir });
    expect(log).toHaveBeenCalled();
    const raw = log.mock.calls[0][0] as string;
    const report = JSON.parse(raw) as { summary: { error: number } };
    expect(report.summary.error).toBe(0);
  });

  it("reports invalid mcp.json", async () => {
    fx = await createFixture({
      ".harness/config.yaml": validConfig(),
    });
    await materializeCanonicalScaffold(fx.dir);
    const mcpPath = `${fx.dir}/.cursor/mcp.json`;
    mkdirSync(dirname(mcpPath), { recursive: true });
    writeFileSync(mcpPath, "{ not json", "utf-8");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runDiagnose({ json: true, cwd: fx.dir });
    const raw = log.mock.calls[0][0] as string;
    const report = JSON.parse(raw) as { issues: { id: string; severity: string }[] };
    expect(report.issues.some((i) => i.id === "mcp-json.invalid" && i.severity === "error")).toBe(true);
  });

  it("skips MCP JSON validation when cursor is not a configured harness tool", async () => {
    fx = await createFixture({
      ".harness/config.yaml": `
project:
  name: demo
  type: backend
  language: typescript
tools:
  - claude-code
workflows:
  commands:
    lint: echo ok
  verification:
    checks:
      - lint
custom_rules: []
`,
    });
    await materializeCanonicalScaffold(fx.dir);
    const mcpPath = `${fx.dir}/.cursor/mcp.json`;
    mkdirSync(dirname(mcpPath), { recursive: true });
    writeFileSync(mcpPath, "{ not json", "utf-8");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runDiagnose({ json: true, cwd: fx.dir });
    const raw = log.mock.calls[0][0] as string;
    const report = JSON.parse(raw) as { issues: { id: string; severity: string }[]; summary: { error: number } };
    expect(report.issues.some((i) => i.id === "mcp-json.skip-capability")).toBe(true);
    expect(report.issues.some((i) => i.id === "mcp-json.invalid")).toBe(false);
    expect(report.summary.error).toBe(0);
  });

  it("reports missing verification command", async () => {
    const brokenVerificationConfig = `
project:
  name: demo
  type: backend
  language: typescript
tools:
  - cursor
workflows:
  commands: {}
  verification:
    checks:
      - lint
custom_rules: []
`;
    fx = await createFixture({
      ".harness/config.yaml": brokenVerificationConfig,
    });
    await materializeCanonicalScaffold(fx.dir);
    // materialize overwrites config with resolver defaults; restore broken wiring for this assertion
    writeFileSync(`${fx.dir}/.harness/config.yaml`, brokenVerificationConfig, "utf-8");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runDiagnose({ json: true, cwd: fx.dir });
    const raw = log.mock.calls[0][0] as string;
    const report = JSON.parse(raw) as { summary: { error: number } };
    expect(report.summary.error).toBeGreaterThan(0);
  });

  it("json report includes drift issue when a generated file is modified", async () => {
    fx = await createFixture({
      ".harness/config.yaml": validConfig(),
    });
    await materializeCanonicalScaffold(fx.dir);
    const mdcPath = `${fx.dir}/.cursor/rules/project.mdc`;
    const before = readFileSync(mdcPath, "utf-8");
    writeFileSync(mdcPath, `${before}\n<!-- drift -->\n`, "utf-8");

    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runDiagnose({ json: true, cwd: fx.dir });
    const raw = log.mock.calls[0][0] as string;
    const report = JSON.parse(raw) as { issues: { id: string; severity: string }[] };
    expect(report.issues.some((i) => i.id === "drift..cursor/rules/project.mdc")).toBe(true);
  });
});
