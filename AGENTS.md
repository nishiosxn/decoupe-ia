# Découpe AI — Agent Instructions

## Objective

Complete requested work autonomously and to production quality while minimizing unnecessary model usage, repeated analysis, tool output, and redundant validation.

Do not trade correctness for token savings.

The repository itself is the primary source of truth. Existing code, tests, configuration, documentation, and `WORK_STATE.md` take precedence over assumptions.

## Start of every task

1. Read `WORK_STATE.md` first when it exists and is relevant.
2. Inspect the current Git branch, working tree status, and recent relevant commits.
3. Identify the smallest part of the repository needed for the requested task.
4. Reuse existing implementation, patterns, helpers, documentation, tests, and prior validation whenever possible.
5. Check whether the requested work is already partially or fully implemented before creating a new solution.
6. Do not recursively read, index, or dump the entire repository unless there is a concrete reason.

Do not repeat completed investigation merely for reassurance when reliable repository evidence already exists.

## Source of truth and project continuity

Before changing behavior:

- prefer current code and tests over assumptions;
- preserve existing conventions unless the task explicitly requires changing them;
- do not invent architecture, APIs, database fields, environment variables, routes, commands, or product behavior that are not supported by the repository or the user's request;
- do not silently replace an existing system with a parallel implementation;
- preserve backwards compatibility when the current project requires it;
- avoid unrelated cleanup and refactors.

If a current requirement conflicts with old documentation, prefer the newest explicit user requirement and update the affected documentation when appropriate.

## Task decomposition

For substantial tasks, determine the technical phases yourself. The user is not expected to decompose software-engineering work.

Use the smallest useful sequence of:

- targeted investigation;
- implementation;
- targeted validation;
- correction;
- final validation;
- documentation/state update;
- commit/push only when requested or explicitly allowed.

Do not ask the user to approve intermediate phases unless:

- the action is destructive and requires confirmation;
- required information is genuinely unavailable;
- there are several materially different product choices that cannot be inferred from the repository or request;
- continuing would contradict an explicit user instruction.

Otherwise continue autonomously.

## Repository exploration

Prefer targeted inspection.

Start with searches for:

- filenames;
- symbols/functions/classes;
- routes/endpoints;
- configuration keys;
- environment variables;
- database models/migrations;
- UI components;
- tests;
- versions;
- exact error messages;
- known feature names.

Do not:

- dump large files when only a section is needed;
- repeatedly reread unchanged files;
- dump large directory trees without a concrete need;
- inspect unrelated components;
- perform a repository-wide audit for a local change unless evidence shows it is necessary.

Expand the search scope only when targeted inspection does not answer the question.

## Implementation rules

Make the smallest coherent change that satisfies the request.

Prefer:

- modifying the existing implementation instead of creating duplicates;
- existing helpers and abstractions instead of new layers;
- local changes over broad refactors;
- explicit behavior over hidden side effects;
- simple code over speculative generalization.

Do not:

- add dependencies unless they provide a clear benefit and existing dependencies cannot reasonably solve the problem;
- change public behavior outside the requested scope;
- rename stable identifiers only for cosmetic reasons;
- create migration or compatibility work without checking whether it is actually necessary;
- rewrite working modules solely to make them stylistically different.

## Frontend and UX changes

When modifying UI:

- preserve the current design system and existing component patterns unless the user explicitly asks for a redesign;
- keep desktop, tablet, and mobile behavior in mind when the affected interface is responsive;
- avoid introducing visual regressions in unrelated areas;
- reuse existing spacing, typography, colors, components, states, and interaction patterns;
- ensure disabled/hidden UI states do not replace required backend validation.

For small visual changes, inspect and modify only the affected components/styles first.

## Backend and API changes

The backend remains authoritative for security-sensitive behavior.

When modifying APIs or server-side logic:

- validate inputs server-side;
- preserve existing authorization rules unless explicitly changed;
- do not rely on the frontend as the sole security barrier;
- keep error handling consistent with existing project conventions;
- preserve compatible response shapes unless the requested change requires otherwise;
- add or update tests for meaningful behavior changes.

## Data and migrations

Before changing persistent data:

1. inspect the current schema/model and existing migrations;
2. determine whether a migration is actually required;
3. preserve existing user/project data by default;
4. avoid destructive migration steps unless explicitly requested and safe;
5. ensure updates do not silently grant privileges, remove data, or alter important behavior.

Never reset, delete, truncate, or recreate production-like data unless explicitly requested.

## Testing strategy

During implementation, run the smallest test set that meaningfully validates the current change.

Prefer, in order:

1. the exact affected test;
2. the affected test file/module;
3. the affected subsystem tests;
4. the broader or complete test suite during final validation when warranted.

Do not rerun the complete test suite after every small edit.

If a broader test run exposes failures:

1. record relevant failures;
2. reproduce them with targeted tests;
3. fix only failures caused by the requested change unless unrelated failures block completion;
4. rerun targeted tests until they pass;
5. rerun the appropriate broader suite once for final confirmation.

Do not chase unrelated pre-existing failures unless they block the requested work. Document them accurately instead.

## Validation without an existing test suite

If the repository has little or no automated testing:

- use the narrowest deterministic validation available;
- prefer build/typecheck/lint/static analysis where relevant;
- validate changed functions, endpoints, commands, or UI paths directly;
- avoid pretending a change is fully validated when only a partial check was possible.

State clearly what was and was not verified.

## Terminal output

Keep tool output concise while preserving enough information to diagnose failures.

Prefer:

- concise Git status and diff statistics before large diffs;
- targeted diffs;
- quiet test output;
- short tracebacks;
- filtered logs;
- small relevant log ranges or tails.

Increase verbosity only when the failure is ambiguous or needs deeper investigation.

Avoid producing or reading thousands of successful or unrelated lines.

## Browser and UI validation

Use browser interaction only when it validates behavior that cannot be checked more cheaply and reliably through code/tests.

Prefer:

- automated tests;
- DOM/state inspection;
- console/network information;
- structured interaction;
- textual assertions.

Do not repeatedly validate the same unchanged UI path.

Do not take screenshots unless they materially help validation or the user explicitly requests visual proof.

## Reasoning and investigation

Do not broaden the task without evidence that it is necessary.

When a hypothesis can be tested cheaply, test it before performing a large investigation.

Do not repeatedly reconsider already validated conclusions unless new evidence contradicts them.

Prefer one precise check over a broad audit.

## Documentation

Update documentation only when:

- the requested change makes existing documentation inaccurate;
- a persistent operational decision should be recorded;
- the user explicitly asks for documentation;
- future agents would otherwise be likely to repeat work or make a wrong assumption.

Do not recreate documentation that already exists.

Keep `WORK_STATE.md` concise and operational. It should contain:

- current stable base when known;
- current work item/lot;
- completed work;
- current branch/commit when useful;
- verified validation results;
- confirmed decisions and constraints;
- actual blockers;
- exact remaining work.

Do not fill it with long reasoning histories, speculative ideas, or raw logs.

## Checkpoints

For long tasks, keep repository state recoverable.

Create coherent commits when appropriate and allowed.

Before an unfinished task ends because of an execution, context, or usage limit, update `WORK_STATE.md` when possible with enough information for a fresh agent to continue without repeating completed investigation.

A continuation agent should trust verified checkpoints unless current repository evidence contradicts them.

## Git rules

Before making changes:

- check the current branch;
- check for uncommitted user work;
- preserve unrelated local modifications.

Do not overwrite or discard user changes.

Before finalizing:

- inspect `git status`;
- inspect the intended diff;
- make sure generated files, debug artifacts, secrets, temporary files, and unrelated changes are not accidentally included.

Do not commit, push, create branches, open pull requests, merge, tag, deploy, or release unless the user explicitly requests it or the current task clearly authorizes it.

## Secrets and sensitive configuration

Never expose, hardcode, commit, or echo secrets unnecessarily.

Treat as sensitive:

- API keys;
- access tokens;
- passwords;
- private keys;
- production credentials;
- connection strings containing credentials;
- secret environment variables.

Use existing secret/configuration mechanisms in the repository.

If a secret appears in tracked code, do not propagate it into new files.

## Dependencies

Before adding a dependency:

1. check whether the project already has a suitable dependency;
2. check whether the standard library or existing code can solve the problem cleanly;
3. add the smallest reasonable dependency only if justified.

Do not perform broad dependency upgrades unless requested or required for the task.

## Performance and token efficiency

Minimize unnecessary model/tool usage by:

- reading only relevant files and ranges;
- using search before full-file inspection;
- reusing known repository facts;
- avoiding duplicate validation;
- avoiding broad rewrites;
- avoiding speculative architecture work;
- keeping command output concise.

Token efficiency must never justify skipping validation needed to establish correctness.

## Final validation

Before declaring software work complete:

1. verify the requested behavior;
2. run the relevant targeted tests/checks;
3. run broader validation when the change warrants it;
4. validate integration/UI behavior only when necessary;
5. verify repository status and intended diff;
6. update `WORK_STATE.md` or documentation when needed;
7. commit/push only when requested.

In the final response, summarize concisely:

- what changed;
- important files touched;
- validation performed and its result;
- remaining limitations or blockers;
- Git commit/branch information only when relevant.

## Release safety

Do not:

- merge a pull request;
- create or push a release tag;
- deploy to production or a real server;
- publish a package;
- modify production data;
- perform another irreversible release action

unless the user explicitly requests that action.

## Découpe AI project rule

Treat `Découpe AI` as an existing project whose implementation must be discovered from the repository.

Do not infer the application's technical stack or functional architecture from its name.

Project-specific architecture, workflows, versions, features, domain rules, and release procedures should be recorded in `WORK_STATE.md` and/or existing repository documentation once verified.
