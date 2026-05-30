import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Shield, Brain, BarChart3, Zap, Globe, Lock,
  ChevronDown, Star, Building2, Users, TrendingUp, CreditCard, FileText,
  Landmark, Activity, PieChart, Package, Stethoscope, ShieldCheck,
  Phone, Mail, MapPin, Twitter, Linkedin, Github, Play, X, Menu,
  Clock, Award, Database, Cpu, Layers, Eye
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Metric Counter ───────────────────────────────────────────────────────────
function MetricCounter({ value, suffix, label, prefix = '' }) {
  const [ref, inView] = useInView();
  const count = useCountUp(value, 2200, inView);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl lg:text-5xl font-bold mb-1" style={{ color: '#2a9d8f', fontFamily: "'Open Sans', sans-serif" }}>
        {prefix}{count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-sm font-medium" style={{ color: 'rgba(255,247,230,0.65)', fontFamily: "'Open Sans', sans-serif" }}>{label}</div>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(28,55,65,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,247,230,0.08)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2a9d8f' }}>
            <span className="font-bold text-sm text-white">F</span>
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>FACT FinOS</span>
            <span className="text-xs ml-2" style={{ color: 'rgba(255,247,230,0.4)', fontFamily: "'Open Sans', sans-serif" }}>Healthcare Financial OS</span>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'AI Engine', 'Security', 'Pricing', 'About'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="text-sm transition-colors"
              style={{ color: 'rgba(255,247,230,0.65)', fontFamily: "'Open Sans', sans-serif" }}
              onMouseEnter={e => e.target.style.color = '#FFF7E6'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,247,230,0.65)'}
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium transition-colors rounded-lg"
            style={{ color: 'rgba(255,247,230,0.8)', fontFamily: "'Open Sans', sans-serif" }}
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
            style={{ backgroundColor: '#2a9d8f', color: '#fff', fontFamily: "'Open Sans', sans-serif" }}
          >
            Request Demo
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 rounded-md" style={{ color: '#FFF7E6' }}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 pb-4 space-y-3" style={{ backgroundColor: 'rgba(28,55,65,0.98)' }}>
          {['Features', 'AI Engine', 'Security', 'Pricing', 'About'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="block text-sm py-2" style={{ color: 'rgba(255,247,230,0.7)' }}>
              {item}
            </a>
          ))}
          <Link to="/login" className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold mt-2" style={{ backgroundColor: '#2a9d8f', color: '#fff' }}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [barHeights] = useState(() => [55, 72, 45, 88, 62, 95, 78, 65, 82, 70, 90, 58]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: '#1C3741' }}>
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#2a9d8f' }} />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: '#2a9d8f' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-3xl" style={{ backgroundColor: '#FFF7E6' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,247,230,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,247,230,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-32 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: 'rgba(42,157,143,0.15)', color: '#2a9d8f', border: '1px solid rgba(42,157,143,0.3)', fontFamily: "'Open Sans', sans-serif" }}>
              <Zap className="w-3 h-3" />
              Powered by GPT-4o · HIPAA Compliant · ISO 27001
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>
              The Financial OS
              <br />
              <span style={{ color: '#2a9d8f' }}>Built for Healthcare</span>
            </h1>

            <p className="text-lg leading-relaxed mb-8 max-w-xl" style={{ color: 'rgba(255,247,230,0.65)', fontFamily: "'Open Sans', sans-serif" }}>
              FACT FinOS unifies 22 financial modules — from double-entry accounting to AI-powered anomaly detection — into one intelligent platform designed exclusively for hospitals, medical colleges, and healthcare chains.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg"
                style={{ backgroundColor: '#2a9d8f', color: '#fff', fontFamily: "'Open Sans', sans-serif" }}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{ backgroundColor: 'rgba(255,247,230,0.08)', color: '#FFF7E6', border: '1px solid rgba(255,247,230,0.15)', fontFamily: "'Open Sans', sans-serif" }}
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </button>
            </div>

            <div className="flex flex-wrap gap-6">
              {[
                { icon: Shield, text: 'SOC 2 Type II' },
                { icon: Lock, text: 'End-to-End Encrypted' },
                { icon: CheckCircle2, text: 'HIPAA Ready' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: '#2a9d8f' }} />
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,247,230,0.55)', fontFamily: "'Open Sans', sans-serif" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Preview */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'rgba(255,247,230,0.05)', border: '1px solid rgba(255,247,230,0.1)' }}>
              {/* Window chrome */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: 'rgba(255,247,230,0.04)', borderBottom: '1px solid rgba(255,247,230,0.08)' }}>
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 mx-3 h-5 rounded-md px-3 flex items-center" style={{ backgroundColor: 'rgba(255,247,230,0.06)' }}>
                  <span className="text-[10px]" style={{ color: 'rgba(255,247,230,0.3)' }}>app.factfinos.com/dashboard</span>
                </div>
              </div>

              {/* KPI strip */}
              <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: 'rgba(255,247,230,0.06)' }}>
                {[
                  { label: 'Monthly Revenue', value: '₹4.2Cr', change: '+12.4%', up: true },
                  { label: 'Outstanding AR', value: '₹1.8Cr', change: '-8.2%', up: false },
                  { label: 'Collection Rate', value: '94.6%', change: '+2.1%', up: true },
                ].map((kpi) => (
                  <div key={kpi.label} className="p-4" style={{ backgroundColor: 'rgba(28,55,65,0.6)' }}>
                    <p className="text-[10px] mb-1" style={{ color: 'rgba(255,247,230,0.4)', fontFamily: "'Open Sans', sans-serif" }}>{kpi.label}</p>
                    <p className="text-lg font-bold mb-0.5" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>{kpi.value}</p>
                    <p className={`text-[10px] font-semibold ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>{kpi.change}</p>
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div className="p-4" style={{ backgroundColor: 'rgba(28,55,65,0.5)' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,247,230,0.5)', fontFamily: "'Open Sans', sans-serif" }}>Revenue vs Collection — Last 12 months</p>
                <div className="flex items-end gap-1 h-28">
                  {barHeights.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-t-sm transition-all duration-700"
                        style={{
                          height: `${h}%`,
                          backgroundColor: i === 11 ? '#2a9d8f' : 'rgba(42,157,143,0.4)',
                          animationDelay: `${i * 60}ms`
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m) => (
                    <span key={m} className="text-[8px]" style={{ color: 'rgba(255,247,230,0.25)' }}>{m}</span>
                  ))}
                </div>
              </div>

              {/* Activity feed */}
              <div className="p-4 space-y-2" style={{ backgroundColor: 'rgba(28,55,65,0.7)' }}>
                {[
                  { dot: '#2a9d8f', text: 'INV-2026-04821 collected · ₹2,40,000', time: '2m ago' },
                  { dot: '#f59e0b', text: 'TPA claim pending review · Apollo Munich', time: '8m ago' },
                  { dot: '#ef4444', text: 'Anomaly detected in payroll batch #48', time: '15m ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.dot }} />
                    <p className="text-[10px] flex-1 truncate" style={{ color: 'rgba(255,247,230,0.55)', fontFamily: "'Open Sans', sans-serif" }}>{item.text}</p>
                    <span className="text-[9px]" style={{ color: 'rgba(255,247,230,0.25)' }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div
              className="absolute -bottom-4 -left-4 px-4 py-3 rounded-xl shadow-xl"
              style={{ backgroundColor: '#2a9d8f', fontFamily: "'Open Sans', sans-serif" }}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-white" />
                <div>
                  <p className="text-[10px] text-white/80">AI Insight</p>
                  <p className="text-xs font-semibold text-white">Anomaly in Dept 4 billing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
        <ChevronDown className="w-5 h-5" style={{ color: 'rgba(255,247,230,0.3)' }} />
      </div>
    </section>
  );
}

// ─── Enterprise Metrics Banner ─────────────────────────────────────────────────
function MetricsBanner() {
  return (
    <section style={{ backgroundColor: '#142830' }} className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          <MetricCounter value={240} suffix="Cr+" prefix="₹" label="Monthly transactions processed" />
          <MetricCounter value={180} suffix="+" label="Hospitals & healthcare chains" />
          <MetricCounter value={99.9} suffix="%" label="Platform uptime SLA" />
          <MetricCounter value={22} suffix="" label="Fully integrated financial modules" />
        </div>
      </div>
    </section>
  );
}

// ─── Features Grid ─────────────────────────────────────────────────────────────
function Features() {
  const modules = [
    { icon: FileText, label: 'Core Accounting', desc: 'Double-entry engine with immutable journals, chart of accounts, trial balance, and multi-year fiscal management.', tag: 'Accounting' },
    { icon: TrendingUp, label: 'Accounts Receivable', desc: 'Invoice lifecycle, aging reports, collection tracking, and automated reminders for outstanding dues.', tag: 'Finance' },
    { icon: Landmark, label: 'Accounts Payable', desc: 'Vendor invoice processing, three-way matching, payment scheduling, and cash flow optimisation.', tag: 'Finance' },
    { icon: CreditCard, label: 'Patient Billing', desc: 'OPD/IPD billing, procedure charges, bed tariffs, deposit management, and itemised invoicing.', tag: 'Hospital' },
    { icon: ShieldCheck, label: 'Insurance / TPA', desc: 'Pre-auth, claim submission, settlement tracking, TPA aging, and real-time denial management.', tag: 'Compliance' },
    { icon: Stethoscope, label: 'Doctor Payouts', desc: 'Revenue sharing, consultation fees, procedure-based incentives, and automated payout runs.', tag: 'Hospital' },
    { icon: Users, label: 'Payroll', desc: 'Multi-grade salary structures, statutory deductions (PF/ESI/PT), payslip generation, and bank transfers.', tag: 'Operations' },
    { icon: Building2, label: 'Fixed Assets', desc: 'Asset register, straight-line and WDV depreciation, maintenance schedules, and disposal accounting.', tag: 'Operations' },
    { icon: BarChart3, label: 'Budgeting', desc: 'Department-wise budget allocation, variance analysis, forecast vs actual, and spend alerts.', tag: 'Analytics' },
    { icon: Package, label: 'Procurement', desc: 'Purchase orders, vendor management, GRN, inventory valuation, and consumption tracking.', tag: 'Operations' },
    { icon: PieChart, label: 'Financial Reports', desc: 'P&L, balance sheet, cash flow, ratio analysis, and board-ready dashboards — all real-time.', tag: 'Reporting' },
    { icon: Brain, label: 'AI Engine', desc: 'Natural-language queries, anomaly detection, spend forecasting, and GPT-4o powered narratives.', tag: 'AI' },
  ];

  const tagColors = {
    Accounting: '#1d4ed8', Finance: '#0891b2', Hospital: '#059669',
    Compliance: '#7c3aed', Operations: '#b45309', Analytics: '#db2777',
    Reporting: '#475569', AI: '#2a9d8f'
  };

  return (
    <section id="features" className="py-24" style={{ backgroundColor: '#FFF7E6' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2a9d8f', border: '1px solid rgba(42,157,143,0.2)', fontFamily: "'Open Sans', sans-serif" }}>
            <Layers className="w-3 h-3" />
            22 Integrated Modules
          </div>
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#1C3741', fontFamily: "'Open Sans', sans-serif" }}>
            Everything Finance. One Platform.
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(28,55,65,0.6)', fontFamily: "'Open Sans', sans-serif" }}>
            From the first journal entry to the CFO board report — FACT FinOS covers every financial workflow your hospital needs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {modules.map(({ icon: Icon, label, desc, tag }) => (
            <div
              key={label}
              className="group p-5 rounded-2xl transition-all duration-300 cursor-default"
              style={{ backgroundColor: '#fff', border: '1px solid rgba(28,55,65,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(28,55,65,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(28,55,65,0.07)' }}>
                  <Icon className="w-5 h-5" style={{ color: '#1C3741' }} />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tagColors[tag]}15`, color: tagColors[tag], fontFamily: "'Open Sans', sans-serif" }}>
                  {tag}
                </span>
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ color: '#1C3741', fontFamily: "'Open Sans', sans-serif" }}>{label}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,55,65,0.55)', fontFamily: "'Open Sans', sans-serif" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AI Section ────────────────────────────────────────────────────────────────
function AISection() {
  const queries = [
    { q: 'What is our net collection rate for Q1?', a: 'Q1 net collection rate stands at 91.4% — up 3.2 pp vs Q4. Outstanding TPA claims account for the remaining 8.6% (₹42L aged > 60 days).' },
    { q: 'Show departments with budget overrun > 10%', a: 'Radiology (+18.2%), Pharmacy (+14.7%), and ICU (+11.3%) have exceeded budget. Recommend review of procurement contracts.' },
    { q: "Detect anomalies in last month's payroll", a: '3 anomalies found: Dr Sharma received duplicate allowance (₹12,000), Nursing batch has 4 missing PF deductions, OT calculation variance of ₹8,200.' },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % queries.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="ai-engine" className="py-24" style={{ backgroundColor: '#1C3741' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: 'rgba(42,157,143,0.15)', color: '#2a9d8f', border: '1px solid rgba(42,157,143,0.3)', fontFamily: "'Open Sans', sans-serif" }}>
              <Brain className="w-3 h-3" />
              GPT-4o · LangChain · Anomaly Detection
            </div>
            <h2 className="text-4xl font-bold mb-5" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>
              Ask Your Finances
              <br />
              <span style={{ color: '#2a9d8f' }}>Anything. In Plain English.</span>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,247,230,0.6)', fontFamily: "'Open Sans', sans-serif" }}>
              FACT AI understands your hospital's financial context. Ask in natural language, get board-ready answers with chart breakdowns, drill-downs, and automated alerts — no SQL, no pivot tables.
            </p>
            <div className="space-y-3">
              {[
                'Natural language financial queries',
                'Real-time anomaly & fraud detection',
                'Predictive cash flow forecasting',
                'Auto-generated CFO narratives',
                'TPA claim success optimisation',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#2a9d8f' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,247,230,0.7)', fontFamily: "'Open Sans', sans-serif" }}>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Chat UI */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,247,230,0.04)', border: '1px solid rgba(255,247,230,0.08)' }}>
            <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(255,247,230,0.04)', borderBottom: '1px solid rgba(255,247,230,0.08)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2a9d8f' }}>
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>FACT AI Financial Analyst</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[10px]" style={{ color: 'rgba(255,247,230,0.4)' }}>Connected to live data</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4 min-h-[280px]">
              {queries.map((item, i) => (
                <div
                  key={i}
                  className="transition-all duration-500"
                  style={{ opacity: i === active ? 1 : 0.25, transform: i === active ? 'scale(1)' : 'scale(0.98)' }}
                >
                  {/* User bubble */}
                  <div className="flex justify-end mb-2">
                    <div className="px-3 py-2 rounded-xl rounded-tr-sm max-w-[85%]" style={{ backgroundColor: 'rgba(42,157,143,0.2)', border: '1px solid rgba(42,157,143,0.3)' }}>
                      <p className="text-xs" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>{item.q}</p>
                    </div>
                  </div>
                  {/* AI bubble */}
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: 'rgba(42,157,143,0.2)' }}>
                      <Brain className="w-3 h-3" style={{ color: '#2a9d8f' }} />
                    </div>
                    <div className="px-3 py-2 rounded-xl rounded-tl-sm max-w-[90%]" style={{ backgroundColor: 'rgba(255,247,230,0.06)', border: '1px solid rgba(255,247,230,0.08)' }}>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,247,230,0.75)', fontFamily: "'Open Sans', sans-serif" }}>{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,247,230,0.06)', border: '1px solid rgba(255,247,230,0.1)' }}>
                <input
                  readOnly
                  placeholder="Ask anything about your finances..."
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{ color: 'rgba(255,247,230,0.4)', fontFamily: "'Open Sans', sans-serif" }}
                />
                <button className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2a9d8f' }}>
                  <ArrowRight className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Dashboard Showcase ────────────────────────────────────────────────────────
function DashboardShowcase() {
  const showcases = [
    {
      tag: 'CFO Dashboard',
      title: 'Board-Ready Financial Intelligence',
      desc: 'Real-time KPI cards, drill-down from revenue to individual invoices, department-wise P&L, and AI-generated monthly narratives — all in one view.',
      items: ['Revenue vs Collection heatmap', 'Department P&L comparison', 'Cash position & burn rate', '90-day forecast overlay'],
      accent: '#2a9d8f',
    },
    {
      tag: 'Hospital Billing',
      title: 'End-to-End Patient Revenue Cycle',
      desc: 'From OPD registration to final collection — manage IPD billing, procedure charges, bed tariffs, insurance pre-auth, and TPA settlements seamlessly.',
      items: ['OPD / IPD billing workflows', 'Insurance pre-auth tracking', 'Itemised invoice generation', 'Collection reconciliation'],
      accent: '#7c3aed',
    },
    {
      tag: 'Insurance & TPA',
      title: 'Claim-to-Collection Management',
      desc: 'Submit, track, and settle insurance claims across all TPAs. Automated aging alerts, denial pattern analysis, and GPT-powered appeal drafts.',
      items: ['Multi-TPA dashboard', 'Claim age analysis', 'Denial reason analytics', 'Settlement reconciliation'],
      accent: '#0891b2',
    },
  ];

  const [activeTab, setActiveTab] = useState(0);
  const sh = showcases[activeTab];

  return (
    <section className="py-24" style={{ backgroundColor: '#f8f3e8' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#1C3741', fontFamily: "'Open Sans', sans-serif" }}>
            See It in Action
          </h2>
          <p className="text-base" style={{ color: 'rgba(28,55,65,0.6)', fontFamily: "'Open Sans', sans-serif" }}>
            Purpose-built workflows for every healthcare finance role.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {showcases.map((s, i) => (
            <button
              key={s.tag}
              onClick={() => setActiveTab(i)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === i ? '#1C3741' : 'transparent',
                color: activeTab === i ? '#FFF7E6' : 'rgba(28,55,65,0.6)',
                border: `1px solid ${activeTab === i ? '#1C3741' : 'rgba(28,55,65,0.15)'}`,
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              {s.tag}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-center">
          {/* Left info */}
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: `${sh.accent}15`, color: sh.accent, border: `1px solid ${sh.accent}30`, fontFamily: "'Open Sans', sans-serif" }}>
              {sh.tag}
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#1C3741', fontFamily: "'Open Sans', sans-serif" }}>{sh.title}</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(28,55,65,0.6)', fontFamily: "'Open Sans', sans-serif" }}>{sh.desc}</p>
            <div className="space-y-2.5">
              {sh.items.map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: sh.accent }} />
                  <span className="text-sm" style={{ color: 'rgba(28,55,65,0.7)', fontFamily: "'Open Sans', sans-serif" }}>{item}</span>
                </div>
              ))}
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: sh.accent, color: '#fff', fontFamily: "'Open Sans', sans-serif" }}
            >
              Explore Module
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — mock screen */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#1C3741', border: '1px solid rgba(255,247,230,0.08)' }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,247,230,0.08)' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-3 text-[10px]" style={{ color: 'rgba(255,247,230,0.3)' }}>{sh.tag} — FACT FinOS</span>
            </div>
            <div className="p-5">
              {/* Mini KPI row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Total Billed', value: '₹8.4Cr', color: '#2a9d8f' },
                  { label: 'Collected', value: '₹7.1Cr', color: '#059669' },
                  { label: 'Pending', value: '₹1.3Cr', color: '#f59e0b' },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,247,230,0.05)' }}>
                    <p className="text-[10px] mb-1" style={{ color: 'rgba(255,247,230,0.4)', fontFamily: "'Open Sans', sans-serif" }}>{k.label}</p>
                    <p className="text-lg font-bold" style={{ color: k.color, fontFamily: "'Open Sans', sans-serif" }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bars */}
              <div className="space-y-2.5">
                {[
                  { dept: 'Cardiology', pct: 94, amt: '₹2.1Cr' },
                  { dept: 'Orthopaedics', pct: 87, amt: '₹1.6Cr' },
                  { dept: 'Oncology', pct: 78, amt: '₹1.9Cr' },
                  { dept: 'Radiology', pct: 91, amt: '₹0.9Cr' },
                ].map((d) => (
                  <div key={d.dept}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px]" style={{ color: 'rgba(255,247,230,0.6)', fontFamily: "'Open Sans', sans-serif" }}>{d.dept}</span>
                      <span className="text-[11px] font-semibold" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>{d.amt}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,247,230,0.1)' }}>
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${d.pct}%`, backgroundColor: sh.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Security Section ──────────────────────────────────────────────────────────
function Security() {
  const pillars = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      desc: 'AES-256 at rest, TLS 1.3 in transit. Every byte of financial data is encrypted before it touches disk.',
    },
    {
      icon: Eye,
      title: 'Immutable Audit Trail',
      desc: 'Every action, every user, every timestamp — logged to an append-only ledger that cannot be deleted or altered.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access Control',
      desc: 'Granular permissions down to field level. CFOs, billing staff, auditors — each sees exactly what they need.',
    },
    {
      icon: Database,
      title: 'Multi-Tenant Isolation',
      desc: 'PostgreSQL Row-Level Security ensures strict data isolation between hospital entities and departments.',
    },
    {
      icon: Cpu,
      title: 'AI Anomaly Detection',
      desc: 'Real-time ML monitoring flags unusual transactions, duplicate payments, and fraud patterns automatically.',
    },
    {
      icon: Award,
      title: 'Compliance Ready',
      desc: 'Designed for HIPAA, SOC 2 Type II, ISO 27001, DPDP Act, and Indian healthcare data regulations.',
    },
  ];

  return (
    <section id="security" className="py-24" style={{ backgroundColor: '#1C3741' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(42,157,143,0.15)', color: '#2a9d8f', border: '1px solid rgba(42,157,143,0.3)', fontFamily: "'Open Sans', sans-serif" }}>
            <Shield className="w-3 h-3" />
            Enterprise-Grade Security
          </div>
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>
            Security Is Not a Feature.
            <br />
            <span style={{ color: '#2a9d8f' }}>It's the Foundation.</span>
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(255,247,230,0.55)', fontFamily: "'Open Sans', sans-serif" }}>
            Patient financial data demands the highest protection. FACT FinOS is built with a security-first architecture from day one.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-2xl transition-all duration-200"
              style={{ backgroundColor: 'rgba(255,247,230,0.04)', border: '1px solid rgba(255,247,230,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(42,157,143,0.08)'; e.currentTarget.style.borderColor = 'rgba(42,157,143,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,247,230,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,247,230,0.07)'; }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(42,157,143,0.15)' }}>
                <Icon className="w-5 h-5" style={{ color: '#2a9d8f' }} />
              </div>
              <h3 className="font-semibold text-sm mb-2" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,247,230,0.5)', fontFamily: "'Open Sans', sans-serif" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Compliance logos */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {['HIPAA', 'SOC 2 Type II', 'ISO 27001', 'DPDP Act', 'NABH Ready', 'GST Compliant'].map((badge) => (
            <div
              key={badge}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: 'rgba(255,247,230,0.05)', color: 'rgba(255,247,230,0.6)', border: '1px solid rgba(255,247,230,0.1)', fontFamily: "'Open Sans', sans-serif" }}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────
function Integrations() {
  const integrations = [
    'HIS / HMS Systems', 'Tally ERP', 'HRMS Platforms', 'Razorpay / CCAvenue',
    'NEFT / RTGS Banking', 'GST Portal', 'EPFO / ESIC', 'Google Workspace',
    'WhatsApp Business', 'Twilio SMS', 'OpenAI GPT-4o', 'AWS / Azure',
  ];

  return (
    <section className="py-24" style={{ backgroundColor: '#FFF7E6' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#1C3741', fontFamily: "'Open Sans', sans-serif" }}>
            Connects to Your Existing Stack
          </h2>
          <p className="text-base" style={{ color: 'rgba(28,55,65,0.6)', fontFamily: "'Open Sans', sans-serif" }}>
            REST APIs, webhooks, and native connectors for 50+ systems.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {integrations.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#fff', color: '#1C3741', border: '1px solid rgba(28,55,65,0.1)', fontFamily: "'Open Sans', sans-serif", boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Globe className="w-3.5 h-3.5" style={{ color: '#2a9d8f' }} />
              {name}
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: 'rgba(28,55,65,0.4)', fontFamily: "'Open Sans', sans-serif" }}>
            + 50 more integrations available · Custom API on Enterprise plan
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    {
      name: 'Dr Ananya Krishnan',
      role: 'CFO, Sunrise Multispecialty Hospital',
      avatar: 'AK',
      stars: 5,
      quote: 'FACT FinOS replaced three separate software tools. Our month-end close went from 12 days to 3. The AI anomaly alerts alone saved us ₹18L in billing errors last quarter.',
    },
    {
      name: 'Rajesh Iyer',
      role: 'Finance Director, Apollo Medical College',
      avatar: 'RI',
      stars: 5,
      quote: 'The TPA module is exceptional. We track 14 insurance companies in one dashboard. Collection rate improved 11% in 6 months. The team loves the clean interface.',
    },
    {
      name: 'Priya Menon',
      role: 'COO, Lifespring Healthcare Chain',
      avatar: 'PM',
      stars: 5,
      quote: 'Rolled out across 7 hospitals in 3 weeks. The multi-tenant isolation means each unit sees only their data while we get consolidated group financials. Exactly what we needed.',
    },
  ];

  return (
    <section className="py-24" style={{ backgroundColor: '#f8f3e8' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#1C3741', fontFamily: "'Open Sans', sans-serif" }}>
            Trusted by Healthcare Finance Leaders
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map(({ name, role, avatar, stars, quote }) => (
            <div
              key={name}
              className="p-6 rounded-2xl"
              style={{ backgroundColor: '#fff', border: '1px solid rgba(28,55,65,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#f59e0b' }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(28,55,65,0.7)', fontFamily: "'Open Sans', sans-serif" }}>"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#1C3741', color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1C3741', fontFamily: "'Open Sans', sans-serif" }}>{name}</p>
                  <p className="text-xs" style={{ color: 'rgba(28,55,65,0.5)', fontFamily: "'Open Sans', sans-serif" }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing / CTA ────────────────────────────────────────────────────────────
function PricingCTA() {
  const plans = [
    {
      name: 'Growth',
      price: '₹49,999',
      period: '/month',
      desc: 'For single-facility hospitals up to 200 beds.',
      features: [
        'Core Accounting + GL',
        'Patient Billing & AR',
        'Insurance / TPA (3 companies)',
        'Payroll (up to 300 staff)',
        'Standard Reports',
        'Email support',
      ],
      cta: 'Start Free Trial',
      accent: '#2e5f6e',
      popular: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For hospital chains, medical colleges, and large multi-facility networks.',
      features: [
        'All 22 modules included',
        'Unlimited beds & staff',
        'Unlimited TPA integrations',
        'AI Engine + Anomaly Alerts',
        'Multi-entity consolidation',
        'Dedicated CSM + SLA',
        'On-premise or private cloud',
        'Custom NABH / regulatory reports',
      ],
      cta: 'Contact Sales',
      accent: '#2a9d8f',
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24" style={{ backgroundColor: '#1C3741' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-base" style={{ color: 'rgba(255,247,230,0.55)', fontFamily: "'Open Sans', sans-serif" }}>
            No per-user limits. No surprise fees. Everything included.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl p-7 relative"
              style={{
                backgroundColor: plan.popular ? 'rgba(42,157,143,0.08)' : 'rgba(255,247,230,0.04)',
                border: `1px solid ${plan.popular ? 'rgba(42,157,143,0.4)' : 'rgba(255,247,230,0.08)'}`,
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#2a9d8f', color: '#fff', fontFamily: "'Open Sans', sans-serif" }}>
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold mb-1" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>{plan.name}</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl font-bold" style={{ color: plan.accent, fontFamily: "'Open Sans', sans-serif" }}>{plan.price}</span>
                {plan.period && <span className="text-sm mb-1" style={{ color: 'rgba(255,247,230,0.4)', fontFamily: "'Open Sans', sans-serif" }}>{plan.period}</span>}
              </div>
              <p className="text-xs mb-5" style={{ color: 'rgba(255,247,230,0.5)', fontFamily: "'Open Sans', sans-serif" }}>{plan.desc}</p>
              <div className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: plan.accent }} />
                    <span className="text-sm" style={{ color: 'rgba(255,247,230,0.65)', fontFamily: "'Open Sans', sans-serif" }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/login"
                className="block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: plan.accent, color: '#fff', fontFamily: "'Open Sans', sans-serif" }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255,247,230,0.3)', fontFamily: "'Open Sans', sans-serif" }}>
          All plans include 30-day free trial · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ backgroundColor: '#142830' }} className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2a9d8f' }}>
                <span className="font-bold text-sm text-white">F</span>
              </div>
              <span className="font-bold text-sm" style={{ color: '#FFF7E6', fontFamily: "'Open Sans', sans-serif" }}>FACT FinOS</span>
            </div>
            <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,247,230,0.4)', fontFamily: "'Open Sans', sans-serif" }}>
              The complete financial operating system for modern healthcare organisations.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: 'rgba(255,247,230,0.06)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(42,157,143,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,247,230,0.06)'}
                >
                  <Icon className="w-4 h-4" style={{ color: 'rgba(255,247,230,0.5)' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,247,230,0.35)', fontFamily: "'Open Sans', sans-serif" }}>Product</p>
            <div className="space-y-2.5">
              {['Features', 'AI Engine', 'Security', 'Integrations', 'Changelog', 'Roadmap'].map((item) => (
                <a key={item} href="#" className="block text-xs transition-colors" style={{ color: 'rgba(255,247,230,0.5)', fontFamily: "'Open Sans', sans-serif" }}
                  onMouseEnter={e => e.target.style.color = '#FFF7E6'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,247,230,0.5)'}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,247,230,0.35)', fontFamily: "'Open Sans', sans-serif" }}>Solutions</p>
            <div className="space-y-2.5">
              {['Multi-Specialty Hospitals', 'Medical Colleges', 'Diagnostic Chains', 'Clinic Networks', 'Healthcare CFOs', 'Billing Departments'].map((item) => (
                <a key={item} href="#" className="block text-xs transition-colors" style={{ color: 'rgba(255,247,230,0.5)', fontFamily: "'Open Sans', sans-serif" }}
                  onMouseEnter={e => e.target.style.color = '#FFF7E6'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,247,230,0.5)'}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,247,230,0.35)', fontFamily: "'Open Sans', sans-serif" }}>Contact</p>
            <div className="space-y-3">
              {[
                { icon: Mail, text: 'hello@factfinos.com' },
                { icon: Phone, text: '+91 98765 43210' },
                { icon: MapPin, text: 'Bengaluru · Mumbai · Delhi' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#2a9d8f' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,247,230,0.5)', fontFamily: "'Open Sans', sans-serif" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,247,230,0.06)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,247,230,0.25)', fontFamily: "'Open Sans', sans-serif" }}>
            © 2026 FACT FinOS. All rights reserved. Made in India.
          </p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'Security Policy'].map((item) => (
              <a key={item} href="#" className="text-xs transition-colors" style={{ color: 'rgba(255,247,230,0.3)', fontFamily: "'Open Sans', sans-serif" }}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif" }}>
      <Navbar />
      <Hero />
      <MetricsBanner />
      <Features />
      <AISection />
      <DashboardShowcase />
      <Security />
      <Integrations />
      <Testimonials />
      <PricingCTA />
      <Footer />
    </div>
  );
}
