import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

export interface Fixture {
  dir: string;
  cleanup: () => Promise<void>;
}

export async function createFixture(
  files: Record<string, string>,
): Promise<Fixture> {
  const dir = await mkdtemp(join(tmpdir(), "harness-test-"));
  for (const [path, content] of Object.entries(files)) {
    const abs = join(dir, path);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, content, "utf-8");
  }
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}
