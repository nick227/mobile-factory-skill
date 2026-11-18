import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as plan from '../../factory-v1/planner.mjs';
import * as orch from '../../factory-v1/orchestrator.mjs';
import { validateResponse } from '../../factory-v1/response-registry.mjs';
import { appendTranscript, applyGuardedResponse } from '../../factory-v1/state-guard.mjs';

/**
 * Adapter interface for interview benchmarking.
 * Explicitly identifies whether a run is a 'live-agent' (Claude/AGY driving the skill)
 * or 'scripted-deterministic' (governance simulation exercising the real factory engine).
 */
export class InterviewAdapter {
  constructor(options = {}) {
    this.model = options.model || process.env.FACTORY_BENCH_MODEL;
    this.mode = options.mode || (this.detectLiveAgent() ? 'live-agent' : 'scripted-deterministic');
  }

  detectLiveAgent() {
    if (process.env.FACTORY_BENCH_MODE === 'live' || process.argv.includes('--live')) {
      for (const exe of ['claude', 'agy']) {
        try {
          const res = spawnSync(exe, ['--version'], { stdio: 'ignore' });
          if (!res.error && res.status === 0) return true;
        } catch {
          // continue
        }
      }
    }
    return false;
  }

  getRunnerMetadata() {
    return {
      runnerMode: this.mode,
      isLiveAgent: this.mode === 'live-agent',
      model: this.model || (this.mode === 'live-agent' ? 'claude-3-7-sonnet' : 'deterministic-engine'),
      warning: this.mode === 'scripted-deterministic'
        ? 'SCRIPTED DETERMINISTIC RUN: Replayed through real factory API without live LLM. Not a live model benchmark.'
        : null,
    };
  }

  /**
   * Run an interview session for a persona.
   * Returns: { transcript, projectState, docs, executionMetadata }
   */
  async runSession(persona, workspaceDir) {
    if (this.mode === 'live-agent') {
      return this.runLiveSession(persona, workspaceDir);
    }
    return this.runScriptedSession(persona, workspaceDir);
  }

  /**
   * Scripted deterministic run: Drives the REAL factory engine (planner, orchestrator, brief)
   * while enforcing the canonical 8 response contracts and State Guard invariants.
   */
  async runScriptedSession(persona, workspaceDir) {
    const projectDir = path.join(workspaceDir, 'app');
    fs.mkdirSync(projectDir, { recursive: true });

    // 1. Initialize project through the real engine
    plan.initProject(projectDir, persona.title.split('(')[0].trim(), persona.mode || 'standard');

    const transcript = [];
    const commandsExecuted = [];

    for (const step of persona.turns) {
      // 1. Immutable User Turn recorded to transcript and State Guard
      appendTranscript(projectDir, {
        role: 'user',
        content: step.userMessage,
        turn: step.turn,
      });

      transcript.push({
        role: 'user',
        turn: step.turn,
        content: step.userMessage,
        timestamp: new Date().toISOString(),
      });

      let agentResponse = '';
      const factsToRecord = [];
      let turnEnvelope = null;

      // Persona-specific handling mapped to canonical response contracts
      if (persona.id === 'vague-visionary') {
        if (step.turn === 1) {
          factsToRecord.push(
            { key: 'product.outcome', value: 'Log coffee roast profiles and ratings between shifts', source: { id: 'chat', quote: 'log roast profiles between shifts' } },
            { key: 'product.audience', value: 'Baristas and coffee roasters', source: { id: 'chat', quote: 'baristas can log roast profiles' } },
            { key: 'experience.primary', value: 'browse-collection', source: { id: 'chat', quote: 'app like Instagram but for coffee beans' } }
          );
          agentResponse = 'Logging roast profiles sounds great. Since you want something quick between shifts, what is the core flow baristas will use most: browsing previous roasts, or entering new roast batches?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'core-flow', prompt: 'What is the core flow baristas will use most: browsing previous roasts, or entering new roast batches?' }],
            },
            next: 'interview',
          };
        } else if (step.turn === 2) {
          factsToRecord.push(
            { key: 'identity.required', value: false, source: { id: 'chat', quote: 'No accounts needed right now, just local' } },
            { key: 'data.persistence', value: 'local device storage', source: { id: 'chat', quote: 'local on the iPad at the shop' } },
            { key: 'experience.hierarchy', value: 'action-led', source: { id: 'chat', quote: 'sleek and quick so baristas can log' } }
          );
          plan.confirm(projectDir, 'all', 'No accounts needed right now, just local on the iPad at the shop');
          agentResponse = 'Local iPad storage with no account sign-in keeps things fast. I propose a simple single-stack navigation with our Focus-First Native amber palette for roast notes. Should I generate the brief?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'generate-brief', prompt: 'Should I generate the brief with simple single-stack navigation and amber palette?' }],
            },
            next: 'confirm',
          };
        } else if (step.turn === 3) {
          plan.confirm(projectDir, 'all', 'simple single list pushing to roast details. The Focus-First native defaults are great');
          agentResponse = 'Project brief generated and decisions saved. Here is the summary of your Coffee Notes application.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['product.outcome', 'product.audience', 'identity.required', 'data.persistence'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'blueprint',
          };
        }
      } else if (persona.id === 'contradictory-client') {
        if (step.turn === 1) {
          factsToRecord.push(
            { key: 'product.outcome', value: 'Conduct grain silo safety audits offline', source: { id: 'chat', quote: 'work 100% offline in concrete basements' } },
            { key: 'product.audience', value: 'Grain silo safety inspectors', source: { id: 'chat', quote: 'inspect grain silos' } },
            { key: 'identity.required', value: false, source: { id: 'chat', quote: 'zero user accounts or logins' } },
            { key: 'data.persistence', value: 'device storage', source: { id: 'chat', quote: 'Safety audits are recorded locally.' } }
          );
          plan.confirm(projectDir, 'all', 'Safety audits are recorded locally.');
          agentResponse = 'Offline silo auditing recorded. Since there are no accounts, audits remain strictly on the local device. Is there any reporting workflow needed outside the basement?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'outside-workflow', prompt: 'Is there any reporting workflow needed outside the basement?' }],
            },
            next: 'interview',
          };
        } else if (step.turn === 2) {
          factsToRecord.push(
            { key: 'identity.required', value: true, source: { id: 'chat', quote: 'headquarters manager in Chicago needs to see every silo audit report live in real time' } }
          );
          agentResponse = 'There is an important architectural trade-off here: live real-time sync to headquarters requires network connectivity and user identity so managers know which silo is being reported. In basements with zero connection, audits must queue locally. Should we prioritize offline completion first with manual sync when connectivity is restored?';
          turnEnvelope = {
            type: 'CONFLICT',
            status: 'detected',
            message: agentResponse,
            payload: {
              conflicts: [{
                key: 'sync.strategy',
                description: 'Real-time sync demands network connectivity, opposing offline basement operation',
                requirementA: 'Offline zero-account basement audits',
                requirementB: 'Live real-time sync to headquarters manager',
                options: ['Prioritize offline completion first with manual sync', 'Require internet connection for live reporting'],
              }],
            },
            next: 'resolve-conflict',
          };
        } else if (step.turn === 3) {
          plan.confirm(projectDir, ['identity.required'], 'make offline audit completion the priority for v1 with manual cloud sync', { 'identity.required': true });
          factsToRecord.push(
            { key: 'experience.hierarchy', value: 'action-led', source: { id: 'chat', quote: 'make offline audit completion the priority' } },
            { key: 'experience.pacing', value: 'dense', source: { id: 'chat', quote: 'silo audit report' } },
            { key: 'design.preset', value: 'fintech-midnight', source: { id: 'chat', quote: 'Safety audits are recorded locally.' } }
          );
          agentResponse = 'Resolved: Offline audit completion is prioritized, with manual sync deferred until Wi-Fi is available. Conflict resolved and decisions updated in the brief.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['sync.strategy', 'identity.required', 'design.preset'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'blueprint',
          };
        }
      } else if (persona.id === 'non-technical-founder') {
        if (step.turn === 1) {
          factsToRecord.push(
            { key: 'product.outcome', value: 'Daily inventory book for flour, wild yeast, and seasonal fruit', source: { id: 'chat', quote: 'inventory book for our daily flour, wild yeast, and seasonal fruit' } },
            { key: 'product.audience', value: 'Pastry bakers and kitchen staff', source: { id: 'chat', quote: 'artisan pastry kitchen' } },
            { key: 'design.direction', value: 'warm, botanical, earthy, personal field journal', source: { id: 'chat', quote: 'warm, botanical, earthy, like a personal field journal. Nothing corporate or cold.' } },
            { key: 'experience.hierarchy', value: 'editorial', source: { id: 'chat', quote: 'like a personal field journal' } },
            { key: 'experience.pacing', value: 'spacious', source: { id: 'chat', quote: 'Nothing corporate or cold.' } },
            { key: 'design.preset', value: 'wellness-botanical', source: { id: 'chat', quote: 'warm, botanical, earthy' } }
          );
          agentResponse = 'A personal field journal for your kitchen is a wonderful direction. To make this comfortable while baking, how often do bakers record ingredient levels during a shift, and what information do they need to see at a glance?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'baker-rhythm', prompt: 'How often do bakers record ingredient levels during a shift?' }],
            },
            next: 'interview',
          };
        } else if (step.turn === 2) {
          factsToRecord.push(
            { key: 'experience.motion', value: 'subtle', source: { id: 'chat', quote: 'large readable cards, calm pacing, and very few buttons' } },
            { key: 'experience.primary', value: 'browse-collection', source: { id: 'chat', quote: 'track batches twice a day' } }
          );
          plan.confirm(projectDir, 'all', 'large readable cards, calm pacing, and very few buttons. We track batches twice a day.');
          agentResponse = 'Understood: Large cards, calm pacing, spacious margins, and emerald botanical styling that feels like a natural field notebook. Everything is prepared for your review.';
          turnEnvelope = {
            type: 'DESIGN',
            status: 'proposed',
            message: agentResponse,
            payload: {
              direction: 'Warm botanical kitchen field journal with emerald tones and calm pacing',
              rationale: 'Matches artisan bakery atmosphere with distraction-free ingredient cards',
              previewReference: 'patterns.focusscreen',
              visualChoices: {
                preset: 'wellness-botanical',
                motion: 'subtle',
                pacing: 'spacious',
              },
            },
            evidence: [{ source: 'chat', quote: 'warm, botanical, earthy' }],
            next: 'confirm',
          };
        } else if (step.turn === 3) {
          agentResponse = 'The design direction and inventory brief are confirmed and documented in your project brief.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['design.direction', 'design.preset', 'experience.motion'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'blueprint',
          };
        }
      } else if (persona.id === 'feature-creeper') {
        if (step.turn === 1) {
          factsToRecord.push(
            { key: 'product.outcome', value: 'Neighborhood tool-lending for lawnmowers, drills, and ladders', source: { id: 'chat', quote: 'neighborhood tool-lending app so neighbors can borrow lawnmowers, drills, and ladders for free' } },
            { key: 'product.audience', value: 'Local neighbors', source: { id: 'chat', quote: 'neighbors can borrow lawnmowers' } },
            { key: 'experience.primary', value: 'browse-collection', source: { id: 'chat', quote: 'borrow lawnmowers, drills, and ladders' } },
            { key: 'experience.hierarchy', value: 'action-led', source: { id: 'chat', quote: 'simple neighborhood tool-lending app so neighbors can borrow' } }
          );
          agentResponse = 'Free community tool sharing is a great initiative. To keep the initial pilot focused, what core steps are needed when someone wants to borrow an available tool?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'borrow-flow', prompt: 'What core steps are needed when someone wants to borrow an available tool?' }],
            },
            next: 'interview',
          };
        } else if (step.turn === 2) {
          factsToRecord.push(
            { key: 'product.excluded', value: ['live-gps-tracking', 'crypto-tipping', 'video-streaming-tutorials', 'background-checks'], source: { id: 'chat', quote: 'live GPS tracking on the lawnmowers, in-app crypto tipping, video streaming tutorials' } }
          );
          agentResponse = 'Adding GPS tracking, crypto payments, and video streaming would significantly expand the scope and cost of our pilot. To launch quickly and test community adoption, I recommend focusing v1 on tool availability and reservations, while reserving GPS and payments for a later version. Would that work for you?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'scope-focus', prompt: 'Would focusing v1 on tool availability and reservations work for you?' }],
            },
            next: 'confirm',
          };
        } else if (step.turn === 3) {
          plan.confirm(projectDir, 'all', 'exclude live tracking and payments for v1 and just focus on tool availability and reservations');
          agentResponse = 'Scope boundaries locked: GPS tracking and crypto tipping are formally marked as excluded for v1, and reservations are documented in the brief.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['product.excluded', 'product.outcome'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'blueprint',
          };
        }
      } else if (persona.id === 'changing-mind') {
        if (step.turn === 1) {
          factsToRecord.push(
            { key: 'product.outcome', value: 'Architecture studio mobile portfolio', source: { id: 'chat', quote: 'mobile portfolio for our modern architecture studio' } },
            { key: 'design.direction', value: 'compact, dense, high-contrast monochrome with dark mode only', source: { id: 'chat', quote: 'super compact, dense, high-contrast monochrome with dark mode only' } },
            { key: 'experience.hierarchy', value: 'action-led', source: { id: 'chat', quote: 'super compact, dense' } },
            { key: 'experience.pacing', value: 'dense', source: { id: 'chat', quote: 'super compact, dense' } }
          );
          agentResponse = 'Monochrome high-contrast portfolio recorded. How would you like potential clients to navigate your project archive: by building type, or through a continuous chronological feed?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'archive-nav', prompt: 'How would you like potential clients to navigate your project archive: by building type, or through a continuous chronological feed?' }],
            },
            next: 'interview',
          };
        } else if (step.turn === 2) {
          factsToRecord.push(
            { key: 'design.direction', value: 'warm editorial luxury, spacious white backgrounds, serif typography, photo bleed', source: { id: 'chat', quote: 'warm editorial luxury, spacious white backgrounds, serif typography, and generous photo bleed frames' } },
            { key: 'experience.hierarchy', value: 'media-led', source: { id: 'chat', quote: 'generous photo bleed frames' } },
            { key: 'experience.pacing', value: 'spacious', source: { id: 'chat', quote: 'spacious white backgrounds' } },
            { key: 'design.preset', value: 'editorial-luxury', source: { id: 'chat', quote: 'editorial luxury' } },
            { key: 'experience.motion', value: 'subtle', source: { id: 'chat', quote: 'warm editorial luxury' } }
          );
          agentResponse = 'Understood—scrapping the dark minimal aesthetic completely. Re-aligning the design contract to warm editorial luxury with spacious white pacing and photo-bleed hero treatments. The previous dark mode choices have been invalidated and replaced.';
          turnEnvelope = {
            type: 'DESIGN',
            status: 'proposed',
            message: agentResponse,
            payload: {
              direction: 'Warm editorial luxury with spacious white backgrounds, serif typography, and generous photo bleed frames',
              rationale: 'Pivot to spacious luxury architectural portfolio highlighting imagery',
              previewReference: 'patterns.focusscreen',
              visualChoices: {
                preset: 'editorial-luxury',
                hierarchy: 'media-led',
                motion: 'subtle',
                pacing: 'monumental',
              },
            },
            evidence: [{ source: 'chat', quote: 'warm editorial luxury' }],
            next: 'confirm',
          };
        } else if (step.turn === 3) {
          plan.confirm(projectDir, 'all', 'revised direction with editorial luxury and spacious pacing is correct');
          agentResponse = 'Editorial luxury art direction preserved and confirmed in the brief. Zero remnant dark-mode settings remain.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['design.direction', 'design.preset', 'experience.hierarchy'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'blueprint',
          };
        }
      } else if (persona.id === 'hidden-complexity') {
        if (step.turn === 1) {
          factsToRecord.push(
            { key: 'product.outcome', value: 'Appointment booking for 4-chair barbershop', source: { id: 'chat', quote: 'simple screen where clients pick a haircut and book a time slot' } },
            { key: 'product.audience', value: 'Barbershop clients', source: { id: 'chat', quote: 'clients pick a haircut and book a time slot' } },
            { key: 'experience.primary', value: 'guided-setup', source: { id: 'chat', quote: 'pick a haircut and book a time slot' } },
            { key: 'experience.hierarchy', value: 'action-led', source: { id: 'chat', quote: 'simple screen where clients pick a haircut and book a time slot' } }
          );
          agentResponse = 'A clean haircut booking experience works very well. To make sure clients don\'t book times when a chair is empty or double-book a barber, do your 4 barbers have separate schedules, and do services take different amounts of time?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'barber-schedules', prompt: 'Do your 4 barbers have separate schedules, and do services take different amounts of time?' }],
            },
            next: 'interview',
          };
        } else if (step.turn === 2) {
          factsToRecord.push(
            { key: 'experience.pacing', value: 'comfortable', source: { id: 'chat', quote: 'each barber has different days off, haircuts take 30 or 45 minutes' } },
            { key: 'business.cancellation-cutoff', value: '2 hours', source: { id: 'chat', quote: 'cancel at least 2 hours before' } },
            { key: 'business.reminders', value: 'SMS reminders to mobile numbers', source: { id: 'chat', quote: 'mobile number for SMS reminders' } }
          );
          plan.confirm(projectDir, 'all', 'booking slot validation and cancellation cutoff are crucial');
          agentResponse = 'Understood: We will handle barber schedules, 30/45 minute slot increments, and the 2-hour cancellation cutoff seamlessly in the background while keeping the client interface to a calm 3-step booking flow.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['business.cancellation-cutoff', 'business.reminders'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'confirm',
          };
        } else if (step.turn === 3) {
          agentResponse = 'Booking logic and clean client flow documented in the brief.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['business.cancellation-cutoff', 'business.reminders', 'brief'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'blueprint',
          };
        }
      } else if (persona.id === 'emergency-dispatch') {
        if (step.turn === 1) {
          factsToRecord.push(
            { key: 'product.outcome', value: 'One-tap 2 AM emergency plumbing dispatch', source: { id: 'chat', quote: 'emergency plumbing service with 3 vans' } },
            { key: 'product.audience', value: 'On-call plumbing technicians', source: { id: 'chat', quote: 'lets my on-call tech accept the dispatch with one tap' } },
            { key: 'experience.primary', value: 'emergency-dispatch', source: { id: 'chat', quote: 'massive red NEW EMERGENCY button' } },
            { key: 'experience.hierarchy', value: 'action-led', source: { id: 'chat', quote: 'massive red NEW EMERGENCY button that shows the customer address' } }
          );
          agentResponse = 'Emergency dispatch queue recorded. When an urgent call arrives, should the tech see turn-by-turn map routing immediately on the same card, or in a separate view?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'map-routing', prompt: 'Should the tech see turn-by-turn map routing immediately on the same card, or in a separate view?' }],
            },
            next: 'interview',
          };
        } else if (step.turn === 2) {
          factsToRecord.push(
            { key: 'identity.required', value: false, source: { id: 'chat', quote: 'no accounts or logins for the customer' } },
            { key: 'design.preset', value: 'fintech-midnight', source: { id: 'chat', quote: 'high-contrast dark mode with high-visibility emergency red accents' } },
            { key: 'experience.pacing', value: 'dense', source: { id: 'chat', quote: 'super dense so the tech does not have to scroll with wet gloved hands' } },
            { key: 'design.palette', value: 'crimson', source: { id: 'chat', quote: 'high-visibility emergency red accents' } }
          );
          plan.confirm(projectDir, 'all', 'high-contrast dark mode with high-visibility emergency red accents, super dense');
          agentResponse = 'High-contrast dark mode with dense spacing and crimson accents recorded. Emergency dispatch actions are optimized for quick one-tap responses.';
          turnEnvelope = {
            type: 'DESIGN',
            status: 'proposed',
            message: agentResponse,
            payload: {
              direction: 'High-contrast dark mode with dense spacing and emergency crimson accents',
              rationale: 'Optimized for night-shift emergency technicians operating with wet gloved hands',
              previewReference: 'patterns.focusscreen',
              visualChoices: {
                preset: 'fintech-midnight',
                hierarchy: 'action-led',
                motion: 'subtle',
                pacing: 'dense',
                palette: 'crimson',
              },
            },
            evidence: [{ source: 'chat', quote: 'high-contrast dark mode with high-visibility emergency red accents' }],
            next: 'confirm',
          };
        } else if (step.turn === 3) {
          plan.confirm(projectDir, 'all', 'single-screen dispatch queue with tap-to-call and map route. The dense dark emergency style sounds perfect');
          agentResponse = 'Emergency dispatch workflow confirmed and recorded in the project brief.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['design.preset', 'design.palette', 'product.outcome'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'blueprint',
          };
        }
      } else if (persona.id === 'boutique-subscription') {
        if (step.turn === 1) {
          factsToRecord.push(
            { key: 'product.outcome', value: 'Weekly luxury floral arrangement curation and subscription scheduling', source: { id: 'chat', quote: 'curate luxury seasonal flower arrangements delivered weekly' } },
            { key: 'product.audience', value: 'Home and boutique hotel floral subscribers', source: { id: 'chat', quote: 'homes and boutique hotels' } },
            { key: 'experience.primary', value: 'media-showcase', source: { id: 'chat', quote: 'swipe through lush photos of next week blooms' } },
            { key: 'experience.hierarchy', value: 'media-led', source: { id: 'chat', quote: 'swipe through lush photos of next week blooms' } }
          );
          agentResponse = 'A luxury weekly floral experience sounds delightful. How would you like members to preview and swap vase options for their weekly delivery?';
          turnEnvelope = {
            type: 'QUESTION',
            status: 'pending',
            message: agentResponse,
            payload: {
              questions: [{ id: 'vase-swap', prompt: 'How would you like members to preview and swap vase options for their weekly delivery?' }],
            },
            next: 'interview',
          };
        } else if (step.turn === 2) {
          factsToRecord.push(
            { key: 'design.preset', value: 'wellness-botanical', source: { id: 'chat', quote: 'lots of soft white space, muted sage greens and dusty rose' } },
            { key: 'experience.pacing', value: 'spacious', source: { id: 'chat', quote: 'lots of soft white space' } },
            { key: 'design.palette', value: 'emerald', source: { id: 'chat', quote: 'muted sage greens and dusty rose' } },
            { key: 'experience.motion', value: 'subtle', source: { id: 'chat', quote: 'delicate serif headlines, and big full-bleed photography' } }
          );
          plan.confirm(projectDir, 'all', 'lots of soft white space, muted sage greens and dusty rose, delicate serif headlines');
          agentResponse = 'Airy botanical aesthetic recorded. We will use emerald accents, generous margins, and expansive full-bleed cards for each bouquet.';
          turnEnvelope = {
            type: 'DESIGN',
            status: 'proposed',
            message: agentResponse,
            payload: {
              direction: 'Romantic and airy botanical luxury with soft white space and full-bleed bloom cards',
              rationale: 'Avoids sterile delivery dashboards in favor of an artisanal editorial showcase',
              previewReference: 'patterns.focusscreen',
              visualChoices: {
                preset: 'wellness-botanical',
                hierarchy: 'media-led',
                motion: 'subtle',
                pacing: 'spacious',
                palette: 'emerald',
              },
            },
            evidence: [{ source: 'chat', quote: 'lots of soft white space, muted sage greens and dusty rose' }],
            next: 'confirm',
          };
        } else if (step.turn === 3) {
          plan.confirm(projectDir, 'all', 'swiping between the weekly arrangement cards with the skip button right below is exactly right. Keep it soft and serene');
          agentResponse = 'Boutique floral club specifications saved in the project brief.';
          turnEnvelope = {
            type: 'PROGRESS',
            status: 'complete',
            message: agentResponse,
            payload: {
              completed: ['design.preset', 'experience.pacing', 'product.outcome'],
              currentSegment: '03-requirements',
              pending: [],
            },
            next: 'blueprint',
          };
        }
      }

      // 2. Machine validation of AI response envelope against discriminated schema
      if (turnEnvelope) {
        validateResponse(turnEnvelope, { throwOnError: true });
        applyGuardedResponse(projectDir, turnEnvelope, {}, { transcript });
      }

      // 3. Apply state changes through factory engine
      if (factsToRecord.length) {
        plan.record(projectDir, factsToRecord);
        commandsExecuted.push(`interview record --file facts.json (${factsToRecord.length} facts)`);
      }

      // 4. Client transcript receives natural conversational text derived from envelope
      transcript.push({
        role: 'assistant',
        turn: step.turn,
        content: turnEnvelope ? turnEnvelope.message : agentResponse,
        envelope: turnEnvelope,
        commands: [...commandsExecuted],
        timestamp: new Date().toISOString(),
      });
    }

    // Finalize brief documentation
    const briefDoc = plan.brief(projectDir, { workflow: orch.summary(projectDir) });

    const finalProject = JSON.parse(fs.readFileSync(path.join(projectDir, '.factory/project.json'), 'utf8'));
    const docs = {
      brief: fs.readFileSync(path.join(projectDir, '.factory/docs/BRIEF.md'), 'utf8'),
      decisions: fs.readFileSync(path.join(projectDir, '.factory/docs/DECISIONS.md'), 'utf8'),
      design: fs.readFileSync(path.join(projectDir, '.factory/docs/DESIGN.md'), 'utf8'),
    };

    return {
      persona,
      transcript,
      projectState: finalProject,
      docs,
      metadata: this.getRunnerMetadata(),
    };
  }

  /**
   * Live agent run: Invokes CLI (claude/agy) in an isolated workspace with the packaged skill.
   * Preserves full conversation context, captures raw AI output, validates response envelopes,
   * enforces the State Guard, and records state changes.
   * If live execution is unavailable, fails explicitly rather than silently falling back.
   */
  async runLiveSession(persona, workspaceDir) {
    const findLiveExe = () => {
      const candidates = [
        process.env.AGY_EXE,
        process.platform === 'win32' ? 'C:\\Users\\Administrator\\.gemini\\bin\\agy.exe' : '/mnt/c/Users/Administrator/.gemini/bin/agy.exe',
        process.platform === 'win32' ? 'C:\\Users\\Administrator\\AppData\\Local\\agy\\bin\\agy.exe' : '/mnt/c/Users/Administrator/AppData/Local/agy/bin/agy.exe',
      ].filter(Boolean);
      for (const c of candidates) {
        if (fs.existsSync(c)) return c;
      }
      try {
        const which = spawnSync('which', ['agy'], { encoding: 'utf8' });
        if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
      } catch {}
      return null;
    };

    const exe = findLiveExe();
    if (!exe) {
      throw new Error('Live execution unavailable: no live agent CLI executable found. Configure AGY_EXE or install agy.');
    }

    // Verify live agent CLI connectivity and authentication
    const ping = spawnSync(exe, ['-p', 'ping', '--model', this.model || 'gemini-3.8-flash-low', '--effort', 'low', '--output-format', 'text'], {
      encoding: 'utf8',
      timeout: 15000,
    });

    if (ping.status !== 0 || !ping.stdout) {
      const err = ping.stderr || ping.error?.message || 'unknown error';
      if (err.includes('Authentication required') || err.includes('accounts.google.com') || err.includes('weekly limit')) {
        throw new Error(
          `Live execution unavailable: CLI authentication or quota limit error: ${err.trim()}. Explicitly failing per benchmark requirements; will not silently fall back to deterministic mode.`
        );
      }
      throw new Error(`Live execution failed: ${err.trim()}`);
    }

    const projectDir = path.join(workspaceDir, 'app');
    fs.mkdirSync(projectDir, { recursive: true });

    plan.initProject(projectDir, persona.title.split('(')[0].trim(), persona.mode || 'standard');

    const transcript = [];
    const commandsExecuted = [];
    const skillPath = path.resolve('skill/SKILL.md');
    const skillContent = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf8') : '';

    const dialogueHistory = [];

    for (const step of persona.turns) {
      appendTranscript(projectDir, {
        role: 'user',
        content: step.userMessage,
        turn: step.turn,
      });

      transcript.push({
        role: 'user',
        turn: step.turn,
        content: step.userMessage,
        timestamp: new Date().toISOString(),
      });

      dialogueHistory.push(`User (Turn ${step.turn}): ${step.userMessage}`);

      const prompt = `You are the Mobile Software Factory AI orchestrator following the instructions in skill/SKILL.md.
${skillContent ? 'Skill excerpt:\n' + skillContent.slice(0, 1500) + '...' : ''}

You are conducting product discovery with a client.
Client Role: ${persona.userProfile.role}
Technical Literacy: ${persona.userProfile.technicalLiteracy}
Communication Style: ${persona.userProfile.style}

Dialogue so far:
${dialogueHistory.join('\n')}

You MUST respond strictly with a valid JSON response envelope matching one of the 8 canonical response contracts:
{
  "type": "QUESTION" | "CONFIRM" | "CONFLICT" | "DESIGN" | "PROGRESS" | "APPROVAL",
  "status": "pending" | "proposed" | "confirmed" | "ready" | "complete",
  "message": "<Natural conversation for client; NO TECHNICAL JARGON like SQL/REST/React>",
  "payload": { ... },
  "evidence": [ { "source": "chat", "quote": "<exact verbatim quote from user>" } ],
  "next": "<action>"
}

Output ONLY the JSON object.`;

      const aiTurn = spawnSync(exe, [
        '-p', prompt,
        '--model', this.model || 'gemini-3.8-flash-low',
        '--effort', 'low',
        '--output-format', 'text',
      ], { encoding: 'utf8', timeout: 45000 });

      if (aiTurn.status !== 0 || !aiTurn.stdout) {
        throw new Error(`Live agent execution failed on turn ${step.turn}: ${aiTurn.stderr || aiTurn.error?.message}`);
      }

      const rawOutput = aiTurn.stdout.trim();
      let envelope = null;
      let validationErrors = [];

      try {
        const match = rawOutput.match(/\{[\s\S]*\}/);
        if (match) {
          envelope = JSON.parse(match[0]);
          const valResult = validateResponse(envelope);
          if (!valResult.valid) {
            validationErrors = valResult.errors;
          } else {
            applyGuardedResponse(projectDir, envelope, {}, { transcript });
          }
        } else {
          validationErrors = ['Failed to locate JSON envelope in raw output'];
        }
      } catch (err) {
        validationErrors = [err.message];
      }

      dialogueHistory.push(`Assistant: ${envelope?.message || rawOutput}`);

      transcript.push({
        role: 'assistant',
        turn: step.turn,
        content: envelope ? envelope.message : rawOutput,
        envelope,
        rawOutput,
        validationErrors: validationErrors.length ? validationErrors : null,
        commands: [...commandsExecuted],
        timestamp: new Date().toISOString(),
      });
    }

    // Finalize brief documentation
    const briefDoc = plan.brief(projectDir, { workflow: orch.summary(projectDir) });

    const finalProject = JSON.parse(fs.readFileSync(path.join(projectDir, '.factory/project.json'), 'utf8'));
    const docs = {
      brief: fs.readFileSync(path.join(projectDir, '.factory/docs/BRIEF.md'), 'utf8'),
      decisions: fs.readFileSync(path.join(projectDir, '.factory/docs/DECISIONS.md'), 'utf8'),
      design: fs.readFileSync(path.join(projectDir, '.factory/docs/DESIGN.md'), 'utf8'),
    };

    return {
      persona,
      transcript,
      projectState: finalProject,
      docs,
      metadata: this.getRunnerMetadata(),
    };
  }
}
