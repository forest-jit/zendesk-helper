# Development design skills

These skills support local review and design work. The Chrome extension does not load them at runtime.

| Skill | Official source | Installed revision | License / runtime note |
| --- | --- | --- | --- |
| `frontend-design` | `anthropics/skills/skills/frontend-design` | `2c5958ecac7cee2b583967a2c4981d0f4a75c579` | Apache-2.0 in the skill's `LICENSE.txt`; instruction-only, with no scripts or package dependencies. |
| `web-design-guidelines` | `vercel-labs/agent-skills/skills/web-design-guidelines` | `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62` | No license file or license field was present for this skill at the recorded revision. Instruction-only, but each use requests the current rules from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`; review that moving content before relying on it. |
| `impeccable` | `pbakaus/impeccable/.agents/skills/impeccable` | `924bbd194d02e5e15a227e75b5901fb0d7a4ecad` | Apache-2.0 at the repository root. Installed by manual skill-folder copy only: no design hook, live overlay, persistent engine, telemetry, or bypass-sandbox fallback. The one required context run used a checksum-verified engine cached under `/tmp`. |

Project-local copies live under `.agents/skills/`. Updating them is a deliberate maintenance task: inspect the new source and license, record the new commit here, then replace the copy.
