import os
import json
import threading
import tempfile
import uuid
from datetime import datetime

USE_JSON = os.getenv("PERSISTENCE_MODE", "json").lower() == "json"


class JsonStore:
    def __init__(self, base_dir: str = "data"):
        self.base_dir = base_dir
        self.lock = threading.Lock()
        os.makedirs(self.base_dir, exist_ok=True)

    def _path(self, name: str) -> str:
        return os.path.join(self.base_dir, f"{name}.json")

    def _load(self, name: str):
        p = self._path(name)
        if not os.path.exists(p):
            raise FileNotFoundError(f"JSON DB missing: {p}. Initialize the database first.")
        try:
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save(self, name: str, data):
        p = self._path(name)
        d = os.path.dirname(p)
        os.makedirs(d, exist_ok=True)
        fd, tmp = tempfile.mkstemp(prefix=f"{name}.", suffix=".tmp", dir=d)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            os.replace(tmp, p)
        finally:
            try:
                if os.path.exists(tmp):
                    os.remove(tmp)
            except Exception:
                pass

    def _next_id(self, name: str) -> int:
        data = self._load(name)
        mids = [int(x.get("id", 0)) for x in data if isinstance(x.get("id", 0), int)]
        return (max(mids) + 1) if mids else 1

    def get_doctor_by_email(self, email: str):
        rows = self._load("doctors")
        for r in rows:
            if r.get("email") == email:
                return r
        return None

    def get_doctor_by_license(self, license_number: str):
        rows = self._load("doctors")
        for r in rows:
            if r.get("license_number") == license_number:
                return r
        return None

    def get_doctor(self, doctor_id: str):
        rows = self._load("doctors")
        for r in rows:
            if r.get("id") == doctor_id:
                return r
        return None

    def add_doctor(self, email: str, name: str, password_hash: str, license_number: str, national_id: str, department: str):
        rows = self._load("doctors")
        doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": name,
            "password_hash": password_hash,
            "license_number": license_number,
            "national_id": national_id,
            "department": department,
            "status": "pending",
            "stamp_path": "",
            "created_at": datetime.utcnow().isoformat()
        }
        rows.append(doc)
        self._save("doctors", rows)
        return doc

    def approve_doctor(self, doctor_id: str):
        rows = self._load("doctors")
        for r in rows:
            if r.get("id") == doctor_id:
                r["status"] = "approved"
                self._save("doctors", rows)
                return r
        return None

    def set_stamp(self, doctor_id: str, stamp_path: str):
        rows = self._load("doctors")
        for r in rows:
            if r.get("id") == doctor_id:
                r["stamp_path"] = stamp_path
                self._save("doctors", rows)
                return r
        return None

    def create_patient(self, doctor_id: str, first_name: str, last_name: str, date_of_birth: str, gender: str):
        rows = self._load("patients")
        pid = self._next_id("patients")
        p = {
            "id": pid,
            "doctor_id": doctor_id,
            "first_name": first_name,
            "last_name": last_name,
            "date_of_birth": date_of_birth or "",
            "gender": gender or "",
            "weight_kg": None,
            "height_cm": None,
            "medical_history": [],
            "allergies": [],
            "current_medications": [],
            "created_at": datetime.utcnow().isoformat()
        }
        rows.append(p)
        self._save("patients", rows)
        return p

    def update_patient(self, doctor_id: str, patient_id: int, updates: dict):
        rows = self._load("patients")
        for r in rows:
            if int(r.get("id", 0)) == int(patient_id):
                if r.get("doctor_id") != doctor_id:
                    return None
                for k, v in (updates or {}).items():
                    r[k] = v
                self._save("patients", rows)
                return r
        return None

    def list_patients(self, doctor_id: str):
        rows = self._load("patients")
        return [r for r in rows if r.get("doctor_id") == doctor_id]

    def get_patient(self, patient_id: int):
        rows = self._load("patients")
        for r in rows:
            if int(r.get("id", 0)) == int(patient_id):
                return r
        return None

    def create_consultation(self, doctor_id: str, patient_data, analysis_result):
        rows = self._load("consultations")
        cid = self._next_id("consultations")
        c = {
            "id": cid,
            "doctor_id": doctor_id,
            "patient_data": patient_data,
            "analysis_result": analysis_result,
            "created_at": datetime.utcnow().isoformat()
        }
        rows.append(c)
        self._save("consultations", rows)
        return c

    def create_scan(self, doctor_id: str, patient_id: int, scan_type: str, file_path: str, notes: str):
        rows = self._load("scans")
        sid = self._next_id("scans")
        s = {
            "id": sid,
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "scan_type": scan_type,
            "file_path": file_path,
            "notes": notes or "",
            "created_at": datetime.utcnow().isoformat()
        }
        rows.append(s)
        self._save("scans", rows)
        return s

    def create_prescription(self, doctor_id: str, patient_id: int, items, notes: str):
        rows = self._load("prescriptions")
        rid = self._next_id("prescriptions")
        r = {
            "id": rid,
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "items": items,
            "notes": notes or "",
            "created_at": datetime.utcnow().isoformat()
        }
        rows.append(r)
        self._save("prescriptions", rows)
        return r

    def get_prescription(self, rx_id: int):
        rows = self._load("prescriptions")
        for r in rows:
            if int(r.get("id", 0)) == int(rx_id):
                return r
        return None

    # Chat history per doctor-patient
    def get_chat_history(self, doctor_id: str, patient_id: int):
        rows = self._load("chats")
        for r in rows:
            if r.get("doctor_id") == doctor_id and int(r.get("patient_id", 0)) == int(patient_id):
                return r.get("messages", [])
        return []

    def append_chat_message(self, doctor_id: str, patient_id: int, role: str, content: str):
        rows = self._load("chats")
        # find existing thread
        thread = None
        for r in rows:
            if r.get("doctor_id") == doctor_id and int(r.get("patient_id", 0)) == int(patient_id):
                thread = r
                break
        if thread is None:
            thread = {
                "doctor_id": doctor_id,
                "patient_id": patient_id,
                "messages": [],
                "created_at": datetime.utcnow().isoformat()
            }
            rows.append(thread)
        thread["messages"].append({
            "role": role,
            "content": content,
            "ts": datetime.utcnow().isoformat()
        })
        self._save("chats", rows)
        return thread

    # Manual initialization helpers
    def required_collections(self):
        return ["doctors", "patients", "consultations", "prescriptions", "scans", "chats"]

    def get_missing(self):
        missing = []
        for name in self.required_collections():
            if not os.path.exists(self._path(name)):
                missing.append(name)
        return missing

    def is_initialized(self) -> bool:
        return len(self.get_missing()) == 0

    def init_database(self):
        for name in self.required_collections():
            self._save(name, [])
        return True


_store_singleton = None


def get_store():
    global _store_singleton
    if _store_singleton is None:
        _store_singleton = JsonStore()
    return _store_singleton


def use_json_store() -> bool:
    return USE_JSON
