from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.connection import engine, Base
from backend.routers import consultation
from backend.routers import doctor
from backend.routers import prescription
from backend.routers import admin
from backend.routers import scans
import time
from fastapi import Request
from starlette.staticfiles import StaticFiles

# Create Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Healthcare AI Backend", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for hackathon simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    try:
        print(f"{request.method} {request.url.path} -> {response.status_code} [{duration_ms:.1f} ms]")
    except Exception:
        pass
    return response

# Include Routers
app.include_router(consultation.router, prefix="/api", tags=["Consultation"])
app.include_router(doctor.router, prefix="/api", tags=["Doctor"])
app.include_router(prescription.router, prefix="/api", tags=["Prescription"])
app.include_router(scans.router, prefix="/api", tags=["Scans"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])

# Static files to serve uploaded scans/stamps
app.mount("/files", StaticFiles(directory="uploads"), name="files")

@app.get("/")
def read_root():
    return {"status": "Healthcare Backend Running (v2)", "docs": "/docs", "redoc": "/redoc"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
