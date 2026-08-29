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

## Codex Cloud workflow

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
- Follow the normal coding path: Codex Cloud task -> review diff -> platform **Create Pull Request** handoff -> GitHub Actions -> review -> merge.
- A web-created Codex Cloud task may appear in ChatGPT Desktop, but opening it there may switch the conversation to Desktop Work mode. For repository changes, start and continue in Web Codex Cloud unless the UI explicitly confirms the same Codex Cloud environment and repository execution context; use Desktop only to monitor or view when that confirmation is absent.
- Do not use Work-exported patches plus manual Codespaces application as the normal development path.
- Do not use Cloud Browser -> Codespaces as the normal coding path.
- If an in-task `make_pr`/MCP handoff fails but the Codex Cloud UI exposes **Create Pull Request**, use the platform UI handoff. Do not add networking or secrets merely to work around the failure unless explicitly requested.
