import type { DesignStyle } from '../editor/types';

const FORMAT = 'openchatcut.design-style';
const VERSION = 1;
const MAX_TEXT_LENGTH = 20_000;
const MAX_ENTRIES = 100;

export interface DesignStyleRecipe {
  format: typeof FORMAT;
  version: typeof VERSION;
  name: string;
  style: DesignStyle;
  scenarios?: string[];
  thumbnailUrl?: string;
}

export function buildDesignStyleRecipe(
  name: string,
  style: DesignStyle,
  metadata: { scenarios?: string[]; thumbnailUrl?: string } = {},
): DesignStyleRecipe {
  return normalizeRecipe({ format: FORMAT, version: VERSION, ...metadata, name, style });
}

export function parseDesignStyleRecipe(text: string): DesignStyleRecipe {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('tệp công thức không phải JSON hợp lệ');
  }
  return normalizeRecipe(value);
}

function normalizeRecipe(value: unknown): DesignStyleRecipe {
  if (!value || typeof value !== 'object') throw new Error('cấu trúc tệp công thức không hợp lệ');
  const recipe = value as Partial<DesignStyleRecipe>;
  if (recipe.format !== FORMAT || recipe.version !== VERSION) throw new Error('phiên bản tệp công thức không được hỗ trợ');
  const name = normalizedText(recipe.name, 'tên công thức');
  const style = normalizeStyle(recipe.style);
  const scenarios = normalizeScenarios(recipe.scenarios);
  const thumbnailUrl = optionalText(recipe.thumbnailUrl, 'địa chỉ thumbnail');
  return {
    format: FORMAT,
    version: VERSION,
    name,
    style,
    ...(scenarios ? { scenarios } : {}),
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
  };
}

function normalizeStyle(value: unknown): DesignStyle {
  if (!value || typeof value !== 'object') throw new Error('công thức thiếu nội dung style');
  const style = value as Partial<DesignStyle>;
  if (!Array.isArray(style.colors) || !Array.isArray(style.fonts)) throw new Error('cấu trúc style của công thức không hợp lệ');
  if (style.colors.length > MAX_ENTRIES || style.fonts.length > MAX_ENTRIES) throw new Error('công thức có quá nhiều nội dung');
  const colors = style.colors.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('cấu trúc màu của công thức không hợp lệ');
    return {
      role: normalizedText((entry as { role?: unknown }).role, 'vai trò màu'),
      value: normalizedText((entry as { value?: unknown }).value, 'giá trị màu'),
    };
  });
  const fonts = style.fonts.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('cấu trúc font của công thức không hợp lệ');
    return {
      role: normalizedText((entry as { role?: unknown }).role, 'vai trò font'),
      family: normalizedText((entry as { family?: unknown }).family, 'tên font'),
    };
  });
  const styleGuide = optionalText(style.styleGuide, 'hướng dẫn sáng tạo project');
  return { colors, fonts, ...(styleGuide ? { styleGuide } : {}) };
}

function normalizeScenarios(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > MAX_ENTRIES) throw new Error('cấu trúc ngữ cảnh áp dụng không hợp lệ');
  const scenarios = [...new Set(value.map((entry) => normalizedText(entry, 'ngữ cảnh áp dụng')))];
  return scenarios.length > 0 ? scenarios : undefined;
}

function normalizedText(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} không hợp lệ`);
  const result = value.trim();
  if (!result || result.length > MAX_TEXT_LENGTH) throw new Error(`${label} không hợp lệ`);
  return result;
}

function optionalText(value: unknown, label: string): string | undefined {
  if (value === undefined || value === '') return undefined;
  return normalizedText(value, label);
}
