import { Database, Lock, Calendar, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { SavedBlueprint } from '../types';

interface SavedBlueprintsProps {
  savedList: SavedBlueprint[];
  onLoadBlueprint: (systemId: string) => void;
}

export default function SavedBlueprints({ savedList, onLoadBlueprint }: SavedBlueprintsProps) {
  return (
    <div className="mt-12 w-full" id="saved-architecture-blueprints-block">
      {/* Title Divider bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-[#4D4DFF]" />
          <h3 className="font-extrabold text-sm tracking-widest text-white uppercase font-sans">
            SAVED BLUEPRINT ENTRIES
          </h3>
          <span className="px-2 py-0.5 font-mono text-[9px] bg-[#0A0A0A] border border-[#1A1A1A] text-stone-400 rounded">
            VOLATILE CACHE
          </span>
        </div>
        
        {/* Persistence Status pill */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] text-zinc-500 hover:text-stone-300 transition-colors cursor-pointer self-start sm:self-auto group"
          title="Sign in to save templates permanently to Cloud Space."
          id="persistence-status-pill"
        >
          <Lock className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#4D4DFF] transition-colors" />
          <span className="font-mono text-[8px] uppercase tracking-widest font-semibold text-zinc-500 group-hover:text-zinc-400">
            PERSISTENCE REQUIRES AUTH LOGIN
          </span>
        </div>
      </div>

      {/* Render horizontal table or lists of records */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="saved-blueprints-list">
        {savedList.map((item) => (
          <div 
            key={item.id}
            onClick={() => onLoadBlueprint(item.systemType)}
            className="bg-[#0A0A0A] border border-[#1A1A1A] p-4 rounded-xl flex flex-col justify-between hover:border-[#4D4DFF] hover:shadow-[0_0_10px_rgba(77,77,255,0.1)] cursor-pointer transition-all duration-300 group"
            id={`saved-item-${item.id}`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] font-bold text-[#4D4DFF]">
                  {item.id.toUpperCase()}
                </span>
                <span className={`flex items-center gap-1 font-mono text-[9px] font-semibold ${
                  item.status === 'VERIFIED' ? 'text-[#00FF88]' : item.status === 'WARNING' ? 'text-amber-500' : 'text-stone-400'
                }`}>
                  {item.status === 'VERIFIED' ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : (
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                  )}
                  {item.status}
                </span>
              </div>
              
              <h4 className="font-sans font-bold text-xs uppercase text-stone-200 group-hover:text-[#4D4DFF] transition-all tracking-wider mb-2">
                {item.systemTitle}
              </h4>
            </div>

            <div className="mt-4 pt-3 border-t border-[#121212] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-zinc-600" />
                {item.nodesCount} Nodes
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-600" />
                {item.timestamp.split(' ')[1]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
