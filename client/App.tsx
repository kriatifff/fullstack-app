import { apiGetState, apiSaveState } from "./api";
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Users, Briefcase, BarChart2, Calendar, LayoutGrid, Plus, ChevronLeft, ChevronRight, LogOut, Check, Trash2, X, Edit2, Save, Upload
} from 'lucide-react';
import { Person, Project, Assignment, ProjectTeamsMap, VacationsMap, ViewMode, ProjectMemberHoursMap } from './types';
import { Button, Modal, Input, Select, Badge } from './components/UI';
import { TeamView, ProjectView, AnalyticsTeamView, PersonDetailPage, ProjectDetailPage, AnalyticsWriteOffsView } from './components/Views';
import { FinancialAnalyticsView } from './components/Analytics';
import { apiGetState, apiSaveState } from "./api";  
import {
  effectiveFactHours,
  personWeekFactTotal,
  fmtMoney,
  VAT_RATE,
  parseDate,
  addDays,
  sumFactForPersonProject,
  yearWeekMondays
} from './utils';


// --- SEED DATA ---
const baseMonday = startOfISOWeek(new Date());
const initialWeeks = Array.from({ length: 52 }, (_, i) => fmtISO(addWeeks(baseMonday, i - 12)));
const seedPeople: Person[] = [
  { id: "p1", name: "Саша", role: "manager", capacityPerWeek: 1, active: true, external: false, rateInternal: 1500, rateExternal: 2500 },
  { id: "p2", name: "Катя К.", role: "designer", capacityPerWeek: 1, active: true, external: false, rateInternal: 1400, rateExternal: 2600 },
  { id: "p3", name: "Игорь", role: "dev", capacityPerWeek: 1, active: true, external: false, rateInternal: 1800, rateExternal: 3200 },
];
const seedProjects: Project[] = [
  { id: "pr1", name: "HR Подкасты", status: "active", color: "#3b82f6", budgetWithVAT: 0, budgetWithoutVAT: 0, projectType: "external", costEditable: 0, costEditableTouched: false, startDate: "", endDate: "", contracts: [], isArchived: false, serviceName: "", comments: "", writeOffs: [] },
  { id: "pr2", name: "Арктика Медиа", status: "onhold", color: "#f43f5e", budgetWithVAT: 0, budgetWithoutVAT: 0, projectType: "external", costEditable: 0, costEditableTouched: false, startDate: "", endDate: "", contracts: [], isArchived: false, serviceName: "", comments: "", writeOffs: [] },
];

const App = () => {
  // --- STATE ---
  const [view, setView] = useState<ViewMode>('team');
  const [weeks, setWeeks] = useState(initialWeeks);
  const [firstIdx, setFirstIdx] = useState(12); // Start at current week approx
  
  // Analytics Sub-view state
  const [analyticsTab, setAnalyticsTab] = useState<'finance' | 'specialists' | 'writeoffs'>('specialists');
  const [includeVatAsExpense, setIncludeVatAsExpense] = useState(true);

  // Data State
  const [people, setPeople] = useState<Person[]>(() => {
    try { return JSON.parse(localStorage.getItem('pw_people') || 'null') || seedPeople; } catch { return seedPeople; }
  });
  const [roles, setRoles] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pw_roles') || 'null') || ["dev", "designer", "manager", "pm", "qa", "other"]; } catch { return ["dev", "designer", "manager", "pm", "qa", "other"]; }
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    try { return JSON.parse(localStorage.getItem('pw_projects') || 'null') || seedProjects; } catch { return seedProjects; }
  });
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try { return JSON.parse(localStorage.getItem('pw_assignments') || 'null') || []; } catch { return []; }
  });
  const [projectTeams, setProjectTeams] = useState<ProjectTeamsMap>(() => {
    try { 
       const raw = JSON.parse(localStorage.getItem('pw_projectTeams') || '{}');
       const out: ProjectTeamsMap = {};
       for(const k in raw) out[k] = new Set(raw[k]);
       return out; 
    } catch { return {}; }
  });
  const [projectWriteOffTeams, setProjectWriteOffTeams] = useState<ProjectTeamsMap>(() => {
    try { 
       const raw = JSON.parse(localStorage.getItem('pw_projectWriteOffTeams') || '{}');
       const out: ProjectTeamsMap = {};
       for(const k in raw) out[k] = new Set(raw[k]);
       return out; 
    } catch { return {}; }
  });
  const [projectMemberHours, setProjectMemberHours] = useState<ProjectMemberHoursMap>(() => {
    try { return JSON.parse(localStorage.getItem('pw_projectMemberHours') || '{}'); } catch { return {}; }
  });
  const [vacations, setVacations] = useState<VacationsMap>(() => {
    try { 
      const raw = JSON.parse(localStorage.getItem('pw_vacations') || '{}');
      const out: VacationsMap = {};
      for(const k in raw) out[k] = new Set(raw[k]);
      return out;
    } catch { return {}; }
  });
  const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  (async () => {
    try {
      const remote = await apiGetState();
      const state = (remote && (remote as any).data) ? (remote as any).data : remote;

      if (state) {
        const toSetMap = (raw: any) => {
          const out: any = {};
          for (const k in (raw || {})) out[k] = new Set(raw[k] || []);
          return out;
        };

        setPeople(state.people ?? seedPeople);
        setRoles(state.roles ?? ["dev", "designer", "manager", "pm", "qa", "other"]);
        setProjects(state.projects ?? seedProjects);
        setAssignments(state.assignments ?? []);

        setProjectTeams(toSetMap(state.projectTeams));
        setProjectWriteOffTeams(toSetMap(state.projectWriteOffTeams));
        setProjectMemberHours(state.projectMemberHours ?? {});
        setVacations(toSetMap(state.vacations));

        // если у тебя есть teamOrder:
        setTeamOrder(state.teamOrder ?? []);
      }
    } catch (e) {
      console.warn("Failed to load remote state:", e);
    } finally {
      setHydrated(true);
    }
  })();
}, []);


  
  // Custom Sort Order for Team
  const [teamOrder, setTeamOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pw_teamOrder') || '[]'); } catch { return []; }
  });

  // Ensure team order consistency
  useEffect(() => {
    const allIds = people.map(p => p.id);
    const existingIds = new Set(teamOrder);
    const newIds = allIds.filter(id => !existingIds.has(id));
    
    // Remove deleted
    const validOrder = teamOrder.filter(id => allIds.includes(id));
    
    if (newIds.length > 0 || validOrder.length !== teamOrder.length) {
      setTeamOrder([...validOrder, ...newIds]);
    }
  }, [people.length]); // Dependency on people count mainly

useEffect(() => {
  (async () => {
    try {
     const remote = await apiGetState();
const state = (remote && (remote as any).data) ? (remote as any).data : remote;

if (state) {
  setPeople(state.people ?? seedPeople);
  setRoles(state.roles ?? ["dev","designer","manager","pm","qa","other"]);
  setProjects(state.projects ?? seedProjects);
  setAssignments(state.assignments ?? []);
}


        setPeople(remote.people ?? seedPeople);
        setRoles(remote.roles ?? ["dev","designer","manager","pm","qa","other"]);
        setProjects(remote.projects ?? seedProjects);
        setAssignments(remote.assignments ?? []);
        setProjectTeams(toSetMap(remote.projectTeams));
        setProjectWriteOffTeams(toSetMap(remote.projectWriteOffTeams));
        setProjectMemberHours(remote.projectMemberHours ?? {});
        setVacations(toSetMap(remote.vacations));
        setTeamOrder(remote.teamOrder ?? []);
      }
    } catch (e) {
      console.warn("Failed to load remote state:", e);
    } finally {
      setHydrated(true);
    }
  })();
}, []);

useEffect(() => {
  if (!hydrated) return; // <-- это “не перетираем сервер localStorage при старте”

  const toSerializable = (raw: any) => {
    const out: any = {};
    for (const k in (raw || {})) out[k] = Array.from(raw[k] || []);
    return out;
  };

  const payload = {
    people,
    roles,
    projects,
    assignments,
    projectTeams: toSerializable(projectTeams),
    projectWriteOffTeams: toSerializable(projectWriteOffTeams),
    projectMemberHours,
    vacations: toSerializable(vacations),
    teamOrder,
  };

  const t = setTimeout(() => {
    apiSaveState(payload).catch((e) => console.warn("saveState failed", e));
  }, 800);

  return () => clearTimeout(t);
}, [
  hydrated,
  people,
  roles,
  projects,
  assignments,
  projectTeams,
  projectWriteOffTeams,
  projectMemberHours,
  vacations,
  teamOrder,
]);


  // Persistence
  useEffect(() => { localStorage.setItem('pw_people', JSON.stringify(people)); }, [people]);
  useEffect(() => { localStorage.setItem('pw_roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('pw_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('pw_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('pw_projectMemberHours', JSON.stringify(projectMemberHours)); }, [projectMemberHours]);
  useEffect(() => { localStorage.setItem('pw_teamOrder', JSON.stringify(teamOrder)); }, [teamOrder]);
  useEffect(() => { 
    const serializable: any = {};
    for(const k in projectTeams) serializable[k] = Array.from(projectTeams[k]);
    localStorage.setItem('pw_projectTeams', JSON.stringify(serializable)); 
  }, [projectTeams]);
  useEffect(() => { 
    const serializable: any = {};
    for(const k in projectWriteOffTeams) serializable[k] = Array.from(projectWriteOffTeams[k]);
    localStorage.setItem('pw_projectWriteOffTeams', JSON.stringify(serializable)); 
  }, [projectWriteOffTeams]);
  useEffect(() => { 
    const serializable: any = {};
    for(const k in vacations) serializable[k] = Array.from(vacations[k]);
    localStorage.setItem('pw_vacations', JSON.stringify(serializable)); 
  }, [vacations]);

  // Derived State / Calculations
  const goLeft = () => setFirstIdx(Math.max(0, firstIdx - 1));
  const goRight = () => setFirstIdx(Math.min(weeks.length - 8, firstIdx + 1));
  const goToday = () => {
    const today = fmtISO(startOfISOWeek(new Date()));
    const idx = weeks.indexOf(today);
    if (idx !== -1) setFirstIdx(Math.max(0, idx - 1));
  };
  const currentDateLabel = new Date(weeks[firstIdx]).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  const rateFor = (person: Person, type: string) => type === "internal" ? (person.rateInternal || 0) : (person.rateExternal || 0);

  // Helper to get total fact cost for a project (historical sum)
  const getProjectFactCost = (projectId: string) => {
    const pr = projects.find(p => p.id === projectId);
    if (!pr) return 0;
    
    // We sum up cost for ALL assignments for this project, regardless of date
    // Note: assignments array is flat, so this iteration is okay for medium datasets
    return assignments
      .filter(a => a.projectId === projectId)
      .reduce((sum, a) => {
        const person = people.find(p => p.id === a.personId);
        if (!person) return sum;
        
        const factH = effectiveFactHours(a, a.weekStart);
        const rate = rateFor(person, pr.projectType);
        return sum + (factH * rate);
      }, 0);
  };

  // UI State
  const [createPersonOpen, setCreatePersonOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false); // New modal state
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  
  // Selection
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Analytics
  const [analyticsYear, setAnalyticsYear] = useState(new Date().getFullYear());
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [newRoleName, setNewRoleName] = useState("");
  
  // Role Edit State
  const [editRoleIndex, setEditRoleIndex] = useState<number | null>(null);

  // Logic to move person in list
  const movePerson = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newOrder = [...teamOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setTeamOrder(newOrder);
  };

  // Logic to navigate to person detail
  const openPersonDetail = (id: string) => {
    setSelectedPersonId(id);
    setView('person-detail');
  };

  const openProjectDetail = (id: string) => {
      setSelectedProjectId(id);
      setView('project-detail');
  };
  
  const updateRoleName = (idx: number, newName: string) => {
    const oldName = roles[idx];
    if (!newName.trim() || newName === oldName) {
        setEditRoleIndex(null);
        return;
    }
    
    // Check if role exists
    if (roles.includes(newName) && roles.indexOf(newName) !== idx) {
        alert("Роль с таким названием уже существует");
        return;
    }

    const nextRoles = [...roles];
    nextRoles[idx] = newName;
    setRoles(nextRoles);

    // Update all people with this role
    setPeople(prev => prev.map(p => p.role === oldName ? { ...p, role: newName } : p));
    setEditRoleIndex(null);
  };

  const deleteRole = (roleToDelete: string) => {
    if(window.confirm(`Вы уверены, что хотите удалить роль "${roleToDelete}"? У всех сотрудников с этой ролью она сменится на "other".`)) {
      setRoles(prev => prev.filter(r => r !== roleToDelete));
      setPeople(prev => prev.map(p => p.role === roleToDelete ? { ...p, role: 'other' } : p));
      if (roleFilter === roleToDelete) {
        setRoleFilter('all');
      }
    }
  };

  const deleteProject = (id: string) => {
    if(window.confirm("Вы уверены, что хотите удалить этот проект навсегда? Это действие нельзя отменить.")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      // Cleanup assignments for this project
      setAssignments(prev => prev.filter(a => a.projectId !== id));
      // If we are on detail page of deleted project, go back
      if (selectedProjectId === id) {
          setView('project');
          setSelectedProjectId(null);
      }
    }
  };

  const toggleProjectArchive = (project: Project) => {
    const isArchiving = !project.isArchived;
    if(isArchiving || window.confirm("Восстановить проект из архива?")) {
       setProjects(prev => prev.map(p => p.id === project.id ? { ...p, isArchived: isArchiving } : p));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, personId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 500KB to prevent localStorage quota exceeded
    if (file.size > 500 * 1024) {
      alert("Размер файла слишком большой. Пожалуйста, выберите изображение до 500 КБ.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPeople(prev => prev.map(p => p.id === personId ? { ...p, photo: reader.result as string } : p));
    };
    reader.readAsDataURL(file);
  };

  // --- RENDER HELPERS ---

  const renderContent = () => {
    switch (view) {
      case 'team':
        return <TeamView 
          people={people} assignments={assignments} vacations={vacations} weeks={weeks} 
          firstIdx={firstIdx} onSelectPerson={openPersonDetail} 
          teamOrder={teamOrder} 
          roleFilter={roleFilter} setRoleFilter={setRoleFilter} roles={roles}
          onMovePerson={movePerson}
        />;
      
      case 'person-detail':
        return <PersonDetailPage 
          person={selectedPersonId ? people.find(p => p.id === selectedPersonId) || null : null}
          onBack={() => setView('team')}
          projects={projects} assignments={assignments} setAssignments={setAssignments}
          vacations={vacations} setVacations={setVacations}
          weeks={weeks} firstIdx={firstIdx} projectTeams={projectTeams}
          setProjectTeams={setProjectTeams}
          projectMemberHours={projectMemberHours}
          onPrevWeek={goLeft} onNextWeek={goRight} onCurrentWeek={goToday}
          currentDateLabel={currentDateLabel}
        />;

      case 'project':
        return <ProjectView 
          projects={projects} 
          setProjects={setProjects} 
          onOpenProject={openProjectDetail} 
          onDeleteProject={deleteProject}
          onToggleArchive={toggleProjectArchive}
          getProjectFactCost={getProjectFactCost}
        />;
      
      case 'project-detail':
          return <ProjectDetailPage 
            project={selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null}
            onBack={() => setView('project')}
            setProjects={setProjects} people={people}
            projectTeams={projectTeams} setProjectTeams={setProjectTeams}
            projectWriteOffTeams={projectWriteOffTeams} setProjectWriteOffTeams={setProjectWriteOffTeams}
            projectMemberHours={projectMemberHours} setProjectMemberHours={setProjectMemberHours}
            assignments={assignments} weeks={weeks} rateFor={rateFor}
          />;
      
      case 'employees':
        return (
           <div className="space-y-6">
             {/* Role Management */}
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Роли</h3>
                    <Button size="sm" variant="secondary" onClick={() => setCreateRoleOpen(true)} icon={Plus}>Добавить роль</Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {roles.map((r, idx) => (
                    <div key={r} className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 bg-slate-50 border border-slate-200 rounded-full group hover:border-slate-300 transition-colors">
                      {editRoleIndex === idx ? (
                          <input 
                            className="bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-sm outline-none w-24"
                            defaultValue={r}
                            autoFocus
                            onBlur={(e) => updateRoleName(idx, e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') updateRoleName(idx, e.currentTarget.value);
                                if(e.key === 'Escape') setEditRoleIndex(null);
                            }}
                          />
                      ) : (
                          <span 
                            className="text-sm font-medium text-slate-700 cursor-pointer"
                            onClick={() => setEditRoleIndex(idx)}
                            title="Нажмите для редактирования"
                          >
                            {r}
                          </span>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteRole(r); }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors"
                        title="Удалить роль"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {roles.length === 0 && <span className="text-sm text-slate-400 py-2">Список ролей пуст</span>}
                </div>
             </div>

             <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
               <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                   <h3 className="font-bold text-slate-800">Список сотрудников</h3>
               </div>
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4">Имя</th>
                     <th className="px-6 py-4">Роль</th>
                     <th className="px-6 py-4">Тип</th>
                     <th className="px-6 py-4 text-right">Ставки (Внутр / Внеш)</th>
                     <th className="px-6 py-4 text-right">Действия</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {people.map(p => (
                     <tr key={p.id} className="hover:bg-slate-50/50">
                       <td className="px-6 py-4 font-medium text-slate-900">
                         <div className="flex items-center gap-3">
                           <label className="relative cursor-pointer group shrink-0">
                               <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, p.id)} />
                               <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-300 overflow-hidden relative">
                                   {p.photo ? (
                                       <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                   ) : (
                                       p.name.charAt(0).toUpperCase()
                                   )}
                                   {/* Overlay */}
                                   <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Upload size={14} className="text-white" />
                                   </div>
                               </div>
                           </label>
                           <Input value={p.name} onChange={e => setPeople(prev => prev.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} className="h-8 py-0" />
                         </div>
                       </td>
                       <td className="px-6 py-4">
                          <Select value={p.role} onChange={e => setPeople(prev => prev.map(x => x.id === p.id ? {...x, role: e.target.value} : x))} className="h-8 py-0">
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            {!roles.includes(p.role) && <option value={p.role}>{p.role}</option>}
                          </Select>
                       </td>
                       <td className="px-6 py-4"><div className="cursor-pointer" onClick={() => setPeople(prev => prev.map(x => x.id === p.id ? {...x, external: !x.external} : x))}><Badge color={p.external ? 'amber' : 'blue'}>{p.external ? 'Внешний' : 'Штат'}</Badge></div></td>
                       <td className="px-6 py-4 text-right text-slate-600 font-mono">
                         <div className="flex items-center justify-end gap-2">
                            <Input className="w-20 h-8 text-right" value={p.rateInternal} onChange={e => setPeople(prev => prev.map(x => x.id === p.id ? {...x, rateInternal: parseInt(e.target.value)||0} : x))} />
                            <span className="text-slate-300">/</span>
                            <Input className="w-20 h-8 text-right" value={p.rateExternal} onChange={e => setPeople(prev => prev.map(x => x.id === p.id ? {...x, rateExternal: parseInt(e.target.value)||0} : x))} />
                         </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button onClick={() => { if(window.confirm('Удалить сотрудника?')) setPeople(prev => prev.filter(x => x.id !== p.id)) }} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        );
      
      case 'analyticsTeam':
      case 'analyticsProjects':
      case 'analyticsMonthly':
      case 'analyticsWriteOffs':
        return (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button 
                    onClick={() => setAnalyticsTab('specialists')} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${analyticsTab === 'specialists' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Нагрузка
                  </button>
                  <button 
                    onClick={() => setAnalyticsTab('writeoffs')} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${analyticsTab === 'writeoffs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Списания
                  </button>
                   <button 
                    onClick={() => setAnalyticsTab('finance')} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${analyticsTab === 'finance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Финансы
                  </button>
                </div>

                <div className="flex items-center gap-3">
                    {analyticsTab === 'finance' && (
                      <label className="flex items-center gap-2 text-sm text-slate-600 mr-4">
                         <input 
                           type="checkbox" 
                           checked={includeVatAsExpense} 
                           onChange={e => setIncludeVatAsExpense(e.target.checked)}
                           className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                         Учитывать НДС как расход
                      </label>
                    )}
                    <Select className="w-32" value={analyticsYear} onChange={e => setAnalyticsYear(parseInt(e.target.value))}>
                      {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </Select>
                </div>
             </div>
             
             {analyticsTab === 'finance' && (
                <FinancialAnalyticsView 
                  projects={projects} 
                  people={people} 
                  assignments={assignments} 
                  year={analyticsYear} 
                  includeVat={includeVatAsExpense} 
                />
             )}
             
             {analyticsTab === 'specialists' && (
                <AnalyticsTeamView people={people} assignments={assignments} weeks={weeks} firstIdx={firstIdx} year={analyticsYear} setYear={setAnalyticsYear} />
             )}

             {analyticsTab === 'writeoffs' && (
                 <AnalyticsWriteOffsView people={people} projects={projects} year={analyticsYear} setYear={setAnalyticsYear} />
             )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg cursor-pointer" onClick={() => setView('team')}>
              <LayoutGrid strokeWidth={2.5} />
              <span>Панквеб</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
              <TabButton active={view === 'team' || view === 'person-detail'} onClick={() => setView('team')} icon={Users}>Нагрузка</TabButton>
              <TabButton active={view === 'project' || view === 'project-detail'} onClick={() => setView('project')} icon={Briefcase}>Проекты</TabButton>
              <TabButton active={view === 'employees'} onClick={() => setView('employees')} icon={UserIcon}>Команда</TabButton>
              <TabButton active={view.startsWith('analytics')} onClick={() => setView('analyticsMonthly')} icon={BarChart2}>Аналитика</TabButton>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => setCreatePersonOpen(true)} icon={Plus}>Сотрудник</Button>
            <Button size="sm" variant="secondary" onClick={() => setCreateProjectOpen(true)} icon={Plus}>Проект</Button>
          </div>
        </div>
      </header>

      {/* Sub-Header Controls (only for timelines) */}
      {(view === 'team') && (
        <div className="sticky top-16 z-40 bg-[#F8FAFC] border-b border-slate-200/60 pt-4 pb-4 px-4">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Button size="sm" variant="outline" onClick={goLeft} className="w-8 h-8 p-0"><ChevronLeft size={16}/></Button>
               <Button size="sm" variant="secondary" onClick={goToday}>Сегодня</Button>
               <Button size="sm" variant="outline" onClick={goRight} className="w-8 h-8 p-0"><ChevronRight size={16}/></Button>
               <span className="ml-4 text-xs font-medium text-slate-500 capitalize">
                 {currentDateLabel}
               </span>
             </div>
             
             {view === 'team' && (
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500 opacity-20 border border-emerald-500"></div>План</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500 opacity-20 border border-rose-500"></div>Овербук</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center text-[8px]">🏖</div>Отпуск</div>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        {renderContent()}
      </main>

      {/* Modals */}
      <Modal open={createPersonOpen} onClose={() => setCreatePersonOpen(false)} title="Новый сотрудник" 
        footer={<><Button variant="ghost" onClick={() => setCreatePersonOpen(false)}>Отмена</Button><Button onClick={() => {
          const name = (document.getElementById('new-p-name') as HTMLInputElement)?.value;
          const role = (document.getElementById('new-p-role') as HTMLSelectElement)?.value;
          if(name) {
            setPeople([...people, { id: rndId(), name, role: role || 'other', capacityPerWeek: 1, active: true, external: false, rateInternal: 0, rateExternal: 0 }]);
            setCreatePersonOpen(false);
          }
        }}>Создать</Button></>}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium block mb-1">ФИО</label><Input id="new-p-name" placeholder="Иван Иванов" autoFocus /></div>
          <div><label className="text-sm font-medium block mb-1">Роль</label><Select id="new-p-role">{roles.map(r => <option key={r} value={r}>{r}</option>)}</Select></div>
        </div>
      </Modal>

      <Modal open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} title="Новый проект"
        footer={<><Button variant="ghost" onClick={() => setCreateProjectOpen(false)}>Отмена</Button><Button onClick={() => {
           const name = (document.getElementById('new-pr-name') as HTMLInputElement)?.value;
           if(name) {
             setProjects([...projects, { id: rndId(), name, status: 'planned', color: '#64748b', budgetWithVAT: 0, budgetWithoutVAT: 0, projectType: 'external', costEditable: 0, costEditableTouched: false, startDate: '', endDate: '', contracts: [], isArchived: false, serviceName: "", comments: "", writeOffs: [] }]);
             setCreateProjectOpen(false);
           }
        }}>Создать</Button></>}>
         <div className="space-y-4">
          <div><label className="text-sm font-medium block mb-1">Название проекта</label><Input id="new-pr-name" placeholder="Сайт..." autoFocus /></div>
          <div><label className="text-sm font-medium block mb-1">Тип</label><Select><option>external</option><option>internal</option></Select></div>
        </div>
      </Modal>

      {/* NEW: Create Role Modal */}
      <Modal open={createRoleOpen} onClose={() => { setCreateRoleOpen(false); setNewRoleName(""); }} title="Новая роль"
        footer={<><Button variant="ghost" onClick={() => { setCreateRoleOpen(false); setNewRoleName(""); }}>Отмена</Button><Button onClick={() => {
           const r = newRoleName.trim().toLowerCase();
           if(r && !roles.includes(r)) {
              setRoles([...roles, r]);
              setCreateRoleOpen(false);
              setNewRoleName("");
           } else if (roles.includes(r)) {
               alert("Такая роль уже существует");
           }
        }}>Создать</Button></>}>
         <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Название роли</label>
              <Input 
                value={newRoleName} 
                onChange={e => setNewRoleName(e.target.value)} 
                placeholder="Например: qa, devops..." 
                autoFocus 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const r = newRoleName.trim().toLowerCase();
                    if(r && !roles.includes(r)) {
                        setRoles([...roles, r]);
                        setCreateRoleOpen(false);
                        setNewRoleName("");
                    }
                  }
                }}
              />
            </div>
        </div>
      </Modal>
    </div>
  );
};

const TabButton = ({ active, onClick, children, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${active ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
    {Icon && <Icon size={16} strokeWidth={2} />}
    {children}
  </button>
);

const UserIcon = Users;

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

export default App;