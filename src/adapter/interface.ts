export interface CommandDefinition {
  name: string;
  command: string;
  description: string;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
}

export interface HealthCheckResult {
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface ProjectAdapter {
  name: string;
  detect(cwd: string): Promise<boolean>;
  getCommands(): CommandDefinition[];
  getHealthChecks(): HealthCheck[];
}
