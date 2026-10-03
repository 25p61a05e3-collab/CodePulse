import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSnapshot } from './analysis';
import type { RepoSnapshot } from './types';

const snapshot: RepoSnapshot = {
  repo: { owner: 'demo', name: 'repo', fullName: 'demo/repo', description: 'A test repository', stars: 3, forks: 1, watchers: 4, openIssues: 0, language: 'TypeScript', license: 'MIT', createdAt: '2025-01-01', updatedAt: '2026-01-01', sizeKb: 12, defaultBranch: 'main', htmlUrl: 'https://github.com/demo/repo' },
  languages: { TypeScript: 900, JavaScript: 100 },
  totalFiles: 4,
  commitSha: '0123456789abcdef0123456789abcdef01234567',
  files: [
    { path: 'README.md', sha: '1', size: 55, content: '# Repo\n\n## Install\nnpm install\n\n## Usage\nrun it' },
    { path: 'package.json', sha: '2', size: 110, content: '{"dependencies":{"express":"^4.0.0"},"devDependencies":{"vitest":"^1.0.0"}}' },
    { path: 'src/app.ts', sha: '3', size: 180, content: "const apiKey = 'sk-12345678901234567890';\nexport function app() { return fetch('http://example.com'); }" },
    { path: 'tests/app.test.ts', sha: '4', size: 80, content: 'test("app", () => {})' },
  ],
};

test('analyzes repository evidence without fabricating advisory data', () => {
  const report = analyzeSnapshot(snapshot);
  assert.equal(report.repo.source, 'GitHub API data');
  assert.equal(report.repo.isDemo, false);
  assert.equal(report.commitSha, snapshot.commitSha);
  assert.ok(report.overallScore >= 0 && report.overallScore <= 100);
  assert.ok(report.issues.some((issue) => issue.title === 'Potential hardcoded credential'));
  assert.ok(report.dependencies.some((dependency) => dependency.name === 'express'));
  assert.equal(report.dependencies[0].latest, report.dependencies[0].version);
  assert.equal(report.testing.coverageKind, 'Estimated');
  assert.ok(report.architecture.length >= 1);
  assert.ok(report.limitations.some((limitation) => limitation.includes('advisory')));
});

test('reports unavailable coverage when no tests exist', () => {
  const report = analyzeSnapshot({ ...snapshot, files: snapshot.files.filter((file) => !file.path.includes('.test.')) });
  assert.equal(report.testing.coverageKind, 'Unavailable');
  assert.equal(report.testing.coverage, 0);
});
