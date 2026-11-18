// Reproducible business personas for real-world discovery benchmark.
// Each persona tests distinct failure modes: vague vision, conflicting constraints, non-technical
// vocabulary, runaway feature creep, mid-flight design revisions, and hidden operational complexity.

export const PERSONAS = [
  {
    id: 'vague-visionary',
    title: 'The Vague Visionary (Coffee Notes)',
    archetype: 'minimal-surface-large-depth',
    mode: 'lite',
    userProfile: {
      role: 'Coffee Roaster & Cafe Owner',
      technicalLiteracy: 'low',
      style: 'casual, enthusiastic, ambiguous',
    },
    turns: [
      {
        turn: 1,
        userMessage: 'I want an app like Instagram but for coffee beans. Really sleek and quick so baristas can log roast profiles between shifts.',
      },
      {
        turn: 2,
        userMessage: 'Mostly browsing roast logs and seeing which beans scored highest. No accounts needed right now, just local on the iPad at the shop.',
      },
      {
        turn: 3,
        userMessage: 'Yeah exactly, simple single list pushing to roast details. The Focus-First native defaults are great. Go ahead and generate the brief.',
      },
      {
        turn: 4,
        userMessage: 'The brief, screens, and amber design look great. I approve this blueprint—go ahead and build the app.',
      },
    ],
    expectedArtDirection: {
      hierarchy: 'action-led',
      motion: 'fluid',
      pacing: 'comfortable',
      preset: 'minimal-pro',
      palette: 'amber',
    },
    expectations: {
      primaryExperience: 'browse-collection',
      avoidJargon: ['SQL', 'schema', 'routing', 'AST', 'ORM'],
      scriptedConflict: false,
      expectedEntities: ['roast', 'bean'],
      scopeExclusionExpected: false, // lite project with single focused scope
    },
  },

  {
    id: 'contradictory-client',
    title: 'The Contradictory Client (Field Inspector)',
    archetype: 'hard-conflict-resolution',
    mode: 'standard',
    userProfile: {
      role: 'Industrial Safety Director',
      technicalLiteracy: 'medium',
      style: 'assertive, demanding, conflicting requirements',
    },
    turns: [
      {
        turn: 1,
        userMessage: 'We inspect grain silos. The app must work 100% offline in concrete basements with zero user accounts or logins. Safety audits are recorded locally.',
      },
      {
        turn: 2,
        userMessage: 'Also, our headquarters manager in Chicago needs to see every silo audit report live in real time as the inspector completes it.',
      },
      {
        turn: 3,
        userMessage: 'I see the conflict. Let us make offline audit completion the priority for v1 with manual cloud sync when back in Wi-Fi range. We will handle user logins then.',
      },
    ],
    expectedArtDirection: {
      hierarchy: 'action-led',
      motion: 'deliberate',
      pacing: 'dense',
      preset: 'fintech-midnight',
      palette: 'midnight',
    },
    expectations: {
      primaryExperience: 'form-entry',
      scriptedConflict: true,
      conflictKey: 'identity.required', // or data.persistence / sync
      requiresTradeoffExplanation: true,
      avoidJargon: ['CRDT', 'eventual consistency', 'REST endpoint', 'JWT'],
    },
  },

  {
    id: 'non-technical-founder',
    title: 'The Non-Technical Founder (Artisan Pâtisserie)',
    archetype: 'poetic-aesthetic-translation',
    mode: 'lite',
    userProfile: {
      role: 'Master Baker & Shop Owner',
      technicalLiteracy: 'none',
      style: 'poetic, sensory, non-technical',
    },
    turns: [
      {
        turn: 1,
        userMessage: 'I run an artisan pastry kitchen. I need an inventory book for our daily flour, wild yeast, and seasonal fruit. I want something warm, botanical, earthy, like a personal field journal. Nothing corporate or cold.',
      },
      {
        turn: 2,
        userMessage: 'My bakers have flour on their hands, so large readable cards, calm pacing, and very few buttons. We track batches twice a day.',
      },
      {
        turn: 3,
        userMessage: 'That captures our kitchen perfectly. Please document this and show me the plan.',
      },
    ],
    expectedArtDirection: {
      hierarchy: 'editorial',
      motion: 'subtle',
      pacing: 'spacious',
      preset: 'wellness-botanical',
      palette: 'emerald',
      layoutVariant: 'editorial-feature',
    },
    expectations: {
      primaryExperience: 'browse-collection',
      avoidJargon: ['SQLite', 'REST', 'CRUD', 'AsyncStorage', 'Flexbox'],
      scriptedConflict: false,
      artDirectionPreservation: true,
    },
  },

  {
    id: 'feature-creeper',
    title: 'The Feature Creeper (Tool Share)',
    archetype: 'boundary-and-scope-discipline',
    mode: 'standard',
    userProfile: {
      role: 'Community Organizer',
      technicalLiteracy: 'low',
      style: 'enthusiastic, unfocused, additive',
    },
    turns: [
      {
        turn: 1,
        userMessage: 'I want a simple neighborhood tool-lending app so neighbors can borrow lawnmowers, drills, and ladders for free.',
      },
      {
        turn: 2,
        userMessage: 'Oh, and we also need live GPS tracking on the lawnmowers, in-app crypto tipping, video streaming tutorials for power tools, and background check verification for everyone!',
      },
      {
        turn: 3,
        userMessage: 'You are right, GPS and crypto are way too much for a pilot. Let us exclude live tracking and payments for v1 and just focus on tool availability and reservations.',
      },
    ],
    expectedArtDirection: {
      hierarchy: 'action-led',
      motion: 'fluid',
      pacing: 'comfortable',
      preset: 'minimal-pro',
      palette: 'default',
    },
    expectations: {
      primaryExperience: 'browse-collection',
      scriptedConflict: false,
      scopeExclusionExpected: true,
      expectedExclusions: ['live-tracking', 'payments-crypto', 'video-streaming'],
    },
  },

  {
    id: 'changing-mind',
    title: 'The Changing-Mind Client (Architectural Gallery)',
    archetype: 'revision-without-residue',
    mode: 'standard',
    userProfile: {
      role: 'Design Principal',
      technicalLiteracy: 'high',
      style: 'perfectionist, decisive, undergoes complete aesthetic pivot',
    },
    turns: [
      {
        turn: 1,
        userMessage: 'We are creating a mobile portfolio for our modern architecture studio. Make it super compact, dense, high-contrast monochrome with dark mode only.',
      },
      {
        turn: 2,
        userMessage: 'Stop—I just spoke with our lead partner. Scrap the dark minimal tech aesthetic entirely. We want warm editorial luxury, spacious white backgrounds, serif typography, and generous photo bleed frames.',
      },
      {
        turn: 3,
        userMessage: 'Yes, that revised direction with editorial luxury and spacious pacing is correct. Please confirm the brief.',
      },
    ],
    expectedArtDirection: {
      hierarchy: 'media-led',
      motion: 'subtle',
      pacing: 'spacious',
      preset: 'editorial-luxury',
      palette: 'kyoto',
      layoutVariant: 'immersive-bleed',
    },
    expectations: {
      primaryExperience: 'media-showcase',
      scriptedPivot: true,
      replacesPreviousPreferences: true,
      residualPreferencesForbidden: ['dark-mode-only', 'dense'],
    },
  },

  {
    id: 'hidden-complexity',
    title: 'The Business Owner With Hidden Complexity (Barber Studio)',
    archetype: 'latent-operational-reality',
    mode: 'standard',
    userProfile: {
      role: 'Barbershop Owner',
      technicalLiteracy: 'low',
      style: 'practical, busy, unaware of technical booking edge cases',
    },
    turns: [
      {
        turn: 1,
        userMessage: 'I have a 4-chair barbershop. I just need a simple screen where clients pick a haircut and book a time slot with my barbers.',
      },
      {
        turn: 2,
        userMessage: 'Good questions. Yes, each barber has different days off, haircuts take 30 or 45 minutes, clients need to cancel at least 2 hours before, and we need their mobile number for SMS reminders.',
      },
      {
        turn: 3,
        userMessage: 'Exactly. Booking slot validation and cancellation cutoff are crucial, but keep the client interface dead simple: select barber, select time, confirm.',
      },
    ],
    expectedArtDirection: {
      hierarchy: 'action-led',
      motion: 'fluid',
      pacing: 'comfortable',
      preset: 'kyoto-craft',
      palette: 'kyoto',
    },
    expectations: {
      primaryExperience: 'guided-setup',
      latentComplexityUncovered: ['staff-availability', 'service-duration', 'cancellation-cutoff'],
      avoidJargon: ['cron', 'race condition', 'distributed lock', 'SMS gateway API'],
    },
  },
];

export const UNSEEN_PERSONAS = [
  {
    id: 'emergency-dispatch',
    title: 'The Urgent Contractor (Emergency Plumber Dispatch)',
    archetype: 'urgent-single-action',
    mode: 'standard',
    userProfile: {
      role: 'Master Plumber & Fleet Owner',
      technicalLiteracy: 'low',
      style: 'direct, urgent, pragmatic',
    },
    turns: [
      {
        turn: 1,
        userMessage: 'I run a 24/7 emergency plumbing service with 3 vans. When a pipe bursts at 2 AM, I need a massive red NEW EMERGENCY button that shows the customer address, water valve shutoff location, and lets my on-call tech accept the dispatch with one tap.',
      },
      {
        turn: 2,
        userMessage: 'Style should be high-contrast dark mode with high-visibility emergency red accents, super dense so the tech does not have to scroll with wet gloved hands. Definitely no accounts or logins for the customer; they just call or submit a web form that pings the tech.',
      },
      {
        turn: 3,
        userMessage: 'Yeah, single-screen dispatch queue with tap-to-call and map route. The dense dark emergency style sounds perfect. Go ahead and build the brief.',
      },
    ],
    expectedArtDirection: {
      hierarchy: 'action-led',
      motion: 'subtle',
      pacing: 'dense',
      preset: 'fintech-midnight',
      palette: 'crimson',
    },
    expectations: {
      primaryExperience: 'emergency-dispatch',
      avoidJargon: ['websockets', 'GPS polling', 'JWT', 'daemon', 'FCM'],
      scriptedConflict: false,
      artDirectionPreservation: true,
      scopeExclusionExpected: false,
    },
  },

  {
    id: 'boutique-subscription',
    title: 'The Artisanal Curator (Petal & Stem Floral Club)',
    archetype: 'sensory-luxury-commerce',
    mode: 'lite',
    userProfile: {
      role: 'Creative Floral Director',
      technicalLiteracy: 'none',
      style: 'poetic, visual, brand-conscious',
    },
    turns: [
      {
        turn: 1,
        userMessage: 'We curate luxury seasonal flower arrangements delivered weekly to homes and boutique hotels. I want subscribers to swipe through lush photos of next week blooms and swap a vase style or skip a delivery week.',
      },
      {
        turn: 2,
        userMessage: 'Our brand is very romantic and airy—lots of soft white space, muted sage greens and dusty rose, delicate serif headlines, and big full-bleed photography. Please, nothing that looks like a sterile delivery dashboard!',
      },
      {
        turn: 3,
        userMessage: 'Yes, swiping between the weekly arrangement cards with the skip button right below is exactly right. Keep it soft and serene. Save the brief.',
      },
    ],
    expectedArtDirection: {
      hierarchy: 'media-led',
      motion: 'subtle',
      pacing: 'spacious',
      preset: 'wellness-botanical',
      palette: 'emerald',
    },
    expectations: {
      primaryExperience: 'media-showcase',
      avoidJargon: ['REST endpoint', 'Stripe webhook', 'JSON blob', 'CDN'],
      scriptedConflict: false,
      artDirectionPreservation: true,
      scopeExclusionExpected: false,
    },
  },
];

export const ALL_PERSONAS = [...PERSONAS, ...UNSEEN_PERSONAS];

