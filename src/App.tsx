import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Database, Key, CheckCircle, 
  Terminal, ArrowRight, ShieldAlert, Cpu, Award, X
} from 'lucide-react';
import PortalHeader from './components/PortalHeader';
import SystemCard from './components/SystemCard';
import SavedBlueprints from './components/SavedBlueprints';
import SecurityCanvas from './components/SecurityCanvas';
import { SYSTEM_BLUEPRINTS, MOCK_SAVED_BLUEPRINTS } from './data';
import { SystemBlueprint, SavedBlueprint, SystemType, SecurityNode } from './types';

export default function App() {
  const [viewState, setViewState] = useState<'HOME' | 'CANVAS'>('HOME');
  const [selectedBlueprint, setSelectedBlueprint] = useState<SystemBlueprint>(SYSTEM_BLUEPRINTS[0]);
  const [customInput, setCustomInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleInputChange = (val: string) => {
    // Prevent leading spaces instantly
    let cleaned = val;
    if (cleaned.startsWith(' ')) {
      cleaned = cleaned.trimStart();
    }
    setCustomInput(cleaned);

    // Real-time dynamic helper validation
    const trimmed = cleaned.trim();
    if (cleaned.length > 0 && trimmed.length < 5) {
      setInputError(`Description too short. Requires at least 5 characters (current: ${trimmed.length}/5)`);
    } else if (cleaned.length > 0 && cleaned !== trimmed) {
      setInputError('Leading or trailing spaces are not allowed.');
    } else {
      setInputError(null);
    }
  };
  
  // Auth demonstration modals state
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'LOGIN' | 'SIGNUP' | null }>({
    isOpen: false,
    mode: null
  });
  
  // Custom created user list state (persists in state)
  const [blueprints, setBlueprints] = useState<SystemBlueprint[]>(SYSTEM_BLUEPRINTS);
  const [savedRecords, setSavedRecords] = useState<SavedBlueprint[]>(MOCK_SAVED_BLUEPRINTS);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  const triggerGeminiGeneration = async (payload: { systemType?: string; customDescription?: string }, fallbackTitle: string, systemTypeKey: SystemType) => {
    setIsLoading(true);
    setInputError(null);
    
    // Stagger loading log states
    const steps = [
      "Evaluating PDPD Act...",
      "Evaluating PDPD Act compliance protocols...",
      "Evaluating PDPD Act storage liabilities...",
      "Evaluating PDPD Act data fiduciary constraints...",
      "Evaluating PDPD Act security checkpoints..."
    ];
    
    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setLoadingStep(steps[stepIndex]);
    }, 1000);

    try {
      const resp = await fetch("/api/generate-architecture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      clearInterval(stepInterval);

      if (!resp.ok) {
        throw new Error(`API returned progress code ${resp.status}`);
      }

      const result = await resp.json();
      
      // Successfully generated architecture! Parse it into SystemBlueprint
      const mappedNodes: SecurityNode[] = result.nodes.map((node: any, idx: number) => ({
        id: node.id || `node-${idx}`,
        type: (['client', 'waf', 'api', 'db', 'cache', 'auth'].includes(node.type) ? node.type : 'api') as any,
        label: node.label || `NODE-${idx}`,
        subLabel: node.tech || "Secure Instance",
        ipAddress: node.ipAddress || `10.0.${idx}.12`,
        port: node.port || 80,
        status: "secure",
        integrity: node.integrity || 100,
        connections: node.connections || result.edges.filter((e: any) => e.source === node.id).map((e: any) => e.target),
        description: node.description || "Secure enterprise node configured dynamically.",
        position: { x: node.x || (15 + idx * 15), y: node.y || 45 },
        securityRules: node.securityRules || [
          { id: `r-${idx}-1`, name: "Access Signature Verification", enabled: true, description: "Validates incoming cryptographic keys to prevent spoofing" },
          { id: `r-${idx}-2`, name: "Port Filtering Protocol", enabled: true, description: "Restricts single-IP unauthorized requests" }
        ]
      }));

      const sysTitle = payload.customDescription 
        ? `CUSTOM: ${payload.customDescription.toUpperCase()}` 
        : fallbackTitle;

      const dynamicBlueprint: SystemBlueprint = {
        id: systemTypeKey,
        title: sysTitle,
        category: payload.customDescription ? 'User Custom Segment' : 'Dynamic Security Architecture',
        description: payload.customDescription 
          ? `Engineered custom dynamic blueprint for "${payload.customDescription}". Includes ingress defense points and secure ledger pools.`
          : `Dynamically generated security blueprint for ${fallbackTitle} systems.`,
        threatScore: Math.floor(Math.random() * 20) + 10,
        iconName: payload.customDescription ? 'Cpu' : 'Shield',
        nodes: mappedNodes,
        edges: result.edges || []
      };

      // Add template record dynamically to saved records
      const newRecord: SavedBlueprint = {
        id: `sb-dyn-${Date.now().toString().slice(-4)}`,
        systemTitle: dynamicBlueprint.title,
        systemType: systemTypeKey,
        nodesCount: mappedNodes.length,
        timestamp: `2026-05-22 ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit' })}`,
        threatScore: dynamicBlueprint.threatScore,
        status: 'VERIFIED'
      };

      setSelectedBlueprint(dynamicBlueprint);
      setSavedRecords(prev => [newRecord, ...prev]);
      setViewState('CANVAS');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setInputError(`Failed to generate dynamic topology securely: ${err.message}. Please verify settings.`);
    } finally {
      setIsLoading(false);
      clearInterval(stepInterval);
    }
  };

  // Transition into active canvas view
  const handleSynthesize = (systemId: string) => {
    const found = blueprints.find(b => b.id === systemId);
    const titleText = found ? found.title : `${systemId} SYSTEM`;
    triggerGeminiGeneration({ systemType: systemId }, titleText, systemId as SystemType);
  };

  // Convert custom input field description to dynamic node structure
  const handleDevelopCustom = (e: FormEvent) => {
    e.preventDefault();
    
    const trimmed = customInput.trim();
    if (customInput.startsWith(' ') || customInput.endsWith(' ')) {
      setInputError('Leading or trailing spaces are not permitted.');
      return;
    }
    if (trimmed.length < 5) {
      setInputError('Description is too short. A minimum of 5 characters is required.');
      return;
    }

    triggerGeminiGeneration({ customDescription: trimmed }, `CUSTOM: ${trimmed.toUpperCase()}`, 'CUSTOM');
    setCustomInput('');
  };

  // Triggered when loaded template from foot-bar list is clicked
  const handleLoadSavedRecord = (systemType: SystemType) => {
    // If user clicked custom template load custom constructed blueprint, otherwise find from presets
    if (systemType === 'CUSTOM') {
      const customItem = savedRecords.find(r => r.systemType === 'CUSTOM');
      if (customItem) {
        // Find existing custom item configurations or fallback to template
        const customTitle = customItem.systemTitle.replace('CUSTOM: ', '');
        setCustomInput(customTitle.toLowerCase());
        setTimeout(() => {
          document.getElementById('custom-develop-input-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }
    }
    handleSynthesize(systemType);
  };

  return (
    <div className="min-h-screen bg-black text-stone-100 font-sans selection:bg-[#4D4DFF]/30 pb-12" id="blueprint-root-app">
      
      {/* Header and Ingress Controls */}
      <PortalHeader 
        onLoginClick={() => setAuthModal({ isOpen: true, mode: 'LOGIN' })}
        onSignUpClick={() => setAuthModal({ isOpen: true, mode: 'SIGNUP' })}
        onLogoClick={() => setViewState('HOME')}
      />

      <AnimatePresence mode="wait">
        {viewState === 'HOME' ? (
          /* ==================== HOME PORTAL PANEL ==================== */
          <motion.main 
            key="home-portal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-7xl mx-auto px-6 md:px-8 pt-12 md:pt-16"
            id="home-portal-main"
          >
            {/* Display Hero Heading Area (Editorial Aesthetic) */}
            <section className="text-center pt-8 pb-6 max-w-4xl mx-auto" id="hero-heading-block">
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#4D4DFF] font-black uppercase inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] mb-6">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                ZERO-TRUST SECURE SCHIELD HUB
              </span>
              
              <h1 className="font-sans font-neutral font-black italic tracking-tighter text-4xl md:text-6xl text-center uppercase mb-6 text-white leading-none">
                Secure Design For <span className="text-[#4D4DFF]">Developer</span>
              </h1>
              
              <p className="font-sans text-xs md:text-sm text-zinc-400 mt-2 max-w-2xl mx-auto leading-relaxed">
                Select the system category below you want to design.
              </p>
            </section>

            {/* Custom Interactive Blueprint Creator Form (Editorial Aesthetic) */}
            <section className="max-w-2xl mx-auto mb-16 md:mb-20" id="custom-system-generator">
              <form 
                onSubmit={handleDevelopCustom}
                className="w-full flex flex-col sm:flex-row gap-3"
                id="custom-develop-input-form"
              >
                <div className="flex-grow relative">
                  <input 
                    type="text" 
                    required
                    value={customInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="e.g. ticket selling app, smart IoT hub, gaming API server..." 
                    className={`w-full bg-[#0A0A0A] border px-5 py-3.5 rounded-lg text-xs md:text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none transition-colors ${
                      inputError ? 'border-amber-500/55 focus:border-amber-500' : 'border-[#1A1A1A] focus:border-[#4D4DFF]'
                    }`}
                    id="input-custom-architecture"
                  />
                  <div className="absolute right-4 top-4.5 text-white/20">
                    <Terminal className="w-4 h-4" />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="px-8 py-3.5 bg-gradient-to-r from-[#A855F7] to-[#4D4DFF] rounded-lg font-bold text-xs md:text-sm tracking-widest uppercase flex items-center justify-center gap-2 whitespace-nowrap shadow-lg cursor-pointer hover:shadow-[0_0_20px_rgba(77,77,255,0.4)] transition-all"
                  id="btn-custom-develop-submit"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  DEVELOP CUSTOM SYSTEM
                </button>
              </form>

              {/* Input validation feedback for invalid inputs */}
              <AnimatePresence>
                {inputError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-2 text-[11px] font-mono text-amber-500 tracking-wider flex items-center gap-1.5"
                    id="custom-input-validation-msg"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>{inputError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Predefined 8-Card Grid Blueprint Catalogue */}
            <section className="mb-16" id="architect-catalogue-grid-container">
              {/* 8-Card Grid Component */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" id="blueprint-architecture-grid">
                {blueprints.slice(0, 6).map((item) => (
                  <SystemCard 
                    key={item.id} 
                    blueprint={item} 
                    onSynthesize={handleSynthesize} 
                  />
                ))}
              </div>
            </section>

            {/* Historical Saved blueprints persistence records */}
            <section className="mb-12">
              <SavedBlueprints 
                savedList={savedRecords} 
                onLoadBlueprint={handleLoadSavedRecord} 
              />
            </section>
          </motion.main>
        ) : (
          /* ==================== ACTIVE 2D CANVAS VIEW ==================== */
          <motion.div
            key="canvas-lab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            id="canvas-lab-route"
          >
            <SecurityCanvas 
              blueprint={selectedBlueprint} 
              onBack={() => setViewState('HOME')} 
              onDynamicSwitch={handleSynthesize}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay for Dynamic Gemini Synthesis */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-stone-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="dynamic-gemini-loading-screen"
          >
            <div className="max-w-md w-full text-center space-y-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-zinc-90 w-16 h-16 border-t-[#4D4DFF] animate-spin" style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }} />
                <Sparkles className="w-6 h-6 text-[#00FF88] absolute animate-pulse" />
              </div>

              <div className="space-y-1">
                <h2 className="font-sans font-black italic tracking-tighter text-2xl uppercase text-white leading-tight">
                  Synthesizing Blueprint
                </h2>
              </div>

              <div className="bg-[#050505] border border-zinc-900 rounded-lg p-3 font-mono text-[10px] text-zinc-400 min-h-[48px] flex items-center justify-center text-center shadow-md">
                <span className="text-[#00FF88] mr-2 animate-ping font-black">❯</span> {loadingStep}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== AUTH DEMO MODALS ==================== */}
      <AnimatePresence>
        {authModal.isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="auth-modal-overlay"
          >
            <motion.div 
              className="bg-zinc-950 border border-zinc-900 rounded-xl max-w-md w-full p-6 text-stone-100 shadow-[0_10px_40px_rgba(0,0,0,0.9)] relative"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              id="auth-modal-content"
            >
              <button 
                onClick={() => setAuthModal({ isOpen: false, mode: null })}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                id="auth-modal-close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-[#4D4DFF]" />
                <h3 className="font-sans font-black text-lg text-white tracking-tight uppercase">
                  {authModal.mode === 'LOGIN' ? 'ACCESS PORTAL LOG IN' : 'REGISTER ENROLMENT CERTIFICATE'}
                </h3>
              </div>
              
              <p className="font-sans text-xs text-zinc-400 mb-6 leading-relaxed">
                Connect your developer account credentials to synchronize custom blueprints, configure persistent key rings and publish production threats instantly.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] text-zinc-500 block mb-1">DEVELOPER SIGNATURE (EMAIL)</label>
                  <input
                    type="email"
                    placeholder="e.g. developer@blueprintshield.dev"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#4D4DFF] focus:outline-none rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-zinc-500 block mb-1">KEYS PASSPHRASE</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#4D4DFF] focus:outline-none rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => setAuthModal({ isOpen: false, mode: null })}
                  className="w-full py-2.5 bg-[#4D4DFF] hover:bg-[#3b82f6] text-xs font-mono font-bold uppercase tracking-wider text-white rounded transition-colors mt-2"
                >
                  {authModal.mode === 'LOGIN' ? 'AUTHORIZE ACCESS' : 'ENROLL CLUSTER CERTIFICATE'}
                </button>

                <div className="text-center pt-2">
                  <span className="font-mono text-[9px] text-[#4D4DFF] font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#00FF88]" />
                    SECURE Handshake Active (SHA-256)
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
