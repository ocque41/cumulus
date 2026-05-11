export type Product = {
  slug: string;
  name: string;
  short: string;
  definition: string;
  features: string[];
  tech: string[];
  heroImage?: string;
  expertise: string;
  use: string;
  fullDescription: string;
};

export const products: Product[] = [
  {
    slug: "micro-agents",
    name: "Micro Agents",
    expertise: "SaaS & Operations",
    use: "Enterprise",
    short:
      "Autonomous micro agents accelerate decision pipelines for operations teams.",
    definition: "Auto AI micro agents automate small tasks without manual oversight.",
    fullDescription: `### Why teams choose Micro Agents
- We specialize in automating micro work to speed pipeline efficiency in small business environments.
- Faster decisions and healthier pilot metrics come from the autonomous monitoring each agent delivers.

### Build your agent
- Select the use case that matches your workflow and launch the requirements builder.
- Configure the inputs, outputs, and guardrails so the agent executes without human review.
- Iterate on data capture and reporting templates to share progress with every stakeholder.`,
    features: [
      "Invisible automation - tasks complete autonomously without manual oversight",
      "Improved decision making with accelerated timeframes",
      "Enhanced pilot and operational metrics",
      "Streamlined pipeline efficiency across your organization",
      "Custom use case selection and agent building",
    ],
    tech: ["AI", "SaaS", "Operations"],
  },
  {
    slug: "blocks",
    name: "Blocks",
    expertise: "Team management & Pipeline visualizer",
    use: "Small Business",
    short:
      "Enterprise terminal organizing teams, analytics, security, and collaboration workflows.",
    definition: "Blocks delivers an enterprise-grade organization terminal with a visual component editor.",
    fullDescription: `### Core workspaces
- Visual component editor keeps every workflow modular and easy to reconfigure.
- Enterprise security enforces advanced 8-digit authentication and active session management.
- Analytics, historical snapshots, and intelligence tools preserve a complete operational trail.

### Team operations
- Workforce management assigns, monitors, and forecasts projects across the entire company.
- Live collaboration supports real-time editing with instant updates for every contributor.
- Shared dashboards surface pipeline status and unblock decisions between teams.`,
    features: [
      "Visual component editor for intuitive workspace management",
      "Enterprise security with 8-digit authentication and session management",
      "Comprehensive analytics with automated snapshots and audit trails",
      "Advanced workforce management across entire organization",
      "Real-time collaboration with instant project updates",
    ],
    tech: ["Team Management", "Analytics", "Collaboration"],
  },
  {
    slug: "operation-agents",
    name: "Operation Agents",
    expertise: "AI & Operations",
    use: "Enterprise",
    short: "Private AI operations platform simulating missions and automating reports.",
    definition:
      "Operation Agents is a private platform for transportation, energy, and security enterprises.",
    fullDescription: `### Pre-production clarity
- Simulate real-world environments so teams validate every scenario before production.
- Capture structured data from each run to power future analysis and training.

### Operational readiness
- Agents guide teams through complex procedures with repeatable steps and safety checks.
- Automated reporting packages insights and recommendations immediately after every exercise.
- BPMN optimization keeps workflows improving on each execution.`,
    features: [
      "Real-world simulation for complex operations before deployment",
      "Data preservation for all tests and future reference",
      "AI-guided training for optimal operation performance",
      "Automated BPMN optimization with each execution",
      "Complete automated reporting and documentation",
    ],
    tech: ["AI", "Operations", "Enterprise"],
  },
  {
    slug: "resuming",
    name: "Resuming",
    expertise: "AI & Documents",
    use: "Small Business",
    short: "AI document studio analyzes, edits, formats, and personalizes instantly.",
    definition: "Resuming is an AI-powered document analysis and optimization platform.",
    fullDescription: `### Upload once, deliver anywhere
- Drop in files and let the AI handle analysis, edits, and formatting.
- Generate export-ready documents that match your brand or compliance standards.

### Industry personalization
- Train the system for high-volume signature placement and review cycles.
- Configure domain-specific rules so documents ship complete every time.
- Automate change tracking and approvals for distributed teams.`,
    features: [
      "One-click processing - upload, process, and download in seconds",
      "Intelligent AI document analysis and understanding",
      "Automated format conversion between different document types",
      "Smart editing based on your specific requirements",
      "Custom training for industry-specific document preparation",
    ],
    tech: ["AI", "Documents", "Automation"],
  },
  {
    slug: "dquote",
    name: "DQuote",
    expertise: "AI & Revenue Operations",
    use: "SMB to Enterprise",
    short: "AI CPQ workspace builds, shares, tracks, and optimizes revenue quotes.",
    definition: "DQuote is a configure-price-quote workspace that turns proposals into revenue.",
    fullDescription: `It turns accurate proposals around quickly so every quote is ready to convert into a sale.

A sales quote is the document that tells a customer what something will cost. DQuote keeps that process organized, traceable, and measurable for every team involved.

## What it does
- Create quotes fast with guided steps to pick items, set prices, and publish a clean package.
- Share and present each proposal as a live link or PDF so clients can review and respond on their schedule.
- Track engagement automatically, see when a quote is opened, and move buyers to the next stage.
- Use AI to draft messaging, check details, and recommend follow-up so every rep sells more.

## Our simple expertise (in plain words)
- AI to write, review, and speed up the quoting workflow.
- Management & operations discipline to keep products, prices, and approvals organized.
- Execution support so teams can send quotes, track status, and close deals reliably.
- Pipeline visibility to move each lead from quote to payment smoothly.
- Consulting available for pricing strategy, automation flows, and reporting when extra help is needed.

## Who it’s for
- Small businesses and growing teams that need quick, accurate quotes without extra headcount.
- Mid-market organizations preparing for scale and enterprises with complex approvals that demand structure.
`,
    features: [
      "Guided configure-price-quote workflow for fast proposal creation",
      "Instant sharing via secure links or polished PDFs",
      "Engagement tracking with alerts for follow-up",
      "AI assistance to draft copy and validate pricing details",
      "Advisory support for pricing, process design, and reporting",
    ],
    tech: ["CPQ", "AI", "Sales Operations"],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
