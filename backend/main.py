
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

from models.schemas import AnalyzePasteRequest, ValidateAnswerRequest, ValidateAnswerResponse
from services import claude_service, mock_service

load_dotenv()

app = FastAPI(title="Anti-Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "Anti-Copilot API Running"}

# --- Real Claude Endpoints ---

@app.post("/analyze_paste")
async def analyze_paste(request: AnalyzePasteRequest):
    """
    Streams Claude's first question via SSE.
    """
    async def event_generator():
        try:
            # Using stream_first_question generator with timeout on each chunk? 
            # No, stream itself needs to be responsive.
            # Timeout for the *first* chunk or whole stream?
            # Let's put a timeout on the stream iteration.
            iterator = claude_service.stream_first_question(request.code_snippet, request.context_summary)
            async for chunk in iterator:
                yield {"data": chunk}
            yield {"data": "[DONE]"}
        except asyncio.TimeoutError:
             yield {"data": "API Timeout. Bypassing..."}
             yield {"data": "[DONE]"}
        except Exception as e:
             yield {"data": f"Error: {str(e)}"}
             yield {"data": "[DONE]"}

    return EventSourceResponse(event_generator())

@app.post("/validate_answer")
async def validate_answer(request: ValidateAnswerRequest):
    """
    Validates answer. 
    If Q1 -> Return Q2 (next_question).
    If Q2 -> Return Pass/Fail.
    """
    if request.question_number == 1:
        try:
            # User answered Q1. Generate Q2.
            q2_text = await asyncio.wait_for(
                claude_service.generate_second_question(
                    request.code_snippet, 
                    request.question, 
                    request.user_answer
                ), timeout=10.0
            )
            return ValidateAnswerResponse(
                status="next_question",
                feedback="Good start.",
                next_question=q2_text
            )
        except asyncio.TimeoutError:
            # Fallback to allow progress
            return ValidateAnswerResponse(
                status="next_question",
                feedback="Timeout. Moving on.",
                next_question="Timeout occurred. Proceed to next step."
            )
            
    elif request.question_number == 2:
        # User answered Q2. Evaluate combined.
        try:
            result = await asyncio.wait_for(
                claude_service.evaluate_combined_answers(
                    request.code_snippet,
                    request.question_1 or "",
                    request.answer_1 or "",
                    request.question,
                    request.user_answer
                ), timeout=10.0
            )
            return ValidateAnswerResponse(
                status=result["status"],
                feedback=result["feedback"]
            )
        except asyncio.TimeoutError:
             return ValidateAnswerResponse(
                status="pass",
                feedback="API Timeout. Auto-pass."
            )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid question number")

# --- Mock Endpoints (Fallback) ---

@app.post("/mock_stream")
async def mock_stream(request: AnalyzePasteRequest):
    async def event_generator():
        async for chunk in mock_service.mock_stream_question(request.code_snippet, request.context_summary):
            yield {"data": chunk}
        yield {"data": "[DONE]"}
    return EventSourceResponse(event_generator())

@app.post("/mock_validate")
async def mock_validate(request: ValidateAnswerRequest):
    if request.question_number == 1:
        q2_text = await mock_service.mock_second_question(
            request.code_snippet,
            request.question,
            request.user_answer
        )
        return ValidateAnswerResponse(
            status="next_question",
            feedback="Mock Feedback: Good job.",
            next_question=q2_text
        )
    elif request.question_number == 2:
        result = await mock_service.mock_evaluate_combined(
            request.code_snippet,
            request.question_1 or "",
            request.answer_1 or "",
            request.question,
            request.user_answer
        )
        return ValidateAnswerResponse(
            status=result["status"],
            feedback=result["feedback"]
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid question number")
