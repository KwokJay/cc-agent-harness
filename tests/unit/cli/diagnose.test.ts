import { describe, it, expect, afterEach, vi } from "vitest";
import { runDiagnose } from "../../../src/cli/diagnose.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";

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
      ".cursor/mcp.json": "{ not json",
    });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runDiagnose({ json: true, cwd: fx.dir });
    const raw = log.mock.calls[0][0] as string;
    const report = JSON.parse(raw) as { issues: { id: string; severity: string }[] };
    expect(report.issues.some((i) => i.id === "mcp-json.invalid" && i.severity === "error")).toBe(true);
  });

  it("reports missing verification command", async () => {
    fx = await createFixture({
      ".harness/config.yaml": `
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
`,
    });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runDiagnose({ json: true, cwd: fx.dir });
    const raw = log.mock.calls[0][0] as string;
    const report = JSON.parse(raw) as { summary: { error: number } };
    expect(report.summary.error).toBeGreaterThan(0);
  });
});
