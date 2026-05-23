import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Bulletproof fallback architecture topology generator
function getFallbackTopology(systemType?: string, customDescription?: string) {
  const query = (customDescription || systemType || "HEALTH").toUpperCase();
  
  if (query.includes("HEALTH") || query.includes("CLINIC") || query.includes("MEDICAL") || query.includes("HOSPITAL") || query.includes("PATIENT")) {
    return {
      nodes: [
        {
          id: "cl-dyn-health",
          type: "client",
          label: "HEALTH SYSTEM WEB PORTAL",
          tech: "React SPA / Tailwind CSS",
          x: 18,
          y: 35,
          description: "Patient portal secure remote client utilizing cryptographic auth headers and full XSS mitigation protocols.",
          port: 443,
          ipAddress: "198.51.100.42",
          integrity: 100,
          securityRules: [
            { id: "hr-1", name: "Strict CSP Header", enabled: true, description: "Mitigates cross-site injection vectors." },
            { id: "hr-2", name: "Clickjacking Shield", enabled: true, description: "X-Frame-Options set to DENY to prevent frame-embedding hijacking." }
          ]
        },
        {
          id: "waf-dyn-health",
          type: "waf",
          label: "REGULATORY WAF GATEWAY",
          tech: "Cloudflare Enterprise Gate",
          x: 36,
          y: 65,
          description: "Web Application Firewall restricting connections to clinical network blocks and sanitizing payload escape characters.",
          port: 443,
          ipAddress: "10.0.0.1",
          integrity: 100,
          securityRules: [
            { id: "wr-1", name: "SQL Injection Shield", enabled: true, description: "Inspects incoming URI vectors for escape-character SQL snippets." },
            { id: "wr-2", name: "IP Whitelist Regulator", enabled: true, description: "Blocks connections originating from unauthorized regions outside whitelist." }
          ]
        },
        {
          id: "api-dyn-health",
          type: "api",
          label: "HEALTH SYSTEM CORE SERVICE",
          tech: "Node.js / Express Core v5",
          x: 54,
          y: 35,
          description: "HIPAA-hardened application controller managing medical prescription queues and directory route lookups.",
          port: 8080,
          ipAddress: "10.0.2.14",
          integrity: 100,
          securityRules: [
            { id: "ar-1", name: "mTLS Handshake Regulation", enabled: true, description: "Requires database requests to use mutual TLS certificate exchange." },
            { id: "ar-2", name: "OAuth Scopes Validator", enabled: true, description: "Restricts clinical resource payloads to authenticated doctor tokens." }
          ]
        },
        {
          id: "db-dyn-health",
          type: "db",
          label: "HEALTH SYSTEM SECURE DATABASE",
          tech: "PostgreSQL Encryption Eng",
          x: 72,
          y: 65,
          description: "Immutable ledger tracking clinical activity log records and encrypted medical database columns.",
          port: 5432,
          ipAddress: "10.0.8.99",
          integrity: 100,
          securityRules: [
            { id: "dr-1", name: "At-Rest Cryptographic Shield", enabled: true, description: "Uses FIPS 140-2 validated hardware security modules for encryption." },
            { id: "dr-2", name: "Immutable Access Audit Logs", enabled: true, description: "Enforces non-repudiation logging for all health record queries." }
          ]
        },
        {
          id: "auth-dyn-health",
          type: "auth",
          label: "OIDC AUTHORIZATION COMPLIANCE",
          tech: "Auth0 identity & SDK Provider",
          x: 88,
          y: 35,
          description: "External encrypted identity verification and token authorization.",
          port: 443,
          ipAddress: "external-api.auth0.com",
          integrity: 100,
          securityRules: [
            { id: "aur-1", name: "OIDC Token Guard", enabled: true, description: "Validates digital signatures of incoming identity tokens." },
            { id: "aur-2", name: "Multi-Factor Verification", enabled: true, description: "Mandates secondary credential verification for admin clinical access." }
          ]
        }
      ],
      edges: [
        { source: "cl-dyn-health", target: "waf-dyn-health", protocol: "HTTPS (TLS v1.3)", status: "secure" },
        { source: "waf-dyn-health", target: "api-dyn-health", protocol: "gRPC & TLSv1.3", status: "secure" },
        { source: "api-dyn-health", target: "db-dyn-health", protocol: "PostgreSQL Secure Socket", status: "secure" },
        { source: "api-dyn-health", target: "auth-dyn-health", protocol: "OIDC Secure HTTPS", status: "secure" }
      ]
    };
  }

  if (query.includes("FINANCE") || query.includes("BANK") || query.includes("PAY") || query.includes("MONEY") || query.includes("TRANS") || query.includes("LEDGER")) {
    return {
      nodes: [
        {
          id: "cl-dyn-finance",
          type: "client",
          label: "MOBILE APPS BRIDGE",
          tech: "iOS / Android SSL-Pinned Client",
          x: 18,
          y: 35,
          description: "Pinned SSL endpoint interface for native smartphone applications with biometric secondary checks.",
          port: 443,
          ipAddress: "172.16.8.99",
          integrity: 100,
          securityRules: [
            { id: "fr-1", name: "SSL Certificate Pinning", enabled: true, description: "Locks expected terminal identity keys, preventing proxy sniffing." },
            { id: "fr-2", name: "Biometric Session Hash", enabled: true, description: "Authenticates tokens using secure enclave certificates on-device." }
          ]
        },
        {
          id: "waf-dyn-finance",
          type: "waf",
          label: "ZERO TRUST PROXY GATE",
          tech: "OAuth Gate & WAF Guard",
          x: 36,
          y: 65,
          description: "Advanced reverse security proxy applying real-time threat intelligence and fraud risk scoring to all inbound operations.",
          port: 443,
          ipAddress: "10.40.1.5",
          integrity: 100,
          securityRules: [
            { id: "fwr-1", name: "Real-time Anti-DDoS", enabled: true, description: "Limits packet velocity on API namespaces automatically." },
            { id: "fwr-2", name: "Anomaly Rate-Limiting", enabled: true, description: "Identifies automated scraping script sequences and rejects connections." }
          ]
        },
        {
          id: "api-dyn-finance",
          type: "api",
          label: "HIGH-FREQUENCY LEDGER API",
          tech: "Java / Spring Boot Core",
          x: 54,
          y: 35,
          description: "Secure double-ledger microservice with end-to-end payload signature hashing and strict token authorization bounds.",
          port: 8080,
          ipAddress: "10.40.4.12",
          integrity: 100,
          securityRules: [
            { id: "far-1", name: "Encrypted Payload Integrity", enabled: true, description: "Rejects request entities containing invalid payload checksum hashes." },
            { id: "far-2", name: "Double-Verification Gate", enabled: true, description: "Requires dual supervisor tokens to process assets over designated limits." }
          ]
        },
        {
          id: "db-dyn-finance",
          type: "db",
          label: "TRANSACTION DB COCKROACHDB",
          tech: "Distributed Cockroach Cluster",
          x: 72,
          y: 65,
          description: "Distributed highly consistent ledger database writing crypto-checksummed records across segregated physical zones.",
          port: 26257,
          ipAddress: "10.40.12.80",
          integrity: 100,
          securityRules: [
            { id: "fdr-1", name: "Ledger Chain Seal", enabled: true, description: "Links row metadata cryptographically to ensure absolute non-repudiation." },
            { id: "fdr-2", name: "Encrypted Storage Blocks", enabled: true, description: "Hosts system tables strictly within AES-256 encrypted hardware drivers." }
          ]
        },
        {
          id: "auth-dyn-finance",
          type: "auth",
          label: "SAML IDENTITY CREDENTIALS",
          tech: "PingFederate Server Cluster",
          x: 88,
          y: 35,
          description: "Enterprise master directories certifying wealth manager identities and handling administrative credentials.",
          port: 8443,
          ipAddress: "10.40.100.2",
          integrity: 100,
          securityRules: [
            { id: "faur-1", name: "Hardware Security Token Validation", enabled: true, description: "Validates hardware key challenge responses prior to authentication." },
            { id: "faur-2", name: "Strict RBAC Session Life", enabled: true, description: "Caps maximum token lifetime at 15 minutes with rolling refresh limits." }
          ]
        }
      ],
      edges: [
        { source: "cl-dyn-finance", target: "waf-dyn-finance", protocol: "HTTPS (TLS v1.3)", status: "secure" },
        { source: "waf-dyn-finance", target: "api-dyn-finance", protocol: "gRPC & TLSv1.3", status: "secure" },
        { source: "api-dyn-finance", target: "db-dyn-finance", protocol: "Secure Cockroach Socket", status: "secure" },
        { source: "api-dyn-finance", target: "auth-dyn-finance", protocol: "SAML Secure API Connection", status: "secure" }
      ]
    };
  }

  // General default fallback dynamic segment (E-commerce / Generic Application)
  const cleanLabel = customDescription ? customDescription.substring(0, 30).toUpperCase() : (systemType || "DYNAMIC INFRASTRUCTURE");
  return {
    nodes: [
      {
        id: "cl-dyn-gen",
        type: "client",
        label: `${cleanLabel} FRONTEND`,
        tech: "React Client / CSS-Tailwind",
        x: 18,
        y: 40,
        description: "Public user interface serving client assets securely over HTTPS.",
        port: 443,
        ipAddress: "192.0.2.22",
        integrity: 100,
        securityRules: [
          { id: "gr-1", name: "X-Content-Type Guard", enabled: true, description: "Prevents browser-side stylesheet MIME sniffing attacks." },
          { id: "gr-2", name: "Secure Origin Policy", enabled: true, description: "Rejects assets served across unvalidated transport handshakes." }
        ]
      },
      {
        id: "waf-dyn-gen",
        type: "waf",
        label: `${cleanLabel} DEFENSE PROXY`,
        tech: "HAProxy Edge / Nginx Reverse",
        x: 40,
        y: 65,
        description: "Application ingress proxy enforcing secure TLS terminators and rejecting foreign IP spam.",
        port: 443,
        ipAddress: "10.150.1.3",
        integrity: 100,
        securityRules: [
          { id: "gwr-1", name: "Rate Regulator", enabled: true, description: "Caps clients to a maximum of 60 operations per second." },
          { id: "gwr-2", name: "URI Malformation Guard", enabled: true, description: "Sanitizes bad paths containing suspicious traversal vectors." }
        ]
      },
      {
        id: "api-dyn-gen",
        type: "api",
        label: `${cleanLabel} CORE APP`,
        tech: "FastAPI / Python Web Engine",
        x: 58,
        y: 35,
        description: "Central processing core handling enterprise domain logic safely behind the edge gateway.",
        port: 8000,
        ipAddress: "10.150.2.19",
        integrity: 100,
        securityRules: [
          { id: "gar-1", name: "RSA Signature Assurance", enabled: true, description: "Requires upstream payloads to carry authenticated cryptographic checksum hashes." },
          { id: "gar-2", name: "Access Block Limiter", enabled: true, description: "Terminates execution if a microservice exceeds allocated processing limits." }
        ]
      },
      {
        id: "db-dyn-gen",
        type: "db",
        label: `${cleanLabel} STORAGE LEDGER`,
        tech: "PostgreSql Cluster / TLS Master",
        x: 82,
        y: 55,
        description: "Highly redundant database instance managing record records with secure client identification requirements.",
        port: 5432,
        ipAddress: "10.150.8.44",
        integrity: 100,
        securityRules: [
          { id: "gdr-1", name: "mTLS Certificate Enforcer", enabled: true, description: "Restricts all database commands strictly to verified microservice hosts." },
          { id: "gdr-2", name: "Continuous Snapshot Seal", enabled: true, description: "Saves encrypted database transaction snapshots to cold storage." }
        ]
      }
    ],
    edges: [
      { source: "cl-dyn-gen", target: "waf-dyn-gen", protocol: "HTTPS (TLS v1.3)", status: "secure" },
      { source: "waf-dyn-gen", target: "api-dyn-gen", protocol: "Encrypted Internal gRPC", status: "secure" },
      { source: "api-dyn-gen", target: "db-dyn-gen", protocol: "Secure Relational Socket", status: "secure" }
    ]
  };
}

// Bulletproof fallback evaluation check generator
function getEvaluateFallback(systemCategory?: string, subject?: string, attributes?: string[]) {
  const queryCategory = (systemCategory || "HEALTH").toUpperCase();
  const querySubject = (subject || "DOCTOR").toUpperCase();
  const attrList = attributes && attributes.length > 0 ? attributes : ["Records", "Logs", "System"];
  
  const isHealth = queryCategory.includes("HEALTH") || queryCategory.includes("MED") || queryCategory.includes("CLINIC");
  const isFinance = queryCategory.includes("FINANCE") || queryCategory.includes("BANK");
  const isERP = queryCategory.includes("ERP") || queryCategory.includes("COLLEGE") || queryCategory.includes("UNIVERSITY");
  const isEcommerce = queryCategory.includes("ECOMMERCE") || queryCategory.includes("STORE") || queryCategory.includes("SHOP");
  const isLogistics = queryCategory.includes("LOGISTICS") || queryCategory.includes("FLEET") || queryCategory.includes("SHIPPING");
  const isLibrary = queryCategory.includes("LIBRARY") || queryCategory.includes("ARCHIVE");

  const results = attrList.map((attr) => {
    const lowerAttr = attr.toLowerCase();
    const lowerSubject = querySubject.toLowerCase();
    
    let status = "blocked";
    let ruleText = `Sec-Policy: Access Denied. Role "${querySubject}" lacks clearance for resource "${attr}".`;
    
    if (isHealth) {
      const isClinician = lowerSubject.includes("doc") || lowerSubject.includes("consultant") || lowerSubject.includes("staff");
      const isClerk = lowerSubject.includes("clerk") || lowerSubject.includes("billing");
      const isClinicalRecord = lowerAttr.includes("record") || lowerAttr.includes("history") || lowerAttr.includes("prescription");
      const isBilling = lowerAttr.includes("billing") || lowerAttr.includes("accounting");

      if (isClinician && isClinicalRecord) {
        status = "success";
        ruleText = "Clinician clearance verified. Patient record access authorized.";
      } else if (isClerk && isBilling) {
        status = "success";
        ruleText = "Financial clerk authorized for hospital billing access.";
      }
    } else if (isFinance) {
      const isAdvisor = lowerSubject.includes("analyst") || lowerSubject.includes("manager") || lowerSubject.includes("fiduciary");
      const isAuditor = lowerSubject.includes("auditor");
      const isInternal = lowerAttr.includes("log") || lowerAttr.includes("tax") || lowerAttr.includes("audit");

      if (isAdvisor || isAuditor) {
        status = "success";
        ruleText = "Fiduciary credentials verified. Asset review permitted.";
      }
    } else if (isERP) {
      const isProf = lowerSubject.includes("professor") || lowerSubject.includes("instructor");
      const isRegistrar = lowerSubject.includes("registrar") || lowerSubject.includes("admin");
      const isStudent = lowerSubject.includes("student");

      const isAcademic = lowerAttr.includes("grading") || lowerAttr.includes("schedule");
      const isContract = lowerAttr.includes("contract") || lowerAttr.includes("enrollment");
      const isFines = lowerAttr.includes("fine") || lowerAttr.includes("finance");

      if (isProf) {
        if (isAcademic || isFines) { status = "success"; ruleText = "Academic instructor approved for grading and reference library access."; }
      } else if (isRegistrar) {
        status = "success";
        ruleText = "Registrar administrative oversight approved for all ERP departments.";
      } else if (isStudent) {
        if (lowerAttr.includes("schedule") || isContract || isFines) {
          status = "success";
          ruleText = "Student authenticated. Personal record and academic schedule read-only access granted.";
        }
      }
    } else if (isEcommerce) {
      const isCustomer = lowerSubject.includes("customer");
      const isStaff = lowerSubject.includes("cashier") || lowerSubject.includes("dispatcher");
      if (isCustomer && (lowerAttr.includes("cart") || lowerAttr.includes("receipt"))) {
        status = "success";
        ruleText = "Customer verified. Personal shopping context authorized.";
      } else if (isStaff) {
        status = "success";
        ruleText = "Retail operations worker authorized for transactional resources.";
      }
    } else if (isLogistics) {
      const isOperational = lowerSubject.includes("driver") || lowerSubject.includes("dispatcher");
      if (isOperational) {
        status = "success";
        ruleText = "Logistics fleet personnel authorized for telemetry and cargo status.";
      }
    } else if (isLibrary) {
      const isLibrarian = lowerSubject.includes("archivist");
      if (isLibrarian || lowerAttr.includes("metadata") || lowerAttr.includes("author")) {
        status = "success";
        ruleText = "Public domain or librarian clearance verified.";
      }
    }

    return { attribute: attr, status, policy_rule: ruleText };
  });
  
  return { results };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Architecture Generation
  app.post("/api/generate-architecture", async (req, res) => {
    try {
      const { systemType, customDescription } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = customDescription
        ? `Generate a high-level security architecture JSON for a custom system defined as: "${customDescription}".`
        : `Generate a high-level security architecture JSON for a standard ${systemType} system.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${prompt}
Include exactly 5-6 core nodes (such as client/Public UI, waf/WAF, api/Core Service, db/Secure DB, cache/Redis Cache, or auth/Auth Server) that represent this system's data-flow pipeline.
For each node, map its properties carefully:
- id: e.g., "node-1", "node-2"
- type: MUST be exactly one of: 'client' | 'waf' | 'api' | 'db' | 'cache' | 'auth'
- label: elegant uppercase name (e.g., "SECURE CLINICAL RECORD CORE")
- tech: technological stack used (e.g., "NodeJS / Express")
- x: a relative horizontal percentage integer, between 10 and 90 so it positions nicely on a graph. Choose logical flow coordinates (e.g., UI on leftmost x, WAF, API in middle, DB on rightmost x).
- y: a relative vertical percentage integer, between 15 and 85.
- description: concise, highly specific technical security summary of this node.
- port: standard service port integer (e.g., 443, 80, 8080, 5432)
- ipAddress: standard internal IP address pattern (e.g., '10.0.1.25')
- integrity: 100
- securityRules: 2 tailored security rule presets for this node. Each rule has a unique id, name, standard enabled: true, and a descriptive role.

Also generate exactly 5-6 edges representing secure encrypted connection arrows between these nodes. Each edge needs:
- source: id of the source node
- target: id of the target node
- protocol: secure protocol label (e.g., 'HTTPS (TLS v1.3)', 'gRPC / TLS', 'IPSEC VPN')
- status: "secure" or "warn" (all should be "secure" initially to verify compliance)
`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, description: "Must be: 'client' | 'waf' | 'api' | 'db' | 'cache' | 'auth'" },
                    label: { type: Type.STRING },
                    tech: { type: Type.STRING },
                    x: { type: Type.NUMBER, description: "x percentage position 10 to 90" },
                    y: { type: Type.NUMBER, description: "y percentage position 15 to 85" },
                    description: { type: Type.STRING },
                    port: { type: Type.INTEGER },
                    ipAddress: { type: Type.STRING },
                    integrity: { type: Type.INTEGER },
                    securityRules: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          enabled: { type: Type.BOOLEAN },
                          description: { type: Type.STRING }
                        },
                        required: ["id", "name", "enabled", "description"]
                      }
                    }
                  },
                  required: ["id", "type", "label", "tech", "x", "y", "description", "port", "ipAddress", "integrity", "securityRules"]
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                    protocol: { type: Type.STRING },
                    status: { type: Type.STRING, description: "Must be 'secure' or 'warn'" }
                  },
                  required: ["source", "target", "protocol", "status"]
                }
              }
            },
            required: ["nodes", "edges"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.warn("Gemini Architecture generation failed:", error?.message || error);
      const { systemType, customDescription } = req.body;
      const fallbackData = getFallbackTopology(systemType, customDescription);
      res.json(fallbackData);
    }
  });

  // API Route for Dynamic Core Service Policy Check via Gemini 3.5-flash
  app.post("/api/evaluate-core-service", async (req, res) => {
    try {
      const { systemCategory, subject, attributes } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `Act as a Zero Trust Policy Architect. 
      Evaluate Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) for a "${systemCategory}" ecosystem.
      
      SUBJECT: ${subject}
      RESOURCES TO EVALUATE: [${(attributes || []).join(", ")}]
      
      TASK: Determine if the subject should be 'Permitted' (success) or 'Denied' (blocked) for each resource based on least-privilege principles and standard enterprise domain logic.
      
      RULES FOR YOUR EVALUATION:
      1. Be realistic: A Professor in a College ERP should have access to 'Grading Matrix' and 'Class Schedule', but a Student should be DENIED 'Grading Matrix'.
      2. A Registrar should have high clearance.
      3. In Logistics, a Driver needs 'Cargo Status' but maybe not 'Fuel Logs' (if that is for fleet managers).
      4. Avoid blocking everything by default; enable logical business flows.
      
      Return each attribute in JSON format with key "results" which is an array of objects.
      Each object must have:
      - "attribute": Exactly the string provided.
      - "status": "success" (permitted) or "blocked" (denied).
      - "policy_rule": A professional, technical justification (e.g. 'Standard RBAC permit for academic role on course resources.').`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    attribute: { type: Type.STRING },
                    status: { type: Type.STRING, description: "Must be 'success' or 'blocked'" },
                    policy_rule: { type: Type.STRING }
                  },
                  required: ["attribute", "status", "policy_rule"]
                }
              }
            },
            required: ["results"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.warn("Gemini Evaluation failed, triggering heuristic fallback:", error?.message || error);
      const { systemCategory, subject, attributes } = req.body;
      const fallbackData = getEvaluateFallback(systemCategory, subject, attributes);
      res.json(fallbackData);
    }
  });

  // API Route for generating a new service node for the topology
  app.post("/api/generate-service", async (req, res) => {
    const { systemCategory, serviceDescription } = req.body;
    const sd = (serviceDescription || "").toLowerCase();
    
    // HEURISTIC: Always allow common architectural components even if Gemini is unsure or offline
    const commonServices = [
      { key: 'payment', type: 'api', label: 'PAYMENT GATEWAY', tech: 'Stripe / PayPal API', connections: ['api', 'db'] },
      { key: 'gateway', type: 'waf', label: 'API GATEWAY', tech: 'Kong / Apigee', connections: ['api', 'client'] },
      { key: 'mail', type: 'api', label: 'EMAIL SERVICE', tech: 'SendGrid / SMTP', connections: ['api'] },
      { key: 'redis', type: 'cache', label: 'REDIS CLUSTER', tech: 'Redis OSS v7', connections: ['api'] },
      { key: 'sql', type: 'db', label: 'SQL INSTANCE', tech: 'PostgreSQL / MySQL', connections: ['api'] },
      { key: 'auth', type: 'auth', label: 'OIDC IDENTITY', tech: 'Keycloak / Auth0', connections: ['api', 'client'] },
      { key: 'bucket', type: 'db', label: 'OBJECT STORAGE', tech: 'AWS S3 / GCS', connections: ['api'] },
      { key: 'logging', type: 'api', label: 'ELK STACK', tech: 'Elasticsearch / Kibana', connections: ['api', 'waf'] },
    ];

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `Act as a Cloud Security Architect. 
      A user wants to add a new service/component to a "${systemCategory}" enterprise architecture.
      User request: "${serviceDescription}"
      
      TASK:
      1. Validate if this service is logically relevant to the "${systemCategory}" category. (Example: a "Payment Gateway" is highly relevant to Finance/Ecommerce/Health billing).
      2. If invalid (e.g., "cricket", "pizza", or generic nonsense), return valid: false.
      3. If valid, generate a single secure architectural node (client, waf, api, db, cache, or auth).
      4. Suggest 1-2 connection types from: ["client", "waf", "api", "db", "cache", "auth"] that this new node should connect to.
      
      Return JSON:
      {
        "valid": boolean,
        "errorReason": "Technical reasoning if invalid",
        "suggestedConnections": ["db", "api"],
        "node": {
          "type": "client | waf | api | db | cache | auth",
          "label": "UPPERCASE NAME",
          "subLabel": "Short tech stack description",
          "description": "Security-focused technical summary",
          "port": number,
          "ipAddress": "10.x.x.x",
          "securityRules": [
            { "name": "Name", "description": "Security rule description" }
          ],
          "classification": "One of: Public, Internal, Confidential, Restricted",
          "sensitivity": "One of: Minimal, Low, Medium, High, Critical",
          "reasoning": "Compliance reasoning"
        }
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              valid: { type: Type.BOOLEAN },
              errorReason: { type: Type.STRING },
              suggestedConnections: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              node: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  label: { type: Type.STRING },
                  subLabel: { type: Type.STRING },
                  description: { type: Type.STRING },
                  port: { type: Type.INTEGER },
                  ipAddress: { type: Type.STRING },
                  securityRules: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING }
                      },
                      required: ["name", "description"]
                    }
                  },
                  classification: { type: Type.STRING },
                  sensitivity: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                },
                required: ["type", "label", "subLabel", "description", "port", "ipAddress", "securityRules", "classification", "sensitivity", "reasoning"]
              }
            },
            required: ["valid"]
          }
        }
      });

      const responseText = response.text;
      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.warn("AI service generation failed, checking heuristics:", error?.message || error);
      
      // Fallback Heuristic matching
      const matched = commonServices.find(s => sd.includes(s.key));
      if (matched) {
        return res.json({
          valid: true,
          suggestedConnections: matched.connections,
          node: {
            type: matched.type,
            label: matched.label,
            subLabel: matched.tech,
            description: `Auto-generated ${matched.label} component for secure ${systemCategory} processing.`,
            port: 443,
            ipAddress: `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.1`,
            securityRules: [
              { name: "TLS termination", description: "Enforces strong ciphers and modern handshakes." },
              { name: "Credential isolation", description: "Storage of secrets in hardware security modules." }
            ],
            classification: "Confidential",
            sensitivity: "High",
            reasoning: "Handles sensitive business/user data streams."
          }
        });
      }

      res.status(500).json({ valid: false, errorReason: "Architectural AI generator offline. Please try again with a more specific description." });
    }
  });

  // API Route for Sandbox item validation & dynamic generation via Gemini 3.5-flash
  app.post("/api/validate-sandbox-item", async (req, res) => {
    console.log("Validation request received:", req.body);
    const { systemCategory, userInput } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `In an enterprise architectural system of category "${systemCategory || "Health/ERP System"}", the developer has typed a sandbox prompt:
      "${userInput}"
      
      This prompt wants to add user roles (subject entities) or resources/properties (service attributes), or it asks you to "suggest or add extra attributes/entities" relevant to this system architecture (e.g. adding billing statements, HR records, audit logs, or custom entities like clinical auditor).
      
      First, evaluate if this request is relevant to modern secure enterprise architectures (specifically relevant to a ${systemCategory}). Prevent irrelevant or off-topic inputs (like "cricket", "who won the game", "pizza", or generic chat).
      If the input is irrelevant, return:
      {
        "validation": "INVALID",
        "reason": "Technical description of why the prompt is irrelevant to security audits.",
        "entities": [],
        "attributes": []
      }
      
      If the input is relevant, return:
      {
        "validation": "VALID",
        "reason": "Crisp technical summary of entities/attributes identified and suggested.",
        "entities": [
          {
            "label": "Name of the entity (e.g. 'Clinical Auditor')",
            "role": "Concise systems role (e.g. 'Regulatory Auditor')",
            "icon": "One of: 'Doctor', 'Advisor', 'Teller', 'Admin', 'Agent', 'Staff', 'Consultant', 'Terminal', 'Shield'",
            "description": "System security description for this node.",
            "licenseStatus": "VERIFIED",
            "specialtyMatch": "MATCHED",
            "classification": "One of: 'Public', 'Internal', 'Confidential', 'Restricted', 'Highly Confidential'",
            "sensitivity": "One of: 'Minimal', 'Low', 'Medium', 'High', 'Critical'",
            "reasoning": "Legal/technical reasoning (e.g. 'Handles PHI under HIPAA.')"
          }
        ],
        "attributes": [
          {
            "label": "Name of the resource/attribute (e.g. 'Billing Statement' or 'HR Record')",
            "description": "System role description of this data resource.",
            "category": "Concise category name (e.g. 'Clinical Accounting')",
            "classification": "One of: 'Public', 'Internal', 'Confidential', 'Restricted', 'Highly Confidential'",
            "sensitivity": "One of: 'Minimal', 'Low', 'Medium', 'High', 'Critical'",
            "reasoning": "Legal/technical reasoning (e.g. 'Protected under GDPR Article 6.')"
          }
        ]
      }
      
      Suggest at least one resource if they asked to suggest more or added names like "billing statement" and "HR record".
      Ensure well-formed JSON matching the specified schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              validation: { type: Type.STRING, description: "Must be 'VALID' or 'INVALID'" },
              reason: { type: Type.STRING },
              entities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    role: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    description: { type: Type.STRING },
                    licenseStatus: { type: Type.STRING },
                    specialtyMatch: { type: Type.STRING },
                    classification: { type: Type.STRING },
                    sensitivity: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                  },
                  required: ["label", "role", "icon", "description", "licenseStatus", "specialtyMatch", "classification", "sensitivity", "reasoning"]
                }
              },
              attributes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    classification: { type: Type.STRING },
                    sensitivity: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                  },
                  required: ["label", "description", "category", "classification", "sensitivity", "reasoning"]
                }
              }
            },
            required: ["validation", "reason", "entities", "attributes"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response from Gemini API");
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.warn("Gemini sandbox validation failed, using heuristic fallback:", error?.message || error);
      const ui = (req.body.userInput || "").toString().toLowerCase().trim();
      const userInput = (req.body.userInput || "").toString();
      
      const irrelevantWords = ["cricket", "score", "pizza", "burger", "movie", "game", "chess", "weather", "song", "playlist", "joke", "fun", "sport", "football", "tennis", "cricket score"];
      const isIrrelevant = irrelevantWords.some(w => ui.includes(w)) || ui.length < 2;

      if (isIrrelevant) {
        res.json({
          validation: "INVALID",
          reason: "This parameter matches off-topic inquiries. Enterprise sandbox only supports access control entities, data assets, and legal guidelines.",
          entities: [],
          attributes: []
        });
      } else {
        const generatedEntities = [];
        const generatedAttributes = [];

        // Check the category domain
        const domain = (systemCategory || "health").toLowerCase();
        const isHealth = domain.includes("health") || domain.includes("clinic") || domain.includes("medical") || domain.includes("hospital") || domain.includes("patient");
        const isFinance = domain.includes("finance") || domain.includes("bank") || domain.includes("advisory") || domain.includes("fiduciary") || domain.includes("investment");

        // Helper to format proper case
        const toProperCase = (str: string) => {
          return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        };

        // Check for specific explicit attributes requested in the prompt
        if (ui.includes("budget") || ui.includes("medical budget")) {
          generatedAttributes.push({
            label: "Medical Budget",
            description: "Encrypted healthcare department financial allocations, budget lines, and clinical ledger flows.",
            category: "Clinical Accounting"
          });
        }
        if (ui.includes("billing") || ui.includes("invoice") || ui.includes("billing statement") || ui.includes("statement")) {
          // Avoid duplicating if we added it under budget
          const hasBilling = generatedAttributes.some(a => a.label === "Billing Statement");
          if (!hasBilling) {
            generatedAttributes.push({
              label: "Billing Statement",
              description: "Encrypted invoices, claims histories, diagnostic coding, and financial records.",
              category: "Clinical Accounting"
            });
          }
        }
        if (ui.includes("hr") || ui.includes("payroll") || ui.includes("salary") || ui.includes("employee")) {
          generatedAttributes.push({
            label: "HR Record",
            description: "Protected administrative files including legal agreements, wage details, and security clearance checks.",
            category: "Private Administration"
          });
        }

        // Entities
        if (ui.includes("staff") || ui.includes("medical staff")) {
          generatedEntities.push({
            label: "Medical Staff",
            role: "Clinical Specialist",
            icon: "Staff",
            description: "Secondary clinical operator authorized to perform secure workspace actions.",
            licenseStatus: "VERIFIED",
            specialtyMatch: "MATCHED"
          });
        }
        if (ui.includes("auditor") || ui.includes("audit") || ui.includes("inspector") || ui.includes("compliance") || ui.includes("regulator")) {
          generatedEntities.push({
            label: "Compliance Auditor",
            role: "Assigned Security Auditor",
            icon: "Shield",
            description: "Direct compliance auditor performing independent secure pathway checks.",
            licenseStatus: "VERIFIED",
            specialtyMatch: "MATCHED"
          });
        }
        if (ui.includes("director") || ui.includes("executive") || ui.includes("chief")) {
          generatedEntities.push({
            label: "Clinical Director",
            role: "Chief Hospital Administrator",
            icon: "Shield",
            description: "Executive system operator with high-clearance compliance oversight.",
            licenseStatus: "VERIFIED",
            specialtyMatch: "MATCHED"
          });
        }

        // If they asked for "add attributes" or "two attributes" or similar, but did not match specific keywords above,
        // we add compliant suggestions that represent exactly what was asked, but ONLY if we are confident!
        const wantsAttributes = ui.includes("attribute") || ui.includes("attributes") || ui.includes("budget") || ui.includes("record") || ui.includes("records") || ui.includes("statement");
        const wantsEntities = ui.includes("entity") || ui.includes("entities") || ui.includes("role") || ui.includes("roles") || ui.includes("user") || ui.includes("users") || ui.includes("operator") || ui.includes("subject") || ui.includes("staff") || ui.includes("auditor");

        if (wantsAttributes && generatedAttributes.length === 0) {
          // Check what was in the input after words like "like" or "add"
          let customName = "";
          const likeIndex = ui.indexOf("like");
          const addIndex = ui.indexOf("add");
          if (likeIndex !== -1 && likeIndex + 5 < ui.length) {
            customName = userInput.substring(likeIndex + 5).trim();
          } else if (addIndex !== -1 && addIndex + 4 < ui.length) {
            let rest = ui.substring(addIndex + 4).trim();
            rest = rest.replace(/attributes|attribute|two|three|new|custom|like/gi, "").trim();
            if (rest.length > 2) {
              customName = toProperCase(rest);
            }
          }
          
        // STRICT HEURISTIC: Only add if strongly related and reject off-topic.
        const isIrrelevantCustom = customName.toLowerCase().match(/mars|jupiter|saturn|venus|mercury|pluto|pizza|cricket|game|movie/);
          
        if (isIrrelevantCustom) {
          res.json({
            validation: "INVALID",
            reason: "The requested entity/attribute is not relevant to a medical/health system architecture.",
            entities: [],
            attributes: []
          });
          return; // Exit
        }

        if (customName && customName.length > 2) {
          generatedAttributes.push({
            label: customName,
            description: "Custom sandbox asset integrated with local validation guidelines.",
            category: "Sandbox Attribute Group"
          });
        } else {
          // Suggest default attributes
          if (isHealth) {
            generatedAttributes.push({
              label: "Medical Budget",
              description: "Healthcare department financial allocations, budget lines, and clinical ledger flows.",
              category: "Clinical Accounting"
            });
            generatedAttributes.push({
              label: "Biometric Audit Logs",
              description: "Highly secure hardware access logs, fingerprint scan databases, and signature logs.",
              category: "Multi-Factor Integrity"
            });
          } else if (isFinance) {
            generatedAttributes.push({
              label: "Venture Ledger",
              description: "Corporate financial flows, accounts spreadsheets, and compliance risk assets.",
              category: "Fiduciary Accounting"
            });
            generatedAttributes.push({
              label: "Advisory Statement",
              description: "Wealth accounts statement, investment ledger lines, and client stock details.",
              category: "Fiduciary Accounting"
            });
          } else {
            generatedAttributes.push({
              label: "Inventory Ledger",
              description: "Platform stock balances, supplier files, and warehouse records.",
              category: "E-commerce Core"
            });
            generatedAttributes.push({
              label: "Payment Voucher",
              description: "Financial transactions, purchase invoices, and store transaction logs.",
              category: "E-commerce Core"
            });
          }
        }
        }

        if (wantsEntities && generatedEntities.length === 0) {
          let customName = "";
          const likeIndex = ui.indexOf("like");
          if (likeIndex !== -1 && likeIndex + 5 < ui.length) {
            customName = userInput.substring(likeIndex + 5).trim();
          } else {
            let rest = ui;
            rest = rest.replace(/add|entities|entity|roles|role|two|three|new|custom|like/gi, "").trim();
            if (rest.length > 2) {
              customName = toProperCase(rest);
            }
          }

          if (customName && customName.length > 2) {
            generatedEntities.push({
              label: customName,
              role: "Sandbox Custom Role",
              icon: "Terminal",
              description: "Self-declared custom security subject operator.",
              licenseStatus: "VERIFIED",
              specialtyMatch: "MATCHED"
            });
          } else {
            if (isHealth) {
              generatedEntities.push({
                label: "Medical Staff",
                role: "Clinical Operator",
                icon: "Staff",
                description: "Secondary clinical operator authorized to perform secure workspace actions.",
                licenseStatus: "VERIFIED",
                specialtyMatch: "MATCHED"
              });
            } else if (isFinance) {
              generatedEntities.push({
                label: "Fiduciary Agent",
                role: "Financial Advisor",
                icon: "Advisor",
                description: "Authorized investment consultant accessing audited customer bank registers.",
                licenseStatus: "VERIFIED",
                specialtyMatch: "MATCHED"
              });
            } else {
              generatedEntities.push({
                label: "Product Supervisor",
                role: "Sales Admin Manager",
                icon: "Admin",
                description: "Retail operations administrator managing store inventories and supplier assets.",
                licenseStatus: "VERIFIED",
                specialtyMatch: "MATCHED"
              });
            }
          }
        }

        // Catch-all fallback if neither keyword was matched and nothing was generated:
        if (generatedEntities.length === 0 && generatedAttributes.length === 0) {
          const capitalizedName = toProperCase(userInput.trim());
          const containsAttrIndicator = ui.includes("record") || ui.includes("budget") || ui.includes("data") || ui.includes("file") || ui.includes("list") || ui.includes("log") || ui.includes("info") || ui.includes("statement") || ui.includes("history") || ui.includes("ledger") || ui.includes("prescription") || ui.includes("billing") || ui.includes("invoice") || ui.includes("payment");
          
          if (containsAttrIndicator) {
            generatedAttributes.push({
              label: capitalizedName,
              description: "Custom sandbox asset integrated with local validation guidelines.",
              category: "Sandbox Attribute Group"
            });
          } else {
            generatedEntities.push({
              label: capitalizedName,
              role: "Sandbox Custom Role",
              icon: "Terminal",
              description: "Self-declared custom entity added via developer sandbox portal.",
              licenseStatus: "VERIFIED",
              specialtyMatch: "PASSED"
            });
          }
        }

        res.json({
          validation: "VALID",
          reason: "Validated as a secure architectural node parameter.",
          entities: generatedEntities,
          attributes: generatedAttributes
        });
      }
    }
  });


  // API Route for Policy Generation
  app.post("/api/generate-policy", async (req, res) => {
    try {
      const { subjects, attributes, format, selectedEntityId, forcedAttributes } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `Act as a Policy Architect. Based on this visual map, generate a single, comprehensive Policy-as-Code file. Include all RBAC/ABAC rules. Format it as a production-ready repository.
      
      Visual Context:
      Subject: ${JSON.stringify(subjects.find((s: any) => s.id === selectedEntityId))}
      Granted Attributes: ${JSON.stringify(attributes.filter((a: any) => a.status === 'success' || forcedAttributes.includes(a.id)))}
      Desired Format: ${format}

      Generate the code content strictly in this format:
      allow { 
        input.subject == "subject_label_lowercase"
        input.resource == "attribute_label_lowercase_with_underscores"
      }
      
      Ensure all rules are included for granted attributes.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText,
      });

      const policyContent = response.text;
      if (!policyContent) {
        throw new Error("No response from Gemini API");
      }

      res.json({ policyContent });
    } catch (error: any) {
      console.warn("Policy generation failed, using heuristic fallback:", error?.message || error);
      const { subjects, attributes, selectedEntityId, forcedAttributes } = req.body;
      const selectedSubject = subjects.find((s: any) => s.id === selectedEntityId);
      const grantedAttributes = attributes.filter((a: any) => a.status === 'success' || forcedAttributes.includes(a.id));
      
      let policyContent = "# Sample Generated Logic (Fallback Mode)\n";
      if (selectedSubject) {
        grantedAttributes.forEach((attr: any) => {
          policyContent += `allow { 
  input.subject == "${selectedSubject.label.toLowerCase().replace(/ /g, '_')}"
  input.resource == "${attr.label.toLowerCase().replace(/ /g, '_')}"
  input.action == "read"
}\n`;
        });
      } else {
        policyContent = "# Error: Could not generate policy\n";
      }
      res.json({ policyContent });
    }
  });


  // API Route for generating edge security best practices
  app.post("/api/generate-edge-blueprint", async (req, res) => {
    try {
      const { sourceNode, targetNode, systemCategory } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `Act as a Senior Cyber Security Architect. 
      Generate a security blueprint for the connection between:
      SOURCE: ${sourceNode.label} (${sourceNode.type})
      TARGET: ${targetNode.label} (${targetNode.type})
      SYSTEM CATEGORY: ${systemCategory}

      Return ONLY a JSON object with this structure:
      {
        "secretManagement": { "title": "string", "description": "string", "code": "string" },
        "integrityCheck": { "title": "string", "description": "string", "code": "string" },
        "encryption": { "title": "string", "description": "string", "code": "string" },
        "compliance": { "pciDss": "string", "rbiGuideline": "string", "dpdpAct": "string", "isIndianSpecific": true }
      }

      Provide realistic production-ready code snippets (5-10 lines each) using Node.js/TypeScript patterns. 
      For compliance, focus on Indian regulations (RBI, DPDP).`;

      console.log("Calling Gemini for blueprint...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText
      });

      const text = response.text;
      console.log("Gemini response length:", text?.length);
      
      if (!text) {
        throw new Error("Model returned empty response");
      }

      // Try to clean potentially markdown-wrapped JSON
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      try {
        const json = JSON.parse(cleanJson);
        res.json(json);
      } catch (parseError) {
        console.error("JSON Parse Error. Raw response:", text);
        throw new Error("Model response was not valid JSON");
      }
    } catch (error: any) {
      console.error("FULL Blueprint generation failed:", error);
      res.status(500).json({ 
        error: "Failed to generate security blueprint",
        details: error.message || "Unknown error"
      });
    }
  });

  // API Route for "Verify My Code" interactive audit
  app.post("/api/verify-code", async (req, res) => {
    try {
      const { code, systemCategory, connectionContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `Act as an Automated Security Auditor for a ${systemCategory} system.
      Context: This code handles a connection ${connectionContext}.
      
      Review this code for:
      1. Hardcoded secrets.
      2. Missing signature/integrity validation.
      3. Insecure protocols.
      
      Code to audit:
      \`\`\`
      ${code}
      \`\`\`
      
      Return a BRIEF JSON audit summary:
      {
        "status": "SECURE | VULNERABLE",
        "findings": ["Finding 1", "Finding 2"],
        "fix": "Recommended code snippet or description"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              findings: { type: Type.ARRAY, items: { type: Type.STRING } },
              fix: { type: Type.STRING }
            },
            required: ["status", "findings", "fix"]
          }
        }
      });

      res.json(JSON.parse(response.text.trim()));
    } catch (error: any) {
      console.error("Code audit failed:", error);
      res.status(500).json({ error: "Failed to audit code" });
    }
  });

  app.post("/api/evaluate-attribute-entity", async (req, res) => {
    try {
      const { systemType, prompt, existingSubjects, existingAttributes } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      
      const aiPrompt = `As a Security Architect, evaluate the following request for a ${systemType} system: "${prompt}".
      
      OBJECTIVE:
      1. Determine if the requested entities/attributes are relevant to a ${systemType} system.
      2. If the user asks for generic additions ("add two more"), suggest high-value security/operational nodes.
      3. CRITICAL: Reject irrelevant items (e.g., 'cricket', 'sports', 'gaming' in a HEALTH or FINANCE system).
      4. MOST IMPORTANT: provide a list of 'newConnections' mapping ALL combinations of (Existing + New Subjects) to (Existing + New Attributes). Return only connections that should be PERMITTED. If a subject-attribute pair is not in this list, it is assumed DENIED.
      
      Existing Subjects: ${JSON.stringify(existingSubjects)}
      Existing Attributes: ${JSON.stringify(existingAttributes)}
      
      RESPONSE FORMAT (Strict JSON):
      {
        "isSuitable": boolean,
        "reason": "short explanation",
        "newSubjects": [{"id": "unique_id", "label": "NAME", "detail": "description", "classification": "Confidential", "sensitivity": "High"}],
        "newAttributes": [{"id": "unique_id", "label": "NAME", "category": "CATEGORY"}],
        "newConnections": [{"subjectLabel": "NAME", "attributeLabel": "NAME"}]
      }
      Return empty arrays for newSubjects/newAttributes if isSuitable is false. Ensure IDs are unique and prefixed with 'ai_'.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: aiPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSuitable: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              newSubjects: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    id: { type: Type.STRING }, 
                    label: { type: Type.STRING }, 
                    detail: { type: Type.STRING }, 
                    classification: { type: Type.STRING }, 
                    sensitivity: { type: Type.STRING } 
                  } 
                } 
              },
              newAttributes: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    id: { type: Type.STRING }, 
                    label: { type: Type.STRING }, 
                    category: { type: Type.STRING } 
                  } 
                } 
              },
              newConnections: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    subjectLabel: { type: Type.STRING }, 
                    attributeLabel: { type: Type.STRING } 
                  } 
                } 
              }
            }
          }
        }
      });

      let resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from AI");
      }
      
      console.log("Raw evaluate response: ", resultText);
      resultText = resultText.replace(/```json\n?|```/g, "").trim();

      const result = JSON.parse(resultText);
      res.json(result);
    } catch (error) {
      console.error("AI Node Evaluation Error:", error);
      res.status(500).json({ error: "Failed to evaluate nodes" });
    }
  });

  // Serve Vite Assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
