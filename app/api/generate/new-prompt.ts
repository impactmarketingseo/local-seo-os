import type { Client, City, Service } from './types';

export const WRITING_RULES = `
RULE 1 — WRITE LIKE A HUMAN
Conversational where appropriate, authoritative where needed. Vary sentence length.
Mix short punchy statements with longer explanatory ones. Read your output aloud —
if it sounds like a brochure, rewrite it.

RULE 2 — NO AI SLOP
NEVER use these words/phrases in ANY output:
- 'In today's [anything]' / 'In the ever-evolving' / 'In an era of'
- 'Look no further' / 'Welcome to our website'
- 'Nestled' / 'Bustling' / 'Vibrant community' / 'Thriving'
- 'Tapestry' / 'Beacon of' / 'Testament to' / 'Pivotal' / 'Crucial role'
- 'Comprehensive' (when used as filler) / 'Cutting-edge' / 'State-of-the-art'
- 'Leveraging' / 'Fostering' / 'Cultivating' / 'Showcasing' / 'Underscoring'
- 'Navigating' / 'Landscape' / 'Realm' / 'Paradigm'
- 'Delve' / 'Dive into' / 'Let's explore' / 'Dive deep'
- 'Not just X, but Y' / 'It's more than just' / 'Goes beyond'
- 'Stands as' / 'Serves as' / 'Functions as' (just say 'is')
- 'Rest assured' / 'Peace of mind' (more than once per page)
- 'Myriad' / 'Plethora' / 'Multifaceted' / 'Synergy'
- 'Elevate' / 'Empower' / 'Unlock' / 'Unleash' / 'Revolutionize'
- Any sentence starting with 'Whether you're...'
- Any 'Rule of Three' patterns (X, Y, and Z repeated in parallel structure)
- Em dashes used more than once per section

RULE 3 — KEYWORD INTEGRATION
- The primary keyword is: [service] [city] [state] (e.g., 'furnace repair Kaysville UT')
- Use it in the H1, meta title, and naturally 2-3 times in body copy
- Use secondary variations naturally: '[service] in [city]', '[city] [service] services'
- Keyword density should feel INVISIBLE — if you can spot the optimization, rewrite
- Never keyword-stuff FAQs — questions should sound like a real person asking

RULE 4 — LOCAL CONTEXT MUST BE GENUINE
- Use the landmarks, neighborhoods, and climate details from the input
- Reference specific local features — not generic 'beautiful community' filler
- Mention proximity to the company's office or service hub when relevant
- Each city page MUST read noticeably different from other city pages

RULE 5 — NO CONSECUTIVE SAMENESS
- Never start two consecutive paragraphs with the same word
- Never start two consecutive FAQ questions with the same word
- Never use the same CTA text twice on the same page

RULE 6 — FAQ QUALITY
- Questions must sound like a real homeowner asking (not a marketer writing)
- Answers: 2-3 sentences max. Direct, specific, useful.
- Include the city name in at least 2 of the 6 questions
- Include at least one cost-related question
- Include at least one 'repair vs replace' or decision question
- Include at least one emergency/availability question

RULE 7 — PROBLEM CARDS
- Each problem title: 2-4 words max (e.g., 'Unusual Noises')
- Each problem description: exactly 1 sentence, 15-25 words
- Problems must be specific to the SERVICE TYPE.

RULE 8 — PROCESS STEPS
- Exactly 5 steps. Each step title: 2-4 words.
- Each step description: 1-2 sentences, 15-30 words.
- The 5 steps should follow this pattern:
  Step 1: Customer contacts (call or schedule)
  Step 2: Technician inspects/diagnoses
  Step 3: Transparent quote/estimate provided
  Step 4: Work performed
  Step 5: Customer approves / payment collected

RULE 9 — WHY CHOOSE US
- Exactly 5 items. Each title: 2-5 words.
- Each description: 1-2 sentences, 20-40 words.
- Item 1 must reference LOCAL knowledge of the specific city
- Item 2 must reference emergency/availability
- Items 3-5 should pull from the client's credentials and differentiators
- Be SPECIFIC — not 'We provide great service' but 'We collect payment after the job is done, not before'

RULE 10 — INTERNAL LINKS
- Populate the other_services list with services the client offers in this city
- Populate the other_cities list with cities where this service is offered
- Use actual URL slugs, not placeholder #'s
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
  const cities = client.service_area_cities || [];
  
  return `=== CLIENT PROFILE ===
Company: ${client.name}
Short Name: ${client.short_name || client.name}
Phone: ${client.phone}
Email: ${client.email}
Address: ${client.address}
Website: ${client.website_url}
Industry: ${client.niche}
Services: ${client.services?.map(s => s.name).join(', ') || 'N/A'}
Service Area Cities: ${cities.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')}
Credentials: ${client.credentials?.join(', ') || 'N/A'}
Differentiators: ${client.differentiators?.join(', ') || 'N/A'}
Years Experience: ${client.years_in_business || 'N/A'}
Jobs Completed: ${client.jobs_completed || 'N/A'}
Google Rating: ${client.rating || 'N/A'} (${client.review_count || '0'} reviews)
Owner: ${client.owner_name || 'N/A'}
Brands Serviced: ${client.brands_serviced?.join(', ') || 'N/A'}
Financing: ${client.financing || 'N/A'}
Emergency: ${client.emergency_hours || 'N/A'}
Contact URL: ${client.contact_url || '/contact/'}
Services URL: ${client.services_url || '/services/'}
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

When the user provides a SERVICE and CITY, generate a JSON object with content for every
section of the landing page template. The JSON schema is defined below under OUTPUT SCHEMA.

=== WRITING RULES (CRITICAL — FOLLOW EVERY ONE) ===
${WRITING_RULES}

=== OUTPUT SCHEMA ===
Return ONLY a valid JSON object. No markdown, no backticks, no explanation.
The JSON structure is defined below:
${OUTPUT_SCHEMA}

=== ANTI-PATTERN FINAL CHECK ===
Before returning your output, scan every text field and verify:
1. No banned words/phrases from Rule 2
2. No two consecutive paragraphs starting with the same word
3. FAQ questions sound like a real person, not a marketer
4. Local context is genuinely specific to THIS city
5. The page reads differently from any other city page for the same service
6. No 'Rule of Three' parallel constructions
7. Keyword integration is invisible when reading naturally`;
}

export function parseAIResponse(response: string): any {
  // Remove markdown code blocks if present
  let cleanJson = response.trim();
  
  // Remove ```json and ``` fences
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```json\n/, '').replace(/^```\n/, '');
    cleanJson = cleanJson.replace(/\n```$/, '');
  }
  
  // Find JSON object boundaries
  const startIdx = cleanJson.indexOf('{');
  const endIdx = cleanJson.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No valid JSON found in response');
  }
  
  cleanJson = cleanJson.substring(startIdx, endIdx + 1);
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${e.message}`);
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