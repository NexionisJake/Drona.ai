
const API_BASE = "http://localhost:8000";
export const USE_MOCK = false; // Toggle for demo safety

export interface AnalyzeParams {
    codeSnippet: string;
    contextSummary: string;
    onChunk: (text: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
    abortSignal?: AbortSignal;
}

export interface ValidateParams {
    question: string;
    userAnswer: string;
    codeSnippet: string;
    questionNumber: number;
    question1?: string;
    answer1?: string;
}

export interface ValidateResponse {
    status: "next_question" | "pass" | "fail";
    feedback: string;
    next_question?: string;
}

export async function analyzePaste({
    codeSnippet,
    contextSummary,
    onChunk,
    onDone,
    onError,
    abortSignal
}: AnalyzeParams): Promise<void> {
    const endpoint = USE_MOCK ? "/mock_stream" : "/analyze_paste";

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code_snippet: codeSnippet, context_summary: contextSummary }),
            signal: abortSignal,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.slice(6);
                    if (data === "[DONE]") {
                        onDone();
                        return;
                    }
                    // Claude streaming sometimes sends JSON, sometimes plain text in data?
                    // Our backend sends {"data": text} but sse-starlette formats it as `data: text` if we yield string?
                    // Wait, sse-starlette yields `data: <content>\n\n`.
                    // In main.py: yield {"data": chunk} -> SSE format `data: {"data": "chunk"}`?
                    // No, yield {"data": chunk} means the event data field is `chunk`.
                    // So the line is `data: chunk`.
                    // If chunk has newlines, SSE handles it.
                    // Let's assume standard SSE: `data: <content>`
                    onChunk(data);
                }
            }
        }

        // Process remaining buffer
        if (buffer.startsWith("data: ")) {
            const data = buffer.slice(6);
            if (data !== "[DONE]") onChunk(data);
        }

        onDone();

    } catch (error: any) {
        if (error.name === "AbortError") {
            onError("Timeout");
        } else {
            onError(error.message);
        }
    }
}

export async function validateAnswer(params: ValidateParams): Promise<ValidateResponse> {
    const endpoint = USE_MOCK ? "/mock_validate" : "/validate_answer";

    // Map params to backend naming convention
    const body = {
        question: params.question,
        user_answer: params.userAnswer,
        code_snippet: params.codeSnippet,
        question_number: params.questionNumber,
        question_1: params.question1,
        answer_1: params.answer1
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
}
