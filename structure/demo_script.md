
# Anti-Copilot Demo Script

## 🎯 The Hook (0:00 - 0:30)
**"We are Anti-Copilot. We are here to kill Vibe Coding."**

*   **Action**: Open the editor (`localhost:5173`). It's empty.
*   **Say**: "Modern AI tools like Copilot and Cursor have made us lazy. We paste code we don't understand, and we call it 'Vibe Coding'. But when things break, we don't know how to fix them."
*   **Action**: Start typing manually `import os`, `def main():`.
*   **Say**: "Anti-Copilot brings back the craft. Look at the 'Builder Score' in the top right. It rewards me for *typing*."
*   **Visual**: Point to the **Green Score** increasing as you type.

## 💥 The trap (0:30 - 1:00)
*   **Say**: "But old habits die hard. Let's say I get lazy and copy a database module from ChatGPT."
*   **Action**: Copy the snippet from `structure/demo_paste_snippet.py`.
*   **Action**: **PASTE** it into the editor.
*   **Visual**: 
    - 🔴 Screen blurs.
    - 🔒 Overlay appears: "VIBE CODING DETECTED".
    - 📉 Score plummets (Red).
*   **Say**: "Boom. The system caught me. I tried to paste 30 lines of unverified code. The editor is now **Locked**. I cannot type. I cannot delete. I am stuck."

## 🧠 The Socratic Mentor (1:00 - 2:00)
*   **Say**: "To unlock my editor, I have to prove I understand what I just pasted. The AI Mentor is going to quiz me."
*   **Action**: Look at the Sidebar. Use the "Mock Mode" or Real API flow.
    - **Q1**: "I see a SQL query using f-strings. Why is this dangerous?"
*   **Action**: type answer: "It allows SQL injection attacks." (Enter)
*   **Say**: "I answer the question..."
*   **Visual**: Sidebar transitions to Q2.
    - **Q2**: "You have a nested loop cross-referencing CSV data. What is the time complexity?"
*   **Action**: type answer: "It is O(N*M), which is very slow." (Enter)
*   **Visual**: "Pass" animation. Editor unlocks. Toast: "Penalty Refunded".

## ↩️ The Undo (Escape Hatch) (2:00 - 2:30)
*   **Say**: "Now, what if I didn't understand the code? What if I just wanted to give up?"
*   **Action**: Paste the bad code again (Trigger lock).
*   **Say**: "I'm locked out again. I can't answer. My only other option is to **Reject the Vibe**."
*   **Action**: Press **Ctrl+Z**.
*   **Visual**: Code disappears. Editor unlocks. Score is refunded.
*   **Say**: "Ctrl+Z removes the temptation. I'm back to a clean slate, ready to write code I actually own."

## 🏁 Conclusion (2:30 - 3:00)
*   **Say**: "Anti-Copilot isn't just a linter. It's a forcing function for competence. It stops the 'Copy-Paste-Pray' loop and forces you to be a Builder again."
*   **Say**: "Built with React, FastAPI, and Anthropic Claude 3.5 Sonnet. Thank you."
