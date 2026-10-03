import type { RepoSnapshot, SnapshotFile } from './types';

const API = 'https://api.github.com';
const MAX_FILES = 260;
const MAX_FILE_BYTES = 120_000;
const MAX_TOTAL_BYTES = 1_200_000;
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'vendor', 'target', '__pycache__', '.next', '.turbo', '.cache']);
const PRIORITY = /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle|go\.mod|README(?:\.md)?|CONTRIBUTING(?:\.md)?|LICENSE|Dockerfile|\.env(?:\.example)?|\.github\/workflows\/|src\/|app\/|server\/|api\/|routes\/|controllers\/|services\/|tests?\/|__tests__\/)/i;
const TEXT_EXTENSIONS = /\.(?:js|jsx|ts|tsx|mjs|cjs|py|rb|go|java|kt|rs|php|cs|json|yaml|yml|toml|ini|env|md|txt|sql|graphql|xml|html|css|scss|sh|dockerfile)$/i;

interface GithubRepoResponse {
  name: string; full_name: string; owner: { login: string }; description: string | null;
  stargazers_count: number; forks_count: number; watchers_count: number; open_issues_count: number;
  language: string | null; license: { spdx_id: string } | null; created_at: string; updated_at: string;
  size: number; default_branch: string; html_url: string;
}
interface GithubTreeResponse { sha: string; truncated: boolean; tree: { path: string; type: 'blob' | 'tree'; sha: string; size?: number }[] }

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

async function request<T>(path: string): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(`${API}${path}`, { headers: headers(), signal: AbortSignal.timeout(12_000) });
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    throw new Error(`GitHub request failed (${response.status}${remaining ? `, ${remaining} requests remaining` : ''})`);
  }
  return { data: await response.json() as T, headers: response.headers };
}

function shouldIgnore(path: string) { return path.split('/').some((part) => IGNORED_DIRS.has(part)); }
function isRelevant(path: string) { return PRIORITY.test(path) || TEXT_EXTENSIONS.test(path); }

async function fetchFile(owner: string, repo: string, file: { path: string; sha: string; size?: number }): Promise<SnapshotFile | null> {
  const size = file.size || 0;
  if (size > MAX_FILE_BYTES || !isRelevant(file.path)) return null;
  try {
    const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
    const { data } = await request<{ content?: string; encoding?: string; size?: number }>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`);
    if (!data.content || data.encoding !== 'base64') return null;
    const buffer = Buffer.from(data.content.replace(/\n/g, ''), 'base64');
    if (buffer.includes(0)) return { path: file.path, sha: file.sha, size: buffer.length, binary: true };
    return { path: file.path, sha: file.sha, size: buffer.length, content: buffer.toString('utf8') };
  } catch {
    return null;
  }
}

export async function loadRepository(owner: string, name: string): Promise<RepoSnapshot> {
  const repoPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const { data: repo, headers: repoHeaders } = await request<GithubRepoResponse>(repoPath);
  const treeResult = await request<GithubTreeResponse>(`${repoPath}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
  const candidates = treeResult.data.tree
    .filter((entry) => entry.type === 'blob' && !shouldIgnore(entry.path) && isRelevant(entry.path))
    .sort((a, b) => Number(PRIORITY.test(b.path)) - Number(PRIORITY.test(a.path)) || (a.size || 0) - (b.size || 0))
    .slice(0, MAX_FILES);
  const files: SnapshotFile[] = [];
  let totalBytes = 0;
  for (const candidate of candidates) {
    if (totalBytes >= MAX_TOTAL_BYTES) break;
    const file = await fetchFile(repo.owner.login, repo.name, candidate);
    if (file) { files.push(file); totalBytes += file.size; }
  }
  const languageResult = await request<Record<string, number>>(`${repoPath}/languages`);
  return {
    repo: {
      owner: repo.owner.login, name: repo.name, fullName: repo.full_name, description: repo.description || 'No repository description provided.',
      stars: repo.stargazers_count, forks: repo.forks_count, watchers: repo.watchers_count, openIssues: repo.open_issues_count,
      language: repo.language || Object.keys(languageResult.data)[0] || 'Unknown', license: repo.license?.spdx_id || 'Not detected',
      createdAt: repo.created_at, updatedAt: repo.updated_at, sizeKb: repo.size, defaultBranch: repo.default_branch, htmlUrl: repo.html_url,
    },
    languages: languageResult.data,
    files,
    totalFiles: treeResult.data.tree.filter((entry) => entry.type === 'blob' && !shouldIgnore(entry.path)).length,
    commitSha: treeResult.data.sha,
    rateLimit: { remaining: repoHeaders.get('x-ratelimit-remaining') || undefined, limit: repoHeaders.get('x-ratelimit-limit') || undefined },
  };
}
