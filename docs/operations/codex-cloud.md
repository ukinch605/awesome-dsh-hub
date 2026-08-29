# Codex Cloud operations

This document records the verified operating procedure for cloud-based development of `ukinch605/awesome-dsh-hub`. It contains no credentials, tokens, email addresses, or other private information.

## What Codex Cloud is

Codex Cloud is the repository-aware development environment used to run a task, inspect and edit a checked-out repository, review the resulting diff, and hand the change off as a pull request.

It is distinct from the following tools:

- **ChatGPT Work** can help analyze or draft a change, but its patch-export workflow is not the normal repository development path.
- **Ordinary GitHub connector access in ChatGPT** can expose authorized repository context, but it is not a general repository-write or pull-request workflow.
- **Cloud Browser** is browser automation, not the primary coding environment.
- **GitHub Codespaces** is a separate hosted development environment and is not required in the normal Codex Cloud path.

Access to a repository through one of these tools does not imply that another tool is installed, authorized, or able to write to the repository.

## Identities and GitHub App installation

The roles are intentionally separate:

- `ukinch605` is the repository owner/admin identity.
- `SIMON-WORLD` is the Codex Cloud working/collaborator identity.

On the owner side, install the ChatGPT Codex Connector GitHub App on `ukinch605` and authorize the `awesome-dsh-hub` repository. Repository selection must include `ukinch605/awesome-dsh-hub`; broad ordinary ChatGPT connector access is not a substitute for this installation.

Keep the owner/admin and collaborator browser identities isolated, such as in separate browser profiles or sessions. The setup must not depend on logging both GitHub accounts into one browser.

## Collaborator workflow

Grant `SIMON-WORLD` the repository collaboration needed for the approved workflow. Use that identity for Codex Cloud work while retaining repository ownership and administrative actions under `ukinch605`.

Before repository-state work, establish the current remote `main` as the implementation Source of Truth. Create task work from that state, never commit directly to `main`, and leave merging to the reviewed GitHub flow.

## Create or select the Codex Cloud environment

In Codex Cloud, create or select an environment associated with `ukinch605/awesome-dsh-hub`. Confirm the repository selection before starting a task; a similarly named environment or access through another connector is not sufficient.

Use these defaults:

| Setting | Default |
| --- | --- |
| Image | `universal` |
| Setup | `automatic` |
| Cache | enabled |
| Proxy network | disabled unless the task explicitly requires external network access |
| Secrets | none unless explicitly required |

Enable network access or add a secret only when the task expressly requires it. Do not add either merely to repair a pull-request handoff that the platform UI can complete.

## End-to-end change flow

1. Start a Codex Cloud task against `ukinch605/awesome-dsh-hub` from current `main`.
2. Make one focused milestone solve one primary problem.
3. Review the changed-file list and complete diff. Verify that no unrelated file changed.
4. Run relevant local tests and checks.
5. Use the platform **Create Pull Request** handoff.
6. Let GitHub Actions act as the final CI gate.
7. Review the pull request and CI results.
8. Merge only after review; never merge as part of the task itself.

The normal path is therefore:

> Codex Cloud task -> review diff -> Create Pull Request -> GitHub Actions -> review -> merge

A Codex Cloud task created on the web can appear in ChatGPT Desktop. Opening that synced task in Desktop may place the conversation in Desktop Work mode, which must not be treated as equivalent to execution in the original Codex Cloud repository environment. For repository-changing work, start and continue the task in Web Codex Cloud unless the UI explicitly confirms the same Codex Cloud environment and repository execution context. Desktop can monitor or display the synced task and its results when that confirmation is absent.

## Observed smoke-test behavior

**VERIFIED:** During the smoke test, the in-task `make_pr`/MCP handoff failed, while the Codex Cloud platform **Create Pull Request** action successfully created PR #2.

If this occurs again and **Create Pull Request** is available in the Codex Cloud UI, use that platform handoff. Do not add repository secrets, credentials, or network access simply to work around the in-task handoff failure unless the task explicitly requests it.

## Troubleshooting

### Repository is unavailable in Codex Cloud

1. Confirm that the ChatGPT Codex Connector GitHub App is installed on `ukinch605`.
2. Confirm that its repository authorization includes `awesome-dsh-hub`.
3. Confirm that the Codex Cloud environment selects `ukinch605/awesome-dsh-hub`.
4. Confirm that `SIMON-WORLD` still has the required collaborator access.
5. Check these items in the appropriate isolated owner or collaborator browser session.

### The checkout does not reflect expected repository state

Stop and compare with the current remote `main`. Treat GitHub current `main`, not a Work transcript, downloaded patch, old Codespace, or browser session, as the implementation Source of Truth. Recreate the task from current `main` rather than layering work onto uncertain state.

### Pull-request handoff fails inside the task

Review the diff and checks first. If the Codex Cloud UI offers **Create Pull Request**, use it. A failed in-task MCP call does not justify introducing secrets or enabling network access when the platform handoff remains available.

### A web task opens in Desktop Work mode

Do not assume that continuing a synced conversation in Desktop Work mode runs in its original Codex Cloud checkout. Return to Web Codex Cloud for repository-changing work unless Desktop explicitly confirms the same Codex Cloud environment and repository execution context. Desktop remains suitable for monitoring the task and viewing results.

## Anti-patterns

Do not adopt these as the normal development workflow:

- **Work -> patch -> download/upload -> Codespaces:** this adds manual transfer steps and makes repository-state provenance harder to verify.
- **Ordinary Chat GitHub connector for repository writes:** connector visibility is not the verified Codex Cloud write and pull-request path.
- **Cloud Browser as the primary coding environment:** browser automation is not a substitute for a repository-aware Codex Cloud task.
- **Cloud Browser -> Codespaces:** this unnecessarily combines separate environments and identities for routine changes.

These constraints keep source state, identity boundaries, review, and CI responsibilities explicit.
