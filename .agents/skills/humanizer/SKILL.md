---
name: humanizer
description: Rewrite or review AI-sounding prose in the writer's voice while preserving meaning. Use when the user asks to humanize text or remove formulaic phrasing, inflated language, or chatbot residue, including prose in files. Does not determine whether text was AI-generated.
license: MIT
metadata:
  version: "4.0.0"
---

# Humanizer

Make prose sound like its writer while keeping what it says. Edit for the intended reader and genre, rather than replacing one formula with another.

## Editing approach

Read the full passage and any supplied voice sample before rewriting. Look at paragraph shape as well as individual sentences: a contrast split across sentences, three interchangeable examples, and a repeated closing line can be the same habit at different scales.

For the detailed diagnostic categories and examples, read [references/patterns.md](references/patterns.md) when reviewing systematically, explaining an edit, or resolving an ambiguous pattern. Ordinary short rewrites can use the priorities below directly:

- State the point without staged openers, artificial contrasts, imaginary objections, or closers that repeat it.
- Vary repetitive sentence shapes. Keep lists whose items convey distinct information.
- Replace inflated claims, sales language, vague authority, and empty abstractions with the supported point.
- Remove decorative formatting and chatbot wrappers when they do not belong in the target document.
- In replies with visible conversation context, lead with the decision and retain the reasoning the reader needs to assess or act on it. Do not assume unseen background is already known.

Treat these as contextual editing signals, not proof of authorship or a banned-word list. Keep a deliberate contrast, useful repetition, technical term, or formal phrasing when it serves the meaning. Preserve quotations, titles, proper names, and passages discussing a phrase rather than using it.

## Meaning and voice

Preserve facts, names, quantities, dates, citations, rankings, qualifications, and relationships such as causation or simultaneity. Remove redundancy and unsupported rhetorical conclusions without silently deleting substantive claims. If a claim appears doubtful, flag it separately when useful; a style edit does not authorize inventing its replacement. Keep direct quotations verbatim unless the user explicitly asks to edit them.

Use only details supplied in the material or established by the task context. Do not invent examples, sources, personal reactions, biographical details, or first-person experiences to make prose feel human. Ask for a missing detail only when needed; otherwise use a simpler sentence. Preserve real uncertainty, source limitations, temporal scope, legal notices, and safety information.

A supplied writing sample takes precedence over stylistic defaults: match its vocabulary, rhythm, punctuation, openings, and transitions. Without a sample, infer the voice from the text and its audience. Preserve opinions, humor, asides, mixed feelings, and unusual details already present. Keep reference and technical prose neutral and precise. Do not add slang, deliberate errors, or anecdotes solely to sound human.

By default, replace em dashes, parenthetical en dashes, and spaced double hyphens used as sentence connectors with punctuation that clarifies the relationship. If a voice sample uses dashes, match its approximate rate. Preserve meaningful range notation, minus signs, proper names, quotations, and protected technical content.

After rewriting, compare against the original for lost or altered claims. Then read for natural flow, checking especially for artificial contrasts, repetitive closers, forced triads, excessive dashes, and unnecessary bold labels. Rewrite an awkward paragraph around its main point instead of patching words mechanically.

## Output modes

Follow the user's requested format when given. Otherwise:

- **Pasted prose:** Return a draft, a short list of patterns still worth addressing (or say none), and the final rewrite. Keep the review brief.
- **Named file to edit:** Read the whole current file, in chunks if necessary. Write only the final prose into it. Preserve code blocks, inline code, commands, paths, YAML metadata, structured data, and link targets. Retain meaningful document structure. Summarize the scope covered and any omissions; report a partial review as partial. A file supplied only for review is not an instruction to overwrite it.
- **Embedded use:** When this skill supports a larger task such as a PR description, commit message, or document, return only the final text needed by that task.

## Provenance

Adapted from the user's Humanizer v4.0.0 draft, whose stated inspiration is Wikipedia's “Signs of AI writing” and reviews of generated prose. These are editing heuristics, not an authorship test.
