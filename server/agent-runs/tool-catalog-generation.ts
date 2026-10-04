import { access, readdir } from 'node:fs/promises';
import type { AgentToolSchema } from '../../src/agent/tool-schema';

async function bundledSkillIds(): Promise<string[]> {
  const root = new URL('../../src/agent/skills/', import.meta.url);
  const entries = await readdir(root, { withFileTypes: true });
  const ids = await Promise.all(entries
    .filter((entry) => entry.isDirectory())
    .map(async (entry) => {
      try {
        await access(new URL(`${entry.name}/SKILL.md`, root));
        return entry.name;
      } catch {
        return null;
      }
    }));
  return ids.filter((id): id is string => id !== null).sort();
}
export function normalizeToolCatalogText(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

export async function serverToolCatalogForGeneration(
  schemas: readonly AgentToolSchema[],
): Promise<AgentToolSchema[]> {
  const cloned = structuredClone(schemas);
  const loadSkill = cloned.find((schema) => schema.name === 'load_skill');
  if (!loadSkill) return [...cloned];
  if (!loadSkill.description?.endsWith('Kỹ năng đóng gói: .')) {
    throw new Error('định dạng mô tả schema load_skill đã thay đổi.');
  }
  loadSkill.description = loadSkill.description.replace(
    'Kỹ năng đóng gói: .',
    `Kỹ năng đóng gói: ${(await bundledSkillIds()).join(', ')}.`,
  );
  return [...cloned];
}
