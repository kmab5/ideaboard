import { cn } from '@/lib/utils';

// Node centers live in a 0–100 coordinate space shared by the SVG viewBox and
// the absolutely-positioned note cards, so lines meet the cards exactly.
type NodeId = 'prologue' | 'signal' | 'investigate' | 'retreat' | 'trust' | 'ending';

const NODES: Record<NodeId, { x: number; y: number }> = {
  prologue: { x: 16, y: 24 },
  signal: { x: 47, y: 15 },
  investigate: { x: 80, y: 28 },
  retreat: { x: 26, y: 66 },
  trust: { x: 60, y: 62 },
  ending: { x: 87, y: 76 },
};

const EDGES: { from: NodeId; to: NodeId; color: string; delay: number }[] = [
  { from: 'prologue', to: 'signal', color: '#7c3aed', delay: 0.3 },
  { from: 'signal', to: 'investigate', color: '#0891b2', delay: 0.5 },
  { from: 'signal', to: 'retreat', color: '#f59e0b', delay: 0.65 },
  { from: 'investigate', to: 'trust', color: '#3b82f6', delay: 0.85 },
  { from: 'retreat', to: 'trust', color: '#ec4899', delay: 1.0 },
  { from: 'trust', to: 'ending', color: '#22c55e', delay: 1.2 },
];

function edgePath(from: NodeId, to: NodeId): string {
  const a = NODES[from];
  const b = NODES[to];
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2 - 7; // gentle upward bow
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

interface NoteProps {
  node: NodeId;
  color: string;
  rise: number;
  float?: boolean;
  className?: string;
  children: React.ReactNode;
}

function Note({ node, color, rise, float, className, children }: NoteProps) {
  const { x, y } = NODES[node];
  return (
    <div
      className="absolute w-max"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="mkt-rise" style={{ animationDelay: `${rise}s` }}>
        <div
          className={cn(
            'rounded-lg border border-black/10 px-3 py-2 text-gray-900 shadow-md shadow-black/5 ring-1 ring-white/40',
            float && 'mkt-float',
            className
          )}
          style={{ backgroundColor: color }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function CanvasHero({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl shadow-black/5 sm:aspect-[16/11]',
        className
      )}
      role="img"
      aria-label="An IdeaBoard canvas: story notes for a branching sci-fi tale, connected into paths, with a variable note tracking {{trust}}."
    >
      {/* Dotted canvas field */}
      <div className="mkt-dotgrid mkt-grid-fade absolute inset-0" aria-hidden />

      {/* Connection layer (behind the notes) */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {EDGES.map((edge) => (
          <path
            key={`${edge.from}-${edge.to}`}
            className="mkt-draw"
            d={edgePath(edge.from, edge.to)}
            pathLength={1}
            fill="none"
            stroke={edge.color}
            strokeWidth={0.6}
            strokeLinecap="round"
            style={{ ['--dash' as string]: 1, animationDelay: `${edge.delay}s` }}
          />
        ))}
      </svg>

      {/* Notes */}
      <Note node="prologue" color="#FFF9C4" rise={0.15} float className="max-w-[42vw] sm:max-w-none">
        <p className="text-[0.7rem] font-semibold sm:text-xs">Prologue</p>
        <p className="text-[0.62rem] text-gray-600 sm:text-[0.7rem]">Cold open on the relay</p>
      </Note>

      <Note node="signal" color="#BBDEFB" rise={0.3}>
        <p className="text-[0.7rem] font-semibold sm:text-xs">The Signal</p>
      </Note>

      <Note node="investigate" color="#C8E6C9" rise={0.5} float>
        <p className="text-[0.7rem] font-semibold sm:text-xs">Investigate</p>
      </Note>

      <Note node="retreat" color="#FFCCBC" rise={0.65}>
        <p className="text-[0.7rem] font-semibold sm:text-xs">Turn back</p>
      </Note>

      <Note node="trust" color="#E1BEE7" rise={0.85} float>
        <p className="mb-1 text-[0.7rem] font-semibold sm:text-xs">Choice</p>
        <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold text-violet-800 sm:text-[0.68rem]">
          {'{{trust}}'} +1
        </span>
      </Note>

      <Note
        node="ending"
        color="#B2DFDB"
        rise={1.05}
        className="hidden max-w-[40vw] sm:block sm:max-w-none"
      >
        <p className="text-[0.7rem] font-semibold sm:text-xs">Ending: Contact</p>
      </Note>
    </div>
  );
}
