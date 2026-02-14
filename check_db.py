import sys
import os
import json

# Ensure the project root is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from backend.database.connection import SessionLocal
    from backend.models.db_models import ConsultationDB
except ImportError:
    # Fallback if running from within backend folder (unlikely but safe)
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from backend.database.connection import SessionLocal
    from backend.models.db_models import ConsultationDB

def check_consultations():
    print("Checking database for consultations...")
    db = SessionLocal()
    try:
        # Check if table exists
        # We can just query. If it fails, table might not exist.
        consultations = db.query(ConsultationDB).order_by(ConsultationDB.created_at.desc()).limit(5).all()
        
        if not consultations:
            print("No consultations found in the database.")
            return

        print(f"Found {len(consultations)} consultations.")
        for c in consultations:
            print(f"ID: {c.id}")
            print(f"Date: {c.created_at}")
            
            # Pretty print JSON data
            try:
                patient_str = json.dumps(c.patient_data)
                analysis_str = json.dumps(c.analysis_result)
            except:
                patient_str = str(c.patient_data)
                analysis_str = str(c.analysis_result)
            
            print(f"Patient: {patient_str[:100]}...")
            print(f"Analysis: {analysis_str[:100]}...")
            print("-" * 50)
            
    except Exception as e:
        print(f"Error checking database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_consultations()
