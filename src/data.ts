import { SystemBlueprint, SavedBlueprint, ThreatSimulation, RBACEntity, RBACAttribute } from './types';

export const SYSTEM_BLUEPRINTS: SystemBlueprint[] = [
  {
    id: 'HEALTH',
    title: 'Health System',
    category: 'Healthcare Infrastructure',
    description: 'High-availability Patient Portal connected to Electronic Health Records system. Configured for HIPAA compliance and endpoint protection.',
    threatScore: 12,
    iconName: 'Heart',
    nodes: [
      {
        id: 'cl-1',
        type: 'client',
        label: 'Health System Web Portal',
        subLabel: 'React SPA Client interface accessed via browser over HTTPS.',
        ipAddress: '198.51.100.42',
        port: 443,
        status: 'secure',
        integrity: 100,
        connections: ['waf-1'],
        description: 'React SPA Client interface accessed via browser over HTTPS.',
        position: { x: 24, y: 31 },
        securityRules: [
          { id: 'h1', name: 'Strict CSP Header', enabled: true, description: 'Mitigates XSS attack vectors' },
          { id: 'h2', name: 'X-Frame-Options: DENY', enabled: true, description: 'Clickjacking prevention' }
        ]
      },
      {
        id: 'waf-1',
        type: 'waf',
        label: 'WAF & API Gateway',
        subLabel: 'Cloudflare Web Application Firewall filtering requests and routing to private networks.',
        ipAddress: '10.0.0.1',
        port: 443,
        status: 'secure',
        integrity: 100,
        connections: ['api-1'],
        description: 'Cloudflare Web Application Firewall filtering requests and routing to private networks.',
        position: { x: 35, y: 64 },
        securityRules: [
          { id: 'w1', name: 'SQL Injection Ruleset', enabled: true, description: 'Blocks malicious character escaping patterns' },
          { id: 'w2', name: 'GeoIP Compliance Filter', enabled: true, description: 'Restricts traffic to whitelisted healthcare provider regions' }
        ]
      },
      {
        id: 'api-1',
        type: 'api',
        label: 'Health System Core Service',
        subLabel: 'Node.js internal application microservice orchestrating domain transactions.',
        ipAddress: '10.0.2.14',
        port: 8080,
        status: 'secure',
        integrity: 100,
        connections: ['db-1', 'auth-1'],
        description: 'Node.js internal application microservice orchestrating domain transactions.',
        position: { x: 48, y: 31 },
        securityRules: [
          { id: 'a1', name: 'OAuth 2.0 PKCE Verification', enabled: true, description: 'Verifies authorization headers against OAuth server' },
          { id: 'a2', name: 'Mutual TLS (mTLS) with DB', enabled: true, description: 'Requires client certificate handshake to verify database requests' }
        ]
      },
      {
        id: 'db-1',
        type: 'db',
        label: 'Health System Production Database',
        subLabel: 'Encrypted-at-rest PostgreSQL cluster storing confidential records.',
        ipAddress: '10.0.8.99',
        port: 5432,
        status: 'secure',
        integrity: 100,
        connections: [],
        description: 'Encrypted-at-rest PostgreSQL cluster storing confidential records.',
        position: { x: 55, y: 81 },
        securityRules: [
          { id: 'd1', name: 'IP Firewall Restriction', enabled: true, description: 'Accepts inbound packets strictly from Core Service node' },
          { id: 'd2', name: 'Column-Level Encryption', enabled: true, description: 'Data columns like medical history require active hardware HSM decrypt' }
        ]
      },
      {
        id: 'auth-1',
        type: 'auth',
        label: 'Auth0 identity & SDK Provider',
        subLabel: 'External encrypted identity verification and token authorization.',
        ipAddress: 'external-api.auth0.com',
        port: 443,
        status: 'secure',
        integrity: 100,
        connections: [],
        description: 'External encrypted identity verification and token authorization.',
        position: { x: 67, y: 60 },
        securityRules: [
          { id: 'au1', name: 'OIDC Handshake Guard', enabled: true, description: 'Validates issuer claims on JSON Web Tokens' },
          { id: 'au2', name: 'Telemetry Integrity Signatures', enabled: true, description: 'Prevents tampering with user status claims' }
        ]
      }
    ],
    edges: [
      { source: 'cl-1', target: 'waf-1', protocol: 'HTTPS (TLS v1.3)', status: 'secure' },
      { source: 'waf-1', target: 'api-1', protocol: 'gRPC', status: 'secure' },
      { source: 'api-1', target: 'db-1', protocol: 'PostgreSQL Secure Socket', status: 'secure' },
      { source: 'api-1', target: 'auth-1', protocol: 'OIDC HTTPS', status: 'secure' }
    ]
  },
  {
    id: 'FINANCE',
    title: 'Finance System',
    category: 'Banking & Payments System',
    description: 'High-security transaction processor with continuous audit trail logs, double-ledger database nodes, and zero-trust proxy.',
    threatScore: 8,
    iconName: 'Landmark',
    nodes: [
      {
        id: 'cl-2',
        type: 'client',
        label: 'MOBILE APPS BRIDGE',
        subLabel: 'iOS / Android SSL-Pinned',
        ipAddress: '172.16.8.99',
        port: 443,
        status: 'secure',
        integrity: 100,
        connections: ['waf-2'],
        description: 'Pinned SSL endpoint interface for native smartphone applications with biometric secondary checks.',
        position: { x: 10, y: 35 },
        securityRules: [
          { id: 'h3', name: 'SSL Certificate Pinning', enabled: true, description: 'Locks expected terminal identity keys, preventing proxy sniffing' },
          { id: 'h4', name: 'Biometric Session Hash', enabled: true, description: 'Authenticates tokens using secure enclave certificates on-device' }
        ]
      },
      {
        id: 'waf-2',
        type: 'waf',
        label: 'ZERO TRUST PROXY',
        subLabel: 'OAuth Gate & WAF Guard',
        ipAddress: '10.40.1.5',
        port: 443,
        status: 'secure',
        integrity: 100,
        connections: ['api-2'],
        description: 'Advanced reverse security proxy applying real-time threat intelligence and fraud risk scoring to all inbound operations.',
        position: { x: 35, y: 35 },
        securityRules: [
          { id: 'w4', name: 'IP Reputation Lookup', enabled: true, description: 'Blacklists proxy, TOR node, and datacenter VPN traffic' },
          { id: 'w5', name: 'PCI-DSS Strict Cipher Filters', enabled: true, description: 'Demands TLS 1.3 standard with select high-grade perfect forward secrecy suites' }
        ]
      },
      {
        id: 'api-2',
        type: 'api',
        label: 'PAYMENT GATEWAY API',
        subLabel: 'Double-Entry Microservice',
        ipAddress: '10.40.10.8',
        port: 9000,
        status: 'secure',
        integrity: 99,
        connections: ['db-2'],
        description: 'High-performance microservice managing active payment accounts, ledger entries, and core reconciliation calculations.',
        position: { x: 60, y: 35 },
        securityRules: [
          { id: 'a4', name: 'mTLS Handshake Required', enabled: true, description: 'Authenticates with proxy utilizing isolated secure hardware modules' },
          { id: 'a5', name: 'Real-time Fraud Score Audit', enabled: true, description: 'Invokes internal ML analytics evaluating pattern velocities' }
        ]
      },
      {
        id: 'db-2',
        type: 'db',
        label: 'LEDGER SECURE CODES',
        subLabel: 'Immutable Double-Entry Ledger',
        ipAddress: '10.40.20.12',
        port: 5432,
        status: 'secure',
        integrity: 100,
        connections: [],
        description: 'Relational ACID cluster managing ledger credits and debits. Implements cryptographic block chain sealing.',
        position: { x: 80, y: 35 },
        securityRules: [
          { id: 'd4', name: 'Cryptographic Chain Integrity', enabled: true, description: 'Links each ledger row hashes to previous node block hashes' },
          { id: 'd5', name: 'Read-Only DB Auditing', enabled: true, description: 'Grants log access exclusively to isolated secure third-party compliance worker accounts' }
        ]
      }
    ]
  },
  {
    id: 'LIBRARY',
    title: 'Library System',
    category: 'Digital Repository system',
    description: 'High-volume cultural archive portal with federated metadata ingestion, catalog indexing services, and public access points.',
    threatScore: 25,
    iconName: 'BookOpen',
    nodes: [
      {
        id: 'cl-3',
        type: 'client',
        label: 'PUBLIC CATALOG INDEX',
        subLabel: 'Web Search Frontend',
        ipAddress: '192.168.12.44',
        port: 80,
        status: 'secure',
        integrity: 90,
        connections: ['waf-3'],
        description: 'Anonymous public access dashboard built for searching physical and digital collection records.',
        position: { x: 10, y: 35 },
        securityRules: [
          { id: 'h5', name: 'Public Search Restrict', enabled: true, description: 'Limits catalog search lengths to prevent injection overruns' }
        ]
      },
      {
        id: 'waf-3',
        type: 'waf',
        label: 'ENTRY LAYER FILTER',
        subLabel: 'Scraping Defense Guard',
        ipAddress: '10.5.1.2',
        port: 80,
        status: 'secure',
        integrity: 95,
        connections: ['api-3'],
        description: 'Lightweight filter separating high-frequency automation and malicious scraping crawlers from authentic user queries.',
        position: { x: 35, y: 35 },
        securityRules: [
          { id: 'w6', name: 'Scraper Blocklist rules', enabled: true, description: 'Flags browser signatures lacking head configurations or using standard bot frameworks' }
        ]
      },
      {
        id: 'api-3',
        type: 'api',
        label: 'METADATA INGESTION API',
        subLabel: 'Dublin Core REST Engine',
        ipAddress: '10.5.2.14',
        port: 8081,
        status: 'secure',
        integrity: 88,
        connections: ['db-3'],
        description: 'Translates XML schemas, accepts Dublin Core fields, and serves metadata index files.',
        position: { x: 60, y: 35 },
        securityRules: [
          { id: 'a6', name: 'XML External Entity Guard', enabled: true, description: 'Sanitizes imported files, disabling external references to protect filesystems' }
        ]
      },
      {
        id: 'db-3',
        type: 'db',
        label: 'CATALOG POSTGRES',
        subLabel: 'Metadata Index Cluster',
        ipAddress: '10.5.3.8',
        port: 5432,
        status: 'secure',
        integrity: 95,
        connections: [],
        description: 'A traditional catalog index store holding book metadata records, author IDs, and shelf mappings.',
        position: { x: 80, y: 35 },
        securityRules: [
          { id: 'd6', name: 'Strict Schema Only', enabled: true, description: 'Refuses dynamic direct commands; demands prepared transaction inputs' }
        ]
      }
    ]
  },
  {
    id: 'COLLEGE_ERP',
    title: 'College ERP',
    category: 'Institutions Control Board',
    description: 'Centralized college ERP linking grading engines, registers, class calendars, and student financial accounts under federated SSO.',
    threatScore: 18,
    iconName: 'GraduationCap',
    nodes: [
      {
        id: 'cl-4',
        type: 'client',
        label: 'CAMPUS DESKTOP APP',
        subLabel: 'Registrar & Student Terminal',
        ipAddress: '192.168.4.55',
        port: 443,
        status: 'secure',
        integrity: 92,
        connections: ['waf-4'],
        description: 'Web & desktop portal containing different privileges for students, professors, and administrative registrars.',
        position: { x: 10, y: 35 },
        securityRules: [
          { id: 'h6', name: 'Role-Based Local State Routing', enabled: true, description: 'Conditionally renders layout components based on student/staff token claims' }
        ]
      },
      {
        id: 'waf-4',
        type: 'waf',
        label: 'SHIELD ACCESS MANAGER',
        subLabel: 'Federated SSO Guard',
        ipAddress: '10.12.1.20',
        port: 443,
        status: 'secure',
        integrity: 98,
        connections: ['api-4'],
        description: 'SAML & OpenID Connect endpoint authorizing campus users and validating role privilege scopes.',
        position: { x: 35, y: 35 },
        securityRules: [
          { id: 'w7', name: 'Session Token Checksum', enabled: true, description: 'Checks session token origins, blocking hijacking attempts across campus networks' },
          { id: 'w8', name: 'Multifactor Required For Staff', enabled: true, description: 'Locks down grading and administrative actions unless MFA verified' }
        ]
      },
      {
        id: 'api-4',
        type: 'api',
        label: 'CAMPUS SERVICE ROUTER',
        subLabel: 'Course & Grade Manager',
        ipAddress: '10.12.2.4',
        port: 8443,
        status: 'secure',
        integrity: 94,
        connections: ['db-4'],
        description: 'Directs transcript processes, class schedule modifications, and library fines processing.',
        position: { x: 60, y: 35 },
        securityRules: [
          { id: 'a7', name: 'RBAC Access Validation', enabled: true, description: 'Double-checks that requests to update grades contain a verified professor claim' }
        ]
      },
      {
        id: 'db-4',
        type: 'db',
        label: 'CAMPUS RECORD MATRIX',
        subLabel: 'Student Records SQL (AES-256)',
        ipAddress: '10.12.3.15',
        port: 5432,
        status: 'secure',
        integrity: 97,
        connections: [],
        description: 'Database housing enrollment contracts, grading matrix schemas, and student credentials.',
        position: { x: 85, y: 35 },
        securityRules: [
          { id: 'd7', name: 'Grade Entry Crypt-Sign', enabled: true, description: 'Validates grading entries utilizing an immutable registrar token signature' }
        ]
      }
    ]
  },
  {
    id: 'LOGISTICS',
    title: 'Logistics System',
    category: 'Supply Chain Ledger',
    description: 'Global real-time logistics dashboard, processing geolocation reports, cargo integrity statistics, and transit dispatch commands.',
    threatScore: 15,
    iconName: 'Truck',
    nodes: [
      {
        id: 'cl-5',
        type: 'client',
        label: 'FLEET TELEMETRY EDGE',
        subLabel: 'IoT Dispatch Client',
        ipAddress: '172.18.2.11',
        port: 8883,
        status: 'secure',
        integrity: 95,
        connections: ['waf-5'],
        description: 'Mobile field tablets and vehicle IoT telemetry sensors delivering location reports and sensor coordinates.',
        position: { x: 10, y: 35 },
        securityRules: [
          { id: 'h7', name: 'Payload Authentication Check', enabled: true, description: 'Signs message packets from dispatch units using ECDSA algorithms' }
        ]
      },
      {
        id: 'waf-5',
        type: 'waf',
        label: 'IOT TELEMETRY HUB',
        subLabel: 'Message-Queue Sentinel',
        ipAddress: '10.20.1.2',
        port: 8883,
        status: 'secure',
        integrity: 100,
        connections: ['api-5'],
        description: 'High-throughput payload filtering gateway structured to scan device signals and drop irregular anomalies.',
        position: { x: 35, y: 35 },
        securityRules: [
          { id: 'w9', name: 'Anomalous Interval Guard', enabled: true, description: 'Blocks field transmitters pushing signals outside permitted report windows' }
        ]
      },
      {
        id: 'api-5',
        type: 'api',
        label: 'DISPATCH CORE ENGINE',
        subLabel: 'Route Solver & Message broker',
        ipAddress: '10.20.2.7',
        port: 8080,
        status: 'secure',
        integrity: 96,
        connections: ['db-5'],
        description: 'Resolves fleet navigation routes, schedules cargo steps, and processes real-time alert triggers.',
        position: { x: 60, y: 35 },
        securityRules: [
          { id: 'a8', name: 'Signature Payload Verification', enabled: true, description: 'Verifies and reconciles GPS hashes using specialized hardware keyrings' }
        ]
      },
      {
        id: 'db-5',
        type: 'db',
        label: 'FLEET TIMELINE STORAGE',
        subLabel: 'Timescale Geopostgres',
        ipAddress: '10.20.3.44',
        port: 5432,
        status: 'secure',
        integrity: 98,
        connections: [],
        description: 'Optimized ledger recording chronological truck routes, shipping timestamps, and telemetry sensor histories.',
        position: { x: 85, y: 35 },
        securityRules: [
          { id: 'd8', name: 'Time-Window Protection', enabled: true, description: 'Blocks retroactive edits in database tables older than five minutes' }
        ]
      }
    ]
  },
  {
    id: 'ECOMMERCE',
    title: 'Ecommerce System',
    category: 'High-Traffic Webstore',
    description: 'High-frequency commerce suite routing customer carts, sales discounts, credit evaluations, and order dispatches across redundant cloud environments.',
    threatScore: 20,
    iconName: 'ShoppingCart',
    nodes: [
      {
        id: 'cl-6',
        type: 'client',
        label: 'CONSUMER WEBPORTAL',
        subLabel: 'Public Webstore Client',
        ipAddress: '192.168.30.2',
        port: 443,
        status: 'secure',
        integrity: 91,
        connections: ['waf-6'],
        description: 'Customer front portal allowing product list searches, shopping checkout inputs, and delivery scheduling.',
        position: { x: 10, y: 35 },
        securityRules: [
          { id: 'h8', name: 'Form CSRF Protections', enabled: true, description: 'Injects unique tokens with purchase checkout requests to prevent cross-site fraud' }
        ]
      },
      {
        id: 'waf-6',
        type: 'waf',
        label: 'ECOMMERCE FLOODSHIELD',
        subLabel: 'Bot & DDoS Blockade',
        ipAddress: '10.80.1.5',
        port: 443,
        status: 'secure',
        integrity: 99,
        connections: ['api-6'],
        description: 'Scans storefront traffic spikes, filtering out automated ticketing engines, scalping software, and brute inventory searches.',
        position: { x: 35, y: 35 },
        securityRules: [
          { id: 'w10', name: 'Checkout Velocity Checking', enabled: true, description: 'Restricts single IP accounts to a maximum of 3 purchase checkouts per minute' },
          { id: 'w11', name: 'Inventory Lock CAPTCHA', enabled: true, description: 'Forces high-risk shopping bids to solve security captcha validations' }
        ]
      },
      {
        id: 'api-6',
        type: 'api',
        label: 'ORDER & CASHIER ENGINE',
        subLabel: 'Cart & Price Solver Service',
        ipAddress: '10.80.10.4',
        port: 8080,
        status: 'secure',
        integrity: 93,
        connections: ['db-6'],
        description: 'Calculates active discount structures, holds shopping bag lists, and queries the ledger for real-time inventory levels.',
        position: { x: 60, y: 35 },
        securityRules: [
          { id: 'a9', name: 'Total Order Limit Protection', enabled: true, description: 'Enforces constraints restricting individual shopping baskets to logical cash values' }
        ]
      },
      {
        id: 'db-6',
        type: 'db',
        label: 'STOREFRONT SQL CLUSTER',
        subLabel: 'Active Inventory & Ledger',
        ipAddress: '10.80.20.9',
        port: 5432,
        status: 'secure',
        integrity: 96,
        connections: [],
        description: 'Main master ledger recording active item counts, client profile credentials, and completed order receipts.',
        position: { x: 85, y: 35 },
        securityRules: [
          { id: 'd9', name: 'Inventory Balance Constraints', enabled: true, description: 'Rejects transactions attempting to drain records below zero items' }
        ]
      }
    ]
  },
  {
    id: 'PLACEHOLDER_GAME',
    title: 'GAMING SERVERS API',
    category: 'High-Velocity Multiplayer Lobby',
    description: 'High-frequency gaming session manager supporting client session tokens, game state ledgers, anti-cheat guards, and matchmaking services.',
    threatScore: 28,
    isPlaceholder: true,
    iconName: 'Gamepad2',
    nodes: [
      {
        id: 'cl-7',
        type: 'client',
        label: 'MULTIPLAYER RECEPTOR',
        subLabel: 'Active Game Client Client',
        ipAddress: '192.168.100.4',
        port: 7777,
        status: 'secure',
        integrity: 85,
        connections: ['waf-7'],
        description: 'Console, mobile or desktop client sending high-frequency synchronization controls and action actions.',
        position: { x: 10, y: 35 },
        securityRules: [
          { id: 'h9', name: 'Anti-Memory Bypass', enabled: true, description: 'Scans device memory to prevent client-side coordinate spoofing' }
        ]
      },
      {
        id: 'waf-7',
        type: 'waf',
        label: 'ANTI-CHEAT SENTRY GATE',
        subLabel: 'Socket Packet Analyzer',
        ipAddress: '10.90.1.10',
        port: 7777,
        status: 'secure',
        integrity: 98,
        connections: ['api-7'],
        description: 'Analyzes socket inputs, dropping commands containing speed-hacking profiles or out-of-bounds metrics.',
        position: { x: 35, y: 35 },
        securityRules: [
          { id: 'w12', name: 'Velocity Packet Drop', enabled: true, description: 'Drops communication chains submitting excessive inputs' }
        ]
      },
      {
        id: 'api-7',
        type: 'api',
        label: 'MATCHMAKER & STATE API',
        subLabel: 'Session Authoritative Host',
        ipAddress: '10.90.2.14',
        port: 8080,
        status: 'secure',
        integrity: 90,
        connections: ['db-7'],
        description: 'Calculates active gameplay statistics, records leaderboard flags, and updates user inventory counts.',
        position: { x: 60, y: 35 },
        securityRules: [
          { id: 'a10', name: 'Server-Authoritative States', enabled: true, description: 'Recomputes actions completely server-side, overriding client data' }
        ]
      },
      {
        id: 'db-7',
        type: 'db',
        label: 'GAME STATE CODES',
        subLabel: 'Redis High-Speed Vault',
        ipAddress: '10.90.5.2',
        port: 6379,
        status: 'secure',
        integrity: 95,
        connections: [],
        description: 'High-availability key-value ledger storing active lobbies and student sessions with tight session durations.',
        position: { x: 85, y: 35 },
        securityRules: [
          { id: 'd10', name: 'Encrypted Session Key Ring', enabled: true, description: 'Issues volatile tokens expiring every 30 minutes' }
        ]
      }
    ]
  },
  {
    id: 'PLACEHOLDER_SMART_HOME',
    title: 'SMART BASE IoT CORE',
    category: 'Home Security Controller Hub',
    description: 'Industrial Smart Hub receiving data streams from smart locks, perimeter alerts, interior temperature nodes, and video logs.',
    threatScore: 22,
    isPlaceholder: true,
    iconName: 'Cpu',
    nodes: [
      {
        id: 'cl-8',
        type: 'client',
        label: 'EDGE SMART DEVICES',
        subLabel: 'Secure Locks & Sensors',
        ipAddress: '192.168.1.9',
        port: 443,
        status: 'secure',
        integrity: 91,
         connections: ['waf-8'],
        description: 'Smart locks, cameras, alarms and motion sensors scanning smart-home perimeters to detect intruders.',
        position: { x: 10, y: 35 },
        securityRules: [
          { id: 'h10', name: 'Device-Level RSA Certificate', enabled: true, description: 'Signs telemetry packets directly inside on-chip microcontrollers' }
        ]
      },
      {
        id: 'waf-8',
        type: 'waf',
        label: 'MQTT Sentinel GATEWAY',
        subLabel: 'Signal Token Filter',
        ipAddress: '10.150.1.1',
        port: 443,
        status: 'secure',
        integrity: 100,
        connections: ['api-8'],
        description: 'Monitors smart network streams, instantly dropping unrecognized client device IDs or outdated system configurations.',
        position: { x: 35, y: 35 },
        securityRules: [
          { id: 'w13', name: 'Device Out-of-Spec drop', enabled: true, description: 'Blocks commands sending variables exceeding standard household ranges' }
        ]
      },
      {
        id: 'api-8',
        type: 'api',
        label: 'IOT TELEMETRY DECODER',
        subLabel: 'Rule Processor & Dispatcher',
        ipAddress: '10.150.5.4',
        port: 9005,
        status: 'secure',
        integrity: 94,
        connections: ['db-8'],
        description: 'Resolves home logic loops, registers unlock codes, and queues SMS/push emergency alarm warnings.',
        position: { x: 60, y: 35 },
        securityRules: [
          { id: 'a11', name: 'Force MFA Lockout checks', enabled: true, description: 'Requires secondary authorization codes before unlocking smart doorways' }
        ]
      },
      {
        id: 'db-8',
        type: 'db',
        label: 'HOME EVENT DB',
        subLabel: 'SQLite Ring-Buffer',
        ipAddress: '10.150.10.8',
        port: 5432,
        status: 'secure',
        integrity: 97,
        connections: [],
        description: 'Encrypted persistent database logging chronological system states, credential adjustments, and system events.',
        position: { x: 85, y: 35 },
        securityRules: [
          { id: 'd11', name: 'Tamper-Proof Audit Vault', enabled: true, description: 'Protects system files by writing log rows recursively with unique crypto-keys' }
        ]
      }
    ]
  }
];

export const RBAC_SYSTEM_DATA: Record<string, { subjects: RBACEntity[], attributes: RBACAttribute[] }> = {
  HEALTH: {
    subjects: [
      { id: 'sub-1', label: 'DOCTOR', detail: 'Primary Care Physician', classification: 'Restricted', sensitivity: 'High', reasoning: 'Accesses Protected Health Information (PHI) under HIPAA.' },
      { id: 'sub-2', label: 'BILLING CLERK', detail: 'Hospital Accountant', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'Processes financial data and limited patient identifiers.' },
      { id: 'sub-3', label: 'CONSULTANT', detail: 'Visiting External Practitioner', classification: 'Restricted', sensitivity: 'High', reasoning: 'Handles specific patient cases with strict purpose-bound mandates.' }
    ],
    attributes: [
      { id: 'attr-1', label: 'MEDICAL HISTORY', category: 'CLINICAL RECORDS', status: 'unprocessed', policy_rule: '', classification: 'Restricted', sensitivity: 'Critical', reasoning: 'GDPR/HIPAA protected clinical history.' },
      { id: 'attr-2', label: 'BILLING STATEMENT', category: 'HOSPITAL ACCOUNTING', status: 'unprocessed', policy_rule: '', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'Financial records containing PII.' },
      { id: 'attr-3', label: 'HR RECORDS', category: 'PRIVATE ADMINISTRATION', status: 'unprocessed', policy_rule: '', classification: 'Highly Confidential', sensitivity: 'High', reasoning: 'Employee sensitive data and contracts.' },
      { id: 'attr-4', label: 'PRESCRIPTIONS', category: 'CLINICAL RECORDS', status: 'unprocessed', policy_rule: '', classification: 'Restricted', sensitivity: 'High', reasoning: 'Controlled substance records and medical orders.' }
    ]
  },
  FINANCE: {
    subjects: [
      { id: 'sub-1', label: 'ANALYST', detail: 'Financial Data Scout', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'Market data analysis and internal reporting.' },
      { id: 'sub-2', label: 'AUDITOR', detail: 'Compliance Officer', classification: 'Highly Confidential', sensitivity: 'High', reasoning: 'Regulatory oversight across all financial assets.' },
      { id: 'sub-3', label: 'MANAGER', detail: 'Division Head', classification: 'Restricted', sensitivity: 'High', reasoning: 'Strategic planning with sensitive financial forecasting.' }
    ],
    attributes: [
      { id: 'attr-1', label: 'TRANSACTION LOGS', category: 'FINANCIAL DATA', status: 'unprocessed', policy_rule: '', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'PCI-DSS protected transaction metadata.' },
      { id: 'attr-2', label: 'INVESTMENT PORTFOLIO', category: 'PRIVATE ASSETS', status: 'unprocessed', policy_rule: '', classification: 'Restricted', sensitivity: 'High', reasoning: 'Client-specific asset holdings and valuations.' },
      { id: 'attr-3', label: 'TAX RECORDS', category: 'TAX ADMINISTRATION', status: 'unprocessed', policy_rule: '', classification: 'Highly Confidential', sensitivity: 'High', reasoning: 'Statutory compliance and earnings data.' },
      { id: 'attr-4', label: 'BANK STATEMENTS', category: 'FINANCIAL DATA', status: 'unprocessed', policy_rule: '', classification: 'Restricted', sensitivity: 'High', reasoning: 'Direct liquid asset records with high fraud risk.' }
    ]
  },
  COLLEGE_ERP: {
    subjects: [
      { id: 'sub-1', label: 'PROFESSOR', detail: 'Course Instructor', classification: 'Internal', sensitivity: 'Medium', reasoning: 'Managing academic progress and course materials.' },
      { id: 'sub-2', label: 'REGISTRAR', detail: 'Student Administrative Staff', classification: 'Confidential', sensitivity: 'High', reasoning: 'Legal custodian of student permanent records (FERPA).' },
      { id: 'sub-3', label: 'STUDENT', detail: 'Enrolled Learner', classification: 'Public/Internal', sensitivity: 'Low', reasoning: 'Self-service access to individual academic data.' }
    ],
    attributes: [
      { id: 'attr-1', label: 'GRADING MATRIX', category: 'ACADEMIC RECORDS', status: 'unprocessed', policy_rule: '', classification: 'Restricted', sensitivity: 'High', reasoning: 'FERPA protected academic performance metrics.' },
      { id: 'attr-2', label: 'STUDENT CONTRACT', category: 'ENROLLMENT', status: 'unprocessed', policy_rule: '', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'PII and contractual enrollment terms.' },
      { id: 'attr-3', label: 'LIBRARY FINES', category: 'FINANCIAL', status: 'unprocessed', policy_rule: '', classification: 'Internal', sensitivity: 'Low', reasoning: 'Operational financial records.' },
      { id: 'attr-4', label: 'CLASS SCHEDULE', category: 'ACADEMIC RECORDS', status: 'unprocessed', policy_rule: '', classification: 'Public', sensitivity: 'Low', reasoning: 'Course listing and time slots.' }
    ]
  },
  ECOMMERCE: {
    subjects: [
      { id: 'sub-1', label: 'CUSTOMER', detail: 'Registered User', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'PII for order fulfillment and account management.' },
      { id: 'sub-2', label: 'CASHIER', detail: 'Store Transaction Worker', classification: 'Internal', sensitivity: 'Low', reasoning: 'Point-of-sale operational authority.' },
      { id: 'sub-3', label: 'DISPATCHER', detail: 'Logistics Courier', classification: 'Internal', sensitivity: 'Medium', reasoning: 'Handling delivery addresses and shipping metadata.' }
    ],
    attributes: [
      { id: 'attr-1', label: 'SHOPPING CART', category: 'CLIENT DATA', status: 'unprocessed', policy_rule: '', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'Personalized user commerce intent.' },
      { id: 'attr-2', label: 'DISCOUNT SCHEDULER', category: 'BUSINESS LOGIC', status: 'unprocessed', policy_rule: '', classification: 'Restricted', sensitivity: 'High', reasoning: 'Proprietary business pricing logic.' },
      { id: 'attr-3', label: 'ORDER RECEIPT', category: 'FINANCIAL', status: 'unprocessed', policy_rule: '', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'Proof of purchase and tax metadata.' },
      { id: 'attr-4', label: 'INVENTORY LEVELS', category: 'BUSINESS LOGIC', status: 'unprocessed', policy_rule: '', classification: 'Internal', sensitivity: 'Low', reasoning: 'Warehouse stock records.' }
    ]
  },
  LOGISTICS: {
    subjects: [
      { id: 'sub-1', label: 'DRIVER', detail: 'Vehicle Operator', classification: 'Internal', sensitivity: 'Low', reasoning: 'Mobile operational role with fleet connectivity.' },
      { id: 'sub-2', label: 'DISPATCHER', detail: 'Fleet Manager', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'Oversight of entire logistics network flow.' },
      { id: 'sub-3', label: 'CLIENT', detail: 'Cargo Recipient', classification: 'Internal', sensitivity: 'Low', reasoning: 'End-user tracking for specific shipments.' }
    ],
    attributes: [
      { id: 'attr-1', label: 'LOCATION COORDINATES', category: 'TELEMETRY', status: 'unprocessed', policy_rule: '', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'Real-time vehicle position and traffic data.' },
      { id: 'attr-2', label: 'CARGO STATUS', category: 'SHIPPING', status: 'unprocessed', policy_rule: '', classification: 'Internal', sensitivity: 'Medium', reasoning: 'Transit integrity and delivery progress.' },
      { id: 'attr-3', label: 'TRANSIT TIME', category: 'EFFICIENCY', status: 'unprocessed', policy_rule: '', classification: 'Public/Internal', sensitivity: 'Low', reasoning: 'Performance metrics and ETA calculations.' },
      { id: 'attr-4', label: 'FUEL LOGS', category: 'TELEMETRY', status: 'unprocessed', policy_rule: '', classification: 'Internal', sensitivity: 'Low', reasoning: 'Fleet management expenses.' }
    ]
  },
  LIBRARY: {
    subjects: [
      { id: 'sub-1', label: 'PATRON', detail: 'Library Member', classification: 'Internal', sensitivity: 'Low', reasoning: 'Regular access to circulation services.' },
      { id: 'sub-2', label: 'ARCHIVIST', detail: 'Collection Caretaker', classification: 'Confidential', sensitivity: 'Medium', reasoning: 'Supervision of restricted historical archives.' },
      { id: 'sub-3', label: 'GUEST', detail: 'Unauthenticated Visitor', classification: 'Public', sensitivity: 'Minimal', reasoning: 'Browsing public datasets.' }
    ],
    attributes: [
      { id: 'attr-1', label: 'BOOK METADATA', category: 'RECORDS', status: 'unprocessed', policy_rule: '', classification: 'Public', sensitivity: 'Low', reasoning: 'General bibliographic records.' },
      { id: 'attr-2', label: 'AUTHOR INDICES', category: 'CATALOG', status: 'unprocessed', policy_rule: '', classification: 'Public', sensitivity: 'Low', reasoning: 'Public catalog information.' },
      { id: 'attr-3', label: 'LOAN HISTORY', category: 'RECORDS', status: 'unprocessed', policy_rule: '', classification: 'Confidential', sensitivity: 'High', reasoning: 'Patron privacy protected circulation data.' },
      { id: 'attr-4', label: 'SHELF MAPPINGS', category: 'PHYSICAL ASSETS', status: 'unprocessed', policy_rule: '', classification: 'Public', sensitivity: 'Low', reasoning: 'Internal structural maps for public use.' }
    ]
  }
};

export const MOCK_SAVED_BLUEPRINTS: SavedBlueprint[] = [
  {
    id: 'sb-1',
    systemTitle: 'HEALTH PORTAL & EHR',
    systemType: 'HEALTH',
    nodesCount: 4,
    timestamp: '2026-05-21 14:15',
    threatScore: 12,
    status: 'VERIFIED'
  },
  {
    id: 'sb-2',
    systemTitle: 'FINANCE BACKEND',
    systemType: 'FINANCE',
    nodesCount: 4,
    timestamp: '2026-05-22 01:44',
    threatScore: 8,
    status: 'VERIFIED'
  },
  {
    id: 'sb-3',
    systemTitle: 'ECOMMERCE TRANSACTOR',
    systemType: 'ECOMMERCE',
    nodesCount: 4,
    timestamp: '2026-05-20 09:12',
    threatScore: 20,
    status: 'STAGED'
  },
  {
    id: 'sb-4',
    systemTitle: 'CAMPUS RECORD ERP',
    systemType: 'COLLEGE_ERP',
    nodesCount: 4,
    timestamp: '2026-05-18 10:30',
    threatScore: 24,
    status: 'WARNING'
  }
];

export const THREAT_SIMULATIONS: ThreatSimulation[] = [
  {
    id: 'sim-ddos',
    name: 'Distributed Denial of Service (DDoS)',
    severity: 'CRITICAL',
    description: 'Floods the target with high-velocity web payloads from zombie botnets to deplete resources.',
    targetNodeType: 'client',
    logMessages: [
      '[PROBE] High traffic count detected: 14500 requests/sec',
      '[ALERT] Ingress queue overflowing. Thread exhaustion imminent',
      '[DEFEND] Shield Ingress WAF activates Aggressive Rate Limiting',
      '[DEFEND] Suspicious CIDR ranges identified and null-routed',
      '[STATUS] System protected. Normal client service integrity restored!'
    ]
  },
  {
    id: 'sim-sqli',
    name: 'SQL Injection Vectors (SQLi)',
    severity: 'HIGH',
    description: 'Injects escaped SQL tags on vulnerable inputs to search, extract, or corrupt system tables.',
    targetNodeType: 'waf',
    logMessages: [
      "[PROBE] Inbound payload identified with pattern URL ENCODED ' OR 1=1 --",
      "[ALERT] Malicious SQL command attempted in user login parameter",
      "[DEFEND] WAF regex engine matches standard SQL signature ruleset",
      "[DEFEND] IP address isolated. SQL payload actively discarded",
      "[STATUS] No access given to database layer. Security integrity high!"
    ]
  },
  {
    id: 'sim-mitm',
    name: 'Man-In-The-Middle Probe (MitM)',
    severity: 'MEDIUM',
    description: 'Sniffs communication lines between server hops to intercept plain-text auth headers.',
    targetNodeType: 'api',
    logMessages: [
      '[PROBE] Internal network gateway intercepts certificate validation request',
      '[ALERT] Untrusted self-signed certificate presented by intermediate proxy',
      '[DEFEND] Gateway strictly demands verified mTLS handshake certificates',
      '[DEFEND] Certificate validation fails. API drops handshake request instantly',
      '[STATUS] Session terminated safely. Integrity is fully secured.'
    ]
  },
  {
    id: 'sim-tamper',
    name: 'Database Tamper & Compromised Key',
    severity: 'CRITICAL',
    description: 'Attempts to read or modify fields in high-value database tables directly.',
    targetNodeType: 'db',
    logMessages: [
      '[PROBE] Direct SQL connection attempted on DB Port 5432 bypass',
      '[ALERT] Unauthorized IP address: 185.11.4.15 attempting read operations',
      '[DEFEND] PostgreSQL Firewall blocks TCP packet based on Source-IP constraints',
      '[DEFEND] Hardware Security Module (HSM) disables row decryption keys',
      '[STATUS] Database locked down successfully. Decryption attempts blocked.'
    ]
  }
];
