import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PASSWORD = process.env.ACCESS_PASSWORD || 'change-me-in-env';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === PROTECTED_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('access_password', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
