export type ProviderId = 'ollama' | 'xai' | 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'custom';
export type ModelDiscovery = 'available' | 'unavailable';
export interface ProviderConfigInput { provider: ProviderId; name?: string; baseUrl?: string; apiKey?: string; model?: string; }
export interface ProviderConfigView { id: string; provider: ProviderId; name: string; baseUrl: string; model: string; models: string[]; modelDiscovery: ModelDiscovery; configured: boolean; connected: boolean; keyHint?: string; local: boolean; lastTested?: string; }
interface StoredConfig extends ProviderConfigInput { id: string; connected: boolean; models: string[]; modelDiscovery: ModelDiscovery; lastTested?: string; }
interface ProviderConnection { models: string[]; modelDiscovery: ModelDiscovery; }
interface AIProvider { testConnection(): Promise<ProviderConnection>; listModels(): Promise<string[]>; generate(prompt: string): Promise<string>; }

const defaults: Record<ProviderId, { name: string; baseUrl: string; local: boolean; modelDiscovery: ModelDiscovery }> = {
  ollama: { name: 'Ollama', baseUrl: 'http://localhost:11434', local: true, modelDiscovery: 'available' },
  xai: { name: 'Grok / xAI', baseUrl: 'https://api.x.ai/v1', local: false, modelDiscovery: 'available' },
  gemini: { name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', local: false, modelDiscovery: 'available' },
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', local: false, modelDiscovery: 'available' },
  anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', local: false, modelDiscovery: 'available' },
  openrouter: { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', local: false, modelDiscovery: 'available' },
  custom: { name: 'Custom OpenAI-compatible', baseUrl: '', local: false, modelDiscovery: 'available' },
};
const configs = new Map<string, StoredConfig>();
let activeId: string | null = null;

function baseUrl(config: StoredConfig) { return (config.baseUrl || defaults[config.provider].baseUrl).replace(/\/$/, ''); }
async function jsonRequest(url: string, init: RequestInit = {}) { const response = await fetch(url, { ...init, signal: init.signal || AbortSignal.timeout(12000) }); const text = await response.text(); let data: any = {}; try { data = text ? JSON.parse(text) : {}; } catch { /* provider returned non-JSON */ } if (!response.ok) throw new Error(data?.error?.message || data?.error || `Provider returned ${response.status}`); return data; }
function authHeaders(config: StoredConfig) { return { Accept: 'application/json', 'Content-Type': 'application/json', ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}) }; }

class OllamaProvider implements AIProvider {
  constructor(private config: StoredConfig) {}
  async listModels() { const data = await jsonRequest(`${baseUrl(this.config)}/api/tags`); return Array.isArray(data.models) ? data.models.map((model: any) => model.name).filter(Boolean) : []; }
  async testConnection() { return { models: await this.listModels(), modelDiscovery: 'available' as const }; }
  async generate(prompt: string) { if (!this.config.model) throw new Error('Select an Ollama model before generating.'); const data = await jsonRequest(`${baseUrl(this.config)}/api/generate`, { method: 'POST', headers: authHeaders(this.config), body: JSON.stringify({ model: this.config.model, prompt, stream: false }) }); return String(data.response || ''); }
}

class OpenAICompatibleProvider implements AIProvider {
  constructor(protected config: StoredConfig) {}
  async listModels() { const data = await jsonRequest(`${baseUrl(this.config)}/models`, { headers: authHeaders(this.config) }); return Array.isArray(data.data) ? data.data.map((model: any) => model.id).filter(Boolean) : []; }
  async testConnection() { return { models: await this.listModels(), modelDiscovery: 'available' as const }; }
  async generate(prompt: string) { if (!this.config.model) throw new Error('Select a model before generating.'); const data = await jsonRequest(`${baseUrl(this.config)}/chat/completions`, { method: 'POST', headers: authHeaders(this.config), body: JSON.stringify({ model: this.config.model, temperature: .2, messages: [{ role: 'system', content: 'You are CodePulse. Answer only from supplied repository evidence.' }, { role: 'user', content: prompt }] }) }); return String(data.choices?.[0]?.message?.content || ''); }
}
class XAIProvider extends OpenAICompatibleProvider {}
class OpenAIProvider extends OpenAICompatibleProvider {}
class OpenRouterProvider extends OpenAICompatibleProvider {}
class CustomOpenAIProvider extends OpenAICompatibleProvider {}

class GeminiProvider implements AIProvider {
  constructor(private config: StoredConfig) {}
  async listModels() { const data = await jsonRequest(`${baseUrl(this.config)}/models?key=${encodeURIComponent(this.config.apiKey || '')}`); return Array.isArray(data.models) ? data.models.filter((model: any) => String(model.supportedGenerationMethods || '').includes('generateContent')).map((model: any) => String(model.name || '').replace(/^models\//, '')).filter(Boolean) : []; }
  async testConnection() { return { models: await this.listModels(), modelDiscovery: 'available' as const }; }
  async generate(prompt: string) { if (!this.config.model) throw new Error('Select a Gemini model before generating.'); const model = this.config.model.replace(/^models\//, ''); const data = await jsonRequest(`${baseUrl(this.config)}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.config.apiKey || '')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `You are CodePulse. Never invent repository evidence.\n${prompt}` }] }] }) }); return String(data.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || ''); }
}

class AnthropicProvider implements AIProvider {
  constructor(private config: StoredConfig) {}
  private headers() { return { Accept: 'application/json', 'Content-Type': 'application/json', 'x-api-key': this.config.apiKey || '', 'anthropic-version': '2023-06-01' }; }
  async listModels() { const data = await jsonRequest(`${baseUrl(this.config)}/models`, { headers: this.headers() }); return Array.isArray(data.data) ? data.data.map((model: any) => model.id).filter(Boolean) : []; }
  async testConnection() { return { models: await this.listModels(), modelDiscovery: 'available' as const }; }
  async generate(prompt: string) { if (!this.config.model) throw new Error('Select an Anthropic model before generating.'); const data = await jsonRequest(`${baseUrl(this.config)}/messages`, { method: 'POST', headers: this.headers(), body: JSON.stringify({ model: this.config.model, max_tokens: 900, system: 'You are CodePulse. Never invent files, line numbers, vulnerabilities, dependency advisories, test coverage, or repository facts. If evidence is unavailable, say: CodePulse does not have enough evidence to determine this.', messages: [{ role: 'user', content: prompt }] }) }); return String(data.content?.map((part: any) => part.text || '').join('') || ''); }
}

function adapter(config: StoredConfig): AIProvider { switch (config.provider) { case 'ollama': return new OllamaProvider(config); case 'xai': return new XAIProvider(config); case 'openai': return new OpenAIProvider(config); case 'openrouter': return new OpenRouterProvider(config); case 'custom': return new CustomOpenAIProvider(config); case 'gemini': return new GeminiProvider(config); case 'anthropic': return new AnthropicProvider(config); } }
export function providerCatalog() { return Object.entries(defaults).map(([id, value]) => ({ id, ...value })); }
export function listProviders(): { activeId: string | null; providers: ProviderConfigView[] } { return { activeId, providers: Array.from(configs.values()).map((config) => ({ id: config.id, provider: config.provider, name: config.name || defaults[config.provider].name, baseUrl: baseUrl(config), model: config.model || '', models: config.models, modelDiscovery: config.modelDiscovery, configured: Boolean(config.apiKey || config.provider === 'ollama'), connected: config.connected, keyHint: config.apiKey ? `${config.apiKey.slice(0, 3)}••••••••${config.apiKey.slice(-3)}` : undefined, local: defaults[config.provider].local, lastTested: config.lastTested })) }; }
export function saveProvider(input: ProviderConfigInput) { if (!input.provider || !defaults[input.provider]) throw new Error('Unsupported AI provider.'); if (input.provider !== 'ollama' && !input.apiKey) throw new Error('An API key is required for cloud providers.'); if (input.provider === 'custom' && !input.baseUrl) throw new Error('A base URL is required for a custom provider.'); const id = `${input.provider}-${Date.now()}`; configs.set(id, { ...input, id, connected: false, models: [], modelDiscovery: defaults[input.provider].modelDiscovery }); return listProviders(); }
export function updateProvider(id: string, input: Partial<ProviderConfigInput>) { const current = configs.get(id); if (!current) throw new Error('Provider configuration not found.'); const next = { ...current, ...input, id, apiKey: input.apiKey || current.apiKey, connected: false, models: [], lastTested: undefined }; if (!next.apiKey && next.provider !== 'ollama') throw new Error('An API key is required for cloud providers.'); if (next.provider === 'custom' && !next.baseUrl) throw new Error('A base URL is required for a custom provider.'); configs.set(id, next); if (activeId === id) activeId = null; return listProviders(); }
export function activateProvider(id: string) { const config = configs.get(id); if (!config) throw new Error('Provider configuration not found.'); if (!config.connected) throw new Error('Test the provider connection before activating it.'); if (!config.model) throw new Error('Select an available or manual model before activating the provider.'); if (config.models.length > 0 && !config.models.includes(config.model)) throw new Error('Select a model returned by the provider.'); activeId = id; return listProviders(); }
export function removeProvider(id: string) { configs.delete(id); if (activeId === id) activeId = null; return listProviders(); }
export function setProviderModel(id: string, model: string) { const config = configs.get(id); if (!config) throw new Error('Provider configuration not found.'); if (!model || (config.models.length > 0 && !config.models.includes(model))) throw new Error('Select a model returned by the provider.'); config.model = model; return listProviders(); }
export async function testProvider(id: string) { const config = configs.get(id); if (!config) throw new Error('Provider configuration not found.'); const result = await adapter(config).testConnection(); config.models = result.models; config.modelDiscovery = result.modelDiscovery; config.connected = true; config.lastTested = new Date().toISOString(); return listProviders(); }
export async function discoverProviderModels(id: string) { const config = configs.get(id); if (!config) throw new Error('Provider configuration not found.'); config.models = await adapter(config).listModels(); config.modelDiscovery = 'available'; return listProviders(); }
export function getActiveProvider() { return activeId ? configs.get(activeId) : undefined; }
export async function generateWithActive(prompt: string): Promise<{ text: string; provider: string } | null> { const config = getActiveProvider(); if (!config) return null; const text = await adapter(config).generate(prompt); return { text, provider: config.name || defaults[config.provider].name }; }
