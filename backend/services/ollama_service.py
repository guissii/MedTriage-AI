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
Respond in the following language: {data.language}.
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
                "format": "json"
            },
            timeout=120 # Add timeout to prevent hanging
        )
        response.raise_for_status()
        result = response.json()
        
        # Parse the 'response' field which contains the generated text
        generated_text = result.get("response", "{}")
        
        try:
            parsed_json = json.loads(generated_text)
            # Attach useful metadata for metrics/monitoring
            extras = {}
            if "model" in result:
                extras["model"] = result.get("model")
            if "total_duration" in result:
                # Convert ns to ms
                extras["total_duration_ms"] = round(result.get("total_duration", 0) / 1_000_000, 2)
            if "load_duration" in result:
                extras["load_duration_ms"] = round(result.get("load_duration", 0) / 1_000_000, 2)
            if "eval_count" in result:
                extras["eval_count"] = result.get("eval_count")
            if "prompt_eval_count" in result:
                extras["prompt_eval_count"] = result.get("prompt_eval_count")
            # Merge extras alongside model output keys (router will place them under ai_analysis.extras)
            return {**parsed_json, **extras}
        except json.JSONDecodeError:
            # Fallback if valid JSON isn't returned
            fallback = {
                "clinical_reasoning": generated_text,
                "risk_alerts": "Could not parse specific risks.",
                "therapeutic_orientation": "Consult raw reasoning.",
                "disclaimer": "AI assistant only. Output parsing failed."
            }
            # Also expose raw metrics if available
            if "model" in result:
                fallback["model"] = result.get("model")
            if "total_duration" in result:
                fallback["total_duration_ms"] = round(result.get("total_duration", 0) / 1_000_000, 2)
            if "load_duration" in result:
                fallback["load_duration_ms"] = round(result.get("load_duration", 0) / 1_000_000, 2)
            if "eval_count" in result:
                fallback["eval_count"] = result.get("eval_count")
            if "prompt_eval_count" in result:
                fallback["prompt_eval_count"] = result.get("prompt_eval_count")
            return fallback
            
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return {
            "clinical_reasoning": "Error connecting to AI service.",
            "risk_alerts": "System error.",
            "therapeutic_orientation": "N/A",
            "disclaimer": "System error."
        }

def ask_chat(question: str, context: str = "", language: str = "fr") -> dict:
    system = (
        "You are a helpful medical assistant. Answer concisely, cite key risks when relevant, "
        "and never give a final diagnosis. If context is provided, use it."
    )
    prompt = f"""Context:
{context}

Question:
{question}

Answer in {language}. Keep it concise and structured."""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "mistral",
                "prompt": f"{system}\n\n{prompt}",
                "stream": False
            },
            timeout=120
        )
        response.raise_for_status()
        result = response.json()
        return {
            "text": result.get("response", ""),
            "model": result.get("model"),
            "prompt_eval_count": result.get("prompt_eval_count", 0),
            "eval_count": result.get("eval_count", 0)
        }
    except Exception as e:
        print(f"Ollama chat error: {e}")
        return {"text": "Erreur de communication avec le modèle local.", "model": "mistral"}
