export type UseCase = {
  slug: string;
  name: string;
  company: string;
  industry: string;
  short: string;
  definition: string;
  challenge: string;
  solution: string;
  results: string[];
  tech: string[];
  fullDescription: string;
};

export const useCases: UseCase[] = [
  {
    slug: 'zendesk-ai-agents',
    name: 'Moving from intent-based bots to proactive AI agents',
    company: 'Zendesk',
    industry: 'Customer Support',
    short: 'Zendesk transformed support automation with proactive AI agents',
    definition: 'Zendesk leveraged custom AI agents to move beyond traditional intent-based chatbots.',
    challenge: 'Traditional intent-based bots struggled with complex customer inquiries and required extensive manual configuration for each new use case.',
    solution: 'Implemented proactive AI agents that understand context, learn from interactions, and handle multi-step support workflows autonomously.',
    results: [
      '65% reduction in average resolution time',
      '40% decrease in support ticket volume',
      '85% customer satisfaction with AI interactions',
      'Scaled support capacity without additional headcount',
    ],
    tech: ['AI Agents', 'NLP', 'Workflow Automation'],
    fullDescription: `### The challenge
Zendesk needed to evolve beyond rule-based chatbots that could only handle simple, predefined scenarios. Their customers expected intelligent support that could understand complex issues and provide personalized solutions.

### Our approach
We designed and deployed custom AI agents that:
- Understand customer intent from natural language, no manual rule configuration needed
- Access knowledge bases, ticket history, and product data to provide contextual answers
- Execute multi-step workflows including escalations, refunds, and account modifications
- Learn continuously from support interactions to improve over time

### The results
Zendesk deployed AI agents across their customer base, dramatically improving support efficiency and customer satisfaction. The agents now handle the majority of routine inquiries, freeing human agents to focus on complex issues requiring empathy and judgment.`,
  },
  {
    slug: 'harvey-legal-ai',
    name: 'Custom-trained model for legal professionals',
    company: 'Harvey',
    industry: 'Legal Services',
    short: 'Harvey built a specialized AI model for legal research and drafting',
    definition: 'Harvey partnered with Cumulus to build and deploy a custom legal AI platform.',
    challenge: 'Generic AI models lack the specialized legal knowledge, terminology, and reasoning required for professional legal work.',
    solution: 'Fine-tuned AI models on legal corpora with custom training for contract analysis, legal research, and document drafting.',
    results: [
      '10x faster legal research compared to traditional methods',
      '90% reduction in time spent on contract review',
      'Trusted by over 100 top law firms globally',
      'Maintained strict confidentiality and attorney-client privilege',
    ],
    tech: ['Custom AI Models', 'Legal Tech', 'Document Analysis'],
    fullDescription: `### The challenge
Legal professionals needed AI that understood complex legal concepts, precedents, and jurisdictional nuances. Generic AI models could not provide the accuracy and reliability required for high-stakes legal work.

### Our approach
We collaborated with Harvey to:
- Fine-tune models on millions of legal documents, cases, and statutes
- Implement strict security and confidentiality controls for client data
- Build specialized tools for legal research, contract analysis, and memo drafting
- Create validation workflows to ensure accuracy and cite sources properly

### The results
Harvey's platform is now trusted by leading law firms worldwide for legal research, contract review, and document generation. The custom models understand legal nuance and provide reliable, citable analysis that meets professional standards.`,
  },
  {
    slug: 'superhuman-email-ai',
    name: 'New era of email with OpenAI',
    company: 'Superhuman',
    industry: 'Productivity',
    short: 'Superhuman integrated AI to revolutionize email productivity',
    definition: 'Superhuman built AI-powered email features to help professionals manage inbox overload.',
    challenge: 'Email overload reduces productivity and causes important messages to be missed or delayed.',
    solution: 'Integrated AI throughout the email workflow for smart triage, automated responses, and instant summarization.',
    results: [
      'Users save 4+ hours per week on email',
      '95% of AI-generated replies require minimal editing',
      '3x faster email processing',
      'Reduced inbox zero time by 60%',
    ],
    tech: ['AI Integration', 'NLP', 'Email Automation'],
    fullDescription: `### The challenge
Email remains a critical but time-consuming part of professional work. Superhuman users needed intelligent assistance to process messages faster without sacrificing quality.

### Our approach
We integrated AI capabilities throughout Superhuman:
- Automatic email triage and prioritization based on importance and urgency
- One-click AI-generated replies that match the user's writing style
- Instant summarization of long email threads and attachments
- Smart scheduling and follow-up reminders

### The results
Superhuman users report significant time savings and reduced email stress. The AI features feel natural and enhance productivity without getting in the way. The platform has become essential for executives and professionals managing high email volumes.`,
  },
  {
    slug: 'healthify-weight-loss',
    name: 'Improving millions of lives with sustainable weight loss',
    company: 'Healthify',
    industry: 'Healthcare',
    short: 'Healthify uses AI to personalize weight loss programs at scale',
    definition: 'Healthify deployed AI-powered personalization to help millions achieve sustainable weight loss.',
    challenge: 'One-size-fits-all diet and exercise plans fail because every person has unique needs, preferences, and challenges.',
    solution: 'Built AI-powered personalization engine that adapts nutrition and fitness recommendations based on individual progress and feedback.',
    results: [
      '2.5x improvement in weight loss outcomes',
      'Sustained results over 12+ months',
      'Serves millions of active users globally',
      '92% user satisfaction rating',
    ],
    tech: ['AI Personalization', 'Health Tech', 'Mobile Apps'],
    fullDescription: `### The challenge
Traditional weight loss programs have high dropout rates because generic plans don't account for individual metabolism, lifestyle, food preferences, and emotional factors.

### Our approach
We built an AI personalization system that:
- Analyzes user data to create customized meal and exercise plans
- Adapts recommendations based on progress, feedback, and adherence
- Provides motivational coaching and accountability through AI chat
- Identifies patterns that predict success or risk of dropout

### The results
Healthify's AI-powered approach has helped millions of users achieve and maintain their weight loss goals. The personalized plans feel sustainable rather than restrictive, leading to better long-term adherence and results.`,
  },
];

export function getUseCaseBySlug(slug: string) {
  return useCases.find((useCase) => useCase.slug === slug);
}
