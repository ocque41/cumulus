import type { MarketLocale } from './schema';

export type DomeHeroStat = {
  label: string;
  value: string;
  note: string;
};

export type DomeWorkflowStep = {
  id: string;
  label: string;
  title: string;
  detail: string;
};

export type DomeSurfaceCard = {
  title: string;
  summary: string;
  markdown: string;
};

export type DomeHomeContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroChips: string[];
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroSecondaryHref: string;
  jumpLinks: Array<{ href: string; label: string }>;
  heroStats: DomeHeroStat[];
  editorialMarkdown: string;
  localMarkdown: string;
  architectureMarkdown: string;
  trustMarkdown: string;
  surfacesTitle: string;
  surfacesDescription: string;
  surfaces: DomeSurfaceCard[];
  workflowTitle: string;
  workflowDescription: string;
  workflowSteps: DomeWorkflowStep[];
  finalEyebrow: string;
  finalTitle: string;
  finalBody: string;
  finalCta: string;
};

export const domeHomeContent: Record<MarketLocale, DomeHomeContent> = {
  en: {
    heroEyebrow: 'Tado for macOS',
    heroTitle: 'Run multiple AI agents in parallel. They talk to each other.',
    heroSubtitle:
      'Tado is a native macOS terminal multiplexer for Claude Code and Codex. Spawn agents from a todo list onto an infinite canvas with built-in inter-agent communication.',
    heroChips: ['Native macOS', 'Agent-to-Agent IPC', 'MCP Integration'],
    heroPrimaryCta: 'Download Tado',
    heroSecondaryCta: 'View on GitHub',
    heroSecondaryHref: 'https://github.com/cumulus/tado',
    jumpLinks: [
      { href: '#brief', label: 'Overview' },
      { href: '#system', label: 'Architecture' },
      { href: '#surfaces', label: 'Surfaces' },
      { href: '#workflow', label: 'Workflow' },
    ],
    heroStats: [
      {
        label: 'Agent Communication',
        value: 'Built-in IPC',
        note: 'Agents discover peers, read output, and send messages in real time.',
      },
      {
        label: 'Infinite Canvas',
        value: 'Pannable & Zoomable',
        note: 'Terminal tiles on a 2D canvas with project-based zones.',
      },
      {
        label: 'Multi-Engine',
        value: 'Claude Code & Codex',
        note: 'Switch engines per agent with configurable modes and effort levels.',
      },
      {
        label: 'Team Coordination',
        value: 'Projects & Teams',
        note: 'Organize agents into teams with mandatory response rules.',
      },
    ],
    editorialMarkdown: `
## What Tado is

Tado is a native macOS app that turns your todo list into a terminal multiplexer for AI coding agents.

- Type a task, press Enter, and a terminal tile spawns on the canvas.
- Each tile runs Claude Code or OpenAI Codex.
- Agents discover each other via built-in IPC tools.
- Teams and projects keep multi-agent work organized and accountable.

Most multi-agent setups require custom orchestration code. Tado gives you the canvas and the communication layer out of the box.

> Parallel agents, real-time coordination, and a todo list that actually does the work.
`,
    localMarkdown: `
## Native macOS, no cloud dependency

- SwiftUI + AppKit native app.
- No hosted backend or cloud account required.
- File-based IPC at \`/tmp/tado-ipc/\`.
- SwiftData persistence — todos, sessions, and settings survive restart.
- MCP server auto-registers on launch for native Claude Code integration.

That combination matters. It removes the infrastructure overhead that usually makes multi-agent setups fragile and hard to debug.
`,
    architectureMarkdown: `
## How it works

| Layer | Job | Why it matters |
| --- | --- | --- |
| Todo List | Task capture and agent spawning | One input creates one terminal session |
| Canvas | Spatial layout for terminal tiles | See all agents at once, grouped by project |
| IPC System | Agent-to-agent communication | Peer discovery, message passing, pub/sub topics |
| Teams & Projects | Organizational hierarchy | Agent definitions, coordination rules, project scoping |

\`\`\`text
tado/
  Todo List
    -> spawns terminal tiles on Enter
  Canvas (infinite 2D surface)
    [tile 1,1] claude-code @ project-a
    [tile 1,2] codex @ project-a
    [tile 2,1] claude-code @ project-b
  IPC (/tmp/tado-ipc/)
    sessions/{id}/inbox/
    sessions/{id}/outbox/
    sessions/{id}/log
    a2a-inbox/
\`\`\`
`,
    trustMarkdown: `
## Why the IPC model matters

Tado does not use a central orchestrator to direct agents. Each agent discovers peers and communicates directly.

1. \`tado-list\` discovers all active sessions with ID, engine, grid position, and status.
2. \`tado-read\` reads another agent's terminal output with tail, follow, and raw modes.
3. \`tado-send\` sends typed input to any session by UUID, grid coordinates, or name.
4. \`tado-broadcast\` publishes to pub/sub topics for decoupled communication.

That gives developers something most multi-agent tools lack: transparent, debuggable inter-agent communication.
`,
    surfacesTitle: 'Four surfaces that make multi-agent work legible',
    surfacesDescription:
      'These are the parts that turn Tado from a terminal emulator into a multi-agent coordination tool.',
    surfaces: [
      {
        title: 'Infinite Canvas',
        summary: 'Pannable, zoomable workspace. Terminal tiles grouped by project zones.',
        markdown: `
- Drag edges to resize tiles. Drag the title bar to move them.
- Each project gets its own zone on the canvas.
- 10+ agents visible at once without tab switching.
`,
      },
      {
        title: 'Agent IPC',
        summary: 'Built-in communication. Agents list peers, read output, send messages, broadcast.',
        markdown: `
- \`tado-list\` for peer discovery
- \`tado-read\` and \`tado-send\` for direct messaging
- \`tado-broadcast\` and \`tado-recv\` for pub/sub topics
`,
      },
      {
        title: 'Teams & Projects',
        summary: 'Hierarchical organization. Agent discovery, team assignment, project scoping.',
        markdown: `
- Auto-discovers agent definitions from \`.claude/agents/\` and \`.codex/agents/\`
- Named teams with coordination rules
- Mandatory response patterns for reliable handoffs
`,
      },
      {
        title: 'Prompt Queue',
        summary: 'Activity-aware queuing. Follow-up prompts auto-send when agent goes idle.',
        markdown: `
- Queue prompts for any running session
- Activity detection triggers auto-send on idle
- Forward mode routes your next input to a specific terminal
`,
      },
    ],
    workflowTitle: 'How a session runs in Tado',
    workflowDescription:
      'The loop is simple on purpose. Type a task, watch the agent work, coordinate across sessions, inspect results.',
    workflowSteps: [
      {
        id: 'capture',
        label: 'Step 01',
        title: 'Type a task in the todo list',
        detail: 'Describe what you need done. Press Enter. A terminal tile spawns on the canvas running your chosen engine.',
      },
      {
        id: 'plan',
        label: 'Step 02',
        title: 'Terminal tile spawns on the canvas',
        detail: 'The agent starts working immediately in its own tile. Claude Code or Codex runs with your project context.',
      },
      {
        id: 'schedule',
        label: 'Step 03',
        title: 'Agents communicate via IPC',
        detail: 'Agents discover peers, read each other\'s output, send messages, and coordinate using built-in CLI tools.',
      },
      {
        id: 'review',
        label: 'Step 04',
        title: 'Inspect results and queue follow-ups',
        detail: 'Review what each agent produced. Queue follow-up prompts that auto-send when the agent goes idle. Mark tasks done.',
      },
    ],
    finalEyebrow: 'Developer fit',
    finalTitle: 'Tado is the right tool when you need multiple AI agents working together on the same problem.',
    finalBody:
      'If your work involves coordinating AI agents across a codebase — frontend and backend in parallel, code generation and review side by side, architecture planning with specialized agents — Tado gives you the canvas and the communication layer.',
    finalCta: 'Get Started',
  },
  es: {
    heroEyebrow: 'Tado para macOS',
    heroTitle: 'Ejecuta multiples agentes IA en paralelo. Se comunican entre si.',
    heroSubtitle:
      'Tado es un multiplexor de terminales nativo para macOS, para Claude Code y Codex. Crea agentes desde una lista de tareas en un canvas infinito con comunicacion integrada entre agentes.',
    heroChips: ['macOS Nativo', 'IPC entre Agentes', 'Integracion MCP'],
    heroPrimaryCta: 'Descargar Tado',
    heroSecondaryCta: 'Ver en GitHub',
    heroSecondaryHref: 'https://github.com/cumulus/tado',
    jumpLinks: [
      { href: '#brief', label: 'Vista general' },
      { href: '#system', label: 'Arquitectura' },
      { href: '#surfaces', label: 'Superficies' },
      { href: '#workflow', label: 'Flujo' },
    ],
    heroStats: [
      {
        label: 'Comunicacion entre agentes',
        value: 'IPC integrado',
        note: 'Los agentes descubren pares, leen resultados y envian mensajes en tiempo real.',
      },
      {
        label: 'Canvas infinito',
        value: 'Paneable y con zoom',
        note: 'Terminales en un canvas 2D con zonas por proyecto.',
      },
      {
        label: 'Multi-motor',
        value: 'Claude Code y Codex',
        note: 'Cambia de motor por agente con modos y niveles de esfuerzo configurables.',
      },
      {
        label: 'Coordinacion de equipos',
        value: 'Proyectos y equipos',
        note: 'Organiza agentes en equipos con reglas de respuesta obligatoria.',
      },
    ],
    editorialMarkdown: `
## Que es Tado

Tado es una app nativa de macOS que convierte tu lista de tareas en un multiplexor de terminales para agentes de codificacion IA.

- Escribe una tarea, presiona Enter, y un terminal aparece en el canvas.
- Cada tile ejecuta Claude Code o OpenAI Codex.
- Los agentes se descubren entre si mediante herramientas IPC integradas.
- Equipos y proyectos mantienen organizado y responsable el trabajo con multiples agentes.

La mayoria de setups multi-agente requieren codigo de orquestacion personalizado. Tado te da el canvas y la capa de comunicacion listo para usar.

> Agentes en paralelo, coordinacion en tiempo real, y una lista de tareas que realmente hace el trabajo.
`,
    localMarkdown: `
## macOS nativo, sin dependencia de nube

- App nativa con SwiftUI + AppKit.
- Sin backend alojado ni cuenta cloud requerida.
- IPC basado en archivos en \`/tmp/tado-ipc/\`.
- Persistencia con SwiftData — tareas, sesiones y configuracion sobreviven al reinicio.
- El servidor MCP se registra automaticamente al iniciar para integracion nativa con Claude Code.

Esa combinacion importa. Elimina la carga de infraestructura que suele hacer fragiles y dificiles de depurar los setups multi-agente.
`,
    architectureMarkdown: `
## Como funciona

| Capa | Trabajo | Por que importa |
| --- | --- | --- |
| Lista de tareas | Captura de tareas y creacion de agentes | Un input crea una sesion de terminal |
| Canvas | Disposicion espacial de terminales | Ve todos los agentes a la vez, agrupados por proyecto |
| Sistema IPC | Comunicacion entre agentes | Descubrimiento de pares, paso de mensajes, topicos pub/sub |
| Equipos y proyectos | Jerarquia organizativa | Definiciones de agente, reglas de coordinacion, alcance por proyecto |

\`\`\`text
tado/
  Lista de Tareas
    -> crea terminales al presionar Enter
  Canvas (superficie 2D infinita)
    [tile 1,1] claude-code @ proyecto-a
    [tile 1,2] codex @ proyecto-a
    [tile 2,1] claude-code @ proyecto-b
  IPC (/tmp/tado-ipc/)
    sessions/{id}/inbox/
    sessions/{id}/outbox/
    sessions/{id}/log
    a2a-inbox/
\`\`\`
`,
    trustMarkdown: `
## Por que importa el modelo IPC

Tado no usa un orquestador central para dirigir agentes. Cada agente descubre pares y se comunica directamente.

1. \`tado-list\` descubre todas las sesiones activas con ID, motor, posicion en grilla y estado.
2. \`tado-read\` lee la salida de terminal de otro agente con modos tail, follow y raw.
3. \`tado-send\` envia input a cualquier sesion por UUID, coordenadas de grilla o nombre.
4. \`tado-broadcast\` publica en topicos pub/sub para comunicacion desacoplada.

Eso da a los desarrolladores algo que falta en la mayoria de herramientas multi-agente: comunicacion transparente y depurable entre agentes.
`,
    surfacesTitle: 'Cuatro superficies que hacen legible el trabajo multi-agente',
    surfacesDescription:
      'Estas piezas convierten a Tado de un emulador de terminal en una herramienta de coordinacion multi-agente.',
    surfaces: [
      {
        title: 'Canvas infinito',
        summary: 'Espacio paneable y con zoom. Terminales agrupados por zonas de proyecto.',
        markdown: `
- Arrastra bordes para redimensionar. Arrastra la barra de titulo para mover.
- Cada proyecto tiene su propia zona en el canvas.
- 10+ agentes visibles a la vez sin cambiar pestanas.
`,
      },
      {
        title: 'IPC entre agentes',
        summary: 'Comunicacion integrada. Los agentes listan pares, leen salida, envian mensajes, publican.',
        markdown: `
- \`tado-list\` para descubrimiento de pares
- \`tado-read\` y \`tado-send\` para mensajeria directa
- \`tado-broadcast\` y \`tado-recv\` para topicos pub/sub
`,
      },
      {
        title: 'Equipos y proyectos',
        summary: 'Organizacion jerarquica. Descubrimiento de agentes, asignacion a equipos, alcance por proyecto.',
        markdown: `
- Auto-descubre definiciones de agente de \`.claude/agents/\` y \`.codex/agents/\`
- Equipos con nombre y reglas de coordinacion
- Patrones de respuesta obligatoria para traspasos confiables
`,
      },
      {
        title: 'Cola de prompts',
        summary: 'Cola con deteccion de actividad. Los prompts de seguimiento se envian cuando el agente queda libre.',
        markdown: `
- Encola prompts para cualquier sesion activa
- Deteccion de actividad dispara envio automatico en reposo
- Modo forward enruta tu siguiente input a un terminal especifico
`,
      },
    ],
    workflowTitle: 'Como corre una sesion en Tado',
    workflowDescription:
      'El bucle es simple a proposito. Escribe una tarea, observa al agente trabajar, coordina entre sesiones, inspecciona resultados.',
    workflowSteps: [
      {
        id: 'capture',
        label: 'Paso 01',
        title: 'Escribe una tarea en la lista',
        detail: 'Describe lo que necesitas. Presiona Enter. Un terminal aparece en el canvas ejecutando el motor elegido.',
      },
      {
        id: 'plan',
        label: 'Paso 02',
        title: 'El terminal aparece en el canvas',
        detail: 'El agente empieza a trabajar inmediatamente en su propio tile. Claude Code o Codex corre con el contexto de tu proyecto.',
      },
      {
        id: 'schedule',
        label: 'Paso 03',
        title: 'Los agentes se comunican via IPC',
        detail: 'Los agentes descubren pares, leen la salida de otros, envian mensajes y se coordinan usando herramientas CLI integradas.',
      },
      {
        id: 'review',
        label: 'Paso 04',
        title: 'Inspecciona resultados y encola seguimientos',
        detail: 'Revisa lo que produjo cada agente. Encola prompts de seguimiento que se envian cuando el agente queda libre. Marca tareas como completadas.',
      },
    ],
    finalEyebrow: 'Para desarrolladores',
    finalTitle: 'Tado es la herramienta correcta cuando necesitas multiples agentes IA trabajando juntos en el mismo problema.',
    finalBody:
      'Si tu trabajo implica coordinar agentes IA en un codebase — frontend y backend en paralelo, generacion y revision de codigo lado a lado, planificacion de arquitectura con agentes especializados — Tado te da el canvas y la capa de comunicacion.',
    finalCta: 'Comenzar',
  },
};
