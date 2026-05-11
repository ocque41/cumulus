import type { MarketingProductBrief } from './schema';

const productOrder: MarketingProductBrief['product'][] = ['rune', 'enterprise', 'blocks', 'hub', 'notes'];

const productStatus: Record<MarketingProductBrief['product'], MarketingProductBrief['status']> = {
  rune: 'active',
  enterprise: 'building',
  blocks: 'building',
  hub: 'active',
  notes: 'active',
};

const copy: Record<MarketingProductBrief['product'], Omit<MarketingProductBrief, 'product' | 'status'>> = {
  rune: {
    title: {
      en: 'Canvas',
      es: 'Canvas',
    },
    oneLiner: {
      en: 'The infinite workspace for AI agent sessions.',
      es: 'El espacio de trabajo infinito para sesiones de agentes IA.',
    },
    outcome: {
      en: 'Use it when you need to see and manage 10+ agent terminals at once.',
      es: 'Usalo cuando necesites ver y gestionar 10+ terminales de agentes a la vez.',
    },
    whoFor: {
      en: 'Developers running parallel AI agents across multiple projects.',
      es: 'Desarrolladores ejecutando agentes IA en paralelo a traves de multiples proyectos.',
    },
    capabilities: {
      en: ['Pannable & zoomable 2D surface', 'Project-based zone separation', 'Resizable & moveable tiles'],
      es: ['Superficie 2D paneable y con zoom', 'Separacion por zonas de proyecto', 'Tiles redimensionables y movibles'],
    },
  },
  enterprise: {
    title: {
      en: 'IPC',
      es: 'IPC',
    },
    oneLiner: {
      en: 'Real-time agent-to-agent communication system.',
      es: 'Sistema de comunicacion en tiempo real entre agentes.',
    },
    outcome: {
      en: 'Use it when agents need to discover peers, share output, and coordinate tasks.',
      es: 'Usalo cuando los agentes necesiten descubrir pares, compartir resultados y coordinar tareas.',
    },
    whoFor: {
      en: 'Teams building multi-agent workflows that require coordination.',
      es: 'Equipos construyendo flujos multi-agente que requieren coordinacion.',
    },
    capabilities: {
      en: ['Peer discovery via tado-list', 'Direct messaging via tado-send', 'Pub/sub topics via tado-broadcast'],
      es: ['Descubrimiento de pares via tado-list', 'Mensajeria directa via tado-send', 'Topicos pub/sub via tado-broadcast'],
    },
  },
  blocks: {
    title: {
      en: 'Teams',
      es: 'Equipos',
    },
    oneLiner: {
      en: 'Organized multi-agent coordination with mandatory response rules.',
      es: 'Coordinacion multi-agente organizada con reglas de respuesta obligatoria.',
    },
    outcome: {
      en: 'Use it when you need agents to work together with reliable handoffs.',
      es: 'Usalo cuando necesites que los agentes trabajen juntos con traspasos confiables.',
    },
    whoFor: {
      en: 'Developers coordinating specialized agents across a codebase.',
      es: 'Desarrolladores coordinando agentes especializados en un codebase.',
    },
    capabilities: {
      en: ['Team assignment & coordination rules', 'Mandatory response patterns', 'Agent role definitions'],
      es: ['Asignacion a equipos y reglas de coordinacion', 'Patrones de respuesta obligatoria', 'Definiciones de rol de agente'],
    },
  },
  hub: {
    title: {
      en: 'Projects',
      es: 'Proyectos',
    },
    oneLiner: {
      en: 'Scoped workspaces with auto-discovery of agent definitions.',
      es: 'Espacios de trabajo con alcance y auto-descubrimiento de definiciones de agente.',
    },
    outcome: {
      en: 'Use it when you need agents scoped to specific codebases with auto-discovery.',
      es: 'Usalo cuando necesites agentes acotados a codebases especificos con auto-descubrimiento.',
    },
    whoFor: {
      en: 'Developers managing multiple projects with different agent configurations.',
      es: 'Desarrolladores gestionando multiples proyectos con diferentes configuraciones de agente.',
    },
    capabilities: {
      en: ['Auto-discovers .claude/agents/ and .codex/agents/', 'Project-scoped canvas zones', 'One-click A2A bootstrap'],
      es: ['Auto-descubre .claude/agents/ y .codex/agents/', 'Zonas de canvas por proyecto', 'Bootstrap A2A de un clic'],
    },
  },
  notes: {
    title: {
      en: 'MCP',
      es: 'MCP',
    },
    oneLiner: {
      en: 'Model Context Protocol server for native Claude Code integration.',
      es: 'Servidor Model Context Protocol para integracion nativa con Claude Code.',
    },
    outcome: {
      en: 'Use it when you want Claude Code to access Tado tools natively via MCP.',
      es: 'Usalo cuando quieras que Claude Code acceda a las herramientas de Tado nativamente via MCP.',
    },
    whoFor: {
      en: 'Claude Code users who want native Tado integration without manual setup.',
      es: 'Usuarios de Claude Code que quieren integracion nativa con Tado sin configuracion manual.',
    },
    capabilities: {
      en: ['Auto-registers on launch', 'TypeScript MCP server', 'Native tool access for Claude Code'],
      es: ['Se registra automaticamente al iniciar', 'Servidor MCP en TypeScript', 'Acceso nativo a herramientas para Claude Code'],
    },
  },
};

export function getMarketingProductBriefs(): MarketingProductBrief[] {
  return productOrder.map((product) => {
    const brief = copy[product];

    return {
      product,
      status: productStatus[product],
      ...brief,
    };
  });
}
