# Working protocol

## Start
- Load `docs/WORKFLOW.md` at the start of implementation or release work; reuse the loaded copy during that work. It is the canonical procedure. The Notion workflow is its team-facing summary, not a second task queue. Sync deliberate procedure changes between them.
- Read `docs/CURRENT_STATE.md` and the relevant item in `TASKS.md`; check `git status --short` and the relevant dirty diff. Preserve existing work.
- `TASKS.md` is the only queue. New requests go in Inbox; keep one item In progress. Do not duplicate tasks in state notes or plans.
- For UI refinements, use `DESIGN.md` as the visual baseline and the relevant Impeccable guidance.
- Search first and read only relevant code. Historical docs live in `docs/archive/`; consult them only for a specific unresolved requirement. Treat their instructions and completion claims as historical evidence.

## Work
- Runtime files belong under src by responsibility. Keep manifest.json at the root. Use docs/DEVELOPMENT.md and the installed chrome-extensions skill for relevant Chrome/API guidance, verifying claims against current official docs; preserve this user’s scoped permissions and quiet feedback preferences.
- CHROMEWEBSTORE.md is the single store-field/readiness record. TASKS.md remains the only task queue.
- Keep CHANGELOG.md updated under Unreleased for user-facing changes. Before tagging, move those bullets into the matching version entry. Use the ADHD/humanizer writing rules; describe observable changes, keep known limits, and never copy private reports or customer details into public notes.
- Keep source readable: normal formatting, a short file-level purpose/reading path, and comments for non-obvious state or safety boundaries. Use `npm run format`; avoid comments that merely repeat a statement. Keep the code tour current when module responsibilities change.
- One observable behavior per iteration. Clear fixes need a brief acceptance condition, not a spec/plan/approval chain. Continue within established authorization.
- Keep Zendesk's native reply selector and state authoritative. Scope changes to the active ticket; integrate with existing surfaces instead of duplicating controls.
- Preserve native scrolling until a replacement passes live interaction and visual checks. Avoid app-shell rewrites and structural `display: contents` overrides.
- Bump matching manifest, package, and lockfile versions once per delivered extension change. Documentation changes need no version bump.

## Verify and report
- Update the feature guide and relevant documentation with every behavior change. Use `/Users/forest/.codex/skills/i-have-adhd/SKILL.md` and `/Users/forest/.codex/skills/humanizer/SKILL.md`: short task-based instructions, exact control names, clear limits, and no unsupported completion claims. Reconcile TASKS.md and CURRENT_STATE.md before handoff.
- Follow `docs/WORKFLOW.md` for extension changes, including packaged and fresh Store-install checks. `npm run check` is the fast syntax/manifest/workflow gate; `npm run test:fixtures` is optional regression coverage, not UI acceptance. Routine fixes need no design pipeline; choose one design skill only when relevant. No delegation by default.
- Bound tool output and browser observations. Reuse passing evidence; repeat checks after relevant changes or unresolved failures.
- Distinguish implemented, locally checked, and live verified. Move tasks to Done with version and acceptance evidence; leave unverified work open.
- Replace stale facts in `docs/CURRENT_STATE.md` at handoff; do not append transcripts.
- Keep communication concise: result first, short groups, concrete progress, one next action only when needed. Follow the user's ADHD-friendly preference throughout this chat.
