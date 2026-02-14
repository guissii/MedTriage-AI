import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { consultationApi } from '@/services/api';
import type { 
  PatientInfo, 
  Symptoms, 
  LabResults, 
  ImagingObservations, 
  AIAnalysis 
} from '@/types';

type FormStep = 1 | 2 | 3 | 4 | 5;

export function NewConsultationSection() {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [progress, setProgress] = useState(0);
  const [rawOllama, setRawOllama] = useState<unknown>(null);

  // Form Data States
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    age: 45,
    gender: 'male',
    weight: 78,
    height: 175,
    medicalHistory: [],
    allergies: [],
    currentMedications: [],
  });

  const [symptoms, setSymptoms] = useState<Symptoms>({
    fever: undefined,
    cough: false,
    dyspnea: false,
    chestPain: false,
    fatigue: false,
    customSymptoms: [],
    notes: '',
  });

  const [labResults, setLabResults] = useState<LabResults>({
    inflammatory: { crp: 0, esr: 0 },
    hematology: { leukocytes: 0, hemoglobin: 0, platelets: 0, neutrophils: 0, lymphocytes: 0 },
    metabolic: { glucose: 0, creatinine: 0, urea: 0, sodium: 0, potassium: 0 },
    liver: { asat: 0, alat: 0, bilirubin: 0 },
    coagulation: { dDimer: 0, inr: 0 },
  });

  const [imaging, setImaging] = useState<ImagingObservations>({
    findings: [],
    hasNoFindings: false,
    notes: '',
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>({
    diseaseProbabilities: [],
    riskAlerts: [],
    therapeuticDirection: '',
    costComparisons: [],
    explanation: '',
    confidenceScore: 0,
    processingTime: 0,
    modelVersion: 'Mistral (Local)',
    generatedAt: new Date(),
  });

  const steps = [
    { number: 1, label: 'Patient Info', icon: User },
    { number: 2, label: 'Symptoms', icon: Activity },
    { number: 3, label: 'Lab Analysis', icon: FlaskConical },
    { number: 4, label: 'Imaging', icon: Scan },
    { number: 5, label: 'AI Results', icon: Brain },
  ];

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
      const result = await consultationApi.analyze(patientInfo, symptoms, labResults, imaging, language);
      setRawOllama(result);
      
      const newRiskAlerts = [];
      if (result.biological_flags.inflammation) {
        newRiskAlerts.push({
          severity: 'high',
          message: 'High Inflammation Detected',
          recommendation: 'Monitor CRP and leukocytes.'
        });
      }
      if (result.biological_flags.infection_possible) {
        newRiskAlerts.push({
          severity: 'high',
          message: 'Possible Infection',
          recommendation: 'Evaluate for antibiotics.'
        });
      }
      if (result.biological_flags.renal_risk) {
        newRiskAlerts.push({
          severity: 'medium',
          message: 'Renal Function Risk',
          recommendation: 'Check hydration and renal toxic drugs.'
        });
      }
      if (result.biological_flags.liver_stress) {
        newRiskAlerts.push({
          severity: 'medium',
          message: 'Liver Stress Indicators',
          recommendation: 'Monitor liver enzymes.'
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
                        recommendation: 'Review patient history and monitor closely.'
                    });
                 }
             });
         } else if (typeof rawAlerts === 'object' && rawAlerts !== null) {
             Object.entries(rawAlerts).forEach(([key, value]) => {
                 newRiskAlerts.push({
                     severity: 'high',
                     message: `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`,
                     recommendation: 'Review patient history and monitor closely.'
                 });
             });
         } else {
             newRiskAlerts.push({
                 severity: 'high',
                 message: String(rawAlerts),
                 recommendation: 'See detailed analysis.'
             });
         }
      }

      const ensureString = (val: unknown): string => {
          if (typeof val === 'string') return val;
          if (typeof val === 'object' && val !== null) return JSON.stringify(val);
          return String(val || '');
      };

      const costComparisons = result.ai_analysis?.extras?.cost_comparisons || [];
      setAiAnalysis({
        diseaseProbabilities: [],
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
        confidenceScore: 0,
        processingTime: 0,
        modelVersion: 'Mistral (Local)',
        generatedAt: new Date(),
      });

      setShowResults(true);
      setCurrentStep(5);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to connect to backend. Please ensure the backend server is running.');
    } finally {
      setProgress(100);
      setTimeout(() => clearInterval(timer), 200);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setShowResults(false);
    setPatientInfo({
      age: 45,
      gender: 'male',
      weight: 78,
      height: 175,
      medicalHistory: [],
      allergies: [],
      currentMedications: [],
    });
    setSymptoms({
      fever: undefined,
      cough: false,
      dyspnea: false,
      chestPain: false,
      fatigue: false,
      customSymptoms: [],
      notes: '',
    });
    setLabResults({
      inflammatory: { crp: 0, esr: 0 },
      hematology: { leukocytes: 0, hemoglobin: 0, platelets: 0, neutrophils: 0, lymphocytes: 0 },
      metabolic: { glucose: 0, creatinine: 0, urea: 0, sodium: 0, potassium: 0 },
      liver: { asat: 0, alat: 0, bilirubin: 0 },
      coagulation: { dDimer: 0, inr: 0 },
    });
    setImaging({
      findings: [],
      hasNoFindings: false,
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">New Consultation</h1>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of 5 · Complete the form for AI analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Language</Label>
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
              New Case
            </Button>
          </div>
        )}
      </div>
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
            <AIResultsStep analysis={aiAnalysis} rawJson={rawOllama} />
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
            Back
          </Button>
          <Button onClick={handleNext} className="gap-2">
            Next
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
        <h3 className="text-lg font-semibold mb-1">Patient Information</h3>
        <p className="text-sm text-muted-foreground">Enter basic patient demographics and history</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age (years)</Label>
          <Input
            id="age"
            type="number"
            value={data.age}
            onChange={(e) => onChange({ ...data, age: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label>Gender</Label>
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
                {gender}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={data.weight}
            onChange={(e) => onChange({ ...data, weight: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            value={data.height}
            onChange={(e) => onChange({ ...data, height: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Medical History</Label>
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
        <Label>Allergies</Label>
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
        <Label htmlFor="medications">Current Medications</Label>
        <Input
          id="medications"
          placeholder="Enter medications separated by commas"
          value={data.currentMedications.join(', ')}
          onChange={(e) => onChange({ ...data, currentMedications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        />
        <p className="text-xs text-muted-foreground">Separate multiple medications with commas</p>
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
        <h3 className="text-lg font-semibold mb-1">Presenting Symptoms</h3>
        <p className="text-sm text-muted-foreground">Document patient complaints and vital signs</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fever">Fever (°C)</Label>
          <Input
            id="fever"
            type="number"
            step="0.1"
            placeholder="e.g., 38.5"
            value={data.fever || ''}
            onChange={(e) => onChange({ ...data, fever: parseFloat(e.target.value) || undefined })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Common Symptoms</Label>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { key: 'cough', label: 'Cough' },
            { key: 'dyspnea', label: 'Dyspnea (Shortness of breath)' },
            { key: 'chestPain', label: 'Chest Pain' },
            { key: 'fatigue', label: 'Fatigue' },
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
        <Label>Custom Symptoms</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a symptom..."
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
        <Label htmlFor="notes">Additional Notes</Label>
        <textarea
          id="notes"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter any additional observations..."
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
            {check.status}
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
            {range ? `${range.min}-${range.max} ${range.unit}` : 'N/A'}
          </span>
        </div>
      </div>
    );
  };

  const categories = [
    { key: 'inflammatory', label: 'Inflammatory Markers', icon: Activity },
    { key: 'hematology', label: 'Hematology', icon: Activity },
    { key: 'metabolic', label: 'Metabolic Panel', icon: FlaskConical },
    { key: 'liver', label: 'Liver Function', icon: Activity },
    { key: 'coagulation', label: 'Coagulation', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Biological Analysis</h3>
        <p className="text-sm text-muted-foreground">Enter laboratory values with reference ranges</p>
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
              <h4 className="font-semibold mb-4">Biological Summary</h4>
              <div className="space-y-3">
                {categories.map((category) => {
                  const categoryRanges = labReferenceRanges.filter(r => 
                    r.category.toLowerCase() === category.label.split(' ')[0].toLowerCase()
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
                        {abnormalCount > 0 ? `${abnormalCount} abnormal` : 'Normal'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            <p>Reference ranges are based on standard clinical values.</p>
            <p>Always verify with your institution's specific ranges.</p>
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
  const findings = [
    { key: 'pulmonary_opacity', label: 'Pulmonary Opacity' },
    { key: 'infiltration', label: 'Infiltration' },
    { key: 'consolidation', label: 'Consolidation' },
    { key: 'pleural_effusion', label: 'Pleural Effusion' },
    { key: 'pneumothorax', label: 'Pneumothorax' },
    { key: 'cardiomegaly', label: 'Cardiomegaly' },
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
        <h3 className="text-lg font-semibold mb-1">Imaging Observations</h3>
        <p className="text-sm text-muted-foreground">Select findings from the latest imaging study</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Image Placeholder */}
        <div className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Scan className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-center mb-2">
            Upload imaging (DICOM / PNG / JPG)
          </p>
          <Button variant="outline" size="sm">
            Select File
          </Button>
        </div>

        {/* Findings Form */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Select Findings</Label>
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
            <span className="text-sm">No abnormal findings</span>
          </label>

          <div className="space-y-2">
            <Label htmlFor="imaging-notes">Additional Notes</Label>
            <textarea
              id="imaging-notes"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter any additional imaging observations..."
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
              {`Analyzing... ${progress}%`}
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Run AI Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Step 5: AI Results
function AIResultsStep({ analysis, rawJson }: { analysis: AIAnalysis, rawJson?: unknown }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">AI Analysis Result</h3>
          <p className="text-sm text-muted-foreground">
            Generated in {analysis.processingTime}s · Model: {analysis.modelVersion}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            Save to EHR
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Disease Probability Chart */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">Disease Probability</h4>
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
          <h4 className="font-semibold">Risk Alerts</h4>
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
              <h4 className="font-semibold mb-2">Therapeutic Direction</h4>
              <p className="text-sm text-muted-foreground">{analysis.therapeuticDirection}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cost Comparison */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-4">Cost Optimization Comparison</h4>
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
                  <div className="text-xs text-muted-foreground">{option.effectiveness}% effective</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Explanation */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">AI Clinical Explanation</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.explanation}</p>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Confidence Score</span>
              <div className="font-semibold">{analysis.confidenceScore}%</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Processing Time</span>
              <div className="font-semibold">{analysis.processingTime}s</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Raw Ollama Response */}
      {rawJson && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">Raw Ollama Response</h4>
            <pre className="text-xs overflow-auto p-3 rounded bg-muted/40 border">
{JSON.stringify(rawJson, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
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
