import type { LabReferenceRange } from '@/types';

export const labReferenceRanges: LabReferenceRange[] = [
  // Inflammatory Markers
  { name: 'CRP', unit: 'mg/L', min: 0, max: 10, category: 'Inflammatory' },
  { name: 'ESR', unit: 'mm/hr', min: 0, max: 20, category: 'Inflammatory' },
  
  // Hematology
  { name: 'Leukocytes', unit: '10³/μL', min: 4.5, max: 11.0, category: 'Hematology' },
  { name: 'Hemoglobin', unit: 'g/dL', min: 12.0, max: 16.0, category: 'Hematology' },
  { name: 'Platelets', unit: '10³/μL', min: 150, max: 400, category: 'Hematology' },
  { name: 'Neutrophils', unit: '%', min: 40, max: 70, category: 'Hematology' },
  { name: 'Lymphocytes', unit: '%', min: 20, max: 40, category: 'Hematology' },
  
  // Metabolic Panel
  { name: 'Glucose', unit: 'mg/dL', min: 70, max: 100, category: 'Metabolic' },
  { name: 'Creatinine', unit: 'mg/dL', min: 0.7, max: 1.3, category: 'Metabolic' },
  { name: 'Urea', unit: 'mg/dL', min: 7, max: 20, category: 'Metabolic' },
  { name: 'Sodium', unit: 'mEq/L', min: 135, max: 145, category: 'Metabolic' },
  { name: 'Potassium', unit: 'mEq/L', min: 3.5, max: 5.0, category: 'Metabolic' },
  
  // Liver Function
  { name: 'ASAT', unit: 'U/L', min: 10, max: 40, category: 'Liver' },
  { name: 'ALAT', unit: 'U/L', min: 7, max: 56, category: 'Liver' },
  { name: 'Bilirubin', unit: 'mg/dL', min: 0.1, max: 1.2, category: 'Liver' },
  
  // Coagulation
  { name: 'D-dimer', unit: 'ng/mL', min: 0, max: 500, category: 'Coagulation' },
  { name: 'INR', unit: '', min: 0.8, max: 1.2, category: 'Coagulation' },
];

export function getReferenceRange(name: string): LabReferenceRange | undefined {
  return labReferenceRanges.find(r => r.name === name);
}

export function getReferenceRangeForCategory(category: string): LabReferenceRange[] {
  return labReferenceRanges.filter(r => r.category === category);
}

export function checkLabValue(name: string, value: number): { 
  status: 'normal' | 'warning' | 'danger';
  range: LabReferenceRange | undefined;
  message: string;
} {
  const range = getReferenceRange(name);
  
  if (!range) {
    return { status: 'normal', range: undefined, message: 'No reference range available' };
  }
  
  const rangeSpan = range.max - range.min;
  const warningBuffer = rangeSpan * 0.15;
  
  if (value >= range.min && value <= range.max) {
    return { 
      status: 'normal', 
      range, 
      message: `Within normal range (${range.min}-${range.max} ${range.unit})` 
    };
  }
  
  if (value >= range.min - warningBuffer && value <= range.max + warningBuffer) {
    return { 
      status: 'warning', 
      range, 
      message: `Borderline value (${range.min}-${range.max} ${range.unit})` 
    };
  }
  
  return { 
    status: 'danger', 
    range, 
    message: `Abnormal value (${range.min}-${range.max} ${range.unit})` 
  };
}

export const labTooltips: Record<string, string> = {
  CRP: 'C-Reactive Protein - A marker of inflammation in the body',
  ESR: 'Erythrocyte Sedimentation Rate - Measures inflammation',
  Leukocytes: 'White blood cells - Part of the immune system',
  Hemoglobin: 'Protein in red blood cells that carries oxygen',
  Platelets: 'Cell fragments that help with blood clotting',
  Neutrophils: 'Type of white blood cell that fights infection',
  Lymphocytes: 'Type of white blood cell involved in immune response',
  Glucose: 'Blood sugar level',
  Creatinine: 'Waste product from muscle metabolism',
  Urea: 'Waste product from protein metabolism',
  Sodium: 'Electrolyte important for fluid balance',
  Potassium: 'Electrolyte important for heart and muscle function',
  ASAT: 'Aspartate Aminotransferase - Liver enzyme',
  ALAT: 'Alanine Aminotransferase - Liver enzyme',
  Bilirubin: 'Yellow pigment from red blood cell breakdown',
  'D-dimer': 'Fragment from blood clot breakdown',
  INR: 'International Normalized Ratio - Blood clotting time',
};
