import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function getSessionUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = (payload as any).userId;

    if (!userId) return null;

    const result = await db`
      SELECT id, email, name, is_admin, is_active, subscription_paid_until
      FROM users WHERE id = ${userId}
    `;
    const user = result.rows[0];

    if (!user) return null;

    // لو الحساب معطّل، اعتبره غير مسجّل دخول فورًا
    if (user.is_active === false) return null;

    return user;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}
