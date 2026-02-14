
import asyncio
import random

MOCK_Q1 = "Hold up. You just pasted a database connection block but didn't include a teardown method. What happens to the connection pool if this fails?"
MOCK_Q2 = "Okay, assuming you add a teardown, explain the time complexity of the nested loop on line 14 of that snippet."

async def mock_stream_question(code_snippet: str, context_summary: str):
    """Stream MOCK_Q1 word by word with delay."""
    words = MOCK_Q1.split(" ")
    for word in words:
        yield word + " "
        await asyncio.sleep(0.05) # simulate typing

async def mock_second_question(code_snippet: str, question_1: str, answer_1: str):
    """Return MOCK_Q2 as plain string."""
    await asyncio.sleep(1) # simulate thinking
    return MOCK_Q2

async def mock_evaluate_combined(code_snippet: str, q1: str, a1: str, q2: str, a2: str):
    """Always pass."""
    await asyncio.sleep(1) # simulate thinking
    return {
        "status": "pass", 
        "feedback": "Good understanding demonstrated. Your editor is now unlocked."
    }

async def mock_stream_error_hint(error_message: str, line_code: str, context_summary: str):
    """Stream a mock hint."""
    hint = "[Demo Mode] I notice a possible syntax error here. In Python, ensure all blocks starting with 'def' or 'if' end with a colon. Have you checked line endings?"
    for word in hint.split(" "):
        yield word + " "
        await asyncio.sleep(0.05)

async def mock_stream_mentor_chat(selected_code: str, user_query: str, context_summary: str):
    """Stream a mock chat response."""
    response = "[Demo Mode] That's an interesting question. In this architecture, this specific block handles the request lifecycle. It ensures that all incoming requests are properly authenticated before being passed to the business logic layer. Notice how the middleware intercepts the call first?"
    for word in response.split(" "):
        yield word + " "
        await asyncio.sleep(0.05)

