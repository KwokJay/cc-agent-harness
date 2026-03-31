import { describe, it, expect, afterEach } from "vitest";
import { discoverToolpacks } from "../../../src/toolpacks/discovery.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";
import { loadBuiltinToolpacks } from "../../../src/toolpacks/builtin/index.js";
import { resolveToolpackProvenance } from "../../../src/toolpacks/official.js";
import { getToolpack, clearToolpackCache } from "../../../src/toolpacks/registry.js";

let fixture: Fixture | undefined;

afterEach(async () => {
  clearToolpackCache();
  await fixture?.cleanup();
  fixture = undefined;
});

describe("loadBuiltinToolpacks", () => {
  it("returns 4 builtin plugins", () => {
    const plugins = loadBuiltinToolpacks();
    expect(plugins.length).toBe(4);
    const ids = plugins.map((p) => p.id);
    expect(ids).toContain("context-mode");
    expect(ids).toContain("rtk");
    expect(ids).toContain("understand-anything");
    expect(ids).toContain("gstack");
  });

  it("all builtins have source=builtin", () => {
    const plugins = loadBuiltinToolpacks();
    for (const p of plugins) {
      expect(p.source).toBe("builtin");
    }
  });

  it("all builtins have version strings", () => {
    const plugins = loadBuiltinToolpacks();
    for (const p of plugins) {
      expect(typeof p.version).toBe("string");
      expect(p.version.length).toBeGreaterThan(0);
    }
  });

  it("official builtins resolve provenance to official", () => {
    const plugins = loadBuiltinToolpacks();
    for (const p of plugins) {
      expect(resolveToolpackProvenance(p)).toBe("official");
    }
  });

  it("registry exposes provenance for builtins", async () => {
    fixture = await createFixture({});
    for (const id of ["context-mode", "rtk", "understand-anything", "gstack"]) {
      const tp = getToolpack(id, fixture.dir);
      expect(tp?.provenance).toBe("official");
    }
  });

  it("builtins are not sharedPolicy by default", async () => {
    fixture = await createFixture({});
    for (const id of ["context-mode", "rtk", "understand-anything", "gstack"]) {
      const tp = getToolpack(id, fixture.dir);
      expect(tp?.sharedPolicy).toBe(false);
    }
  });
});

describe("discoverToolpacks", () => {
  it("returns builtins when no local toolpacks exist", async () => {
    fixture = await createFixture({});
    const plugins = discoverToolpacks(fixture.dir);
    expect(plugins.length).toBe(4);
  });

  it("discovers local toolpacks from .harness/toolpacks/", async () => {
    fixture = await createFixture({
      ".harness/toolpacks/my-pack/plugin.json": JSON.stringify({
        id: "my-pack",
        name: "My Pack",
        description: "A custom toolpack",
        category: "analysis",
        version: "1.0.0",
      }),
    });
    const plugins = discoverToolpacks(fixture.dir);
    expect(plugins.length).toBe(5);
    const local = plugins.find((p) => p.id === "my-pack");
    expect(local).toBeDefined();
    expect(local!.source).toBe("local");
    expect(local!.name).toBe("My Pack");
  });

  it("skips invalid plugin.json files", async () => {
    fixture = await createFixture({
      ".harness/toolpacks/bad-pack/plugin.json": "not valid json{{{",
    });
    const plugins = discoverToolpacks(fixture.dir);
    expect(plugins.length).toBe(4);
  });

  it("skips plugin.json missing required fields", async () => {
    fixture = await createFixture({
      ".harness/toolpacks/incomplete/plugin.json": JSON.stringify({
        description: "Missing id and name",
      }),
    });
    const plugins = discoverToolpacks(fixture.dir);
    expect(plugins.length).toBe(4);
  });

  it("discovers npm toolpack from node_modules/@agent-harness/toolpack-*", async () => {
    const pluginCjs = [
      "module.exports = {",
      "  id: 'npm-demo',",
      "  name: 'Npm Demo',",
      "  description: 'from npm',",
      "  category: 'engineering-support',",
      "  version: '2.0.0',",
      "  relevantTools: ['cursor'],",
      "  generateFiles() { return []; },",
      "};",
    ].join("\n");

    fixture = await createFixture({
      "node_modules/@agent-harness/toolpack-npm-demo/package.json": JSON.stringify({
        name: "@agent-harness/toolpack-npm-demo",
        version: "2.0.0",
        main: "./plugin.cjs",
        "agent-harness": {
          toolpack: { id: "npm-demo", main: "./plugin.cjs" },
        },
      }),
      "node_modules/@agent-harness/toolpack-npm-demo/plugin.cjs": pluginCjs,
    });

    const plugins = discoverToolpacks(fixture.dir);
    expect(plugins.length).toBe(5);
    const npm = plugins.find((p) => p.id === "npm-demo");
    expect(npm).toBeDefined();
    expect(npm!.source).toBe("npm");
    expect(npm!.npmPackage).toBe("@agent-harness/toolpack-npm-demo");
    expect(resolveToolpackProvenance(npm!)).toBe("community");
  });
});
