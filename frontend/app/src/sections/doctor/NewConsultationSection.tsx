import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Activity, 
  FlaskConical, 
  Scan, 
  Brain,
  Plus,
  X,
  Info,
  AlertCircle,
  CheckCircle,
  FileDown,
  Save,
  RotateCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { labReferenceRanges, checkLabValue, labTooltips } from '@/data/labReferences';
import { formatCurrency } from '@/lib/utils';
import { consultationApi, doctorApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useLang, useT } from '@/context/LangContext';
import type { 
  PatientInfo, 
  Symptoms, 
  LabResults, 
  ImagingObservations, 
  AIAnalysis, 
  RiskAlert,
  DiseaseProbability
} from '@/types';

type FormStep = 1 | 2 | 3 | 4 | 5;

function createEmptyAIAnalysis(): AIAnalysis {
  return {
    diseaseProbabilities: [],
    riskAlerts: [],
    therapeuticDirection: '',
    costComparisons: [],
    explanation: '',
    confidenceScore: 0,
    processingTime: 0,
    modelVersion: 'Mistral (Local)',
    generatedAt: new Date(),
  };
}

type DemoCaseId = 'pneumonia' | 'asthma' | 'uti';

function getDemoCases(): Array<{ id: DemoCaseId; label: string }> {
  return [
    { id: 'pneumonia', label: 'Community-acquired pneumonia' },
    { id: 'asthma', label: 'Acute asthma exacerbation' },
    { id: 'uti', label: 'Urinary tract infection (UTI)' },
  ];
}

function generateDiseaseProbabilities(input: {
  patientInfo: PatientInfo;
  symptoms: Symptoms;
  labResults: LabResults;
  imaging: ImagingObservations;
  demoCaseId?: DemoCaseId;
}): DiseaseProbability[] {
  const { patientInfo, symptoms, labResults, imaging, demoCaseId } = input;

  const fever = symptoms.fever ?? 37;
  const crp = labResults.inflammatory.crp ?? 0;
  const leukocytes = labResults.hematology.leukocytes ?? 0;
  const dDimer = labResults.coagulation.dDimer ?? 0;
  const hasOpacity = imaging.findings.includes('pulmonary_opacity') || imaging.findings.includes('consolidation') || imaging.findings.includes('infiltration');
  const hasCardiomegaly = imaging.findings.includes('cardiomegaly');

  const text = `${(symptoms.notes ?? '')} ${(symptoms.customSymptoms ?? []).join(' ')}`.toLowerCase();
  const hasWheeze = text.includes('wheez');
  const hasDysuria = text.includes('dysuri') || text.includes('burning urination') || text.includes('burning') || text.includes('painful urination');
  const hasFrequency = text.includes('frequency') || text.includes('urgent') || text.includes('urgency');
  const hasSuprapubic = text.includes('suprapubic');
  const hasFlankPain = text.includes('flank') || text.includes('loin');
  const hasPleuritic = text.includes('pleurit');

  const mh = (patientInfo.medicalHistory ?? []).map((x) => String(x).toLowerCase());
  const hasAsthmaHistory = mh.some((x) => x.includes('asthma'));
  const hasCopdHistory = mh.some((x) => x.includes('copd'));
  const hasHeartDisease = mh.some((x) => x.includes('heart'));

  type Candidate = { disease: string; icd10Code?: string; score: number };
  const cands: Candidate[] = [
    { disease: 'Community-acquired pneumonia', icd10Code: 'J18.9', score: 0 },
    { disease: 'Acute bronchitis', icd10Code: 'J20.9', score: 0 },
    { disease: 'Asthma exacerbation', icd10Code: 'J45.901', score: 0 },
    { disease: 'COPD exacerbation', icd10Code: 'J44.1', score: 0 },
    { disease: 'Pulmonary embolism', icd10Code: 'I26.99', score: 0 },
    { disease: 'Heart failure exacerbation', icd10Code: 'I50.9', score: 0 },
    { disease: 'COVID-19 / viral respiratory infection', icd10Code: 'U07.1', score: 0 },
    { disease: 'Urinary tract infection (UTI)', icd10Code: 'N39.0', score: 0 },
    { disease: 'Acute pyelonephritis', icd10Code: 'N10', score: 0 },
    { disease: 'Nephrolithiasis (kidney stone)', icd10Code: 'N20.0', score: 0 },
  ];

  const add = (name: string, delta: number) => {
    const c = cands.find((x) => x.disease === name);
    if (c) c.score += delta;
  };

  if (symptoms.cough) {
    add('Community-acquired pneumonia', 2);
    add('Acute bronchitis', 2);
    add('COVID-19 / viral respiratory infection', 2);
  }
  if (symptoms.dyspnea) {
    add('Community-acquired pneumonia', 2);
    add('Asthma exacerbation', 3);
    add('COPD exacerbation', 3);
    add('Pulmonary embolism', 2);
    add('Heart failure exacerbation', 2);
  }
  if (symptoms.chestPain) {
    add('Pulmonary embolism', 3);
    add('Community-acquired pneumonia', hasPleuritic ? 2 : 1);
  }
  if (fever >= 38) {
    add('Community-acquired pneumonia', 3);
    add('COVID-19 / viral respiratory infection', 2);
    add('Urinary tract infection (UTI)', 2);
    add('Acute pyelonephritis', 3);
  } else if (fever >= 37.5) {
    add('Community-acquired pneumonia', 1);
    add('Acute bronchitis', 1);
    add('COVID-19 / viral respiratory infection', 1);
    add('Urinary tract infection (UTI)', 1);
  } else {
    add('Asthma exacerbation', 2);
    add('COPD exacerbation', 2);
    add('Heart failure exacerbation', 1);
  }

  if (hasOpacity) {
    add('Community-acquired pneumonia', 5);
    add('Acute bronchitis', -2);
    add('Asthma exacerbation', -2);
    add('COPD exacerbation', -1);
  } else if (imaging.hasNoFindings) {
    add('Acute bronchitis', 1);
    add('Asthma exacerbation', 1);
    add('COPD exacerbation', 1);
  }

  if (crp >= 50) {
    add('Community-acquired pneumonia', 3);
    add('Urinary tract infection (UTI)', 2);
    add('Acute pyelonephritis', 2);
    add('COVID-19 / viral respiratory infection', -1);
  } else if (crp >= 20) {
    add('Community-acquired pneumonia', 2);
    add('Urinary tract infection (UTI)', 1);
    add('Acute bronchitis', 1);
  } else {
    add('Asthma exacerbation', 1);
    add('COPD exacerbation', 1);
  }

  if (leukocytes >= 12) {
    add('Community-acquired pneumonia', 2);
    add('Urinary tract infection (UTI)', 2);
    add('Acute pyelonephritis', 2);
    add('COVID-19 / viral respiratory infection', -1);
  } else if (leukocytes >= 10.5) {
    add('Community-acquired pneumonia', 1);
    add('Urinary tract infection (UTI)', 1);
  } else {
    add('COVID-19 / viral respiratory infection', 1);
    add('Asthma exacerbation', 1);
  }

  if (dDimer >= 500) add('Pulmonary embolism', 4);
  if (hasCardiomegaly) add('Heart failure exacerbation', 3);
  if (hasHeartDisease) add('Heart failure exacerbation', 1);

  if (hasWheeze) add('Asthma exacerbation', 4);
  if (hasAsthmaHistory) add('Asthma exacerbation', 3);
  if (hasCopdHistory) add('COPD exacerbation', 3);

  const urinaryScore = (hasDysuria ? 3 : 0) + (hasFrequency ? 2 : 0) + (hasSuprapubic ? 2 : 0);
  if (urinaryScore > 0) {
    add('Urinary tract infection (UTI)', urinaryScore);
    add('Acute pyelonephritis', hasFlankPain ? 3 : 0);
    add('Nephrolithiasis (kidney stone)', hasFlankPain ? 2 : 0);
  }

  if (demoCaseId === 'pneumonia') add('Community-acquired pneumonia', 4);
  if (demoCaseId === 'asthma') add('Asthma exacerbation', 4);
  if (demoCaseId === 'uti') add('Urinary tract infection (UTI)', 4);

  const positives = cands.filter((c) => c.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);
  if (positives.length === 0) {
    return [
      { disease: 'Undifferentiated illness', probability: 100 },
    ];
  }

  const sum = positives.reduce((acc, c) => acc + c.score, 0);
  const raw = positives.map((c) => ({
    disease: c.disease,
    icd10Code: c.icd10Code,
    probability: Math.max(1, Math.round((c.score / sum) * 100)),
  }));

  const total = raw.reduce((acc, x) => acc + x.probability, 0);
  raw[0].probability += 100 - total;

  return raw;
}

function getDemoDefaults(demoCaseId: DemoCaseId): {
  patientInfo: PatientInfo;
  symptoms: Symptoms;
  labResults: LabResults;
  imaging: ImagingObservations;
} {
  if (demoCaseId === 'asthma') {
    return {
      patientInfo: {
        age: 28,
        gender: 'female',
        weight: 62,
        height: 165,
        medicalHistory: ['Asthma'],
        allergies: [],
        currentMedications: ['Salbutamol inhaler PRN'],
      },
      symptoms: {
        fever: 37.2,
        cough: true,
        dyspnea: true,
        chestPain: false,
        fatigue: true,
        customSymptoms: ['wheezing', 'chest tightness'],
        notes: 'Acute shortness of breath after exposure to dust. Audible wheeze, improved partially with bronchodilator.',
      },
      labResults: {
        inflammatory: { crp: 6, esr: 12 },
        hematology: { leukocytes: 8.0, hemoglobin: 13.6, platelets: 280, neutrophils: 55, lymphocytes: 35 },
        metabolic: { glucose: 92, creatinine: 0.9, urea: 14, sodium: 139, potassium: 4.1 },
        liver: { asat: 22, alat: 20, bilirubin: 0.6 },
        coagulation: { dDimer: 250, inr: 1.0 },
      },
      imaging: {
        findings: [],
        hasNoFindings: true,
        notes: 'Chest imaging without focal consolidation. Hyperinflation possible; correlate clinically.',
      },
    };
  }

  if (demoCaseId === 'uti') {
    return {
      patientInfo: {
        age: 34,
        gender: 'female',
        weight: 70,
        height: 168,
        medicalHistory: ['Recurrent UTI'],
        allergies: ['Penicillin'],
        currentMedications: [],
      },
      symptoms: {
        fever: 38.1,
        cough: false,
        dyspnea: false,
        chestPain: false,
        fatigue: true,
        customSymptoms: ['dysuria', 'urinary frequency', 'suprapubic pain'],
        notes: '2-day history of dysuria and urinary frequency. Mild suprapubic tenderness. No flank pain reported.',
      },
      labResults: {
        inflammatory: { crp: 18, esr: 22 },
        hematology: { leukocytes: 12.2, hemoglobin: 12.8, platelets: 320, neutrophils: 78, lymphocytes: 15 },
        metabolic: { glucose: 88, creatinine: 0.8, urea: 13, sodium: 138, potassium: 4.0 },
        liver: { asat: 20, alat: 18, bilirubin: 0.5 },
        coagulation: { dDimer: 220, inr: 1.0 },
      },
      imaging: {
        findings: [],
        hasNoFindings: true,
        notes: 'No imaging findings selected for this case (UTI).',
      },
    };
  }

  return {
    patientInfo: {
      age: 62,
      gender: 'male',
      weight: 82,
      height: 172,
      medicalHistory: ['Hypertension', 'Diabetes'],
      allergies: ['Penicillin'],
      currentMedications: ['Metformin', 'Amlodipine'],
    },
    symptoms: {
      fever: 38.7,
      cough: true,
      dyspnea: true,
      chestPain: false,
      fatigue: true,
      customSymptoms: ['productive cough', 'pleuritic pain'],
      notes: '3-day history of fever and productive cough. Shortness of breath on exertion. Decreased breath sounds in the right lower lobe.',
    },
    labResults: {
      inflammatory: { crp: 65, esr: 48 },
      hematology: { leukocytes: 14.2, hemoglobin: 13.9, platelets: 410, neutrophils: 82, lymphocytes: 12 },
      metabolic: { glucose: 126, creatinine: 1.1, urea: 22, sodium: 133, potassium: 4.4 },
      liver: { asat: 28, alat: 30, bilirubin: 0.8 },
      coagulation: { dDimer: 620, inr: 1.1 },
    },
    imaging: {
      findings: ['consolidation', 'infiltration'],
      hasNoFindings: false,
      notes: 'CXR: right lower lobe consolidation with patchy infiltrates. No pneumothorax.',
    },
  };
}

export function NewConsultationSection() {
  const { user } = useAuth();
  const { language, setLanguage } = useLang();
  const t = useT();
  const effectiveDoctorId = user?.id || '2';
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | number | null>(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<null | {
    id: number;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    medical_history: string[];
    allergies: string[];
    current_medications: string[];
  }>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawOllama, setRawOllama] = useState<unknown>(null);
  const [demoCaseId, setDemoCaseId] = useState<DemoCaseId>('pneumonia');

  // Form Data States
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(() => getDemoDefaults('pneumonia').patientInfo);
  const [symptoms, setSymptoms] = useState<Symptoms>(() => getDemoDefaults('pneumonia').symptoms);
  const [labResults, setLabResults] = useState<LabResults>(() => getDemoDefaults('pneumonia').labResults);
  const [imaging, setImaging] = useState<ImagingObservations>(() => getDemoDefaults('pneumonia').imaging);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>(() => createEmptyAIAnalysis());

  const steps = [
    { number: 1, label: t('consultation.stepPatient'), icon: User },
    { number: 2, label: t('consultation.stepSymptoms'), icon: Activity },
    { number: 3, label: t('consultation.stepLabs'), icon: FlaskConical },
    { number: 4, label: t('consultation.stepImaging'), icon: Scan },
    { number: 5, label: t('consultation.stepResults'), icon: Brain },
  ];

  const loadPatients = useCallback(async () => {
    try {
      const list = await doctorApi.listPatients(effectiveDoctorId);
      setPatients(list);
    } catch {
    }
  }, [effectiveDoctorId]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app.language');
      if (!saved) setLanguage('en');
    } catch {}
  }, [setLanguage]);

  const applyDemoCase = useCallback(
    (id: DemoCaseId) => {
      const d = getDemoDefaults(id);
      setDemoCaseId(id);
      setCurrentStep(1);
      setShowResults(false);
      setRawOllama(null);
      setAiAnalysis(createEmptyAIAnalysis());
      setPatientInfo(d.patientInfo);
      setSymptoms(d.symptoms);
      setLabResults(d.labResults);
      setImaging(d.imaging);
    },
    []
  );

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as FormStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as FormStep);
    }
  };

  const handleRunAnalysis = async () => {
    setIsSubmitting(true);
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => (p < 95 ? p + 3 : 95));
    }, 300);
    try {
      if (!selectedPatientId) {
        clearInterval(timer);
        setIsSubmitting(false);
        alert('Veuillez sélectionner un patient avant de lancer l’analyse.');
        return;
      }
      const result = await consultationApi.analyze(
        patientInfo,
        symptoms,
        labResults,
        imaging,
        language,
        effectiveDoctorId,
        selectedPatientId
      );
      setRawOllama(result);
      
      const newRiskAlerts: RiskAlert[] = [];
      if (result.biological_flags.inflammation) {
        newRiskAlerts.push({
          severity: 'high',
          message: language === 'fr' ? 'Inflammation élevée détectée' : 'High inflammation detected',
          recommendation: language === 'fr' ? 'Surveiller la CRP et les leucocytes.' : 'Monitor CRP and leukocytes.',
        });
      }
      if (result.biological_flags.infection_possible) {
        newRiskAlerts.push({
          severity: 'high',
          message: language === 'fr' ? 'Infection possible' : 'Possible infection',
          recommendation: language === 'fr' ? 'Évaluer l’indication d’antibiotiques.' : 'Evaluate for antibiotics.',
        });
      }
      if (result.biological_flags.renal_risk) {
        newRiskAlerts.push({
          severity: 'medium',
          message: language === 'fr' ? 'Risque rénal' : 'Renal function risk',
          recommendation: language === 'fr' ? 'Vérifier l’hydratation et les médicaments néphrotoxiques.' : 'Check hydration and renal toxic drugs.',
        });
      }
      if (result.biological_flags.liver_stress) {
        newRiskAlerts.push({
          severity: 'medium',
          message: language === 'fr' ? 'Signes de souffrance hépatique' : 'Liver stress indicators',
          recommendation: language === 'fr' ? 'Surveiller les enzymes hépatiques.' : 'Monitor liver enzymes.',
        });
      }
      
      if (result.ai_analysis.risk_alerts) {
         const rawAlerts = result.ai_analysis.risk_alerts;
         
         if (Array.isArray(rawAlerts)) {
             rawAlerts.forEach(alert => {
                 let msg = '';
                 if (typeof alert === 'object' && alert !== null) {
                     msg = Object.entries(alert)
                        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
                        .join(', ');
                 } else {
                     msg = String(alert);
                 }
                 if (msg) {
                    newRiskAlerts.push({
                        severity: 'high',
                        message: msg,
                        recommendation: language === 'fr'
                          ? 'Revoir l’historique du patient et surveiller de près.'
                          : 'Review patient history and monitor closely.'
                    });
                 }
             });
         } else if (typeof rawAlerts === 'object' && rawAlerts !== null) {
             Object.entries(rawAlerts).forEach(([key, value]) => {
                 newRiskAlerts.push({
                     severity: 'high',
                     message: `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`,
                     recommendation: language === 'fr'
                       ? 'Revoir l’historique du patient et surveiller de près.'
                       : 'Review patient history and monitor closely.'
                 });
             });
         } else {
             newRiskAlerts.push({
                 severity: 'high',
                 message: String(rawAlerts),
                 recommendation: language === 'fr' ? 'Voir le détail de l’analyse.' : 'See detailed analysis.'
             });
         }
      }

      const ensureString = (val: unknown): string => {
          if (typeof val === 'string') return val;
          if (typeof val === 'object' && val !== null) return JSON.stringify(val);
          return String(val || '');
      };

      const costComparisons = result.ai_analysis?.extras?.cost_comparisons || [];
      const diseaseProbabilities =
        (result.ai_analysis?.extras?.disease_probabilities as DiseaseProbability[] | undefined) ??
        (result.ai_raw?.disease_probabilities as DiseaseProbability[] | undefined) ??
        generateDiseaseProbabilities({ patientInfo, symptoms, labResults, imaging, demoCaseId });
      setAiAnalysis({
        diseaseProbabilities,
        riskAlerts: newRiskAlerts,
        therapeuticDirection: result.ai_analysis.therapeutic_orientation ? ensureString(result.ai_analysis.therapeutic_orientation) : '',
        explanation: result.ai_analysis.clinical_reasoning ? ensureString(result.ai_analysis.clinical_reasoning) : '',
        costComparisons: costComparisons.map((c: any) => ({
          option: c.option,
          description: c.description,
          estimatedCost: c.estimatedCost,
          effectiveness: c.effectiveness ?? 0,
          isRecommended: !!c.isRecommended
        })),
        confidenceScore: typeof (result.ai_analysis?.extras?.confidence_score) === 'number' ? result.ai_analysis.extras.confidence_score : 82,
        processingTime: typeof (result.ai_analysis?.extras?.total_duration_ms) === 'number' ? Math.round(result.ai_analysis.extras.total_duration_ms / 1000) : 0,
        modelVersion: String(result.ai_analysis?.extras?.model || 'Mistral (Local)'),
        generatedAt: new Date(),
      });

      setShowResults(true);
      setCurrentStep(5);
    } catch (error) {
      console.error('Analysis failed:', error);
      const fallback =
        language === 'fr'
          ? 'Impossible de contacter le backend. Vérifiez que le serveur est démarré.'
          : 'Failed to connect to backend. Please ensure the backend server is running.';
      const msg = (error as any)?.message ? String((error as any).message) : fallback;
      alert(msg);
    } finally {
      setProgress(100);
      setTimeout(() => clearInterval(timer), 200);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedPatientId(null);
    setSelectedPatientDetail(null);
    applyDemoCase(demoCaseId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('consultation.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('consultation.subtitle').replace('{step}', String(currentStep))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Demo case</Label>
            <select
              value={demoCaseId}
              onChange={(e) => applyDemoCase(e.target.value as DemoCaseId)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              {getDemoCases().map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <Label className="text-xs">{t('common.language')}</Label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        {showResults && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {t('consultation.newCase')}
            </Button>
          </div>
        )}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <Label>{t('consultation.patient')}</Label>
              <select
                className="mt-1 w-full border rounded h-9 px-3 bg-background"
                value={selectedPatientId ?? ''}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSelectedPatientId(id);
                  const p = patients.find((x) => x.id === id);
                  if (p?.date_of_birth) {
                    const d = new Date(p.date_of_birth);
                    const now = new Date();
                    let age = now.getFullYear() - d.getFullYear();
                    const m = now.getMonth() - d.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
                    setPatientInfo((prev) => ({ ...prev, age: Math.max(0, age), gender: p.gender || prev.gender }));
                  }
                  if (id) {
                    (async () => {
                      try {
                        const detail = await doctorApi.getPatient(effectiveDoctorId, id);
                        setSelectedPatientDetail(detail);
                        setPatientInfo((prev) => {
                          const g = (detail.gender === 'male' || detail.gender === 'female' || detail.gender === 'other')
                            ? detail.gender
                            : prev.gender;
                          const weight = typeof (detail as any).weight_kg === 'number' ? (detail as any).weight_kg : prev.weight;
                          const height = typeof (detail as any).height_cm === 'number' ? (detail as any).height_cm : prev.height;
                          return {
                            ...prev,
                            gender: g,
                            weight: Number.isFinite(weight) ? weight : prev.weight,
                            height: Number.isFinite(height) ? height : prev.height,
                            medicalHistory: Array.isArray(detail.medical_history) ? detail.medical_history : prev.medicalHistory,
                            allergies: Array.isArray(detail.allergies) ? detail.allergies : prev.allergies,
                            currentMedications: Array.isArray(detail.current_medications) ? detail.current_medications : prev.currentMedications,
                          };
                        });
                      } catch {
                        // ignore fetch errors silently
                      }
                    })();
                  } else {
                    setSelectedPatientDetail(null);
                  }
                }}
              >
                <option value="">{t('consultation.selectPatient')}</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.first_name || p.firstName) + ' ' + (p.last_name || p.lastName)}
                  </option>
                ))}
              </select>
              {selectedPatientDetail && (
                <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                  <div className="text-sm font-medium">
                    {(selectedPatientDetail.first_name || '')} {(selectedPatientDetail.last_name || '')}
                    {' · '} {selectedPatientDetail.gender || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedPatientDetail.date_of_birth
                      ? new Date(selectedPatientDetail.date_of_birth).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
                      : '—'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedPatientDetail.allergies?.length
                      ? selectedPatientDetail.allergies.map((a, i) => (
                          <span key={`${a}-${i}`} className="text-[11px] px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30">
                            {a}
                          </span>
                        ))
                      : <span className="text-xs text-muted-foreground">Aucune allergie déclarée</span>}
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>{t('consultation.actions')}</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  onClick={async () => {
                    await loadPatients();
                  }}
                  variant="outline"
                >
                  {t('consultation.refresh')}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('consultation.patientRequired')}
            </div>
          </div>
        </CardContent>
      </Card>
      {isSubmitting && (
        <div className="w-full h-2 bg-muted rounded">
          <div className="h-2 bg-primary rounded transition-all" style={{ width: `${progress}%` }} />
          <div className="text-xs text-muted-foreground mt-1">{progress}%</div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep >= step.number
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <PatientInfoStep
              data={patientInfo}
              onChange={setPatientInfo}
            />
          )}
          {currentStep === 2 && (
            <SymptomsStep
              data={symptoms}
              onChange={setSymptoms}
            />
          )}
          {currentStep === 3 && (
            <LabAnalysisStep
              data={labResults}
              onChange={setLabResults}
            />
          )}
          {currentStep === 4 && (
            <ImagingStep
              data={imaging}
              onChange={setImaging}
              onRunAnalysis={handleRunAnalysis}
              isSubmitting={isSubmitting}
              progress={progress}
            />
          )}
          {currentStep === 5 && showResults && (
            <AIResultsStep 
              analysis={aiAnalysis} 
              rawJson={rawOllama} 
              doctorId={user?.id || 'default_doc'}
              patientId={Number(selectedPatientId)}
              patient={selectedPatientDetail}
              patientInfo={patientInfo}
              symptoms={symptoms}
              labResults={labResults}
              imaging={imaging}
              language={language}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {currentStep !== 4 && currentStep !== 5 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.previous')}
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {t('common.next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Step 1: Patient Information
function PatientInfoStep({ 
  data, 
  onChange 
}: { 
  data: PatientInfo; 
  onChange: (data: PatientInfo) => void;
}) {
  const { language } = useLang();
  const medicalHistoryOptions = [
    'Hypertension',
    'Diabetes',
    'Asthma',
    'COPD',
    'Heart Disease',
    'Kidney Disease',
    'Liver Disease',
    'Cancer',
  ];

  const allergyOptions = [
    'Penicillin',
    'Sulfa drugs',
    'NSAIDs',
    'Latex',
    'Iodine',
    'Shellfish',
  ];

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">{language === 'fr' ? 'Informations patient' : 'Patient Information'}</h3>
        <p className="text-sm text-muted-foreground">
          {language === 'fr' ? 'Renseigner la démographie et l’historique' : 'Enter basic patient demographics and history'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">{language === 'fr' ? 'Âge (ans)' : 'Age (years)'}</Label>
          <Input
            id="age"
            type="number"
            value={data.age}
            onChange={(e) => onChange({ ...data, age: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === 'fr' ? 'Sexe' : 'Gender'}</Label>
          <div className="flex gap-2">
            {(['male', 'female', 'other'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => onChange({ ...data, gender })}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm capitalize transition-colors ${
                  data.gender === gender
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {language === 'fr'
                  ? gender === 'male'
                    ? 'Homme'
                    : gender === 'female'
                      ? 'Femme'
                      : 'Autre'
                  : gender}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">{language === 'fr' ? 'Poids (kg)' : 'Weight (kg)'}</Label>
          <Input
            id="weight"
            type="number"
            value={data.weight}
            onChange={(e) => onChange({ ...data, weight: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">{language === 'fr' ? 'Taille (cm)' : 'Height (cm)'}</Label>
          <Input
            id="height"
            type="number"
            value={data.height}
            onChange={(e) => onChange({ ...data, height: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>{language === 'fr' ? 'Antécédents' : 'Medical History'}</Label>
        <div className="flex flex-wrap gap-2">
          {medicalHistoryOptions.map((item) => (
            <button
              key={item}
              onClick={() => onChange({ ...data, medicalHistory: toggleArrayItem(data.medicalHistory, item) })}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                data.medicalHistory.includes(item)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>{language === 'fr' ? 'Allergies' : 'Allergies'}</Label>
        <div className="flex flex-wrap gap-2">
          {allergyOptions.map((item) => (
            <button
              key={item}
              onClick={() => onChange({ ...data, allergies: toggleArrayItem(data.allergies, item) })}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                data.allergies.includes(item)
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="medications">{language === 'fr' ? 'Traitements en cours' : 'Current Medications'}</Label>
        <Input
          id="medications"
          placeholder={language === 'fr' ? 'Saisir des médicaments séparés par des virgules' : 'Enter medications separated by commas'}
          value={data.currentMedications.join(', ')}
          onChange={(e) => onChange({ ...data, currentMedications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        />
        <p className="text-xs text-muted-foreground">
          {language === 'fr' ? 'Séparer plusieurs médicaments par des virgules' : 'Separate multiple medications with commas'}
        </p>
      </div>
    </div>
  );
}

// Step 2: Symptoms
function SymptomsStep({ 
  data, 
  onChange 
}: { 
  data: Symptoms; 
  onChange: (data: Symptoms) => void;
}) {
  const { language } = useLang();
  const [newSymptom, setNewSymptom] = useState('');

  const addCustomSymptom = () => {
    if (newSymptom.trim()) {
      onChange({ ...data, customSymptoms: [...data.customSymptoms, newSymptom.trim()] });
      setNewSymptom('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">{language === 'fr' ? 'Symptômes' : 'Presenting Symptoms'}</h3>
        <p className="text-sm text-muted-foreground">
          {language === 'fr' ? 'Renseigner les plaintes et signes cliniques' : 'Document patient complaints and vital signs'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fever">{language === 'fr' ? 'Fièvre (°C)' : 'Fever (°C)'}</Label>
          <Input
            id="fever"
            type="number"
            step="0.1"
            placeholder={language === 'fr' ? 'ex: 38.5' : 'e.g., 38.5'}
            value={data.fever || ''}
            onChange={(e) => onChange({ ...data, fever: parseFloat(e.target.value) || undefined })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>{language === 'fr' ? 'Symptômes fréquents' : 'Common Symptoms'}</Label>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { key: 'cough', label: language === 'fr' ? 'Toux' : 'Cough' },
            { key: 'dyspnea', label: language === 'fr' ? 'Dyspnée (essoufflement)' : 'Dyspnea (Shortness of breath)' },
            { key: 'chestPain', label: language === 'fr' ? 'Douleur thoracique' : 'Chest Pain' },
            { key: 'fatigue', label: language === 'fr' ? 'Fatigue' : 'Fatigue' },
          ].map((symptom) => (
            <label
              key={symptom.key}
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
            >
              <Checkbox
                checked={data[symptom.key as keyof Symptoms] as boolean}
                onCheckedChange={(checked) => 
                  onChange({ ...data, [symptom.key]: checked === true })
                }
              />
              <span className="text-sm">{symptom.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>{language === 'fr' ? 'Autres symptômes' : 'Custom Symptoms'}</Label>
        <div className="flex gap-2">
          <Input
            placeholder={language === 'fr' ? 'Ajouter un symptôme…' : 'Add a symptom...'}
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomSymptom()}
          />
          <Button type="button" onClick={addCustomSymptom} variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.customSymptoms.map((symptom, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {symptom}
              <button
                onClick={() => onChange({ 
                  ...data, 
                  customSymptoms: data.customSymptoms.filter((_, i) => i !== index) 
                })}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{language === 'fr' ? 'Notes additionnelles' : 'Additional Notes'}</Label>
        <textarea
          id="notes"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={language === 'fr' ? 'Saisir des observations supplémentaires…' : 'Enter any additional observations...'}
          value={data.notes || ''}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
        />
      </div>
    </div>
  );
}

// Step 3: Lab Analysis
function LabAnalysisStep({ 
  data, 
  onChange 
}: { 
  data: LabResults; 
  onChange: (data: LabResults) => void;
}) {
  const { language } = useLang();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['inflammatory', 'hematology']);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const renderLabField = (name: string, value: number, _category: string, path: string) => {
    const check = checkLabValue(name, value);
    const range = check.range;
    const tooltip = labTooltips[name];
    const statusLabel =
      language === 'fr'
        ? check.status === 'normal'
          ? 'normal'
          : check.status === 'warning'
            ? 'à surveiller'
            : check.status === 'danger'
              ? 'anormal'
              : check.status
        : check.status;

    return (
      <div key={name} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm flex items-center gap-1">
            {name}
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Label>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(check.status)}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.1"
            value={value || ''}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              const keys = path.split('.');
              if (keys.length === 2) {
                onChange({
                  ...data,
                  [keys[0]]: {
                    ...data[keys[0] as keyof LabResults],
                    [keys[1]]: newValue,
                  },
                });
              }
            }}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-20 text-right">
            {range ? `${range.min}-${range.max} ${range.unit}` : '—'}
          </span>
        </div>
      </div>
    );
  };

  const categories = [
    { key: 'inflammatory', rangeCategory: 'Inflammatory', label: language === 'fr' ? 'Marqueurs inflammatoires' : 'Inflammatory Markers', icon: Activity },
    { key: 'hematology', rangeCategory: 'Hematology', label: language === 'fr' ? 'Hématologie' : 'Hematology', icon: Activity },
    { key: 'metabolic', rangeCategory: 'Metabolic', label: language === 'fr' ? 'Bilan métabolique' : 'Metabolic Panel', icon: FlaskConical },
    { key: 'liver', rangeCategory: 'Liver', label: language === 'fr' ? 'Fonction hépatique' : 'Liver Function', icon: Activity },
    { key: 'coagulation', rangeCategory: 'Coagulation', label: language === 'fr' ? 'Coagulation' : 'Coagulation', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">{language === 'fr' ? 'Analyse biologique' : 'Biological Analysis'}</h3>
        <p className="text-sm text-muted-foreground">
          {language === 'fr' ? 'Saisir les valeurs biologiques avec les références' : 'Enter laboratory values with reference ranges'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lab Input Panels */}
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.key} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category.key)}
                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <category.icon className="w-4 h-4 text-primary" />
                  <span className="font-medium">{category.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  expandedCategories.includes(category.key) ? 'rotate-90' : ''
                }`} />
              </button>
              
              {expandedCategories.includes(category.key) && (
                <div className="p-4 space-y-4">
                  {category.key === 'inflammatory' && (
                    <>
                      {renderLabField('CRP', data.inflammatory.crp, 'Inflammatory', 'inflammatory.crp')}
                      {renderLabField('ESR', data.inflammatory.esr, 'Inflammatory', 'inflammatory.esr')}
                    </>
                  )}
                  {category.key === 'hematology' && (
                    <>
                      {renderLabField('Leukocytes', data.hematology.leukocytes, 'Hematology', 'hematology.leukocytes')}
                      {renderLabField('Hemoglobin', data.hematology.hemoglobin, 'Hematology', 'hematology.hemoglobin')}
                      {renderLabField('Platelets', data.hematology.platelets, 'Hematology', 'hematology.platelets')}
                      {renderLabField('Neutrophils', data.hematology.neutrophils, 'Hematology', 'hematology.neutrophils')}
                      {renderLabField('Lymphocytes', data.hematology.lymphocytes, 'Hematology', 'hematology.lymphocytes')}
                    </>
                  )}
                  {category.key === 'metabolic' && (
                    <>
                      {renderLabField('Glucose', data.metabolic.glucose, 'Metabolic', 'metabolic.glucose')}
                      {renderLabField('Creatinine', data.metabolic.creatinine, 'Metabolic', 'metabolic.creatinine')}
                      {renderLabField('Urea', data.metabolic.urea, 'Metabolic', 'metabolic.urea')}
                      {renderLabField('Sodium', data.metabolic.sodium, 'Metabolic', 'metabolic.sodium')}
                      {renderLabField('Potassium', data.metabolic.potassium, 'Metabolic', 'metabolic.potassium')}
                    </>
                  )}
                  {category.key === 'liver' && (
                    <>
                      {renderLabField('ASAT', data.liver.asat, 'Liver', 'liver.asat')}
                      {renderLabField('ALAT', data.liver.alat, 'Liver', 'liver.alat')}
                      {renderLabField('Bilirubin', data.liver.bilirubin, 'Liver', 'liver.bilirubin')}
                    </>
                  )}
                  {category.key === 'coagulation' && (
                    <>
                      {renderLabField('D-dimer', data.coagulation.dDimer, 'Coagulation', 'coagulation.dDimer')}
                      {renderLabField('INR', data.coagulation.inr, 'Coagulation', 'coagulation.inr')}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-4">{language === 'fr' ? 'Résumé biologique' : 'Biological Summary'}</h4>
              <div className="space-y-3">
                {categories.map((category) => {
                  const categoryRanges = labReferenceRanges.filter(r => 
                    r.category.toLowerCase() === category.rangeCategory.toLowerCase()
                  );
                  const abnormalCount = categoryRanges.filter(r => {
                    const value = getLabValue(data, r.name);
                    return value > 0 && (value < r.min || value > r.max);
                  }).length;

                  return (
                    <div key={category.key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{category.label}</span>
                      <Badge 
                        variant={abnormalCount > 0 ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {abnormalCount > 0
                          ? language === 'fr'
                            ? `${abnormalCount} anormal`
                            : `${abnormalCount} abnormal`
                          : language === 'fr'
                            ? 'normal'
                            : 'Normal'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            <p>
              {language === 'fr'
                ? 'Les valeurs de référence sont basées sur des standards cliniques.'
                : 'Reference ranges are based on standard clinical values.'}
            </p>
            <p>
              {language === 'fr'
                ? 'Toujours vérifier selon les références de votre établissement.'
                : "Always verify with your institution's specific ranges."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 4: Imaging
function ImagingStep({ 
  data, 
  onChange,
  onRunAnalysis,
  isSubmitting,
  progress
}: { 
  data: ImagingObservations; 
  onChange: (data: ImagingObservations) => void;
  onRunAnalysis: () => void;
  isSubmitting: boolean;
  progress: number;
}) {
  const { language } = useLang();
  const findings = [
    { key: 'pulmonary_opacity', label: language === 'fr' ? 'Opacité pulmonaire' : 'Pulmonary Opacity' },
    { key: 'infiltration', label: language === 'fr' ? 'Infiltration' : 'Infiltration' },
    { key: 'consolidation', label: language === 'fr' ? 'Condensation' : 'Consolidation' },
    { key: 'pleural_effusion', label: language === 'fr' ? 'Épanchement pleural' : 'Pleural Effusion' },
    { key: 'pneumothorax', label: language === 'fr' ? 'Pneumothorax' : 'Pneumothorax' },
    { key: 'cardiomegaly', label: language === 'fr' ? 'Cardiomégalie' : 'Cardiomegaly' },
  ];

  const toggleFinding = (finding: string) => {
    const newFindings = data.findings.includes(finding as never)
      ? data.findings.filter(f => f !== finding)
      : [...data.findings, finding as never];
    onChange({ ...data, findings: newFindings, hasNoFindings: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">{language === 'fr' ? 'Imagerie' : 'Imaging Observations'}</h3>
        <p className="text-sm text-muted-foreground">
          {language === 'fr' ? 'Sélectionner les constatations de la dernière imagerie' : 'Select findings from the latest imaging study'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Image Placeholder */}
        <div className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Scan className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-center mb-2">
            {language === 'fr' ? 'Importer une imagerie (DICOM / PNG / JPG)' : 'Upload imaging (DICOM / PNG / JPG)'}
          </p>
          <Button variant="outline" size="sm">
            {language === 'fr' ? 'Choisir un fichier' : 'Select File'}
          </Button>
        </div>

        {/* Findings Form */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>{language === 'fr' ? 'Constatations' : 'Select Findings'}</Label>
            <div className="space-y-2">
              {findings.map((finding) => (
                <label
                  key={finding.key}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={data.findings.includes(finding.key as never)}
                    onCheckedChange={() => toggleFinding(finding.key)}
                  />
                  <span className="text-sm">{finding.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
            <Checkbox
              checked={data.hasNoFindings}
              onCheckedChange={(checked) => 
                onChange({ ...data, hasNoFindings: checked === true, findings: [] })
              }
            />
            <span className="text-sm">{language === 'fr' ? 'Aucune anomalie' : 'No abnormal findings'}</span>
          </label>

          <div className="space-y-2">
            <Label htmlFor="imaging-notes">{language === 'fr' ? 'Notes additionnelles' : 'Additional Notes'}</Label>
            <textarea
              id="imaging-notes"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={language === 'fr' ? 'Saisir des observations supplémentaires…' : 'Enter any additional imaging observations...'}
              value={data.notes || ''}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button 
          onClick={onRunAnalysis} 
          disabled={isSubmitting}
          className="gap-2"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {language === 'fr' ? `Analyse… ${progress}%` : `Analyzing... ${progress}%`}
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              {language === 'fr' ? 'Lancer l’analyse IA' : 'Run AI Analysis'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Step 5: AI Results
function AIResultsStep({
  analysis,
  rawJson,
  doctorId,
  patientId,
  patient,
  patientInfo,
  symptoms,
  labResults,
  imaging,
  language,
}: {
  analysis: AIAnalysis;
  rawJson?: unknown;
  doctorId: string;
  patientId: number;
  patient?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: string;
  } | null;
  patientInfo?: PatientInfo;
  symptoms?: Symptoms;
  labResults?: LabResults;
  imaging?: ImagingObservations;
  language?: 'fr' | 'en';
}) {
  const t = useT();
  const { language: uiLang } = useLang();
  const [ask, setAsk] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: string; content: string; ts: string }>>([]);
  const [ehrStatus, setEhrStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  useEffect(() => {
    (async () => {
      try {
        const { chatApi } = await import('@/services/api');
        const h = await chatApi.history(doctorId, patientId);
        setHistory(h);
      } catch {
        // ignore if backend not loaded
      }
    })();
  }, [doctorId, patientId]);
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
  };

  const therapeuticSource = (() => {
    const fromRaw = (rawJson as any)?.ai_analysis?.therapeutic_orientation;
    return fromRaw ?? analysis.therapeuticDirection;
  })();

  const therapeuticStructured = (() => {
    if (therapeuticSource && typeof therapeuticSource === 'object' && !Array.isArray(therapeuticSource)) {
      return therapeuticSource as Record<string, unknown>;
    }
    if (typeof therapeuticSource === 'string') {
      const s = therapeuticSource.trim();
      if (s.startsWith('{') || s.startsWith('[')) {
        try {
          const parsed = JSON.parse(s);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
        } catch {}
      }
    }
    return null;
  })();

  const therapeuticText = (() => {
    if (therapeuticStructured) return null;
    if (therapeuticSource == null) return '';
    if (typeof therapeuticSource === 'string') return therapeuticSource;
    try {
      return JSON.stringify(therapeuticSource);
    } catch {
      return String(therapeuticSource);
    }
  })();

  const patientLabel = patient
    ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">{t('results.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {uiLang === 'fr'
              ? `Généré en ${analysis.processingTime}s · Modèle: ${analysis.modelVersion}`
              : `Generated in ${analysis.processingTime}s · Model: ${analysis.modelVersion}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              if (!rawJson) {
                alert(uiLang === 'fr' ? 'Aucune donnée brute disponible pour exporter.' : 'No raw data available to export.');
                return;
              }
              try {
                const res = await fetch('http://localhost:8000/api/consultation/report/pdf', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Doctor-Id': doctorId,
                    'X-Patient-Id': String(patientId),
                  },
                  body: JSON.stringify({
                    patient: {
                      id: patientId,
                      name: patientLabel || `ID: ${patientId}`,
                      date_of_birth: patient?.date_of_birth || '',
                      gender: patient?.gender || '',
                      age: patientInfo?.age,
                    },
                    symptoms: symptoms ?? null,
                    labs: labResults ?? null,
                    imaging: imaging ?? null,
                    result: rawJson,
                    language: language ?? 'fr',
                  }),
                });
                if (!res.ok) throw new Error('export_failed');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
              } catch {
                alert(
                  uiLang === 'fr'
                    ? 'Export PDF impossible. Vérifiez que le backend est démarré.'
                    : 'PDF export failed. Ensure the backend is running.'
                );
              }
            }}
          >
            <FileDown className="w-4 h-4" />
            {t('results.exportPdf')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={ehrStatus === 'saving'}
            onClick={async () => {
              setEhrStatus('saving');
              try {
                const { chatApi } = await import('@/services/api');
                await chatApi.history(doctorId, patientId);
                setEhrStatus('saved');
                setTimeout(() => setEhrStatus('idle'), 2000);
              } catch {
                setEhrStatus('error');
                setTimeout(() => setEhrStatus('idle'), 2500);
              }
            }}
          >
            <Save className="w-4 h-4" />
            {ehrStatus === 'saving' ? 'Enregistrement…' : ehrStatus === 'saved' ? 'Enregistré' : t('results.saveEhr')}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Disease Probability Chart */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">{t('results.diseaseProbability')}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.diseaseProbabilities} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="disease" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    width={120}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Probability']}
                  />
                  <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                    {analysis.diseaseProbabilities.map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? 'hsl(var(--primary))' : `hsl(var(--primary) / ${0.7 - index * 0.15})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        <div className="space-y-4">
          <h4 className="font-semibold">{t('results.riskAlerts')}</h4>
          {analysis.riskAlerts.map((alert, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{alert.message}</p>
                  {alert.recommendation && (
                    <p className="text-sm mt-1 opacity-80">{alert.recommendation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">{t('results.therapeuticDirection')}</h4>
              {therapeuticStructured ? (
                <div className="overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(therapeuticStructured).map(([k, v]) => (
                        <tr key={k} className="border-b last:border-b-0">
                          <td className="w-48 p-3 font-medium align-top bg-muted/30">{k}</td>
                          <td className="p-3 text-muted-foreground whitespace-pre-wrap">{typeof v === 'string' ? v : JSON.stringify(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{therapeuticText}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cost Comparison */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-4">{t('results.costComparison')}</h4>
          <div className="space-y-3">
            {analysis.costComparisons.map((option, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  option.isRecommended ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {option.isRecommended && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <div className="font-medium">{option.option}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(option.estimatedCost)}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.effectiveness}% {uiLang === 'fr' ? 'efficace' : 'effective'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Explanation */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">{t('results.explanation')}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.explanation}</p>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <span className="text-xs text-muted-foreground">
                {uiLang === 'fr' ? 'Score de confiance' : 'Confidence Score'}
              </span>
              <div className="font-semibold">{analysis.confidenceScore}%</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {uiLang === 'fr' ? 'Temps de traitement' : 'Processing Time'}
              </span>
              <div className="font-semibold">{analysis.processingTime}s</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Raw Ollama Response */}
      {rawJson != null && (
        <Card>
          <CardContent className="p-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="raw">
                <AccordionTrigger>{t('results.rawResponse')}</AccordionTrigger>
                <AccordionContent>
                  <pre className="text-xs overflow-auto p-3 rounded bg-muted/40 border">
{JSON.stringify(rawJson, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Générer ordonnance */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Générer l’ordonnance à partir des recommandations</h4>
            <Button
              className="gap-2"
              onClick={async () => {
                const parseDesc = (desc: string) => {
                  const t = (desc || '').trim().split(/\s+/).filter(Boolean);
                  if (t.length >= 3) {
                    return { dosage: t[0], frequency: t.slice(1, -1).join(' '), duration: t[t.length - 1] };
                  }
                  if (t.length === 2) {
                    return { dosage: t[0], frequency: '', duration: t[1] };
                  }
                  return { dosage: desc || '', frequency: '', duration: '' };
                };
                const picks = [...(analysis.costComparisons || [])];
                const preferred = picks.filter(p => p.isRecommended);
                const selected = (preferred.length > 0 ? preferred : picks).slice(0, 3);
                const items = selected.map(it => ({
                  name: it.option,
                  ...parseDesc(it.description || ''),
                  notes: 'Auto-généré depuis recommandations IA',
                }));
                if (items.length === 0) {
                  alert('Aucune recommandation disponible pour générer une ordonnance.');
                  return;
                }
                try {
                  const res = await doctorApi.createPrescription({
                    doctor_id: doctorId,
                    patient_id: Number(patientId),
                    items,
                    notes: 'Prescription générée automatiquement à partir des recommandations IA.',
                  });
                  doctorApi.openPrescriptionPdf(res.id);
                } catch {
                  alert('Impossible de créer l’ordonnance. Vérifiez que le médecin est approuvé et le patient appartient à ce médecin.');
                }
              }}
            >
              <FileDown className="w-4 h-4" />
              Générer l’ordonnance PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique Q/R */}
      {history.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-semibold">Historique des échanges</h4>
            <div className="space-y-2 max-h-64 overflow-auto">
              {history.map((m, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {m.role === 'user' ? 'Vous' : m.role === 'analysis' ? 'IA (Analyse)' : m.role === 'event' ? 'Système' : 'IA'}:
                    </span>
                    <span className="text-xs text-muted-foreground">{m.ts ? new Date(m.ts).toLocaleString() : ''}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-muted-foreground">{m.content}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Q&A Chat */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold">Poser une question à l’IA</h4>
          <textarea
            className="w-full h-24 border rounded p-2 bg-background"
            placeholder="Posez une question clinique en lien avec cette analyse…"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (!ask.trim()) return;
                setLoading(true);
                setAnswer(null);
                try {
                  const context = JSON.stringify(rawJson ?? analysis);
                  const { chatApi } = await import('@/services/api');
                  let lang: 'fr' | 'en' = 'fr';
                  try {
                    const saved = localStorage.getItem('app.language');
                    if (saved === 'fr' || saved === 'en') lang = saved;
                  } catch {}
                  const res = await chatApi.ask({ question: ask, context, language: lang, doctor_id: doctorId, patient_id: Number(patientId) });
                  setAnswer(res.text);
                  // refresh history
                  try {
                    const h = await chatApi.history(doctorId, Number(patientId));
                    setHistory(h);
                  } catch {}
                } catch {
                  setAnswer('Erreur lors de la communication avec le backend.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? 'Envoi…' : 'Demander'}
            </Button>
          </div>
          {answer && (
            <div className="p-3 rounded border bg-muted/40 text-sm whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getStatusColor(status: 'normal' | 'warning' | 'danger'): string {
  switch (status) {
    case 'normal':
      return 'bg-emerald-500/10 text-emerald-600';
    case 'warning':
      return 'bg-amber-500/10 text-amber-600';
    case 'danger':
      return 'bg-red-500/10 text-red-600';
    default:
      return 'bg-gray-500/10 text-gray-600';
  }
}

function getLabValue(data: LabResults, name: string): number {
  const mappings: Record<string, number> = {
    CRP: data.inflammatory.crp,
    ESR: data.inflammatory.esr,
    Leukocytes: data.hematology.leukocytes,
    Hemoglobin: data.hematology.hemoglobin,
    Platelets: data.hematology.platelets,
    Neutrophils: data.hematology.neutrophils,
    Lymphocytes: data.hematology.lymphocytes,
    Glucose: data.metabolic.glucose,
    Creatinine: data.metabolic.creatinine,
    Urea: data.metabolic.urea,
    Sodium: data.metabolic.sodium,
    Potassium: data.metabolic.potassium,
    ASAT: data.liver.asat,
    ALAT: data.liver.alat,
    Bilirubin: data.liver.bilirubin,
    'D-dimer': data.coagulation.dDimer,
    INR: data.coagulation.inr,
  };
  return mappings[name] || 0;
}
