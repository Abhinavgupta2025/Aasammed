import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatRupees } from "@/lib/units";
import {
  Beaker,
  ArrowRight,
  ArrowUpRight,
  Droplet,
  FlaskConical,
  Calculator,
  RefreshCw,
  BellRing,
  Award,
  Layers,
  Database,
} from "lucide-react";

interface DisplayProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  baseUnit: string;
  basePricePaise: bigint | number;
  stockInBaseUnit: number;
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Fetch top products from the database, or fall back to high-fidelity mock data if database is unconfigured
  let featuredProducts: DisplayProduct[] = [];
  let isDatabaseConnected = false;

  try {
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      take: 3,
    });
    
    if (dbProducts.length > 0) {
      featuredProducts = dbProducts.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        description: p.description,
        category: p.category,
        baseUnit: p.baseUnit,
        basePricePaise: p.basePricePaise,
        stockInBaseUnit: Number(p.stockInBaseUnit),
      }));
      isDatabaseConnected = true;
    }
  } catch (error) {
    // Graceful fallback to mock data when database is not set up
    isDatabaseConnected = false;
  }

  if (featuredProducts.length === 0) {
    featuredProducts = [
      {
        id: "mock-ethanol",
        name: "Ethanol 99%",
        sku: "SOL-EtOH-99",
        description: "Absolute Ethanol 99.9%, pure chemistry grade solvent for analysis.",
        category: "Solvents",
        baseUnit: "mL",
        basePricePaise: 120n,
        stockInBaseUnit: 10000.0,
      },
      {
        id: "mock-nacl",
        name: "Sodium Chloride",
        sku: "REA-NaCl-001",
        description: "Analytical grade Sodium Chloride, suitable for buffer preparation and laboratory use.",
        category: "Reagents",
        baseUnit: "g",
        basePricePaise: 50n,
        stockInBaseUnit: 78.5, // Low stock indicator test
      },
      {
        id: "mock-beaker",
        name: "Glass Beaker 250mL",
        sku: "SUP-GBK-250",
        description: "Borosilicate glass beaker, 250mL volume with graduation marks, thermal shock resistant.",
        category: "Lab Supplies",
        baseUnit: "unit",
        basePricePaise: 12000n,
        stockInBaseUnit: 50.0,
      },
    ];
  }

  // Determine redirection target for logged-in user
  const dashboardLink = session?.user
    ? session.user.role === "ADMIN"
      ? "/admin"
      : "/dashboard"
    : "/login";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/80 h-20">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-indigo-950 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:border-indigo-500/40 transition-colors">
              <Beaker className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100 group-hover:text-indigo-400 transition-colors">MedChem Inventory</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Platform Features</a>
            <a href="#catalog" className="hover:text-indigo-400 transition-colors">Featured Chemicals</a>
            <a href="#purity" className="hover:text-indigo-400 transition-colors">Quality Control</a>
          </nav>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Logged in as <strong className="text-slate-200">{session.user.name}</strong>
                </span>
                <Link
                  href={dashboardLink}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-300 hover:text-indigo-600 text-sm font-medium px-4 py-2 hover:bg-slate-900 rounded-xl transition-all"
                >
                  View Catalog
                </Link>
                <Link
                  href="/login"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Login to Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-20 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-4 border-b border-slate-900/80">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 mb-6 rounded-full bg-slate-900 border border-slate-800/80 text-xs font-medium text-emerald-400 select-none">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {isDatabaseConnected ? "NEON CLOUD DATABASE ONLINE" : "LOCAL DEMO SESSION ACTIVE"}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-100 mb-6 leading-[1.1]">
              Precision Management for the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-400 animate-gradient">
                Modern Laboratory
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Streamline your chemical inventory with medical-grade accuracy. Track reagents, solvents, and equipment with conversion-aware calculations and live stock verification.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={dashboardLink}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Access Inventory Portal
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-indigo-600 font-medium px-8 py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                Explore Product Catalog
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 max-w-7xl mx-auto border-b border-slate-900/80">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">Engineered for Technical Accuracy</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Handling chemical stocks requires precision. Our system eliminates common data entry and calculation discrepancies automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all group">
              <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-3">Decimal Price Accuracy</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                All values are stored as integers in <strong>paise</strong> using PostgreSQL BigInt. Avoid floating-point arithmetic errors and ensure perfect auditing for high-volume chemicals.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all group">
              <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-3">Automated Unit Conversions</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Seamlessly order in kilograms (`kg`) and dispense in grams (`g`). The system automatically converts quantities to the base storage unit before saving.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all group">
              <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-3">Low-Stock Notification</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Live monitoring alerts administrators of items falling below designated safety stock levels. Never face laboratory downtime due to supply shortages.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Chemicals Section */}
        <section id="catalog" className="py-20 px-4 max-w-7xl mx-auto border-b border-slate-900/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">Featured Laboratory Chemicals</h2>
              <p className="text-slate-400">High-volume chemical assets with live pricing and current stock levels.</p>
            </div>
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center gap-1 self-start md:self-auto group"
            >
              Access Catalog to Order
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => {
              const isLowStock = product.stockInBaseUnit < 100;
              const accentColor =
                product.category === "Solvents"
                  ? "border-t-cyan-500"
                  : product.category === "Reagents"
                  ? "border-t-rose-500"
                  : "border-t-amber-500";
              const badgeBg =
                product.category === "Solvents"
                  ? "text-cyan-700 bg-cyan-100 border-cyan-200"
                  : product.category === "Reagents"
                  ? "text-rose-700 bg-rose-100 border-rose-200"
                  : "text-amber-700 bg-amber-100 border-amber-200";

              return (
                <div
                  key={product.id}
                  className={`bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden group transition-all duration-200 border-t-2 ${accentColor}`}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${badgeBg}`}>
                      {product.category}
                    </div>
                    {isLowStock ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md animate-pulse">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                        IN STOCK
                      </span>
                    )}
                  </div>

                  <div className="mb-6 flex-grow">
                    <span className="text-xs text-slate-500 font-mono tracking-tight block mb-1">
                      SKU: {product.sku}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block mb-0.5">BASE UNIT PRICE</span>
                      <strong className="text-slate-200 font-mono">
                        {formatRupees(product.basePricePaise)}
                      </strong>
                      <span className="text-slate-500 text-xs font-mono">/{product.baseUnit}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block mb-0.5">AVAILABLE STOCK</span>
                      <span className="text-slate-300 font-mono font-semibold">
                        {product.stockInBaseUnit.toLocaleString()} {product.baseUnit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats Section */}
        <section id="purity" className="py-24 px-4 relative border-b border-slate-900/80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.03),transparent_70%)] pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 text-center">
            <div className="flex flex-col items-center">
              <Database className="w-8 h-8 text-indigo-400 mb-3" />
              <strong className="text-4xl font-extrabold text-slate-100 tracking-tight mb-1">1,000+</strong>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Reagents Monitored
              </span>
            </div>

            <div className="w-16 h-px bg-slate-800 md:w-px md:h-16 hidden md:block" />

            <div className="flex flex-col items-center">
              <Award className="w-8 h-8 text-emerald-400 mb-3" />
              <strong className="text-4xl font-extrabold text-slate-100 tracking-tight mb-1">99.9%</strong>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Accuracy Standard
              </span>
            </div>

            <div className="w-16 h-px bg-slate-800 md:w-px md:h-16 hidden md:block" />

            <div className="flex flex-col items-center">
              <Layers className="w-8 h-8 text-indigo-400 mb-3" />
              <strong className="text-4xl font-extrabold text-slate-100 tracking-tight mb-1">100%</strong>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Audited Log Trails
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/80 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-sm font-bold text-slate-100 tracking-tight">MedChem Inventory Systems</span>
            <span className="text-xs text-slate-500">Technical Precision & Safety Guaranteed.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">API System Documentation</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Technical Support</a>
          </div>

          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} MedChem Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
