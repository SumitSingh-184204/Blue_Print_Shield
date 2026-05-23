export interface RBACEntity {
  id: string;
  label: string;
  detail: string;
  classification?: string;
  sensitivity?: string;
  reasoning?: string;
}

export interface RBACAttribute {
  id: string;
  label: string;
  category: string;
  status: 'unprocessed' | 'success' | 'blocked';
  policy_rule: string;
  classification?: string;
  sensitivity?: string;
  reasoning?: string;
}

export type SystemType = 
  | 'HEALTH' 
  | 'FINANCE' 
  | 'LIBRARY' 
  | 'COLLEGE_ERP' 
  | 'LOGISTICS' 
  | 'ECOMMERCE' 
  | 'CUSTOM' 
  | 'PLACEHOLDER_GAME' 
  | 'PLACEHOLDER_SMART_HOME';

export interface SecurityRule {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

export interface SecurityNode {
  id: string;
  type: 'client' | 'waf' | 'api' | 'db' | 'cache' | 'auth';
  label: string;
  subLabel: string;
  ipAddress: string;
  port: number;
  status: 'secure' | 'warn' | 'breached' | 'defending';
  integrity: number; // 0 to 100
  connections: string[]; // Target node IDs
  securityRules: SecurityRule[];
  description: string;
  position: { x: number; y: number };
}

export interface EdgeSecurityBlueprint {
  secretManagement: {
    title: string;
    description: string;
    code: string;
  };
  integrityCheck: {
    title: string;
    description: string;
    code: string;
  };
  encryption: {
    title: string;
    description: string;
    code: string;
  };
  compliance: {
    pciDss?: string;
    rbiGuideline?: string;
    dpdpAct?: string;
    isIndianSpecific: boolean;
  };
}

export interface SystemBlueprint {
  id: SystemType;
  title: string;
  category: string;
  description: string;
  isPlaceholder?: boolean;
  iconName: string; // e.g., 'Heart', 'Landmark', 'BookOpen', etc.
  threatScore: number; // 0 to 100
  nodes: SecurityNode[];
  edges?: SecurityEdge[];
}

export interface SecurityEdge {
  source: string;
  target: string;
  protocol: string;
  status: string;
  blueprint?: EdgeSecurityBlueprint;
}

export interface SavedBlueprint {
  id: string;
  systemTitle: string;
  systemType: SystemType;
  nodesCount: number;
  timestamp: string;
  threatScore: number;
  status: 'VERIFIED' | 'STAGED' | 'WARNING';
}

export interface ThreatSimulation {
  id: string;
  name: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  targetNodeType: 'client' | 'waf' | 'api' | 'db';
  logMessages: string[];
}
