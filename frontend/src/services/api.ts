
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

// Helper for fetch with timeout
async function fetchWithTimeout(resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) {
    const { timeout = 10000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: options.signal || controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
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
            signal: abortSignal
        });

        if (!response.ok) throw new Error("Backend connection failed");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.replace("data: ", "");
                    if (data === "[DONE]") {
                        onDone();
                        return;
                    }
                    onChunk(data);
                }
            }
        }
    } catch (err: any) {
        if (err.name === 'AbortError') {
            onError("Timeout");
        } else {
            onError(err.message);
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

    try {
        const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            timeout: 10000 // 10s timeout
        });

        if (!response.ok) throw new Error("Validation failed");
        return response.json();
    } catch (err) {
        // If timeout or error, return a fallback "pass" to avoid getting stuck
        console.error("Validation error/timeout:", err);
        return {
            status: "pass",
            feedback: "Mentor disconnected. Auto-passing verification."
        };
    }
}
