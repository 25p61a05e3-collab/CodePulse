# CodePulse

> Understand the health of your codebase in minutes.

CodePulse is an evidence-first GitHub repository intelligence platform. Enter a public repository URL and CodePulse fetches a bounded repository snapshot, analyzes its structure and relevant text files, computes a transparent developer-health score, and surfaces findings you can trace back to files. Optional AI recommendations and Q&A use a user-selected provider; CodePulse remains usable without a paid AI API.

## Product features

The existing dark-first developer-tool interface includes the landing flow, progressive analysis state, dashboard, repository analysis workspace, interactive architecture map, security signals, dependency inventory, testing gaps, documentation and maintainability signals, file explorer, report view, Ask CodePulse, demo fallback, responsive behavior, and settings.

Live analysis is now server-backed. The Express service fetches repository metadata, languages, the recursive tree, and prioritized text files while enforcing ignored directories, file-size limits, maximum file count, binary detection, and a total byte budget. Reports are cached by repository commit SHA during the server session.

Every result carries a source such as `GitHub API data`, `Static repository analysis`, `Heuristic analysis`, `AI-generated recommendation`, or `Demo data`. Security signals are potential risks for manual review, not confirmed vulnerabilities or a certification. Dependency versions are not presented as advisories when an advisory database is unavailable. Testing is labelled `Estimated` or `Unavailable`; CodePulse never fabricates runtime coverage.

## Run locally

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite client on `http://localhost:3000` and the Express API on `http://localhost:4000`. Vite proxies `/api/*` to the API service. The API can also be run separately with `npm run server`.

Run validation with:

```bash
npm run typecheck
npm test
npm run build
```

## GitHub access

Public repositories work without a GitHub token, but unauthenticated GitHub requests are rate-limited. For a local or hosted server, copy `.env.example` to `.env` and optionally set `GITHUB_TOKEN`. The token remains server-side and is never exposed to the client bundle.

The bounded fetch ignores `node_modules`, `.git`, `dist`, `build`, `coverage`, `vendor`, `target`, `__pycache__`, `.next`, and other generated directories. It prioritizes source files, package manifests, configuration, tests, documentation, CI/CD, and Docker files.

## AI providers and BYOK

Settings → AI Providers supports real provider adapters and a test → discover models → select → activate flow:

- Ollama for free local inference, including a configurable local base URL and model.
- Grok / xAI, Google Gemini, OpenAI, Anthropic, OpenRouter, and custom OpenAI-compatible APIs.

Ollama uses its local `/api/tags` and `/api/generate` contract. OpenAI, xAI, OpenRouter, and custom providers use the compatible `/models` and `/chat/completions` contract. Gemini uses the official `models` and `generateContent` contract with its API-key query parameter. Anthropic uses the official `/models` and `/messages` contract with `x-api-key` and `anthropic-version` headers. Model names are never invented: returned models appear in the selector; providers that report discovery unavailable expose a manual model field.

Cloud providers require credentials supplied by the user. Keys are accepted by the server only, masked in provider status, and never placed in frontend `VITE_*` variables. Provider configurations are held in the running server process for this prototype; production deployment should replace this with encrypted per-user credential storage and authentication.

If no provider is configured, Ask CodePulse uses deterministic evidence mode. If an active provider fails, the UI says `AI provider unavailable.` and offers Retry, Switch Provider, or Continue without AI. CodePulse does not silently switch providers or spend another user's credentials; it returns an evidence-backed fallback.

## API surface

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Service health and GitHub-token status |
| POST | `/api/analyze/github` | Fetch and analyze a public repository URL |
| GET | `/api/repository/:owner/:repo` | Return a bounded repository snapshot |
| POST | `/api/ask` | Answer a question from a structured report |
| POST | `/api/report` | Wrap a report payload with generation metadata |
| GET | `/api/ai/catalog` | List supported provider types |
| GET | `/api/ai/providers` | List masked configured providers |
| POST | `/api/ai/providers` | Add a provider configuration |
| PUT | `/api/ai/providers/:id` | Update an existing provider configuration |
| POST | `/api/ai/providers/:id/test` | Test provider connectivity |
| POST | `/api/ai/providers/:id/models` | Refresh models from the provider |
| PUT | `/api/ai/providers/:id/model` | Select a returned or manual model |
| POST | `/api/ai/providers/:id/activate` | Activate a configured provider |
| DELETE | `/api/ai/providers/:id` | Remove a provider configuration |

## Analysis methodology

The score uses configurable default weights: Code Quality 20%, Architecture 15%, Security 20%, Dependencies 10%, Documentation 10%, Testing 15%, and Maintainability 10%. Scores derive from the fetched snapshot: file and source inventory, detected boundaries, documentation signals, test inventory, dependency manifests, bounded static patterns, and structured findings. The report includes commit SHA, limitations, evidence, and the score status category.

The analysis engine is deliberately conservative. It reports credential-like patterns with masked evidence, suspicious dynamic execution, insecure HTTP patterns, missing visible header policy, malformed dependency manifests, documentation gaps, test gaps, and other review leads. It does not claim compiler-level analysis, live dependency advisories, full repository coverage, or a complete security audit.

## Architecture

```text
client/src                 React presentation and report UI
server/github.ts           Bounded GitHub metadata/tree/content fetcher
server/analysis.ts         Static analyzers, evidence, architecture, scoring
server/ai.ts               Provider abstraction and secret-safe BYOK state
server/index.ts            Express routes, caching, Q&A, report boundary
```

## Security notes

Never commit `.env` or provider keys. Do not place AI keys in `VITE_*` variables. Review masked findings manually and rotate any credential that may have entered repository history. The prototype has no account system; the in-memory provider configuration is intended for local development and must be replaced with encrypted, authenticated storage before multi-user hosting.

## Demo Mode

The `acme-labs/checkout-service` example remains deterministic and works without network access. When GitHub or the analysis service is unavailable, CodePulse clearly switches to Demo Analysis and states that sample findings do not represent the entered repository. Demo findings are not merged into live reports.

## Roadmap

The next production steps are authentication and encrypted per-user provider storage, persistent cache storage, background analysis jobs, real advisory database integration, parser-backed language analysis, streamed AI responses, and repository commit comparison.
