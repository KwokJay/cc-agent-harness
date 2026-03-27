import { loadHarnessConfig } from "../../config/load-harness-config.js";
import type { DiagnoseCheck, DiagnoseIssue } from "../types.js";

export const configYamlCheck: DiagnoseCheck = {
  id: "config",
  description: "Parse and validate .harness/config.yaml",
  async run(ctx): Promise<DiagnoseIssue[]> {
    const loaded = loadHarnessConfig(ctx.cwd);
    if (!loaded.valid) {
      return [
        {
          id: "config.invalid",
          severity: "error",
          message: "Harness config is missing or invalid",
          details: loaded.errors.join("\n"),
        },
      ];
    }
    return [{ id: "config.ok", severity: "info", message: ".harness/config.yaml is valid" }];
  },
};
