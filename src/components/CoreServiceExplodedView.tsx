import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Handle, 
  Position, 
  Background, 
  Controls, 
  Edge, 
  Node, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Connection,
  addEdge,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ShieldCheck, CheckCircle, X, 
  AlertTriangle, Hammer, Zap, Download, MessageSquare,
  Activity, ShieldAlert, FileCode, PlusCircle
} from 'lucide-react';
import { SystemBlueprint, SystemType, RBACEntity, RBACAttribute } from '../types';
import { RBAC_SYSTEM_DATA } from '../data';

interface CoreServiceExplodedViewProps {
  blueprint: SystemBlueprint;
  onClose: () => void;
  systemIntegrity: number;
  setSystemIntegrity: (val: number) => void;
}

// Custom Node: Subject
const SubjectNode = ({ data }: any) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className={`p-4 bg-zinc-950 border-2 rounded-xl w-48 shadow-2xl transition-all ${data.isHovered ? 'border-indigo-500 shadow-indigo-500/20' : 'border-zinc-800'}`}
  >
    <div className="flex justify-between items-start mb-2">
       <div className="p-1 px-2 border border-zinc-900 bg-zinc-900/50 rounded text-[7px] font-mono text-zinc-500 uppercase">Subject Entity</div>
       <div className="w-2 h-2 rounded-full bg-indigo-500" />
    </div>
    <div className="text-white font-black italic uppercase text-lg leading-none mb-1">{data.label}</div>
    <div className="text-zinc-500 text-[10px] font-mono truncate">{data.detail}</div>
    <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3" />
  </motion.div>
);

// Custom Node: Logic Hub
const LogicHubNode = ({ data }: any) => (
  <motion.div 
    animate={data.isForced ? { scale: [1, 1.1, 1] } : {}}
    transition={{ repeat: Infinity, duration: 1 }}
    className={`w-32 h-32 rotate-45 border-4 flex items-center justify-center bg-black/80 backdrop-blur-md shadow-2xl relative ${data.isForced ? 'border-rose-500' : 'border-zinc-800'}`}
  >
    <div className="-rotate-45 flex flex-col items-center">
       {data.isForced ? <AlertTriangle className="w-10 h-10 text-rose-500" /> : <ShieldCheck className="w-10 h-10 text-emerald-500" />}
       <span className="text-[10px] font-mono font-black text-white mt-1 uppercase tracking-tighter">Logic Gate</span>
    </div>
    <Handle type="target" position={Position.Left} className="!opacity-0" />
    <Handle type="source" position={Position.Right} className="!opacity-0" />
    {/* Specialized internal handles for routing */}
    <Handle type="target" id="in" position={Position.Left} style={{ top: '50%', left: 0 }} className="!bg-zinc-700" />
    <Handle type="source" id="out" position={Position.Right} style={{ top: '50%', right: 0 }} className="!bg-zinc-700" />
  </motion.div>
);

// Custom Node: Attribute
const AttributeNode = ({ data }: any) => (
  <motion.div 
    animate={data.isDenied ? {
      x: [0, -2, 2, -2, 2, 0],
      transition: { repeat: Infinity, duration: 0.1 }
    } : {}}
    className={`p-4 bg-zinc-950 border-2 rounded-xl w-48 shadow-2xl transition-all ${data.isDenied ? 'border-rose-500' : (data.isPermitted ? 'border-[#00FF88]' : 'border-zinc-800')}`}
  >
    <div className="flex justify-between items-start mb-2">
       <div className="p-1 px-2 border border-zinc-900 bg-zinc-900/50 rounded text-[7px] font-mono text-zinc-500 uppercase">Resource Node</div>
       <div className={`w-2 h-2 rounded-full ${data.isDenied ? 'bg-rose-500' : (data.isPermitted ? 'bg-emerald-500' : 'bg-zinc-700')}`} />
    </div>
    <div className={`font-black italic uppercase text-sm leading-none mb-1 ${data.isDenied ? 'text-rose-400' : (data.isPermitted ? 'text-emerald-400' : 'text-white')}`}>
      {data.label}
    </div>
    <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-tighter">{data.category}</div>
    <Handle type="target" position={Position.Left} className={`!w-3 !h-3 ${data.isDenied ? '!bg-rose-500' : (data.isPermitted ? '!bg-emerald-500' : '!bg-zinc-700')}`} />
  </motion.div>
);

const nodeTypes = {
  subject: SubjectNode,
  hub: LogicHubNode,
  attribute: AttributeNode,
};

const RISK_MAP: Record<string, any> = {
  HEALTH: {
    'BILLING CLERK': {
      'MEDICAL HISTORY': {
        vector: 'Privilege Escalation: A Billing Clerk can now edit Medical Prescriptions, leading to potential medication errors.',
        business: 'Data Corruption / Operational Risk',
        legal: 'IT Act 43A & DPDP Act 2023. Violation: Failure to implement Purpose Limitation. Potential Fine: Up to ₹250 Crore.'
      }
    }
  }
};

export default function CoreServiceExplodedView({ blueprint, onClose, setSystemIntegrity }: CoreServiceExplodedViewProps) {
  const [subjects, setSubjects] = useState<RBACEntity[]>(RBAC_SYSTEM_DATA[blueprint.id]?.subjects || []);
  const [attributes, setAttributes] = useState<RBACAttribute[]>(RBAC_SYSTEM_DATA[blueprint.id]?.attributes || []);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [detailsSidebarNodeId, setDetailsSidebarNodeId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [showForcePopup, setShowForcePopup] = useState<any>(null);
  const [activePromptLine, setActivePromptLine] = useState<any>(null);
  const [customRuleInput, setCustomRuleInput] = useState('');
  const [policyFormat, setPolicyFormat] = useState('.rego');

  const [expansionPrompt, setExpansionPrompt] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [expansionError, setExpansionError] = useState<string | null>(null);

  const handleNodeExpansion = async () => {
    if (!expansionPrompt.trim()) return;
    setIsExpanding(true);
    setExpansionError(null);

    try {
      const response = await fetch('/api/evaluate-attribute-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemType: blueprint.id,
          prompt: expansionPrompt,
          existingSubjects: subjects.map(s => s.label),
          existingAttributes: attributes.map(a => a.label)
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      if (result.isSuitable) {
        let updatedSubjects = [...subjects];
        let updatedAttributes = [...attributes];

        if (result.newSubjects?.length > 0) {
          const newSubs = result.newSubjects;
          updatedSubjects = [...updatedSubjects, ...newSubs];
          setSubjects(updatedSubjects);
          
          const newNodes: Node[] = newSubs.map((sub: any, i: number) => ({
            id: sub.id,
            type: 'subject',
            data: { label: sub.label, detail: sub.detail },
            position: { x: 200, y: 150 + (subjects.length + i) * 150 },
          }));
          setNodes(prev => [...prev, ...newNodes]);
        }

        if (result.newAttributes?.length > 0) {
          const newAttrs = result.newAttributes;
          updatedAttributes = [...updatedAttributes, ...newAttrs];
          setAttributes(updatedAttributes);

          const newNodes: Node[] = newAttrs.map((attr: any, i: number) => ({
            id: attr.id,
            type: 'attribute',
            data: { label: attr.label, category: attr.category, isDenied: false, isPermitted: false },
            position: { x: 1000, y: 150 + (attributes.length + i) * 150 },
          }));
          setNodes(prev => [...prev, ...newNodes]);
        }

        // Recompute any missing edges for the new pairs
        setEdges(prev => {
          const newEdgesList: Edge[] = [];
          updatedSubjects.forEach(sub => {
            updatedAttributes.forEach(attr => {
              const edgeId1 = `e1-${sub.id}-${attr.id}`;
              const edgeId2 = `e2-${sub.id}-${attr.id}`;
              
              // Check AI response to determine if this pair is permitted
              const isPermitted = result.newConnections?.some((conn: any) => 
                 conn.subjectLabel === sub.label && conn.attributeLabel === attr.label
              );
              
              const color = isPermitted ? '#00FF88' : '#FF4444';
              const dash = isPermitted ? [] : [4, 4];
              const pType = isPermitted ? 'permit' : 'deny';

              if (!prev.some(e => e.id === edgeId1)) {
                newEdgesList.push({
                  id: edgeId1,
                  source: sub.id,
                  target: 'logic-hub',
                  targetHandle: 'in',
                  style: { stroke: color, strokeWidth: 1, strokeDasharray: dash.join(' ') },
                  animated: isPermitted,
                  data: { type: pType, subjectId: sub.id, attributeId: attr.id }
                });
              }
              
              if (!prev.some(e => e.id === edgeId2)) {
                newEdgesList.push({
                  id: edgeId2,
                  source: 'logic-hub',
                  sourceHandle: 'out',
                  target: attr.id,
                  style: { stroke: color, strokeWidth: 1, strokeDasharray: dash.join(' ') },
                  animated: isPermitted,
                  data: { type: pType, subjectId: sub.id, attributeId: attr.id }
                });
              }
            });
          });
          return [...prev, ...newEdgesList];
        });

        setExpansionPrompt('');
      } else {
        setExpansionError(result.reason || "This node is not suitable for the current system.");
      }
    } catch (error) {
      console.error("Expansion Error:", error);
      setExpansionError("AI processing failed. Please try again.");
    } finally {
      setIsExpanding(false);
    }
  };

  // Initialize React Flow elements
  useEffect(() => {
    if (nodes.length > 0) return; // Only init once
    const initialNodes: Node[] = [];
    
    // Subjects
    subjects.forEach((sub, i) => {
      initialNodes.push({
        id: sub.id,
        type: 'subject',
        data: { label: sub.label, detail: sub.detail },
        position: { x: 200, y: 150 + i * 150 },
      });
    });

    // Central Hub
    initialNodes.push({
      id: 'logic-hub',
      type: 'hub',
      data: { isForced: false },
      position: { x: 550, y: 350 },
      draggable: false,
    });

    // Attributes
    attributes.forEach((attr, i) => {
      initialNodes.push({
        id: attr.id,
        type: 'attribute',
        data: { label: attr.label, category: attr.category, isDenied: false, isPermitted: false },
        position: { x: 1000, y: 150 + i * 150 },
      });
    });

    setNodes(initialNodes);

    // Initial edges based on heuristic RBAC
    const initialEdges: Edge[] = [];
    subjects.forEach(sub => {
      attributes.forEach(attr => {
        let isPermitted = false;
        if (blueprint.id === 'HEALTH') {
          if (sub.label === 'DOCTOR' && (attr.label === 'MEDICAL HISTORY' || attr.label === 'PRESCRIPTIONS')) isPermitted = true;
          if (sub.label === 'BILLING CLERK' && attr.label === 'BILLING STATEMENT') isPermitted = true;
        } else {
            if (subjects.indexOf(sub) === attributes.indexOf(attr)) isPermitted = true;
        }

        const color = isPermitted ? '#00FF88' : '#FF4444';
        const dash = isPermitted ? [] : [4, 4];

        // Edge 1: Subject -> Hub
        initialEdges.push({
          id: `e1-${sub.id}-${attr.id}`,
          source: sub.id,
          target: 'logic-hub',
          targetHandle: 'in',
          style: { stroke: color, strokeWidth: 1, strokeDasharray: dash.join(' ') },
          animated: isPermitted,
          data: { type: isPermitted ? 'permit' : 'deny', subjectId: sub.id, attributeId: attr.id }
        });

        // Edge 2: Hub -> Attribute
        initialEdges.push({
          id: `e2-${sub.id}-${attr.id}`,
          source: 'logic-hub',
          sourceHandle: 'out',
          target: attr.id,
          style: { stroke: color, strokeWidth: 1, strokeDasharray: dash.join(' ') },
          animated: isPermitted,
          data: { type: isPermitted ? 'permit' : 'deny', subjectId: sub.id, attributeId: attr.id }
        });
      });
    });
    setEdges(initialEdges);
  }, [blueprint.id, subjects, attributes]);

  const onConnect = useCallback((params: Connection) => {
    // Manual drag connection from Subject to Attribute (bypass hub visual for a moment? No, user says "pass through logic gate")
    // If user drags from Subject to an Attribute directly, we should "Force" it.
    const srcNode = nodes.find(n => n.id === params.source);
    const tgtNode = nodes.find(n => n.id === params.target);
    
    if (srcNode?.type === 'subject' && tgtNode?.type === 'attribute') {
       setShowForcePopup({ subjectId: params.source, attributeId: params.target });
    }
  }, [nodes]);

  const handleForceOverride = () => {
    if (!showForcePopup) return;
    const { subjectId, attributeId } = showForcePopup;
    
    setEdges(prev => prev.map(e => {
      if (e.data?.subjectId === subjectId && e.data?.attributeId === attributeId) {
        return {
          ...e,
          style: { stroke: '#F59E0B', strokeWidth: 3 },
          animated: true,
          data: { ...e.data, type: 'forced' }
        };
      }
      return e;
    }));

    setNodes(prev => prev.map(n => {
        if (n.id === 'logic-hub') return { ...n, data: { ...n.data, isForced: true } };
        return n;
    }));

    setShowForcePopup(null);
  };

  const handleCustomRuleSubmit = () => {
    if (!activePromptLine || !customRuleInput.trim()) return;
    const { subjectId, attributeId } = activePromptLine;

    setEdges(prev => prev.map(e => {
        if (e.data?.subjectId === subjectId && e.data?.attributeId === attributeId) {
          return {
            ...e,
            style: { stroke: '#4488FF', strokeWidth: 2, strokeDasharray: '0' },
            animated: true,
            data: { ...e.data, type: 'customized', customRule: customRuleInput }
          };
        }
        return e;
      }));

    setActivePromptLine(null);
    setCustomRuleInput('');
  };

  useEffect(() => {
    // Update node statuses based on edges for layout visuals
    setNodes(prev => prev.map(node => {
        if (node.type === 'subject') {
            return { ...node, data: { ...node.data, isHovered: node.id === hoveredNodeId } };
        }
        if (node.type === 'attribute') {
            const connectedEdges = edges.filter(e => e.target === node.id && (e.data?.subjectId === hoveredNodeId || e.data?.subjectId === selectedPath?.subjectId));
            const isDenied = connectedEdges.some(e => e.data?.type === 'deny');
            const isPermitted = connectedEdges.some(e => e.data?.type === 'permit' || e.data?.type === 'customized');
            return { ...node, data: { ...node.data, isDenied, isPermitted } };
        }
        if (node.id === 'logic-hub') {
            const hasForced = edges.some(e => e.data?.type === 'forced');
            return { ...node, data: { ...node.data, isForced: hasForced } };
        }
        return node;
    }));

    const forcedCount = edges.filter(e => e.data?.type === 'forced').length;
    setSystemIntegrity(Math.max(0, 100 - forcedCount * 25));
  }, [edges, hoveredNodeId, selectedPath]);

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    setSelectedPath(edge.data);
  }, []);

  const onNodeMouseEnter = useCallback((_: any, node: Node) => {
    if (node.type === 'subject') setHoveredNodeId(node.id);
    if ((node.type === 'subject' || node.type === 'attribute') && !node.id.startsWith('ai_')) {
      setDetailsSidebarNodeId(node.id);
    }
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const styledEdges = useMemo(() => {
    return edges.map(edge => {
      const isRelated = (!hoveredNodeId && !selectedPath) || 
                       (hoveredNodeId && edge.data?.subjectId === hoveredNodeId) ||
                       (selectedPath && edge.data?.subjectId === selectedPath.subjectId);
      
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isRelated ? 1 : 0.05
        }
      };
    });
  }, [edges, hoveredNodeId, selectedPath]);

  const downloadPolicy = () => {
    const policy = {
        system: blueprint.id,
        rules: edges.filter(e => e.source === 'logic-hub').map(e => ({
            role: subjects.find(s => s.id === e.data.subjectId)?.label,
            resource: attributes.find(a => a.id === e.data.attributeId)?.label,
            status: e.data.type,
            custom: e.data.customRule || null
        }))
    };
    const blob = new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policy_repo_${blueprint.id}${policyFormat}`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-[#020202] z-50 flex flex-col font-sans">
      <div className="h-16 border-b border-zinc-800 bg-[#050505] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 cursor-pointer">
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-white font-black italic uppercase text-xl">{blueprint.title} Architect</h1>
            <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">Phase 1: RBAC Map Generation Active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <select 
             value={policyFormat} 
             onChange={(e) => setPolicyFormat(e.target.value)}
             className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono rounded px-2"
           >
             <option value=".rego">.REGO</option>
             <option value=".json">.JSON</option>
             <option value=".yaml">.YAML</option>
           </select>
           <button onClick={downloadPolicy} className="bg-[#00FF88] text-black font-mono font-black text-[10px] px-4 py-2 rounded uppercase cursor-pointer">
             <Download className="w-4 h-4 inline mr-2" /> Download Repo
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-zinc-900 bg-black/40 p-6 z-20 flex flex-col gap-6 overflow-y-auto">
           {/* AI Node Expansion */}
           <div className="space-y-4">
              <h3 className="text-zinc-500 font-mono text-[10px] uppercase font-black flex items-center gap-2">
                <PlusCircle className="w-3 h-3 text-[#4488FF]" /> Blueprint Expansion
              </h3>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 space-y-3">
                 <p className="text-zinc-500 text-[10px] font-mono leading-relaxed">
                   AI-driven node generation. Add entities (Roles) or attributes (Resources) to the system.
                 </p>
                 <textarea 
                   value={expansionPrompt}
                   onChange={(e) => setExpansionPrompt(e.target.value)}
                   disabled={isExpanding}
                   className="w-full h-24 bg-black border border-zinc-800 rounded-lg p-2 text-[11px] text-white font-mono outline-none focus:border-[#4488FF] resize-none"
                   placeholder="e.g. Add 2 health attributes or 'Pharmacist' role..."
                 />
                 
                 {expansionError && (
                   <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-500 text-[9px] font-mono italic">
                     {expansionError}
                   </div>
                 )}

                 <button 
                   onClick={handleNodeExpansion}
                   disabled={isExpanding || !expansionPrompt.trim()}
                   className="w-full py-3 bg-[#4488FF]/10 text-[#4488FF] hover:bg-[#4488FF]/20 border border-[#4488FF]/30 rounded-lg text-[10px] font-mono font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer"
                 >
                   {isExpanding ? (
                     <Activity className="w-3 h-3 animate-spin" />
                   ) : (
                     <Zap className="w-3 h-3" />
                   )}
                   Analyze & Add
                 </button>
              </div>
           </div>

           <div className="space-y-4 border-t border-zinc-900 pt-6">
              <h3 className="text-zinc-500 font-mono text-[10px] uppercase font-black">Risk Ledger</h3>
              {selectedPath && (selectedPath.type === 'deny' || selectedPath.type === 'forced') ? (
                 <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-4">
                    <div className="text-rose-500 font-mono font-black text-[10px] uppercase">Attack Vector Identified</div>
                    <p className="text-zinc-300 text-xs">{RISK_MAP[blueprint.id]?.[subjects.find(s=>s.id===selectedPath.subjectId)?.label || '']?.[attributes.find(a=>a.id===selectedPath.attributeId)?.label || '']?.vector || 'Potential unauthorized lateral movement.'}</p>
                    <div className="text-rose-400 font-mono font-black text-[10px] uppercase pt-2 border-t border-rose-500/20">Legal Penalty</div>
                    <p className="text-rose-200/50 text-[10px] italic">Violation: DPDP Act 2023. Fine: Up to ₹250 Crore.</p>
                    {selectedPath.type === 'deny' && (
                        <button onClick={() => setShowForcePopup({ subjectId: selectedPath.subjectId, attributeId: selectedPath.attributeId })} className="w-full py-2 bg-zinc-900 text-rose-500 border border-rose-500/30 rounded text-[10px] font-mono uppercase cursor-pointer mt-2">Force Access</button>
                    )}
                 </div>
              ) : (
                 <p className="text-zinc-700 text-xs italic">Select a red or orange path to analyze risk...</p>
              )}
           </div>
        </div>

        <div className="flex-1 relative bg-black">
           <ReactFlow
             nodes={nodes}
             edges={styledEdges}
             onNodesChange={onNodesChange}
             onEdgesChange={onEdgesChange}
             onConnect={onConnect}
             onEdgeClick={onEdgeClick}
             onNodeMouseEnter={onNodeMouseEnter}
             onNodeMouseLeave={onNodeMouseLeave}
             nodeTypes={nodeTypes}
             fitView
             className="bg-black"
           >
             <Background color="#111" gap={20} />
             <Controls className="!bg-zinc-900 !border-zinc-800" />
             <Panel position="top-center" className="bg-black/80 backdrop-blur-md border border-zinc-800 p-2 rounded-full px-6 flex gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00FF88]" />
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Standard Permit</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Standard Deny</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Forced Override</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4488FF]" />
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">ABAC Customized</span>
                </div>
             </Panel>
             
             {/* Custom Overlay for 'Customize' buttons on edges */}
             <div className="absolute inset-0 pointer-events-none">
                {edges.filter(e => e.source !== 'logic-hub').map(edge => {
                    // Logic to find edge midpoint and show button
                    // React Flow doesn't easily expose edge midpoints in a separate overlay without complex logic
                    // We'll simplify: clicking edge selects it, then we show a small panel or use the sidebar
                })}
             </div>
           </ReactFlow>

           {/* Manual Button for Customization if edge is selected */}
           {selectedPath && (
             <div className="absolute bottom-24 right-6 flex flex-col gap-3">
                <button 
                  onClick={() => setActivePromptLine({ subjectId: selectedPath.subjectId, attributeId: selectedPath.attributeId })}
                  className="bg-[#4488FF] text-white px-6 py-3 rounded-xl font-mono font-black text-xs uppercase shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
                >
                  <Hammer className="w-4 h-4" /> Customize Path Condition
                </button>
             </div>
           )}

        </div>
      </div>

      <AnimatePresence>
        {detailsSidebarNodeId && (() => {
          const s = subjects.find(x => x.id === detailsSidebarNodeId);
          const a = attributes.find(x => x.id === detailsSidebarNodeId);
          const node = s || a;
          if (!node) return null;
          const isEntity = !!s;

          return (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="absolute left-0 top-0 h-full w-80 bg-zinc-950 border-r border-zinc-800 p-6 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-1">
                    {isEntity ? 'Entity Details' : 'Attribute Details'}
                  </div>
                  <h3 className="text-white font-mono font-black text-lg uppercase italic">{node.label}</h3>
                </div>
                <button 
                  onClick={() => setDetailsSidebarNodeId(null)}
                  className="text-zinc-500 hover:text-white transition-colors mt-0.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Detail</div>
                  <div className="text-xs text-zinc-300 font-mono leading-relaxed">
                    {'detail' in node ? node.detail : (node as any).category || 'No details available.'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Classification</div>
                  <div className="text-xs text-[#00FF88] font-mono uppercase bg-[#00FF88]/10 inline-block px-2 py-1 rounded">
                    {node.classification || 'Standard'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">
                    {isEntity ? 'Subject Attributes' : 'Object Attributes'}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-amber-400 font-mono uppercase bg-amber-400/10 inline-block px-2 py-1 rounded w-fit">
                      {node.sensitivity || 'Medium Sensitivty'} 
                    </div>
                    {node.reasoning && (
                      <div className="text-xs text-zinc-400 font-mono italic mt-2 border-l border-zinc-800 pl-2">
                        {node.reasoning}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
        {activePromptLine && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="w-96 bg-zinc-950 border-2 border-[#4488FF] p-6 rounded-2xl shadow-2xl">
               <h3 className="text-[#4488FF] font-mono font-black text-xs uppercase mb-4">Inject Condition</h3>
               <textarea 
                 value={customRuleInput}
                 onChange={(e) => setCustomRuleInput(e.target.value)}
                 className="w-full h-32 bg-black border border-zinc-800 p-3 text-xs text-white font-mono outline-none"
                 placeholder="e.g. Allowed only if Supervisor_ID is present..."
               />
               <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setActivePromptLine(null)} className="text-zinc-500 text-xs uppercase">Cancel</button>
                  <button onClick={handleCustomRuleSubmit} className="bg-[#4488FF] text-white px-4 py-2 rounded text-xs uppercase font-black">Validate Rule</button>
               </div>
            </div>
          </motion.div>
        )}

        {showForcePopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-rose-950/20 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <div className="max-w-md bg-zinc-950 border border-rose-500 p-8 rounded-2xl shadow-2xl">
               <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
               <h3 className="text-white font-black text-2xl uppercase italic">Force RBAC Override?</h3>
               <p className="text-zinc-500 text-sm my-4">This manual bypass violates industry standards and reduces compliance score.</p>
               <div className="flex gap-4 mt-6">
                 <button onClick={() => setShowForcePopup(null)} className="flex-1 bg-zinc-900 text-zinc-400 py-3 rounded text-xs uppercase">Abort</button>
                 <button onClick={handleForceOverride} className="flex-1 bg-rose-600 text-white py-3 rounded text-xs uppercase font-black">Force Loophole</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
