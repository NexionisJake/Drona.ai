
from pydantic import BaseModel
from typing import Optional

class AnalyzePasteRequest(BaseModel):
    code_snippet: str       # The pasted block (>= 25 lines)
    context_summary: str    # Full main.py content

class ValidateAnswerRequest(BaseModel):
    question: str           # The question text
    user_answer: str        # User's answer
    code_snippet: str       # The pasted code block
    question_number: int    # 1 or 2
    # For Q2, also include Q1 context:
    question_1: Optional[str] = None
    answer_1: Optional[str] = None

class ValidateAnswerResponse(BaseModel):
    status: str             # "next_question" | "pass" | "fail"
    feedback: str           # Claude's feedback
    next_question: Optional[str] = None  # Q2 text (only when status="next_question")

class AnalyzeErrorRequest(BaseModel):
    error_message: str
    line_code: str
    context_summary: str

class MentorChatRequest(BaseModel):
    selected_code: str
    user_query: str
    context_summary: str
    history: Optional[str] = None # For chat history if needed

