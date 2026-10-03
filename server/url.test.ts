import test from 'node:test';
import assert from 'node:assert/strict';

function parseGithubUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!['github.com', 'www.github.com'].includes(url.hostname)) return null;
    const [owner, repo] = url.pathname.split('/').filter(Boolean);
    if (!owner || !repo || repo.startsWith('.')) return null;
    return { owner, repo: repo.replace(/\.git$/, '') };
  } catch { return null; }
}

test('accepts public GitHub repository URLs and removes .git', () => {
  assert.deepEqual(parseGithubUrl('https://github.com/octocat/Spoon-Knife.git'), { owner: 'octocat', repo: 'Spoon-Knife' });
});

test('rejects non-GitHub and incomplete URLs', () => {
  assert.equal(parseGithubUrl('https://gitlab.com/a/b'), null);
  assert.equal(parseGithubUrl('https://github.com/octocat'), null);
});
