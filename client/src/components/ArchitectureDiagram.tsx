import { ArrowRight, Boxes, Database, Globe2, Server, Workflow } from 'lucide-react';
import type { ArchitectureNode } from '../types';
import { Card, EvidencePill, SectionHeading } from './Primitives';

const icons = { frontend: Globe2, api: Workflow, backend: Server, database: Database, module: Boxes };

export function ArchitectureDiagram({ nodes, selected, onSelect }: { nodes: ArchitectureNode[]; selected: string | null; onSelect: (node: ArchitectureNode) => void }) {
  const main = nodes.filter((node) => node.type !== 'module');
  const modules = nodes.filter((node) => node.type === 'module');
  return <Card className="architecture-card"><SectionHeading eyebrow="SYSTEM MAP" title="Architecture at a glance" description="Tap a node to trace the files and findings behind each boundary." action={<EvidencePill source="Heuristic analysis" />} /><div className="diagram-canvas"><div className="diagram-flow">{main.map((node, index) => { const Icon = icons[node.type]; return <div className="diagram-step-wrap" key={node.id}><button className={`diagram-node ${node.type} ${selected === node.id ? 'selected' : ''}`} onClick={() => onSelect(node)}><div className="diagram-node-icon"><Icon size={19} /></div><strong>{node.label}</strong><span>{node.files.length} files linked</span></button>{index < main.length - 1 && <ArrowRight className="diagram-arrow" size={18} />}</div>; })}</div><div className="module-row"><span className="eyebrow">CONNECTED MODULES</span>{modules.map((node) => <button key={node.id} className={`module-chip ${selected === node.id ? 'selected' : ''}`} onClick={() => onSelect(node)}><Boxes size={13} />{node.label}<span>{node.files.length}</span></button>)}</div></div>{selected && <div className="node-inspector"><div><span className="eyebrow">SELECTED BOUNDARY</span><h3>{nodes.find((node) => node.id === selected)?.label}</h3><p>{nodes.find((node) => node.id === selected)?.detail}</p></div><div className="inspector-files">{nodes.find((node) => node.id === selected)?.files.map((file) => <code key={file}>{file}</code>)}</div></div>}</Card>;
}
