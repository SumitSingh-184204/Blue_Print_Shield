import { Shield } from 'lucide-react';

interface PortalHeaderProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onLogoClick?: () => void;
  guestMode?: boolean;
}

export default function PortalHeader({ 
  onLoginClick, 
  onSignUpClick, 
  onLogoClick,
  guestMode = true
}: PortalHeaderProps) {
  return (
    <header className="border-b border-[#1A1A1A] bg-black py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-50">
      {/* Editorial Logo */}
      <div 
        onClick={onLogoClick}
        className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity"
        id="header-logo-container"
      >
        <div className="w-8 h-8 bg-[#4D4DFF] flex items-center justify-center rounded-sm transition-transform duration-300 group-hover:rotate-6">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold tracking-tighter text-xl italic text-white">
          BLUE<span className="text-[#4D4DFF]">PRINT</span> SHIELD
        </span>
      </div>

      {/* Editorial Status Center */}
      <div 
        className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#0A0A0A] border border-[#1A1A1A] rounded-full"
        id="header-status-center"
      >
        <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></div>
        <span className="text-[10px] font-mono tracking-widest text-[#00FF88] uppercase select-none">
          SHIELD ENGINE ACTIVE
        </span>
      </div>

      {/* Editorial Actions */}
      <div className="flex items-center gap-4" id="header-auth-actions">
        {guestMode && (
          <button 
            onClick={onLoginClick}
            className="px-5 py-2 text-xs font-bold tracking-widest border border-white/20 rounded-md hover:bg-white/5 uppercase transition-all"
            id="auth-btn-login"
          >
            LOG IN
          </button>
        )}
        <button 
          onClick={onSignUpClick}
          className="px-5 py-2 text-xs font-bold tracking-widest bg-[#4D4DFF] hover:bg-[#3b82f6] rounded-md shadow-[0_0_15px_rgba(77,77,255,0.4)] text-white transition-all hover:shadow-[0_0_20px_rgba(77,77,255,0.6)]"
          id="auth-btn-signup"
        >
          {guestMode ? 'SIGN UP' : 'GUEST ACC'}
        </button>
      </div>
    </header>
  );
}
