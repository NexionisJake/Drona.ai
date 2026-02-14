
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

/**
 * Process SSE events from a buffered string.
 * Handles the "data: ..." format, calling onChunk for each token
 * and returning true if [DONE] was received.
 */
function processSSEEvents(
    eventStr: string,
    onChunk: (text: string) => void,
    onDone: () => void
): boolean {
    const lines = eventStr.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
            const data = trimmed.replace("data: ", "");
            if (data === "[DONE]") {
                onDone();
                return true;
            }
            onChunk(data);
        }
    }
    return false;
}

/**
 * Read an SSE stream with proper chunk buffering.
 * Accumulates raw bytes and splits by \n\n boundaries
 * so partial chunks don't cause parse errors.
 */
async function readSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (text: string) => void,
    onDone: () => void
): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            // Process any remaining buffer content
            if (buffer.trim()) {
                const isDone = processSSEEvents(buffer, onChunk, onDone);
                if (isDone) return;
            }
            onDone();
            return;
        }

        buffer += decoder.decode(value, { stream: true });

        // Split by double newline (SSE event boundary)
        const events = buffer.split("\n\n");
        // Keep the last (potentially incomplete) chunk in the buffer
        buffer = events.pop() || "";

        for (const event of events) {
            if (!event.trim()) continue;
            const isDone = processSSEEvents(event, onChunk, onDone);
            if (isDone) return;
        }
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
        if (!reader) throw new Error("No response body");

        await readSSEStream(reader, onChunk, onDone);
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

export interface AnalyzeErrorParams {
    errorMessage: string;
    lineCode: string;
    contextSummary: string;
    onChunk: (text: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
}

export interface MentorChatParams {
    selectedCode: string;
    fullFile: string;
    userQuery: string;
    contextSummary: string;
    history?: string;
    onChunk: (text: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
}

export async function analyzeError({
    errorMessage,
    lineCode,
    contextSummary,
    onChunk,
    onDone,
    onError
}: AnalyzeErrorParams): Promise<void> {
    const endpoint = "/analyze_error"; // mock fallback handled server-side
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error_message: errorMessage,
                line_code: lineCode,
                context_summary: contextSummary
            })
        });

        if (!response.ok) throw new Error("Backend connection failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        await readSSEStream(reader, onChunk, onDone);
    } catch (err: any) {
        onError(err.message);
    }
}

export async function mentorChat({
    selectedCode,
    fullFile,
    userQuery,
    contextSummary,
    history,
    onChunk,
    onDone,
    onError
}: MentorChatParams): Promise<void> {
    const endpoint = "/mentor_chat"; // mock fallback handled server-side
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                selected_code: selectedCode,
                full_file: fullFile,
                user_query: userQuery,
                context_summary: contextSummary,
                history: history || null
            })
        });

        if (!response.ok) throw new Error("Backend connection failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        await readSSEStream(reader, onChunk, onDone);
    } catch (err: any) {
        onError(err.message);
    }
}

