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
  prompt += '3. Write COMPREHENSIVE content - each section must be 200-400 words minimum to be authoritative and SEO-friendly\n';
  prompt += '4. Include specific local references: neighborhood names, local landmarks, city-specific conditions, local statistics\n';
  prompt += '5. Use proper JSON-LD schema with @context "https://schema.org" and correct @type values\n';
  prompt += '6. Use lists (bullet points or numbered) for common issues, benefits, and services to improve visual appeal\n';
  prompt += '7. IMPORTANT: All content must be in the JSON output - not in prose. The JSON must contain ALL sections.\n';
  prompt += '8. Write as an industry expert - include specific details, examples, and proof points to establish authority\n\n';

  prompt += 'PAGE STRUCTURE - output EACH in JSON fields with 200-400+ words each:\n';
  prompt += '- "hero": Hero section content (60-100 words with CTA)\n';
  prompt += '- "trust_signals": Array of {icon, label, value} for trust signals\n';
  prompt += '- "common_issues": Array of strings for common problems (minimum 7 items)\n';
  prompt += '- "benefits": Array of strings for key benefits (minimum 7 items)\n';
  prompt += '- "sections": Array of {heading, content} objects - EACH section must be 250-400 words\n';
  prompt += '- "services": Array of strings for services offered (minimum 5 items)\n';
  prompt += '- "faqs": Array of {question, answer} objects (minimum 7, each answer 50-100 words)\n';
  prompt += '- "cta_block": CTA content (50-80 words)\n\n';

  prompt += 'SEO CONTENT REQUIREMENTS:\n';
  prompt += '- Each section heading should target specific keywords\n';
  prompt += '- Include LSI keywords naturally throughout content\n';
  prompt += '- Add specific numbers, statistics, and proof points\n';
  prompt += '- Include neighborhood names and local landmarks\n';
  prompt += '- Write in semi-formal tone that builds trust\n\n';

  prompt += 'SEO REQUIREMENTS:\n';
  prompt += '- Title: "[Service] in [City], [State] | [Brand Name]" (60 chars max)\n';
  prompt += '- Meta: Include phone number, trigger urgency (150-160 chars max)\n';
  prompt += '- URL slug: /service-city-state/ format\n';
  prompt += '- H1 exactly: "[Service] in [City], [State]"\n\n';

  prompt += 'SEO OUTPUT FORMAT - Return ONLY valid JSON with these fields:\n';
  prompt += '"title": "[Service] in [City], [State] | [Brand Name]" (60 chars max),\n';
  prompt += '"slug": "[service]-[city]-[state]" (no slashes),\n';
  prompt += '"meta_title": "[Service] in [City], [State] | [Brand Name]",\n';
  prompt += '"meta_description": "Call [phone] for expert [service] in [City]. [trigger urgency] [150-160 chars]",\n';
  prompt += '"h1": "[Service] in [City], [State]",\n';
  prompt += '"additional_keywords": ["keyword1", "keyword2", "keyword3"],\n';
  prompt += '\n';
  prompt += 'SERVICE SCHEMA (for RankMath - use this EXACT format):\n';
  prompt += '"service_schema": {\n';
  prompt += '  "@context": "https://schema.org",\n';
  prompt += '  "@type": "Service",\n';
  prompt += '  "name": "[Service] in [City], [State]",\n';
  prompt += '  "description": "[1-2 sentence description of the service]",\n';
  prompt += '  "provider": {\n';
  prompt += '    "@type": "LocalBusiness",\n';
  prompt += '    "name": "' + (params.client_name || '[Business Name]') + '",\n';
  prompt += '    "address": {\n';
  prompt += '      "@type": "PostalAddress",\n';
  prompt += '      "addressLocality": "' + params.city + '",\n';
  prompt += '      "addressRegion": "' + params.state + '"\n';
  prompt += '    },\n';
  prompt += '    "telephone": "' + (params.phone || '[Phone]') + '",\n';
  prompt += '    "url": "' + (params.website_url || '[Website]') + '"\n';
  prompt += '  },\n';
  prompt += '  "areaServed": {\n';
  prompt += '    "@type": "City",\n';
  prompt += '    "name": "' + params.city + '"\n';
  prompt += '  }\n';
  prompt += '},\n';
  prompt += '\n';
  prompt += 'LOCAL BUSINESS SCHEMA (for RankMath - use this EXACT format):\n';
  prompt += '"local_business_schema": {\n';
  prompt += '  "@context": "https://schema.org",\n';
  prompt += '  "@type": "LocalBusiness",\n';
  prompt += '  "name": "' + (params.client_name || '[Business Name]') + '",\n';
  prompt += '  "address": {\n';
  prompt += '    "@type": "PostalAddress",\n';
  prompt += '    "addressLocality": "' + params.city + '",\n';
  prompt += '    "addressRegion": "' + params.state + '",\n';
  prompt += '    "streetAddress": "[Street Address]"\n';
  prompt += '  },\n';
  prompt += '  "telephone": "' + (params.phone || '[Phone]') + '",\n';
  prompt += '  "email": "' + (params.email || '[Email]') + '",\n';
  prompt += '  "url": "' + (params.website_url || '[Website]') + '",\n';
  prompt += '  "priceRange": "$$",\n';
  prompt += '  "openingHours": "Mo-Fr 08:00-18:00"\n';
  prompt += '},\n';
  prompt += '\n';
  prompt += 'CONTENT SECTIONS - output in JSON with 200-400+ words each:\n';
  prompt += '"hero": "Hero section content (60-100 words with CTA)",\n';
  prompt += '"trust_signals": [{"icon": "⭐", "label": "Experience", "value": "X+ years"}, ...],\n';
  prompt += '"common_issues": ["problem 1", "problem 2", ...] (minimum 7 items),\n';
  prompt += '"benefits": ["benefit 1", "benefit 2", ...] (minimum 7 items),\n';
  prompt += '"sections": [{"heading": "...", "content": "..."}, ...],\n';
  prompt += '"services": ["service 1", "service 2", ...] (minimum 5 items),\n';
  prompt += '"faqs": [{"question": "...", "answer": "..."}, ...] (minimum 7, each answer 50-100 words),\n';
  prompt += '"cta_block": "CTA content (50-80 words)"\n';
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
