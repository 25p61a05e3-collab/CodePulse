import test from 'node:test';
import assert from 'node:assert/strict';
import { activateProvider, generateWithActive, listProviders, removeProvider, saveProvider, setProviderModel, testProvider } from './ai';

test('rejects cloud providers without a user-supplied key', () => {
  assert.throws(() => saveProvider({ provider: 'openai', model: 'user-model' }), /API key is required/);
});

test('discovers actual models, activates one, generates through the compatible contract, and removes it', async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input); requests.push(url);
    if (url.endsWith('/models')) return new Response(JSON.stringify({ data: [{ id: 'actual-model-1' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    assert.equal(url.endsWith('/chat/completions'), true);
    const body = JSON.parse(String(init?.body)); assert.equal(body.model, 'actual-model-1');
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Evidence-backed answer.' } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const result = saveProvider({ provider: 'custom', baseUrl: 'http://provider.test/v1', apiKey: 'sk-test-secret-123' });
    const id = result.providers.find((provider) => provider.provider === 'custom')?.id;
    assert.ok(id);
    const tested = await testProvider(id);
    assert.deepEqual(tested.providers.find((provider) => provider.id === id)?.models, ['actual-model-1']);
    assert.throws(() => setProviderModel(id, 'invented-model'), /returned by the provider/);
    setProviderModel(id, 'actual-model-1');
    const activated = activateProvider(id);
    assert.equal(activated.activeId, id);
    const generated = await generateWithActive('Use only this evidence.');
    assert.deepEqual(generated, { text: 'Evidence-backed answer.', provider: 'Custom OpenAI-compatible' });
    assert.ok(requests.some((url) => url.endsWith('/models')));
    assert.ok(requests.some((url) => url.endsWith('/chat/completions')));
    const removed = removeProvider(id); assert.equal(removed.activeId, null); assert.equal(removed.providers.some((provider) => provider.id === id), false);
  } finally { globalThis.fetch = originalFetch; }
});

test('stores provider configuration without exposing the full key', () => {
  const result = saveProvider({ provider: 'custom', baseUrl: 'http://localhost:8080/v1', apiKey: 'sk-test-secret-123', model: 'local-model' });
  const entry = result.providers.find((provider) => provider.provider === 'custom');
  assert.ok(entry);
  assert.equal(entry?.configured, true);
  assert.equal(entry?.keyHint, 'sk-••••••••123');
  assert.equal(JSON.stringify(entry).includes('sk-test-secret-123'), false);
});
