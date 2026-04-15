export function buildPrompt(params: {
  niche: string;
  brand_voice: string;
  cta_preference: string;
  banned_phrases: string[];
  keyword: string;
  synonym?: string;
  client_name: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  address?: string;
  website_url?: string;
  years_in_business?: string;
}): string {
  const bannedList = params.banned_phrases.length > 0 
    ? 'Avoid these phrases: ' + params.banned_phrases.join(', ')
    : '';

  let prompt = 'You are an expert SEO content writer for local service businesses. Write a complete 1800-2000 word city+service landing page for "' + params.keyword + '".\n\n';
  
  prompt += 'CLIENT: ' + (params.client_name || 'A local ' + params.niche + ' company') + '\n';
  prompt += 'LOCATION: ' + params.city + ', ' + params.state + '\n';
  prompt += 'NICHE: ' + params.niche + '\n';
  prompt += 'BRAND VOICE: ' + (params.brand_voice || 'Professional, friendly, expert') + '\n';
  prompt += 'YEARS IN BUSINESS: ' + (params.years_in_business || 'Not specified') + '\n';
  prompt += 'CTA: ' + params.cta_preference + '\n';
  prompt += 'PHONE: ' + (params.phone || 'NO PHONE') + '\n';
  prompt += 'EMAIL: ' + (params.email || 'NO EMAIL') + '\n';
  prompt += 'ADDRESS: ' + (params.address || 'NO ADDRESS') + '\n';
  prompt += 'WEBSITE: ' + (params.website_url || 'NO WEBSITE') + '\n';
  prompt += bannedList + '\n\n';

  prompt += 'CRITICAL REQUIREMENTS:\n';
  prompt += '1. ALWAYS use EXACTLY this phone number in all CTAs: "' + (params.phone || 'NO PHONE') + '" - NEVER use any other phone number\n';
  prompt += '2. ALWAYS mention the business name "' + params.client_name + '" naturally throughout the content\n';
  prompt += '3. Write unique, substantive content\n';
  prompt += '4. Include specific local references: neighborhood names, local landmarks, city-specific conditions\n';
  prompt += '5. Use LocalBusiness + Service + FAQPage schema in JSON-LD format\n';
  prompt += '6. IMPORTANT: All content must be in the JSON output - not in prose. The JSON must contain ALL sections.\n\n';

  prompt += 'PAGE STRUCTURE - output EACH in JSON fields:\n';
  prompt += '- "hero": Hero section content (40-70 words with CTA)\n';
  prompt += '- "sections": Array of {heading, content} objects\n';
  prompt += '- "faqs": Array of {question, answer} objects (minimum 5)\n';
  prompt += '- "cta_block": CTA content (30-60 words)\n\n';

  prompt += 'SEO REQUIREMENTS:\n';
  prompt += '- Title: "[Service] in [City], [State] | [Brand Name]" (60 chars max)\n';
  prompt += '- Meta: Include phone number, trigger urgency (150-160 chars max)\n';
  prompt += '- URL slug: /service-city-state/ format\n';
  prompt += '- H1 exactly: "[Service] in [City], [State]"\n\n';

  prompt += 'OUTPUT: Return ONLY valid JSON in a code block. Use this format:\n';
  prompt += '{"title": "...", "slug": "...", "meta_title": "...", "meta_description": "...", "h1": "...", ';
  prompt += '"additional_keywords": [...], "service_schema": {...}, "local_business_schema": {...}, ';
  prompt += '"hero": "...", "sections": [...], "faqs": [...], "cta_block": "..."}\n';

  prompt += '\nIMPORTANT: Return ONLY the JSON code block. No other text.';

  return prompt;
}

export function parseOutput(text: string): Record<string, unknown> {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      console.log('Found JSON in code blocks');
      return JSON.parse(jsonMatch[1]);
    }
    
    const jsonObjMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjMatch) {
      console.log('Found JSON object directly');
      return JSON.parse(jsonObjMatch[0]);
    }
    
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
    console.log('Trying cleaned JSON');
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON parse error:', e);
    console.log('Raw text sample:', text.substring(0, 300));
    return {
      title: 'Generated Content',
      content_text: text,
      sections: [],
      faqs: [],
      hero: text.substring(0, 500),
      cta_block: '',
    };
  }
}

export function generateReadableText(content: Record<string, unknown>): string {
  let text = '';
  
  if (content.intro) text += content.intro + '\n\n';
  
  if (content.sections && Array.isArray(content.sections)) {
    for (const section of content.sections) {
      text += '## ' + section.heading + '\n' + section.content + '\n\n';
    }
  }
  
  if (content.faqs && Array.isArray(content.faqs)) {
    text += '## Frequently Asked Questions\n\n';
    for (const faq of content.faqs) {
      text += '### ' + faq.question + '\n' + faq.answer + '\n\n';
    }
  }
  
  if (content.cta) text += '## Contact Us\n' + content.cta + '\n';
  
  return text;
}

module.exports = { buildPrompt, parseOutput, generateReadableText };
