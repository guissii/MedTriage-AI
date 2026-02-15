import type { PatientInfo, Symptoms, LabResults, ImagingObservations } from '@/types';

const API_BASE_URL = 'http://localhost:8000/api';
export const FILES_BASE_URL = 'http://localhost:8000/files';

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
  language?: string;
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
    extras?: any;
  };
  ai_raw?: any;
}

export const consultationApi = {
  analyze: async (
    patientInfo: PatientInfo,
    symptoms: Symptoms,
    labResults: LabResults,
    imaging: ImagingObservations,
    language: string,
    doctorId?: string,
    patientId?: string | number
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
      language,
    };

    const response = await fetch(`${API_BASE_URL}/consultation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Doctor-Id': doctorId ?? 'default_doc',
        ...(patientId ? { 'X-Patient-Id': String(patientId) } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = '';
      try {
        const j = await response.json();
        const d = j?.detail;
        detail = typeof d === 'string' ? d : d != null ? JSON.stringify(d) : '';
      } catch {}
      const msg = detail
        ? `Consultation failed: ${detail}`
        : `Consultation failed: ${response.status} ${response.statusText}`;
      throw new Error(msg);
    }

    return await response.json();
  },
};

export const chatApi = {
  ask: async (payload: { question: string; context?: string; language?: string; doctor_id?: string; patient_id?: number }) => {
    const res = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Chat failed');
    return res.json() as Promise<{ text: string; model?: string }>;
  },
  history: async (doctorId: string, patientId: number) => {
    const url = new URL(`${API_BASE_URL}/chat/history`);
    url.searchParams.set('doctor_id', doctorId);
    url.searchParams.set('patient_id', String(patientId));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('History fetch failed');
    return res.json() as Promise<Array<{ role: string; content: string; ts: string }>>;
  }
};

export const doctorApi = {
  register: async (data: {
    email: string;
    name: string;
    password: string;
    license_number: string;
    national_id: string;
    department?: string;
  }) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, String(v)));
    const res = await fetch(`${API_BASE_URL}/doctors/register`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },
  approve: async (doctorId: string, adminKey: string) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/approve`, {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey },
    });
    if (!res.ok) throw new Error('Approval failed');
    return res.json();
  },
  uploadStamp: async (doctorId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/stamp`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  listPatients: async (doctorId: string) => {
    const res = await fetch(`${API_BASE_URL}/patients?doctor_id=${encodeURIComponent(doctorId)}`);
    if (!res.ok) throw new Error('List patients failed');
    return res.json();
  },
  getPatient: async (doctorId: string, patientId: number) => {
    const res = await fetch(`${API_BASE_URL}/patients/${patientId}?doctor_id=${encodeURIComponent(doctorId)}`);
    if (!res.ok) throw new Error('Get patient failed');
    return res.json() as Promise<{
      id: number;
      first_name: string;
      last_name: string;
      date_of_birth: string;
      gender: string;
      weight_kg?: number | null;
      height_cm?: number | null;
      medical_history: string[];
      allergies: string[];
      current_medications: string[];
    }>;
  },
  updatePatient: async (
    doctorId: string,
    patientId: number,
    data: { weight_kg?: number | null; height_cm?: number | null }
  ) => {
    const res = await fetch(`${API_BASE_URL}/patients/${patientId}?doctor_id=${encodeURIComponent(doctorId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = j?.detail ? String(j.detail) : '';
      } catch {}
      throw new Error(detail ? `Update patient failed: ${detail}` : 'Update patient failed');
    }
    return res.json() as Promise<{
      id: number;
      first_name: string;
      last_name: string;
      date_of_birth: string;
      gender: string;
      weight_kg?: number | null;
      height_cm?: number | null;
    }>;
  },
  createPatient: async (data: {
    doctor_id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    gender?: string;
  }) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && form.append(k, String(v)));
    const res = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = j?.detail ? String(j.detail) : '';
      } catch {}
      throw new Error(detail ? `Create patient failed: ${detail}` : 'Create patient failed');
    }
    return res.json() as Promise<{
      id: number;
      first_name: string;
      last_name: string;
      date_of_birth: string;
      gender: string;
    }>;
  },
  uploadScan: async (data: {
    doctor_id: string;
    patient_id: number;
    scan_type?: string;
    notes?: string;
    file: File;
  }) => {
    const form = new FormData();
    form.append('doctor_id', data.doctor_id);
    form.append('patient_id', String(data.patient_id));
    if (data.scan_type) form.append('scan_type', data.scan_type);
    if (data.notes) form.append('notes', data.notes);
    form.append('file', data.file);
    const res = await fetch(`${API_BASE_URL}/scans/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Upload scan failed');
    return res.json();
  },
  createPrescription: async (data: {
    doctor_id: string;
    patient_id: number;
    items: Array<{ name: string; dosage: string; frequency: string; duration?: string; notes?: string }>;
    notes?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Create prescription failed');
    return res.json();
  },
  openPrescriptionPdf: (rxId: number) => {
    window.open(`${API_BASE_URL}/prescriptions/${rxId}/pdf`, '_blank');
  },
  dashboard: async (doctorId: string) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/dashboard`);
    if (!res.ok) throw new Error('Dashboard fetch failed');
    return res.json();
  },
  timeline: async (doctorId: string, patientId: number) => {
    const url = new URL(`${API_BASE_URL}/timeline`);
    url.searchParams.set('doctor_id', doctorId);
    url.searchParams.set('patient_id', String(patientId));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Timeline fetch failed');
    return res.json() as Promise<Array<
      | { type: 'analysis'; id: number; ts: string; orientation?: string; risks?: any; flags?: any; clinical_reasoning?: string; disclaimer?: string; extras?: any }
      | { type: 'chat'; role: string; content: string; ts: string }
      | { type: 'scan'; id: number; ts: string; scan_type?: string; file_path?: string; notes?: string }
      | { type: 'prescription'; id: number; ts: string; items?: any[]; notes?: string }
    >>;
  },
};
