from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from uuid import uuid4
from hashlib import sha256
import os
from backend.database.connection import get_db
from backend.models.db_models import Doctor, Patient, ConsultationDB
from backend.storage.json_store import get_store, use_json_store
from pydantic import BaseModel

router = APIRouter()

DEMO_DOCTOR_IDS = {"default_doc", "2", "3"}


def hash_password(password: str) -> str:
    return sha256(password.encode("utf-8")).hexdigest()


@router.post("/doctors/register")
def register_doctor(
    email: str = Form(...),
    name: str = Form(...),
    password: str = Form(...),
    license_number: str = Form(...),
    national_id: str = Form(...),
    department: str = Form(""),
    db: Session = Depends(get_db)
):
    if use_json_store():
        store = get_store()
        if store.get_doctor_by_email(email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if store.get_doctor_by_license(license_number):
            raise HTTPException(status_code=400, detail="License number already registered")
        doc = store.add_doctor(email, name, hash_password(password), license_number, national_id, department)
        return {"id": doc["id"], "status": doc["status"]}
    if db.query(Doctor).filter(Doctor.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(Doctor).filter(Doctor.license_number == license_number).first():
        raise HTTPException(status_code=400, detail="License number already registered")
    doctor = Doctor(
        id=str(uuid4()),
        email=email,
        name=name,
        password_hash=hash_password(password),
        license_number=license_number,
        national_id=national_id,
        department=department,
        status="pending"
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return {"id": doctor.id, "status": doctor.status}


@router.post("/doctors/{doctor_id}/approve")
def approve_doctor(doctor_id: str, db: Session = Depends(get_db), x_admin_key: str = Header(None)):
    admin_key = os.getenv("ADMIN_KEY", "changeme")
    if x_admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Not authorized")
    if use_json_store():
        store = get_store()
        doc = store.approve_doctor(doctor_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return {"id": doc["id"], "status": doc["status"]}
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.status = "approved"
    db.add(doctor)
    db.commit()
    return {"id": doctor.id, "status": doctor.status}


@router.post("/doctors/{doctor_id}/stamp")
def upload_stamp(doctor_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save file
    os.makedirs("uploads/stamps", exist_ok=True)
    out_path = os.path.join("uploads", "stamps", f"{doctor_id}_{file.filename}")
    with open(out_path, "wb") as f:
        f.write(file.file.read())
    if use_json_store():
        store = get_store()
        doc = store.set_stamp(doctor_id, out_path)
        if not doc:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return {"stamp_path": out_path}
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.stamp_path = out_path
    db.add(doctor)
    db.commit()
    return {"stamp_path": out_path}


@router.get("/doctors/{doctor_id}/dashboard")
def doctor_dashboard(doctor_id: str, db: Session = Depends(get_db)):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        pats = store.list_patients(doctor_id)
        cons = []
        rows = store._load("consultations")
        for r in rows:
            if r.get("doctor_id") == doctor_id:
                cons.append(r)
        cons = sorted(cons, key=lambda x: x.get("created_at") or "", reverse=True)[:10]
        patients_by_id = {}
        try:
            for p in pats:
                if p and p.get("id") is not None:
                    patients_by_id[int(p.get("id"))] = p
        except Exception:
            patients_by_id = {}

        def _name_for_pid(pid):
            try:
                if pid is None:
                    return ""
                p = patients_by_id.get(int(pid))
                if not p:
                    return ""
                return f"{p.get('first_name','')} {p.get('last_name','')}".strip()
            except Exception:
                return ""
        return {
            "patients_count": len(pats),
            "recent_consultations": [
                {
                    "id": c.get("id"),
                    "created_at": c.get("created_at"),
                    "patient_id": (c.get("patient_data") or {}).get("patient_id"),
                    "patient_name": _name_for_pid((c.get("patient_data") or {}).get("patient_id")),
                    "biological_flags": (c.get("analysis_result") or {}).get("biological_flags"),
                    "ai_analysis": (c.get("analysis_result") or {}).get("ai_analysis"),
                } for c in cons
            ]
        }
    consultations = db.query(ConsultationDB).filter(ConsultationDB.doctor_id == doctor_id).order_by(ConsultationDB.created_at.desc()).limit(10).all()
    patients_count = db.query(Patient).filter(Patient.doctor_id == doctor_id).count()
    patient_ids = []
    for c in consultations:
        try:
            pid = (c.patient_data or {}).get("patient_id")
            if pid is not None:
                patient_ids.append(int(pid))
        except Exception:
            pass
    patients_map = {}
    if patient_ids:
        for p in db.query(Patient).filter(Patient.id.in_(patient_ids)).all():
            patients_map[int(p.id)] = p

    def _name_for_pid_db(pid):
        try:
            if pid is None:
                return ""
            p = patients_map.get(int(pid))
            if not p:
                return ""
            return f"{getattr(p,'first_name','')} {getattr(p,'last_name','')}".strip()
        except Exception:
            return ""
    return {
        "patients_count": patients_count,
        "recent_consultations": [
            {
                "id": c.id,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "patient_id": (c.patient_data or {}).get("patient_id") if isinstance(c.patient_data, dict) else None,
                "patient_name": _name_for_pid_db((c.patient_data or {}).get("patient_id") if isinstance(c.patient_data, dict) else None),
                "biological_flags": (c.analysis_result or {}).get("biological_flags"),
                "ai_analysis": (c.analysis_result or {}).get("ai_analysis"),
            } for c in consultations
        ]
    }


@router.post("/patients")
def create_patient(
    doctor_id: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    date_of_birth: str = Form(""),
    gender: str = Form(""),
    db: Session = Depends(get_db)
):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        d = store.get_doctor(doctor_id)
        if not d:
            if doctor_id not in DEMO_DOCTOR_IDS:
                raise HTTPException(status_code=400, detail="Doctor not approved or not found")
        else:
            if d.get("status") != "approved":
                raise HTTPException(status_code=400, detail="Doctor not approved or not found")
        p = store.create_patient(doctor_id, first_name, last_name, date_of_birth, gender)
        return {
            "id": p.get("id"),
            "first_name": p.get("first_name"),
            "last_name": p.get("last_name"),
            "date_of_birth": p.get("date_of_birth"),
            "gender": p.get("gender"),
        }
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.status == "approved").first()
    if not doctor:
        raise HTTPException(status_code=400, detail="Doctor not approved or not found")
    p = Patient(
        doctor_id=doctor_id,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
        gender=gender,
        medical_history=[],
        allergies=[]
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "first_name": p.first_name,
        "last_name": p.last_name,
        "date_of_birth": p.date_of_birth,
        "gender": p.gender,
    }


@router.get("/patients")
def list_patients(doctor_id: str, db: Session = Depends(get_db)):
    if use_json_store():
        store = get_store()
        rows = store.list_patients(doctor_id)
        rows = sorted(rows, key=lambda r: r.get("id", 0), reverse=True)
        return [
            {
                "id": r.get("id"),
                "first_name": r.get("first_name"),
                "last_name": r.get("last_name"),
                "date_of_birth": r.get("date_of_birth"),
                "gender": r.get("gender")
            } for r in rows
        ]
    rows = db.query(Patient).filter(Patient.doctor_id == doctor_id).order_by(Patient.id.desc()).all()
    return [
        {
            "id": r.id,
            "first_name": r.first_name,
            "last_name": r.last_name,
            "date_of_birth": r.date_of_birth,
            "gender": r.gender
        } for r in rows
    ]


@router.get("/patients/{patient_id}")
def get_patient_detail(patient_id: int, doctor_id: str, db: Session = Depends(get_db)):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        pat = store.get_patient(patient_id)
        if not pat:
            raise HTTPException(status_code=404, detail="Patient not found")
        if pat.get("doctor_id") != doctor_id:
            raise HTTPException(status_code=403, detail="Patient does not belong to this doctor")
        return {
            "id": pat.get("id"),
            "first_name": pat.get("first_name"),
            "last_name": pat.get("last_name"),
            "date_of_birth": pat.get("date_of_birth"),
            "gender": pat.get("gender"),
            "weight_kg": pat.get("weight_kg"),
            "height_cm": pat.get("height_cm"),
            "medical_history": pat.get("medical_history") or [],
            "allergies": pat.get("allergies") or [],
            "current_medications": pat.get("current_medications") or []
        }
    # Fallback minimal detail for SQL mode
    p = db.query(Patient).filter(Patient.id == patient_id, Patient.doctor_id == doctor_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {
        "id": p.id,
        "first_name": getattr(p, "first_name", ""),
        "last_name": getattr(p, "last_name", ""),
        "date_of_birth": getattr(p, "date_of_birth", ""),
        "gender": getattr(p, "gender", ""),
        "weight_kg": None,
        "height_cm": None,
        "medical_history": getattr(p, "medical_history", []) if hasattr(p, "medical_history") else [],
        "allergies": getattr(p, "allergies", []) if hasattr(p, "allergies") else [],
        "current_medications": getattr(p, "current_medications", []) if hasattr(p, "current_medications") else []
    }


class PatientUpdatePayload(BaseModel):
    weight_kg: float | None = None
    height_cm: float | None = None


@router.patch("/patients/{patient_id}")
def update_patient(patient_id: int, doctor_id: str, payload: PatientUpdatePayload, db: Session = Depends(get_db)):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        updates = {}
        if payload.weight_kg is not None:
            updates["weight_kg"] = float(payload.weight_kg)
        if payload.height_cm is not None:
            updates["height_cm"] = float(payload.height_cm)
        pat = store.update_patient(doctor_id, patient_id, updates)
        if not pat:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {
            "id": pat.get("id"),
            "first_name": pat.get("first_name"),
            "last_name": pat.get("last_name"),
            "date_of_birth": pat.get("date_of_birth"),
            "gender": pat.get("gender"),
            "weight_kg": pat.get("weight_kg"),
            "height_cm": pat.get("height_cm"),
        }
    raise HTTPException(status_code=501, detail="Not supported in SQL mode")
