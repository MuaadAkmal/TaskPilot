import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
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

def build_agent_executor(project: str, gemini_api_key: Optional[str] = None):
    api_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    
    # Initialize Google Gemini Chat model via LangChain
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.2,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT.format(project=project)),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    # Agent Tools will be registered here (database hybrid retrieval, SOP lookup, etc.)
    tools = []
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    return executor
