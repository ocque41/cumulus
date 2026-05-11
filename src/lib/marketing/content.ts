import type {
  DailyFlowStep,
  MarketingHomeContent,
  MarketingModelsContent,
  PurchaseStep,
  SelectorPersona,
} from './schema';

export const homeContent: MarketingHomeContent = {
  heroEyebrow: {
    en: 'Tado',
    es: 'Tado',
  },
  heroTitle: {
    en: 'Orchestrate AI coding agents from one canvas.',
    es: 'Orquesta agentes de codificacion IA desde un solo canvas.',
  },
  heroSubtitle: {
    en: 'Tado is a macOS terminal multiplexer that lets you run Claude Code and Codex sessions in parallel with built-in agent communication.',
    es: 'Tado es un multiplexor de terminales para macOS que te permite ejecutar sesiones de Claude Code y Codex en paralelo con comunicacion integrada entre agentes.',
  },
  heroPrimaryCta: {
    en: 'Download Tado',
    es: 'Descargar Tado',
  },
  heroSecondaryCta: {
    en: 'View on GitHub',
    es: 'Ver en GitHub',
  },
  selectorTitle: {
    en: 'What can Tado do for you?',
    es: 'Que puede hacer Tado por ti?',
  },
  selectorDescription: {
    en: 'Pick your workflow and see how Tado fits.',
    es: 'Elige tu flujo de trabajo y mira como encaja Tado.',
  },
  federationTitle: {
    en: 'All surfaces in one app',
    es: 'Todas las superficies en una app',
  },
  federationDescription: {
    en: 'Each surface handles one part of the multi-agent workflow.',
    es: 'Cada superficie maneja una parte del flujo multi-agente.',
  },
  flowTitle: {
    en: 'How your workflow runs in Tado',
    es: 'Como funciona tu flujo de trabajo en Tado',
  },
  flowDescription: {
    en: 'A simple loop: type a task, agents spawn, they coordinate, you review.',
    es: 'Un bucle simple: escribe una tarea, los agentes se crean, se coordinan, tu revisas.',
  },
  trustTitle: {
    en: 'What you get today',
    es: 'Lo que obtienes hoy',
  },
  trustDescription: {
    en: 'MIT licensed and actively maintained.',
    es: 'Licencia MIT y mantenido activamente.',
  },
  pricingBridgeTitle: {
    en: 'Ready to coordinate your agents?',
    es: 'Listo para coordinar tus agentes?',
  },
  pricingBridgeDescription: {
    en: 'Download Tado free or upgrade to Pro for priority support.',
    es: 'Descarga Tado gratis o actualiza a Pro para soporte prioritario.',
  },
  pricingBridgeCta: {
    en: 'Open Models',
    es: 'Abrir Models',
  },
};

export const modelsContent: MarketingModelsContent = {
  eyebrow: {
    en: 'Pricing',
    es: 'Precios',
  },
  title: {
    en: 'Choose your plan',
    es: 'Elige tu plan',
  },
  subtitle: {
    en: 'Tado is free under the MIT license. Pro adds priority support and early access to new features.',
    es: 'Tado es gratis bajo la licencia MIT. Pro agrega soporte prioritario y acceso anticipado a nuevas funciones.',
  },
  comparisonTitle: {
    en: 'What Pro includes',
    es: 'Que incluye Pro',
  },
  comparisonDescription: {
    en: 'General benefits are shown now. Detailed limits publish in a later release.',
    es: 'Mostramos beneficios generales ahora. Limites detallados se publican despues.',
  },
  stepsTitle: {
    en: 'What happens after purchase',
    es: 'Que pasa despues de comprar',
  },
  stepsDescription: {
    en: 'From account to running your first agent team in clear steps.',
    es: 'De cuenta a tu primer equipo de agentes en pasos claros.',
  },
  enterpriseTitle: {
    en: 'Need team licensing?',
    es: 'Necesitas licencias para equipos?',
  },
  enterpriseDescription: {
    en: 'For procurement, volume licensing, and custom onboarding.',
    es: 'Para compras corporativas, licencias por volumen y onboarding personalizado.',
  },
  enterpriseCta: {
    en: 'Contact Sales',
    es: 'Contactar Ventas',
  },
};

export const selectorPersonas: SelectorPersona[] = [
  {
    id: 'operator',
    label: {
      en: 'I run multiple agents in parallel',
      es: 'Ejecuto multiples agentes en paralelo',
    },
    description: {
      en: 'You need parallel terminal sessions with real-time coordination between agents.',
      es: 'Necesitas sesiones de terminal en paralelo con coordinacion en tiempo real entre agentes.',
    },
    recommendedProducts: ['rune', 'hub', 'notes'],
  },
  {
    id: 'client-services',
    label: {
      en: 'I coordinate agent teams',
      es: 'Coordino equipos de agentes',
    },
    description: {
      en: 'You need organized teams with mandatory response rules and project scoping.',
      es: 'Necesitas equipos organizados con reglas de respuesta obligatoria y alcance por proyecto.',
    },
    recommendedProducts: ['enterprise', 'hub', 'notes'],
  },
  {
    id: 'field-admin',
    label: {
      en: 'I build multi-agent workflows',
      es: 'Construyo flujos multi-agente',
    },
    description: {
      en: 'You need IPC tools, pub/sub topics, and agent discovery for complex workflows.',
      es: 'Necesitas herramientas IPC, topicos pub/sub y descubrimiento de agentes para flujos complejos.',
    },
    recommendedProducts: ['blocks', 'hub', 'notes'],
  },
  {
    id: 'founder',
    label: {
      en: 'I manage the whole development pipeline',
      es: 'Gestiono todo el pipeline de desarrollo',
    },
    description: {
      en: 'You need one canvas with all agents, projects, and coordination visible at once.',
      es: 'Necesitas un canvas con todos los agentes, proyectos y coordinacion visibles a la vez.',
    },
    recommendedProducts: ['hub', 'rune', 'enterprise', 'blocks'],
  },
];

export const dailyFlowSteps: DailyFlowStep[] = [
  {
    id: 'plan',
    title: {
      en: 'Type the task',
      es: 'Escribe la tarea',
    },
    detail: {
      en: 'Add a task to the todo list. Press Enter to spawn a terminal tile.',
      es: 'Agrega una tarea a la lista. Presiona Enter para crear un terminal.',
    },
  },
  {
    id: 'execute',
    title: {
      en: 'Agent starts working',
      es: 'El agente empieza a trabajar',
    },
    detail: {
      en: 'Claude Code or Codex runs in the spawned tile with your project context.',
      es: 'Claude Code o Codex ejecuta en el tile creado con el contexto de tu proyecto.',
    },
  },
  {
    id: 'track',
    title: {
      en: 'Agents coordinate',
      es: 'Los agentes se coordinan',
    },
    detail: {
      en: 'Agents discover peers, read output, and send messages via built-in IPC tools.',
      es: 'Los agentes descubren pares, leen salida y envian mensajes via herramientas IPC integradas.',
    },
  },
  {
    id: 'improve',
    title: {
      en: 'Review and iterate',
      es: 'Revisa e itera',
    },
    detail: {
      en: 'Inspect results, queue follow-up prompts, and mark tasks done.',
      es: 'Inspecciona resultados, encola prompts de seguimiento y marca tareas completadas.',
    },
  },
];

export const purchaseSteps: PurchaseStep[] = [
  {
    id: 'account',
    title: {
      en: 'Create or login to your account',
      es: 'Crea o entra a tu cuenta',
    },
    detail: {
      en: 'Your account secures access to your purchased plan.',
      es: 'Tu cuenta asegura acceso al plan comprado.',
    },
  },
  {
    id: 'checkout',
    title: {
      en: 'Complete secure checkout',
      es: 'Completa checkout seguro',
    },
    detail: {
      en: 'Choose your plan and finish payment with your selected currency.',
      es: 'Elige tu plan y termina el pago con la moneda seleccionada.',
    },
  },
  {
    id: 'onboard',
    title: {
      en: 'Download and start',
      es: 'Descarga y empieza',
    },
    detail: {
      en: 'Download Tado from GitHub releases and spawn your first agent team.',
      es: 'Descarga Tado desde GitHub releases y crea tu primer equipo de agentes.',
    },
  },
];

export const trustPoints = {
  en: [
    'MIT licensed — inspect and modify freely.',
    'Built natively for macOS with SwiftUI and AppKit.',
    'No cloud dependency — everything runs on your Mac.',
  ],
  es: [
    'Licencia MIT — inspecciona y modifica libremente.',
    'Construido nativamente para macOS con SwiftUI y AppKit.',
    'Sin dependencia de nube — todo corre en tu Mac.',
  ],
};

export const visionLines = {
  en: {
    title: 'Why Tado exists',
    body: 'I built Tado because coordinating multiple AI agents should not require writing orchestration code. It should be as simple as typing a task.',
  },
  es: {
    title: 'Por que existe Tado',
    body: 'Construi Tado porque coordinar multiples agentes IA no deberia requerir escribir codigo de orquestacion. Deberia ser tan simple como escribir una tarea.',
  },
};
