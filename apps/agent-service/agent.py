import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.tools import tool

load_dotenv()

# System Instructions for TaskPilot LangChain Diagnostic Agent
SYSTEM_PROMPT = """You are TaskPilot Diagnostic Agent, an expert operational and incident resolution specialist.
Your goal is to assist NOC engineers, field operators, and system administrators in troubleshooting and resolving technical incidents.

CRITICAL RULES:
1. Strict Project Isolation: You must ONLY reason over and reference records belonging to the currently selected project ({project}).
2. When the user reports symptoms or asks how to fix an issue:
   - Formulate diagnostic queries and look for historical fixes matching the symptoms, TSP, and LSA/node.
   - Provide clear, actionable, step-by-step remediation procedures.
   - Cite relevant historical Ticket IDs if found.
   - Emphasize verification steps (e.g. error counter checks, power levels, ping/latency tests).
3. Be professional, concise, and technical. Format your response cleanly using GitHub-flavored Markdown.
"""

def build_agent_executor(project: str):
    # Support locally hosted LLMs (Ollama, vLLM, LM Studio, LocalAI) via OpenAI-compatible API
    local_base_url = os.getenv("LOCAL_LLM_BASE_URL", "http://localhost:11434/v1")
    local_model = os.getenv("LOCAL_LLM_MODEL", "llama3.1")
    api_key = os.getenv("LOCAL_LLM_API_KEY", "dummy-key")
    
    llm = ChatOpenAI(
        base_url=local_base_url,
        api_key=api_key,
        model=local_model,
        temperature=0.2,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT.format(project=project)),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    tools = []
    agent = create_tool_calling_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    return executor
