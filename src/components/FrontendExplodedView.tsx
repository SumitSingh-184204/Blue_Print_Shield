import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Sparkles, Shield, ShieldAlert, ShieldCheck, 
  Trash2, RefreshCw, Layers, Terminal, Download, CheckSquare, 
  HelpCircle, Link, Key, Lock, FileText, Ban, Server, Database, Cpu
} from 'lucide-react';
import { SystemBlueprint, SystemType, SecurityNode } from '../types';

interface FrontendExplodedViewProps {
  blueprint: SystemBlueprint;
  onClose: () => void;
  selectedNodeId?: string | null;
}

interface ExplodedNode {
  id: string;
  label: string;
  type: 'Service' | 'Security Attribute';
  logic: string;
  bestPractice: string;
  description: string;
  // Canvas positions
  x: number;
  y: number;
  radius: number;
  isUniversal: boolean;
}

interface ExplodedEdge {
  id: string;
  source: string;
  target: string;
  status: 'secure' | 'insecure';
  isDefault?: boolean;
}

export default function FrontendExplodedView({ blueprint, onClose, selectedNodeId }: FrontendExplodedViewProps) {
  // Find which persistent node of the infrastructure was clicked for Deep Drill
  const activeBlueprintNode = blueprint.nodes.find(n => n.id === selectedNodeId) || null;
  const targetNodeType = activeBlueprintNode?.type || 'client';
  const targetNodeLabel = activeBlueprintNode?.label || 'WEB PORTAL UI';

  // Determine if system is HIPAA/Health or ERP
  const systemName = blueprint.title.toLowerCase();
  const isHealth = blueprint.id === 'HEALTH' || systemName.includes('health') || systemName.includes('med') || systemName.includes('patient');
  const systemContext: 'Health' | 'ERP' = isHealth ? 'Health' : 'ERP';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [nodes, setNodes] = useState<ExplodedNode[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedExplodedNodeId, setSelectedExplodedNodeId] = useState<string | null>(null);
  
  // Custom drawing path states
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [edges, setEdges] = useState<ExplodedEdge[]>([]);
  const [checklistExported, setChecklistExported] = useState(false);
  const [actionHistory, setActionHistory] = useState<string[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Get matching anchor node ID for this type of deep drill
  const getStartingNodeId = (type: string) => {
    if (type === 'waf') return 'traffic_intake';
    if (type === 'api') return 'api_packet';
    if (type === 'db') return 'sql_stream';
    if (type === 'auth') return 'login_payload';
    if (type === 'cache') return 'cache_query';
    return 'user_input';
  };

  const startingNodeId = getStartingNodeId(targetNodeType);

  // Initialize nodes based on targeted deep drill security type
  useEffect(() => {
    let baseNodes: ExplodedNode[] = [];
    let defaultEdges: ExplodedEdge[] = [];
    let initialLogMessage = "";

    if (targetNodeType === 'waf') {
      baseNodes = [
        {
          id: 'traffic_intake',
          label: 'HTTP Intake',
          type: 'Service',
          logic: 'Ingest raw port 80/443 packets',
          bestPractice: 'Always validate external protocol headers prior to processing layers.',
          description: 'Secure gateway for raw outside client HTTP/JSON payload data streams.',
          x: 0, y: 0, radius: 24, isUniversal: true
        },
        {
          id: 'ddos_mitigator',
          label: 'DDoS Mitigator',
          type: 'Security Attribute',
          logic: 'Rate limiting stream traffic patterns',
          bestPractice: 'Deploy deep concurrent packet limiting logic directly on boundary nodes.',
          description: 'Saves computing resources from hostile traffic flood streams.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'sqli_detector',
          label: 'SQLi Detector',
          type: 'Security Attribute',
          logic: 'Filter SQL query injection keywords',
          bestPractice: 'Stops suspicious keywords (SELECT, DROP, OR 1=1) from ever entering internal modules.',
          description: 'Protects DB schemas on external web routes.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'owasp_rules',
          label: 'OWASP Ruleset',
          type: 'Security Attribute',
          logic: 'Analyze top 10 security bugs',
          bestPractice: 'Automatically apply OWASP rules to block scripting and directory traversal attempts.',
          description: 'Ensures absolute core protection against popular external security threats.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'ssl_terminus',
          label: 'SSL Terminus',
          type: 'Service',
          logic: 'Decrypt client transport streams',
          bestPractice: 'Deploy isolated TLS 1.3 key exchanges to stop decryption exploits.',
          description: 'Decrypts incoming client connection packages before passing to the local cluster.',
          x: 0, y: 0, radius: 22, isUniversal: true
        }
      ];

      if (systemContext === 'Health') {
        baseNodes.push(
          {
            id: 'hipaa_whitelister',
            label: 'HIPAA IP Whitelists',
            type: 'Service',
            logic: 'Validate clinic source IPs',
            bestPractice: 'Restrict clinical database modifications to trusted medical IPs only.',
            description: 'Stops patient record modifications originating from anonymous outside networks.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'telemetry_cleaner',
            label: 'Telemetry Scrubber',
            type: 'Security Attribute',
            logic: 'Filter metadata tags',
            bestPractice: 'Unlink patients geographic/network trackers on external boundary levels.',
            description: 'Protects user records against tracking data leaks.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      } else {
        baseNodes.push(
          {
            id: 'ip_range_allow',
            label: 'IP Range Filters',
            type: 'Service',
            logic: 'Define VPC parameters',
            bestPractice: 'Block high-risk outside nations or proxies from writing to ledger streams.',
            description: 'Enforces strict private intranet route rules.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'webhook_verifier',
            label: 'Webhook Authenticator',
            type: 'Security Attribute',
            logic: 'Verify SHA-256 signatures',
            bestPractice: 'Always validate paymaster signature hashes on external API triggers.',
            description: 'Stops counterfeit financial payment confirmation calls.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      }

      defaultEdges = [
        { id: 'e1', source: 'traffic_intake', target: 'ddos_mitigator', status: 'secure', isDefault: true },
        { id: 'e2', source: 'ddos_mitigator', target: 'sqli_detector', status: 'secure', isDefault: true }
      ];
      initialLogMessage = `[WAF] Deep Drill loaded! Protecting external ports against DDoS and SQLi threats.`;
    } 
    else if (targetNodeType === 'api') {
      baseNodes = [
        {
          id: 'api_packet',
          label: 'Inbound API Request',
          type: 'Service',
          logic: 'Accept dynamic routed packets',
          bestPractice: 'Reject payloads lacking valid auth headers or containing broken schemas.',
          description: 'Core REST/GraphQL route listener interface.',
          x: 0, y: 0, radius: 24, isUniversal: true
        },
        {
          id: 'jwt_handshake',
          label: 'JWT Handshake',
          type: 'Security Attribute',
          logic: 'Verify bearer signature claims',
          bestPractice: 'Perform cryptographic public-key validation on tokens outside database queries.',
          description: 'Decodes access authorizations and confirms credential lifetimes.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'rbac_gate',
          label: 'RBAC Gatekeeper',
          type: 'Security Attribute',
          logic: 'Evaluate resource route scope',
          bestPractice: 'Deny all routes by default, whitelisting parameters for active admin roles.',
          description: 'Strict controller route security layer.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'rate_throttler',
          label: 'Rate Throttler',
          type: 'Security Attribute',
          logic: 'Limit request spikes',
          bestPractice: 'Limit tokens to 100 per minute per client IP to stop credential flooding.',
          description: 'Keeps computing resources active under stress.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'api_sanitizer',
          label: 'Payload Cleaner',
          type: 'Service',
          logic: 'Verify schema layouts',
          bestPractice: 'Strip unvetted headers and binary logs on local controller levels.',
          description: 'Validates structure formats before passing variables to internal systems.',
          x: 0, y: 0, radius: 22, isUniversal: true
        }
      ];

      if (systemContext === 'Health') {
        baseNodes.push(
          {
            id: 'health_permission',
            label: 'Consent Inspector',
            type: 'Service',
            logic: 'Validate patient consent keys',
            bestPractice: 'Verify doctor telemedicine requests against patient-granted permissions lists.',
            description: 'Enforces patient-level telemetry privacy protocols.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'phi_auditor',
            label: 'PHI Access Logger',
            type: 'Security Attribute',
            logic: 'Format HIPAA access traces',
            bestPractice: 'Write record access logs directly to isolated, audit-locked storage lines.',
            description: 'Preserves complete traceability of active patient data lookups.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      } else {
        baseNodes.push(
          {
            id: 'tenant_separator',
            label: 'Multi-Tenant Separator',
            type: 'Service',
            logic: 'Segment cloud data indexes',
            bestPractice: 'Strictly bounds ledger reads to the authenticated tenant context ID.',
            description: 'Stops corporate accounting leaks of unrelated ledger files.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'ledger_auditor',
            label: 'Audit Log Trigger',
            type: 'Security Attribute',
            logic: 'Record administrative mutations',
            bestPractice: 'Enforce automatic ledger logging inside server controllers for price adjustments.',
            description: 'Ensures absolute SOC2 system operations auditability.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      }

      defaultEdges = [
        { id: 'e1', source: 'api_packet', target: 'jwt_handshake', status: 'secure', isDefault: true },
        { id: 'e2', source: 'jwt_handshake', target: 'rbac_gate', status: 'secure', isDefault: true }
      ];
      initialLogMessage = `[API Node] Inside Coreservice Server deep-drill! Hardening authentication controllers.`;
    }
    else if (targetNodeType === 'db') {
      baseNodes = [
        {
          id: 'sql_stream',
          label: 'SQL Query Stream',
          type: 'Service',
          logic: 'Ingest raw SQL commands',
          bestPractice: 'Never allow plain string command queries. Force prepared parameter bindings.',
          description: 'Primary database query listener layer.',
          x: 0, y: 0, radius: 24, isUniversal: true
        },
        {
          id: 'sqli_filter',
          label: 'Prepared Params Binder',
          type: 'Security Attribute',
          logic: 'Enforce strictly typed variables',
          bestPractice: 'Force strict datatype casting check on every dynamic SQL execution route.',
          description: 'Nullifies SQL injection query vulnerabilities.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'transport_ssl',
          label: 'Transport TLS',
          type: 'Service',
          logic: 'Encrypt network connections',
          bestPractice: 'Utilize securely signed database connection certificates within private networks.',
          description: 'Secures queries against intra-network tracing systems.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'at_rest_cloaker',
          label: 'At-Rest Column Cipher',
          type: 'Security Attribute',
          logic: 'Encrypt data fields with AES-256',
          bestPractice: 'Encrypt private database tables containing patients info or payment tokens.',
          description: 'Hides disk details from outside storage copy attempts.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'db_access_guard',
          label: 'Query Log Auditor',
          type: 'Security Attribute',
          logic: 'Trace data modifications',
          bestPractice: 'Write DB structural change events directly to secure local trace databases.',
          description: 'Ensures real-time detection of suspicious database queries.',
          x: 0, y: 0, radius: 22, isUniversal: true
        }
      ];

      if (systemContext === 'Health') {
        baseNodes.push(
          {
            id: 'phi_isolation_vault',
            label: 'PHI Column Vault',
            type: 'Service',
            logic: 'Separate patient health indexes',
            bestPractice: 'Isolate sensitive clinical files inside physically separate database vaults.',
            description: 'Strict HIPAA compliance partitioning layout.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'consent_revoke_filter',
            label: 'Consent Table Mask',
            type: 'Security Attribute',
            logic: 'Evaluate patient permissions',
            bestPractice: 'Run JOIN reviews on patient permits during storage query operations.',
            description: 'Hides telehealth records when patient consent limits are updated.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      } else {
        baseNodes.push(
          {
            id: 'ledger_seq',
            label: 'Ledger Hash Chain',
            type: 'Service',
            logic: 'Symmetric proof index chains',
            bestPractice: 'Link ledger balances using SHA-256 block chain sequence signatures.',
            description: 'Enforces complete tamper-proofing of critical business ledgers.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'double_entry_enforce',
            label: 'Double-Entry Guard',
            type: 'Security Attribute',
            logic: 'Validate debit balance balance',
            bestPractice: 'Require credit and debit balances to exactly match in atomic db queries.',
            description: 'Denies writing inconsistent currency states.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      }

      defaultEdges = [
        { id: 'e1', source: 'sql_stream', target: 'sqli_filter', status: 'secure', isDefault: true },
        { id: 'e2', source: 'sqli_filter', target: 'transport_ssl', status: 'secure', isDefault: true }
      ];
      initialLogMessage = `[DB Deep Drill] Parameter bindings and column ciphers deployed securely.`;
    }
    else if (targetNodeType === 'auth') {
      baseNodes = [
        {
          id: 'login_payload',
          label: 'Identity Submission',
          type: 'Service',
          logic: 'Collect login payload packets',
          bestPractice: 'Always salt password credentials before performing database cipher algorithms.',
          description: 'Secure TLS portal for login credential packets.',
          x: 0, y: 0, radius: 24, isUniversal: true
        },
        {
          id: 'lockout_sentry',
          label: 'Lockout Sentry',
          type: 'Security Attribute',
          logic: 'IP brute-force lock controllers',
          bestPractice: 'Suspend logins on target account for 15 minutes after 5 successive failures.',
          description: 'Prevents brute force lookup scripts.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'mfa_enforce',
          label: 'MFA Gatekeeper',
          type: 'Security Attribute',
          logic: 'Validate multi-factor keys',
          bestPractice: 'Deploy WebAuthn/TOTP challenge steps during identification loops.',
          description: 'Mandatory cryptographic checks for outside user sessions.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'token_rotator',
          label: 'Bearer Token Rotator',
          type: 'Security Attribute',
          logic: 'Enforce dynamic key expiration',
          bestPractice: 'Enforce jwt bearer expiry limits strictly below 15 minutes on clients.',
          description: 'Mitigates token capture risk vectors.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'oidc_bridge',
          label: 'Identity Federated Bridge',
          type: 'Service',
          logic: 'Validate SSO directory groups',
          bestPractice: 'Validate origin parameters during external corporate identity synchronization cycles.',
          description: 'Provides SAML and OAuth system directories linking.',
          x: 0, y: 0, radius: 22, isUniversal: true
        }
      ];

      if (systemContext === 'Health') {
        baseNodes.push(
          {
            id: 'doctor_cert_authenticator',
            label: 'NPI Doctor Verify',
            type: 'Service',
            logic: 'Validate doctor medical licenses',
            bestPractice: 'Lookup doctor federal indexes prior to exposing patients diagnostic scopes.',
            description: 'Verifies practicing status of telemedicine requestors.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'patient_identity_verifier',
            label: 'Patient MFA Verifier',
            type: 'Security Attribute',
            logic: 'Deliver dynamic SMS MFA keys',
            bestPractice: 'Verify SMS/email codes for telehealth logins on new patient device logins.',
            description: 'Mitigates profile hijacking risk vectors.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      } else {
        baseNodes.push(
          {
            id: 'adfs_syncer',
            label: 'Corporate ADFS Syncer',
            type: 'Service',
            logic: 'SAML AD identity linker',
            bestPractice: 'Sync AD organization credentials via secure token channels to prevent raw passwords leaks.',
            description: 'Directly validates worker logons and rights indices.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'corporate_policy_eval',
            label: 'Device Policy Evaluator',
            type: 'Security Attribute',
            logic: 'Enforce device sandbox posture',
            bestPractice: 'Deny administrative accesses requested on compromised or jailbroken devices.',
            description: 'Enforces robust corporate sandbox parameters on worker connections.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      }

      defaultEdges = [
        { id: 'e1', source: 'login_payload', target: 'lockout_sentry', status: 'secure', isDefault: true },
        { id: 'e2', source: 'lockout_sentry', target: 'mfa_enforce', status: 'secure', isDefault: true }
      ];
      initialLogMessage = `[Auth] Deep Drill loaded! Restricting user logins with lockout sentries and MFA.`;
    }
    else if (targetNodeType === 'cache') {
      baseNodes = [
        {
          id: 'cache_query',
          label: 'Cache Request Stream',
          type: 'Service',
          logic: 'Accept cache query requests',
          bestPractice: 'Never cache raw secret tokens or unencrypted client medical items.',
          description: 'Ingestion point for high speed key value lookups.',
          x: 0, y: 0, radius: 24, isUniversal: true
        },
        {
          id: 'cache_auth_check',
          label: 'HMAC Authenticator',
          type: 'Security Attribute',
          logic: 'Audit microservice credentials',
          bestPractice: 'Validate secure signature hashes on internal microservice queries.',
          description: 'Hinders un-authenticated microservices querying memory registers.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'cache_network_box',
          label: 'Network Sandbox',
          type: 'Service',
          logic: 'Isolate subnet routes',
          bestPractice: 'Place high-speed cache nodes on private subnet ports blocked from the public web.',
          description: 'Ensures zero outside exposure of active cached layers.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'cache_ttl_force',
          label: 'TTL Expiry Enforcer',
          type: 'Security Attribute',
          logic: 'Enforce timeout parameters',
          bestPractice: 'Strictly require time bounds under 5 minutes on transient database snapshot copies.',
          description: 'Stops records from lingering inside volatile cache structures.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'cache_sanitizer',
          label: 'Model De-serializer',
          type: 'Security Attribute',
          logic: 'Validate data templates',
          bestPractice: 'Verify schema structure constraints before running dynamic deserialization scripts.',
          description: 'Safeguards caches from host-level code execution threats.',
          x: 0, y: 0, radius: 22, isUniversal: true
        }
      ];

      if (systemContext === 'Health') {
        baseNodes.push(
          {
            id: 'ehr_masker',
            label: 'EHR Key Masker',
            type: 'Service',
            logic: 'Redact diagnostics labels',
            bestPractice: 'Always mask telemetry values and diagnosis references before storing temporarily.',
            description: 'Anonymizes records fields dynamically.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'temp_token_expire',
            label: 'Temporary Token Filter',
            type: 'Security Attribute',
            logic: 'Invalidate telemedicine sessions',
            bestPractice: 'Erase cached medical lookups when patient connections terminate.',
            description: 'Reduces memory leaks of health records tables.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      } else {
        baseNodes.push(
          {
            id: 'ledger_snap_val',
            label: 'Ledger Snap Validator',
            type: 'Service',
            logic: 'Validate persistent state hashes',
            bestPractice: 'Verify snapshot data sequences match db records prior to output delivery.',
            description: 'Verifies cache integrity remains congruent with physical database logs.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'tenant_cache_boundary',
            label: 'Tenant cache Partition',
            type: 'Security Attribute',
            logic: 'Affix secure tenant boundaries',
            bestPractice: 'Prefix caches strings to block accidental cross company transactions views.',
            description: 'Isolates parallel cash systems from each other.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      }

      defaultEdges = [
        { id: 'e1', source: 'cache_query', target: 'cache_auth_check', status: 'secure', isDefault: true },
        { id: 'e2', source: 'cache_auth_check', target: 'cache_network_box', status: 'secure', isDefault: true }
      ];
      initialLogMessage = `[Cache Cluster] Security layers verified. Network sandbox boundaries established.`;
    }
    else {
      // client (Public UI Frontend)
      baseNodes = [
        {
          id: 'user_input',
          label: 'User Input Pool',
          type: 'Service',
          logic: 'Ingest client payloads',
          bestPractice: 'Unsanitized external entry point that poses risk of code injection and token extraction.',
          description: 'Gateway for untrusted external client payloads, key presses, and file transfers.',
          x: 0, y: 0, radius: 24, isUniversal: true
        },
        {
          id: 'input_sanitizer',
          label: 'Input Sanitizer',
          type: 'Security Attribute',
          logic: 'Filter malicious scripts',
          bestPractice: 'Cleanse raw client feeds against HTML/JS script injection patterns to stop XSS early.',
          description: 'Sanitizes DOM elements, rich text feeds, and text inputs against script execution.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'secure_token_store',
          label: 'Secure Token Store',
          type: 'Service',
          logic: 'HttpOnly Cookies vs LocalStore',
          bestPractice: 'Lock JWT and access tokens within HttpOnly, Secure, SameSite=Strict cookies to deny client-side reading.',
          description: 'A physical cryptographic container designed to keep critical tokens isolated from scripting logic.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'csp_dome',
          label: 'CSP Dome',
          type: 'Security Attribute',
          logic: 'Content Security Policy',
          bestPractice: 'Deploys dynamic CSP HTTP headers to prevent unrecognized remote asset fetch attempts.',
          description: 'Guards image, static files, and remote source loading vectors against third-party insertions.',
          x: 0, y: 0, radius: 22, isUniversal: true
        },
        {
          id: 'xss_shield',
          label: 'XSS Shield',
          type: 'Security Attribute',
          logic: 'Encoding output data',
          bestPractice: 'Contextually escape all state rendering nodes to convert HTML blocks into safe literal string sequences.',
          description: 'Auto-encodes text binds to neutralize rendering vulnerabilities in layout structures.',
          x: 0, y: 0, radius: 22, isUniversal: true
        }
      ];

      if (systemContext === 'Health') {
        baseNodes.push(
          {
            id: 'patient_consent',
            label: 'Patient Consent Popup',
            type: 'Service',
            logic: 'Acquire telemetry permits',
            bestPractice: 'GDPR / HIPAA standard. Block recording or dispatching of user health telemetry unless explicitly approved.',
            description: 'Tracks, confirms, and logs consent status prior to starting browser tracking engines.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'phi_masking',
            label: 'PHI Data Masking',
            type: 'Security Attribute',
            logic: 'Zero-exposure dynamic masking',
            bestPractice: 'Replace patient health metadata fields with hashed strings on UI render frames before paint cycles.',
            description: 'Prevents display screen leaks of patients records and telemetry data.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      } else {
        baseNodes.push(
          {
            id: 'audit_trail',
            label: 'Audit Trail Trigger',
            type: 'Service',
            logic: 'Log user transitions securely',
            bestPractice: 'Log all critical user actions and system changes locally before writing to backends.',
            description: 'Secures detailed historical proof of ledger updates and currency transfers.',
            x: 0, y: 0, radius: 22, isUniversal: false
          },
          {
            id: 'currency_formatter',
            label: 'Multi-Currency Validator',
            type: 'Service',
            logic: 'Immutable verification checks',
            bestPractice: 'Prevent financial pricing tamper hacks by cross-referencing and rounding decimals on immutable models.',
            description: 'Protects decimal transformations against client memory adjustment exploits.',
            x: 0, y: 0, radius: 22, isUniversal: false
          }
        );
      }

      defaultEdges = [
        { id: 'e1', source: 'user_input', target: 'input_sanitizer', status: 'secure', isDefault: true },
        { id: 'e2', source: 'input_sanitizer', target: 'secure_token_store', status: 'secure', isDefault: true }
      ];
      initialLogMessage = `[INIT] Exploded View loaded for specialized *${systemContext}* platform.`;
    }

    setNodes(baseNodes);
    setEdges(defaultEdges);
    setActionHistory([initialLogMessage]);
  }, [targetNodeType, systemContext]);

  // Handle Resize and concentric coordinate alignment
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const updateLayout = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 800;
      const h = Math.max(500, rect?.height || 600);
      setCanvasSize({ width: w, height: h });

      // Align coordinates
      const cx = w / 2;
      const cy = h / 2 + 20;

      setNodes(prevNodes => {
        return prevNodes.map(node => {
          let nx = cx;
          let ny = cy;

          // Align anchor node on the far left
          if (node.id === startingNodeId) {
            nx = cx - 280;
            ny = cy;
          } else if (node.isUniversal) {
            // Circle 1: inner ring coordinates
            const universalNodes = prevNodes.filter(n => n.isUniversal && n.id !== startingNodeId);
            const idx = universalNodes.findIndex(n => n.id === node.id);
            const count = universalNodes.length;
            const angle = (idx * (2 * Math.PI / count)) - Math.PI / 2;
            nx = cx + Math.cos(angle) * 125;
            ny = cy + Math.sin(angle) * 125;
          } else {
            // Circle 2: outer ring coordinates
            const specificNodes = prevNodes.filter(n => !n.isUniversal);
            const idx = specificNodes.findIndex(n => n.id === node.id);
            const count = specificNodes.length;
            // Spread across the right hemisphere
            const angle = (idx * (Math.PI / (count + 1))) - Math.PI / 2 + (Math.PI / 2);
            nx = cx + Math.cos(angle) * 230;
            ny = cy + Math.sin(angle) * 200;
          }

          return { ...node, x: nx, y: ny };
        });
      });
    };

    updateLayout();
    const observer = new ResizeObserver(() => updateLayout());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [nodes.length, startingNodeId]);

  // Determine path checks: Does a pipeline bypass the designated first defense line?
  const checkEdgeSecurityState = (source: string, target: string): 'secure' | 'insecure' => {
    if (targetNodeType === 'client' && source === 'user_input' && target !== 'input_sanitizer') {
      return 'insecure';
    }
    if (targetNodeType === 'waf' && source === 'traffic_intake' && target !== 'ddos_mitigator') {
      return 'insecure';
    }
    if (targetNodeType === 'api' && source === 'api_packet' && target !== 'jwt_handshake') {
      return 'insecure';
    }
    if (targetNodeType === 'db' && source === 'sql_stream' && target !== 'sqli_filter') {
      return 'insecure';
    }
    if (targetNodeType === 'auth' && source === 'login_payload' && target !== 'lockout_sentry') {
      return 'insecure';
    }
    if (targetNodeType === 'cache' && source === 'cache_query' && target !== 'cache_auth_check') {
      return 'insecure';
    }
    return 'secure';
  };

  const currentEdgesEvaluated = edges.map(edge => {
    const status = checkEdgeSecurityState(edge.source, edge.target);
    return { ...edge, status };
  });

  // Calculate compliance score: Deduct 25% for each insecure link present
  const bypassEdgesCount = currentEdgesEvaluated.filter(e => e.status === 'insecure').length;
  const rawCompliance = 100 - (bypassEdgesCount * 25);
  const complianceScore = Math.max(0, rawCompliance);

  // Toggle or add interactive link connection
  const handleConnectNodes = (srcId: string, tgtId: string) => {
    if (srcId === tgtId) return;
    
    // Avoid duplicates
    if (edges.some(e => (e.source === srcId && e.target === tgtId) || (e.source === tgtId && e.target === srcId))) {
      setActionHistory(prev => [`[TAMPER] Link already occupied between specified endpoints`, ...prev]);
      return;
    }

    const srcNode = nodes.find(n => n.id === srcId);
    const tgtNode = nodes.find(n => n.id === tgtId);
    if (!srcNode || !tgtNode) return;

    const securityState = checkEdgeSecurityState(srcId, tgtId);
    const newEdge: ExplodedEdge = {
      id: `edge-${Date.now()}`,
      source: srcId,
      target: tgtId,
      status: securityState
    };

    setEdges(prev => [...prev, newEdge]);
    
    if (securityState === 'insecure') {
      setActionHistory(prev => [
        `[⚠️ WARNING] DIRECT BYPASS built from "${srcNode.label}" to "${tgtNode.label}" (Raw traffic bypassing the designated first layer)!!`,
        ...prev
      ]);
    } else {
      setActionHistory(prev => [
        `[✓ CONNECTED] Established proxy thread from "${srcNode.label}" to "${tgtNode.label}"`,
        ...prev
      ]);
    }
  };

  const handleRemoveEdge = (edgeId: string) => {
    const found = edges.find(e => e.id === edgeId);
    if (!found) return;
    const srcNode = nodes.find(n => n.id === found.source);
    const tgtNode = nodes.find(n => n.id === found.target);
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    setActionHistory(prev => [
      `[DISCONNECTED] Pruned pipeline node link: ${srcNode?.label} ➔ ${tgtNode?.label}`,
      ...prev
    ]);
  };

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid background
    ctx.strokeStyle = '#10111a';
    ctx.lineWidth = 1;
    const gridSpacing = 24;
    for (let x = 0; x < canvasSize.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvasSize.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    const cx = canvasSize.width / 2;
    const cy = canvasSize.height / 2 + 20;

    // Draw guidelines for Concentric Rings
    ctx.strokeStyle = 'rgba(77, 77, 255, 0.04)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    
    // Circle 1 guidelines (Universal Rings)
    ctx.beginPath();
    ctx.arc(cx, cy, 125, 0, 2 * Math.PI);
    ctx.stroke();

    // Circle 2 guidelines (System specific)
    ctx.beginPath();
    ctx.arc(cx, cy, 215, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dashed state

    // 1. Draw connecting pipelines
    currentEdgesEvaluated.forEach(edge => {
      const srcNode = nodes.find(n => n.id === edge.source);
      const tgtNode = nodes.find(n => n.id === edge.target);
      if (!srcNode || !tgtNode) return;

      const isHovered = hoveredNodeId === edge.source || hoveredNodeId === edge.target;

      // Draw beautiful curved paths
      ctx.beginPath();
      ctx.moveTo(srcNode.x, srcNode.y);

      // Midpoints for natural look curves
      const dx = tgtNode.x - srcNode.x;
      const controlX1 = srcNode.x + dx * 0.4;
      const controlY1 = srcNode.y;
      const controlX2 = tgtNode.x - dx * 0.4;
      const controlY2 = tgtNode.y;

      ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, tgtNode.x, tgtNode.y);

      // Select style depending on bypass threat status
      if (edge.status === 'insecure') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.setLineDash([4, 3]);
      } else {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = isHovered ? 2.0 : 1.25;
        ctx.setLineDash([]);
      }

      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Glistening moving particles
      if (edge.status === 'secure') {
        const timeFactor = (Date.now() % 1800) / 1800;
        const t = timeFactor;
        const mt = 1 - t;
        const px = mt * mt * mt * srcNode.x + 3 * mt * mt * t * controlX1 + 3 * mt * t * t * controlX2 + t * t * t * tgtNode.x;
        const py = mt * mt * mt * srcNode.y + 3 * mt * mt * t * controlY1 + 3 * mt * t * t * controlY2 + t * t * t * tgtNode.y;

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Red bypass alert tracking wave
        const timeFactor = (Date.now() % 1100) / 1100;
        const t = timeFactor;
        const mt = 1 - t;
        const px = mt * mt * mt * srcNode.x + 3 * mt * mt * t * controlX1 + 3 * mt * t * t * controlX2 + t * t * t * tgtNode.x;
        const py = mt * mt * mt * srcNode.y + 3 * mt * mt * t * controlY1 + 3 * mt * t * t * controlY2 + t * t * t * tgtNode.y;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py, 8.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // 2. Draw nodes on top of pathways using custom 'drawNode' logic
    nodes.forEach(node => {
      drawNode(ctx, node);
    });

  }, [nodes, edges, hoveredNodeId, selectedExplodedNodeId, sourceNodeId, canvasSize, currentEdgesEvaluated]);

  // Handle Canvas animation loop for glowing micro-actions
  useEffect(() => {
    let animFrame: number;
    const loop = () => {
      setNodes(prev => [...prev]);
      animFrame = requestAnimationFrame(loop);
    };
    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Standard drawNode logic supporting visually styled features for Services vs Audits (Security Attributes)
  const drawNode = (ctx: CanvasRenderingContext2D, node: ExplodedNode) => {
    const isHovered = hoveredNodeId === node.id;
    const isSelected = selectedExplodedNodeId === node.id;
    const isSource = sourceNodeId === node.id;

    ctx.save();

    // Node outer border shadow
    ctx.shadowBlur = isSelected ? 18 : isHovered ? 10 : 3;
    ctx.shadowColor = isSource 
      ? 'rgba(245, 158, 11, 0.4)' 
      : node.id === startingNodeId
        ? 'rgba(14, 165, 233, 0.4)'
        : node.type === 'Security Attribute' 
          ? 'rgba(16, 185, 129, 0.4)' 
          : 'rgba(77, 77, 255, 0.4)';

    // Node background block
    ctx.fillStyle = isSelected 
      ? '#050614' 
      : isHovered 
        ? '#090a14' 
        : '#020202';
    
    // Choose border color
    let borderStyle = '#1f2937';
    if (isSource) {
      borderStyle = '#f59e0b';
    } else if (isSelected) {
      borderStyle = '#4D4DFF';
    } else if (isHovered) {
      borderStyle = '#10b981';
    } else if (node.id === startingNodeId) {
      borderStyle = '#0ea5e9';
    } else if (node.type === 'Security Attribute') {
      borderStyle = '#047857';
    } else {
      borderStyle = '#27272a';
    }

    ctx.strokeStyle = borderStyle;
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 1.5 : 1.0;

    if (node.type === 'Security Attribute') {
      // Draw rectangular round capsule
      const width = 110;
      const height = 38;
      const rx = node.x - width / 2;
      const ry = node.y - height / 2;
      
      ctx.beginPath();
      ctx.roundRect(rx, ry, width, height, 6);
      ctx.fill();
      ctx.stroke();

      // Inner text
      ctx.shadowBlur = 0; // Disable text blur for cleaner reading
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Handle title wrap
      const textParts = node.label.split(' ');
      if (textParts.length > 1) {
        ctx.fillText(textParts.slice(0, 2).join(' '), node.x, node.y - 5);
        ctx.fillStyle = '#10b981';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText('SHIELD GUARD', node.x, node.y + 7);
      } else {
        ctx.fillText(node.label, node.x, node.y - 3);
        ctx.fillStyle = '#10b981';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText('SHIELD GUARD', node.x, node.y + 7);
      }
    } else {
      // Draw solid circle for service modules
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + (isHovered ? 2 : 0), 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Inner text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const labelWrap = node.label.split(' ');
      if (labelWrap.length > 1) {
        ctx.fillText(labelWrap[0], node.x, node.y - 5);
        ctx.fillStyle = '#4D4DFF';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(labelWrap.slice(1).join(' '), node.x, node.y + 6);
      } else {
        ctx.fillText(node.label, node.x, node.y);
      }
    }

    ctx.restore();
  };

  // Click handler to look up nodes and coordinates on interactive Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Detect click in circle/capsule boundary
    let matchedNode: ExplodedNode | null = null;
    for (const node of nodes) {
      const distance = Math.hypot(clickX - node.x, clickY - node.y);
      if (node.type === 'Security Attribute') {
        if (Math.abs(clickX - node.x) < 55 && Math.abs(clickY - node.y) < 22) {
          matchedNode = node;
          break;
        }
      } else {
        if (distance < node.radius + 6) {
          matchedNode = node;
          break;
        }
      }
    }

    if (matchedNode) {
      setSelectedExplodedNodeId(matchedNode.id);

      // Handle interactive linking
      if (sourceNodeId) {
        if (sourceNodeId === matchedNode.id) {
          setSourceNodeId(null);
        } else {
          handleConnectNodes(sourceNodeId, matchedNode.id);
          setSourceNodeId(null);
        }
      }
    } else {
      setSelectedExplodedNodeId(null);
      setSourceNodeId(null);
    }
  };

  // Hover detection for dynamic best practices preview matching user interactions
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let matchId: string | null = null;
    for (const node of nodes) {
      const distance = Math.hypot(mouseX - node.x, mouseY - node.y);
      if (node.type === 'Security Attribute') {
        if (Math.abs(mouseX - node.x) < 55 && Math.abs(mouseY - node.y) < 22) {
          matchId = node.id;
          break;
        }
      } else {
        if (distance < node.radius + 5) {
          matchId = node.id;
          break;
        }
      }
    }

    if (matchId !== hoveredNodeId) {
      setHoveredNodeId(matchId);
    }
  };

  // Export visual security configurations to markdown compliance list
  const handleExportChecklist = () => {
    setChecklistExported(true);
    setActionHistory(prev => [`[CHECKLIST] Generated live markdown report for *${targetNodeLabel}*`, ...prev]);
    setTimeout(() => setChecklistExported(false), 3000);
  };

  const selectedNode = nodes.find(n => n.id === (selectedExplodedNodeId ?? hoveredNodeId)) || null;

  const getHeaderScoreLabel = (type: string) => {
    if (type === 'client') return 'FRONTEND COMPLIANCE';
    if (type === 'waf') return 'FIREWALL COMPLIANCE';
    if (type === 'api') return 'CORE SERVICE COMPLIANCE';
    if (type === 'db') return 'DATABASE COMPLIANCE';
    if (type === 'auth') return 'IDENTITY ACCESS COMPLIANCE';
    return 'CLUSTER INSTANCE COMPLIANCE';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 bg-black z-40 flex flex-col h-screen select-none text-stone-100"
      id="exploded-view-portal"
    >
      
      {/* 1. TOP HEADER & TELEMETRY */}
      <div className="bg-[#050505] border-b border-[#1A1A1A] px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          
          {/* HIGH-VISIBILITY CRIMSON EXPLICIT RETURN TO INFRASTRUCTURE BUTTON */}
          <button 
            onClick={onClose}
            className="p-2 px-3.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-200 hover:text-white flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer shadow-lg shadow-rose-950/20"
            id="return-to-infrastructure-btn"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-rose-400" />
            RETURN TO INFRASTRUCTURE
          </button>

          <div className="w-px h-6 bg-zinc-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-mono text-[8px] text-[#4D4DFF] font-black tracking-widest block uppercase">
                X-RAY DEEP DRILL DRILL ATTRIBUTES
              </span>
              <span className="text-[7px] px-1.5 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-900 font-mono font-bold rounded uppercase">
                {systemContext} Segment
              </span>
            </div>
            <h1 className="font-sans font-neutral font-black italic tracking-wide text-xs sm:text-sm text-white tracking-wider uppercase mt-1">
              {targetNodeLabel} Infrastructure Breakdown
            </h1>
          </div>
        </div>

        {/* COMPLIANCE ALARM DISPLAY */}
        <div className="flex items-center gap-4">
          <div className="bg-[#090909] border border-zinc-900 px-4 py-2 rounded flex items-center gap-3">
            <div className="text-right">
              <span className="font-mono text-[7px] text-zinc-500 uppercase font-black block leading-none">
                {getHeaderScoreLabel(targetNodeType)}
              </span>
              <span className={`font-mono text-xs font-black block mt-1 ${
                complianceScore > 75 ? 'text-[#10b981]' : complianceScore > 40 ? 'text-amber-400' : 'text-rose-500'
              }`}>
                {complianceScore}% STRICT SAFETY
              </span>
            </div>
            <div className="relative flex items-center justify-center">
              <div className={`w-3.5 h-3.5 rounded-full ${
                complianceScore === 100 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 animate-ping'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE WHITEBOARD CANVAS MATRIX */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
        
        {/* LEFT VIEW CONTROLS AND VISUALIZATION AREA */}
        <div className="lg:col-span-8 relative flex flex-col bg-stone-950/20 overflow-hidden" ref={containerRef}>
          
          {/* USER HELP OVERLAYS */}
          <div className="absolute top-4 left-4 z-20 space-y-2 pointer-events-none max-w-sm">
            <div className="bg-black/95 backdrop-blur-sm border border-zinc-900 p-2.5 rounded shadow-2xl text-[9px] text-zinc-400 leading-normal">
              <p className="font-mono font-bold text-white uppercase text-[8px] tracking-wider mb-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-[#4D4DFF]" />
                Interactive Data-weave Instructions
              </p>
              <ul className="list-disc pl-3.5 space-y-0.5">
                <li>Click on any attribute node to inspect specific best-practice guidelines.</li>
                <li>To draw connections: select a node, then click the target node.</li>
                <li>Observe data flows (Green is Secured, Red shows raw direct threat bypasses!).</li>
              </ul>
            </div>
          </div>

          {/* DYNAMIC PIPELINE WEAVE MODE STATE DISPLAY */}
          {sourceNodeId && (
            <div className="absolute top-4 right-4 z-20 bg-amber-500/10 border border-amber-500/40 px-3 py-2 rounded text-[10px] font-mono text-amber-300 animate-pulse">
              WEAVING FLOW: Select target component to form link...
            </div>
          )}

          {/* CANVAS COMPONENT */}
          <canvas 
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="w-full h-full cursor-crosshair block animate-[fadeIn_0.5s_ease-out]"
          />

          {/* MINI BADGES WATERMARK */}
          <div className="absolute bottom-4 left-4 z-10 font-mono text-[7px] text-zinc-700 tracking-[0.25em] select-none uppercase pointer-events-none">
            DRILLED_XRAY_VAL_ENGINE_V1.1
          </div>
        </div>

        {/* RIGHT SIDE DETAILS AND CHECKS INSPECTOR */}
        <div className="lg:col-span-4 bg-[#030303] border-l border-[#1A1A1A] p-4 flex flex-col justify-between overflow-y-auto h-full scrollbar-thin">
          
          <div className="space-y-6">
            
            {/* INSPECTOR DETAILS COMPONENT */}
            <div className="bg-black/80 border border-zinc-900 p-3.5 rounded-lg space-y-3.5">
              <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                <Layers className="w-4 h-4 text-[#4D4DFF]" />
                <span className="font-mono text-[8px] font-black text-zinc-300 uppercase tracking-widest block">
                  COMPONENT ATTRIBUTE SPECIFICATION
                </span>
              </div>

              {selectedNode ? (
                <div className="space-y-3">
                  <div>
                    <span className={`text-[7.5px] px-1.5 py-0.5 rounded font-mono font-black border uppercase ${
                      selectedNode.type === 'Security Attribute' 
                        ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' 
                        : 'bg-[#4D4DFF]/10 text-indigo-400 border-[#4D4DFF]/30'
                    }`}>
                      {selectedNode.type}
                    </span>
                    <h3 className="font-sans font-neutral font-black text-sm text-white uppercase tracking-tight mt-1 px-0.5">
                      {selectedNode.label}
                    </h3>
                  </div>

                  <div className="space-y-2 text-[10.5px]">
                    <div className="bg-zinc-950/80 p-2 rounded border border-zinc-900/60 font-mono text-[9.5px]">
                      <span className="text-zinc-500 uppercase text-[8px] block mb-0.5">Runtime Validation Logic</span>
                      <p className="text-stone-300 italic">
                        {selectedNode.logic}
                      </p>
                    </div>

                    <div className="p-2 bg-[#4D4DFF]/5 border border-[#4D4DFF]/15 rounded text-[10px] space-y-1">
                      <span className="font-mono text-indigo-400 text-[8px] uppercase tracking-wider block font-bold">Security Best-Practice Blueprint</span>
                      <p className="text-zinc-300 leading-relaxed font-sans">
                        {selectedNode.bestPractice}
                      </p>
                    </div>

                    <p className="text-zinc-400 font-sans leading-normal text-[10px] px-0.5">
                      {selectedNode.description}
                    </p>
                  </div>

                  {/* Link action helper */}
                  <div className="pt-1.5 flex gap-2">
                    <button
                      onClick={() => setSourceNodeId(selectedNode.id)}
                      className="flex-1 py-1.5 bg-indigo-950 border border-indigo-800 text-[9px] font-mono hover:bg-[#4D4DFF] hover:text-white text-[#4D4DFF] rounded uppercase tracking-wider transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 mb-1"
                    >
                      <Link className="w-3 h-3" />
                      Weave data connection path
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Terminal className="w-6 h-6 text-zinc-650 mx-auto" />
                  <p className="text-[10px] font-mono text-zinc-650 uppercase">--- inspect node payload ---</p>
                  <p className="text-[9px] text-zinc-600 max-w-[200px] mx-auto font-sans">Click on nodes inside the 2D arena to evaluate core validation parameters.</p>
                </div>
              )}
            </div>

            {/* DYNAMIC PIPELINE PATHWAYS LIST */}
            <div className="bg-[#050505] border border-zinc-900 p-3 rounded-lg space-y-2.5">
              <span className="font-mono text-[8px] font-black text-zinc-400 block border-b border-zinc-900 pb-1.5 uppercase tracking-wider">
                WEAVED ATTRIBS PIPELINES ({currentEdgesEvaluated.length})
              </span>
              
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {currentEdgesEvaluated.length === 0 ? (
                  <div className="text-zinc-700 italic text-[9px] font-mono py-4 text-center">--- no pipelines defined ---</div>
                ) : (
                  currentEdgesEvaluated.map((edge, idx) => {
                    const src = nodes.find(n => n.id === edge.source);
                    const tgt = nodes.find(n => n.id === edge.target);
                    return (
                      <div key={idx} className="bg-zinc-950/60 p-2 rounded border border-zinc-900/60 hover:border-zinc-850 flex items-center justify-between text-[10px]">
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono text-[8.5px] uppercase font-black ${
                              edge.status === 'insecure' ? 'text-rose-500' : 'text-emerald-400'
                            }`}>
                              {edge.status === 'insecure' ? '⚠️ INDIRECT BYPASS' : '✓ ENFORCED SHIELD'}
                            </span>
                          </div>
                          <p className="font-mono text-[9px] text-zinc-300 truncate">
                            {src?.label} ➔ {tgt?.label}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveEdge(edge.id)}
                          className="p-1 text-zinc-600 hover:text-red-450 hover:bg-zinc-900 rounded shrink-0 transition-colors cursor-pointer"
                          title="Prune Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {bypassEdgesCount > 0 && (
                <div className="p-2.5 bg-rose-950/10 border border-rose-900/35 text-[9px] text-rose-350 rounded leading-normal font-mono flex gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-rose-400">BYPASS CRITICAL ALARM:</span> Direct linkages bypass the designated security validator lines. Threat vectors detected!
                  </div>
                </div>
              )}
            </div>

            {/* ACTION LOG STREAMS */}
            <div className="bg-[#050505] border border-zinc-900 p-3 rounded-lg space-y-2">
              <span className="font-mono text-[8px] font-black text-zinc-500 block border-b border-zinc-900 pb-1 uppercase tracking-wider">
                WEAVER RUNTIME LOG
              </span>
              <div className="font-mono text-[8.5px] text-zinc-500 space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                {actionHistory.map((log, index) => (
                  <div key={index} className="leading-snug select-text">
                    <span className="text-zinc-700">❯</span> {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* DYNAMIC SECURITY CHECKLIST EXPORT */}
          <div className="pt-4 border-t border-zinc-900/80 mt-4 space-y-2 bg-[#050505]/50 -mx-4 -mb-4 p-4 rounded-b-lg">
            <span className="font-mono text-[8.5px] font-black text-zinc-400 uppercase tracking-wider block">
              EXPORT AUDIT DOCUMENTATION
            </span>
            <p className="text-[10px] text-zinc-500 leading-normal font-sans">
              Export these active deep-drill security attribute rules into a standard code verification review catalog.
            </p>
            <button
              onClick={handleExportChecklist}
              className={`w-full py-2.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-white cursor-pointer ${
                checklistExported 
                  ? 'bg-emerald-600' 
                  : 'bg-gradient-to-r from-[#4D4DFF] to-indigo-600 hover:shadow-[0_0_15px_rgba(77,77,255,0.45)]'
              }`}
            >
              {checklistExported ? (
                <>
                  <FileText className="w-3.5 h-3.5 text-emerald-100" />
                  MD REPORT GENERATED & EXPORTED
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-indigo-100 animate-bounce" />
                  EXPORT COMPLIANCE CODE CATALOGUE
                </>
              )}
            </button>

            {/* ADDITIONAL INSTANT RETURN BUTTON FOR INTUITY AND EASE OF USE */}
            <div className="pt-2 border-t border-zinc-900/40 mt-2">
              <button
                onClick={onClose}
                className="w-full py-2 rounded font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-stone-300 hover:text-white cursor-pointer"
                id="sidebar-explicit-return-btn"
              >
                <ArrowLeft className="w-4 h-4 shrink-0 text-stone-400" />
                RETURN TO BLUEPRINT CANVAS
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER CHECKLIST EXPLANATION PANEL */}
      <div className="bg-[#050505] border-t border-[#1A1A1A] px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[10px] font-mono gap-3">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>PROVENANCE CHECK: Meets Zero-Trust access and HIPAA diagnostic isolation guidelines.</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-600">
          <span>PIPELINE DRILL: SEC_DEEP_HTML5_V1</span>
          <span>FLAVOR: {systemContext} ARCHITECTURE</span>
        </div>
      </div>

    </motion.div>
  );
}

/*
 * DEVELOPER EXPORT RULE CHECKLIST CONFIGURATION GUIDE:
 * 
 * Each component node shown in this model carries distinct cryptographic and logic validations
 * that map directly to high-priority static defense checklist criteria. Below is the documentation 
 * outlining how to export these elements and requirements into standard verification codebases:
 * 
 * --------------------------------------------------------------------------------------------------
 * | Target Component     | Security Logic                              | Compliance Export Target |
 * --------------------------------------------------------------------------------------------------
 * | Input Sanitizer     | HTMLPurify / DOMPurify clean sequences     | OWASP Ingress validation |
 * | Secure Token Store  | HttpOnly Secure cookie store parameters   | cookie-config verification|
 * | CSP Dome           | content-security-policy rigid headers      | browser check validation |
 * | XSS Shield          | Contextual DOM render safe escaping        | framework script-sanitize|
 * | Consent Popup (Med) | Enforce explicit user consent triggers    | GDPR Sec 7 compliance check|
 * | PHI Masking (Med)   | RegEx patterns to screen social data      | HIPAA Sec 164 privacy log|
 * | Audit Trail (ERP)   | Write-locked historical transaction loggger| SOC2 System Operations   |
 * | Price Validator(ERP)| Crypto-signed price conversion algorithms   | Decimals boundary check  |
 * --------------------------------------------------------------------------------------------------
 */
