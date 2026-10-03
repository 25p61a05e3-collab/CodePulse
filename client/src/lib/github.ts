import { demoAnalysis } from '../data/demoAnalysis';
import type { AnalysisReport, EvidenceType, RepoMeta } from '../types';

const API_ROOT = import.meta.env.VITE_GITHUB_API_URL || 'https://api.github.com';
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_GITHUB_TIMEOUT_MS || 6500);

export function parseGithubUrl(value: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(value.trim());
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return null;
    const [owner, repo] = url.pathname.split('/').filter(Boolean);
    if (!owner || !repo || repo === '.' || repo.includes('?')) return null;
    return { owner, repo: repo.replace(/\.git$/, '') };
  } catch { return null; }
}

function fallbackReport(owner: string, repo: string, reason: string): AnalysisReport {
  return { ...demoAnalysis, repo: { ...demoAnalysis.repo, owner, name: repo, fullName: `${owner}/${repo}`, htmlUrl: `https://github.com/${owner}/${repo}`, source: 'Demo data', isDemo: true }, methodNote: `Demo Analysis — ${reason} Sample repository signals are shown separately and do not represent the entered repository.` };
}

export async function analyzeRepository(value: string): Promise<{ report: AnalysisReport; usedDemo: boolean }> {
  const parsed = parseGithubUrl(value);
  if (!parsed) throw new Error('Enter a public GitHub repository URL, for example https://github.com/owner/repository.');
  if (parsed.owner === 'acme-labs' && parsed.repo === 'checkout-service') return { report: demoAnalysis, usedDemo: true };
  const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT + 18000);
  try {
    const response = await fetch('/api/analyze/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: value.trim() }), signal: controller.signal });
    const payload = await response.json() as { report?: AnalysisReport; error?: string };
    if (!response.ok) {
      if (response.status === 400) throw new Error(payload.error || 'The repository URL could not be analyzed.');
      return { report: fallbackReport(parsed.owner, parsed.repo, payload.error || 'GitHub API unavailable or rate limited.'), usedDemo: true };
    }
    if (!payload.report) throw new Error('The analysis service returned no report.');
    return { report: payload.report, usedDemo: false };
  } catch (error) {
    if (error instanceof Error && error.message.includes('repository URL')) throw error;
    return { report: fallbackReport(parsed.owner, parsed.repo, error instanceof Error ? error.message : 'The analysis service was unavailable.'), usedDemo: true };
  } finally { window.clearTimeout(timer); }
}

export async function askCodePulse(report: AnalysisReport, question: string): Promise<{ answer: string; source: EvidenceType; provider: string | null; providerUnavailable?: boolean; message?: string }> {
  const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ report, question }) });
  const payload = await response.json() as { answer?: string; source?: EvidenceType; provider?: string | null; error?: string };
  if (!response.ok || !payload.answer) throw new Error(payload.error || 'Ask CodePulse is unavailable.');
  return { answer: payload.answer, source: payload.source || 'Heuristic analysis', provider: payload.provider || null, providerUnavailable: Boolean((payload as { providerUnavailable?: boolean }).providerUnavailable), message: (payload as { message?: string }).message };
}

export async function probeLegacyGithub(value: string): Promise<RepoMeta | null> {
  const parsed = parseGithubUrl(value); if (!parsed) return null;
  try { const response = await fetch(`${API_ROOT}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(REQUEST_TIMEOUT) }); if (!response.ok) return null; return await response.json() as RepoMeta; } catch { return null; }
}
