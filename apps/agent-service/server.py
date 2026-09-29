import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="TaskPilot LangChain Agent Service",
    description="Python microservice powered by LangChain and Google Gemini for project-isolated diagnostic reasoning",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiagnosticRequest(BaseModel):
    query: str
    project: str = "CMS_VAL_FS"
    tsp: Optional[str] = None
    lsa: Optional[str] = None
    chat_history: Optional[List[Dict[str, str]]] = []

class DiagnosticResponse(BaseModel):
    answer: str
    project: str
    matches: List[Dict[str, Any]] = []

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TaskPilot LangChain Microservice",
        "framework": "LangChain v0.3 + Google GenAI",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY") and not os.getenv("GEMINI_API_KEY").startswith("placeholder"))
    }

@app.post("/agent/diagnose", response_model=DiagnosticResponse)
async def diagnose(req: DiagnosticRequest):
    api_key = os.getenv("GEMINI_API_KEY", "")
    
    # If Gemini API key is not yet configured, provide helpful diagnostic guidance
    if not api_key or api_key.startswith("placeholder") or api_key.startswith("AIzaSy..."):
        return DiagnosticResponse(
            answer=f"### 🤖 TaskPilot LangChain Diagnostic Agent ({req.project})\n\n"
                   f"**Status**: Microservice is running and ready on port 8000.\n\n"
                   f"To activate live Gemini model reasoning with LangChain, please add your `GEMINI_API_KEY` to `apps/agent-service/.env`.\n\n"
                   f"**Query Received**: *\"{req.query}\"*\n"
                   f"- **Scope**: Project `{req.project}`" + (f" | TSP: `{req.tsp}`" if req.tsp else "") + (f" | LSA: `{req.lsa}`" if req.lsa else ""),
            project=req.project,
            matches=[]
        )

    try:
        from agent import build_agent_executor
        from langchain_core.messages import HumanMessage, AIMessage

        executor = build_agent_executor(project=req.project, gemini_api_key=api_key)
        
        # Convert history
        history_messages = []
        if req.chat_history:
            for msg in req.chat_history:
                if msg.get("role") == "user":
                    history_messages.append(HumanMessage(content=msg.get("content", "")))
                elif msg.get("role") == "assistant":
                    history_messages.append(AIMessage(content=msg.get("content", "")))

        # Format prompt with scope context
        context_input = req.query
        if req.tsp or req.lsa:
            context_input = f"[Scope: TSP={req.tsp or 'Any'}, LSA/Node={req.lsa or 'Any'}] {req.query}"

        result = await executor.ainvoke({
            "input": context_input,
            "chat_history": history_messages,
        })

        return DiagnosticResponse(
            answer=result.get("output", ""),
            project=req.project,
            matches=[]
        )
    except Exception as e:
        print(f"[LangChain Execution Error]: {e}")
        return DiagnosticResponse(
            answer=f"### ⚠️ Diagnostic Reasoning Error\n\nFailed to execute LangChain agent workflow: `{str(e)}`",
            project=req.project,
            matches=[]
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGENT_PORT", 8000))
    host = os.getenv("AGENT_HOST", "0.0.0.0")
    uvicorn.run("server:app", host=host, port=port, reload=True)
