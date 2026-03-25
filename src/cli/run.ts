import { execSync } from "node:child_process";
import { HarnessRuntime } from "../runtime/harness.js";

export async function runTask(taskName: string): Promise<void> {
  const runtime = await HarnessRuntime.create({ requireProjectConfig: true });
  const task = runtime.getTask(taskName);

  if (!task) {
    console.error(`Unknown task: "${taskName}"`);
    console.error("\nAvailable tasks:");
    for (const availableTask of runtime.listTasks()) {
      console.error(
        `  ${availableTask.name}: ${availableTask.command} [${availableTask.source}]`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Running "${task.name}": ${task.command}\n`);

  try {
    execSync(task.command, { cwd: runtime.cwd, stdio: "inherit", timeout: 300_000 });
    await runtime.log("verify", `Task "${task.name}" passed`, {
      task: task.name,
      command: task.command,
      source: task.source,
    });
  } catch {
    await runtime.log("verify", `Task "${task.name}" failed`, {
      task: task.name,
      command: task.command,
      source: task.source,
    });
    process.exitCode = 1;
  }
}
