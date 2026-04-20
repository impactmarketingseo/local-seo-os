import type { Client, City, Service } from '@/types';

export const WRITING_RULES = `
RULE 1 — Write like a human, not AI. Vary sentence length.
RULE 2 — NO AI SLOP. Never: 'In today's', 'Nestled', 'Bustling', 'Look no further', 'Comprehensive', 'Cutting-edge', 'Leveraging', 'Rest assured', 'Elevate', 'Empower'
RULE 3 — Keyword: [service] [city] [state] - natural 2-3x
RULE 4 — Local: specific landmarks/neighborhoods, not generic filler
RULE 5 — FAQ: real homeowner questions, 2-3 sentences, include cost + emergency
RULE 6 — Process: 5 steps. Why-choose-us: 5 items. Problems: 6 cards.
`;

export const ANTI_PATTERNS = [
  'In today\'s',
  'In the ever-evolving',
  'Look no further',
  'Welcome to our website',
  'Nestled',
  'Bustling',
  'Vibrant community',
  'Thriving',
  'Tapestry',
  'Beacon of',
  'Testament to',
  'Pivotal',
  'Crucial role',
  'Comprehensive',
  'Cutting-edge',
  'State-of-the-art',
  'Leveraging',
  'Fostering',
  'Cultivating',
  'Showcasing',
  'Underscoring',
  'Navigating',
  'Landscape',
  'Realm',
  'Paradigm',
  'Delve',
  'Dive into',
  'Let\'s explore',
  'Not just',
  'It\'s more than just',
  'Goes beyond',
  'Stands as',
  'Serves as',
  'Functions as',
  'Rest assured',
  'Peace of mind',
  'Myriad',
  'Plethora',
  'Multifaceted',
  'Synergy',
  'Elevate',
  'Empower',
  'Unlock',
  'Unleash',
  'Revolutionize',
  'Whether you\'re',
];

export const OUTPUT_SCHEMA = `
{
  "meta": {
    "title": "string // 50-60 chars. Formula: [Service] [City], [ST] | [Company]",
    "description": "string // 150-160 chars. Includes keyword, CTA, differentiator",
    "h1": "string // [Service] in [City], [State]",
    "slug": "string // e.g., furnace-repair-kaysville-ut"
  },
  "breadcrumb": "string // Home / Services / [Service] / [City], [ST]",
  "hero": {
    "review_line": "string // e.g., 4.9 stars - 47 reviews on Google",
    "intro_paragraph": "string // 2-3 sentences. Bold the key phrase. Mention city.",
    "cta_primary_text": "string // e.g., Schedule Furnace Repair",
    "cta_secondary_text": "string // e.g., Call 801-508-4816",
    "trust_badges": ["string x4 // Short credential labels"]
  },
  "trust_strip": ["string x5 // Credential/trust phrases"],
  "problems": {
    "section_heading": "string // Signs You Need [Service] in [City]",
    "section_subtext": "string // 1 sentence",
    "cards": [
      {
        "icon": "string // FontAwesome class",
        "title": "string // 2-4 words",
        "description": "string // 1 sentence, 15-25 words"
      }
      // ... exactly 6 cards
    ]
  },
  "why_choose_us": {
    "section_heading": "string // Why [City] Homeowners Choose [Company Short]",
    "section_subtext": "string // 1-2 sentences",
    "items": [
      {
        "icon": "string // FontAwesome class",
        "title": "string // 2-5 words",
        "description": "string // 1-2 sentences, 20-40 words"
      }
      // ... exactly 5 items
    ],
    "image_alt": "string // Descriptive alt tag for the photo"
  },
  "process": {
    "section_heading": "string // How [Service] Works With Us",
    "section_subtext": "string // 1 sentence",
    "steps": [
      {
        "icon": "string // FontAwesome class",
        "title": "string // 2-4 words",
        "description": "string // 1-2 sentences, 15-30 words"
      }
      // ... exactly 5 steps
    ]
  },
  "faq": {
    "section_heading": "string // [Service] Questions from [City] Homeowners",
    "items": [
      {
        "question": "string // Natural conversational question",
        "answer": "string // 2-3 sentences, direct and useful"
      }
      // ... exactly 6 items
    ]
  },
  "local_context": {
    "section_heading": "string // Expert [Service] for [City], [ST] Homeowners",
    "paragraph_1": "string // 3-4 sentences. Population, landmarks, housing stock.",
    "paragraph_2": "string // 2-3 sentences. Connect service need to local conditions."
  },
  "internal_links": {
    "other_services_in_city": [
      { "text": "string", "url": "string" }
      // ... 4-6 items
    ],
    "same_service_other_cities": [
      { "text": "string", "url": "string" }
      // ... 5-7 items
    ]
  },
  "final_cta": {
    "heading": "string // e.g., Need Furnace Repair in Kaysville?",
    "subtext": "string // 1 sentence",
    "cta_primary_text": "string",
    "cta_secondary_text": "string",
    "footer_line": "string // e.g., Serving Kaysville and all of Davis County"
  },
  "schema_markup": {
    "local_business": "string // Complete LocalBusiness JSON-LD",
    "faq_page": "string // Complete FAQPage JSON-LD",
    "service": "string // Complete Service JSON-LD",
    "breadcrumb_list": "string // Complete BreadcrumbList JSON-LD"
  }
}
`;

export function buildClientProfile(client: Client): string {
  return `CLIENT: ${client.name} | ${client.niche} | ${client.phone} | ${client.email}
${client.address} | ${client.website_url}
Experience: ${client.years_in_business} | Jobs: ${client.jobs_completed} | Rating: ${client.rating}/5 (${client.review_count} reviews)
Service area: ${(client.service_area_cities || []).join(', ')}
Credentials: ${(client.credentials || []).join(', ')}
Differentiators: ${(client.differentiators || []).join(', ')}
Emergency: ${client.emergency_hours} | Contact: ${client.contact_url || '/contact/'}
=== YOUR TASK ===`;
}

export function buildPageRequest(
  service: Service,
  city: City,
  otherServices: Service[],
  sameServiceCities: City[]
): string {
  const serviceSlug = service.slug;
  const citySlug = city.slug;
  const otherServicesLinks = otherServices
    .filter(s => s.id !== service.id)
    .slice(0, 5)
    .map(s => ({ name: s.name, url: `/${s.slug}-${citySlug}` }));
  
  const sameServiceLinks = sameServiceCities
    .filter(c => c.id !== city.id)
    .slice(0, 7)
    .map(c => ({ city: c.name, url: `/${serviceSlug}-${c.slug}` }));

  return `Generate content for: SERVICE=${service.name}, CITY=${city.name}, STATE=${city.state}, COUNTY=${city.county || ''}, POPULATION=${city.population || ''}, LANDMARKS=${(city.landmarks || []).join(', ')}, NEIGHBORHOODS=${(city.neighborhoods || []).join(', ')}, CLIMATE=${city.climate_detail || ''}, HOUSING=${city.housing_detail || ''}, PARENT_SERVICE_URL=/services/${service.slug}/, CITY_HUB_URL=/${service.slug}-${citySlug}/, OTHER_SERVICES=${JSON.stringify(otherServicesLinks)}, SAME_SERVICE_OTHER_CITIES=${JSON.stringify(sameServiceLinks)}`;
}

export function buildSystemPrompt(client: Client): string {
  const profile = buildClientProfile(client);
  
  return `${profile}

When given SERVICE + CITY, generate JSON for every landing page section (meta, hero, problems, why-choose-us, process, faq, local_context, internal_links, final_cta, schema). 

OUTPUT SCHEMA: ${OUTPUT_SCHEMA.substring(0, 2000)}...

WRITING RULES:
- OUTPUT VALID JSON ONLY - no markdown, no text before or after, START with { END with }
- Write like a human, not AI
- Never use: 'In today's', 'Nestled', 'Bustling', 'Look no further', 'Comprehensive', 'Cutting-edge', 'Leveraging'
- Use keyword [service] [city] [state] naturally 2-3 times
- Reference SPECIFIC local landmarks/neighborhoods from the city data
- Each page must read differently from other city pages
- FAQ: real homeowner questions, city name in 2+ questions, include cost/emergency questions
- Process: 5 exact steps. Why-choose-us: 5 exact items. Problems: 6 cards.`;
}

export function parseAIResponse(response: string): any {
  let cleanJson = response.trim();
  
  // Remove ```json and ``` fences
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```json\n/, '').replace(/^```\n/, '');
    cleanJson = cleanJson.replace(/\n```$/, '');
  }
  
  // Find JSON object boundaries - find FIRST { and LAST }
  const startIdx = cleanJson.indexOf('{');
  const endIdx = cleanJson.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No valid JSON found in response');
  }
  
  cleanJson = cleanJson.substring(startIdx, endIdx + 1);
  
  // Try to parse, if fails try to extract just the first valid JSON object
  try {
    return JSON.parse(cleanJson);
  } catch (err) {
    // Try removing any trailing text after last }
    const tryAgain = cleanJson.replace(/}\s*$/, '').trim() + '}';
    try {
      return JSON.parse(tryAgain);
    } catch {
      throw new Error('Failed to parse JSON: ' + (err as Error).message);
    }
  }
}

export function validateOutput(output: any): string[] {
  const errors: string[] = [];
  
  // Check meta
  if (!output.meta?.title || output.meta.title.length > 60) {
    errors.push('Meta title must be 50-60 characters');
  }
  if (!output.meta?.description || output.meta.description.length > 160) {
    errors.push('Meta description must be 150-160 characters');
  }
  if (!output.meta?.h1?.includes(' in ')) {
    errors.push('H1 must follow format: [Service] in [City], [State]');
  }
  
  // Check problems
  if (!output.problems?.cards || output.problems.cards.length !== 6) {
    errors.push('Problems section must have exactly 6 cards');
  }
  
  // Check why choose us
  if (!output.why_choose_us?.items || output.why_choose_us.items.length !== 5) {
    errors.push('Why Choose Us must have exactly 5 items');
  }
  
  // Check process
  if (!output.process?.steps || output.process.steps.length !== 5) {
    errors.push('Process must have exactly 5 steps');
  }
  
  // Check FAQ
  if (!output.faq?.items || output.faq.items.length !== 6) {
    errors.push('FAQ must have exactly 6 items');
  }
  
  // Check internal links
  if (!output.internal_links?.other_services_in_city?.length) {
    errors.push('Other services in city must be populated');
  }
  if (!output.internal_links?.same_service_other_cities?.length) {
    errors.push('Same service other cities must be populated');
  }
  
  // Check for AI slop
  const fullText = JSON.stringify(output).toLowerCase();
  for (const pattern of ANTI_PATTERNS) {
    if (fullText.includes(pattern.toLowerCase())) {
      errors.push(`AI slop detected: "${pattern}"`);
    }
  }
  
  return errors;
}