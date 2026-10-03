export type EvidenceSource = 'GitHub API data' | 'Static repository analysis' | 'Heuristic analysis' | 'AI-generated recommendation' | 'Demo data';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SnapshotFile {
  path: string;
  sha: string;
  size: number;
  content?: string;
  binary?: boolean;
}

export interface RepoSnapshot {
  repo: {
    owner: string;
    name: string;
    fullName: string;
    description: string;
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    language: string;
    license: string;
    createdAt: string;
    updatedAt: string;
    sizeKb: number;
    defaultBranch: string;
    htmlUrl: string;
  };
  languages: Record<string, number>;
  files: SnapshotFile[];
  totalFiles: number;
  commitSha: string;
  rateLimit?: { remaining?: string; limit?: string };
}

export interface Issue {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  file: string;
  line?: number;
  evidence: string;
  recommendation: string;
  confidence?: 'low' | 'medium' | 'high';
  source: EvidenceSource;
}

export interface Dependency {
  name: string;
  version: string;
  latest: string;
  ecosystem: string;
  status: 'Healthy' | 'Outdated' | 'Advisory';
  risk: 'Low' | 'Medium' | 'High';
  source: EvidenceSource;
}

export interface Report {
  repo: {
    owner: string;
    name: string;
    fullName: string;
    description: string;
    stars: number;
    forks: number;
    watchers?: number;
    openIssues?: number;
    language: string;
    license?: string;
    createdAt?: string;
    updatedAt: string;
    files: number;
    sizeKb: number;
    defaultBranch: string;
    htmlUrl: string;
    source: EvidenceSource;
    isDemo: boolean;
  };
  analyzedAt: string;
  commitSha?: string;
  scores: { codeQuality: number; architecture: number; security: number; dependencies: number; documentation: number; testing: number; maintainability: number };
  weights: { codeQuality: number; architecture: number; security: number; dependencies: number; documentation: number; testing: number; maintainability: number };
  overallScore: number;
  scoreStatus: string;
  issues: Issue[];
  dependencies: Dependency[];
  quality: { label: string; value: number; display: string; note: string; source: EvidenceSource }[];
  testing: { coverage: number; coverageKind: 'Estimated' | 'Unavailable'; testFiles: string[]; missingAreas: string[]; recommendedTests: string[]; source: EvidenceSource };
  security: { score: number; signals: string[]; source: EvidenceSource };
  architecture: { id: string; label: string; type: 'frontend' | 'api' | 'backend' | 'database' | 'module'; detail: string; files: string[] }[];
  files: { path: string; kind: 'folder' | 'file'; language?: string; findings?: number; children?: unknown[] }[];
  recommendations: { id: string; title: string; detail: string; priority: 'Now' | 'Next' | 'Later'; impact: string; source: EvidenceSource; issueIds?: string[] }[];
  languages: { name: string; percentage: number; color: string }[];
  methodNote: string;
  limitations: string[];
}
