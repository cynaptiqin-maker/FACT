import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const formatVal = (v) => {
    const abs = Math.abs(v);
    const prefix = v < 0 ? '-₹' : '₹';
    if (abs >= 10000000) return `${prefix}${(abs / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${prefix}${(abs / 100000).toFixed(1)}L`;
    return `${prefix}${abs.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 shadow-lg min-w-[160px]">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-300 flex-1">{entry.name}:</span>
          <span className="text-white font-semibold font-mono">{formatVal(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function yAxisFormatter(value) {
  const abs = Math.abs(value);
  const prefix = value < 0 ? '-' : '';
  if (abs >= 10000000) return `${prefix}₹${(abs / 10000000).toFixed(0)}Cr`;
  if (abs >= 100000) return `${prefix}₹${(abs / 100000).toFixed(0)}L`;
  return `${prefix}₹${abs}`;
}

/**
 * CashFlowChart — Cash inflows vs outflows with net position line
 *
 * data: Array<{
 *   month: string,
 *   inflow: number,
 *   outflow: number,
 *   net: number    — can be negative
 * }>
 */
export default function CashFlowChart({ data = [], height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={yAxisFormatter}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={65}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
        />
        <Bar dataKey="inflow" name="Cash In" fill="#34d399" maxBarSize={28} radius={[3, 3, 0, 0]} />
        <Bar dataKey="outflow" name="Cash Out" fill="#f87171" maxBarSize={28} radius={[3, 3, 0, 0]} />
        <Line
          type="monotone"
          dataKey="net"
          name="Net Position"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
