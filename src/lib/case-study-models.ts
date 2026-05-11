export type CaseStudyModel = {
  slug: string;
  name: string;
  short: string;
  definition: string;
  category: 'flagship' | 'api' | 'tool' | 'agent';
  features: string[];
  capabilities: string[];
  pricing?: string;
  fullDescription: string;
};

export const caseStudyModels: CaseStudyModel[] = [
  {
    slug: 'custom-ai-integration',
    name: 'Custom AI Integration',
    category: 'flagship',
    short: 'Best model for coding and agentic tasks across industries',
    definition: 'Custom AI Integration tailors industry-leading AI models to your specific workflows.',
    features: [
      'Text & vision processing',
      'Advanced reasoning capabilities',
      'Support for all built-in tools',
    ],
    capabilities: [
      'Custom model fine-tuning for your domain',
      'Multi-modal processing (text, vision, structured data)',
      'Built-in tool integration and function calling',
      'Context windows up to 400k tokens',
      'Enterprise-grade security and compliance',
    ],
    fullDescription: `### Why teams choose Custom AI Integration
- We adapt state-of-the-art AI models to solve your unique business challenges.
- Fine-tune models on your proprietary data while maintaining complete security and privacy.

### What we deliver
- Domain-specific model training and optimization for your industry and use case.
- Integration with your existing tools, databases, and workflows via APIs and SDKs.
- Ongoing model monitoring, evaluation, and retraining as your needs evolve.
- Complete documentation, best practices, and training for your technical teams.`,
  },
  {
    slug: 'workflow-automation',
    name: 'Workflow Automation',
    category: 'flagship',
    short: 'Faster, cheaper version for well-defined automation tasks',
    definition: 'Workflow Automation delivers efficient AI-powered automation for repetitive processes.',
    features: [
      'Text & vision processing',
      'Reasoning capabilities',
      'Support for all built-in tools',
    ],
    capabilities: [
      'Automated data extraction and transformation',
      'Intelligent routing and decision-making',
      'Multi-step workflow orchestration',
      'Real-time monitoring and alerting',
      'Cost-optimized model selection',
    ],
    fullDescription: `### Why teams choose Workflow Automation
- Reduce manual work by automating repetitive tasks with intelligent AI agents.
- Lower operational costs while maintaining accuracy and compliance.

### What we deliver
- Custom workflow design mapped to your existing processes and systems.
- Pre-built integrations with common enterprise tools and databases.
- Monitoring dashboards to track automation performance and ROI.
- Continuous optimization to improve speed, accuracy, and cost efficiency.`,
  },
  {
    slug: 'api-platform',
    name: 'API Platform',
    category: 'api',
    short: 'A new API primitive for agents combining simplicity with powerful built-in tools',
    definition: 'API Platform provides enterprise-ready APIs for integrating AI into your applications.',
    features: [
      'RESTful and WebSocket APIs',
      'Built-in authentication and rate limiting',
      'Comprehensive documentation',
    ],
    capabilities: [
      'Multiple API formats (REST, GraphQL, WebSocket)',
      'Automatic scaling and load balancing',
      'Detailed usage analytics and monitoring',
      'Webhook support for real-time events',
      'SDK generation for popular languages',
    ],
    fullDescription: `### Why teams choose API Platform
- Integrate AI capabilities into your applications with minimal development effort.
- Enterprise-grade reliability, security, and performance at scale.

### What we deliver
- Custom API design tailored to your application architecture and use cases.
- Complete API documentation with interactive examples and testing environments.
- SDKs and client libraries for your preferred programming languages.
- 24/7 monitoring, logging, and support with guaranteed uptime SLAs.`,
  },
  {
    slug: 'intelligent-search',
    name: 'Intelligent Search',
    category: 'tool',
    short: 'Enhanced search with up-to-date answers using the same capabilities as ChatGPT',
    definition: 'Intelligent Search delivers AI-powered semantic search across your enterprise data.',
    features: [
      'Natural language queries',
      'Multi-source aggregation',
      'Real-time indexing',
    ],
    capabilities: [
      'Semantic understanding of complex queries',
      'Search across documents, databases, and APIs',
      'Automatic summarization of search results',
      'Context-aware ranking and relevance',
      'Privacy-preserving search with access controls',
    ],
    fullDescription: `### Why teams choose Intelligent Search
- Find information instantly across all your company's data sources with natural language.
- Reduce time spent searching for documents, answers, and insights.

### What we deliver
- Custom search implementation integrated with your existing data infrastructure.
- AI-powered query understanding and result ranking tuned to your domain.
- User-friendly interfaces for both technical and non-technical team members.
- Continuous learning from user interactions to improve search quality over time.`,
  },
  {
    slug: 'agent-framework',
    name: 'Agent Framework',
    category: 'agent',
    short: 'Robust orchestration framework for designing, building, and deploying AI agents',
    definition: 'Agent Framework provides the infrastructure for building and managing autonomous AI agents.',
    features: [
      'Multi-agent orchestration',
      'Built-in observability',
      'Performance optimization',
    ],
    capabilities: [
      'Design and deploy autonomous agents with custom behaviors',
      'Multi-agent collaboration and communication protocols',
      'Real-time monitoring and debugging of agent actions',
      'Safe execution with guardrails and approval workflows',
      'Integration with existing business systems',
    ],
    fullDescription: `### Why teams choose Agent Framework
- Build sophisticated AI agents that can reason, plan, and execute complex tasks autonomously.
- Maintain control and visibility over agent behavior with comprehensive monitoring.

### What we deliver
- Custom agent design workshop to map your use cases to agent capabilities.
- Production-ready agent infrastructure with observability, logging, and testing.
- Safety mechanisms including human-in-the-loop approvals and constraint enforcement.
- Ongoing support for agent optimization and new capability development.`,
  },
];

export function getCaseStudyModelBySlug(slug: string) {
  return caseStudyModels.find((model) => model.slug === slug);
}

export function getCaseStudyModelsByCategory(category: CaseStudyModel['category']) {
  return caseStudyModels.filter((model) => model.category === category);
}
