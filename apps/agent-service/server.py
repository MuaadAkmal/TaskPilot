import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="TaskPilot Google ADK Agent Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiagnosticQuery(BaseModel):
    query: str
    project: str = "CMS_VAL_FS"
    tsp: Optional[str] = None
    lsa: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "TaskPilot Google ADK Agent Microservice"}

@app.post("/agent/diagnose")
def diagnose_issue(req: DiagnosticQuery):
    """
    Google ADK Diagnostic Agent reasoning endpoint
    """
    return {
        "status": "success",
        "project": req.project,
        "query": req.query,
        "tsp": req.tsp,
        "lsa": req.lsa,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
