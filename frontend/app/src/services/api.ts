import type { PatientInfo, Symptoms, LabResults, ImagingObservations } from '@/types';

const API_BASE_URL = 'http://localhost:8000/api';

export interface BackendConsultationRequest {
  patient: {
    age: number;
    gender: string;
    weight: number;
    allergies: string[];
    medical_history: string[];
  };
  symptoms: {
    fever: number;
    cough: boolean;
    dyspnea: boolean;
  };
  biological_analysis: {
    crp: number;
    leukocytes: number;
    creatinine: number;
    asat: number;
    alat: number;
  };
  imaging: {
    pulmonary_opacity: boolean;
  };
}

export interface BackendConsultationResponse {
  biological_flags: {
    inflammation: boolean;
    infection_possible: boolean;
    renal_risk: boolean;
    liver_stress: boolean;
  };
  ai_analysis: {
    clinical_reasoning: string;
    risk_alerts: any;
    therapeutic_orientation: string;
    disclaimer: string;
  };
}

export const consultationApi = {
  analyze: async (
    patientInfo: PatientInfo,
    symptoms: Symptoms,
    labResults: LabResults,
    imaging: ImagingObservations
  ): Promise<BackendConsultationResponse> => {
    
    // Map frontend data to backend structure
    const payload: BackendConsultationRequest = {
      patient: {
        age: patientInfo.age,
        gender: patientInfo.gender,
        weight: patientInfo.weight,
        allergies: patientInfo.allergies,
        medical_history: patientInfo.medicalHistory,
      },
      symptoms: {
        fever: symptoms.fever || 37.0,
        cough: symptoms.cough,
        dyspnea: symptoms.dyspnea,
      },
      biological_analysis: {
        crp: labResults.inflammatory.crp,
        leukocytes: labResults.hematology.leukocytes,
        creatinine: labResults.metabolic.creatinine,
        asat: labResults.liver.asat,
        alat: labResults.liver.alat,
      },
      imaging: {
        // Simple logic to detect if "Pulmonary Opacity" is in the findings strings
        pulmonary_opacity: imaging.findings.some(f => 
          f.toLowerCase().includes('opacity') || 
          f.toLowerCase().includes('opacité') ||
          f.toLowerCase().includes('pneumonia')
        ),
      },
    };

    const response = await fetch(`${API_BASE_URL}/consultation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  },
};
