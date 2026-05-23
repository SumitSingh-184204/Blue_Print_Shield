import { Heart, Landmark, BookOpen, GraduationCap, Truck, ShoppingCart, Gamepad2, Cpu, ChevronRight } from 'lucide-react';
import { SystemBlueprint } from '../types';

interface SystemCardProps {
  blueprint: SystemBlueprint;
  onSynthesize: (id: string) => void;
  key?: string;
}

// Map key name to Lucide components safely
const getIcon = (name: string) => {
  switch (name) {
    case 'Heart':
      return <Heart className="w-5 h-5 text-[#FF4D4D]" />;
    case 'Landmark':
      return <Landmark className="w-5 h-5 text-[#FFB800]" />;
    case 'BookOpen':
      return <BookOpen className="w-5 h-5 text-[#00E5FF]" />;
    case 'GraduationCap':
      return <GraduationCap className="w-5 h-5 text-[#A855F7]" />;
    case 'Truck':
      return <Truck className="w-5 h-5 text-[#00FF88]" />;
    case 'ShoppingCart':
      return <ShoppingCart className="w-5 h-5 text-[#EC4899]" />;
    case 'Gamepad2':
      return <Gamepad2 className="w-5 h-5 text-[#4D4DFF]" />;
    case 'Cpu':
      return <Cpu className="w-5 h-5 text-[#FF8800]" />;
    default:
      return <Cpu className="w-5 h-5 text-gray-400" />;
  }
};

export default function SystemCard({ blueprint, onSynthesize }: SystemCardProps) {
  const { id, title } = blueprint;

  return (
    <div 
      onClick={() => onSynthesize(id)}
      className="bg-[#0A0A0A] border border-[#1A1A1A] p-5 rounded-xl flex flex-col justify-between hover:border-[#4D4DFF]/70 hover:shadow-[0_0_25px_rgba(77,77,255,0.18)] transition-all duration-300 cursor-pointer group relative overflow-hidden"
      id={`system-card-${id}`}
    >
      {/* Subtle Blue Glow Effect on Hover */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(77,77,255,0.08),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Label/Header with Icon & White Title */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-10 h-10 bg-[#151515] rounded-lg flex items-center justify-center border border-[#222] text-white flex-shrink-0">
          {getIcon(blueprint.iconName)}
        </div>
        <h3 className="font-sans font-black text-sm md:text-base tracking-widest uppercase text-white group-hover:text-blue-200 transition-colors">
          {title}
        </h3>
      </div>

      <div>
        {/* Divider */}
        <div className="h-px bg-[#1A1A1A] w-full mb-3" />

        {/* Blue Synthesize Button Label */}
        <div className="text-[10px] font-bold text-[#4D4DFF] uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-opacity">
          SYNTHESIZE BLUEPRINT
        </div>
      </div>
    </div>
  );
}
