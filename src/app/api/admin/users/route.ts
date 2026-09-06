import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import bcrypt from 'bcryptjs';

async function requireAdmin(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user || !user.is_admin) return null;
  return user;
}

// عرض كل الحسابات
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const result = await db`
    SELECT id, email, name, is_admin, is_active, subscription_paid_until, created_at
    FROM users ORDER BY created_at DESC
  `;
  return NextResponse.json({ users: result.rows });
}

// إضافة حساب جديد
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const body = await request.json();
  const { email, password, name, subscriptionPaidUntil } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 });
  }

  const existing = await db`SELECT id FROM users WHERE email = ${email}`;
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db`
    INSERT INTO users (email, password_hash, name, is_admin, is_active, subscription_paid_until)
    VALUES (${email}, ${passwordHash}, ${name || null}, false, true, ${subscriptionPaidUntil || null})
    RETURNING id, email, name, is_admin, is_active, subscription_paid_until, created_at
  `;

  return NextResponse.json({ user: result.rows[0] });
}
