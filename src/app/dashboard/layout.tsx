"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Beaker, 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  ClipboardList, 
  LogOut,
  User as UserIcon,
  ShieldCheck
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Product Catalog", href: "/dashboard/products", icon: ShoppingBag },
    { name: "Cart", href: "/dashboard/cart", icon: ShoppingCart },
    { name: "My Orders", href: "/dashboard/orders", icon: ClipboardList },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Brand Logo */}
          <Link href="/" className="h-16 flex items-center px-6 border-b border-slate-800 gap-3 group hover:opacity-90 transition-opacity">
            <Beaker className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              MEDCHEM
            </span>
          </Link>

          {/* User Info Card */}
          <div className="p-4 mx-3 my-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/60 border border-indigo-500/20 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-200">
                {session?.user?.name || "Seller User"}
              </p>
              <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 mt-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Seller (User)
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-400 hover:bg-slate-850 hover:text-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Sign Out */}
        <div className="p-4 border-t border-slate-800">
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all duration-200"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              Switch to Admin
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="text-xl font-bold text-slate-100 capitalize">
            {pathname.split("/").pop() === "dashboard" ? "Overview" : pathname.split("/").pop()}
          </h2>
          <div className="text-sm text-slate-400">
            Welcome back, <span className="font-semibold text-slate-200">{session?.user?.name || "Seller"}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
