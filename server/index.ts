import express from 'express';
import { analyzeSnapshot } from './analysis';
import { loadRepository } from './github';
import { activateProvider, discoverProviderModels, generateWithActive, listProviders, providerCatalog, removeProvider, saveProvider, setProviderModel, testProvider, updateProvider } from './ai';
import type { Report } from './types';

const app = express();
const port = Number(process.env.PORT || 4000);
const cache = new Map<string, Report>();
app.use(express.json({ limit: '256kb' }));

function parseRepo(value: unknown) {
  if (typeof value !== 'string') throw new Error('A GitHub repository URL is required.');
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Enter a valid public GitHub repository URL.'); }
  if (!['github.com', 'www.github.com'].includes(url.hostname)) throw new Error('Only public github.com repository URLs are supported.');
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2 || parts[0].startsWith('.') || parts[1].startsWith('.')) throw new Error('Use a repository URL like https://github.com/owner/repository.');
  return { owner: parts[0], name: parts[1].replace(/\.git$/, '') };
}

app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'codepulse-api', version: '0.2.0', cachedReports: cache.size, githubTokenConfigured: Boolean(process.env.GITHUB_TOKEN) }));
app.get('/api/ai/catalog', (_request, response) => response.json({ providers: providerCatalog() }));
app.get('/api/ai/providers', (_request, response) => response.json(listProviders()));
app.post('/api/ai/providers', (request, response) => { try { response.json(saveProvider(request.body)); } catch (error) { response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid provider configuration.' }); } });
app.put('/api/ai/providers/:id', (request, response) => { try { response.json(updateProvider(request.params.id, request.body)); } catch (error) { response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid provider configuration.' }); } });
app.post('/api/ai/providers/:id/test', async (request, response) => { try { response.json(await testProvider(request.params.id)); } catch (error) { response.status(400).json({ error: error instanceof Error ? error.message : 'Provider connection failed.' }); } });
app.post('/api/ai/providers/:id/models', async (request, response) => { try { response.json(await discoverProviderModels(request.params.id)); } catch (error) { response.status(400).json({ error: error instanceof Error ? error.message : 'Model discovery failed.' }); } });
app.put('/api/ai/providers/:id/model', (request, response) => { try { response.json(setProviderModel(request.params.id, String(request.body?.model || ''))); } catch (error) { response.status(400).json({ error: error instanceof Error ? error.message : 'Invalid model.' }); } });
app.post('/api/ai/providers/:id/activate', (request, response) => { try { response.json(activateProvider(request.params.id)); } catch (error) { response.status(400).json({ error: error instanceof Error ? error.message : 'Provider activation failed.' }); } });
app.delete('/api/ai/providers/:id', (request, response) => response.json(removeProvider(request.params.id)));

app.post('/api/analyze/github', async (request, response) => {
  try {
    const { owner, name } = parseRepo(request.body?.url);
    const snapshot = await loadRepository(owner, name);
    const cached = cache.get(`${snapshot.repo.fullName}@${snapshot.commitSha}`);
    if (cached) return response.json({ report: cached, cached: true });
    const report = analyzeSnapshot(snapshot);
    cache.set(`${snapshot.repo.fullName}@${snapshot.commitSha}`, report);
    return response.json({ report, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Repository analysis failed.';
    return response.status(message.includes('valid') || message.includes('supported') ? 400 : 502).json({ error: message });
  }
});
app.post('/api/analyze', (_request, response) => response.status(307).setHeader('Location', '/api/analyze/github').end());

app.get('/api/repository/:owner/:repo', async (request, response) => {
  try { const snapshot = await loadRepository(request.params.owner, request.params.repo); return response.json(snapshot); }
  catch (error) { return response.status(502).json({ error: error instanceof Error ? error.message : 'Repository lookup failed.' }); }
});

app.post('/api/ask', async (request, response) => {
  const report = request.body?.report as Report | undefined; const question = String(request.body?.question || '').trim();
  if (!report || !question) return response.status(400).json({ error: 'A report and question are required.' });
  const lower = question.toLowerCase(); let fallback = `This answer is anchored to ${report.repo.fullName}. Ask about security, testing, architecture, dependencies, or a specific finding and CodePulse will point to the evidence.`;
  if (lower.includes('security') || lower.includes('risk')) { const securityIssues = report.issues.filter((issue) => /security|credential|execution|http/i.test(issue.title)); fallback = `Security is ${report.security.score}/100. The largest evidence-backed signals are ${securityIssues.slice(0, 3).map((issue) => `${issue.title} in ${issue.file}`).join('; ') || 'not available in the bounded sample'}. Review recommended; this is not a security certification.`; }
  else if (lower.includes('test')) { fallback = report.testing.coverageKind === 'Unavailable' ? 'Coverage data is unavailable because no test files were detected. Start with a unit-test harness for the highest-risk source boundary.' : `Testing is ${report.testing.coverage}% estimated from file inventory. Start with ${report.testing.missingAreas.slice(0, 2).join(' and ').toLowerCase()}. Relevant test files: ${report.testing.testFiles.slice(0, 4).join(', ') || 'none detected'}.`; }
  else if (lower.includes('architecture') || lower.includes('where')) { fallback = `Detected boundaries: ${report.architecture.map((node) => `${node.label} (${node.files.slice(0, 2).join(', ') || 'no file paths'})`).join(' → ')}.`; }
  try {
    const generated = await generateWithActive(`You are CodePulse. Answer only from the supplied structured repository evidence. Never invent files, line numbers, vulnerabilities, dependency advisories, test coverage, or repository facts. If evidence is unavailable, say exactly: "CodePulse does not have enough evidence to determine this." Reference relevant evidence when possible.\nQuestion: ${question}\nReport: ${JSON.stringify({ repo: report.repo.fullName, scores: report.scores, issues: report.issues.slice(0, 8), architecture: report.architecture, testing: report.testing, dependencies: report.dependencies.slice(0, 12), limitations: report.limitations })}`);
    if (generated?.text) return response.json({ answer: generated.text, source: 'AI-generated recommendation', provider: generated.provider });
  } catch { return response.json({ answer: fallback, source: 'Heuristic analysis', provider: null, providerUnavailable: true, message: 'AI provider unavailable.' }); }
  return response.json({ answer: fallback, source: 'Heuristic analysis', provider: null });
});
app.post('/api/report', (request, response) => response.json({ report: request.body?.report, generatedBy: 'CodePulse', limitation: 'Automated analysis should be manually reviewed.' }));

app.listen(port, '0.0.0.0', () => console.log(`CodePulse API listening on ${port}`));
