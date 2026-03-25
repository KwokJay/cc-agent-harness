# Adapter Guide

## Overview

Project adapters provide language-specific commands and health checks. agent-harness includes built-in adapters for TypeScript, Python, and Rust projects.

## Writing a Custom Adapter

Implement the `ProjectAdapter` interface:

```typescript
import type { ProjectAdapter, CommandDefinition, HealthCheck } from "agent-harness";

export class GoAdapter implements ProjectAdapter {
  name = "go";

  async detect(cwd: string): Promise<boolean> {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    return existsSync(join(cwd, "go.mod"));
  }

  getCommands(): CommandDefinition[] {
    return [
      { name: "build", command: "go build ./...", description: "Build Go project" },
      { name: "test", command: "go test ./...", description: "Run Go tests" },
      { name: "lint", command: "golangci-lint run", description: "Run linter" },
    ];
  }

  getHealthChecks(): HealthCheck[] {
    return [
      {
        name: "go-installed",
        check: async () => {
          try {
            const { execSync } = await import("node:child_process");
            const version = execSync("go version", { stdio: "pipe" }).toString().trim();
            return { status: "pass", message: version };
          } catch {
            return { status: "fail", message: "go not found in PATH" };
          }
        },
      },
    ];
  }
}
```

## Registering a Custom Adapter

### Programmatically

```typescript
import { AdapterRegistry } from "agent-harness";
import { GoAdapter } from "./go-adapter.js";

const registry = new AdapterRegistry([new GoAdapter()]);
const adapter = await registry.detect(process.cwd());
```

### Via Plugin

```typescript
import type { HarnessPlugin } from "agent-harness";
import { GoAdapter } from "./go-adapter.js";

export const goPlugin: HarnessPlugin = {
  name: "harness-plugin-go",
  adapters: [new GoAdapter()],
};
```

## Built-in Adapters

| Adapter | Detection | Commands |
|---------|-----------|----------|
| TypeScript | `tsconfig.json` or `package.json` | build, test, lint |
| Python | `pyproject.toml`, `setup.py`, `requirements.txt` | test, lint, fmt |
| Rust | `Cargo.toml` | fmt, test, clippy, build |

## Adapter Interface

```typescript
interface ProjectAdapter {
  name: string;
  detect(cwd: string): Promise<boolean>;
  getCommands(): CommandDefinition[];
  getHealthChecks(): HealthCheck[];
}

interface CommandDefinition {
  name: string;
  command: string;
  description: string;
}

interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
}

interface HealthCheckResult {
  status: "pass" | "warn" | "fail";
  message: string;
}
```
