"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  is_active: boolean;
  subscription_paid_until: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formSubDate, setFormSubDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      setError('فشل تحميل الحسابات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          name: formName,
          subscriptionPaidUntil: formSubDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل إضافة الحساب');
        return;
      }
      setFormEmail('');
      setFormPassword('');
      setFormName('');
      setFormSubDate('');
      setShowAddForm(false);
      loadUsers();
    } catch (e) {
      setError('حدث خطأ أثناء الإضافة');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: AdminUser) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.is_active }),
    });
    loadUsers();
  };

  const updateSubscription = async (user: AdminUser, date: string) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionPaidUntil: date }),
    });
    loadUsers();
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`هل تريد حذف حساب ${user.email}؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    loadUsers();
  };

  const isSubscriptionExpired = (date: string | null) => {
    if (!date) return true;
    return new Date(date) < new Date();
  };

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1120]" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">غير مصرح لك بالوصول</h1>
          <button onClick={() => router.push('/')} className="text-blue-400 underline">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 p-6 md:p-10" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">لوحة إدارة الحسابات</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            {showAddForm ? 'إلغاء' : '+ إضافة حساب جديد'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddUser} className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 mb-8 space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">حساب جديد</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email" required value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">كلمة المرور</label>
                <input
                  type="text" required value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">الاسم</label>
                <input
                  type="text" value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">الاشتراك مدفوع حتى</label>
                <input
                  type="date" value={formSubDate}
                  onChange={(e) => setFormSubDate(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50">
              {saving ? 'جارٍ الحفظ...' : 'حفظ الحساب'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-400">جارٍ التحميل...</p>
        ) : (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-right">
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4">الاسم</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">الاشتراك حتى</th>
                  <th className="p-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800">
                    <td className="p-4">{u.email} {u.is_admin && <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded ml-2">أدمن</span>}</td>
                    <td className="p-4">{u.name || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {u.is_active ? 'مفعّل' : 'موقوف'}
                      </span>
                    </td>
                    <td className="p-4">
                      <input
                        type="date"
                        defaultValue={u.subscription_paid_until ? u.subscription_paid_until.slice(0, 10) : ''}
                        onBlur={(e) => e.target.value && updateSubscription(u, e.target.value)}
                        disabled={u.is_admin}
                        className={`bg-[#0f172a] border rounded-lg px-2 py-1.5 text-white text-xs outline-none ${
                          isSubscriptionExpired(u.subscription_paid_until) ? 'border-red-500/50' : 'border-slate-600'
                        }`}
                      />
                    </td>
                    <td className="p-4 space-x-2 space-x-reverse whitespace-nowrap">
                      {!u.is_admin && (
                        <>
                          <button onClick={() => toggleActive(u)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${u.is_active ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'}`}>
                            {u.is_active ? 'إيقاف' : 'تفعيل'}
                          </button>
                          <button onClick={() => deleteUser(u)} className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-slate-600">
                            حذف
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
