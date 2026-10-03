import { ChevronDown, ChevronRight, FileCode2, Folder, FolderOpen, Search } from 'lucide-react';
import { useState } from 'react';
import type { FileNode } from '../types';
import { Card, SectionHeading } from './Primitives';

function Row({ node, depth, onSelect }: { node: FileNode; depth: number; onSelect: (node: FileNode) => void }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isFolder = node.kind === 'folder';
  return <div><button className="file-row" style={{ paddingLeft: `${14 + depth * 19}px` }} onClick={() => isFolder ? setExpanded(!expanded) : onSelect(node)}><span className="file-chevron">{isFolder ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span />}</span>{isFolder ? (expanded ? <FolderOpen size={15} className="folder-icon" /> : <Folder size={15} className="folder-icon" />) : <FileCode2 size={15} className="file-icon" />}<code>{node.path.split('/').pop()}</code>{node.findings ? <span className="finding-count">{node.findings}</span> : null}</button>{isFolder && expanded && node.children?.map((child) => <Row key={child.path} node={child} depth={depth + 1} onSelect={onSelect} />)}</div>;
}

export function FileExplorer({ files, onSelect }: { files: FileNode[]; onSelect: (node: FileNode) => void }) {
  const [query, setQuery] = useState('');
  const flattened = files.flatMap(function flatten(node): FileNode[] { return [node, ...(node.children || []).flatMap(flatten)]; });
  const visible = query ? flattened.filter((node) => node.path.toLowerCase().includes(query.toLowerCase())) : null;
  return <Card className="file-explorer"><SectionHeading eyebrow="REPOSITORY TREE" title="Explore the evidence" description="Browse files and jump to paths with analysis findings." action={<div className="search-field small"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter files" /></div>} />{visible ? <div className="file-list">{visible.map((node) => <Row key={node.path} node={node} depth={0} onSelect={onSelect} />)}</div> : <div className="file-list">{files.map((node) => <Row key={node.path} node={node} depth={0} onSelect={onSelect} />)}</div>}<div className="explorer-footer"><span><span className="finding-count inline">•</span> findings attached</span><span>{flattened.filter((node) => node.kind === 'file').length} files indexed</span></div></Card>;
}
