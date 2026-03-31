import { describe, it, expect, afterEach, vi } from "vitest";
import { getAllToolpacks, getToolpack, clearToolpackCache } from "../../../src/toolpacks/registry.js";
import { createFixture, type Fixture } from "../../helpers/mock-fs.js";

let fixture: Fixture | undefined;

afterEach(async () => {
  clearToolpackCache();
  await fixture?.cleanup();
  fixture = undefined;
});

describe("loadToolpacks cache", () => {
  it("calls discoverToolpacks only once for repeated getAllToolpacks calls", async () => {
    fixture = await createFixture({});

    // First call triggers discovery
    const result1 = getAllToolpacks(fixture.dir);
    // Second call should return cached result
    const result2 = getAllToolpacks(fixture.dir);
    const result3 = getAllToolpacks(fixture.dir);

    // All results must be referentially equal (same array from cache)
    expect(result2).toBe(result1);
    expect(result3).toBe(result1);
    expect(result1.length).toBeGreaterThan(0);
  });

  it("calls discoverToolpacks only once when mixing getAllToolpacks and getToolpack", async () => {
    fixture = await createFixture({});

    const all = getAllToolpacks(fixture.dir);
    const tp1 = getToolpack("context-mode", fixture.dir);
    const tp2 = getToolpack("rtk", fixture.dir);
    const allAgain = getAllToolpacks(fixture.dir);

    // The array from getAllToolpacks should be the same cached instance
    expect(allAgain).toBe(all);
    // getToolpack results should come from the same cached array
    expect(all.find((tp) => tp.id === "context-mode")).toBe(tp1);
    expect(all.find((tp) => tp.id === "rtk")).toBe(tp2);
  });

  it("re-scans after clearToolpackCache is called", async () => {
    fixture = await createFixture({});

    const result1 = getAllToolpacks(fixture.dir);
    clearToolpackCache();
    const result2 = getAllToolpacks(fixture.dir);

    // After clearing cache, a new array should be produced
    expect(result2).not.toBe(result1);
    // But the content should be identical
    expect(result2.map((tp) => tp.id).sort()).toEqual(result1.map((tp) => tp.id).sort());
  });

  it("maintains independent cache per cwd", async () => {
    const fixtureA = await createFixture({});
    const fixtureB = await createFixture({});

    try {
      const resultA = getAllToolpacks(fixtureA.dir);
      const resultB = getAllToolpacks(fixtureB.dir);

      // Both should return valid results
      expect(resultA.length).toBeGreaterThan(0);
      expect(resultB.length).toBeGreaterThan(0);

      // They should be different array instances (different cwd keys)
      expect(resultA).not.toBe(resultB);

      // Repeated calls to same cwd return cached instance
      expect(getAllToolpacks(fixtureA.dir)).toBe(resultA);
      expect(getAllToolpacks(fixtureB.dir)).toBe(resultB);

      // Clearing cache and calling one cwd does not affect the other
      clearToolpackCache();
      const resultAFresh = getAllToolpacks(fixtureA.dir);
      expect(resultAFresh).not.toBe(resultA);

      // fixtureB was cleared too, so it should also get a fresh result
      const resultBFresh = getAllToolpacks(fixtureB.dir);
      expect(resultBFresh).not.toBe(resultB);
    } finally {
      clearToolpackCache();
      await fixtureA.cleanup();
      await fixtureB.cleanup();
    }
  });
});
