# Repository operating rules

- GitHub's current `main` branch is the only implementation Source of Truth.
- Before work involving repository state, read current `main`.
- Never modify `main` directly; work on a branch and propose a pull request.
- One milestone should solve one primary problem.
- Clearly distinguish **VERIFIED**, **INFERENCE**, and **PROPOSAL**.
- Prioritize registry correctness and pipeline reliability before new features or UI.
- Do not conflate listing, installability, compatibility, maintenance, quality, or security.
- Do not use unsupported labels such as `safe`, `trusted`, or `secure`.
- Run relevant tests and checks before proposing a pull request.
- GitHub Actions is the final CI gate.
- Do not merge without review.

## Project control and capability routing

ChatGPT is the project-level authoritative Brain and Control Plane. It owns evidence acquisition, product and architecture decisions, task decomposition, runtime capability discovery, capability routing, independent verification, and the final `ACCEPT / REVISE / DONE` decision.

Use this operating loop:

> Evidence first -> Decision -> Runtime Capability Discovery -> Capability Routing -> Execute -> Independent Evidence Reacquisition -> ACCEPT / REVISE / DONE

Prefer capabilities that are actually available in the current ChatGPT runtime before delegating work elsewhere. This includes authorized GitHub operations, Web/Search, Files, Python/Data Analysis, Artifacts, Automations, and other connected capabilities when they are sufficient for the task.

Do not route work to Codex merely because it touches GitHub or changes a file. Small, bounded, deterministic repository changes may be performed through an authorized ChatGPT GitHub provider when the required operation is available.

Codex Cloud is the preferred sustained coding executor for work such as multi-file implementation, unknown-root-cause debugging, refactoring, shell-heavy changes, and iterative test/build loops. Codex task summaries, claimed test results, and RESULT messages are evidence candidates, not authoritative project facts. When ChatGPT can reacquire the real commit, diff, CI status, generated data, or production state, it must do so before acceptance.

For a mutable resource, keep one authoritative writer at a time. If Codex is changing a PR branch, ChatGPT must not concurrently mutate that same branch. Read-only investigation may proceed in parallel.

Minimize manual relay. Ask the user for a handoff only when the current runtime cannot perform a necessary capability directly.

## Codex Cloud execution leg

Use Codex Cloud only when capability routing selects it for the implementation leg.

- Preferred cloud development repository: `ukinch605/awesome-dsh-hub`.
- Repository owner/admin identity: `ukinch605`.
- Codex Cloud working/collaborator identity: `SIMON-WORLD`.
- Install the ChatGPT Codex Connector on `ukinch605` and authorize `awesome-dsh-hub`.
- Keep the two GitHub browser identities isolated; do not require both accounts to be logged into one browser.
- Use these default Codex Cloud environment settings:
  - `image=universal`
  - `setup=automatic`
  - `cache=enabled`
  - proxy network disabled unless the task explicitly requires external network access
  - no secrets unless explicitly required
- Start Codex work from the current remote `main` and keep the task scoped to one primary problem.
- After Codex implementation, use the platform **Create Pull Request** or **Update Pull Request** handoff when required, then return control to ChatGPT for independent GitHub diff/CI review and acceptance.
- A web-created Codex Cloud task may appear in ChatGPT Desktop, but opening it there may switch the conversation to Desktop Work mode. For repository changes, start and continue in Web Codex Cloud unless the UI explicitly confirms the same Codex Cloud environment and repository execution context; use Desktop only to monitor or view when that confirmation is absent.
- Do not use Work-exported patches plus manual Codespaces application as the normal development path.
- Do not use Cloud Browser -> Codespaces as the normal coding path.
- If an in-task `make_pr`/MCP handoff fails but the Codex Cloud UI exposes **Create Pull Request** or **Update Pull Request**, use the platform UI handoff. Do not add networking or secrets merely to work around the failure unless explicitly requested.
