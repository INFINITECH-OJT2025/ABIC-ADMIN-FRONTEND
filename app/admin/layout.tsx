import React from "react";
import AdminHeadSidebar from "@/components/admin-head-sidebar";

export default function AdminHeadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex print:block">
      <div className="print:hidden">
        <AdminHeadSidebar />
      </div>
      <main className="flex-1 bg-slate-50 print:bg-white print:w-full print:max-w-none print:m-0 print:p-0">
        {children}
      </main>
    </div>
  );
}
