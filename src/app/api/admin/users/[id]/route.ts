import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

async function requireAdmin(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user || !user.is_admin) return null;
  return user;
}

// تحديث حالة التفعيل أو تاريخ الاشتراك
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { isActive, subscriptionPaidUntil } = body;

  if (id === admin.id) {
    return NextResponse.json({ error: 'لا يمكنك تعديل حسابك الخاص من هنا' }, { status: 400 });
  }

  const result = await db`
    UPDATE users
    SET
      is_active = COALESCE(${isActive}, is_active),
      subscription_paid_until = COALESCE(${subscriptionPaidUntil}, subscription_paid_until)
    WHERE id = ${id}
    RETURNING id, email, name, is_admin, is_active, subscription_paid_until
  `;

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
  }

  return NextResponse.json({ user: result.rows[0] });
}

// حذف حساب
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json({ error: 'لا يمكنك حذف حسابك الخاص' }, { status: 400 });
  }

  await db`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
