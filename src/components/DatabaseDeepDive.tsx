import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Copy, Database, Lock, UserCheck, ShieldAlert, Check, Code } from 'lucide-react';
import { SystemType, SecurityNode } from '../types';
import { RBAC_SYSTEM_DATA } from '../data';

interface DatabaseDeepDiveProps {
  node: SecurityNode;
  systemCategory: SystemType;
  isFullscreen?: boolean;
}

export default function DatabaseDeepDive({ node, systemCategory, isFullscreen = false }: DatabaseDeepDiveProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSystemSpecificDetails = () => {
    const data = RBAC_SYSTEM_DATA[systemCategory] || { subjects: [], attributes: [] };
    
    // Find sensitive entities and attributes
    const sensitiveAttr = data.attributes?.find(a => 
      a.label.toLowerCase().includes('card') || 
      a.label.toLowerCase().includes('aadhaar') || 
      a.label.toLowerCase().includes('password') || 
      a.label.toLowerCase().includes('pan') ||
      a.label.toLowerCase().includes('phone')
    ) || { label: 'PII Data' };

    const mainEntity = data.subjects?.find(s => 
      s.label.toLowerCase().includes('doctor') || 
      s.label.toLowerCase().includes('customer') ||
      s.label.toLowerCase().includes('admin')
    ) || { label: 'Authorized User' };

    return { sensitiveAttr, mainEntity };
  };

  const { sensitiveAttr, mainEntity } = getSystemSpecificDetails();

  const blueprints = [
    {
      id: 'access-scope',
      title: '1. ACCESS SCOPE',
      subtitle: 'The Limited DB User',
      suggestion: "Avoid using the 'Root' user for application connections.",
      action: 'Create a dedicated app_user with restricted privileges.',
      whyItMatters: 'DPDP Act 2023 Sec 8(5) mandates reasonable security safeguards to prevent personal data breach. Over-privileged accounts are the leading cause of data exfiltration.',
      code: `-- SQL to restrict database access
CREATE USER app_user WITH PASSWORD 'secure_random_string';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
REVOKE DROP, TRUNCATE ON DATABASE FROM app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO app_user;`,
      icon: <UserCheck className={`text-emerald-400 ${isFullscreen ? 'w-6 h-6' : 'w-4 h-4'}`} />
    },
    {
      id: 'rls',
      title: '2. ROW-LEVEL SECURITY',
      subtitle: 'The Business Logic Check',
      suggestion: 'The DB needs an internal safety net to ensure multi-tenancy isolation.',
      action: `Enforce policies where ${mainEntity.label} can only access relevant records.`,
      whyItMatters: 'Ensures compliance with DPDP Act Clause 7 (Data Principal Rights). It prevents unauthorized cross-tenant data access even if the application layer is compromised.',
      code: systemCategory === 'HEALTH' ? 
`-- Health System: Doctor/Patient Isolation
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY doctor_patient_isolation ON patient_records
FOR SELECT
TO app_user
USING (doctor_id = current_setting('app.current_doctor_id')::uuid);` :
systemCategory === 'FINANCE' ?
`-- Finance System: Customer Account Isolation
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_account_isolation ON accounts
FOR ALL
TO app_user
USING (owner_id = current_setting('app.current_user_id')::uuid);` :
`-- Default: Entity Ownership Isolation
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY owner_data_isolation ON user_data
FOR ALL
TO app_user
USING (user_id = current_setting('app.current_user_id')::uuid);`,
      icon: <ShieldCheck className={`text-purple-400 ${isFullscreen ? 'w-6 h-6' : 'w-4 h-4'}`} />
    },
    {
      id: 'data-masking',
      title: '3. DATA MASKING',
      subtitle: 'Role-Based Visibility',
      suggestion: `Protect ${sensitiveAttr.label} for non-admin roles (e.g., support or staff).`,
      action: `Mask sensitive PII like ${sensitiveAttr.label} at the database layer.`,
      whyItMatters: 'DPDP Act 2023 mandates "Data Minimisation". Displaying clear-text PII to unauthorized internal roles is a major compliance violation.',
      visual: `Returns XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)} instead of clear text.`,
      code: `-- Dynamic Data Masking for ${sensitiveAttr.label}
CREATE VIEW v_secure_data AS
SELECT 
  id,
  name,
  CASE 
    WHEN current_setting('app.user_role') = 'admin' THEN ${sensitiveAttr.label.toLowerCase().replace(' ', '_')}
    ELSE 'XXXX-XXXX-' || right(${sensitiveAttr.label.toLowerCase().replace(' ', '_')}, 4)
  END as masked_${sensitiveAttr.label.toLowerCase().replace(' ', '_')}
FROM sensitive_table;`,
      icon: <Lock className={`text-rose-400 ${isFullscreen ? 'w-6 h-6' : 'w-4 h-4'}`} />
    },
    {
      id: 'hardening',
      title: '4. CONNECTION HARDENING',
      subtitle: 'IP Whitelisting',
      suggestion: 'Block all direct public access to your database endpoint.',
      action: 'Configure a strict cluster-level IP Allowlist.',
      whyItMatters: 'DPDP Act Sec 11 requires data fiduciaries to take necessary steps to protect data. Unwhitelisted DB ports are targets for brute-force and zero-day exploits.',
      logic: 'Only pulses originating from the Core Service IP are permitted; all other connection attempts are blocked.',
      code: `# Infrastructure (Terraform/CLI) example
# gcloud sql instances patch instance-name \\
#   --authorized-networks=${node.ipAddress}/32

# Only allow traffic from the Core Service
REJECT ALL FROM ANY TO DATABASE ${node.label.toLowerCase().replace(' ', '_')}
ALLOW FROM 10.0.0.5/32 TO DATABASE ${node.label.toLowerCase().replace(' ', '_')}`,
      icon: <ShieldAlert className={`text-amber-400 ${isFullscreen ? 'w-6 h-6' : 'w-4 h-4'}`} />
    }
  ];

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isFullscreen ? 'pb-10' : ''}`}>
      <div className={`flex flex-col ${isFullscreen ? 'items-center text-center space-y-4 mb-10' : 'items-start gap-2 mb-2'}`}>
        <div className={`flex items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 ${isFullscreen ? 'w-20 h-20' : 'w-10 h-10'}`}>
          <Database className={`${isFullscreen ? 'w-10 h-10' : 'w-5 h-5'} text-rose-500 animate-pulse`} />
        </div>
        <div className="space-y-1">
          <span className={`font-mono font-black text-rose-500 uppercase tracking-widest ${isFullscreen ? 'text-[12px]' : 'text-[9px]'}`}>
            DB SECURITY BLUEPRINT (DPDP 2023)
          </span>
          <h2 className={`font-sans font-black italic uppercase tracking-tighter text-white ${isFullscreen ? 'text-4xl' : 'text-lg'}`}>
            Configuration: {node.label}
          </h2>
          {isFullscreen && (
            <p className="text-zinc-500 font-mono text-sm max-w-2xl">
              Strict isolation and compliance protocols for {systemCategory} databases as mandated by the Digital Personal Data Protection Act 2023.
            </p>
          )}
        </div>
      </div>

      <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {blueprints.map((bp) => (
          <div 
            key={bp.id} 
            className={`bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 hover:border-zinc-700/50 transition-all group flex flex-col justify-between ${isFullscreen ? 'backdrop-blur-sm' : ''}`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                    {bp.icon}
                  </div>
                  <div>
                    <h4 className={`font-mono font-bold text-white uppercase ${isFullscreen ? 'text-sm' : 'text-[10px]'}`}>{bp.title}</h4>
                    <p className={`text-zinc-500 font-mono uppercase tracking-tight ${isFullscreen ? 'text-xs' : 'text-[8px]'}`}>{bp.subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleCopy(bp.id, bp.code)}
                  className="p-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm border border-zinc-700/50"
                >
                  {copiedId === bp.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="text-[10px] font-mono font-black tracking-widest uppercase">COPY</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-black/40 border border-zinc-800/40 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider font-bold">SUGGESTION</span>
                    <span className="text-zinc-400 text-xs select-text">{bp.suggestion}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-rose-400 font-mono text-[9px] uppercase tracking-wider font-bold">ACTION REQUIRED</span>
                    <span className="text-zinc-100 text-xs font-bold select-text">{bp.action}</span>
                  </div>
                  
                  {bp.visual && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-[#00FF88]/5 border border-[#00FF88]/20 rounded-md">
                      <span className="shrink-0 bg-[#00FF88]/20 text-[#00FF88] px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase">MASKED VIEW</span>
                      <span className="text-[#00FF88] font-mono text-[10px] font-bold truncate">{bp.visual}</span>
                    </div>
                  )}
                  {bp.logic && (
                    <div className="mt-2 text-amber-400 font-mono text-[10px] font-bold p-2 bg-amber-500/5 border border-amber-500/20 rounded-md">
                      {bp.logic}
                    </div>
                  )}
                </div>

                <div className="bg-[#020202] rounded-lg border border-zinc-800 p-4 relative group/code overflow-hidden">
                  <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                    <Code className="w-3 h-3 text-zinc-700" />
                  </div>
                  <pre className="text-[11px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
                    {bp.code}
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-850 flex items-start gap-3">
              <div className="p-1 px-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono text-[8px] font-black uppercase shrink-0">
                LITIGATION RISK
              </div>
              <p className="text-zinc-500 text-[10px] leading-relaxed italic select-text">
                <span className="text-zinc-300 font-medium">{bp.whyItMatters}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
