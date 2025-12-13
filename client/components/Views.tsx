
import React, { useMemo, useState, useRef } from 'react';
import { Users, Briefcase, Trash2, Edit2, Plus, ArrowRight, DollarSign, Calendar, Clock, ChevronDown, Check, AlertCircle, ArrowLeft, GripVertical, Filter, Archive, RotateCcw, Palmtree, X, Info, PieChart, Receipt, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Project, Person, Assignment, ProjectTeamsMap, ViewMode, VacationsMap, ProjectMemberHoursMap, Contract } from '../types';
import { Button, Badge, Input, Select, Modal } from './UI';
import { 
  fmtHours, fmtMoney, fteToHours, isWeekEnded, personWeekFactTotal, personWeekTotal, 
  hoursToFte, fillRatio, effectiveFactHours, startOfISOWeek, fmtISO, addDays, rndId,
  sumFactForPersonProject, fteFor, personProjectWeekFact, VAT_RATE, parseDate, fmtWeekRange,
  getWorkingDaysInMonth, pad2
} from '../utils';
import { TeamWorkloadChart, MonthlyWorkloadChart } from './Analytics';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';

const WEEK_COL_WIDTH = 90;

/* --- TEAM VIEW --- */

export const TeamView = ({ 
  people, assignments, vacations, weeks, firstIdx, onSelectPerson, teamOrder, 
  roleFilter, setRoleFilter, roles, onMovePerson 
}: {
  people: Person[]; assignments: Assignment[]; vacations: VacationsMap; weeks: string[]; firstIdx: number;
  onSelectPerson: (id: string) => void; teamOrder: string[];
  roleFilter: string; setRoleFilter: (r: string) => void; roles: string[];
  onMovePerson: (dragIdx: number, dropIdx: number) => void;
}) => {
  const visibleWeeks = weeks.slice(firstIdx, firstIdx + 16);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  // Filter team order based on role
  const filteredIndices = useMemo(() => {
    return teamOrder.map((id, index) => {
      const p = people.find(person => person.id === id);
      if (!p || !p.active || p.external) return null;
      if (roleFilter !== 'all' && p.role !== roleFilter) return null;
      return { id, originalIndex: index, person: p };
    }).filter((item): item is { id: string, originalIndex: number, person: Person } => item !== null);
  }, [teamOrder, people, roleFilter]);

  const handleSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      // We need to map the visual indices back to the original teamOrder indices
      const sourceVisualIndex = dragItem.current;
      const targetVisualIndex = dragOverItem.current;
      
      const sourceOriginalIndex = filteredIndices[sourceVisualIndex].originalIndex;
      const targetOriginalIndex = filteredIndices[targetVisualIndex].originalIndex;

      onMovePerson(sourceOriginalIndex, targetOriginalIndex);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Filters Toolbar */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-2">
        <Filter size={14} className="text-slate-500" />
        <span className="text-xs font-medium text-slate-500 mr-2">Фильтр по роли:</span>
        <select 
          className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">Все роли</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="ml-auto text-xs text-slate-400">
          {filteredIndices.length} сотрудников
        </div>
      </div>

      {/* Grid Header */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 sticky top-0 z-20">
        <div className="w-64 shrink-0 p-3 border-r border-slate-200 font-medium text-xs text-slate-500 uppercase tracking-wider bg-slate-50/80 backdrop-blur sticky left-0 z-30 flex items-center">
          Сотрудник
        </div>
        {visibleWeeks.map(iso => {
          return (
            <div key={iso} className="shrink-0 flex flex-col items-center justify-center border-r border-slate-100" style={{ width: WEEK_COL_WIDTH }}>
              <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap px-0.5">{fmtWeekRange(iso)}</span>
            </div>
          );
        })}
      </div>

      {/* Grid Body */}
      <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
        {filteredIndices.map(({ person, id }, visualIndex) => (
          <div 
            key={id} 
            className="flex border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
            draggable={roleFilter === 'all'} // Only allow drag when not filtered (simplifies logic)
            onDragStart={(e) => {
              dragItem.current = visualIndex;
              // Add a ghost class or style if needed
            }}
            onDragEnter={(e) => {
              dragOverItem.current = visualIndex;
            }}
            onDragEnd={handleSort}
            onDragOver={(e) => e.preventDefault()}
          >
            {/* Person Row Header */}
            <div className="w-64 shrink-0 p-0 border-r border-slate-200 bg-white sticky left-0 z-10 group-hover:bg-slate-50/80 transition-colors flex">
              {roleFilter === 'all' && (
                <div className="w-6 shrink-0 flex items-center justify-center cursor-move text-slate-300 hover:text-slate-500 border-r border-slate-50">
                   <GripVertical size={14} />
                </div>
              )}
              <div className="flex-1 p-3 cursor-pointer" onClick={() => onSelectPerson(person.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-200 overflow-hidden">
                    {person.photo ? (
                      <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      person.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-900 truncate">{person.name}</div>
                    <div className="text-xs text-slate-500 truncate">{person.role}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Week Cells */}
            {visibleWeeks.map(week => {
              const totalFte = personWeekTotal(assignments, person.id, week);
              const planHours = Math.round(totalFte * 40);
              const factHours = personWeekFactTotal(assignments, person.id, week);
              const isVacation = vacations[person.id]?.has(week);
              const isOver = planHours > 40;
              const hasFact = factHours > 0 || isWeekEnded(week);

              // Visual calc
              const fill = Math.min(100, (planHours / 40) * 100);
              const barColor = isOver ? 'bg-rose-500' : 'bg-emerald-500';

              return (
                <div key={week} onClick={() => onSelectPerson(person.id)} className="shrink-0 border-r border-slate-100 p-1 relative flex items-center justify-center cursor-pointer" style={{ width: WEEK_COL_WIDTH }}>
                  {isVacation ? (
                    <div className="w-full h-full rounded bg-amber-50 flex items-center justify-center text-lg select-none" title="Отпуск">🏖</div>
                  ) : (
                    <div className={`w-full h-[80%] rounded-md bg-slate-100 relative overflow-hidden flex flex-col items-center justify-center group/cell ${isOver ? 'ring-1 ring-rose-200' : ''}`}>
                      <div className={`absolute bottom-0 left-0 right-0 transition-all ${barColor} opacity-20`} style={{ height: `${fill}%` }} />
                      <div className={`absolute bottom-0 left-0 right-0 w-1 transition-all ${barColor}`} style={{ height: `${fill}%` }} />
                      
                      <div className="relative z-10 text-center leading-none">
                        <div className={`text-xs font-semibold ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>{planHours}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{hasFact ? factHours : '-'}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {filteredIndices.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            Нет сотрудников с выбранной ролью
          </div>
        )}
      </div>
    </div>
  );
};

/* --- PROJECT VIEW --- */

export const ProjectView = ({ 
  projects, setProjects, onOpenProject, onDeleteProject, onToggleArchive, getProjectFactCost 
}: { 
  projects: Project[]; setProjects: React.Dispatch<React.SetStateAction<Project[]>>; 
  onOpenProject: (id: string) => void; onDeleteProject: (id: string) => void;
  onToggleArchive: (p: Project) => void;
  getProjectFactCost: (id: string) => number;
}) => {
  const [viewArchived, setViewArchived] = useState(false);
  const displayedProjects = projects.filter(p => !!p.isArchived === viewArchived);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => setViewArchived(false)} 
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!viewArchived ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Активные ({projects.filter(p => !p.isArchived).length})
        </button>
        <button 
          onClick={() => setViewArchived(true)} 
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewArchived ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Архив ({projects.filter(p => p.isArchived).length})
        </button>
      </div>

      {displayedProjects.length === 0 && (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
           <div className="text-slate-400 mb-2">
             {viewArchived ? <Archive size={32} className="mx-auto opacity-50"/> : <Briefcase size={32} className="mx-auto opacity-50"/>}
           </div>
           <div className="text-slate-500 font-medium">
             {viewArchived ? 'Архив пуст' : 'Нет активных проектов'}
           </div>
           {!viewArchived && <div className="text-sm text-slate-400 mt-1">Создайте новый проект, чтобы начать планирование</div>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedProjects.map(project => {
          const factCost = getProjectFactCost(project.id);
          const percent = project.budgetWithVAT > 0 ? Math.min(100, (factCost / project.budgetWithVAT) * 100) : 0;
          
          return (
            <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col group cursor-pointer relative" onClick={() => onOpenProject(project.id)}>
              
              {/* Card Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/80 backdrop-blur-sm rounded-lg pl-2">
                 {/* Archive/Restore */}
                 <button 
                    className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-md transition-colors"
                    onClick={(e) => { e.stopPropagation(); onToggleArchive(project); }}
                    title={project.isArchived ? "Восстановить" : "В архив"}
                  >
                    {project.isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
                  </button>
                  
                 {/* Delete */}
                 <button 
                  className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-md transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                  title="Удалить навсегда"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="flex items-start justify-between mb-3 pr-16">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <Badge color={project.status === 'active' ? 'green' : project.status === 'onhold' ? 'amber' : project.status === 'done' ? 'blue' : 'slate'}>
                    {project.status === 'active' ? 'Активен' : project.status === 'onhold' ? 'На паузе' : project.status === 'done' ? 'Завершен' : 'В плане'}
                  </Badge>
                </div>
              </div>
              
              <h3 className="font-semibold text-slate-900 mb-1 truncate pr-2" title={project.name}>{project.name}</h3>
              <div className="text-xs text-slate-500 mb-4">{project.projectType === 'internal' ? 'Внутренний' : 'Внешний'} проект</div>
              
              <div className="mt-auto space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Освоение</span>
                    <span className="font-medium text-slate-700">{Math.round(percent)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Бюджет</div>
                    <div className="text-sm font-medium text-slate-900">{fmtMoney(project.budgetWithVAT)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Факт</div>
                    <div className="text-sm font-medium text-slate-700">{fmtMoney(factCost)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --- ANALYTICS TEAM --- */

export const AnalyticsTeamView = ({ 
  people, assignments, weeks, firstIdx, year, setYear
}: { 
  people: Person[]; assignments: Assignment[]; weeks: string[]; firstIdx: number; year: number; setYear: (y: number) => void;
}) => {
  const visibleWeeks = weeks.slice(firstIdx, firstIdx + 12);
  const labels = visibleWeeks.map(w => {
    const d = new Date(w);
    return `${d.getDate()}/${d.getMonth()+1}`;
  });

  return (
    <div className="space-y-4">
      {people.filter(p => p.active && !p.external).map(person => {
        const plan = visibleWeeks.map(w => Math.round(personWeekTotal(assignments, person.id, w) * 40));
        const fact = visibleWeeks.map(w => personWeekFactTotal(assignments, person.id, w));
        
        return (
          <div key={person.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-6 h-64 md:h-48">
            <div className="w-48 shrink-0 flex flex-col justify-center border-r border-slate-50 pr-4">
              <div className="text-lg font-semibold text-slate-900">{person.name}</div>
              <div className="text-sm text-slate-500 mb-2">{person.role}</div>
              <div className="mt-auto flex gap-4 text-xs">
                <div>
                  <div className="text-slate-400">Ср. нагрузка</div>
                  <div className="font-medium text-emerald-600">{Math.round(plan.reduce((a,b)=>a+b,0)/plan.length)}ч</div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
               <TeamWorkloadChart plan={plan} fact={fact} labels={labels} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* --- ANALYTICS WRITE-OFFS --- */
export const AnalyticsWriteOffsView = ({
    people, projects, year, setYear
}: {
    people: Person[]; projects: Project[]; year: number; setYear: (y: number) => void;
}) => {
    const monthLabels = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
    const months = Array.from({length: 12}, (_, i) => `${year}-${pad2(i+1)}`);
    
    // Aggregation Logic
    // Total Capacity: Sum of (Working Days in Month * 8h) for all active team members
    const totalTeamCapacityPerMonth = months.map(m => {
        const [y, mn] = m.split('-').map(Number);
        const workDays = getWorkingDaysInMonth(y, mn - 1);
        const activePeople = people.filter(p => p.active && !p.external).length;
        return activePeople * workDays * 8;
    });
    
    const totalCapacityYear = totalTeamCapacityPerMonth.reduce((a,b) => a+b, 0);
    
    // Write-offs aggregation
    let totalPlanWriteOff = 0;
    let totalFactWriteOff = 0;
    
    // Per Person Data
    const personData = people.filter(p => p.active && !p.external).map(person => {
        const planByMonth = months.map(m => 0);
        const factByMonth = months.map(m => 0);
        
        projects.forEach(prj => {
            (prj.writeOffs || []).filter(w => w.personId === person.id).forEach(w => {
                 const idx = months.indexOf(w.monthStr);
                 if (idx !== -1) {
                     if (w.type === 'plan') planByMonth[idx] += w.hours;
                     else factByMonth[idx] += w.hours;
                 }
            });
        });
        
        const pTotalPlan = planByMonth.reduce((a,b) => a+b, 0);
        const pTotalFact = factByMonth.reduce((a,b) => a+b, 0);
        
        totalPlanWriteOff += pTotalPlan;
        totalFactWriteOff += pTotalFact;
        
        return { person, planByMonth, factByMonth, pTotalPlan, pTotalFact };
    });

    const planPercent = totalCapacityYear > 0 ? (totalPlanWriteOff / totalCapacityYear) * 100 : 0;
    const factPercent = totalCapacityYear > 0 ? (totalFactWriteOff / totalCapacityYear) * 100 : 0;

    const COLORS = ['#10b981', '#e2e8f0']; // Green, Slate-200
    const COLORS_FACT = ['#ef4444', '#e2e8f0']; // Red, Slate-200

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Plan Pie */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                     <div className="w-48 h-48 relative">
                          <ResponsiveContainer width="100%" height="100%">
                             <RePie>
                                 <Pie data={[{value: planPercent}, {value: 100 - planPercent}]} dataKey="value" innerRadius={45} outerRadius={70} startAngle={90} endAngle={-270}>
                                     {[{value: planPercent}, {value: 100 - planPercent}].map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none"/>
                                     ))}
                                 </Pie>
                                 <ReTooltip />
                             </RePie>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-emerald-600">{Math.round(planPercent)}%</div>
                     </div>
                     <div className="text-right">
                         <div className="text-3xl font-bold text-slate-900 mb-1">{totalPlanWriteOff} ч</div>
                         <div className="text-lg font-bold text-slate-800">План списания</div>
                         <div className="text-slate-400 text-sm">% от общей емкости</div>
                     </div>
                 </div>

                 {/* Fact Pie */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                     <div className="w-48 h-48 relative">
                          <ResponsiveContainer width="100%" height="100%">
                             <RePie>
                                 <Pie data={[{value: factPercent}, {value: 100 - factPercent}]} dataKey="value" innerRadius={45} outerRadius={70} startAngle={90} endAngle={-270}>
                                     {[{value: factPercent}, {value: 100 - factPercent}].map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={COLORS_FACT[index % COLORS_FACT.length]} stroke="none"/>
                                     ))}
                                 </Pie>
                                 <ReTooltip />
                             </RePie>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-rose-600">{Math.round(factPercent)}%</div>
                     </div>
                     <div className="text-right">
                         <div className="text-3xl font-bold text-slate-900 mb-1">{totalFactWriteOff} ч</div>
                         <div className="text-lg font-bold text-slate-800">Факт списания</div>
                         <div className="text-slate-400 text-sm">% от общей емкости</div>
                     </div>
                 </div>
            </div>

            {personData.map(({ person, planByMonth, factByMonth, pTotalPlan, pTotalFact }) => (
                <div key={person.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-6 h-64 md:h-64">
                    <div className="w-48 shrink-0 flex flex-col justify-center border-r border-slate-50 pr-4">
                        <div className="text-lg font-semibold text-slate-900">{person.name}</div>
                        <div className="text-sm text-slate-500 mb-2">{person.role}</div>
                        <div className="mt-auto flex flex-col gap-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">План (год):</span>
                                <span className="font-medium text-emerald-600">{pTotalPlan} ч</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-slate-400">Факт (год):</span>
                                <span className="font-medium text-rose-600">{pTotalFact} ч</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <MonthlyWorkloadChart plan={planByMonth} fact={factByMonth} labels={monthLabels} />
                    </div>
                </div>
            ))}
        </div>
    );
};


/* --- PAGES (Previously Modals) --- */

export const PersonDetailPage = ({
  person, onBack, projects, assignments, setAssignments, vacations, setVacations, weeks, firstIdx, projectTeams, setProjectTeams, projectMemberHours,
  onPrevWeek, onNextWeek, onCurrentWeek, currentDateLabel
}: {
  person: Person | null; onBack: () => void; projects: Project[]; assignments: Assignment[]; 
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>; 
  vacations: VacationsMap; setVacations: React.Dispatch<React.SetStateAction<VacationsMap>>;
  weeks: string[]; firstIdx: number; projectTeams: ProjectTeamsMap;
  setProjectTeams: React.Dispatch<React.SetStateAction<ProjectTeamsMap>>;
  projectMemberHours: ProjectMemberHoursMap;
  onPrevWeek: () => void; onNextWeek: () => void; onCurrentWeek: () => void; currentDateLabel: string;
}) => {
  if (!person) return null;
  const visibleWeeks = weeks.slice(firstIdx, firstIdx + 12);
  
  // Modal States
  const [vacationModalOpen, setVacationModalOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  
  // Vacation Range State
  const [vacStart, setVacStart] = useState('');
  const [vacEnd, setVacEnd] = useState('');
  
  const assignedProjects = projects.filter(p => 
    projectTeams[p.id]?.has(person.id) || 
    assignments.some(a => a.personId === person.id && a.projectId === p.id)
  );

  const availableProjects = projects.filter(p => !assignedProjects.some(ap => ap.id === p.id) && !p.isArchived);

  const toggleVacation = (w: string) => {
    setVacations(prev => {
      const next = new Set(prev[person.id] || []);
      if (next.has(w)) next.delete(w); else next.add(w);
      return { ...prev, [person.id]: next };
    });
  };
  
  const handleAddVacationRange = () => {
      if (!vacStart || !vacEnd) return;
      
      const start = new Date(vacStart);
      const end = new Date(vacEnd);
      
      setVacations(prev => {
          const next = new Set(prev[person.id] || []);
          
          // Iterate through days and find corresponding ISO weeks
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              // Ensure we check which ISO week this date belongs to
              // A simple way is to use startOfISOWeek for every day in range
              const isoWeek = fmtISO(startOfISOWeek(d));
              next.add(isoWeek);
          }
          
          return { ...prev, [person.id]: next };
      });
      setVacationModalOpen(false);
      setVacStart('');
      setVacEnd('');
  };

  const updateAssignment = (projectId: string, week: string, val: string, type: 'plan' | 'fact') => {
      // Allow empty string to clear
      const num = val === '' ? 0 : parseInt(val);
      if (isNaN(num)) return; // Simple validation

      setAssignments(prev => {
          const existing = prev.find(a => a.personId === person.id && a.projectId === projectId && a.weekStart === week);
          const others = prev.filter(a => !(a.personId === person.id && a.projectId === projectId && a.weekStart === week));
          
          const currentPlan = existing ? Math.round(existing.fte * 40) : 0;
          const currentFact = existing?.factHours || 0;

          let newPlan = currentPlan;
          let newFact = currentFact;

          if (type === 'plan') newPlan = num;
          else newFact = num;

          if (newPlan === 0 && newFact === 0) {
              return others;
          }
          
          return [...others, { 
              id: existing?.id || rndId(), 
              personId: person.id, 
              projectId: projectId, 
              weekStart: week, 
              fte: newPlan / 40, 
              factHours: newFact 
          }];
      });
  };

  const addProjectToPerson = (projectId: string) => {
      setProjectTeams(prev => {
          const next = new Set(prev[projectId] || []);
          next.add(person.id);
          return { ...prev, [projectId]: next };
      });
      setAddProjectOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Back & Dates */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} icon={ArrowLeft}>Назад</Button>
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onPrevWeek} className="w-8 h-8 p-0"><ChevronLeft size={16}/></Button>
            <Button size="sm" variant="secondary" onClick={onCurrentWeek}>Сегодня</Button>
            <Button size="sm" variant="outline" onClick={onNextWeek} className="w-8 h-8 p-0"><ChevronRight size={16}/></Button>
            <span className="ml-4 text-xs font-medium text-slate-500 capitalize">{currentDateLabel}</span>
        </div>
      </div>

      {/* Second Row: Person Info & Vacation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           {person.photo ? (
              <img src={person.photo} alt={person.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
           ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200">
                {person.name.charAt(0)}
              </div>
           )}
           <div className="flex flex-col">
             <h2 className="text-xl font-bold text-slate-900">{person.name}</h2>
             <span className="text-sm text-slate-500">{person.role}</span>
           </div>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" icon={Plus} onClick={() => setAddProjectOpen(true)}>
             Добавить проект
           </Button>
           <Button variant="secondary" size="sm" icon={Palmtree} onClick={() => setVacationModalOpen(true)}>
             Отпуск
           </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar pb-2">
           <div className="min-w-max">
             {/* Header */}
             <div className="flex border-b border-slate-200 bg-slate-50/50 sticky top-0 z-20">
               <div className="w-80 p-3 font-medium text-xs text-slate-500 uppercase tracking-wider bg-slate-50/80 backdrop-blur sticky left-0 z-30 flex items-center border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Проект</div>
               {visibleWeeks.map(w => {
                 const isVac = vacations[person.id]?.has(w);
                 return (
                  <div key={w} className="w-24 shrink-0 p-1 text-center border-r border-slate-100 last:border-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleVacation(w)}>
                    <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">{fmtWeekRange(w)}</span>
                    {isVac && <span className="text-[10px]">🏖</span>}
                  </div>
                 );
               })}
             </div>

             {/* Total Row */}
             <div className="flex border-b border-slate-50 bg-slate-50/50 hover:bg-slate-50/50 transition-colors group">
               <div className="w-80 p-3 text-xs font-bold text-slate-600 sticky left-0 bg-slate-50/80 backdrop-blur border-r border-slate-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] flex justify-between">
                  <span>ИТОГО</span>
                  <span className="text-[10px] text-slate-400 font-normal">План / Факт</span>
               </div>
               {visibleWeeks.map(w => {
                 const plan = Math.round(personWeekTotal(assignments, person.id, w) * 40);
                 const fact = personWeekFactTotal(assignments, person.id, w);
                 const isOver = plan > 40;
                 return (
                   <div key={w} className={`w-24 shrink-0 p-1 flex flex-col items-center justify-center border-r border-slate-100 text-xs ${isOver ? 'bg-rose-50' : ''}`}>
                     <span className={isOver ? 'text-rose-600 font-bold' : 'font-medium'}>{plan}</span>
                     <span className={`text-[10px] ${fact > 0 ? 'text-slate-600' : 'text-slate-300'}`}>{fact}</span>
                   </div>
                 );
               })}
             </div>

             {/* Projects */}
             {assignedProjects.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">Нет назначенных проектов</div>
             )}
             {assignedProjects.map(p => {
               const plannedTotal = projectMemberHours[p.id]?.[person.id] || 0;
               return (
                 <div key={p.id} className="flex border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors">
                   <div className="w-80 p-3 sticky left-0 bg-white group-hover:bg-slate-50/80 border-r border-slate-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                       <div className="text-sm font-medium truncate text-slate-700" title={p.name}>{p.name}</div>
                     </div>
                     <div className="text-[10px] text-slate-400 pl-4 mt-0.5">План (всего): {plannedTotal}ч</div>
                   </div>
                   {visibleWeeks.map(w => {
                     const isVac = vacations[person.id]?.has(w);
                     const fte = fteFor(assignments, person.id, p.id, w);
                     const fact = personProjectWeekFact(assignments, person.id, p.id, w);
                     const ph = Math.round(fte * 40);
                     
                     if (isVac) return <div key={w} className="w-24 shrink-0 bg-amber-50 border-r border-slate-100" />;

                     return (
                       <div key={w} className="w-24 shrink-0 border-r border-slate-100 p-1 flex flex-col gap-0.5">
                         <input 
                            type="text" 
                            className="w-full h-5 text-center text-[10px] focus:bg-emerald-50 focus:text-emerald-700 border-b border-slate-100 focus:border-emerald-300 outline-none rounded-t text-slate-800 placeholder-slate-200 bg-transparent font-medium"
                            placeholder="-"
                            value={ph > 0 ? ph : ''}
                            onChange={e => updateAssignment(p.id, w, e.target.value, 'plan')}
                         />
                         <input 
                            type="text" 
                            className="w-full h-5 text-center text-[10px] focus:bg-rose-50 focus:text-rose-700 border-t border-transparent focus:border-rose-300 outline-none rounded-b text-slate-500 placeholder-slate-200 bg-transparent"
                            placeholder="-"
                            value={fact > 0 ? fact : ''}
                            onChange={e => updateAssignment(p.id, w, e.target.value, 'fact')}
                         />
                       </div>
                     );
                   })}
                 </div>
               );
             })}
           </div>
        </div>
      </div>

       <Modal open={addProjectOpen} onClose={() => setAddProjectOpen(false)} title="Добавить проект сотруднику">
          <div className="space-y-2 max-h-96 overflow-y-auto">
             {availableProjects.length === 0 && <div className="text-slate-500 text-center py-4">Нет доступных проектов</div>}
             {availableProjects.map(p => (
                 <div key={p.id} onClick={() => addProjectToPerson(p.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                     <div className="w-3 h-3 rounded-full" style={{background: p.color}} />
                     <div className="text-sm font-medium text-slate-700">{p.name}</div>
                 </div>
             ))}
          </div>
       </Modal>
       
       <Modal open={vacationModalOpen} onClose={() => setVacationModalOpen(false)} title="Оформить отпуск" footer={
           <>
              <Button variant="ghost" onClick={() => setVacationModalOpen(false)}>Отмена</Button>
              <Button onClick={handleAddVacationRange}>Сохранить</Button>
           </>
       }>
           <div className="space-y-4">
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Дата начала</label>
                   <Input type="date" value={vacStart} onChange={e => setVacStart(e.target.value)} />
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Дата окончания</label>
                   <Input type="date" value={vacEnd} onChange={e => setVacEnd(e.target.value)} />
               </div>
               <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
                   <Info size={14} className="inline mr-1 align-text-bottom"/>
                   Выбранный период будет отмечен как отпуск во всех календарях нагрузки.
               </div>
           </div>
       </Modal>
    </div>
  );
};

/* --- PROJECT DETAIL PAGE --- */

export const ProjectDetailPage = ({
  project, onBack, setProjects, people, projectTeams, setProjectTeams,
  projectWriteOffTeams, setProjectWriteOffTeams, projectMemberHours, setProjectMemberHours,
  assignments, weeks, rateFor
}: {
  project: Project | null; onBack: () => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  people: Person[];
  projectTeams: ProjectTeamsMap; setProjectTeams: React.Dispatch<React.SetStateAction<ProjectTeamsMap>>;
  projectWriteOffTeams: ProjectTeamsMap; setProjectWriteOffTeams: React.Dispatch<React.SetStateAction<ProjectTeamsMap>>;
  projectMemberHours: ProjectMemberHoursMap; setProjectMemberHours: React.Dispatch<React.SetStateAction<ProjectMemberHoursMap>>;
  assignments: Assignment[]; weeks: string[];
  rateFor: (person: Person, type: string) => number;
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'team' | 'writeoffs'>('overview');
  const [woYear, setWoYear] = useState(new Date().getFullYear());
  
  // Adding Member State
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRate, setNewMemberRate] = useState('');

  if (!project) return null;

  const updateProject = (updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, ...updates } : p));
  };
  
  const addContract = () => {
      const newC: Contract = { id: rndId(), date: fmtISO(new Date()), amount: 0, vatMode: 'net' };
      updateProject({ contracts: [...project.contracts, newC] });
  };
  
  const updateContract = (cid: string, updates: Partial<Contract>) => {
      updateProject({
          contracts: project.contracts.map(c => c.id === cid ? { ...c, ...updates } : c)
      });
  };
  
  const deleteContract = (cid: string) => {
      updateProject({ contracts: project.contracts.filter(c => c.id !== cid) });
  };

  const updateWriteOff = (personId: string, month: number, val: string, type: 'plan' | 'fact') => {
     const hours = parseInt(val) || 0;
     const monthStr = `${woYear}-${pad2(month + 1)}`;
     setProjects(prev => prev.map(p => {
         if(p.id !== project.id) return p;
         const current = p.writeOffs || [];
         const existing = current.find(w => w.personId === personId && w.monthStr === monthStr && w.type === type);
         const others = current.filter(w => w !== existing);
         const newEntry = { id: existing?.id || rndId(), personId, monthStr, hours, type };
         // If hours is 0, we can remove it to keep array small, but for now we keep non-zero
         return { ...p, writeOffs: hours > 0 ? [...others, newEntry] : others };
     }));
  };

  const addWriteOffMember = () => {
      if(!newMemberId) return;
      const rate = parseInt(newMemberRate) || 0;
      setProjects(prev => prev.map(p => {
          if(p.id !== project.id) return p;
          const rates = { ...(p.customRates || {}) };
          rates[newMemberId] = rate;
          return { ...p, customRates: rates };
      }));
      setNewMemberId('');
      setNewMemberRate('');
      setIsAddingMember(false);
  };

  const removeWriteOffMember = (pid: string) => {
      if(!window.confirm("Удалить сотрудника из таблицы списаний?")) return;
      setProjects(prev => prev.map(p => {
          if(p.id !== project.id) return p;
          const rates = { ...(p.customRates || {}) };
          delete rates[pid];
          // Optionally clean up writeOffs for this person? Keeping them for history might be better, 
          // but for UI consistency we just remove them from view.
          return { ...p, customRates: rates };
      }));
  };

  const totalContractValue = project.contracts.reduce((acc, c) => acc + (c.amount || 0), 0);
  
  // Use customRates keys to determine who is in the table
  const writeOffMemberIds = Object.keys(project.customRates || {});
  const writeOffMembers = people.filter(p => writeOffMemberIds.includes(p.id));

  const months = Array.from({length: 12}, (_, i) => i);
  const monthLabels = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack} icon={ArrowLeft}>Назад</Button>
                <div className="flex items-center gap-2">
                     <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
                     <Badge color={project.status === 'active' ? 'green' : project.status === 'done' ? 'blue' : 'slate'}>{project.status}</Badge>
                </div>
            </div>
        </div>

        <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
                {['overview', 'contracts', 'team', 'writeoffs'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === tab 
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        {tab === 'overview' ? 'Обзор' : tab === 'contracts' ? 'Контракты' : tab === 'team' ? 'Команда' : 'Списания'}
                    </button>
                ))}
            </nav>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-slate-900">Основная информация</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Название проекта</label>
                            <Input value={project.name} onChange={e => updateProject({ name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                                <Select value={project.status} onChange={e => updateProject({ status: e.target.value as any })}>
                                    <option value="active">Активен</option>
                                    <option value="onhold">На паузе</option>
                                    <option value="planned">В планах</option>
                                    <option value="done">Завершен</option>
                                </Select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Тип проекта</label>
                                <Select value={project.projectType} onChange={e => updateProject({ projectType: e.target.value as any })}>
                                    <option value="external">Внешний</option>
                                    <option value="internal">Внутренний</option>
                                </Select>
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Тип сделки</label>
                                <Input value={project.dealType || ''} onChange={e => updateProject({ dealType: e.target.value })} placeholder="проектная" />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Тип договора</label>
                                <Input value={project.agreementType || ''} onChange={e => updateProject({ agreementType: e.target.value })} placeholder="рамочный" />
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Цвет</label>
                                <div className="flex gap-2">
                                    <input type="color" value={project.color} onChange={e => updateProject({ color: e.target.value })} className="h-9 w-full p-1 border border-slate-200 rounded" />
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Дата начала</label>
                                <Input type="date" value={project.startDate} onChange={e => updateProject({ startDate: e.target.value })} />
                             </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Дата завершения</label>
                                <Input type="date" value={project.endDate} onChange={e => updateProject({ endDate: e.target.value })} />
                             </div>
                             <div>
                                {/* Empty spacer */}
                             </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-slate-900">Финансы</h3>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Бюджет (с НДС)</label>
                            <Input 
                                type="number" 
                                value={project.budgetWithVAT} 
                                onChange={e => updateProject({ budgetWithVAT: parseFloat(e.target.value) || 0 })} 
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Комментарии</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm min-h-[100px]"
                                value={project.comments || ''}
                                onChange={e => updateProject({ comments: e.target.value })}
                                placeholder="Важные заметки, ссылки на документацию и т.д."
                            />
                        </div>
                    </div>
                </div>
            )}
            
            {/* ... other tabs ... */}
            {activeTab === 'contracts' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-slate-900">Список контрактов</h3>
                        <Button size="sm" onClick={addContract} icon={Plus}>Добавить</Button>
                    </div>
                    {project.contracts.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">Нет контрактов</div>
                    ) : (
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Дата</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Сумма</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">НДС</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {project.contracts.map(c => (
                                        <tr key={c.id}>
                                            <td className="px-4 py-2">
                                                <Input type="date" value={c.date} onChange={e => updateContract(c.id, { date: e.target.value })} className="h-8 text-xs" />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input type="number" value={c.amount} onChange={e => updateContract(c.id, { amount: parseFloat(e.target.value)||0 })} className="h-8 text-xs" />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Select value={c.vatMode} onChange={e => updateContract(c.id, { vatMode: e.target.value as any })} className="h-8 text-xs">
                                                    <option value="net">Сверху</option>
                                                    <option value="gross">Внутри</option>
                                                </Select>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <button onClick={() => deleteContract(c.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'team' && (
                <div className="space-y-4">
                     <h3 className="text-lg font-medium text-slate-900">Команда проекта</h3>
                     <p className="text-sm text-slate-500">Управление участниками проекта.</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <h4 className="font-medium mb-3 text-sm">Все сотрудники</h4>
                            <div className="space-y-2">
                                {people.filter(p => p.active).map(p => {
                                    const isMember = projectTeams[project.id]?.has(p.id);
                                    return (
                                        <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100">
                                            <div className="flex items-center gap-2">
                                                 <div className="w-6 h-6 rounded-full bg-slate-200 text-xs flex items-center justify-center font-medium text-slate-600 overflow-hidden">
                                                    {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : p.name[0]}
                                                 </div>
                                                 <div className="text-sm">{p.name} <span className="text-xs text-slate-400">({p.role})</span></div>
                                            </div>
                                            {!isMember && (
                                                <Button size="sm" variant="ghost" onClick={() => {
                                                    setProjectTeams(prev => {
                                                        const next = new Set(prev[project.id] || []);
                                                        next.add(p.id);
                                                        return { ...prev, [project.id]: next };
                                                    });
                                                }} icon={Plus}>Добавить</Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <h4 className="font-medium mb-3 text-sm">В проекте</h4>
                             <div className="space-y-2">
                                {Array.from(projectTeams[project.id] || []).map(pid => {
                                    const p = people.find(x => x.id === pid);
                                    if (!p) return null;
                                    return (
                                        <div key={pid} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                 <div className="w-6 h-6 rounded-full bg-white border border-slate-200 text-xs flex items-center justify-center font-medium text-slate-600 overflow-hidden">
                                                    {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : p.name[0]}
                                                 </div>
                                                 <div className="text-sm">{p.name}</div>
                                            </div>
                                            <button onClick={() => {
                                                 setProjectTeams(prev => {
                                                        const next = new Set(prev[project.id] || []);
                                                        next.delete(pid);
                                                        return { ...prev, [project.id]: next };
                                                    });
                                            }} className="text-slate-400 hover:text-rose-600">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {(!projectTeams[project.id] || projectTeams[project.id].size === 0) && (
                                    <div className="text-sm text-slate-400 text-center py-4">Нет участников</div>
                                )}
                            </div>
                        </div>
                     </div>
                </div>
            )}

            {activeTab === 'writeoffs' && (
                <div className="space-y-6">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                             <h3 className="text-lg font-medium text-slate-900">Списания (Факт)</h3>
                             <p className="text-sm text-slate-500">Учет фактических трудозатрат и ставок.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={woYear} onChange={e => setWoYear(parseInt(e.target.value))} className="w-24 h-9 py-1">
                                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </Select>
                        </div>
                     </div>
                     
                     <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-slate-500">
                           {writeOffMembers.length} сотрудников
                        </div>
                        <Button size="sm" onClick={() => setIsAddingMember(true)} icon={Plus} variant="secondary">
                           Добавить сотрудника
                        </Button>
                     </div>

                     {isAddingMember && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row items-end md:items-center gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Сотрудник</label>
                                <Select value={newMemberId} onChange={e => setNewMemberId(e.target.value)} autoFocus>
                                    <option value="">Выберите...</option>
                                    {people.filter(p=>p.active && !writeOffMemberIds.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                            </div>
                            <div className="w-full md:w-48">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Ставка (₽/час)</label>
                                <Input 
                                    placeholder="0" 
                                    value={newMemberRate} 
                                    onChange={e => setNewMemberRate(e.target.value)} 
                                    type="number"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => setIsAddingMember(false)} variant="ghost" size="sm">Отмена</Button>
                                <Button onClick={addWriteOffMember} disabled={!newMemberId} icon={Check} size="sm">Добавить</Button>
                            </div>
                        </div>
                     )}

                     <div className="border border-slate-200 rounded-lg overflow-x-auto">
                         <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Сотрудник</th>
                                    <th className="px-4 py-3 text-right bg-slate-50 border-r border-slate-200">Ставка</th>
                                    {months.map(m => (
                                        <th key={m} className="px-2 py-3 text-center w-20 border-r border-slate-100 last:border-0">{monthLabels[m]}</th>
                                    ))}
                                    <th className="px-4 py-3 text-center font-bold">Итого</th>
                                    <th className="px-2 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {writeOffMembers.map(person => {
                                    let personTotalPlan = 0;
                                    let personTotalFact = 0;
                                    const customRate = project.customRates?.[person.id] || 0;
                                    
                                    return (
                                        <tr key={person.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-2 sticky left-0 bg-white z-10 border-r border-slate-200 font-medium text-slate-700">
                                                {person.name}
                                            </td>
                                            <td className="px-4 py-2 text-right border-r border-slate-200 text-slate-600 font-mono text-xs">
                                                {customRate > 0 ? fmtMoney(customRate) : <span className="text-slate-300">-</span>}
                                            </td>
                                            {months.map(m => {
                                                const monthStr = `${woYear}-${pad2(m+1)}`;
                                                const planEntry = (project.writeOffs || []).find(w => w.personId === person.id && w.monthStr === monthStr && w.type === 'plan');
                                                const factEntry = (project.writeOffs || []).find(w => w.personId === person.id && w.monthStr === monthStr && w.type === 'fact');
                                                
                                                const planVal = planEntry ? planEntry.hours : 0;
                                                const factVal = factEntry ? factEntry.hours : 0;
                                                
                                                personTotalPlan += planVal;
                                                personTotalFact += factVal;

                                                return (
                                                    <td key={m} className="px-1 py-1 border-r border-slate-100 last:border-0 align-top">
                                                        <div className="flex flex-col gap-1">
                                                            <input 
                                                                type="text" 
                                                                className="w-full h-6 text-center text-[10px] focus:bg-emerald-50 border-b border-transparent focus:border-emerald-300 outline-none rounded-t text-emerald-700 placeholder-slate-200"
                                                                placeholder="План"
                                                                value={planVal > 0 ? planVal : ''}
                                                                onChange={e => updateWriteOff(person.id, m, e.target.value, 'plan')}
                                                            />
                                                            <input 
                                                                type="text" 
                                                                className="w-full h-6 text-center text-[10px] focus:bg-rose-50 border-t border-slate-100 focus:border-rose-300 outline-none rounded-b text-rose-700 placeholder-slate-200"
                                                                placeholder="Факт"
                                                                value={factVal > 0 ? factVal : ''}
                                                                onChange={e => updateWriteOff(person.id, m, e.target.value, 'fact')}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-2 text-center text-xs bg-slate-50/30">
                                                <div className="text-emerald-600 font-medium">{personTotalPlan > 0 ? personTotalPlan : '-'}</div>
                                                <div className="text-rose-600 font-medium border-t border-slate-200 mt-1 pt-1">{personTotalFact > 0 ? personTotalFact : '-'}</div>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <button onClick={() => removeWriteOffMember(person.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1" title="Удалить">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {writeOffMembers.length === 0 && (
                                    <tr><td colSpan={16} className="px-6 py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">Список пуст. Добавьте сотрудника, чтобы начать планирование списаний.</td></tr>
                                )}
                            </tbody>
                         </table>
                     </div>
                </div>
            )}
        </div>
    </div>
  );
};