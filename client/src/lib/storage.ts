import type { AnalysisReport } from '../types';

const REPORT_KEY = 'codepulse:last-report';
const DENSITY_KEY = 'codepulse:compact-density';

export function loadReport(): AnalysisReport | null {
  try {
    const raw = localStorage.getItem(REPORT_KEY);
    return raw ? (JSON.parse(raw) as AnalysisReport) : null;
  } catch {
    return null;
  }
}

export function saveReport(report: AnalysisReport): void {
  try { localStorage.setItem(REPORT_KEY, JSON.stringify(report)); } catch { /* Storage is optional. */ }
}

export function getCompactDensity(): boolean {
  return localStorage.getItem(DENSITY_KEY) === 'true';
}

export function saveCompactDensity(value: boolean): void {
  localStorage.setItem(DENSITY_KEY, String(value));
}
