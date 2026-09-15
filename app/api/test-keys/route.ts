import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const cohereKey = process.env.COHERE_API_KEY || process.env.NEXT_PUBLIC_COHERE_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY || process.env.NEXT_PUBLIC_TOGETHER_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  const results: Record<string, any> = {};

  // Test Groq - try multiple models
  if (groqKey) {
    const groqModels = ['llama-3.1-8b-instant', 'gemma2-9b-it', 'llama3-8b-8192', 'gemma-7b-it'];
    results.groq = { models: {} };
    for (const model of groqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 }),
        });
        const data = await res.json().catch(() => ({}));
        results.groq.models[model] = { status: res.status, ok: res.ok, error: data.error?.message };
        if (res.ok) break;
      } catch (e) {
        results.groq.models[model] = { error: String(e) };
      }
    }
  } else {
    results.groq = { error: 'No GROQ_API_KEY set' };
  }

  // Test Gemini - try multiple models
  if (geminiKey) {
    const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-flash-002', 'gemini-2.0-flash-exp'];
    results.gemini = { models: {} };
    for (const model of geminiModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'OK' }] }], generationConfig: { maxOutputTokens: 5 } }),
        });
        const data = await res.json().catch(() => ({}));
        results.gemini.models[model] = { status: res.status, ok: res.ok, error: data.error?.message };
        if (res.ok) break;
      } catch (e) {
        results.gemini.models[model] = { error: String(e) };
      }
    }
  } else {
    results.gemini = { error: 'No GEMINI_API_KEY set' };
  }

  // Test Cohere
  if (cohereKey) {
    try {
      const res = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cohereKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'command-r-plus-08-2024', message: 'OK', max_tokens: 5 }),
      });
      const data = await res.json().catch(() => ({}));
      results.cohere = { status: res.status, ok: res.ok, error: data.message };
    } catch (e) {
      results.cohere = { error: String(e) };
    }
  } else {
    results.cohere = { error: 'No COHERE_API_KEY set' };
  }

  // Test Together
  if (togetherKey) {
    try {
      const res = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${togetherKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 }),
      });
      const data = await res.json().catch(() => ({}));
      results.together = { status: res.status, ok: res.ok, error: data.error?.message };
    } catch (e) {
      results.together = { error: String(e) };
    }
  } else {
    results.together = { error: 'No TOGETHER_API_KEY set' };
  }

  // Test OpenRouter
  if (openrouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openrouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://impactseo.app', 'X-Title': 'Impact SEO OS' },
        body: JSON.stringify({ model: 'meta-llama/llama-3.1-8b-instruct:free', messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 }),
      });
      const data = await res.json().catch(() => ({}));
      results.openrouter = { status: res.status, ok: res.ok, error: data.error?.message };
    } catch (e) {
      results.openrouter = { error: String(e) };
    }
  } else {
    results.openrouter = { error: 'No OPENROUTER_API_KEY set' };
  }

  return NextResponse.json({ keys: { groq: !!groqKey, gemini: !!geminiKey, cohere: !!cohereKey, together: !!togetherKey, openrouter: !!openrouterKey }, results });
}