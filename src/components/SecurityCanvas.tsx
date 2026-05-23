import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Shield, ShieldAlert, ShieldCheck, Play, 
  Terminal, Server, Database, Globe, Key, Plus, 
  Settings, Check, X, Skull, RefreshCw, Cpu, Activity,
  Sparkles, Lock, Unlock, Maximize2, Code, FileText, AlertCircle, Eye, ExternalLink
} from 'lucide-react';
import { SystemBlueprint, SecurityNode, SecurityRule, ThreatSimulation, SystemType, SecurityEdge, EdgeSecurityBlueprint } from '../types';
import { THREAT_SIMULATIONS } from '../data';
import FrontendExplodedView from './FrontendExplodedView';
import CoreServiceExplodedView from './CoreServiceExplodedView';
import EdgeDeepDive from './EdgeDeepDive';
import DatabaseDeepDive from './DatabaseDeepDive';

interface SecurityCanvasProps {
  blueprint: SystemBlueprint;
  onBack: () => void;
  onDynamicSwitch: (systemType: SystemType) => void;
}

export default function SecurityCanvas({ blueprint, onBack, onDynamicSwitch }: SecurityCanvasProps) {
  console.log('SecurityCanvas rendering started', { blueprintId: blueprint?.id });
  const [nodes, setNodes] = useState<SecurityNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExplodedView, setIsExplodedView] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isCoreServiceView, setIsCoreServiceView] = useState(false);
  
  // Zoom, Pan and Canvas View Controls State
  const [edges, setEdges] = useState<SecurityEdge[]>([]);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isMaxCanvas, setIsMaxCanvas] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Deep Dive State
  const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number | null>(null);
  const [isDbDeepDiveOpen, setIsDbDeepDiveOpen] = useState(false);
  const [dbDeepDiveNode, setDbDeepDiveNode] = useState<SecurityNode | null>(null);

  // Component Dragging State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState({ x: 0, y: 0 });
  const canvasStageRef = useRef<HTMLDivElement>(null);

  // Editable title helper
  const [customTitle, setCustomTitle] = useState('');

  // Interactive manual linking mode states
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Simulation conditions
  const [activeSimulation, setActiveSimulation] = useState<ThreatSimulation | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTargetId, setSimulationTargetId] = useState<string | null>(null);

  // Dynamic system overview state calculated depending on rules in nodes
  const [systemIntegrity, setSystemIntegrity] = useState(98);
  const [actionHistory, setActionHistory] = useState<string[]>([]);

  // Initialize nodes and edges
  useEffect(() => {
    if (blueprint.nodes.length > 0) {
      setNodes(JSON.parse(JSON.stringify(blueprint.nodes)));
      setCustomTitle(blueprint.title);
      setSelectedNodeId(blueprint.nodes[0].id);
    }
    
    if (blueprint.edges && blueprint.edges.length > 0) {
      setEdges(blueprint.edges as SecurityEdge[]);
    } else {
      // Create sequential fallback connections if loading a static blueprint or offline
      const sequentialEdges: SecurityEdge[] = [];
      for (let i = 0; i < blueprint.nodes.length - 1; i++) {
        sequentialEdges.push({
          source: blueprint.nodes[i].id,
          target: blueprint.nodes[i + 1].id,
          protocol: "TLS 1.3 / HTTPS",
          status: "secure"
        });
      }
      setEdges(sequentialEdges);
    }

    setActionHistory([`[INIT] Compiled architecture for system: ${blueprint.title}`]);
    
    // Calculate initial integrity
    calculateIntegrity(blueprint.nodes);
  }, [blueprint]);

  const activeNode = nodes.find(n => n.id === (hoveredNodeId || selectedNodeId)) || null;

  // Custom Mouse Drag & Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if we clicked on a node to drag it
    const nodeContainer = target.closest('[id^="canvas-node-"]');
    if (nodeContainer) {
      if (
        target.closest('button') || 
        target.closest('input') || 
        target.closest('select')
      ) {
        return;
      }
      
      const idMatch = nodeContainer.id.match(/^canvas-node-(.+)$/);
      if (idMatch) {
         const nodeId = idMatch[1];
         e.stopPropagation();
         setDraggedNodeId(nodeId);
         setSelectedNodeId(nodeId);
         
         const node = nodes.find(n => n.id === nodeId);
         
         if (node?.type === 'db' && !node.id.startsWith('ai-node')) {
           setDbDeepDiveNode(node);
           setIsDbDeepDiveOpen(true);
         }

         if (node?.type === 'api' && !node.id.startsWith('ai-node')) {
           setIsCoreServiceView(true);
         }
         
         if (node && canvasStageRef.current) {
           const nodeX = node.position?.x ?? node.x;
           const nodeY = node.position?.y ?? node.y;
           
           const rect = canvasStageRef.current.getBoundingClientRect();
           
           // Calculate click coordinates in percentages relative to the stage bounds
           const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
           const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;
           
           setNodeDragOffset({
             x: clickXPercent - nodeX,
             y: clickYPercent - nodeY
           });
         }
      }
      return;
    }

    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select')
    ) {
      return;
    }

    // Cancel connection process if background is clicked
    if (connectingSourceId) {
      setConnectingSourceId(null);
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // If we are connecting manually, update target coordinates
    if (connectingSourceId && canvasStageRef.current) {
      const rect = canvasStageRef.current.getBoundingClientRect();
      const currentXPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const currentYPercent = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x: currentXPercent, y: currentYPercent });
    }

    if (draggedNodeId && canvasStageRef.current) {
      e.preventDefault();
      const rect = canvasStageRef.current.getBoundingClientRect();
      
      const currentXPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const currentYPercent = ((e.clientY - rect.top) / rect.height) * 100;
      
      let nextX = currentXPercent - nodeDragOffset.x;
      let nextY = currentYPercent - nodeDragOffset.y;
      
      // Strict canvas containment limits 4% - 96%
      nextX = Math.round(Math.max(4, Math.min(96, nextX)));
      nextY = Math.round(Math.max(4, Math.min(96, nextY)));
      
      setNodes(prev => prev.map(n => n.id === draggedNodeId ? {
        ...n,
        position: { x: nextX, y: nextY },
        x: nextX,
        y: nextY
      } : n));
      return;
    }

    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  // Verify safety profile of a single connection edge route
  const checkEdgeSecurity = (
    edge: SecurityEdge, 
    currentNodes: SecurityNode[]
  ) => {
    const src = currentNodes.find(n => n.id === edge.source);
    const tgt = currentNodes.find(n => n.id === edge.target);
    if (!src || !tgt) return { secure: false, reason: "Orphaned connection path", severity: "high" };

    // 1. Direct client to database link is a critical breach of HIPAA / DPDP Act guidelines
    if (
      (src.type === 'client' && tgt.type === 'db') ||
      (src.type === 'db' && tgt.type === 'client')
    ) {
      return { 
        secure: false, 
        reason: "Direct Client-to-DB database link renders private data unprotected (Critical Risk of DPDP Sec 15 SQL Injection breach)", 
        severity: "critical" 
      };
    }

    // 2. Direct client to API endpoint bypassing WAF
    const hasWaf = currentNodes.some(n => n.type === 'waf');
    if (hasWaf) {
      if (
        (src.type === 'client' && tgt.type === 'api') ||
        (src.type === 'api' && tgt.type === 'client')
      ) {
        return { 
          secure: false, 
          reason: "Direct Client-to-Service interface pipeline bypassing Web Application Firewall (High risk of DDoS / API scraping)", 
          severity: "high" 
        };
      }
    }

    // 3. Directly exposing cache cluster to client browser
    if (
      (src.type === 'client' && tgt.type === 'cache') ||
      (src.type === 'cache' && tgt.type === 'client')
    ) {
      return { 
        secure: false, 
        reason: "Direct Client-to-Cache cluster bypasses validation layers (Risk of stale/malicious state manipulation)", 
        severity: "high" 
      };
    }

    // 4. Client directly to Auth Provider without middle service session ticket orchestration
    if (
      (src.type === 'client' && tgt.type === 'auth') ||
      (src.type === 'auth' && tgt.type === 'client')
    ) {
      return { 
        secure: false, 
        reason: "Unshielded Client-to-Issuer connection allows telemetry spoofing & credential theft", 
        severity: "medium" 
      };
    }

    // 5. Database direct to auth bypasses application logic layer
    if (
      (src.type === 'db' && tgt.type === 'auth') ||
      (src.type === 'auth' && tgt.type === 'db')
    ) {
      return { 
        secure: false, 
        reason: "Cross-service backend-to-auth socket linkage exposes internal service database credentials", 
        severity: "medium" 
      };
    }

    // 6. Checked vulnerability if related safety rules are active
    const sourceHasDisabled = src.securityRules.some(r => !r.enabled);
    const targetHasDisabled = tgt.securityRules.some(r => !r.enabled);
    if (sourceHasDisabled || targetHasDisabled) {
      return { 
        secure: false, 
        reason: "Encrypted handshake compromised because required defense rules on endpoints are disabled", 
        severity: "warning" 
      };
    }

    return { secure: true, reason: "Seamless authorized crypto-pipeline secured", severity: "secure" };
  };

  // Recalculate whole blueprint health index depending on active rules and connection topology safety
  const calculateIntegrity = (currentNodes: SecurityNode[]) => {
    let ruleLoss = 0;

    currentNodes.forEach(node => {
      node.securityRules.forEach(rule => {
        if (!rule.enabled) {
          ruleLoss += 15; // 15% reduction per disabled rule
        }
      });
    });

    // Also calculate connection safety impact on the overall index
    let connectionLoss = 0;
    edges.forEach(edge => {
      const evaluation = checkEdgeSecurity(edge, currentNodes);
      if (!evaluation.secure) {
        if (evaluation.severity === 'critical') connectionLoss += 35;
        else if (evaluation.severity === 'high') connectionLoss += 25;
        else if (evaluation.severity === 'medium') connectionLoss += 15;
        else if (evaluation.severity === 'warning') connectionLoss += 10;
      }
    });

    let computed = Math.max(5, 105 - ruleLoss - connectionLoss - (blueprint.threatScore * 0.4));
    setSystemIntegrity(Math.min(100, Math.round(computed)));
  };

  // Interactive addition of link connections
  const handleAddConnection = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      setActionHistory(prev => [`[LINK ERROR] Cannot connect node "${nodes.find(n => n.id === sourceId)?.label}" to itself!`, ...prev]);
      setConnectingSourceId(null);
      return;
    }

    // Check if link already exists
    const exists = edges.some(e => e.source === sourceId && e.target === targetId);
    if (exists) {
      setActionHistory(prev => [`[LINK ERROR] Pipeline link already exists between specified endpoints!`, ...prev]);
      setConnectingSourceId(null);
      return;
    }

    const src = nodes.find(n => n.id === sourceId);
    const tgt = nodes.find(n => n.id === targetId);
    if (!src || !tgt) return;

    // Pick protocol heuristically
    let proto = "HTTPS";
    if (src.type === 'api' && tgt.type === 'db') proto = "PostgreSQL SSL";
    else if (tgt.type === 'db') proto = "Secure Socket";
    else if (tgt.type === 'auth') proto = "OIDC Protocol";
    else if (tgt.type === 'cache') proto = "TCP Socket";
    else if (src.type === 'waf') proto = "gRPC Flow";

    const newEdge = {
      source: sourceId,
      target: targetId,
      protocol: proto,
      status: 'secure'
    };

    setEdges(prev => [...prev, newEdge]);
    setActionHistory(prev => [
      `[CONNECT] Spawned active pipeline from "${src.label}" to "${tgt.label}" over "${proto}"`,
      ...prev
    ]);
    setConnectingSourceId(null);
  };

  // Interactive deletion of link connections
  const handleRemoveConnection = (sourceId: string, targetId: string) => {
    setEdges(prev => prev.filter(e => !(e.source === sourceId && e.target === targetId)));
    setActionHistory(prev => [
      `[DISCONNECT] Terminated pipeline link from "${nodes.find(n => n.id === sourceId)?.label || sourceId}" to "${nodes.find(n => n.id === targetId)?.label || targetId}"`,
      ...prev
    ]);
  };

  // Trigger recalculation on nodes or edges update
  useEffect(() => {
    if (nodes.length > 0) {
      calculateIntegrity(nodes);
    }
  }, [nodes, edges]);

  // Rule activation toggle
  const handleToggleRule = (nodeId: string, ruleId: string) => {
    const updated = nodes.map(node => {
      if (node.id === nodeId) {
        const updatedRules = node.securityRules.map(rule => {
          if (rule.id === ruleId) {
            const nextState = !rule.enabled;
            setActionHistory(prev => [
              `[RULE CHANGE] Configured key "${rule.name}" to ${nextState ? 'ENABLED ✓' : 'DISABLED ✗'} on node "${node.label}"`,
              ...prev.slice(0, 48)
            ]);
            return { ...rule, enabled: nextState };
          }
          return rule;
        });
        return { ...node, securityRules: updatedRules };
      }
      return node;
    });

    setNodes(updated);
    calculateIntegrity(updated);
  };

  // Node parameter inline updates (like IP, port, names)
  const handleSaveNodeMetadata = (nodeId: string, updates: Partial<SecurityNode>) => {
    const updated = nodes.map(node => {
      if (node.id === nodeId) {
        setActionHistory(prev => [
          `[NODE UPDATE] Parameters edited on node "${node.label}"`,
          ...prev.slice(0, 48)
        ]);
        return { ...node, ...updates };
      }
      return node;
    });
    setNodes(updated);
  };

  // Launch pre-calculated Threat Vectors (simulation)
  const triggerSimulation = (simulation: ThreatSimulation) => {
    if (isSimulating) return;

    setIsSimulating(true);
    setActiveSimulation(simulation);
    setSimulationLogs([`[SIMULATION START] Invoking target vector: ${simulation.name}...`]);
    
    // Find matching target node ID on the canvas topology
    const targetNode = nodes.find(n => n.type === simulation.targetNodeType);
    if (targetNode) {
      setSimulationTargetId(targetNode.id);
    }

    // Set target nodes state to defending or vulnerable depending on rule count
    const hasRequiredRule = targetNode ? targetNode.securityRules.every(r => r.enabled) : true;

    // Sequential log delay rendering for cinematic impact!
    let logsIndex = 0;
    const interval = setInterval(() => {
      if (logsIndex < simulation.logMessages.length) {
        const nextMessage = simulation.logMessages[logsIndex];
        setSimulationLogs(prev => [...prev, nextMessage]);
        
        // Push to overall historic action ledger
        setActionHistory(prev => [nextMessage, ...prev.slice(0, 48)]);
        logsIndex++;
      } else {
        clearInterval(interval);
        
        // Finalize node statuses after defending
        setNodes(prev => prev.map(n => {
          if (n.type === simulation.targetNodeType) {
            return { 
              ...n, 
              status: hasRequiredRule ? 'secure' : 'warn',
              integrity: Math.max(10, n.integrity - (hasRequiredRule ? 2 : 35))
            };
          }
          return n;
        }));

        setIsSimulating(false);
        setSimulationTargetId(null);
        calculateIntegrity(nodes);
      }
    }, 1000);
  };

  // Dynamic Deployer module - injects extra security node to canvas
  const handleAddCustomNode = (type: 'auth' | 'cache') => {
    const exists = nodes.some(n => n.type === type);
    if (exists) {
      setActionHistory(prev => [`[DEPLOY WARNING] Isolated secondary "${type}" node is already deployed on this cluster!`, ...prev]);
      return;
    }

    const id = `custom-${type}-${Date.now().toString().slice(-4)}`;
    const newNode: SecurityNode = type === 'auth' ? {
      id,
      type: 'auth',
      label: 'SHIELD ACC MANAGER v3',
      subLabel: 'Federated Identity Hub',
      ipAddress: '10.0.5.20',
      port: 8089,
      status: 'secure',
      integrity: 100,
      connections: [],
      description: 'Zero-trust enterprise authorization core. Manages claims issuance, session expirations and access token cycles.',
      position: { x: 48, y: 70 },
      securityRules: [
        { id: 'ca1', name: 'JSON Web Token Signing (RSA)', enabled: true, description: 'Signs authorization payloads using localized offline keypairs' },
        { id: 'ca2', name: 'Brute-Force Rate Limiting', enabled: true, description: 'Injects dynamic cooling penalty timeouts for incorrect hashes' }
      ]
    } : {
      id,
      type: 'cache',
      label: 'REDIS CODESECURE SHIELD',
      subLabel: 'Volatile RAM Cache',
      ipAddress: '10.0.4.10',
      port: 6379,
      status: 'secure',
      integrity: 100,
      connections: [],
      description: 'Distributed cache cluster optimized for loading frequent queries without stressing master DB ledger.',
      position: { x: 72, y: 70 },
      securityRules: [
        { id: 'cc1', name: 'Password Authentication Lock', enabled: true, description: 'Refuses open access; demands standard pre-shared auth key strings' },
        { id: 'cc2', name: 'Automatic Cache Purging rules', enabled: true, description: 'Limits cache lifespan to mitigate localized RAM tampering attempts' }
      ]
    };

    // Splice new node inside node wire array logic
    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNodeId(id);

    // Append edges to make connection seamless
    const anchorNode = nodes.find(n => n.type === 'api' || n.type === 'waf') || nodes[0];
    if (anchorNode) {
      setEdges(prev => [...prev, {
        source: anchorNode.id,
        target: id,
        protocol: type === 'auth' ? 'gRPC (mTLS v1.3)' : 'TCP socket',
        status: 'secure'
      }]);
    }

    setActionHistory(prev => [
      `[DEPLOY SYSTEM] Scaled security architecture! Spawned "${newNode.label}" node on port ${newNode.port}`,
      ...prev
    ]);
    calculateIntegrity(updated);
  };

  const [servicePrompt, setServicePrompt] = useState('');
  const [isGeneratingService, setIsGeneratingService] = useState(false);

  // Get matching category icons
  const getNodeIcon = (type: string, sizeClass = "w-5 h-5") => {
    switch (type) {
      case 'client':
        return <Globe className={`${sizeClass} text-sky-400`} />;
      case 'waf':
        return <Shield className={`${sizeClass} text-violet-500`} />;
      case 'api':
        return <Server className={`${sizeClass} text-emerald-400`} />;
      case 'db':
        return <Database className={`${sizeClass} text-purple-400`} />;
      case 'auth':
        return <Key className={`${sizeClass} text-amber-500`} />;
      case 'cache':
        return <Cpu className={`${sizeClass} text-pink-400`} />;
      default:
        return <Server className={`${sizeClass} text-stone-400`} />;
    }
  };

  // Get matched human-readable category badges
  const getTopBadge = (node: SecurityNode) => {
    switch (node.type) {
      case 'client': return 'PUBLIC UI';
      case 'waf': return 'FIREWALL';
      case 'api': return 'PRIVATE SERVICE';
      case 'db': return 'SECURE DB';
      case 'auth': return 'EXTERNAL SERVICE';
      default: return 'NODE MODULE';
    }
  };

  // Get matching category styles
  const getNodeStyles = (node: SecurityNode, isSelected: boolean, nodeWarning: boolean, isSimulationVictim: boolean) => {
    if (isSimulationVictim) {
      return {
        borderClass: 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500 animate-pulse',
        topBadgeColor: 'text-rose-400',
        activeDotClass: 'bg-rose-500',
        badgeText: getTopBadge(node)
      };
    }
    
    let borderClass = 'border-zinc-800 bg-[#050505] hover:border-[#4D4DFF]/50';
    let topBadgeColor = 'text-zinc-500';
    let activeDotClass = 'bg-[#00FF88]';
    
    switch (node.type) {
      case 'client':
        borderClass = isSelected 
          ? 'border-[#0088ff] bg-[#020d1e] ring-1 ring-[#0088ff]/30 shadow-[0_0_15px_rgba(0,136,255,0.25)]' 
          : 'border-[#0088ff]/30 bg-black hover:border-[#0088ff]';
        topBadgeColor = 'text-[#0088ff]';
        break;
      case 'waf':
        borderClass = isSelected 
          ? 'border-amber-500 bg-[#1d1602] ring-1 ring-amber-500/30' 
          : 'border-amber-500/30 bg-black hover:border-amber-500';
        topBadgeColor = 'text-amber-500';
        break;
      case 'api':
        borderClass = isSelected 
          ? 'border-purple-500 bg-[#140026] ring-1 ring-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.25)]' 
          : 'border-purple-550/30 bg-black hover:border-purple-500';
        topBadgeColor = 'text-purple-400';
        break;
      case 'db':
        borderClass = isSelected 
          ? 'border-rose-500 bg-[#22000c]/80 ring-1 ring-rose-500/35 shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
          : 'border-rose-500/30 bg-black hover:border-rose-500';
        topBadgeColor = 'text-rose-450';
        break;
      case 'auth':
        borderClass = isSelected 
          ? 'border-stone-400 bg-[#111112]/90 ring-1 ring-stone-400/30 shadow-[0_0_15px_rgba(228,228,231,0.2)]' 
          : 'border-stone-800 bg-black hover:border-stone-400';
        topBadgeColor = 'text-stone-400';
        break;
      default:
        borderClass = isSelected 
          ? 'border-[#4D4DFF] bg-[#080816] ring-1 ring-[#4D4DFF]/30 shadow-[0_0_15px_rgba(77,77,255,0.2)]' 
          : 'border-zinc-800 bg-[#050505] hover:border-[#4D4DFF]/50';
        topBadgeColor = 'text-zinc-500';
        break;
    }
    
    if (nodeWarning) {
      borderClass = isSelected
        ? 'border-amber-500 bg-[#1a1202] ring-1 ring-amber-500/35'
        : 'border-amber-500/50 bg-[#090909]/95 hover:border-amber-500';
      activeDotClass = 'bg-amber-500';
    }

    return {
      borderClass,
      topBadgeColor,
      activeDotClass,
      badgeText: getTopBadge(node)
    };
  };

  // Dynamically evaluate edge status and reason based on active nodes and connection safety rules
  console.log('Evaluating edges', { edgesCount: edges.length });
  const evaluatedEdges = edges.map(edge => {
    try {
      const check = checkEdgeSecurity(edge, nodes);
      if (!check.secure) {
        if (check.severity === 'warning') {
          return { ...edge, status: 'warning', reason: check.reason };
        } else {
          return { ...edge, status: 'insecure', reason: check.reason };
        }
      }
      return { ...edge, status: 'secure', reason: check.reason };
    } catch (e) {
      console.error('Error evaluating edge', edge, e);
      return { ...edge, status: 'secure', reason: 'Evaluation error' };
    }
  });
  console.log('Edges evaluated successfully');

  // Extract a list of active threats/violations
  const activeThreatsList = evaluatedEdges
    .filter(e => e.status !== 'secure')
    .map(e => ({
      source: nodes.find(n => n.id === e.source)?.label || e.source,
      target: nodes.find(n => n.id === e.target)?.label || e.target,
      reason: e.reason || "Vulnerable pipeline route identified",
      status: e.status
    }));

  const isCompSecure = activeThreatsList.length === 0;

  // Calculate compliance score: starting at 100%, deduct according to critical/high vs warning severity threat count
  const compliancePercent = Math.max(10, Math.min(100, Math.round(
    100 - 
    (evaluatedEdges.filter(e => e.status === 'insecure').length * 28) - 
    (evaluatedEdges.filter(e => e.status === 'warning').length * 15)
  )));

  const getComplianceInfo = (id: SystemType) => {
    switch (id) {
      case 'HEALTH': 
        return { 
          standard: 'HIPAA', 
          fullname: 'Health Insurance Portability and Accountability Act',
          regTitle: 'HIPAA PRIVACY & SECURITY RULES',
          penalty: '₹140 Crore',
          scoreLabel: 'HIPAA COMPLIANCE SCORE'
        };
      case 'FINANCE':
        return { 
          standard: 'PCI-DSS', 
          fullname: 'Payment Card Industry Data Security Standard',
          regTitle: 'PCI-DSS v4.0 FINANCIAL GUIDELINES',
          penalty: '₹210 Crore',
          scoreLabel: 'PCI-DSS COMPLIANCE SCORE'
        };
      case 'COLLEGE_ERP':
        return { 
          standard: 'FERPA', 
          fullname: 'Family Educational Rights and Privacy Act',
          regTitle: 'FERPA PRIVACY MANDATES',
          penalty: '₹85 Crore',
          scoreLabel: 'FERPA COMPLIANCE SCORE'
        };
      case 'LOGISTICS':
        return { 
          standard: 'ISO 28000', 
          fullname: 'Security Management Systems for Supply Chain',
          regTitle: 'ISO 28000 SECURITY STANDARDS',
          penalty: '₹95 Crore',
          scoreLabel: 'ISO 28000 COMPLIANCE SCORE'
        };
      case 'ECOMMERCE':
        return { 
          standard: 'GDPR / PCI', 
          fullname: 'General Data Protection Regulation & PCI',
          regTitle: 'GDPR ARTICLE 32 & PCI REQUIREMENTS',
          penalty: '₹180 Crore',
          scoreLabel: 'GDPR/PCI COMPLIANCE SCORE'
        };
      case 'LIBRARY':
        return { 
          standard: 'MODERN SECURE ARCHIVE', 
          fullname: 'Digital Repository Security Standard',
          regTitle: 'ARCHIVAL DATA INTEGRITY RULES',
          penalty: '₹50 Crore',
          scoreLabel: 'INTEGRITY SCORE'
        };
      case 'PLACEHOLDER_GAME':
        return { 
          standard: 'GAMING SEC', 
          fullname: 'Online Gaming Security Framework',
          regTitle: 'ANTI-CHEAT & FAIR PLAY REGULATION',
          penalty: '₹60 Crore',
          scoreLabel: 'FAIR-PLAY SCORE'
        };
      case 'PLACEHOLDER_SMART_HOME':
        return { 
          standard: 'IOT SEC', 
          fullname: 'Consumer IoT Security Guidelines',
          regTitle: 'IOT DEVICE PRIVACY ACT',
          penalty: '₹120 Crore',
          scoreLabel: 'IOT SECURITY SCORE'
        };
      default:
        return { 
          standard: 'DPDP', 
          fullname: 'Digital Personal Data Protection Act',
          regTitle: 'DPDP 2023 REGULATORY FRAMEWORK',
          penalty: '₹250 Crore',
          scoreLabel: 'DPDP COMPLIANCE SCORE'
        };
    }
  };

  const compInfo = getComplianceInfo(blueprint.id);

  const handleAddAiService = async () => {
    if (!servicePrompt.trim() || isGeneratingService) return;
    
    setIsGeneratingService(true);
    setActionHistory(prev => [`[AI ENGINE] Analyzing architectural relevance for: "${servicePrompt}"...`, ...prev]);
    
    try {
      const response = await fetch('/api/generate-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemCategory: blueprint.id, serviceDescription: servicePrompt })
      });
      const data = await response.json();
      
      if (data.valid && data.node) {
        const id = `ai-node-${Date.now().toString().slice(-4)}`;
        const newNode: SecurityNode = {
          ...data.node,
          id,
          integrity: 100,
          status: 'secure',
          connections: [],
          position: { 
            x: data.node.type === 'client' ? 15 : (data.node.type === 'db' ? 85 : 50), 
            y: 35 + (Math.random() * 40) // Spread vertically
          },
          securityRules: data.node.securityRules.map((r: any, i: number) => ({
            id: `air-${id}-${i}`,
            name: r.name,
            enabled: true,
            description: r.description
          }))
        };

        // Determine connection anchors from AI suggestions or fallback
        const suggestions = data.suggestedConnections || ['api', 'waf'];
        
        // CUSTOM ENHANCEMENT: If looking for payment or gateways, definitely seek out the database too
        const forceDB = servicePrompt.toLowerCase().includes('payment') || 
                        servicePrompt.toLowerCase().includes('billing') || 
                        servicePrompt.toLowerCase().includes('transaction');
        
        const finalSuggestions = forceDB && !suggestions.includes('db') 
          ? [...suggestions, 'db'] 
          : suggestions;

        const anchorNodes = nodes.filter(n => finalSuggestions.includes(n.type));
        
        // If no specific suggestions match, pick the most logical portal point
        const finalists = anchorNodes.length > 0 
          ? anchorNodes 
          : [nodes.find(n => n.type === 'api' || n.type === 'waf') || nodes[0]];

        setNodes(prevNodes => [...prevNodes, newNode]);

        setEdges(prevEdges => {
          const newEdges = [...prevEdges];
          finalists.forEach(anchorNode => {
            if (anchorNode) {
              let protocol = "Encrypted TLS";
              // Heuristic protocol detection
              const isDatabase = newNode.type === 'db' || anchorNode.type === 'db';
              const isAuth = newNode.type === 'auth' || anchorNode.type === 'auth';
              
              if (isDatabase) protocol = "PostgreSQL SSL";
              else if (isAuth) protocol = "OIDC 2.1 Mutual TLS";
              else if (newNode.type === 'waf') protocol = "WAF Defended Link";
              else if (newNode.type === 'cache') protocol = "TCP Protected Socket";
              
              // Add the edge if it doesn't already exist (deduplication)
              if (!newEdges.some(e => e.source === anchorNode.id && e.target === id)) {
                newEdges.push({
                  source: anchorNode.id,
                  target: id,
                  protocol: protocol,
                  status: 'secure'
                });
              }
            }
          });
          return newEdges;
        });

        setSelectedNodeId(id);
        setServicePrompt('');

        setActionHistory(prev => [
          `[AI DEPLOY] Successfully integrated "${newNode.label}" to system topology.`,
          `[POLICY] Established secure connections with ${finalists.map(f => f.label).join(', ')}.`,
          ...prev
        ]);
      } else {
        const errReason = data.errorReason || 'Incompatible service description for this architecture domain.';
        setActionHistory(prev => [`[AI DENIED] ${errReason}`, ...prev]);
        alert(errReason);
      }
    } catch (e) {
      console.error("AI service generation failed", e);
      setActionHistory(prev => [`[AI ERROR] Failed to synthesize node. Please check your connectivity.`, ...prev]);
    } finally {
      setIsGeneratingService(false);
    }
  };

  const handleEdgeClick = (index: number) => {
    setSelectedEdgeIndex(index);
  };

  return (
    <div className="w-full bg-black min-h-screen text-stone-100 flex flex-col select-none" id="security-canvas-view">
      {/* Edge Security Deep Dive Overlay */}
      {(() => {
        if (selectedEdgeIndex === null) return null;
        const edge = evaluatedEdges[selectedEdgeIndex];
        if (!edge) return null;
        const srcNode = nodes.find(n => n.id === edge.source);
        const tgtNode = nodes.find(n => n.id === edge.target);
        
        if (!srcNode || !tgtNode) return null;

        return (
          <EdgeDeepDive 
            isOpen={selectedEdgeIndex !== null}
            onClose={() => setSelectedEdgeIndex(null)}
            edge={edge}
            sourceNode={srcNode}
            targetNode={tgtNode}
            systemCategory={blueprint.id}
          />
        );
      })()}

      {/* Fullscreen Database Deep Dive Overlay */}
      <AnimatePresence>
        {isDbDeepDiveOpen && dbDeepDiveNode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10"
          >
            <div className="w-full max-w-6xl flex flex-col h-full bg-zinc-950/50 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={() => setIsDbDeepDiveOpen(false)}
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer group"
                >
                  <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-thin">
                 <div className="max-w-4xl mx-auto">
                    <DatabaseDeepDive 
                      node={dbDeepDiveNode}
                      systemCategory={blueprint.id}
                      isFullscreen={true}
                    />
                 </div>
              </div>
              
              <div className="p-6 border-t border-zinc-900 bg-black/40 flex items-center justify-center gap-4">
                 <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] uppercase font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
                    SECURE ENVIRONMENT VERIFIED
                 </div>
                 <div className="h-1 w-24 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#00FF88]"
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                 </div>
                 <button 
                   onClick={() => setIsDbDeepDiveOpen(false)}
                   className="px-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs font-bold hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                 >
                   EXIT CONFIGURATION
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topology Dashboard Header */}
      <div className="border-b border-[#1A1A1A] bg-[#0A0A0A] px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-md hover:bg-white/5 text-stone-300 font-mono text-[10px] font-bold uppercase hover:text-white transition-all tracking-widest cursor-pointer"
            id="back-to-portal-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO PORTAL
          </button>
          
          <div className="w-px h-6 bg-zinc-850 hidden sm:block" />

          <div>
            <span className="font-mono text-[8px] text-[#4D4DFF] font-black tracking-widest block uppercase">
              BLUEPRINT SYNTHESIS LAB_
            </span>
            <h1 className="font-sans font-black italic tracking-tighter text-lg md:text-xl text-white uppercase mt-0.5 leading-none select-text">
              {customTitle || blueprint.title}
            </h1>
          </div>
        </div>

        {/* System Health / Status Indicators */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest font-extrabold pb-1">GLOBAL THREAT RESISTANCE</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-zinc-950 rounded-full overflow-hidden border border-[#222]">
                <div 
                  className={`h-full transition-all duration-500 ${
                    systemIntegrity > 80 ? 'bg-[#00FF88]' : systemIntegrity > 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`} 
                  style={{ width: `${systemIntegrity}%` }}
                />
              </div>
              <span className={`font-mono text-sm font-black ${
                systemIntegrity > 80 ? 'text-[#00FF88]' : systemIntegrity > 50 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {systemIntegrity}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black border border-[#1A1A1A] font-mono text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF88]"></span>
            </span>
            <span className="text-[#00FF88] font-bold uppercase tracking-widest text-[9px]">
              VERIFIED ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Main Canvas Workspace Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden" id="workspace-grid-split">
        
        {/* ==================== LEFT SIDEBAR ==================== */}
        <div className={`${isMaxCanvas ? 'hidden' : 'lg:col-span-3'} border-r border-[#1A1A1A] bg-[#050505] p-4 xl:p-5 flex flex-col justify-between gap-6 overflow-y-auto`} id="left-sidebar-simulator">
          <div className="space-y-6">
            
            {/* Template Switches Grid */}
            <div>
              <span className="font-mono text-[9px] text-zinc-500 uppercase font-black tracking-widest block mb-2">DYNAMIC TEMPLATE DEPLOYERS</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'HEALTH', label: '📊 Health Sys' },
                  { id: 'FINANCE', label: '🏦 Finance' },
                  { id: 'LIBRARY', label: '📚 Library' },
                  { id: 'COLLEGE_ERP', label: '🎓 ERP Core' },
                  { id: 'LOGISTICS', label: '🚚 Logistics' },
                  { id: 'ECOMMERCE', label: '🛒 Ecommerce' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => onDynamicSwitch(item.id as SystemType)}
                    className={`text-[10px] font-mono text-left px-2.5 py-1.5 rounded transition-all flex items-center gap-1.5 border cursor-pointer ${
                      blueprint.id === item.id 
                        ? 'bg-[#4D4DFF]/10 text-white border-[#4D4DFF]' 
                        : 'bg-zinc-900/40 text-stone-300 border-zinc-850 hover:bg-zinc-850 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Config Option details */}
            <div className="bg-[#0A0A0A] border border-zinc-900 rounded-lg p-3 space-y-3">
              <span className="font-mono text-[9px] text-[#4D4DFF] uppercase font-black tracking-widest block">PROJECT CONFIGURATION</span>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[8px] text-zinc-500 font-mono uppercase block mb-1">Enter custom project name</label>
                  <input 
                    type="text" 
                    value={customTitle} 
                    onChange={(e) => setCustomTitle(e.target.value)} 
                    placeholder="Enter project name..."
                    className="w-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#4D4DFF]"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-zinc-500 font-mono uppercase block mb-1 font-bold">ADD OTHER SERVICE (AI POWERED)</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={servicePrompt}
                        onChange={(e) => setServicePrompt(e.target.value)}
                        placeholder="e.g. Add payment gateway..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 text-[10px] font-mono rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-700"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAiService()}
                      />
                      <button
                        onClick={handleAddAiService}
                        disabled={isGeneratingService}
                        className="px-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded transition-colors flex items-center justify-center cursor-pointer"
                      >
                        {isGeneratingService ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddCustomNode('auth')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-stone-300 hover:text-white text-[9px] font-mono font-bold transition-all cursor-pointer"
                      >
                        + AUTH
                      </button>
                      <button
                        onClick={() => handleAddCustomNode('cache')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-stone-300 hover:text-white text-[9px] font-mono font-bold transition-all cursor-pointer"
                      >
                        + CACHE
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[8px] text-zinc-500 font-mono uppercase block mb-1">ACTIVE SECURITY COMPLIANCE STANDARDS</label>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/45 text-emerald-400 border border-emerald-900/60 uppercase">{compInfo.standard} APPROVED</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/45 text-indigo-400 border border-indigo-900/60 uppercase">{compInfo.regTitle.includes('IT ACT') ? 'IT ACT' : 'GLOBAL'} COMPLIANT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance rating block */}
            <div className="bg-[#030303] border border-zinc-900 rounded-lg p-3 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900 text-xs font-mono">
                <span className="text-zinc-400 font-bold uppercase">{compInfo.scoreLabel}</span>
                <span className={`font-black tracking-tight ${
                  compliancePercent > 80 ? 'text-[#00FF88]' : compliancePercent > 50 ? 'text-amber-400' : 'text-rose-500'
                }`}>
                  {compliancePercent}%
                </span>
              </div>
              
              {/* Liabilities Indian law info */}
              <div className="bg-rose-950/10 border border-rose-900/30 rounded p-2 text-[10px] font-sans">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase tracking-wider mb-1 text-[8px]">
                  <ShieldAlert className="w-3 h-3" />
                  {compInfo.regTitle} COMPLIANCE
                </div>
                <p className="text-zinc-400 leading-normal text-[9.5px] select-text">
                  Any unauthorized access to consumer records or insecure transmission pipeline violates <strong>{compInfo.fullname} ({compInfo.standard})</strong> guidelines (up to {compInfo.penalty} penalty).
                </p>
              </div>

              {/* ACTIVE THREAT ALERTS & REASONS */}
              {activeThreatsList.length > 0 && (
                <div className="space-y-1.5 border-t border-zinc-900/80 pt-2.5">
                  <span className="font-mono text-[8px] font-black text-rose-400 uppercase tracking-wider block">
                    ⚠️ ACTIVE PIPELINE THREATS ({activeThreatsList.length})
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin pr-0.5">
                    {activeThreatsList.map((threat, tIdx) => (
                      <div key={tIdx} className="bg-rose-950/20 border border-rose-500/30 p-2 rounded text-[9px]">
                        <div className="font-mono font-black text-[8px] text-rose-400 uppercase">
                          {threat.source.split(' (')[0].split(' v')[0]} ➔ {threat.target.split(' (')[0].split(' v')[0]}
                        </div>
                        <p className="text-zinc-450 leading-snug mt-0.5 font-sans">
                          {threat.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zero Monetary Fine Badge */}
              {isCompSecure ? (
                <div className="bg-emerald-950/25 border border-emerald-500/40 rounded p-2 text-center animate-pulse" id="zero-fine-badge">
                  <span className="text-emerald-400 font-mono font-black text-[9px] tracking-wider uppercase flex items-center justify-center gap-1">
                    ✓ ZERO LIABILITY: ZERO MONETARY FINE
                  </span>
                </div>
              ) : (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded p-2 text-center" id="punitive-liabilities-badge">
                  <span className="text-amber-400 font-mono font-bold text-[9px] tracking-wider uppercase flex items-center justify-center gap-1">
                    ⚠️ EXPOSED TO PUNATIVE LIABILITIES
                  </span>
                </div>
              )}
            </div>

            {/* Simulations Trigger panel (previously top layout) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Skull className="w-4 h-4 text-rose-500 animate-pulse" />
                <h2 className="font-sans font-bold text-xs tracking-wider text-white uppercase">
                  THREAT SHIELD SIMULATOR
                </h2>
              </div>
              <div className="space-y-1.5">
                {THREAT_SIMULATIONS.map((sim) => (
                  <button
                    key={sim.id}
                    disabled={isSimulating}
                    onClick={() => triggerSimulation(sim)}
                    className={`w-full text-left p-2.5 rounded-md border transition-all flex items-start gap-2.5 relative overflow-hidden group cursor-pointer ${
                      activeSimulation?.id === sim.id && isSimulating
                        ? 'bg-rose-950/20 border-rose-500/60 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                        : 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-800 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="mt-0.5">
                      {activeSimulation?.id === sim.id && isSimulating ? (
                        <RefreshCw className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 fill-current" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-sans font-semibold text-[11px] text-white uppercase group-hover:text-yellow-200 transition-colors">
                          {sim.name.split(' (')[0]}
                        </h4>
                      </div>
                      <p className="text-[9px] text-zinc-500 leading-tight">
                        {sim.description.slice(0, 52)}...
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Console logs */}
          <div className="border-t border-zinc-900/80 pt-4" id="sim-telemetry-console-box">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1">
                <Terminal className="w-3 h-3 text-[#4D4DFF]" />
                TELEMETRY CONSOLE
              </span>
              <button 
                onClick={() => setSimulationLogs([])} 
                className="font-mono text-[8px] text-zinc-650 hover:text-white transition-colors cursor-pointer"
              >
                CLEAR
              </button>
            </div>
            <div className="bg-[#030303] border border-zinc-900 rounded p-2 h-28 overflow-y-auto font-mono text-[9px] space-y-1 text-zinc-500 scrollbar-thin" id="sim-log-stdout">
              {simulationLogs.length === 0 ? (
                <div className="text-zinc-700 italic text-center py-4">--- telemetry stream idle ---</div>
              ) : (
                simulationLogs.map((log, index) => (
                  <div key={index} className={log.includes('[ALERT]') ? 'text-rose-400 font-bold' : log.includes('[DEFEND]') ? 'text-emerald-400' : 'text-zinc-400'}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ==================== MIDDLE COLUMN: Blueprints Canvas ==================== */}
        <div className={`${isMaxCanvas ? 'lg:col-span-12' : 'lg:col-span-6'} bg-[#020202] flex flex-col justify-between relative overflow-hidden select-none`} id="middle-canvas-plotter">
          
          {/* Subtle Grid Styling overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#151515_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-90" />
          
          {/* Top Canvas Banner */}
          <div className="relative z-10 px-6 py-3 border-b border-zinc-950 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase flex items-center gap-1.5 select-text">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4D4DFF] animate-pulse" />
              CANVAS: 2D ACTIVE INTERACTIVE TOPOLOGY MATRIX
            </span>
            <span className="font-mono text-[9px] text-[#4D4DFF] font-semibold uppercase">
              Drag to pan • scale zoom controls
            </span>
          </div>

          {/* Interactive Drag & Zoom Stage Wrapper */}
          <div 
            ref={canvasStageRef}
            className="flex-1 w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            id="draggable-canvas-stage"
          >
            {/* The scaled viewport stage */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{
                transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              {/* Connection Lines Drawer (Bezier Splines) */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4D4DFF" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
                    <stop offset="100%" stopColor="#00FF88" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                
                {/* Temporary Connecting Link Preview */}
                {connectingSourceId && (() => {
                  const srcNode = nodes.find(n => n.id === connectingSourceId);
                  if (!srcNode) return null;
                  const x1 = srcNode.position?.x ?? srcNode.x;
                  const y1 = srcNode.position?.y ?? srcNode.y;
                  const x2 = mousePos.x;
                  const y2 = mousePos.y;

                  const dx = x2 - x1;
                  const controlOffset = Math.min(60, Math.max(12, Math.abs(dx) * 0.5));
                  const pathD = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

                  return (
                    <g className="opacity-85 pointer-events-none">
                      <path 
                        d={pathD} 
                        stroke="#eab308"
                        strokeWidth={1}
                        strokeDasharray="3,3"
                        fill="none"
                        className="animate-pulse"
                      />
                      <circle cx={x2} cy={y2} r="1" fill="#eab308" className="animate-ping" />
                    </g>
                  );
                })()}

                {evaluatedEdges.map((edge, index) => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const x1 = sourceNode.position?.x ?? sourceNode.x;
                  const y1 = sourceNode.position?.y ?? sourceNode.y;
                  const x2 = targetNode.position?.x ?? targetNode.x;
                  const y2 = targetNode.position?.y ?? targetNode.y;
                  
                  const isLineInvolved = simulationTargetId === targetNode.id || simulationTargetId === sourceNode.id;
                  const lineInsecure = edge.status === 'insecure';
                  const lineWarning = edge.status === 'warning';

                  // Dynamic horizontal curve logic mimicking standard diagram models
                  const dx = x2 - x1;
                  const controlOffset = Math.min(60, Math.max(12, Math.abs(dx) * 0.5));
                  const pathD = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

                  // Determine colors based on security state
                  let strokeColorBack = "#11111e";
                  let strokeColorGlow = "#00FF88";
                  let particleColor = "#00FF88";

                  if (isLineInvolved && isSimulating) {
                    strokeColorBack = "#ef4444";
                    strokeColorGlow = "url(#activeGradient)";
                    particleColor = "#ef4444";
                  } else if (lineInsecure) {
                    strokeColorBack = "#450a0a";
                    strokeColorGlow = "#f43f5e";
                    particleColor = "#f43f5e";
                  } else if (lineWarning) {
                    strokeColorBack = "#451a03";
                    strokeColorGlow = "#f59e0b";
                    particleColor = "#f59e0b";
                  }

                    return (
                      <g 
                        key={`edge-${index}`} 
                        className="opacity-90 cursor-pointer group"
                        onClick={() => handleEdgeClick(index)}
                      >
                        {/* Invisible thick path for easier clicking */}
                        <path 
                          d={pathD} 
                          stroke="transparent"
                          strokeWidth={10}
                          fill="none"
                          className="pointer-events-auto"
                        />
                        {/* Glistening thick back drop-shadow path */}
                        <path 
                          d={pathD} 
                          stroke={strokeColorBack}
                          strokeWidth={1.5}
                          fill="none"
                          className={`transition-all duration-300 ${selectedEdgeIndex === index ? 'stroke-emerald-400/30' : ''}`}
                        />
                        {/* Glow indicator path */}
                        <path 
                          d={pathD} 
                          stroke={selectedEdgeIndex === index ? '#00FF88' : strokeColorGlow}
                          strokeWidth={selectedEdgeIndex === index ? 1.2 : 0.8}
                          strokeDasharray={lineInsecure ? "5,3" : "4,4"}
                          fill="none"
                          className={`transition-all duration-300 ${
                            selectedEdgeIndex === index 
                              ? 'drop-shadow-[0_0_8px_rgba(0,255,136,0.8)] stroke-[1.5px]' 
                              : lineInsecure 
                                ? 'drop-shadow-[0_0_2px_rgba(244,63,94,0.6)]' 
                                : 'drop-shadow-[0_0_1.5px_rgba(0,255,136,0.5)]'
                          }`}
                        />
                        {/* Flow Particle circle indicator */}
                        <circle r={lineInsecure ? "0.85" : "0.5"} fill={selectedEdgeIndex === index ? '#00FF88' : particleColor}>
                          <animateMotion 
                            path={pathD} 
                            dur={isSimulating ? "1s" : lineInsecure ? "1.8s" : "3.5s"} 
                            repeatCount="indefinite" 
                          />
                        </circle>
                      </g>
                    );
                })}
              </svg>

              {/* Dynamic Connection Badges / Labels & Interactive Render Nodes Group */}
              <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {/* Midpoint Connection Text Indicators */}
                {evaluatedEdges.map((edge, index) => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const x1 = sourceNode.position?.x ?? sourceNode.x;
                  const y1 = sourceNode.position?.y ?? sourceNode.y;
                  const x2 = targetNode.position?.x ?? targetNode.x;
                  const y2 = targetNode.position?.y ?? targetNode.y;

                  const dx = x2 - x1;
                  const controlOffset = Math.min(60, Math.max(12, Math.abs(dx) * 0.5));
                  const cx1 = x1 + controlOffset;
                  const cy1 = y1;
                  const cx2 = x2 - controlOffset;
                  const cy2 = y2;

                  const midX = 0.125 * x1 + 0.375 * cx1 + 0.375 * cx2 + 0.125 * x2;
                  const midY = 0.125 * y1 + 0.375 * cy1 + 0.375 * cy2 + 0.125 * y2;

                  return (
                    <div
                      key={`link-label-${index}`}
                      onClick={() => handleEdgeClick(index)}
                      style={{
                        left: `${midX}%`,
                        top: `${midY}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className={`absolute border text-[7.5px] font-mono px-2 py-0.5 rounded select-none z-20 font-bold whitespace-nowrap shadow-2xl pointer-events-auto cursor-pointer transition-all ${
                        selectedEdgeIndex === index 
                          ? 'bg-[#00FF88]/10 border-[#00FF88] text-[#00FF88] scale-110 shadow-[0_0_10px_rgba(0,255,136,0.3)]' 
                          : 'bg-[#050505] border-zinc-850 text-zinc-450 hover:border-emerald-500/50 hover:text-emerald-400'
                      }`}
                    >
                      {edge.protocol}
                    </div>
                  );
                })}

                <AnimatePresence>
                  {nodes.map(node => {
                    const isSelected = selectedNodeId === node.id;
                    const nodeWarning = node.securityRules.some(r => !r.enabled);
                    const isSimulationVictim = simulationTargetId === node.id && isSimulating;

                    const styles = getNodeStyles(node, isSelected, nodeWarning, isSimulationVictim);

                    // Detailed service role and network categorization mapping
                    const getNodeClassification = (type: 'client' | 'waf' | 'api' | 'db' | 'cache' | 'auth') => {
                      switch (type) {
                        case 'client':
                          return { role: 'Frontend UI', category: 'Public Service', categoryStyle: 'text-sky-400 border-sky-900/60 bg-sky-950/20' };
                        case 'waf':
                          return { role: 'Firewall', category: 'Public Shield', categoryStyle: 'text-amber-400 border-amber-900/60 bg-amber-950/20' };
                        case 'api':
                          return { role: 'Coreservice Server', category: 'Private Service', categoryStyle: 'text-purple-400 border-purple-900/60 bg-purple-950/20' };
                        case 'db':
                          return { role: 'Database Instance', category: 'Private Service', categoryStyle: 'text-rose-450 border-rose-900/60 bg-rose-950/20' };
                        case 'auth':
                          return { role: 'Auth Identity Provider', category: 'External Service', categoryStyle: 'text-stone-300 border-stone-800 bg-stone-900/30' };
                        case 'cache':
                          return { role: 'Cache Cluster', category: 'Private Service', categoryStyle: 'text-pink-400 border-pink-900/60 bg-pink-950/20' };
                        default:
                          return { role: 'Core Component', category: 'Internal Cluster', categoryStyle: 'text-zinc-400 border-zinc-800 bg-zinc-900/20' };
                      }
                    };

                    const classified = getNodeClassification(node.type);

                    return (
                      <motion.div
                        key={node.id}
                        id={`canvas-node-${node.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                          left: `${node.position?.x ?? node.x}%`,
                          top: `${node.position?.y ?? node.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => {
                          setSelectedNodeId(node.id);
                          if (!node.id.startsWith('ai-node')) {
                            if (node.type === 'client') {
                              setIsExplodedView(true);
                            } else if (node.type === 'api') {
                              setIsCoreServiceView(true);
                            }
                          }
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        className={`absolute pointer-events-auto cursor-pointer px-4 py-3 rounded-lg border w-[150px] min-h-[92px] bg-black/95 shadow-25 transition-all select-none hover:shadow-[0_0_15px_rgba(77,77,255,0.4)] flex flex-col justify-between items-center ${styles.borderClass}`}
                      >
                        {isSelected && node.type === 'db' && (
                          <motion.div 
                            className="absolute inset-[-4px] rounded-xl border border-rose-500 z-[-1]"
                            animate={{ 
                              scale: [1, 1.15, 1],
                              opacity: [0.8, 0, 0.8] 
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                        {/* Top Categorization Lines */}
                        <div className="w-full text-center flex flex-col items-center mb-1 pb-1 border-b border-zinc-900/40">
                          <span className="text-[7.5px] font-mono tracking-wider font-extrabold text-zinc-400 uppercase leading-none">
                            {classified.role}
                          </span>
                          <span className={`text-[6px] font-mono mt-1 px-1 py-0.2 rounded border font-semibold inline-block uppercase leading-none ${classified.categoryStyle}`}>
                            {classified.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between w-full gap-2 flex-1 pt-1">
                          <div className="flex-1 text-center min-w-0">
                            <h4 className="font-sans font-black text-[9.5px] text-white tracking-wide uppercase truncate leading-tight">
                              {node.label}
                            </h4>
                          </div>

                          <div className="shrink-0">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  if (connectingSourceId === node.id) {
                                    setConnectingSourceId(null);
                                  } else if (connectingSourceId) {
                                    handleAddConnection(connectingSourceId, node.id);
                                  } else {
                                    setConnectingSourceId(node.id);
                                  }
                                }}
                              title={connectingSourceId 
                                ? (connectingSourceId === node.id ? "Cancel link" : "Connect source to this component") 
                                : "Link / Draw Connection"
                              }
                              className={`p-1 rounded cursor-pointer transition-all ${
                                connectingSourceId === node.id 
                                  ? 'bg-[#00FF88] text-black shadow-lg shadow-[#00FF88]/40 scale-105' 
                                  : connectingSourceId 
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-400 hover:text-white'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-450 hover:text-[#00FF88] hover:border-[#00FF88]/45 hover:bg-zinc-850'
                              }`}
                            >
                              <Plus className="w-2.5 h-2.5 pointer-events-none" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

            </div>
          </div>

          {/* Interactive Cluster Minimap */}
          <div className="absolute bottom-5 left-5 z-20 bg-black/90 border border-zinc-900 p-2 rounded-lg w-28 h-22 shadow-2xl opacity-80 hover:opacity-100 transition-opacity pointer-events-none sm:pointer-events-auto">
            <div className="font-mono text-[7px] text-zinc-650 block mb-1 uppercase font-bold tracking-wider">
              Cluster Map
            </div>
            <div className="relative w-full h-[40px] bg-zinc-950/90 rounded border border-zinc-905 overflow-hidden">
              {nodes.map(node => {
                const x = node.position?.x ?? node.x;
                const y = node.position?.y ?? node.y;
                const isActive = selectedNodeId === node.id;
                
                let miniBg = "bg-indigo-500";
                if (node.type === 'client') miniBg = "bg-sky-400";
                if (node.type === 'waf') miniBg = "bg-amber-500";
                if (node.type === 'api') miniBg = "bg-purple-500";
                if (node.type === 'db') miniBg = "bg-rose-500";
                if (node.type === 'auth') miniBg = "bg-stone-300";
                
                return (
                  <div
                    key={`mini-${node.id}`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className={`absolute w-2.5 h-1.5 rounded-sm transition-all ${miniBg} ${isActive ? 'ring-1 ring-white scale-125 z-10' : 'opacity-50'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Zoom, Pan Reset and Complete Full screen Maximizer controls */}
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-zinc-900 p-1.5 rounded-lg select-none shadow-xl">
            <button 
              onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
              className="w-8 h-8 flex items-center justify-center text-xs font-mono border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-850 text-white transition-colors cursor-pointer font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button 
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="w-8 h-8 flex items-center justify-center text-xs font-mono border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-850 text-white transition-colors cursor-pointer font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <button 
              onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}
              className="px-2 h-8 flex items-center justify-center text-[9px] font-mono border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-855 text-white transition-colors cursor-pointer uppercase font-extrabold"
              title="Reset Zoom & Drag to Origin"
            >
              RESET
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <button 
              onClick={() => setIsMaxCanvas(!isMaxCanvas)}
              className={`px-3 h-8 flex items-center gap-1.5 text-[9px] font-mono border rounded uppercase font-extrabold transition-all cursor-pointer ${
                isMaxCanvas 
                  ? 'bg-[#4D4DFF] border-[#4D4DFF] text-white hover:bg-blue-600' 
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-stone-300 hover:text-white'
              }`}
            >
              {isMaxCanvas ? 'COLLAPSE FULL CANVAS' : 'MAX WHITEBOARD'}
            </button>
          </div>


        </div>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <div className={`${isMaxCanvas ? 'hidden' : 'lg:col-span-3'} border-l border-[#1A1A1A] bg-[#050505] p-4 xl:p-5 flex flex-col justify-between overflow-y-auto`} id="right-sidebar-inspector">
          
          <div className="space-y-6">
            
            {/* 1. NODE INSPECTOR CARD */}
            {activeNode ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-white">
                      {getNodeIcon(activeNode.type, "w-4 h-4")}
                    </div>
                    <span className="font-mono text-[9px] font-black text-[#4D4DFF] uppercase tracking-wider">
                      ACTIVE INSTANCE INSPECTOR
                    </span>
                  </div>
                  
                  {/* Editable node name title */}
                  <input
                    type="text"
                    value={activeNode.label}
                    onChange={(e) => handleSaveNodeMetadata(activeNode.id, { label: e.target.value.toUpperCase() })}
                    className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-[#4D4DFF] font-sans font-black text-white text-md tracking-tight focus:outline-none w-full uppercase py-0.5"
                    title="Edit Node Label"
                    id={`inspector-label-input-${activeNode.id}`}
                  />
                  
                  <p className="font-sans text-[10px] text-zinc-400 mt-1 select-text">
                    {activeNode.description}
                  </p>

                  {activeNode.type === 'client' && (
                    <div className="mt-3.5 p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-lg space-y-2">
                      <div className="flex items-center gap-1 text-[10.5px] font-bold text-white uppercase font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        Exploded View Active
                      </div>
                      <p className="text-[9.5px] text-zinc-400 leading-normal">
                        A detailed sandboxed visualization of the client-side safety pathways is ready for inspection.
                      </p>
                      <button
                        onClick={() => setIsExplodedView(true)}
                        className="w-full py-1.5 bg-gradient-to-r from-[#4D4DFF] to-[#A855F7] text-white font-mono text-[8.5px] font-bold uppercase rounded hover:shadow-[0_0_10px_rgba(77,77,255,0.4)] cursor-pointer transition-all"
                      >
                        EXPLODE CLIENT CANVAS ❯
                      </button>
                    </div>
                  )}

                  {activeNode.type === 'api' && (
                    <div className="mt-3.5 p-3 bg-fuchsia-950/20 border border-fuchsia-500/30 rounded-lg space-y-2">
                      <div className="flex items-center gap-1 text-[10.5px] font-bold text-white uppercase font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-[#00FF88] animate-pulse" />
                        Core Service Access
                      </div>
                      <p className="text-[9.5px] text-zinc-400 leading-normal">
                        Inspect real-time policy query pathfinding, spotlight policies, and dynamic policy verification.
                      </p>
                      <button
                        onClick={() => setIsCoreServiceView(true)}
                        className="w-full py-1.5 bg-gradient-to-r from-[#4D4DFF] to-pink-600 text-white font-mono text-[8.5px] font-bold uppercase rounded hover:shadow-[0_0_10px_rgba(77,77,255,0.4)] cursor-pointer transition-all"
                      >
                        DEEP DRILL CORE SERVICE ❯
                      </button>
                    </div>
                  )}

                  {activeNode.type === 'db' && (
                    <div className="mt-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex flex-col items-center gap-3 text-center">
                      <div className="p-3 bg-rose-500/20 rounded-full animate-pulse text-rose-500">
                        <Database className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-mono font-bold text-white uppercase italic">Critical Infrastructure Detected</h3>
                        <p className="text-[10px] text-zinc-500 font-medium">This node requires high-level security configuration beyond simple parameter editing.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setDbDeepDiveNode(activeNode);
                          setIsDbDeepDiveOpen(true);
                        }}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-mono text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-rose-900/20"
                      >
                        OPEN SECURITY BLUEPRINT
                      </button>
                    </div>
                  )}
                </div>

                {/* Technical Node Details shifted from the Canvas */}
                <div className="bg-[#080808] border border-zinc-900/60 rounded-lg p-2.5 space-y-2 font-mono text-[9px]">
                  <div className="flex items-center justify-between py-0.5 border-b border-zinc-900/30">
                    <span className="text-zinc-500 uppercase text-[8px]">Component Type_</span>
                    <span className="text-[#4D4DFF] font-sans font-bold text-[8px] uppercase tracking-wider bg-[#4D4DFF]/10 px-1.5 py-0.5 rounded">
                      {getTopBadge(activeNode)}
                    </span>
                  </div>

                  {activeNode.subLabel && (
                    <div className="flex items-start justify-between py-0.5 border-b border-zinc-900/30">
                      <span className="text-zinc-500 uppercase text-[8px] shrink-0 mt-0.5">Role Subtitle_</span>
                      <span className="text-zinc-300 font-sans text-right leading-tight max-w-[140px] truncate">
                        {activeNode.subLabel}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-zinc-500 uppercase text-[8px]">Active Regulations_</span>
                    <div className="flex items-center gap-1">
                      {/* System Aware Compliance Tags */}
                      {blueprint.id === 'HEALTH' && (activeNode.type === 'client' || activeNode.type === 'api' || activeNode.type === 'db') && (
                        <span className="text-[7px] px-1 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 font-extrabold uppercase scale-95 tracking-tight">HIPAA</span>
                      )}
                      {blueprint.id === 'FINANCE' && (activeNode.type === 'api' || activeNode.type === 'db') && (
                        <span className="text-[7px] px-1 py-0.5 rounded bg-blue-950/30 border border-blue-900/40 text-blue-400 font-extrabold uppercase scale-95 tracking-tight">PCI-DSS</span>
                      )}
                      {blueprint.id === 'FINANCE' && activeNode.type === 'db' && (
                        <span className="text-[7px] px-1 py-0.5 rounded bg-amber-950/30 border border-amber-900/40 text-amber-400 font-extrabold uppercase scale-95 tracking-tight">RBI</span>
                      )}
                      {activeNode.type === 'client' && (
                        <span className="text-[7px] px-1 py-0.5 rounded bg-sky-950/30 border border-sky-900/40 text-sky-400 font-extrabold uppercase scale-95 tracking-tight">DPDP</span>
                      )}
                      {blueprint.id === 'LOGISTICS' && (
                        <span className="text-[7px] px-1 py-0.5 rounded bg-rose-950/30 border border-rose-900/40 text-rose-400 font-extrabold uppercase scale-95 tracking-tight">GDPR-EEA</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editable Fields list (IP, Port) */}
                <div className="bg-[#0b0b0b] border border-zinc-900 rounded-lg p-2.5 space-y-2">
                  <span className="font-mono text-[8px] text-zinc-505 uppercase font-extrabold block">
                    IP AND PORT SOCKET PARAMETERS
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                    <div>
                      <label className="text-[7px] text-zinc-500 block mb-0.5">IPV4 ADDRESS</label>
                      <input
                        type="text"
                        value={activeNode.ipAddress}
                        onChange={(e) => handleSaveNodeMetadata(activeNode.id, { ipAddress: e.target.value })}
                        className="bg-zinc-900 border border-zinc-850 focus:border-[#4D4DFF] focus:outline-none rounded px-2 py-0.5 text-white w-full text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[7px] text-zinc-500 block mb-0.5">SYSTEM PORT</label>
                      <input
                        type="number"
                        value={activeNode.port}
                        onChange={(e) => handleSaveNodeMetadata(activeNode.id, { port: parseInt(e.target.value) || 80 })}
                        className="bg-zinc-905 border border-zinc-850 focus:border-[#4D4DFF] focus:outline-none rounded px-2 py-0.5 text-white w-full text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Rules Switches list */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest font-extrabold">
                      INTEGRITY RULES & FIREWALLS
                    </span>
                    <span className="font-mono text-[8px] text-[#4D4DFF] font-black">
                      {activeNode.securityRules.filter(r => r.enabled).length}/{activeNode.securityRules.length} PROTECTED
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {activeNode.securityRules.map((rule) => {
                      return (
                        <div 
                          key={rule.id}
                          className={`p-2 rounded border transition-all flex items-start gap-2.5 ${
                            rule.enabled 
                              ? 'bg-zinc-900/40 border-zinc-855 hover:border-zinc-800' 
                              : 'bg-zinc-950 border-rose-950/30'
                          }`}
                          id={`rule-container-${rule.id}`}
                        >
                          {/* Toggle switch */}
                          <button
                            onClick={() => handleToggleRule(activeNode.id, rule.id)}
                            className={`mt-0.5 relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              rule.enabled ? 'bg-[#00FF88]' : 'bg-zinc-850'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                                rule.enabled ? 'translate-x-3' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          
                          <div className="leading-tight">
                            <h5 className={`font-sans font-bold text-[11px] transition-colors ${
                              rule.enabled ? 'text-white' : 'text-zinc-500 line-through'
                            }`}>
                              {rule.name}
                            </h5>
                            <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug select-text">
                              {rule.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0b0b0b] border border-zinc-900 p-5 rounded-lg text-center text-zinc-650 italic text-[11px]">
                Click on any card inside the interactive graph area to configure custom IPs, ports, and rules switches
              </div>
            )}

            {/* 2. DIAGRAM LEGEND */}
            <div className="bg-[#070707] border border-zinc-900 rounded-lg p-3 space-y-2">
              <span className="font-mono text-[8px] text-zinc-500 uppercase font-black block tracking-widest border-b border-zinc-900 pb-1">DIAGRAM LEGEND</span>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-stone-300">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-sky-405" />
                  <span>CLIENT ENDPOINT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-violet-505" />
                  <span>WAF SHIELD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-emerald-405" />
                  <span>CORE API/MICRO</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-purple-405" />
                  <span>ENCRYPTED DB</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-amber-505" />
                  <span>AUTH CODESET</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-pink-405" />
                  <span>RAM CACHE</span>
                </div>
              </div>
            </div>

            {/* 3. CONNECTION FLOW LOG */}
            <div className="bg-[#030303] border border-zinc-900 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-910 pb-1 mr-0.5">
                <span className="font-mono text-[8px] text-zinc-505 uppercase font-black tracking-widest block">CONNECTION FLOW LOG ({evaluatedEdges.length})</span>
                <button
                  onClick={() => {
                    setEdges(blueprint.edges || []);
                    setActionHistory(prev => [`[RESET] Restored original system architecture pipelines`, ...prev]);
                  }}
                  className="font-mono text-[7px] text-zinc-500 hover:text-white hover:underline transition-all cursor-pointer uppercase"
                  title="Restore default secure linkages"
                >
                  RESET PIPES
                </button>
              </div>
              <div className="font-mono text-[9px] space-y-2 text-zinc-500 max-h-40 overflow-y-auto scrollbar-thin">
                {evaluatedEdges.length === 0 ? (
                  <div className="text-zinc-700 italic text-center py-2">--- no pipeline links active ---</div>
                ) : (
                  evaluatedEdges.map((edge, index) => {
                    const src = nodes.find(n => n.id === edge.source)?.label || edge.source;
                    const tgt = nodes.find(n => n.id === edge.target)?.label || edge.target;
                    const lineInsecure = edge.status === 'insecure';
                    const lineWarning = edge.status === 'warning';

                    return (
                      <div key={index} className="flex flex-col border-b border-zinc-900/55 pb-2 last:border-0 select-text">
                        <div className="flex items-center justify-between text-[8px]">
                          <span className={`font-bold uppercase ${
                            lineInsecure ? 'text-[#f43f5e]' : lineWarning ? 'text-amber-400' : 'text-[#00FF88]'
                          }`}>
                            {lineInsecure ? '⚡ insecure' : lineWarning ? '⚠️ warning' : '✓ secure'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-650 font-semibold">{edge.protocol}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveConnection(edge.source, edge.target);
                              }}
                              className="text-zinc-650 hover:text-red-500 hover:bg-zinc-90 w-3.5 h-3.5 flex items-center justify-center rounded transition-colors cursor-pointer"
                              title="Delete Link"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        </div>
                        <div className="text-zinc-400 truncate mt-0.5 text-[8.5px]">
                          {src.split(' v')[0]} <span className="text-[#4D4DFF] font-bold">➔</span> {tgt.split(' v')[0]}
                        </div>
                        {edge.status !== 'secure' && (
                          <div className="mt-1 bg-red-950/20 border border-red-900/30 text-[7.5px] leading-snug px-1.5 py-1 rounded text-red-300">
                            {edge.reason}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Action History logs */}
          <div className="border-t border-zinc-900/85 pt-4 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-[#00FF88]" />
              <span className="font-mono text-[8px] text-zinc-500 uppercase font-black tracking-widest block">
                AUDITED ACTION LOGS
              </span>
            </div>

            <div className="font-mono text-[9px] text-zinc-505 space-y-1 h-24 overflow-y-auto scrollbar-thin" id="auditor-history-ledger">
              {actionHistory.map((item, index) => (
                <div key={index} className="truncate select-text">
                  <span className="text-[#4D4DFF]">{`>`}</span> {item}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <AnimatePresence>
        {isExplodedView && (
          <FrontendExplodedView 
            blueprint={blueprint} 
            onClose={() => setIsExplodedView(false)} 
            selectedNodeId={selectedNodeId}
          />
        )}
        {isCoreServiceView && (
          <CoreServiceExplodedView 
            blueprint={blueprint} 
            onClose={() => setIsCoreServiceView(false)} 
            systemIntegrity={systemIntegrity}
            setSystemIntegrity={setSystemIntegrity}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
