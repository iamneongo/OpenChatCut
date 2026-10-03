export { INSTALL_SKILL_TOOL_SCHEMAS, INSTALL_SKILL_TOOL_NAMES } from './schemas/install-skill-tools';
// install_skill: fetch a GitHub skill repo and install it into
// ~/.openchatcut/skills/<slug>/ (full multi-file install, not just SKILL.md).
// The library Skills tab discovers the directory automatically.
import type { AgentContext } from '../context';

interface InstallResult {
  ok: boolean;
  slug?: string;
  installedAt?: string;
  files?: string[];
  error?: string;
}

async function callInstall(repo: string, slug?: string): Promise<InstallResult> {
  try {
    const res = await fetch('/api/skills/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, slug }),
    });
    const data = (await res.json().catch(() => null)) as InstallResult | null;
    if (!res.ok || !data) return { ok: false, error: data?.error ?? `Cài skill thất bại (HTTP ${res.status})` };
    return data;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function execInstallSkillTool(name: string, args: Record<string, unknown>, _ctx: AgentContext): Promise<unknown> {
  if (name !== 'install_skill') return { error: `Công cụ không xác định: ${name}` };
  const repo = String(args.repo ?? '').trim();
  if (!repo) return { error: 'Cần có repo — URL GitHub hoặc owner/repo (ví dụ "Jane-xiaoer/paper-collage-ad-codex")' };
  const slug = typeof args.slug === 'string' ? args.slug.trim() : undefined;
  const result = await callInstall(repo, slug);
  if (!result.ok) return { error: result.error ?? 'Cài skill thất bại' };
  return {
    ok: true,
    slug: result.slug,
    installedAt: result.installedAt,
    files: result.files,
    note: 'Skill đã được cài vào thư mục skill của người dùng (~/.openchatcut/skills/<slug>/); panel “Skill” trong thư viện sẽ tự hiển thị. Có thể kích hoạt bằng /skill:<slug> trong hội thoại hoặc từ panel.',
  };
}
