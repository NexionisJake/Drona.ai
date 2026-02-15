
import asyncio
import sys
import subprocess
import tempfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

from models.schemas import AnalyzePasteRequest, ValidateAnswerRequest, ValidateAnswerResponse, AnalyzeErrorRequest, MentorChatRequest, CodeExecutionRequest
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
    if not claude_service.client:
        # Fallback to mock
        async def mock_event_generator():
            async for chunk in mock_service.mock_stream_question(request.code_snippet, request.context_summary):
                yield {"data": chunk}
            yield {"data": "[DONE]"}
        return EventSourceResponse(mock_event_generator())

    async def event_generator():
        try:
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
    if not claude_service.client:
        # Fallback to mock
        if request.question_number == 1:
            q2_text = await mock_service.mock_second_question(request.code_snippet, request.question, request.user_answer)
            return ValidateAnswerResponse(status="next_question", feedback="Good start (Demo Mode).", next_question=q2_text)
        elif request.question_number == 2:
            result = await mock_service.mock_evaluate_combined(request.code_snippet, request.question_1 or "", request.answer_1 or "", request.question, request.user_answer)
            return ValidateAnswerResponse(status=result["status"], feedback=result["feedback"] + " (Demo Mode)")
    
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

@app.post("/api/run")
async def run_code(request: CodeExecutionRequest):
    """
    Executes Python code securely in a temporary file with a 5-second timeout.
    Returns stdout, stderr, and execution status.
    """
    temp_file = None
    try:
        # Create a temporary Python file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(request.code)
            temp_file_path = temp_file.name

        # Execute the code with a 5-second timeout
        try:
            result = subprocess.run(
                [sys.executable, temp_file_path],
                capture_output=True,
                text=True,
                timeout=5
            )

            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "status": "success" if result.returncode == 0 else "error"
            }

        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timed out after 5 seconds. Your code may have an infinite loop.",
                "status": "timeout"
            }

    except Exception as e:
        return {
            "stdout": "",
            "stderr": f"Execution error: {str(e)}",
            "status": "error"
        }

    finally:
        # Clean up the temporary file
        if temp_file:
            try:
                import os
                os.unlink(temp_file_path)
            except:
                pass

@app.post("/analyze_error")
async def analyze_error(request: AnalyzeErrorRequest):
    """
    Streams a proactive hint for an error.
    """
    if not claude_service.client:
        # Fallback to mock
        async def mock_gen():
            async for chunk in mock_service.mock_stream_error_hint(request.error_message, request.line_code, request.context_summary):
                yield {"data": chunk}
            yield {"data": "[DONE]"}
        return EventSourceResponse(mock_gen())

    async def event_generator():
        try:
            iterator = claude_service.stream_error_hint(request.error_message, request.line_code, request.context_summary)
            async for chunk in iterator:
                yield {"data": chunk}
            yield {"data": "[DONE]"}
        except Exception as e:
             yield {"data": f"Error: {str(e)}"}
             yield {"data": "[DONE]"}

    return EventSourceResponse(event_generator())

@app.post("/mentor_chat")
async def mentor_chat(request: MentorChatRequest):
    """
    Streams response to manual mentor query.
    """
    if not claude_service.client:
        # Fallback to mock
        async def mock_gen():
            async for chunk in mock_service.mock_stream_mentor_chat(request.selected_code, request.user_query, request.context_summary, request.full_file or ""):
                yield {"data": chunk}
            yield {"data": "[DONE]"}
        return EventSourceResponse(mock_gen())

    async def event_generator():
        try:
            iterator = claude_service.stream_mentor_chat(request.selected_code, request.user_query, request.context_summary, request.full_file or "")
            async for chunk in iterator:
                yield {"data": chunk}
            yield {"data": "[DONE]"}
        except Exception as e:
             yield {"data": f"Error: {str(e)}"}
             yield {"data": "[DONE]"}

    return EventSourceResponse(event_generator())

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
