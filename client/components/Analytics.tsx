
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, ComposedChart, Area } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Wallet, CreditCard, Activity, Receipt } from 'lucide-react';
import { fmtMoney, parseDate, getWorkingDaysInMonth, pad2, effectiveFactHours, fteToHours, VAT_RATE } from '../utils';
import { Project, Person, Assignment } from '../types';

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 rounded-lg shadow-xl text-xs z-50">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 capitalize">{entry.name}:</span>
            <span className="font-medium text-slate-900">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const TeamWorkloadChart = ({ plan, fact, labels }: { plan: number[], fact: number[], labels: string[] }) => {
  const data = labels.map((l, i) => ({ name: l, План: plan[i], Факт: fact[i] }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={1} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} domain={[0, 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="План" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="Факт" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const MonthlyWorkloadChart = ({ plan, fact, labels }: { plan: number[], fact: number[], labels: string[] }) => {
  const data = labels.map((l, i) => ({ name: l, План: plan[i], Факт: fact[i] }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} />
        <YAxis 
          tick={{ fontSize: 10, fill: '#94a3b8' }} 
          axisLine={false} 
          tickLine={false} 
          width={30} 
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="План" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="Факт" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const TripleBarChart = ({ a, b, c, labels }: { a: number, b: number, c: number, labels: string[] }) => {
  const data = [
    { name: 'Total', [labels[0]]: a, [labels[1]]: b, [labels[2]]: c }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" barSize={30} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tickFormatter={(val) => `₽${(val/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" hide />
        <Tooltip content={<CustomTooltip formatter={fmtMoney} />} cursor={{fill: '#f8fafc'}} />
        <Bar dataKey={labels[0]} fill="#10b981" radius={[0, 4, 4, 0]} />
        <Bar dataKey={labels[1]} fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey={labels[2]} fill="#ef4444" radius={[0, 4, 4, 0]} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const MonthlyBarChart = ({ income, expense, labels }: { income: number[], expense: number[], labels: string[] }) => {
  const data = labels.map((l, i) => ({ name: l, Доход: income[i], Расход: expense[i] }));
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip formatter={fmtMoney} />} cursor={{fill: '#f8fafc'}} />
        <Bar dataKey="Доход" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Расход" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// --- NEW FINANCIAL COMPONENTS ---

export const FinancialAnalyticsView = ({ 
  projects, people, assignments, year, includeVat 
}: { 
  projects: Project[], people: Person[], assignments: Assignment[], year: number, includeVat: boolean 
}) => {
  
  // --- 1. Aggregation Logic ---
  const months = Array.from({length: 12}, (_, i) => i);
  const monthLabels = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  
  // Helpers
  const rateFor = (personId: string, projectType: string) => {
    const p = people.find(x => x.id === personId);
    if (!p) return 0;
    return projectType === "internal" ? (p.rateInternal || 0) : (p.rateExternal || 0);
  };

  // Data Structures
  const monthlyStats = months.map(m => ({ 
    month: m, 
    income: 0, 
    costFact: 0, 
    costPlan: 0, 
    vat: 0 
  }));

  const projectStats = projects.filter(p => !p.isArchived).map(p => {
    let income = 0;
    let costFact = 0;
    let costPlan = 0;
    let vatCollected = 0;

    // Income & VAT from Contracts
    p.contracts.forEach(c => {
      const d = parseDate(c.date);
      if (d && d.getFullYear() === year) {
        const m = d.getMonth();
        const amt = c.amount || 0;
        
        // Income Logic: We take the net amount as income
        let net = amt;
        let vat = 0;
        
        if (c.vatMode === 'gross') {
           net = Math.round(amt / (1 + VAT_RATE));
           vat = amt - net;
        } else {
           vat = Math.round(amt * VAT_RATE);
        }

        income += (c.vatMode === 'gross' ? net : amt); // Contract Amount is usually revenue. If gross, we strip VAT.
        vatCollected += vat;
        
        monthlyStats[m].income += (c.vatMode === 'gross' ? net : amt);
        monthlyStats[m].vat += vat;
      }
    });

    // Costs from Assignments
    // Iterate assignments for this project
    const projAssignments = assignments.filter(a => a.projectId === p.id);
    projAssignments.forEach(a => {
        const d = parseDate(a.weekStart);
        if (d && d.getFullYear() === year) {
           const m = d.getMonth();
           const rate = rateFor(a.personId, p.projectType);
           
           // Plan
           const pHours = fteToHours(a.fte);
           const pCost = pHours * rate;
           
           // Fact
           const fHours = effectiveFactHours(a, a.weekStart);
           const fCost = fHours * rate;
           
           costPlan += pCost;
           costFact += fCost;
           
           monthlyStats[m].costPlan += pCost;
           monthlyStats[m].costFact += fCost;
        }
    });

    // Total Expense for Profit Calc
    const expense = costFact + (includeVat ? vatCollected : 0);
    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;

    return { 
        ...p, 
        stats: { income, costFact, costPlan, vatCollected, expense, profit, margin } 
    };
  }).sort((a, b) => b.stats.profit - a.stats.profit); // Sort by Profit desc

  // Totals
  const totalIncome = monthlyStats.reduce((a, b) => a + b.income, 0);
  const totalCostFact = monthlyStats.reduce((a, b) => a + b.costFact, 0);
  const totalVat = monthlyStats.reduce((a, b) => a + b.vat, 0);
  
  const totalExpense = totalCostFact + (includeVat ? totalVat : 0);
  const totalProfit = totalIncome - totalExpense;
  const totalMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;

  // Chart Data
  const chartData = monthlyStats.map((d, i) => ({
      name: monthLabels[i],
      Выручка: d.income,
      "Расходы (Факт)": d.costFact + (includeVat ? d.vat : 0),
      "Расходы (План)": d.costPlan + (includeVat ? d.vat : 0), // Assuming VAT is same for plan/fact for simplicity or just omit VAT in plan
      "Прибыль": d.income - (d.costFact + (includeVat ? d.vat : 0))
  }));

  return (
    <div className="space-y-6">
       {/* KPI Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Выручка (Сделки)" 
            value={fmtMoney(totalIncome)} 
            icon={Wallet} 
            color="text-emerald-600" 
            bgColor="bg-emerald-50" 
            borderColor="border-emerald-100"
          />
          <KpiCard 
            title={`Расходы ${includeVat ? '(вкл. НДС)' : '(ФОТ)'}`} 
            value={fmtMoney(totalExpense)} 
            icon={CreditCard} 
            color="text-rose-600" 
            bgColor="bg-rose-50" 
            borderColor="border-rose-100"
            subtext={`ФОТ: ${fmtMoney(totalCostFact)}`}
          />
          <KpiCard 
            title="Чистая прибыль" 
            value={fmtMoney(totalProfit)} 
            icon={DollarSign} 
            color={totalProfit >= 0 ? "text-indigo-600" : "text-rose-600"} 
            bgColor={totalProfit >= 0 ? "bg-indigo-50" : "bg-rose-50"} 
            borderColor={totalProfit >= 0 ? "border-indigo-100" : "border-rose-100"}
          />
           <KpiCard 
            title="Рентабельность" 
            value={`${totalMargin.toFixed(1)}%`} 
            icon={Activity} 
            color={totalMargin > 20 ? "text-emerald-600" : totalMargin > 0 ? "text-amber-600" : "text-rose-600"} 
            bgColor="bg-slate-50" 
            borderColor="border-slate-200"
          />
       </div>

       {/* Main Chart */}
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-lg font-bold text-slate-800">Финансовая динамика (План/Факт)</h3>
                  <p className="text-sm text-slate-500">Сравнение поступлений от сделок и фактических расходов на команду</p>
               </div>
               <div className="flex gap-4 text-xs">
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"/> Выручка</div>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"/> Расход (Факт)</div>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-400 opacity-50"/> Расход (План)</div>
               </div>
           </div>
           <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={chartData} barGap={0}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                       <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                       <Tooltip content={<CustomTooltip formatter={fmtMoney} />} cursor={{fill: '#f8fafc', opacity: 0.5}} />
                       {/* Plan Cost Area */}
                       <Area type="monotone" dataKey="Расходы (План)" fill="#94a3b8" stroke="#94a3b8" strokeDasharray="5 5" fillOpacity={0.1} strokeOpacity={0.5} strokeWidth={2} activeDot={false} />
                       
                       {/* Income Bar */}
                       <Bar dataKey="Выручка" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                       
                       {/* Fact Cost Bar */}
                       <Bar dataKey="Расходы (Факт)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                       
                   </ComposedChart>
               </ResponsiveContainer>
           </div>
       </div>

       {/* Project Profitability Table */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800">Эффективность проектов</h3>
               <span className="text-xs text-slate-500">Топ по прибыли</span>
           </div>
           <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 font-medium">
                       <tr>
                           <th className="px-6 py-3">Проект</th>
                           <th className="px-6 py-3 text-right">Выручка (Сделки)</th>
                           <th className="px-6 py-3 text-right">ФОТ (Списания)</th>
                           {includeVat && <th className="px-6 py-3 text-right">НДС</th>}
                           <th className="px-6 py-3 text-right">Прибыль</th>
                           <th className="px-6 py-3 text-right">Рентабельность</th>
                           <th className="px-6 py-3 w-32">Прогресс</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {projectStats.map(p => (
                           <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-6 py-3">
                                   <div className="flex items-center gap-3">
                                       <div className="w-2 h-8 rounded-full" style={{backgroundColor: p.color}} />
                                       <div>
                                           <div className="font-medium text-slate-900">{p.name}</div>
                                           <div className="text-xs text-slate-400 capitalize">{p.projectType === 'internal' ? 'Внутренний' : 'Внешний'}</div>
                                       </div>
                                   </div>
                               </td>
                               <td className="px-6 py-3 text-right font-medium text-slate-700">{fmtMoney(p.stats.income)}</td>
                               <td className="px-6 py-3 text-right text-slate-600">{fmtMoney(p.stats.costFact)}</td>
                               {includeVat && <td className="px-6 py-3 text-right text-slate-400 text-xs">{fmtMoney(p.stats.vatCollected)}</td>}
                               <td className={`px-6 py-3 text-right font-bold ${p.stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtMoney(p.stats.profit)}</td>
                               <td className="px-6 py-3 text-right">
                                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                       p.stats.margin > 20 ? 'bg-emerald-100 text-emerald-800' : 
                                       p.stats.margin > 0 ? 'bg-amber-100 text-amber-800' : 
                                       'bg-rose-100 text-rose-800'
                                   }`}>
                                       {p.stats.margin.toFixed(0)}%
                                   </span>
                               </td>
                               <td className="px-6 py-3">
                                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                       <div 
                                           className={`h-full rounded-full ${p.stats.margin > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                           style={{ width: `${Math.min(100, Math.abs(p.stats.margin))}%` }} 
                                       />
                                   </div>
                               </td>
                           </tr>
                       ))}
                       {projectStats.length === 0 && (
                           <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Нет активных проектов за выбранный период</td></tr>
                       )}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color, bgColor, borderColor, subtext }: any) => (
  <div className={`p-5 rounded-xl border ${borderColor} ${bgColor} shadow-sm flex flex-col justify-between h-32`}>
      <div className="flex justify-between items-start">
          <div className="font-medium text-slate-600 text-sm">{title}</div>
          <div className={`p-2 rounded-lg bg-white/60 ${color}`}>
              <Icon size={18} />
          </div>
      </div>
      <div>
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          {subtext && <div className="text-xs text-slate-500 mt-1 opacity-80">{subtext}</div>}
      </div>
  </div>
);
