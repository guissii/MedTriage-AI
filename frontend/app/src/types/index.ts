// User Types
export type UserRole = 'admin' | 'doctor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  licenseNumber?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Patient Types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  medicalHistory: string[];
  allergies: string[];
  currentMedications: Medication[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate?: Date;
}

// Consultation Types
export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  step: number;
  patientInfo?: PatientInfo;
  symptoms?: Symptoms;
  labResults?: LabResults;
  imaging?: ImagingObservations;
  aiAnalysis?: AIAnalysis;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PatientInfo {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  medicalHistory: string[];
  allergies: string[];
  currentMedications: string[];
}

export interface Symptoms {
  fever?: number;
  cough: boolean;
  dyspnea: boolean;
  chestPain: boolean;
  fatigue: boolean;
  customSymptoms: string[];
  notes?: string;
}

// Lab Results Types
export interface LabResults {
  inflammatory: InflammatoryMarkers;
  hematology: HematologyMarkers;
  metabolic: MetabolicPanel;
  liver: LiverFunction;
  coagulation: CoagulationMarkers;
}

export interface InflammatoryMarkers {
  crp: number;
  esr: number;
}

export interface HematologyMarkers {
  leukocytes: number;
  hemoglobin: number;
  platelets: number;
  neutrophils: number;
  lymphocytes: number;
}

export interface MetabolicPanel {
  glucose: number;
  creatinine: number;
  urea: number;
  sodium: number;
  potassium: number;
}

export interface LiverFunction {
  asat: number;
  alat: number;
  bilirubin: number;
}

export interface CoagulationMarkers {
  dDimer: number;
  inr: number;
}

// Lab Reference Ranges
export interface LabReferenceRange {
  name: string;
  unit: string;
  min: number;
  max: number;
  category: string;
}

// Imaging Types
export interface ImagingObservations {
  findings: ImagingFinding[];
  notes?: string;
  hasNoFindings: boolean;
}

export type ImagingFinding = 
  | 'pulmonary_opacity'
  | 'infiltration'
  | 'consolidation'
  | 'pleural_effusion'
  | 'pneumothorax'
  | 'cardiomegaly';

// AI Analysis Types
export interface AIAnalysis {
  diseaseProbabilities: DiseaseProbability[];
  riskAlerts: RiskAlert[];
  therapeuticDirection: string;
  costComparisons: CostComparison[];
  explanation: string;
  confidenceScore: number;
  processingTime: number;
  modelVersion: string;
  generatedAt: Date;
}

export interface DiseaseProbability {
  disease: string;
  probability: number;
  icd10Code?: string;
}

export interface RiskAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation?: string;
}

export interface CostComparison {
  option: string;
  description: string;
  estimatedCost: number;
  effectiveness: number;
  isRecommended: boolean;
}

// Drug Database Types
export interface Drug {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  category: string;
  dosageForms: string[];
  strengths: string[];
  averageCost: number;
  alternatives: string[];
  contraindications: string[];
  sideEffects: string[];
  createdAt: Date;
  updatedAt: Date;
}

// System Log Types
export interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  userId?: string;
  userName?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

// Analytics Types
export interface AIUsageStats {
  date: string;
  totalAnalyses: number;
  averageProcessingTime: number;
  averageConfidenceScore: number;
  topDiseases: { disease: string; count: number }[];
}

export interface DashboardMetrics {
  totalConsultations: number;
  consultationsToday: number;
  averageTriageTime: number;
  aiAnalysesRun: number;
  pendingReviews: number;
  completionRate: number;
}

// UI Types
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  roles?: UserRole[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
