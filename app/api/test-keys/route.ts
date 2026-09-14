import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const cohereKey = process.env.COHERE_API_KEY || process.env.NEXT_PUBLIC_COHERE_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY || process.env.NEXT_PUBLIC_TOGETHER_API_KEY;

  const results: Record<string, any> = {};

  // Test Groq
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10,
        }),
      });
      const data = await res.json().catch(() => ({}));
      results.groq = { status: res.status, ok: res.ok, error: data.error?.message, model: data.model };
    } catch (e) {
      results.groq = { error: String(e) };
    }
  } else {
    results.groq = { error: 'No GROQ_API_KEY set' };
  }

  // Test Gemini
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say OK' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });
      const data = await res.json().catch(() => ({}));
      results.gemini = { status: res.status, ok: res.ok, error: data.error?.message };
    } catch (e) {
      results.gemini = { error: String(e) };
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
        body: JSON.stringify({
          model: 'command-r',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10,
        }),
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
        body: JSON.stringify({
          model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10,
        }),
      });
      const data = await res.json().catch(() => ({}));
      results.together = { status: res.status, ok: res.ok, error: data.error?.message };
    } catch (e) {
      results.together = { error: String(e) };
    }
  } else {
    results.together = { error: 'No TOGETHER_API_KEY set' };
  }

  return NextResponse.json({ keys: { groq: !!groqKey, gemini: !!geminiKey, cohere: !!cohereKey, together: !!togetherKey }, results });
}