import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Sparkles, Star, Clock, Shield, Package,
  ChevronRight, Layers, Stethoscope, FlaskConical, ScanLine,
  Scissors, HeartPulse, Bed, Pill, Activity, Zap,
  TrendingUp, AlertTriangle,
} from 'lucide-react';
import { NI_SERVICE_CATALOG, NI_SERVICE_CATEGORIES, NI_TAX_GROUPS, fmt } from './NIConstants';

const CATEGORY_ICONS = {
  all:          Layers,
  CONSULTATION: Stethoscope,
  LAB:          FlaskConical,
  RADIOLOGY:    ScanLine,
  SURGERY:      Scissors,
  ICU:          HeartPulse,
  ROOM:         Bed,
  PHARMACY:     Pill,
  PHYSIO:       Activity,
  PROCEDURE:    Zap,
};

const AI_SUGGESTIONS = [
  { query:'ICU daily charges',           results:['ROOM-ICU-01','ICU-VENT-01','ICU-MONITOR-01','ICU-NURSING-01'] },
  { query:'MRI brain with contrast',      results:['RAD-MRI-BRAIN'] },
  { query:'Standard dengue workup',       results:['LAB-DENGUE-01','LAB-CBC-01','CONS-GP-01'] },
  { query:'Pre-surgery lab panel',        results:['LAB-CBC-01','LAB-LFT-01','LAB-RFT-01','RAD-ECG-01'] },
  { query:'Cardiac screening package',   results:['CONS-SPEC-01','RAD-ECG-01','RAD-ECHO-01','LAB-LIPID-01'] },
];

function ServiceCard({ svc, onSelect, compact = false }) {
  const taxLabel = NI_TAX_GROUPS.find(t => t.rate === svc.taxPct)?.name ?? `GST ${svc.taxPct}%`;

  return (
    <motion.button
      whileHover={{ scale:1.01 }}
      whileTap={{  scale:0.99 }}
      onClick={() => onSelect(svc)}
      className={`w-full text-left bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-md transition-all group ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className={`font-semibold text-slate-800 leading-snug ${compact ? 'text-xs' : 'text-sm'} group-hover:text-sky-700 transition-colors`}>
                {svc.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] text-slate-400">{svc.code}</span>
                <span className="text-slate-200">·</span>
                <span className="text-[10px] text-slate-400">{svc.category}</span>
                {svc.popular && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-semibold border border-amber-200">
                    <Star className="w-2 h-2" /> Popular
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className={`font-bold tabular-nums text-slate-800 ${compact ? 'text-sm' : 'text-base'}`}>{fmt(svc.unitPrice)}</div>
              <div className="text-[10px] text-slate-400">{taxLabel}</div>
            </div>
          </div>

          {!compact && (
            <div className="flex items-center gap-3 mt-2">
              <span className={`flex items-center gap-1 text-[10px] font-medium ${svc.insuranceEligible ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Shield className="w-3 h-3" />
                {svc.insuranceEligible ? 'Insurance covered' : 'Not covered'}
              </span>
              <span className={`flex items-center gap-1 text-[10px] font-medium ${svc.packageable ? 'text-sky-600' : 'text-slate-400'}`}>
                <Package className="w-3 h-3" />
                {svc.packageable ? 'Package eligible' : 'Standalone only'}
              </span>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-300 group-hover:text-sky-500 transition-colors">
                Select <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function AISuggestionCard({ suggestion, onSelectAll, onSelectOne }) {
  const services = suggestion.results
    .map(code => NI_SERVICE_CATALOG.find(s => s.code === code))
    .filter(Boolean);

  const totalValue = services.reduce((s, svc) => s + svc.unitPrice, 0);

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-800">{suggestion.query}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-500 font-medium">{fmt(totalValue)} total</span>
          <button
            onClick={() => onSelectAll(services)}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Add All
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {services.map(svc => (
          <button
            key={svc.code}
            onClick={() => onSelectOne(svc)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-indigo-700 hover:border-indigo-400 hover:shadow-sm transition-all"
          >
            {svc.name.length > 28 ? svc.name.slice(0, 28) + '…' : svc.name}
            <span className="text-indigo-400">{fmt(svc.unitPrice)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NIServiceSearch({ open, onClose, onSelect, onSelectMultiple }) {
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState('all');
  const [aiMode,   setAiMode]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCategory('all');
      setAiMode(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    let res = NI_SERVICE_CATALOG;
    if (category !== 'all') res = res.filter(s => s.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      res = res.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.dept.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return res;
  }, [query, category]);

  const popular  = useMemo(() => NI_SERVICE_CATALOG.filter(s => s.popular), []);
  const recent   = useMemo(() => NI_SERVICE_CATALOG.slice(0, 4), []);
  const showHome = !query.trim() && category === 'all';

  function handleSelect(svc) {
    onSelect(svc);
    onClose();
  }

  function handleSelectAll(svcs) {
    onSelectMultiple(svcs);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          exit={{   opacity:0 }}
          transition={{ duration:0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity:0, scale:0.96, y:16 }}
            animate={{ opacity:1, scale:1,    y:0  }}
            exit={{   opacity:0, scale:0.96, y:16  }}
            transition={{ duration:0.2, ease:'easeOut' }}
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Search header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-sky-500" />
                  <h2 className="font-bold text-slate-800">Service Search</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiMode(p => !p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      aiMode
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Suggest
                  </button>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={'Search services, codes, departments… try "ICU daily" or "MRI Brain"'}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50 placeholder:text-slate-400"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {NI_SERVICE_CATEGORIES.map(cat => {
                  const Icon = CATEGORY_ICONS[cat.id] ?? Layers;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all shrink-0 ${
                        category === cat.id
                          ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* AI mode — suggestion cards */}
              {aiMode && !query && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-sm font-semibold text-slate-700">AI-Suggested Service Bundles</h4>
                  </div>
                  {AI_SUGGESTIONS.map(s => (
                    <AISuggestionCard
                      key={s.query}
                      suggestion={s}
                      onSelectAll={handleSelectAll}
                      onSelectOne={handleSelect}
                    />
                  ))}
                </div>
              )}

              {/* Home state — popular + recent */}
              {showHome && !aiMode && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-amber-500" />
                      <h4 className="text-sm font-semibold text-slate-700">Popular Services</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {popular.map(svc => (
                        <ServiceCard key={svc.code} svc={svc} onSelect={handleSelect} compact />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <h4 className="text-sm font-semibold text-slate-700">Recently Used</h4>
                    </div>
                    <div className="space-y-2">
                      {recent.map(svc => (
                        <ServiceCard key={svc.code} svc={svc} onSelect={handleSelect} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Search / filtered results */}
              {(query.trim() || category !== 'all') && (
                <div>
                  {filtered.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-700">
                          {filtered.length} service{filtered.length !== 1 ? 's' : ''} found
                        </h4>
                        <span className="text-xs text-slate-400">
                          Avg ₹{Math.round(filtered.reduce((s,r) => s+r.unitPrice,0)/filtered.length).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {filtered.map(svc => (
                          <ServiceCard key={svc.code} svc={svc} onSelect={handleSelect} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">No services found for <span className="font-medium text-slate-600">"{query}"</span></p>
                      <p className="text-xs text-slate-300 mt-1">Try a different keyword or browse by category</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>{NI_SERVICE_CATALOG.length} services in catalog</span>
              <div className="flex items-center gap-4">
                <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded shadow-sm">↑↓</kbd> navigate</span>
                <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded shadow-sm">Enter</kbd> select</span>
                <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded shadow-sm">Esc</kbd> close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
