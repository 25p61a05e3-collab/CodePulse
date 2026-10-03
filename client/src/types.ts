export type EvidenceType =
  | 'GitHub API data'
  | 'Static repository analysis'
  | 'Heuristic analysis'
  | 'Demo data'
  | 'AI-generated recommendation';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type NavKey =
  | 'dashboard'
  | 'analysis'
  | 'architecture'
  | 'security'
  | 'dependencies'
  | 'testing'
  | 'recommendations'
  | 'report'
  | 'settings';

export interface RepoMeta {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  files: number;
  updatedAt: string;
  sizeKb: number;
  defaultBranch: string;
  htmlUrl: string;
  source: EvidenceType;
  isDemo: boolean;
  watchers?: number;
  openIssues?: number;
  license?: string;
  createdAt?: string;
}

export interface ScoreBreakdown {
  codeQuality: number;
  architecture: number;
  security: number;
  dependencies: number;
  documentation: number;
  testing: number;
  maintainability: number;
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
  source: EvidenceType;
}

export interface Dependency {
  name: string;
  version: string;
  latest: string;
  ecosystem: string;
  status: 'Healthy' | 'Outdated' | 'Advisory';
  risk: 'Low' | 'Medium' | 'High';
  source: EvidenceType;
}

export interface QualityMetric {
  label: string;
  value: number;
  display: string;
  note: string;
  source: EvidenceType;
}

export interface FileNode {
  path: string;
  kind: 'folder' | 'file';
  language?: string;
  findings?: number;
  children?: FileNode[];
}

export interface ArchitectureNode {
  id: string;
  label: string;
  type: 'frontend' | 'api' | 'backend' | 'database' | 'module';
  detail: string;
  files: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  priority: 'Now' | 'Next' | 'Later';
  impact: string;
  source: EvidenceType;
}

export interface TestingSummary {
  coverage: number;
  coverageKind?: 'Estimated' | 'Unavailable';
  testFiles: string[];
  missingAreas: string[];
  recommendedTests: string[];
  source: EvidenceType;
}

export interface SecuritySummary {
  score: number;
  signals: string[];
  source: EvidenceType;
}

export interface AnalysisReport {
  repo: RepoMeta;
  analyzedAt: string;
  scores: ScoreBreakdown;
  overallScore: number;
  issues: Issue[];
  dependencies: Dependency[];
  quality: QualityMetric[];
  testing: TestingSummary;
  security: SecuritySummary;
  architecture: ArchitectureNode[];
  files: FileNode[];
  recommendations: Recommendation[];
  languages: { name: string; percentage: number; color: string }[];
  methodNote: string;
  commitSha?: string;
  scoreStatus?: string;
  weights?: ScoreBreakdown;
  limitations?: string[];
}
