import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { GeneratedFile } from "../tool-adapters/types.js";

type ChangeCategory = "added" | "changed" | "fixed" | "refactored" | "docs" | "config" | "other";

interface ParsedCommit {
  hash: string;
  date: string;
  subject: string;
  category: ChangeCategory;
}

interface ChangeGroup {
  label: string;
  date: string;
  entries: Map<ChangeCategory, string[]>;
}

const CATEGORY_LABELS: Record<ChangeCategory, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  refactored: "Refactored",
  docs: "Documentation",
  config: "Configuration",
  other: "Other",
};

const NOISE_PATTERNS = [
  /^merge\s/i,
  /^wip\b/i,
  /^fixup\b/i,
  /^squash\b/i,
  /^temp\b/i,
  /^tmp\b/i,
  /^todo\b/i,
  /^xxx\b/i,
  /^\.$/,
  /^[a-f0-9]{7,40}$/,
  /^update$/i,
  /^fix$/i,
  /^changes$/i,
  /^commit$/i,
  /^save$/i,
  /^\.\.\.$/,
];

export function generateChangelog(cwd: string, projectName: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  const hasGit = existsSync(join(cwd, ".git"));
  if (!hasGit) {
    files.push({
      path: "CHANGELOG.md",
      content: emptyChangelog(projectName),
      description: "Changelog (no git history)",
    });
  } else {
    const commits = readGitLog(cwd);
    if (commits.length === 0) {
      files.push({
        path: "CHANGELOG.md",
        content: emptyChangelog(projectName),
        description: "Changelog (no commits)",
      });
    } else {
      files.push({
        path: "CHANGELOG.md",
        content: buildChangelogFromHistory(projectName, commits, cwd),
        description: "Changelog (auto-generated from git history)",
      });
    }
  }

  files.push({
    path: ".harness/skills/changelog-governance/SKILL.md",
    content: changelogGovernanceSkill(projectName),
    description: "Skill: changelog maintenance governance",
  });

  return files;
}

export function getChangelogConstraintParagraph(): string {
  return [
    "## Changelog Rules",
    "",
    "This project maintains a `CHANGELOG.md` at the repository root.",
    "",
    "After completing any meaningful change (feature, fix, refactor, config change):",
    "1. Update `CHANGELOG.md` under the `[Unreleased]` section",
    "2. Place the entry under the correct category: Added / Changed / Fixed / Refactored / Documentation / Configuration",
    "3. Write a concise, human-readable summary (not a raw commit message)",
    "4. When releasing a version, move `[Unreleased]` entries to a new version heading with the date",
    "",
    "Do NOT skip changelog updates. The changelog is a first-class engineering artifact.",
    "",
  ].join("\n");
}

function readGitLog(cwd: string): ParsedCommit[] {
  try {
    const raw = execSync(
      `git log --format="%H|%aI|%s" --no-merges -200`,
      { cwd, stdio: ["pipe", "pipe", "pipe"], timeout: 10_000 },
    ).toString().trim();

    if (!raw) return [];

    return raw
      .split("\n")
      .map((line) => {
        const [hash, date, ...rest] = line.split("|");
        const subject = rest.join("|").trim();
        return { hash: hash.slice(0, 8), date: date.split("T")[0], subject, category: categorize(subject) };
      })
      .filter((c) => !isNoise(c.subject));
  } catch {
    return [];
  }
}

function isNoise(subject: string): boolean {
  const trimmed = subject.trim();
  if (trimmed.length < 3) return true;
  return NOISE_PATTERNS.some((p) => p.test(trimmed));
}

function categorize(subject: string): ChangeCategory {
  const lower = subject.toLowerCase();

  if (/^feat[\s(:!]|^add[\s(:!]|new\s|^implement/i.test(lower)) return "added";
  if (/^fix[\s(:!]|^bugfix|^hotfix|^patch/i.test(lower)) return "fixed";
  if (/^refactor[\s(:!]|^rework|^restructure|^simplify|^clean/i.test(lower)) return "refactored";
  if (/^doc[\s(:!]|^docs[\s(:!]|^readme|^changelog|^comment/i.test(lower)) return "docs";
  if (/^config[\s(:!]|^ci[\s(:!]|^chore[\s(:!]|^build[\s(:!]|^deps|^bump|^upgrade|^setup/i.test(lower)) return "config";
  if (/^update[\s(:!]|^change[\s(:!]|^modify|^adjust|^improve|^enhance|^style/i.test(lower)) return "changed";

  return "other";
}

function buildChangelogFromHistory(projectName: string, commits: ParsedCommit[], cwd: string): string {
  const tags = readTags(cwd);
  const groups: ChangeGroup[] = [];

  if (tags.length > 0) {
    let remaining = [...commits];
    for (const tag of tags) {
      const tagCommits = remaining.filter((c) => c.date >= tag.date);
      remaining = remaining.filter((c) => c.date < tag.date);
      if (tagCommits.length > 0) {
        groups.push({
          label: tag.name,
          date: tag.date,
          entries: groupByCategory(tagCommits),
        });
      }
    }
    if (remaining.length > 0) {
      groups.push({
        label: "Pre-release",
        date: remaining[0].date,
        entries: groupByCategory(remaining),
      });
    }
  } else {
    const monthGroups = groupByMonth(commits);
    for (const [month, monthCommits] of monthGroups) {
      groups.push({
        label: month,
        date: monthCommits[0].date,
        entries: groupByCategory(monthCommits),
      });
    }
  }

  const lines = [
    `# Changelog`,
    ``,
    `All notable changes to **${projectName}** are documented in this file.`,
    ``,
    `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).`,
    ``,
    `## [Unreleased]`,
    ``,
    `_No unreleased changes yet._`,
    ``,
  ];

  for (const group of groups) {
    lines.push(`## [${group.label}] - ${group.date}`);
    lines.push(``);

    for (const [category, categoryEntries] of group.entries) {
      lines.push(`### ${CATEGORY_LABELS[category]}`);
      lines.push(``);
      for (const entry of categoryEntries) {
        lines.push(`- ${entry}`);
      }
      lines.push(``);
    }
  }

  return lines.join("\n");
}

function emptyChangelog(projectName: string): string {
  return [
    `# Changelog`,
    ``,
    `All notable changes to **${projectName}** are documented in this file.`,
    ``,
    `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).`,
    ``,
    `## [Unreleased]`,
    ``,
    `_Initial project setup._`,
    ``,
  ].join("\n");
}

function readTags(cwd: string): { name: string; date: string }[] {
  try {
    const raw = execSync(
      `git tag -l --sort=-creatordate --format="%(refname:short)|%(creatordate:short)"`,
      { cwd, stdio: ["pipe", "pipe", "pipe"], timeout: 5_000 },
    ).toString().trim();

    if (!raw) return [];

    return raw.split("\n").map((line) => {
      const [name, date] = line.split("|");
      return { name, date };
    });
  } catch {
    return [];
  }
}

function groupByCategory(commits: ParsedCommit[]): Map<ChangeCategory, string[]> {
  const map = new Map<ChangeCategory, string[]>();
  for (const commit of commits) {
    let subject = commit.subject;
    subject = subject.replace(/^(feat|fix|docs|chore|refactor|style|ci|build|test|perf)[\s]*[(:!]\s*/i, "");
    subject = subject.replace(/^\)\s*:?\s*/, "");
    subject = subject.charAt(0).toUpperCase() + subject.slice(1);
    if (!subject.endsWith(".")) subject += "";

    const list = map.get(commit.category) ?? [];
    if (!list.includes(subject)) {
      list.push(subject);
    }
    map.set(commit.category, list);
  }
  return map;
}

function groupByMonth(commits: ParsedCommit[]): Map<string, ParsedCommit[]> {
  const map = new Map<string, ParsedCommit[]>();
  for (const commit of commits) {
    const month = commit.date.slice(0, 7);
    const list = map.get(month) ?? [];
    list.push(commit);
    map.set(month, list);
  }
  return map;
}

function changelogGovernanceSkill(projectName: string): string {
  return `---
name: changelog-governance
description: Enforce changelog maintenance rules for ${projectName}. Use after completing any feature, fix, refactor, or configuration change.
---

# Changelog Governance

The changelog at \`CHANGELOG.md\` is a first-class engineering artifact for ${projectName}. It MUST be maintained continuously, not retroactively.

## When to Update

Update the changelog after ANY of the following:
- Adding a new feature or capability
- Fixing a bug
- Refactoring code
- Changing configuration, build, or CI
- Updating documentation significantly
- Removing or deprecating functionality

## How to Update

1. Open \`CHANGELOG.md\`
2. Add an entry under the \`[Unreleased]\` section
3. Place it under the correct category:

| Category | When to Use |
|----------|-------------|
| **Added** | New features, capabilities, endpoints, components |
| **Changed** | Modifications to existing behavior, UI changes, API changes |
| **Fixed** | Bug fixes, error corrections |
| **Refactored** | Code restructuring without behavior change |
| **Documentation** | Significant doc updates, new guides |
| **Configuration** | Build, CI, dependency, config file changes |

4. Write a concise, human-readable summary:
   - Good: "Add user authentication with JWT tokens"
   - Bad: "feat: auth" or "update stuff"

## Releasing a Version

When cutting a release:
1. Replace \`[Unreleased]\` with \`[version] - YYYY-MM-DD\`
2. Add a new empty \`[Unreleased]\` section at the top
3. Review entries for clarity and completeness

## Rules

- NEVER skip the changelog update after a meaningful change
- NEVER write raw commit messages as changelog entries
- NEVER delete or rewrite published version entries
- Each entry should be understandable without reading the code
- Group related changes into a single entry when possible
- Prefix entries with the affected area when helpful: "API: Add rate limiting"

## Review Checklist

Before finalizing any PR or task:
- [ ] CHANGELOG.md has been updated under [Unreleased]
- [ ] Entry is in the correct category
- [ ] Entry is human-readable and concise
- [ ] No duplicate or contradictory entries
`;
}
