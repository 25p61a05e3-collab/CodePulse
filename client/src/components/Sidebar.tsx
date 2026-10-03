import { Activity, Boxes, Bug, FileBarChart2, FileCode2, GitBranch, Layers3, Lightbulb, Menu, Network, Settings2, ShieldCheck, X } from 'lucide-react';
import type { NavKey } from '../types';
import { BrandMark } from './BrandMark';

const items: { key: NavKey; label: string; icon: typeof Activity; group?: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Activity },
  { key: 'analysis', label: 'Repository analysis', icon: FileCode2, group: 'WORKSPACE' },
  { key: 'architecture', label: 'Architecture', icon: Network },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'dependencies', label: 'Dependencies', icon: Boxes },
  { key: 'testing', label: 'Testing', icon: Bug },
  { key: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { key: 'report', label: 'Report', icon: FileBarChart2 },
  { key: 'settings', label: 'Settings', icon: Settings2, group: 'SYSTEM' },
];

export function Sidebar({ active, onNavigate, open, onClose, hasReport }: { active: NavKey; onNavigate: (key: NavKey) => void; open: boolean; onClose: () => void; hasReport: boolean }) {
  return <>
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-top"><BrandMark /><button className="icon-button mobile-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="workspace-chip"><span className="pulse-small" /><div><strong>Workspace</strong><small>Personal / default</small></div><GitBranch size={14} /></div>
      <nav className="side-nav" aria-label="Primary navigation">
        {items.map((item, index) => <div key={item.key}>
          {item.group && <div className="nav-group-label">{item.group}</div>}
          <button className={`nav-item ${active === item.key ? 'active' : ''} ${!hasReport && item.key !== 'dashboard' && item.key !== 'settings' ? 'muted-nav' : ''}`} onClick={() => { onNavigate(item.key); onClose(); }}>
            <item.icon size={17} strokeWidth={active === item.key ? 2.2 : 1.8} /><span>{item.label}</span>{active === item.key && <span className="nav-active-line" />}
          </button>
        </div>)}
      </nav>
      <div className="sidebar-bottom"><div className="system-status"><span className="status-dot" /><div><strong>Analysis engine online</strong><small>v0.8.4 · heuristic core</small></div></div><button className="help-link"><Menu size={14} /> Keyboard shortcuts</button></div>
    </aside>
  </>;
}
