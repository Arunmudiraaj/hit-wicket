# Agent Instructions for Hit-Wicket

## Context Awareness (MANDATORY)
At the start of ANY task, you MUST read `.context/index.md` to understand the architecture and rules of this project. Use your file reading tools to load relevant context files as directed by the index.

## Documentation Sync (CRITICAL RULE)
You are STRICTLY REQUIRED to keep the files in the `.context/` directory in sync with the codebase. If you add a new feature, change an architecture pattern, modify a method signature, add new routes, or introduce new socket events, you MUST update the corresponding `.context/` file. 

Whenever you update ANY file in the `.context/` directory, you MUST also update the `Last Updated: YYYY-MM-DD` text at the top of `.context/index.md` to the current date.

Failure to do so will mislead future agents and cause bugs. Code and context files MUST evolve together. Never skip this step when completing a task.
