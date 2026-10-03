# ⚡ CodePulse

### Understand the health of your codebase in minutes.

[![Live Demo](https://img.shields.io/badge/Live-Demo-00C853?style=for-the-badge)](https://codepulse-sandarsh.netlify.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge\&logo=github)](https://github.com/25p61a05e3-collab/CodePulse)

**CodePulse** is an AI-powered GitHub repository intelligence platform that analyzes a codebase and turns its structure, dependencies, security signals, testing, documentation, and maintainability into an actionable engineering health report.

Instead of spending hours manually exploring an unfamiliar repository, CodePulse gives developers a structured view of **what is healthy, what needs attention, and where to look next.**

---

## 🚀 Live Demo

**Try CodePulse:**
https://codepulse-sandarsh.netlify.app/

**Source Code:**
https://github.com/25p61a05e3-collab/CodePulse

---

## 🎯 Why CodePulse?

Understanding an unfamiliar repository can take hours.

You usually need to inspect:

* Project structure
* Dependencies
* Source files
* Security configuration
* Tests
* Documentation
* Architecture
* Maintainability
* Code quality

CodePulse brings these signals together into one developer-focused dashboard.

### The goal

> **Turn repository complexity into engineering visibility.**

---

## ✨ Features

### 📊 Repository Health Score

Get an overall health score based on multiple engineering signals.

CodePulse evaluates areas including:

* Code Quality
* Architecture
* Security
* Dependencies
* Documentation
* Testing
* Maintainability

---

### 🏗️ Architecture Intelligence

Automatically inspect repository structure and identify important architectural patterns.

Understand:

* Major application layers
* Frontend/backend separation
* Important directories
* Entry points
* Configuration files
* Structural relationships

---

### 🔐 Security Analysis

Identify common security signals and potentially risky patterns.

Examples include:

* Exposed secrets
* Suspicious configuration
* Unsafe patterns
* Security-sensitive files
* Environment configuration issues

---

### 📦 Dependency Analysis

Understand the dependency landscape of a repository.

CodePulse analyzes:

* Package manifests
* Dependency counts
* Runtime dependencies
* Development dependencies
* Potential dependency concerns

---

### 🧪 Testing Analysis

Get visibility into the testing maturity of a repository.

CodePulse looks for:

* Test directories
* Test files
* Testing frameworks
* Test configuration
* Evidence of automated testing

---

### 📚 Documentation Analysis

Evaluate whether a repository provides the documentation developers need.

Signals include:

* README presence
* Project documentation
* Configuration documentation
* Setup information
* Developer guidance

---

### 🛠️ Maintainability Analysis

Identify structural signals that can make a codebase harder to maintain.

CodePulse combines repository evidence with engineering heuristics to surface actionable findings.

---

### 🤖 AI-Powered Insights

Use AI to turn repository evidence into understandable engineering recommendations.

The platform is designed around **evidence-first analysis** rather than asking an AI to blindly guess what exists inside a repository.

---

### 🔑 Bring Your Own AI Key

CodePulse supports a BYOK-style AI workflow for multiple providers.

Supported provider integrations include:

* Ollama
* OpenAI
* Google Gemini
* Anthropic
* Grok / xAI
* OpenRouter
* Custom OpenAI-compatible providers

Users can select their preferred provider/model and use their own API credentials.

> **Security note:** When using client-side BYOK functionality, API keys are entered directly in the browser environment. Do not use production secrets in a public demo unless you understand the associated risks.

---

## 🔎 Evidence-Based Findings

One of the core ideas behind CodePulse is that analysis should be connected to repository evidence.

Instead of simply saying:

> "Your project has poor testing."

CodePulse can point toward the repository signals behind the finding.

This makes the analysis more useful for developers who want to investigate and improve their codebase.

---

## 🖥️ Developer-Focused UI

CodePulse uses a dark-first developer-tool interface designed around:

* Clear information hierarchy
* Engineering dashboards
* Status indicators
* Repository exploration
* Evidence cards
* Architecture visualization
* Responsive layouts

The goal is to make repository analysis feel like a real engineering product rather than a generic AI chatbot.

---

## 🧠 How It Works

```text
GitHub Repository
       │
       ▼
Repository Discovery
       │
       ▼
File & Structure Analysis
       │
       ├── Architecture
       ├── Dependencies
       ├── Security
       ├── Testing
       ├── Documentation
       ├── Code Quality
       └── Maintainability
       │
       ▼
Engineering Health Score
       │
       ▼
Evidence + Findings
       │
       ▼
AI Recommendations
       │
       ▼
Actionable Repository Report
```

---

## 🧰 Tech Stack

### Frontend

* React
* Vite
* JavaScript / TypeScript
* Tailwind CSS
* Modern component-based UI

### Backend / Analysis

* Node.js
* Express
* GitHub API
* Repository analysis engine

### AI

* Ollama
* OpenAI
* Google Gemini
* Anthropic
* Grok / xAI
* OpenRouter
* OpenAI-compatible APIs

### Deployment

* Netlify

---

## 📁 Project Structure

```text
CodePulse/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── package.json
├── README.md
└── ...
```

---

## ⚙️ Local Development

### 1. Clone the repository

```bash
git clone https://github.com/25p61a05e3-collab/CodePulse.git
cd CodePulse
```

### 2. Install dependencies

```bash
npm install
```

Then install dependencies for the client/server if required by the project structure.

### 3. Start the development environment

Use the project scripts provided in `package.json`.

For the frontend:

```bash
cd client
npm install
npm run dev
```

The Vite development server will start locally.

---

## 🌐 Deployment

The current production frontend is deployed on Netlify.

### Production

https://codepulse-sandarsh.netlify.app/

The frontend build uses Vite and outputs:

```text
client/dist
```

---

## 🔮 Future Improvements

Potential future versions could include:

* Private GitHub repository support
* GitHub OAuth
* Historical repository health tracking
* Pull-request analysis
* CI/CD integration
* GitHub Actions integration
* Automated issue creation
* Code-quality trend graphs
* Team dashboards
* Organization-wide repository monitoring
* Deeper vulnerability intelligence
* More language-specific static analysis
* AI-generated remediation patches

---

## 🎓 Project Purpose

CodePulse was built as a practical exploration of how **AI + static analysis + repository intelligence** can help developers understand software projects faster.

The project focuses on turning raw repository data into information that developers can actually use.

---

## 👨‍💻 Author

**Sandarsh Jeriopothula**

B.Tech Computer Science & Engineering
Vignana Bharathi Institute of Technology, Hyderabad

**Portfolio:**
https://sandarshjeripothula.netlify.app/

---

## ⭐ Support

If you find CodePulse interesting:

* ⭐ Star the repository
* 🐛 Report an issue
* 💡 Suggest an improvement
* 🔀 Contribute
* 📢 Share it with other developers

---

## 📄 License

See the repository license for usage and distribution details.
