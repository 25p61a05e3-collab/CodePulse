import { motion } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';

const stages = ['Repository metadata', 'File tree + languages', 'Dependency signals', 'Security heuristics', 'Health score + report'];

export function LoadingAnalysis({ stage }: { stage: number }) {
  return <div className="loading-stage"><div className="loading-orbit"><div className="orbit-core"><span className="brand-pulse-line" /></div><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /></div><div className="loading-copy"><span className="eyebrow">ANALYSIS IN PROGRESS</span><h2>Following the signal through your repository.</h2><p>CodePulse is collecting evidence first, then turning it into developer-assistance heuristics. This usually takes a few seconds.</p></div><div className="loading-list">{stages.map((label, index) => <motion.div key={label} className={`loading-row ${index < stage ? 'done' : index === stage ? 'current' : ''}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .07 }}><span className="loading-icon">{index < stage ? <Check size={14} /> : index === stage ? <Loader2 size={14} className="spin" /> : <Circle size={10} />}</span><span>{label}</span>{index < stage && <small>complete</small>}</motion.div>)}</div></div>;
}
