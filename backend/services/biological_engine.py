from backend.models.patient import BiologicalAnalysis

def analyze_biology(data: BiologicalAnalysis) -> dict:
    result = {}
    
    # Logic defined by user
    result["inflammation"] = data.crp > 10
    result["infection_possible"] = data.leukocytes > 10000
    result["renal_risk"] = data.creatinine > 1.3
    result["liver_stress"] = data.asat > 40 or data.alat > 40
    
    return result
