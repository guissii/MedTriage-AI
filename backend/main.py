from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.connection import engine, Base
from backend.routers import consultation

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

# Include Routers
app.include_router(consultation.router, prefix="/api", tags=["Consultation"])

@app.get("/")
def read_root():
    return {"status": "Healthcare Backend Running", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
