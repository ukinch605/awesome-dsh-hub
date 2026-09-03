# Codex Cloud operations

This document records the verified operating procedure for the Codex Cloud execution leg of `ukinch605/awesome-dsh-hub`. It contains no credentials, tokens, email addresses, or other private information.

Codex Cloud is not the project control plane and is not the default route for every repository task. ChatGPT is the project-level authoritative Brain and Control Plane. Capability routing decides whether a task can be completed with current ChatGPT-native or connected capabilities, or whether sustained coding should be delegated to Codex Cloud.

## When to use Codex Cloud

Use Codex Cloud when the task requires sustained repository execution such as:

- multi-file implementation;
- unknown-root-cause debugging;
- refactoring;
- shell-heavy work;
- iterative test/build loops.

Do not use Codex merely because a task touches GitHub or changes a file. When the current ChatGPT runtime has an authorized capability that is sufficient for investigation, PR/CI review, bounded GitHub actions, data analysis, or a small deterministic edit, prefer that direct capability.

Codex task summaries and self-reported test results are evidence candidates. Final project acceptance belongs to ChatGPT after independent reacquisition of authoritative evidence such as the real GitHub commit, diff, CI result, generated data, or production state.

## What Codex Cloud is

Codex Cloud is a repository-aware development environment that can run a task, inspect and edit a checked-out repository, execute tests, and hand the resulting change off as a pull request.

It is distinct from the following capability providers:

- **ChatGPT GitHub access** may expose read and write operations depending on the current tool surface, provider connection, repository authorization, and operation permissions. Availability must be established at runtime rather than assumed globally.
- **Web/Search** is suitable for public evidence acquisition and documentation research, not repository shell execution.
- **ChatGPT Work** is a separate product workspace and must not be assumed to share the Codex Cloud checkout or execution backend.
- **Cloud Browser** is browser automation, not the primary repository coding environment.
- **GitHub Codespaces** is a separate hosted development environment and is not required in the normal Codex Cloud path.

Access through one provider does not imply that another provider is installed, authorized, or able to perform the same operation.

## Identities and GitHub App installation

The roles are intentionally separate:

- `ukinch605` is the repository owner/admin identity.
- `SIMON-WORLD` is the Codex Cloud working/collaborator identity.

On the owner side, install the ChatGPT Codex Connector GitHub App on `ukinch605` and authorize the `awesome-dsh-hub` repository.

Keep the owner/admin and collaborator browser identities isolated, such as in separate browser profiles or sessions. The setup must not depend on logging both GitHub accounts into one browser.

## Collaborator workflow

Grant `SIMON-WORLD` the repository collaboration needed for the approved workflow. Use that identity for Codex Cloud work while retaining repository ownership and administrative actions under `ukinch605`.

Before repository-state work, establish the current remote `main` as the implementation Source of Truth. Create task work from that state, never commit directly to `main`, and leave project-level acceptance and merging to the reviewed GitHub flow.

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

## End-to-end routed change flow

When capability routing selects Codex Cloud:

1. ChatGPT establishes current authoritative evidence and defines the problem and acceptance criteria.
2. Start a Codex Cloud task against `ukinch605/awesome-dsh-hub` from current remote `main`.
3. Make one focused milestone solve one primary problem.
4. Run relevant local tests and checks and review the changed-file list.
5. Use the platform **Create Pull Request** or **Update Pull Request** handoff when needed.
6. ChatGPT independently fetches the real GitHub PR head, diff, and GitHub Actions result rather than accepting the Codex RESULT as truth.
7. ChatGPT decides `ACCEPT` or `REVISE`.
8. Merge only after review, using an authorized GitHub capability when available.
9. Reacquire production evidence after merge when the change affects generated data or runtime behavior.

The routed path is therefore:

> ChatGPT evidence + decision -> Codex implementation when required -> GitHub PR/CI -> ChatGPT independent verification -> ACCEPT/REVISE -> merge -> production verification

A Codex Cloud task created on the web can appear in ChatGPT Desktop. Opening that synced task in Desktop may place the conversation in Desktop Work mode, which must not be treated as equivalent to execution in the original Codex Cloud repository environment. For repository-changing work, start and continue the task in Web Codex Cloud unless the UI explicitly confirms the same Codex Cloud environment and repository execution context. Desktop can monitor or display the synced task and its results when that confirmation is absent.

## Observed handoff behavior

**VERIFIED:** During the smoke test, an in-task pull-request handoff failed while the Codex Cloud platform **Create Pull Request** action successfully created the GitHub PR.

If an in-task handoff fails and **Create Pull Request** or **Update Pull Request** is available in the Codex Cloud UI, use the platform handoff. Do not add repository secrets, credentials, or network access simply to work around the in-task handoff failure unless the task explicitly requires them.

## Single-writer rule

For a mutable resource, keep one authoritative writer at a time. If Codex Cloud is modifying a PR branch, ChatGPT must not concurrently mutate that same branch. Read-only investigation and independent evidence acquisition may proceed in parallel.

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

Review the diff and checks first. If the Codex Cloud UI offers **Create Pull Request** or **Update Pull Request**, use it. A failed in-task handoff does not justify introducing secrets or enabling network access when the platform handoff remains available.

### A web task opens in Desktop Work mode

Do not assume that continuing a synced conversation in Desktop Work mode runs in its original Codex Cloud checkout. Return to Web Codex Cloud for repository-changing work unless Desktop explicitly confirms the same Codex Cloud environment and repository execution context. Desktop remains suitable for monitoring the task and viewing results.

## Anti-patterns

Do not adopt these as the normal development workflow:

- routing every GitHub or file change through Codex without checking current native capabilities first;
- treating Codex RESULT or self-reported tests as final VERIFIED project facts;
- Work -> patch -> download/upload -> Codespaces for routine changes;
- Cloud Browser as the primary coding environment;
- Cloud Browser -> Codespaces for ordinary repository work;
- concurrent mutation of the same PR branch by ChatGPT and Codex.

These constraints keep capability routing, source state, identity boundaries, writer ownership, review, and CI responsibilities explicit.
