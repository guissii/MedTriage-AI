from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.models.db_models import Prescription, Doctor, Patient
from datetime import datetime
from typing import List, TypedDict
from pydantic import BaseModel
import os
from backend.storage.json_store import get_store, use_json_store

router = APIRouter()

DEMO_DOCTOR_IDS = {"default_doc", "2", "3"}


class RxItem(TypedDict):
    name: str
    dosage: str
    frequency: str
    duration: str
    notes: str


class PrescriptionCreate(BaseModel):
    doctor_id: str
    patient_id: int
    items: List[RxItem]
    notes: str = ""


@router.post("/prescriptions")
def create_prescription(payload: PrescriptionCreate, db: Session = Depends(get_db)):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        doc = store.get_doctor(payload.doctor_id)
        if not doc:
            if payload.doctor_id not in DEMO_DOCTOR_IDS:
                raise HTTPException(status_code=400, detail="Doctor not approved or not found")
        else:
            if doc.get("status") != "approved":
                raise HTTPException(status_code=400, detail="Doctor not approved or not found")
        pat = store.get_patient(payload.patient_id)
        if not pat or pat.get("doctor_id") != payload.doctor_id:
            raise HTTPException(status_code=400, detail="Patient not found for this doctor")
        rec = store.create_prescription(payload.doctor_id, payload.patient_id, payload.items, payload.notes)
        try:
            # Append an event in chat/timeline
            item_names = ", ".join([i.get("name", "") for i in (payload.items or []) if i.get("name")])
            store.append_chat_message(payload.doctor_id, payload.patient_id, "event", f"Prescription créée — ID {rec['id']} — {item_names}")
        except Exception:
            pass
        return {"id": rec["id"]}
    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id, Doctor.status == "approved").first()
    if not doctor:
        raise HTTPException(status_code=400, detail="Doctor not approved or not found")
    patient = db.query(Patient).filter(Patient.id == payload.patient_id, Patient.doctor_id == payload.doctor_id).first()
    if not patient:
        raise HTTPException(status_code=400, detail="Patient not found for this doctor")
    rx = Prescription(doctor_id=payload.doctor_id, patient_id=payload.patient_id, items=payload.items, notes=payload.notes)
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return {"id": rx.id}


@router.get("/prescriptions/{rx_id}/pdf")
def export_prescription_pdf(rx_id: int, db: Session = Depends(get_db)):
    if use_json_store():
        store = get_store()
        rx = store.get_prescription(rx_id)
        if not rx:
            raise HTTPException(status_code=404, detail="Prescription not found")
        doc = store.get_doctor(rx["doctor_id"])
        pat = store.get_patient(rx["patient_id"])
        doctor_name = doc.get("name") if doc else "N/A"
        doctor_license = doc.get("license_number") if doc else "N/A"
        department = doc.get("department") if doc else ""
        dob = pat.get("date_of_birth") if pat else ""
        patient_label = f"{pat.get('first_name','')} {pat.get('last_name','')}  |  ID: {pat.get('id')}" if pat else f"ID: {rx.get('patient_id')}"
        if dob:
            patient_label = f"{patient_label}  |  Naissance: {dob}"
        items = rx.get("items") or []
        notes = rx.get("notes") or ""
        stamp_path = (doc.get("stamp_path") if doc else "") or ""
    else:
        rx = db.query(Prescription).filter(Prescription.id == rx_id).first()
        if not rx:
            raise HTTPException(status_code=404, detail="Prescription not found")
        doctor = db.query(Doctor).filter(Doctor.id == rx.doctor_id).first()
        patient = db.query(Patient).filter(Patient.id == rx.patient_id).first()
        doctor_name = doctor.name
        doctor_license = doctor.license_number
        department = doctor.department or ""
        patient_label = f"{patient.first_name} {patient.last_name}  |  ID: {patient.id}"
        if getattr(patient, "date_of_birth", None):
            patient_label = f"{patient_label}  |  Naissance: {patient.date_of_birth}"
        items = rx.items
        notes = rx.notes or ""
        stamp_path = doctor.stamp_path or ""
    # Lazy import to avoid dependency unless used
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import mm
        from reportlab.lib import colors
        from reportlab.pdfbase import pdfmetrics
    except Exception:
        raise HTTPException(status_code=500, detail="reportlab not installed on server")
    from io import BytesIO
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    left = 20 * mm
    right = width - 20 * mm
    y = height - 24 * mm

    c.setFont("Helvetica-Bold", 15)
    c.drawString(left, y, "ORDONNANCE")
    c.setFont("Helvetica", 10)
    c.drawRightString(right, y, f"N° {rx_id}")
    y -= 9 * mm

    c.setStrokeColor(colors.lightgrey)
    c.setLineWidth(0.8)
    c.line(left, y, right, y)
    y -= 7 * mm

    c.setFont("Helvetica-Bold", 10)
    c.drawString(left, y, "Médecin")
    c.setFont("Helvetica", 10)
    c.drawString(left + 22 * mm, y, f"{doctor_name}  |  N° Ordre: {doctor_license}")
    y -= 6 * mm
    if department:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(left, y, "Service")
        c.setFont("Helvetica", 10)
        c.drawString(left + 22 * mm, y, department)
        y -= 6 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(left, y, "Patient")
    c.setFont("Helvetica", 10)
    c.drawString(left + 22 * mm, y, patient_label)
    y -= 10 * mm

    col_w = [60 * mm, 30 * mm, 30 * mm, 20 * mm, 30 * mm]
    cols_x = [left]
    for wcol in col_w[:-1]:
        cols_x.append(cols_x[-1] + wcol)
    table_w = sum(col_w)

    def wrap_text(text: str, max_w: float, font: str, size: int):
        if text is None:
            return [""]
        s = str(text).strip()
        if not s:
            return [""]
        words = s.split()
        lines = []
        line = ""
        for w in words:
            candidate = w if not line else f"{line} {w}"
            if pdfmetrics.stringWidth(candidate, font, size) <= max_w:
                line = candidate
            else:
                if line:
                    lines.append(line)
                    line = w
                else:
                    lines.append(candidate)
                    line = ""
        if line:
            lines.append(line)
        return lines or [""]

    def ensure_page_space(min_y: float):
        nonlocal y
        if y < min_y:
            c.showPage()
            y = height - 24 * mm

    ensure_page_space(60 * mm)
    header_h = 8 * mm
    c.setFillColor(colors.HexColor("#F3F4F6"))
    c.rect(left, y - header_h, table_w, header_h, fill=1, stroke=0)
    c.setFillColor(colors.black)
    c.setStrokeColor(colors.lightgrey)
    c.rect(left, y - header_h, table_w, header_h, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 9)
    headers = ["Médicament", "Posologie", "Fréquence", "Durée", "Notes"]
    for i, htxt in enumerate(headers):
        c.drawString(cols_x[i] + 2 * mm, y - 5.5 * mm, htxt)
    y -= header_h

    c.setFont("Helvetica", 9)
    for item in items:
        ensure_page_space(55 * mm)
        med = item.get("name", "")
        dose = item.get("dosage", "")
        freq = item.get("frequency", "")
        dur = item.get("duration", "")
        note = item.get("notes", "")
        cells = [
            wrap_text(med, col_w[0] - 4 * mm, "Helvetica", 9),
            wrap_text(dose, col_w[1] - 4 * mm, "Helvetica", 9),
            wrap_text(freq, col_w[2] - 4 * mm, "Helvetica", 9),
            wrap_text(dur, col_w[3] - 4 * mm, "Helvetica", 9),
            wrap_text(note, col_w[4] - 4 * mm, "Helvetica", 9),
        ]
        max_lines = max(len(x) for x in cells)
        row_h = max(8 * mm, (max_lines * 4.5 * mm) + 3 * mm)
        c.setStrokeColor(colors.lightgrey)
        c.rect(left, y - row_h, table_w, row_h, fill=0, stroke=1)
        for i in range(1, len(col_w)):
            c.line(cols_x[i], y, cols_x[i], y - row_h)
        for i, lines in enumerate(cells):
            ty = y - 5 * mm
            for ln in lines:
                c.drawString(cols_x[i] + 2 * mm, ty, ln[:200])
                ty -= 4.5 * mm
        y -= row_h

    if notes:
        ensure_page_space(55 * mm)
        y -= 4 * mm
        c.setFont("Helvetica-Bold", 10)
        c.drawString(left, y, "Notes générales")
        y -= 6 * mm
        c.setFont("Helvetica", 9)
        for line in (notes or "").splitlines():
            ensure_page_space(55 * mm)
            c.drawString(left, y, line[:160])
            y -= 4.5 * mm

    ensure_page_space(45 * mm)
    y -= 6 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(left, y, "Signature et cachet")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    c.drawString(left, y, "Signature:")
    c.line(left + 20 * mm, y - 1.5 * mm, right - 80 * mm, y - 1.5 * mm)
    c.drawRightString(right, y, datetime.utcnow().strftime("Date: %Y-%m-%d"))

    if stamp_path and os.path.exists(stamp_path):
        try:
            c.drawImage(stamp_path, right - 40 * mm, 20 * mm, 30 * mm, 25 * mm, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass

    c.setFont("Helvetica", 9)
    c.drawRightString(right, 15 * mm, datetime.utcnow().strftime("Généré le %Y-%m-%d %H:%M UTC"))
    c.showPage()
    c.save()
    pdf = buffer.getvalue()
    buffer.close()
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f"inline; filename=prescription_{rx_id}.pdf"})
