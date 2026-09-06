#!/bin/bash
set -e

echo "==> عمل نسخ احتياطية..."
cp src/components/Sidebar.tsx src/components/Sidebar.tsx.bak
cp src/app/layout.tsx src/app/layout.tsx.bak
cp src/app/admin/page.tsx src/app/admin/page.tsx.bak
[ -f public/images/logo.png ] && mv public/images/logo.png public/images/logo.png.old

echo "==> إنشاء اللوجو الجديد (SVG)..."
cat > public/images/logo.svg << 'INNEREOF'
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="24" fill="url(#grad)"/>
  <text x="60" y="76" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700" fill="#ffffff" text-anchor="middle">CM</text>
</svg>
INNEREOF

echo "==> تحديث Sidebar.tsx..."
cat > src/components/Sidebar.tsx << 'INNEREOF'
"use client";
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const menuItems = [
  { id: 'dashboard', label: 'الرئيسية', icon: '' },
  { id: 'workers', label: 'العمال', icon: '' },
  { id: 'projects', label: 'المشاريع', icon: '️' },
  { id: 'daily', label: 'اليوميات', icon: '' },
  { id: 'expenses', label: 'المصروفات', icon: '' },
  { id: 'salaries', label: 'الرواتب الشهرية', icon: '💰' },
  { id: 'profits', label: 'تقرير الأرباح', icon: '📈' },
  { id: 'summary', label: 'الملخص العام', icon: '🧠' },
  { id: 'partners', label: 'الشركاء والتسويات', icon: '🤝' },
];

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleExport = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('فشل التصدير');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contracting-management-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('حدث خطأ أثناء تصدير النسخة الاحتياطية');
    } finally {
      setBusy(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('سيتم استبدال كل البيانات الحالية بمحتوى هذا الملف. هل أنت متأكد؟')) {
      e.target.value = '';
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الاستيراد');
      alert('تم استيراد النسخة الاحتياطية بنجاح. سيتم تحديث الصفحة الآن.');
      window.location.reload();
    } catch (err: any) {
      alert('حدث خطأ أثناء الاستيراد: ' + (err.message || ''));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // نتابع تسجيل الخروج محليًا حتى لو فشل الطلب
    } finally {
      document.cookie = 'auth-token=; path=/; max-age=0';
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-lg shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`w-72 bg-[#111827] border-l border-slate-800 fixed h-full right-0 z-40 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } md:translate-x-0`}>
      <div className="p-6 border-b border-slate-800 flex flex-col items-center gap-4 bg-gradient-to-b from-[#0f172a] to-[#111827]">
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 border-4 border-white/5 group">
          <Image
            src="/images/logo.svg"
            alt="شعار Contracting Management"
            width={120}
            height={120}
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
            priority
            unoptimized={true}
          />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-md">Contracting Management</h1>
          <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase opacity-80">نظام إدارة المقاولات والعمال</p>
          <div className="w-12 h-0.5 bg-blue-500 mx-auto mt-2 rounded-full"></div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm translate-x-[-4px]'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 hover:translate-x-[-2px]'
            }`}>
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-1.5">
        <button
          onClick={handleExport}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {busy ? 'جارٍ التنفيذ...' : '⬇ تصدير نسخة احتياطية'}
        </button>
        <label className="w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs py-2.5 rounded-lg transition cursor-pointer">
          ⬆ استيراد نسخة احتياطية
          <input type="file" accept="application/json" onChange={handleImportFile} className="hidden" disabled={busy} />
        </label>
        <button
          onClick={handleLogout}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-xs py-2.5 rounded-lg transition disabled:opacity-50"
        >
          🚪 تسجيل الخروج
        </button>
      </div>
      <div className="p-4 border-t border-slate-800 text-center bg-[#0b1120]/50">
        <p className="text-[10px] text-slate-500 font-mono">نظام الإدارة المتكامل v2.0</p>
      </div>
      </aside>
    </>
  );
}
INNEREOF

echo "==> تحديث layout.tsx..."
cat > src/app/layout.tsx << 'INNEREOF'
import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Contracting Management - نظام الإدارة",
  description: "نظام إدارة مشاريع المقاولات والعمال",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Contracting Management",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#0b1120] text-slate-100 font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
INNEREOF

echo "==> تحديث login/page.tsx (اسم البرنامج)..."
sed -i.bak2 's/امتداد جروب/Contracting Management/' src/app/login/page.tsx
rm -f src/app/login/page.tsx.bak2

echo "==> تحديث admin/page.tsx (إضافة زرار تسجيل خروج)..."
python3 << 'PYEOF'
import re

path = "src/app/admin/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# إضافة import useRouter لو مش موجود
if "useRouter" not in content:
    content = content.replace(
        "import { useState, useEffect } from 'react';",
        "import { useState, useEffect } from 'react';\nimport { useRouter } from 'next/navigation';"
    )

# إضافة دالة handleLogout بعد تعريف router
content = content.replace(
    "const router = useRouter();",
    """const router = useRouter();

  const handleLogout = async () => {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // نتابع تسجيل الخروج محليًا حتى لو فشل الطلب
    } finally {
      document.cookie = 'auth-token=; path=/; max-age=0';
      router.push('/login');
      router.refresh();
    }
  };"""
)

# إضافة زرار تسجيل الخروج جنب زرار إضافة حساب جديد
old_header = """        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">لوحة إدارة الحسابات</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            {showAddForm ? 'إلغاء' : '+ إضافة حساب جديد'}
          </button>
        </div>"""

new_header = """        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">لوحة إدارة الحسابات</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
            >
              {showAddForm ? 'إلغاء' : '+ إضافة حساب جديد'}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 px-5 py-2.5 rounded-lg font-medium transition"
            >
              🚪 تسجيل الخروج
            </button>
          </div>
        </div>"""

content = content.replace(old_header, new_header)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("تم تحديث admin/page.tsx بنجاح")
PYEOF

echo ""
echo "==> اكتمل كل التعديلات بنجاح!"
echo "==> الفرق في admin/page.tsx:"
diff src/app/admin/page.tsx.bak src/app/admin/page.tsx || true
