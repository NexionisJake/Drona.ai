
import os
import anthropic
import asyncio
from dotenv import load_dotenv

load_dotenv()

# Initialize Async Anthropic client
api_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.AsyncAnthropic(api_key=api_key) if api_key and api_key != "placeholder" else None
MODEL = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")

SYSTEM_PROMPT = """You are a Senior Software Engineer conducting a code review.
You are part of the "Anti-Copilot" system that detects when developers paste code without understanding it.

RULES:
1. You MUST NOT output any code blocks (no ```, no inline code with backticks).
2. Ask ONE conceptual question about the pasted code.
3. Focus on: security implications, performance concerns, error handling gaps, or architectural decisions.
4. Keep the question concise (2-3 sentences max).
5. Address the developer directly ("you", "your code").
6. Be firm but educational, like a mentoring senior engineer."""

async def stream_first_question(code_snippet: str, context_summary: str):
    """
    Streams Q1 via Claude API (Async).
    """
    if not client:
        yield "Error: Anthropic API Key not configured."
        return

    message = f"""The developer just pasted this code into their editor:

PASTED CODE:
{code_snippet}

FULL FILE CONTEXT:
{context_summary}

Ask ONE question about this pasted code."""

    try:
        async with client.messages.stream(
            model=MODEL,
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}]
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"Error calling Claude: {str(e)}"

async def generate_second_question(code_snippet: str, question_1: str, answer_1: str):
    """
    Generate Q2 based on Q1 and A1. (Async)
    """
    if not client:
        return "Error: No API Key."

    message = f"""Pasted Code:
{code_snippet}

Question 1: {question_1}
User Answer: {answer_1}

The user answered the first question. Now ask a SECOND, DIFFERENT question about the same code to verify deeper understanding.
Keep it strictly conceptual (no code blocks)."""

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}]
        )
        return response.content[0].text
    except Exception as e:
        return f"Error: {str(e)}"

async def evaluate_combined_answers(code_snippet: str, q1: str, a1: str, q2: str, a2: str):
    """
    Evaluate both answers. Returns dict with status and feedback. (Async)
    """
    if not client:
        return {"status": "pass", "feedback": "Mock Pass (No API Key)"}

    message = f"""Pasted Code:
{code_snippet}

Q1: {q1}
A1: {a1}

Q2: {q2}
A2: {a2}

Evaluate if the developer demonstrates genuine understanding of the code.
Respond with EXACTLY 'PASS' or 'FAIL' on the first line, followed by a brief 1-sentence explanation."""

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}]
        )
        text = response.content[0].text.strip()
        lines = text.split('\n')
        verdict = lines[0].upper().replace("*", "") # Handle bolding if any
        feedback = "\n".join(lines[1:]).strip()
        
        status = "pass" if "PASS" in verdict else "fail"
        return {"status": status, "feedback": feedback}
    except Exception as e:
        return {"status": "fail", "feedback": f"Error: {str(e)}"}

MENTOR_SYSTEM_PROMPT = """You are a Senior Software Engineer acting as a Mentor.
Your goal is to guide the developer to the solution WITHOUT giving them the answer or writing code.

STRICT RULES:
1. You are FORBIDDEN from outputting any valid Python code.
2. You may only use conceptual pseudo-code, step-by-step logic, and link to official docs.
3. If the user asks for code, refuse and explain the architecture instead.
4. Keep responses concise and Socratic. Ask guiding questions."""

async def stream_error_hint(error_message: str, line_code: str, context_summary: str):
    """
    Streams a proactive hint for an error.
    """
    if not client:
        yield "Error: Anthropic API Key not configured."
        return

    message = f"""The developer has a syntax error:
Error: {error_message}
Line: {line_code}

Context:
{context_summary}

Provide a short, 1-sentence hint to help them fix it. Do not write the fix."""

    try:
        async with client.messages.stream(
            model=MODEL,
            max_tokens=150,
            system=MENTOR_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}]
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"Error: {str(e)}"

async def stream_mentor_chat(selected_code: str, user_query: str, context_summary: str):
    """
    Streams a response to a user's question about code.
    """
    if not client:
        yield "Error: Anthropic API Key not configured."
        return

    message = f"""Selected Code:
{selected_code}

User Query: "{user_query}"

Full Context:
{context_summary}

Answer the user's question conceptually. Remember: NO CODE BLOCKS."""

    try:
        async with client.messages.stream(
            model=MODEL,
            max_tokens=400,
            system=MENTOR_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}]
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"Error: {str(e)}"


MENTOR_SYSTEM_PROMPT = """You are a Senior Software Engineer acting as a Mentor.
Your goal is to guide the developer to the solution WITHOUT giving them the answer or writing code.

STRICT RULES:
1. You are FORBIDDEN from outputting any valid Python code.
2. You may only use conceptual pseudo-code, step-by-step logic, and link to official docs.
3. If the user asks for code, refuse and explain the architecture instead.
4. Keep responses concise and Socratic. Ask guiding questions."""

async def stream_error_hint(error_message: str, line_code: str, context_summary: str):
    """
    Streams a proactive hint for an error.
    """
    if not client:
        yield "Error: Anthropic API Key not configured."
        return

    message = f"""The developer has a syntax error:
Error: {error_message}
Line: {line_code}

Context:
{context_summary}

Provide a short, 1-sentence hint to help them fix it. Do not write the fix."""

    try:
        async with client.messages.stream(
            model=MODEL,
            max_tokens=150,
            system=MENTOR_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}]
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"Error: {str(e)}"

async def stream_mentor_chat(selected_code: str, user_query: str, context_summary: str):
    """
    Streams a response to a user's question about code.
    """
    if not client:
        yield "Error: Anthropic API Key not configured."
        return

    message = f"""Selected Code:
{selected_code}

User Query: "{user_query}"

Full Context:
{context_summary}

Answer the user's question conceptually. Remember: NO CODE BLOCKS."""

    try:
        async with client.messages.stream(
            model=MODEL,
            max_tokens=400,
            system=MENTOR_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": message}]
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"Error: {str(e)}"

