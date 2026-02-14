import requests
import json
from backend.models.consultation import ConsultationRequest

OLLAMA_URL = "http://localhost:11434/api/generate"

def generate_prompt(data: ConsultationRequest, bio_flags: dict) -> str:
    prompt = f"""You are a clinical decision support assistant.
    
Patient data:
Age: {data.patient.age}
Gender: {data.patient.gender}
Allergies: {", ".join(data.patient.allergies)}
Medical history: {", ".join(data.patient.medical_history)}

Symptoms:
Fever: {data.symptoms.fever}
Cough: {data.symptoms.cough}
Dyspnea: {data.symptoms.dyspnea}

Biological interpretation:
Inflammation: {bio_flags['inflammation']}
Infection possible: {bio_flags['infection_possible']}
Renal risk: {bio_flags['renal_risk']}
Liver stress: {bio_flags['liver_stress']}

Imaging:
Pulmonary opacity: {data.imaging.pulmonary_opacity}

Provide a JSON response with the following keys:
1. "clinical_reasoning"
2. "risk_alerts"
3. "therapeutic_orientation" (no final diagnosis)
4. "disclaimer"

Ensure the output is valid JSON. Do not include markdown formatting (like ```json).
"""
    return prompt

def call_ollama(data: ConsultationRequest, bio_flags: dict) -> dict:
    prompt = generate_prompt(data, bio_flags)
    
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False,
                "format": "json"  # Enforce JSON mode if supported by Ollama/model
            },
            timeout=120 # Add timeout to prevent hanging
        )
        response.raise_for_status()
        result = response.json()
        
        # Parse the 'response' field which contains the generated text
        generated_text = result.get("response", "{}")
        
        try:
            parsed_json = json.loads(generated_text)
            return parsed_json
        except json.JSONDecodeError:
            # Fallback if valid JSON isn't returned
            return {
                "clinical_reasoning": generated_text,
                "risk_alerts": "Could not parse specific risks.",
                "therapeutic_orientation": "Consult raw reasoning.",
                "disclaimer": "AI assistant only. Output parsing failed."
            }
            
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return {
            "clinical_reasoning": "Error connecting to AI service.",
            "risk_alerts": "System error.",
            "therapeutic_orientation": "N/A",
            "disclaimer": "System error."
        }
