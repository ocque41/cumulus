import type {
  DailyFlowStep,
  MarketingHomeContent,
  MarketingModelsContent,
  PurchaseStep,
  SelectorPersona,
} from './schema';

export const homeContent: MarketingHomeContent = {
  heroEyebrow: {
    en: 'Cumulus Create',
    es: 'Cumulus Create',
  },
  heroTitle: {
    en: 'Create a Cumulus app.',
    es: 'Crea una app Cumulus.',
  },
  heroSubtitle: {
    en: 'Run npm create @cmls@latest my-acme and choose the parts.',
    es: 'Ejecuta npm create @cmls@latest my-acme y elige las partes.',
  },
  heroPrimaryCta: {
    en: 'Build command',
    es: 'Crear comando',
  },
  heroSecondaryCta: {
    en: 'Dashboard',
    es: 'Dashboard',
  },
  selectorTitle: {
    en: 'What should the command include?',
    es: 'Que debe incluir el comando?',
  },
  selectorDescription: {
    en: 'Pick the app shape, auth mode, DB mode, and parts.',
    es: 'Elige forma de app, auth, modo DB y partes.',
  },
  federationTitle: {
    en: 'One command',
    es: 'Un comando',
  },
  federationDescription: {
    en: 'The command writes app files, env examples, scripts, and selected Cumulus parts.',
    es: 'El comando escribe archivos, ejemplos de env, scripts y partes Cumulus elegidas.',
  },
  flowTitle: {
    en: 'How it starts',
    es: 'Como empieza',
  },
  flowDescription: {
    en: 'Choose flags, copy the command, run it, then start the generated app.',
    es: 'Elige flags, copia el comando, ejecutalo y arranca la app generada.',
  },
  accessTitle: {
    en: 'What you choose',
    es: 'Que eliges',
  },
  accessDescription: {
    en: 'Templates, Relay auth, Cumulus DB, Knowledge, install, and git.',
    es: 'Templates, auth de Relay, Cumulus DB, Knowledge, install y git.',
  },
  pricingBridgeTitle: {
    en: 'Ready to create?',
    es: 'Listo para crear?',
  },
  pricingBridgeDescription: {
    en: 'Start with npm create @cmls@latest my-acme.',
    es: 'Empieza con npm create @cmls@latest my-acme.',
  },
  pricingBridgeCta: {
    en: 'Build command',
    es: 'Crear comando',
  },
};

export const modelsContent: MarketingModelsContent = {
  eyebrow: {
    en: 'Cumulus Create',
    es: 'Cumulus Create',
  },
  title: {
    en: 'Build the command',
    es: 'Crea el comando',
  },
  subtitle: {
    en: 'Use the dashboard to choose flags for npm create @cmls@latest my-acme.',
    es: 'Usa el dashboard para elegir flags de npm create @cmls@latest my-acme.',
  },
  comparisonTitle: {
    en: 'Command choices',
    es: 'Opciones del comando',
  },
  comparisonDescription: {
    en: 'Choose template, auth, Cumulus DB, parts, package manager, install, and git.',
    es: 'Elige template, auth, Cumulus DB, partes, gestor, install y git.',
  },
  stepsTitle: {
    en: 'Start in three steps',
    es: 'Empieza en tres pasos',
  },
  stepsDescription: {
    en: 'Build the command, copy it, then run it in your terminal.',
    es: 'Arma el comando, copialo y ejecutalo en la terminal.',
  },
  enterpriseTitle: {
    en: 'Use the command',
    es: 'Usa el comando',
  },
  enterpriseDescription: {
    en: 'npm create @cmls@latest my-acme',
    es: 'npm create @cmls@latest my-acme',
  },
  enterpriseCta: {
    en: 'Build command',
    es: 'Crear comando',
  },
};

export const selectorPersonas: SelectorPersona[] = [
  {
    id: 'operator',
    label: {
      en: 'I want the full app',
      es: 'Quiero la app completa',
    },
    description: {
      en: 'Use full for site, dashboards, API/MCP, docs, auth, signup, and actions.',
      es: 'Usa full para sitio, dashboards, API/MCP, docs, auth, signup y actions.',
    },
    recommendedProducts: ['cumulus-db'],
  },
  {
    id: 'client-services',
    label: {
      en: 'I want the public side',
      es: 'Quiero el lado publico',
    },
    description: {
      en: 'Use outer for site, docs, discovery, signup, and action start.',
      es: 'Usa outer para sitio, docs, discovery, signup e inicio de actions.',
    },
    recommendedProducts: ['cumulus-db'],
  },
  {
    id: 'field-admin',
    label: {
      en: 'I want dashboards',
      es: 'Quiero dashboards',
    },
    description: {
      en: 'Use inner for /me, /dev, settings, API/MCP, auth, and actions.',
      es: 'Usa inner para /me, /dev, settings, API/MCP, auth y actions.',
    },
    recommendedProducts: ['cumulus-db'],
  },
  {
    id: 'founder',
    label: {
      en: 'I want the smallest starter',
      es: 'Quiero el starter pequeno',
    },
    description: {
      en: 'Use agent-auth for discovery, attestation login, signup, and actions.',
      es: 'Usa agent-auth para discovery, login por attestation, signup y actions.',
    },
    recommendedProducts: ['cumulus-db'],
  },
];

export const dailyFlowSteps: DailyFlowStep[] = [
  {
    id: 'choose',
    title: {
      en: 'Choose flags',
      es: 'Elige flags',
    },
    detail: {
      en: 'Pick template, auth, DB mode, parts, package manager, install, and git.',
      es: 'Elige template, auth, modo DB, partes, gestor, install y git.',
    },
  },
  {
    id: 'copy',
    title: {
      en: 'Copy command',
      es: 'Copia comando',
    },
    detail: {
      en: 'The dashboard builds the exact command.',
      es: 'El dashboard arma el comando exacto.',
    },
  },
  {
    id: 'run',
    title: {
      en: 'Run command',
      es: 'Ejecuta comando',
    },
    detail: {
      en: 'Run it in a terminal to create the app.',
      es: 'Ejecutalo en terminal para crear la app.',
    },
  },
  {
    id: 'start',
    title: {
      en: 'Start app',
      es: 'Arranca app',
    },
    detail: {
      en: 'Install when selected, then start the generated app.',
      es: 'Instala si lo elegiste y arranca la app generada.',
    },
  },
];

export const purchaseSteps: PurchaseStep[] = [
  {
    id: 'command',
    title: {
      en: 'Build the command',
      es: 'Crea el comando',
    },
    detail: {
      en: 'Use /dashboard or the short command.',
      es: 'Usa /dashboard o el comando corto.',
    },
  },
  {
    id: 'terminal',
    title: {
      en: 'Run it',
      es: 'Ejecutalo',
    },
    detail: {
      en: 'npm create @cmls@latest my-acme',
      es: 'npm create @cmls@latest my-acme',
    },
  },
  {
    id: 'app',
    title: {
      en: 'Start the app',
      es: 'Arranca la app',
    },
    detail: {
      en: 'Use the generated scripts from the project.',
      es: 'Usa los scripts generados del proyecto.',
    },
  },
];

export const accessPoints = {
  en: [
    'One command creates the app shape.',
    'Hosted and self-hosted Relay choices.',
    'Cloud, local, or both Cumulus DB choices.',
  ],
  es: [
    'Un comando crea la forma de app.',
    'Opciones Relay hosted y self-hosted.',
    'Opciones Cumulus DB cloud, local o both.',
  ],
};

export const visionLines = {
  en: {
    title: 'Why Cumulus Create exists',
    body: 'Starting a Cumulus app should be one command, with clear choices and no setup maze.',
  },
  es: {
    title: 'Por que existe Cumulus Create',
    body: 'Empezar una app Cumulus debe ser un comando, con opciones claras y sin laberinto de setup.',
  },
};
