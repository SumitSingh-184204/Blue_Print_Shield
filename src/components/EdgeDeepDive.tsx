import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldCheck, ShieldAlert, Key, Link as LinkIcon, 
  Lock, Terminal, ChevronRight, Info, AlertTriangle, RefreshCw
} from 'lucide-react';
import { SecurityEdge, SecurityNode, EdgeSecurityBlueprint } from '../types';

interface EdgeDeepDiveProps {
  isOpen: boolean;
  onClose: () => void;
  edge: SecurityEdge;
  sourceNode: SecurityNode;
  targetNode: SecurityNode;
  systemCategory: string;
}

export default function EdgeDeepDive({ 
  isOpen, 
  onClose, 
  edge, 
  sourceNode, 
  targetNode, 
  systemCategory 
}: EdgeDeepDiveProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [blueprint, setBlueprint] = useState<EdgeSecurityBlueprint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBlueprint = async () => {
    if (isGeneratingBlueprint) return;
    setIsGeneratingBlueprint(true);
    setError(null);
    setBlueprint(null);
    
    try {
      // Validate nodes before sending
      if (!sourceNode || !targetNode) {
        throw new Error("Missing source or target node information");
      }

      console.log("Fetching blueprint for", sourceNode.label, "to", targetNode.label);

      const resp = await fetch("/api/generate-edge-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceNode,
          targetNode,
          systemCategory: systemCategory
        })
      });
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: "Server returned " + resp.status }));
        throw new Error(errorData.details || errorData.error || `HTTP error! status: ${resp.status}`);
      }

      const data = await resp.json();
      if (!data || typeof data !== 'object') {
        throw new Error("Received malformed response from server");
      }

      if (!data.secretManagement || !data.integrityCheck || !data.encryption) {
        console.error("Incomplete blueprint data:", data);
        throw new Error("Incomplete security blueprint generated. Please try again.");
      }

      setBlueprint(data);
    } catch (e: any) {
      console.error("Blueprint fetch error:", e);
      let msg = "An unexpected error occurred while communicating with the security engine.";
      if (e.message?.toLowerCase().includes("quota") || e.message?.toLowerCase().includes("exhausted")) {
        msg = "Security Analysis Quota reached. Please wait a moment before retrying.";
      } else {
        msg = e.message || msg;
      }
      setError(msg);
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  const verifyCode = async () => {
    if (!customCode) return;
    setIsVerifying(true);
    try {
      const resp = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: customCode,
          systemCategory,
          connectionContext: `${sourceNode.label} to ${targetNode.label}`
        })
      });
      const data = await resp.json();
      setAuditResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setBlueprint(null);
      setError(null);
      fetchBlueprint();
      setAuditResult(null);
      setCustomCode('');
    }
  }, [isOpen, sourceNode.id, targetNode.id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#050505] border-l border-[#1A1A1A] z-[100] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#1A1A1A] flex items-center justify-between bg-zinc-950/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded bg-emerald-500/10 border border-emerald-500/20`}>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-mono font-black text-sm uppercase tracking-tighter">Secure Implementation Blueprint</h2>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                  {sourceNode.label} ➔ {targetNode.label}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
             {isGeneratingBlueprint ? (
               <div className="h-64 flex flex-col items-center justify-center space-y-4">
                 <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                 <p className="text-[10px] font-mono text-zinc-500 uppercase animate-pulse">Analyzing security topology via Gemini...</p>
               </div>
             ) : error ? (
               <div className="h-64 flex flex-col items-center justify-center space-y-4 p-6 text-center">
                 <AlertTriangle className="w-10 h-10 text-rose-500" />
                 <h3 className="text-white font-mono text-xs uppercase font-bold tracking-wider">Blueprint Generation Error</h3>
                 <p className="text-zinc-500 text-[11px] font-sans leading-relaxed">{error}</p>
                 <button 
                  onClick={fetchBlueprint}
                  className="mt-4 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-mono text-[10px] uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
                 >
                   Retry Analysis
                 </button>
               </div>
             ) : (blueprint && blueprint.secretManagement) ? (
               <>
                 {/* Best Practice Sections */}
                 {[
                   { id: 'secrets', data: blueprint.secretManagement, icon: Key, color: 'text-amber-400' },
                   { id: 'integrity', data: blueprint.integrityCheck, icon: ShieldAlert, color: 'text-indigo-400' },
                   { id: 'encryption', data: blueprint.encryption, icon: Lock, color: 'text-emerald-400' }
                 ].map(section => (
                   <div key={section.id} className="space-y-3">
                     <div className="flex items-center gap-2">
                       <section.icon className={`w-4 h-4 ${section.color}`} />
                       <h3 className="text-white font-mono text-[11px] font-black uppercase tracking-wider">{section.data.title}</h3>
                     </div>
                     <p className="text-zinc-400 text-xs leading-relaxed font-sans">{section.data.description}</p>
                     <div className="bg-[#0A0A0A] border border-zinc-900 rounded-md p-4 group relative">
                       <pre className="text-[10px] font-mono text-indigo-300 overflow-x-auto">
                         <code>{section.data.code}</code>
                       </pre>
                       <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] font-mono text-zinc-600 uppercase">Production Ready</span>
                       </div>
                     </div>
                   </div>
                 ))}

                 {/* Compliance Grid */}
                 {blueprint.compliance && (
                   <div className="pt-4 border-t border-zinc-900">
                      <h3 className="text-white font-mono text-[11px] font-black uppercase tracking-wider mb-4">Compliance Check-list</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { label: 'PCI-DSS v4.0', val: blueprint.compliance.pciDss },
                          { label: 'RBI Guidelines', val: blueprint.compliance.rbiGuideline || 'Mandatory encryption' },
                          { label: 'DPDP Act', val: blueprint.compliance.dpdpAct }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950/50 border border-zinc-900/50 rounded">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">{item.label}</span>
                            <span className="text-[10px] font-sans text-emerald-400 font-bold">{item.val}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* Interactive Playpen */}
                 <div className="pt-4 border-t border-zinc-900 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-mono text-[11px] font-black uppercase tracking-wider">Live Security Audit</h3>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" /> AI VERIFICATION ACTIVE
                      </div>
                    </div>
                    <p className="text-zinc-500 text-[10px]">Paste your implementation below to verify against secure blueprint standards.</p>
                    
                    <div className="space-y-2">
                      <textarea 
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        placeholder="Paste your API controller code here..."
                        className="w-full h-32 bg-zinc-950 border border-zinc-900 rounded p-3 text-xs font-mono text-zinc-300 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={verifyCode}
                        disabled={isVerifying || !customCode}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-mono text-[11px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                        VERIFY PRODUCTION READINESS
                      </button>
                    </div>

                    {auditResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-md border flex gap-3 ${
                          auditResult.status === 'SECURE' 
                            ? 'bg-emerald-950/20 border-emerald-900/50' 
                            : 'bg-rose-950/20 border-rose-900/50'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {auditResult.status === 'SECURE' ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-rose-400" />}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            STATUS: <span className={auditResult.status === 'SECURE' ? 'text-emerald-400' : 'text-rose-400'}>{auditResult.status}</span>
                          </h4>
                          <ul className="space-y-1">
                            {auditResult.findings.map((f: string, i: number) => (
                              <li key={i} className="text-[10px] text-zinc-400 flex items-start gap-1.5 font-sans leading-snug">
                                <span className="text-zinc-600 mt-1">•</span> {f}
                              </li>
                            ))}
                          </ul>
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase block mb-1">PROPOSED SEC-FIX:</span>
                            <p className="text-[10px] text-zinc-300 italic leading-relaxed font-sans">{auditResult.fix}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                 </div>
               </>
             ) : (
               <div className="h-64 flex items-center justify-center">
                 <p className="text-zinc-600 font-mono text-[10px] uppercase">Select a connection to view blueprint</p>
               </div>
             )}
          </div>

          {/* Footer */}
          <div className="bg-[#0A0A0A] border-t border-[#1A1A1A] p-4 text-center">
            <p className="text-[9px] font-mono text-zinc-650 uppercase tracking-[0.2em] select-none">
              © 2026 ARCHITECTURE SECURITY LABS • END-TO-END VERIFIED
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
