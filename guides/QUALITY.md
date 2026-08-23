# Daily Game quality bar

This file is a guardrail against the project drifting back toward generic AI output. Read it before making a daily entry.

## Games

A daily game should have a specific idea, not a familiar mechanic with a new color palette. Classic genres are welcome, but the implementation needs a reason to exist: a strong rules twist, unusually good level design, a distinctive control scheme, or enough systems and polish to stand on its own.

Design for a phone first. The primary interaction must be comfortable on a roughly 360 px wide touchscreen without hover, tiny targets, or three-finger gymnastics. Then add keyboard and mouse controls where useful. Test restart, win/loss, resizing, orientation changes, and repeated play. Never make desktop controls and then bolt three translucent circles onto the bottom of the mobile version.

Each game should have its own visual identity. Avoid recurring AI UI defaults such as glass panels, blue-purple gradients, excessive rounded cards, pill labels, and generic dashboard HUDs. Those elements are allowed when the game itself calls for them, not as a house reflex.

A "high-effort" game usually has several of these: hand-built levels or meaningful procedural generation, a progression curve, good feedback, animation, generated audio, saved progress/scores, accessibility/reduced-motion consideration, a tutorial that teaches by play, and a replay reason. Quantity cannot rescue a weak core mechanic.

Create a custom `preview.svg` for every game. It should communicate that game's actual visual identity, not be a generic icon on a gradient.

## Articles

Before drafting every article, read the current versions of:

- https://github.com/asavvin-pixel/unslop/blob/main/SKILL.md
- https://github.com/asavvin-pixel/unslop/blob/main/references/blacklist.md
- https://github.com/asavvin-pixel/unslop/blob/main/references/prose-benchmarks.md

Research first. Use at least two reliable sources when the subject contains factual claims, and link the sources in the article. Prefer primary sources, papers, official records, books, or strong reference works over SEO summaries. Do not invent an anecdote, number, quotation, study result, or "typical" example to make the prose lively.

Do not build the article around a model-shaped thesis template. Avoid punchline paragraphs, repeated aphoristic endings, fake casual hooks, neat rules of three, and claim → explanation → lesson repeated section after section. Let confidence vary with the evidence. A useful side path is better than a perfectly symmetrical outline. Stop when the material is finished instead of writing a ceremonial conclusion.

The article page may include a small subject-specific interactive, diagram, table, or illustration when it genuinely helps. That is preferable to decorative cards.

## Site design

The homepage identity is intentionally editorial: paper, ink, hard rules, oversized type, one loud accent, custom game posters, and an archive that behaves like an index. Do not convert it back into a SaaS landing page.

The design process should follow the useful parts of James Presbitero's "5 AI Website Design Tips For Websites That Doesn't Look AI-Built": collect references, make deliberate identity choices, build custom assets, decide structure before decoration, and push past the model's first safe default.

Reference: https://unpromptable.substack.com/p/5-ai-website-design-tips-for-websites
