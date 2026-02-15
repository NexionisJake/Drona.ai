
/**
 * Preprocesses markdown text to ensure proper spacing for lists and headers.
 * This fixes "dense text" issues where the AI output fails to include newlines.
 */
export function preprocessMarkdown(text: string): string {
    if (!text) return text;

    let processed = text;

    // 1. Ensure newlines before numbered lists (e.g. "end.1. Start" -> "end.\n\n1. Start")
    // Look for: non-newline char, optional usage, then digit+dot
    processed = processed.replace(/([^\n])\s*(\d+\.)/g, '$1\n\n$2');

    // 2. Ensure newlines before bullet points (e.g. "end.- Item" -> "end.\n\n- Item")
    processed = processed.replace(/([^\n])\s*(-\s)/g, '$1\n\n$2');

    // 3. Ensure newlines before headers (e.g. "end.### Header" -> "end.\n\n### Header")
    processed = processed.replace(/([^\n])\s*(#+\s)/g, '$1\n\n$2');

    // 4. Ensure newlines before bold headers if they look like titles (e.g. "end.**Title**:" -> "end.\n\n**Title**:")
    // This is risky but often needed for "Key Features:**Feature 1**"
    // matching: end char + space + **Bold**:
    processed = processed.replace(/([^\n])\s*(\*\*[^*\n]+\*\*[:?])/g, '$1\n\n$2');

    // 5. Fix missing spaces after periods (e.g. "end.Start" -> "end. Start", "end.2" -> "end. 2")
    // This handles the "dense text" where sentences are glued together.
    processed = processed.replace(/([a-z0-9])\.([A-Z0-9])/g, '$1. $2');

    return processed;
}
