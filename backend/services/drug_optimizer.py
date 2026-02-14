from typing import Any, Dict, List
from backend.models.consultation import ConsultationRequest

# Minimal local catalogue for Morocco (indicative values)
DRUG_DB_MA: List[Dict[str, Any]] = [
    {
        "generic": "Amoxicillin + Clavulanic Acid",
        "indications": ["respiratory infection", "CAP", "pneumonia"],
        "avoid_if": ["penicillin_allergy"],
        "options": [
            {"brand": "Augmentin (générique)", "dose": "1g x2/j 7j", "price_mad": 45, "is_recommended": True},
            {"brand": "Amoclav", "dose": "1g x2/j 7j", "price_mad": 60, "is_recommended": False},
        ],
    },
    {
        "generic": "Azithromycin",
        "indications": ["respiratory infection", "CAP", "bronchitis"],
        "avoid_if": [],
        "options": [
            {"brand": "Azithromycine (générique)", "dose": "500mg/j 3j", "price_mad": 35, "is_recommended": True},
        ],
    },
    {
        "generic": "Levofloxacin",
        "indications": ["respiratory infection", "complicated CAP"],
        "avoid_if": [],
        "options": [
            {"brand": "Levofloxacine (générique)", "dose": "500mg/j 7-10j", "price_mad": 85, "is_recommended": False},
        ],
    },
]


def _has_penicillin_allergy(req: ConsultationRequest) -> bool:
    return any(a.lower() in ["penicillin", "pénicilline", "amoxicillin", "amoxicilline"] for a in req.patient.allergies)


def suggest_ma_options(
    req: ConsultationRequest,
    bio_flags: Dict[str, Any],
    ai_results: Dict[str, Any],
) -> Dict[str, Any]:
    """Return Morocco-specific medication suggestions with cheaper alternatives."""
    suspicion_resp = bool(bio_flags.get("infection_possible")) or bool(ai_results)
    results: List[Dict[str, Any]] = []

    if not suspicion_resp:
        return {"medications_ma": [], "cost_comparisons": []}

    pen_allergy = _has_penicillin_allergy(req)

    for item in DRUG_DB_MA:
        if "respiratory infection" not in item.get("indications", []):
            continue
        if pen_allergy and "penicillin_allergy" in item.get("avoid_if", []):
            continue
        # Pick cheapest option and mark recommended if DB says so
        options = sorted(item["options"], key=lambda x: x["price_mad"])
        cheapest = options[0]
        for o in options:
            results.append(
                {
                    "option": f"{item['generic']} · {o['brand']}",
                    "description": o["dose"],
                    "estimatedCost": o["price_mad"],
                    "effectiveness": 70 if item["generic"] != "Levofloxacin" else 85,
                    "isRecommended": bool(o.get("is_recommended", False)),
                }
            )

    # sort by price ascending, recommended first
    results = sorted(results, key=lambda r: (not r["isRecommended"], r["estimatedCost"]))
    return {"medications_ma": results, "cost_comparisons": results}
