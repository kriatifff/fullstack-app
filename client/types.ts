
export interface Person {
  id: string;
  name: string;
  role: string;
  capacityPerWeek: number;
  active: boolean;
  external: boolean;
  rateInternal: number;
  rateExternal: number;
  photo?: string; // Base64 encoded image string
}

export interface Contract {
  id: string;
  date: string;
  amount: number;
  vatMode: "gross" | "net";
}

export interface WriteOffEntry {
  id: string;
  personId: string;
  monthStr: string; // "YYYY-MM"
  hours: number;
  type: 'plan' | 'fact';
}

export interface Project {
  id: string;
  name: string;
  status: "active" | "onhold" | "done" | "planned";
  color: string;
  budgetWithVAT: number;
  budgetWithoutVAT: number;
  projectType: "internal" | "external";
  costEditable: number;
  costEditableTouched: boolean;
  startDate: string;
  endDate: string;
  contracts: Contract[];
  isArchived?: boolean;
  // New fields
  serviceName?: string;
  dealType?: string; 
  agreementType?: string; // Added field
  comments?: string;
  writeOffs?: WriteOffEntry[];
  customRates?: Record<string, number>; // personId -> rate
}

export interface Assignment {
  id: string;
  personId: string;
  projectId: string;
  weekStart: string; // ISO date YYYY-MM-DD
  fte: number;
  factHours?: number;
}

export type ViewMode = "team" | "person-detail" | "project" | "project-detail" | "employees" | "analyticsTeam" | "analyticsProjects" | "analyticsMonthly" | "analyticsWriteOffs";

// Helper types for state
export type ProjectTeamsMap = Record<string, Set<string>>; // projectId -> Set<personId>
export type ProjectMemberHoursMap = Record<string, Record<string, number>>; // projectId -> personId -> plannedHours
export type VacationsMap = Record<string, Set<string>>; // personId -> Set<weekISO>