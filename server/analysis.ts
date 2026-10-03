import type { Dependency, Issue, RepoSnapshot, Report, Severity, SnapshotFile } from './types';

const COLORS = ['#9fe870', '#71b7ff', '#c49bff', '#f7bd6b', '#6c7770'];
const WEIGHTS = { codeQuality: .20, architecture: .15, security: .20, dependencies: .10, documentation: .10, testing: .15, maintainability: .10 };
const source = 'Static repository analysis' as const;
const heuristic = 'Heuristic analysis' as const;

function content(file: SnapshotFile) { return file.content || ''; }
function lineOf(file: SnapshotFile, pattern: RegExp) { const index = content(file).search(pattern); return index < 0 ? undefined : content(file).slice(0, index).split('\n').length; }
function languageFor(path: string) { const ext = path.split('.').pop()?.toLowerCase(); return ext === 'ts' || ext === 'tsx' ? 'TypeScript' : ext === 'js' || ext === 'jsx' ? 'JavaScript' : ext === 'py' ? 'Python' : ext === 'go' ? 'Go' : ext === 'java' ? 'Java' : ext === 'md' ? 'Markdown' : ext === 'json' ? 'JSON' : ext === 'css' || ext === 'scss' ? 'CSS' : ext === 'yaml' || ext === 'yml' ? 'YAML' : ext === 'sql' ? 'SQL' : 'Text'; }
function isTest(path: string) { return /(^|\/)(tests?|__tests__)(\/|$)|\.(test|spec)\.[^.]+$/i.test(path); }
function isDoc(path: string) { return /(^|\/)(README|CONTRIBUTING|CHANGELOG|LICENSE)(\.|$)|^docs\//i.test(path); }
function buildTree(files: SnapshotFile[], issues: Issue[]) {
  const root: any[] = [];
  for (const file of files) {
    const parts = file.path.split('/'); let level = root;
    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/'); const leaf = index === parts.length - 1;
      let node = level.find((item) => item.path === path);
      if (!node) { node = { path, kind: leaf ? 'file' : 'folder', language: leaf ? languageFor(path) : undefined, children: leaf ? undefined : [] }; level.push(node); }
      if (leaf) { const count = issues.filter((issue) => issue.file === path).length; if (count) node.findings = count; }
      if (node.children) level = node.children;
    });
  }
  return root;
}
function languages(snapshot: RepoSnapshot) {
  const total = Object.values(snapshot.languages).reduce((sum, value) => sum + value, 0) || 1;
  return Object.entries(snapshot.languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, bytes], index) => ({ name, percentage: Math.max(1, Math.round(bytes / total * 100)), color: COLORS[index] || COLORS[4] }));
}
function parseDependencies(files: SnapshotFile[]): Dependency[] {
  const results: Dependency[] = [];
  const packageFile = files.find((file) => file.path === 'package.json');
  if (packageFile) {
    try {
      const parsed = JSON.parse(content(packageFile));
      for (const [name, version] of Object.entries({ ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) })) {
        const value = String(version); results.push({ name, version: value, latest: value, ecosystem: 'npm', status: 'Healthy', risk: 'Low', source });
      }
    } catch { results.push({ name: 'package.json', version: 'Malformed', latest: 'Not checked', ecosystem: 'npm', status: 'Advisory', risk: 'Medium', source: heuristic }); }
  }
  const requirements = files.find((file) => /(^|\/)requirements\.txt$/.test(file.path));
  if (requirements) content(requirements).split('\n').map((line) => line.match(/^([A-Za-z0-9_.-]+)(?:==|>=|~=)?\s*([^\s#]*)?/)).filter(Boolean).forEach((match) => results.push({ name: match![1], version: match![2] || 'Unpinned', latest: match![2] || 'Not checked', ecosystem: 'python', status: match![2] ? 'Healthy' : 'Outdated', risk: match![2] ? 'Low' : 'Medium', source }));
  return results.slice(0, 60);
}
function findIssues(files: SnapshotFile[], dependencies: Dependency[]): Issue[] {
  const issues: Issue[] = [];
  for (const file of files) {
    const text = content(file); if (!text) continue;
    const secret = /(?:ghp_[A-Za-z0-9_\-]{20,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z\-_]{20,}|AKIA[0-9A-Z]{16}|(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"\n]{8,}['"])/i.exec(text);
    if (secret && !/\.env\.example$|example|sample|placeholder/i.test(file.path + text.slice(Math.max(0, secret.index - 30), secret.index + secret[0].length + 30))) issues.push({ id: `secret-${file.path}`, severity: 'HIGH', title: 'Potential hardcoded credential', detail: 'A credential-like string was detected in a tracked source or configuration file.', file: file.path, line: lineOf(file, /(?:api[_-]?key|secret|password|token|ghp_|sk-)/i), evidence: 'Credential-like value detected and masked in the report.', recommendation: 'Move secrets to environment variables, rotate the exposed value, and review repository history.', confidence: 'medium', source: heuristic });
    if (/\beval\s*\(|child_process\.(?:exec|execSync|spawn)\s*\(/.test(text)) issues.push({ id: `unsafe-${file.path}`, severity: 'MEDIUM', title: 'Suspicious dynamic execution', detail: 'Dynamic code or process execution was detected and should be reviewed for untrusted input paths.', file: file.path, line: lineOf(file, /\beval\s*\(|child_process\./), evidence: 'Dynamic execution pattern detected.', recommendation: 'Constrain inputs, prefer safer APIs, and document the trust boundary.', confidence: 'medium', source: heuristic });
    if (/http:\/\//.test(text) && !/localhost|127\.0\.0\.1/.test(text)) issues.push({ id: `http-${file.path}`, severity: 'LOW', title: 'Insecure HTTP URL', detail: 'A non-local HTTP URL is present in repository text.', file: file.path, line: lineOf(file, /http:\/\//), evidence: 'Plain HTTP URL detected.', recommendation: 'Prefer HTTPS or document why the endpoint is intentionally non-TLS.', confidence: 'low', source: heuristic });
    const todoCount = (text.match(/\bTODO\b|\bFIXME\b/g) || []).length;
    if (todoCount > 5) issues.push({ id: `todo-${file.path}`, severity: 'LOW', title: 'High TODO/FIXME concentration', detail: `${todoCount} TODO/FIXME markers were detected in this file.`, file: file.path, evidence: `${todoCount} markers found by text analysis.`, recommendation: 'Convert the highest-risk markers into tracked work before release.', confidence: 'high', source });
  }
  if (!files.some((file) => /(^|\/)(security|helmet|cors)\b/i.test(file.path) || /helmet|securityHeaders/i.test(content(file)))) issues.push({ id: 'security-headers', severity: 'MEDIUM', title: 'Security header policy not detected', detail: 'No obvious centralized security-header middleware or policy was found in the bounded sample.', file: files.find((file) => /(^|\/)(server|src|app|api)/i.test(file.path))?.path || 'Repository root', evidence: 'No helmet or explicit security-header pattern detected in sampled files.', recommendation: 'Add centralized security headers and document the policy; confirm behavior in deployment.', confidence: 'low', source });
  for (const dependency of dependencies.filter((item) => item.status === 'Advisory')) issues.push({ id: `dependency-${dependency.name}`, severity: 'MEDIUM', title: `Dependency metadata needs review: ${dependency.name}`, detail: 'The dependency manifest could not be parsed confidently; advisory lookup is unavailable.', file: dependency.name === 'package.json' ? 'package.json' : dependency.name, evidence: 'Dependency version detected; advisory lookup unavailable.', recommendation: 'Validate the manifest and run the ecosystem advisory tool before upgrading.', confidence: 'high', source: heuristic });
  return issues.slice(0, 24);
}
function architecture(files: SnapshotFile[]) {
  const paths = files.map((file) => file.path); const has = (pattern: RegExp) => paths.some((path) => pattern.test(path)); const nodes: Report['architecture'] = [];
  if (has(/(^|\/)(components|pages|app|frontend|client)\//i)) nodes.push({ id: 'frontend', label: 'Frontend', type: 'frontend', detail: 'UI and client-side application modules detected from repository paths.', files: paths.filter((path) => /components|pages|app|frontend|client/i.test(path)).slice(0, 5) });
  if (has(/(^|\/)(routes|api|controllers|handlers)\//i)) nodes.push({ id: 'api', label: 'API boundary', type: 'api', detail: 'Routes, controllers, or handlers were detected in the repository.', files: paths.filter((path) => /routes|api|controllers|handlers/i.test(path)).slice(0, 5) });
  if (has(/(^|\/)(server|services|lib|src)\//i)) nodes.push({ id: 'backend', label: 'Services', type: 'backend', detail: 'Service or server modules were detected from source paths.', files: paths.filter((path) => /server|services|lib|src/i.test(path)).slice(0, 5) });
  if (has(/(^|\/)(prisma|migrations|models|db|database)\//i) || paths.some((path) => /schema\.prisma|\.sql$/i.test(path))) nodes.push({ id: 'database', label: 'Data layer', type: 'database', detail: 'Database schema, migrations, or model files were detected.', files: paths.filter((path) => /prisma|migrations|models|db|database|schema\.prisma|\.sql$/i.test(path)).slice(0, 5) });
  if (!nodes.length) nodes.push({ id: 'repository', label: 'Repository modules', type: 'module', detail: 'No conventional application boundary was confidently detected in the bounded sample.', files: paths.slice(0, 8) });
  return nodes;
}
function documentationScore(files: SnapshotFile[]) { const paths = files.map((file) => file.path); const readme = files.find((file) => /(^|\/)README/i.test(file.path)); const text = readme ? content(readme).toLowerCase() : ''; let score = readme ? 45 : 20; for (const term of ['install', 'usage', 'configuration', 'deploy', 'api', 'contribut']) if (text.includes(term)) score += 8; if (paths.some((path) => /(^|\/)docs\//i.test(path))) score += 8; if (paths.some((path) => /CONTRIBUTING|LICENSE/i.test(path))) score += 5; return Math.min(100, score); }

export function analyzeSnapshot(snapshot: RepoSnapshot): Report {
  const deps = parseDependencies(snapshot.files); const issues = findIssues(snapshot.files, deps); const arch = architecture(snapshot.files); const sourceFiles = snapshot.files.filter((file) => /\.(?:js|jsx|ts|tsx|py|go|java|rb|php|rs|cs)$/i.test(file.path) && !isTest(file.path)); const testFiles = snapshot.files.filter((file) => isTest(file.path)).map((file) => file.path); const docs = documentationScore(snapshot.files); const security = Math.max(25, 100 - issues.filter((issue) => issue.title.toLowerCase().includes('credential')).length * 24 - issues.filter((issue) => /security|execution|http/i.test(issue.title)).length * 10); const testing = sourceFiles.length ? Math.min(95, Math.round(testFiles.length / Math.max(sourceFiles.length, 1) * 100 + (testFiles.length ? 18 : 0))) : 0; const codeQuality = Math.max(35, Math.min(97, 88 - issues.filter((issue) => /TODO|duplicate|error|execution/i.test(issue.title)).length * 7)); const architectureScore = Math.min(96, 52 + arch.length * 12); const dependencyScore = deps.length ? Math.max(55, 96 - deps.filter((dependency) => dependency.status !== 'Healthy').length * 8) : 65; const maintainability = Math.max(40, Math.min(96, Math.round((codeQuality + architectureScore + docs + (testing || 45)) / 4))); const scores = { codeQuality, architecture: architectureScore, security, dependencies: dependencyScore, documentation: docs, testing, maintainability }; const overallScore = Math.round(Object.entries(scores).reduce((sum, [key, value]) => sum + value * (WEIGHTS as any)[key], 0));
  const recommendations = issues.slice(0, 5).map((issue, index) => ({ id: `rec-${issue.id}`, title: issue.recommendation, detail: issue.detail, priority: index < 2 ? 'Now' : index < 4 ? 'Next' : 'Later' as 'Now' | 'Next' | 'Later', impact: issue.severity === 'HIGH' ? 'Reduces immediate risk' : 'Improves change confidence', source: heuristic, issueIds: [issue.id] }));
  const totalLanguageBytes = Object.values(snapshot.languages).reduce((sum, value) => sum + value, 0) || 1;
  return { repo: { ...snapshot.repo, files: snapshot.totalFiles, source: 'GitHub API data', isDemo: false }, analyzedAt: new Date().toISOString(), commitSha: snapshot.commitSha, scores, weights: WEIGHTS, overallScore, scoreStatus: overallScore < 40 ? 'Critical' : overallScore < 60 ? 'Needs Attention' : overallScore < 75 ? 'Fair' : overallScore < 90 ? 'Healthy' : 'Excellent', issues, dependencies: deps, quality: [{ label: 'Complexity', value: codeQuality, display: codeQuality > 80 ? 'Low' : 'Moderate', note: 'Heuristic estimate from bounded source-file signals.', source: heuristic }, { label: 'File size', value: Math.max(40, 100 - Math.min(60, Math.round(snapshot.files.reduce((sum, file) => sum + file.size, 0) / 18000))), display: 'Measured', note: 'Derived from fetched file sizes with configured limits.', source }, { label: 'Error handling', value: Math.max(40, 90 - issues.filter((issue) => /error|execution/i.test(issue.title)).length * 12), display: issues.some((issue) => /error/i.test(issue.title)) ? 'Needs focus' : 'Visible', note: 'Heuristic scan for error boundaries and unsafe execution.', source: heuristic }, { label: 'Naming consistency', value: Math.min(96, 74 + (snapshot.files.filter((file) => /\.(ts|tsx|js|jsx)$/.test(file.path)).length > 4 ? 12 : 0)), display: 'Heuristic', note: 'No compiler-level claim; based on file and symbol naming signals.', source: heuristic }], testing: { coverage: testing, coverageKind: testFiles.length ? 'Estimated' : 'Unavailable', testFiles, missingAreas: testFiles.length ? ['Untested source modules', 'Failure and timeout paths'] : ['No test files detected', 'Failure and timeout paths', 'Integration boundaries'], recommendedTests: testFiles.length ? ['Add tests around the highest-risk source modules', 'Exercise failure and retry paths'] : ['Add a unit-test harness for core modules', 'Add an integration test for the primary boundary'], source }, security: { score: security, signals: issues.filter((issue) => /credential|security|execution|http/i.test(issue.title)).map((issue) => issue.title), source: heuristic }, architecture: arch, files: buildTree(snapshot.files, issues), recommendations, languages: Object.entries(snapshot.languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, bytes], index) => ({ name, percentage: Math.max(1, Math.round(bytes / totalLanguageBytes * 100)), color: COLORS[index] || COLORS[4] })), methodNote: `GitHub API data + bounded static repository analysis at commit ${snapshot.commitSha.slice(0, 7)}. Findings are developer-assistance signals and should be manually reviewed; the file explorer shows the bounded fetched sample.`, limitations: ['Only prioritized text files within configured file and byte limits were fetched; repository metadata reports the complete non-ignored file count.', 'Dependency advisory lookup is not enabled; versions are reported without invented vulnerability claims.', testFiles.length ? 'Coverage is estimated from file inventory, not runtime coverage instrumentation.' : 'Coverage data unavailable because no test files were detected.'] };
}
