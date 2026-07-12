# Code Cleanup Instructions

> **⚠️ IMPORTANT:** Do NOT apply these rules on your own. Follow these instructions **ONLY** when the user explicitly tells you to clean up code or references this file. During normal feature work or bug fixes, follow `CODING_STANDARDS.md` instead.

I use this prompt for each folder/file to organize code 

- Simplify unnecessarily complex logic without changing behavior.
- Improve readability through clearer naming, structure, and flow.
- Follow standard, language-idiomatic best practices.
- Improve maintainability and scalability, but avoid over-engineering.
- Remove unused code and redundant abstractions. Extract truly duplicated logic into reusable methods only when it improves clarity.
- Add comments only where intent is not obvious. Remove obvious or redundant comments.
- Preserve all existing logic, behavior, public APIs, method signatures, and file structure unless strictly necessary.
- Do NOT add new features or remove existing ones.
- Avoid refactors that are purely stylistic or formatting-only.
- If a change is potentially risky, explicitly call it out and explain why.
- Briefly explain the reasoning behind each meaningful change.
- Move hardcoded values to constants. If it makes sense. like if it is being used more than once, or if it is a magic value. 
- Create enums or constants only when they clearly reduce duplication or magic values.
- Organize files only if they are clearly misplaced. Do not reshuffle packages without a strong reason.