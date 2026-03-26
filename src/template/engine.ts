export type TemplateValue = string | boolean | string[] | TemplateContext | TemplateContext[] | undefined;

export interface TemplateContext {
  [key: string]: TemplateValue;
}

export interface PartialRegistry {
  [name: string]: string;
}

export function render(
  template: string,
  context: TemplateContext,
  partials?: PartialRegistry,
): string {
  let result = template;
  if (partials) {
    result = processPartials(result, partials);
  }
  result = processEach(result, context);
  result = processConditionals(result, context);
  result = interpolateVariables(result, context);
  return result;
}

function processPartials(template: string, partials: PartialRegistry): string {
  return template.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_match, name: string) => {
    return partials[name] ?? "";
  });
}

function processEach(template: string, context: TemplateContext): string {
  const eachRegex = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  return template.replace(eachRegex, (_match, key: string, body: string) => {
    const value = resolveKey(context, key);
    if (!Array.isArray(value)) return "";

    return value
      .map((item) => {
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          let rendered = body.replace(/\{\{\.\}\}/g, String(item));
          rendered = interpolateVariables(rendered, item as TemplateContext);
          return rendered;
        }
        return body.replace(/\{\{\.\}\}/g, String(item));
      })
      .join("");
  });
}

function processConditionals(template: string, context: TemplateContext): string {
  const ifElseRegex =
    /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g;
  let result = template.replace(
    ifElseRegex,
    (_match, key: string, ifBody: string, elseBody: string) => {
      return isTruthy(resolveKey(context, key)) ? ifBody : elseBody;
    },
  );
  const ifRegex = /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (_match, key: string, body: string) => {
    return isTruthy(resolveKey(context, key)) ? body : "";
  });
  return result;
}

function interpolateVariables(template: string, context: TemplateContext): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_match, key: string) => {
    const value = resolveKey(context, key);
    if (value === undefined) return "";
    if (typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(String).join(", ");
    if (typeof value === "object") return "";
    return String(value);
  });
}

function resolveKey(context: TemplateContext, key: string): TemplateValue {
  if (!key.includes(".")) {
    return context[key];
  }

  const parts = key.split(".");
  let current: TemplateValue = context;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    if (typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as TemplateContext)[part];
  }

  return current;
}

function isTruthy(value: TemplateValue): boolean {
  if (value === undefined || value === false || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
