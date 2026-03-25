export interface TemplateContext {
  [key: string]: string | boolean | string[] | undefined;
}

/**
 * Lightweight template engine:
 * - {{variable}} — interpolation
 * - {{#if condition}}...{{/if}} — conditional block (truthy check)
 * - {{#if condition}}...{{#else}}...{{/if}} — conditional with else
 * - {{#each items}}...{{/each}} — array iteration (current item as {{.}})
 */
export function render(template: string, context: TemplateContext): string {
  let result = template;

  result = processEach(result, context);
  result = processConditionals(result, context);
  result = interpolateVariables(result, context);

  return result;
}

function processEach(template: string, context: TemplateContext): string {
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  return template.replace(eachRegex, (_match, key: string, body: string) => {
    const value = context[key];
    if (!Array.isArray(value)) return "";
    return value.map((item) => body.replace(/\{\{\.\}\}/g, item)).join("");
  });
}

function processConditionals(template: string, context: TemplateContext): string {
  const ifElseRegex =
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g;
  let result = template.replace(
    ifElseRegex,
    (_match, key: string, ifBody: string, elseBody: string) => {
      return isTruthy(context[key]) ? ifBody : elseBody;
    },
  );

  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (_match, key: string, body: string) => {
    return isTruthy(context[key]) ? body : "";
  });

  return result;
}

function interpolateVariables(template: string, context: TemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = context[key];
    if (value === undefined) return "";
    if (typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.join(", ");
    return value;
  });
}

function isTruthy(value: string | boolean | string[] | undefined): boolean {
  if (value === undefined || value === false || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
