export type Service = {
  slug: string;
  name: string;
  short: string;
  definition: string;
  expertise: string;
  use: string;
  focus: string[];
  features: string[];
  fullDescription: string;
};

export const services: Service[] = [
  {
    slug: "software-applications",
    name: "Software & Applications",
    short: "End-to-end product teams design, build, integrate, and maintain custom applications.",
    definition: "Custom software and application programs that span discovery through ongoing support.",
    expertise: "Full-cycle app strategy, UX/UI design, development, integrations, and lifecycle management.",
    use: "Teams that need bespoke tools, internal platforms, or customer-facing applications.",
    focus: ["Product Strategy", "Design", "Engineering"],
    features: [
      "Discovery workshops capture requirements, users, data flows, and compliance needs",
      "Experience design maps UX, UI, and interaction models across devices",
      "Full-stack development implements features, APIs, and integrations securely",
      "Testing and quality assurance cover unit, integration, and usability cycles",
      "Launch, maintenance, and enhancement plans keep the solution evolving",
    ],
    fullDescription: `### Discovery first
- Define the problem space, success metrics, user personas, and security requirements together.
- Document data flows, integration points, and infrastructure expectations before design begins.

### Build and launch
- Translate approved UX/UI systems into production-ready code across web or mobile stacks.
- Implement authentication, storage, and automation workflows with performance and privacy in mind.
- Run unit, integration, and usability testing before deploying to staging and production environments.

### Ongoing partnership
- Operate the release pipeline, monitor telemetry, and prioritize iteration backlogs.
- Coordinate upgrades, integrations, and cross-team handoffs as business needs expand.
- Provide support, documentation, and training so internal teams stay confident post-launch.`,
  },
  {
    slug: "website-design-development",
    name: "Website Design & Development",
    short: "Design-first web partners craft responsive, fast, and maintainable brand sites.",
    definition: "Website engagements that translate brand identity into performant, responsive experiences.",
    expertise: "UX research, UI systems, front-end engineering, CMS implementation, and performance tuning.",
    use: "Brands building marketing sites, product hubs, or content platforms that scale.",
    focus: ["UX/UI", "Frontend", "CMS"],
    features: [
      "Brand and audience discovery sessions align goals and content",
      "Wireframes and prototypes validate layouts, flows, and responsive states",
      "Development implements the approved system with modern web tooling",
      "Cross-browser and device testing guarantee reliability",
      "Launch support plus maintenance and optimization roadmaps",
    ],
    fullDescription: `### Strategy and discovery
- Clarify brand story, target audiences, conversion goals, and required features.
- Produce content plans, sitemap options, and success metrics before design begins.

### Design the experience
- Create responsive UX and UI systems with accessible color, typography, and imagery choices.
- Prototype interactions so stakeholders experience flows before development starts.

### Build, test, and launch
- Develop the site with clean HTML, CSS, and JavaScript or preferred CMS foundations.
- Integrate any required APIs, forms, or custom components while monitoring performance.
- Validate across browsers and devices, then deploy with post-launch support baked in.`,
  },
  {
    slug: "seo-sao",
    name: "SEO & SAO",
    short: "Organic visibility experts align SEO foundations with answer-ready SAO assets.",
    definition: "Optimization services that expand discoverability across search engines and answer engines.",
    expertise: "Keyword research, technical SEO, structured content, and multi-channel asset optimization.",
    use: "Organizations improving organic reach, authority, and readiness for AI-driven discovery.",
    focus: ["Search", "Content", "Analytics"],
    features: [
      "Keyword and intent research connected to content roadmaps",
      "On-page optimization covering metadata, copy, imagery, and internal linking",
      "Technical SEO audits for crawlability, site speed, and structured data",
      "SAO programs governing reviews, profiles, and third-party assets",
      "Measurement frameworks tying visibility gains to pipeline impact",
    ],
    fullDescription: `### SEO fundamentals
- Optimize on-page content, metadata, headers, and media for target keyword clusters.
- Strengthen technical foundations such as site structure, page speed, and crawl budgets.

### SAO expansion
- Structure copy for answer readiness with concise summaries, FAQs, and schema markup.
- Elevate off-site assets — reviews, profiles, social channels — so the brand appears wherever people search.

### Working together
- Blend SEO and SAO roadmaps so web property improvements and external signals reinforce each other.
- Monitor rankings, engagement, and conversions to prioritize the next optimization sprint.
- Iterate on reporting to highlight wins and surface emerging opportunities.`,
  },
  {
    slug: "advertising",
    name: "Advertising",
    short: "Paid media strategists orchestrate Google, Meta, and TikTok conversion ecosystems.",
    definition: "Performance advertising management across Google, Meta, and TikTok channels.",
    expertise: "Campaign architecture, creative optimization, analytics instrumentation, and budget management.",
    use: "Brands seeking coordinated demand capture and generation across paid acquisition platforms.",
    focus: ["Google Ads", "Meta", "TikTok"],
    features: [
      "Search, display, shopping, and video campaign management on Google Ads",
      "Creative development and audience building for Meta placements",
      "TikTok ad production, testing, and trend-aligned optimization",
      "Cross-platform remarketing programs that nurture prospects",
      "Continuous measurement, reporting, and budget reallocation",
    ],
    fullDescription: `### Google Ads
- Capture high-intent demand with keyword-driven search campaigns and conversion-focused landing experiences.
- Extend reach using display, shopping, and video inventory tuned to your funnel.
- Apply rigorous bidding, budgeting, and measurement so spend follows proven performance.

### Meta Ads
- Pair standout creative with demographic, interest, and lookalike targeting to build awareness and drive action.
- Run structured experiments on messaging, formats, and audiences to discover the most efficient paths to conversion.
- Retarget site visitors or engaged followers to move them toward purchase or signup goals.

### TikTok Ads
- Produce native-feeling short-form creative, then test hooks, CTAs, and sound to match current trends.
- Use TikTok's audience and event tools to reach communities that respond to discovery-led storytelling.
- Translate performance insights into rapid creative refreshes that keep campaigns efficient.

### Integrated optimization
- Combine Google, Meta, and TikTok insights to choreograph the full customer journey.
- Align analytics, attribution, and reporting so stakeholders understand return on every channel.
- Reinvest budgets dynamically based on verified results and upcoming campaign opportunities.`,
  },
];

export function getServiceBySlug(slug: string) {
  return services.find((service) => service.slug === slug);
}
