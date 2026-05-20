# CLAUDE.md

Context handoff for future Claude Code instances picking up this project. Read this first before doing anything.

---

## 1. Project overview

- Personal portfolio site for **Maanasa Sivashankar**, service designer.
- Repo: https://github.com/Maanasa02/personal-website
- Production deploy: GitHub Pages, expected URL `https://maanasa02.github.io/personal-website/`.
- Stack: static HTML/CSS/JS. **No build step.** Edit files, open in browser, done.

---

## 2. File structure

Top level (`/Users/jaison/Desktop/maanasa/` on this laptop):

- `index.html` — About page. Hero + **Selected Work** carousel + Exhibitions / Publications / Speaking lists.
- `project-1.html` — Police Hiring Redesign.
- `project-2.html` — San Francisco's Homeless Response (ASTRID).
- `project-3.html` — Penske Truck Leasing.
- `project-detail.html` — leftover generic template, not linked anywhere. Safe to delete on request.
- `css/style.css` — single shared stylesheet, ~1500 lines.
- `js/main.js` — mobile nav toggle + work-carousel arrow scroll.
- `project1-title.jpg`, `project2-title.jpeg`, `project3-title.jpg` — hero images for carousel cards on the About page.
- `README.md` — minimal repo readme.

---

## 3. Design system

Defined in `css/style.css`.

CSS variables in `:root`:
- `--bg`, `--fg`, `--muted`, `--accent`, `--border`, `--card`
- `--max-width`, `--radius`
- `--font-sans`, `--font-serif`

Fonts:
- **Serif:** Georgia (used for `.page-title`, `.page-lede`, body copy on project pages).
- **Sans:** system stack (used for nav, labels, meta).

Key shared classes available to all pages:
- Layout: `.page`, `.container`, `.page-title`, `.page-lede`
- Project body: `.project-content`, `.project-callout` (orange-bordered italic quote)
- Stats: `.stat-row`, `.stat`
- Source quotes: `.doc-excerpt`
- Image placeholders: `.needs-image`, `.needs-image-placeholder`, `.needs-image-label`, `.needs-image-desc`
- Overview block: `.overview-grid`, `.overview-item`, `.overview-label`, `.overview-body`
- Work carousel (About page): `.work-section`, `.work-carousel`, `.work-card`
- Extras (About page): `.extras-section`, `.extras-list`, `.extras-item`

Mobile breakpoints:
- `860px` — general layout collapse.
- `640px` — nav toggle activates.

---

## 4. Page patterns

Every project detail page (`project-1.html`, `project-2.html`, `project-3.html`) follows the same anatomy:

1. Top nav — logo removed, just `About` + `LinkedIn` (external link).
2. back-link `← Back to work` pointing to `index.html#work`.
3. `<h1 class="page-title">` + `<p class="page-lede">` + `<dl class="project-meta">` with **Client / Role / Year**.
4. `<section class="overview-grid">` — three-column **Challenge / Solution / Outcome**. No `border-top`, only `border-bottom`.
5. `<article class="project-content">` — H2/H3 sections sourced from the docx, using `.stat-row`, `.doc-excerpt`, `.project-callout`, and `.needs-image` placeholders as needed.
6. Footer — copyright only.

---

## 5. Content rule: artifacts vs concepts

**This is critical. Read carefully.**

- **Use a real image file** for the designer's actual artifacts: wireframes, prototype UI screens, journey maps, hand-drawn sketches, service blueprints as deliverables, photos of workshops.
- **Recreate in HTML/CSS** for concept content: stat blocks, doc excerpts, structured comparisons, simple diagrams that are conceptual rather than authored.
- **When in doubt, prefer a `.needs-image` placeholder** and ask the user for the artifact.

---

## 6. Workflow rules (HOW THE USER WANTS CLAUDE TO WORK)

These rules override Claude's defaults. Follow them strictly.

- **Always delegate to sub-agents.** Claude never edits files directly on this project. Spawn an Agent with the work, let it verify, report back.
- **Always run sub-agents in background** — every Agent call uses `run_in_background: true` so the user can keep chatting while work happens. Never block on a foreground agent.
- **Verify after every change.** After any file edit, fire a follow-up background agent that captures screenshots of affected pages (desktop + mobile) and reviews for visual regressions.
- **Never run two file-editing agents in parallel.** Serialize them. Wait for completion notifications.
- **Use the screenshot QA tool when available** (see Section 7). On a fresh clone, this tooling is NOT in the repo — it lives in the `screenshots/` directory which is gitignored.

---

## 7. Screenshot QA tooling (THIS LAPTOP ONLY; not in repo)

The `screenshots/` directory contains a puppeteer-based capture script:

- `capture.sh` / `capture.js`
- Usage: `node screenshots/capture.js <path> <desktop|mobile> <output.png>`
- Viewports:
  - desktop: **1280x800**
  - mobile: **390x844**
- Output is auto-chunked: PNGs limited to **1900px tall** to stay under Anthropic's 2000px image-read limit.
- Long pages produce multiple chunks (e.g. `output.png`, `output-2.png`, `output-3.png`, ...).

**This tooling is gitignored.** It will NOT be present after a fresh clone. To reinstate:
```bash
npm init -y
npm install puppeteer-core
# then recreate screenshots/capture.js
```
The script can be re-derived from Claude's chat history if needed — tell the user.

---

## 8. Current state — known TODOs

**Image placeholders on `project-2.html` (9 total):**
- Layer 1 cross-departmental swimlane
- Theory-of-change
- CRIT Team Summary
- Layer 3 SPL acuity (Jane Doe)
- Rapid Access prototype
- Layer 4 Response Team wireframes
- Follow-up Team wireframes
- Paper-prototype photo
- Senior Women pilot timeline

**Image placeholders on `project-1.html` (4):**
- Funnel diagram
- Cross-agency journey map
- Shared hiring dashboard
- Service blueprint

**Image placeholders on `project-3.html` (3):**
- Billing journey map
- Rhythm of Work diagram
- Customer Start-up Visual

**Open content items — project-3:**
- Year is `"2022"`.
- Client is `"Penske Truck Leasing (via Zenda Consulting)"`.
- Lede is agent-written; the user may want different wording.

**Open content items — project-2:**
- Various small content questions flagged in prior sessions (acuity score values, etc.). Check session memory if accessible.

**Cleanup:**
- `project-detail.html` is a dead leftover. Safe to delete on request.

---

## 9. Local development

```bash
cd /path/to/personal-website
python3 -m http.server 8000
# open http://localhost:8000
```

That's it. No build, no watcher, no install.

---

## 10. Git workflow

- **Remote:** `git@github.com:Maanasa02/personal-website.git` (SSH only).
- **Default branch:** `main`.
- **Pre-push hook on this laptop blocks direct pushes to main.** Use feature branches:
  ```bash
  git checkout -b update/<short-description>
  # commit
  git push -u origin update/<short-description>
  # open PR on GitHub, merge there
  ```
- The initial bootstrap commit was pushed with `--no-verify` (one-time exception). Don't do this again.

**SSH config on this laptop:**

The repo's `core.sshCommand` is set to:
```
ssh -i ~/.ssh/id_maanasa -o IdentitiesOnly=yes -o IdentityAgent=none
```

This is because macOS Keychain was silently substituting a different key (`jaisontj`'s) via the Apple ssh-agent. On a new laptop with a fresh SSH setup, this config likely isn't needed — git will use the default key.

**Local git identity for this repo (set via `git config --local`, NOT global):**
```
Maanasa Sivashankar <maan.shiv@gmail.com>
```

---

## 11. What's gitignored

From `.gitignore`:
- `screenshots/` — QA tooling, debug captures, and `Penske.docx` source file.
- `*.docx` — content source files, kept locally.
- `Screenshot 2026-05-19 at *.png` — 15 source screenshots from the user, kept locally.
- `123.png`, `p1-1.png` … `p1-4.png`, `challenge.png` — reference inputs.
- `node_modules/`, `package.json`, `package-lock.json` — dev tooling only (existed for the screenshots/ tooling).
- `.DS_Store`, `*.log`, `.tmp/`, `tmp/`
- `.vscode/`, `.idea/`

---

## 12. Source content files (kept locally only)

- `Cross-Department Homelessness Coordination.docx` — source for project-2 body content.
- `PoliceHiringRedesign.docx` (also referred to as `Police Hiring Redesign.docx`) — source for project-1 body content.
- `screenshots/Penske.docx` — source for project-3 body content.

These docx files are the content sources. When the user edits one, the corresponding HTML page's body should be re-synced — **preserving the header, the `.overview-grid` block, and any `.needs-image` placeholders**.

To extract docx text:
```bash
textutil -convert txt "<file>.docx"
```

---

## 13. Deployment

- GitHub Pages target: `https://maanasa02.github.io/personal-website/`.
- To enable: GitHub repo → **Settings → Pages → Source: `main`, root folder**.
- Future: point a custom domain via DNS.

---

## 14. Quick orientation for a new Claude instance

- Read this CLAUDE.md first.
- The user's preferred workflow is in **Section 6** — follow it strictly (delegate, background, serialize, verify with screenshots).
- If continuing where we left off, the most likely next requests are:
  1. Replacing `.needs-image` placeholders with real images the user provides.
  2. Further content polish on any of the three project pages.
  3. Enabling GitHub Pages.
  4. Custom domain setup.
- Confirm the screenshot QA tool exists (Section 7) before relying on it. If missing, tell the user it can be re-derived from chat history.

---

## 15. Session memory archive (host-specific, captured at handoff)

These are the persistent memory entries Claude built up while working on this project. Most of the rules are already summarized in Sections 6–7 above, but the full text is included here so a future Claude instance can see the original phrasing and the "why" behind each rule.

### feedback_delegate_to_subagents.md

---
name: Always delegate work to sub-agents
description: User wants all implementation work delegated to sub-agents so the main conversation stays free for back-and-forth
type: feedback
originSessionId: 6eca9525-deeb-483f-bc8c-59803df4f4ec
---
NEVER do implementation work directly (edits, writes, file changes, running commands to fix things). ALWAYS spawn a sub-agent via the Agent tool to do the work, instruct it to verify the change works, and then report back to the user with a summary so they can refresh and check.

**Why:** User explicitly requested this workflow on 2026-05-19. They want the main conversation thread reserved for discussion and direction — work happens in parallel via sub-agents so iteration is faster.

**How to apply:**
- For ANY task on this project (file edits, content updates, styling fixes, new pages, bug fixes, etc.): spawn a sub-agent with a clear, self-contained brief including file paths and what to change.
- Tell the sub-agent to verify its work (e.g. curl localhost, read back the file, check the change rendered correctly).
- Only do the work directly if the user explicitly says "you do it" or similar override.
- Exception: trivial conversational responses (clarifying questions, planning discussions, reading memory) don't need an agent.
- Exception: saving/reading memory itself is fine to do directly.

---

### feedback_background_agents.md

---
name: Always spawn sub-agents in the background
description: User wants to keep chatting while sub-agents work — never spawn agents in the foreground
type: feedback
originSessionId: 6eca9525-deeb-483f-bc8c-59803df4f4ec
---
When delegating work to a sub-agent via the Agent tool, ALWAYS pass `run_in_background: true`. Never spawn an agent in the foreground for this project.

**Why:** User said directly on 2026-05-19: "your sub agent needs to be in the background, otherwise you're waiting for it to finish working before I can interact with you; that doesnt add any value to me." Foreground agents block the conversation; the whole point of delegating is so the user can keep directing while work happens in parallel.

**How to apply:**
- Every Agent tool call → `run_in_background: true`.
- After spawning, tell the user the agent is running in the background and they can keep going.
- I'll be notified automatically when the agent completes; I do NOT poll or sleep.
- Exception: only spawn foreground if the user EXPLICITLY says "wait for it" or "I want to see the result before I do anything else."
- If multiple independent jobs come in, fire multiple background agents in parallel — but for THIS project specifically, avoid parallel agents that touch the same files (edit conflicts). Sequential background agents are the default for file-editing work.

---

### feedback_verify_after_changes.md

---
name: Verify affected pages after every change
description: After any file change on the maanasa portfolio, spawn a background agent to capture + visually review the affected pages and fix new bugs
type: feedback
originSessionId: 6eca9525-deeb-483f-bc8c-59803df4f4ec
---
After any change that affects the rendered portfolio at `/Users/jaison/Desktop/maanasa/`, automatically spawn a background sub-agent to: (1) capture fresh screenshots of the affected pages in desktop AND mobile, (2) Read the PNGs and look for visual regressions or new bugs, (3) fix what it finds, (4) re-capture and confirm. Always background, never foreground.

**Why:** User said on 2026-05-19: "rather than auto loop; how about you check everytime you make a change; so first pass run through everything we have so far; and then each time a page changes or something that affects a page changes, check all the affected pages." This is reactive QA — cheaper and more targeted than polling.

**How to apply — "affected pages" scope:**

| Change | Affected pages |
|---|---|
| Edit `css/style.css` | ALL 6 pages (index, projects, project-detail, project-2, information, methods, plus any future project-N) |
| Edit `js/main.js` | ALL pages (shared script) |
| Edit a single HTML page | just that page |
| Edit `projects.html` (card links) | projects.html + any project detail page it newly links to |
| Add/replace an image asset | only pages referencing it |
| Add a new HTML page | the new page only |

**Workflow each time:**
1. Sub-agent does its edit work and reports done.
2. As soon as it finishes (do NOT run in parallel with the edit agent — wait for completion notification), spawn a SECOND background agent: the "verify pass."
3. The verify agent uses `screenshots/capture.sh` to capture each affected page at desktop (1280x800) + mobile (390x844), Reads each PNG, lists bugs, fixes them serially, re-captures the affected ones, reports back with a clean/dirty summary.
4. If the verify agent itself made edits, repeat — spawn another verify pass on top of the fix. Stop when the verify pass returns CLEAN.

**First pass:** When this rule is first established (or whenever the user requests a baseline), the verify agent runs against ALL 6 pages × 2 viewports as the starting state.

**Constraints:**
- Never run two file-editing agents in parallel. Wait for completion notifications. The user explicitly flagged conflict avoidance.
- Don't fire verify passes for memory updates, sub-agent reports, or other non-rendering changes — only when the actual portfolio files (HTML/CSS/JS/images) change.

---

### feedback_artifacts_stay_as_images.md

---
name: Designer's actual artifacts must stay as images, not CSS recreations
description: For wireframes, prototypes, UI screenshots, hand-drawn deliverables — use real image files. Only recreate concept content in HTML.
type: feedback
originSessionId: 6eca9525-deeb-483f-bc8c-59803df4f4ec
---
When deciding HTML-vs-image for a portfolio section, the line is: **what is the section SHOWING?**

- **Use a real image file** when the section's point is to show an actual design artifact the user produced — wireframes, prototype UI screens, mood boards, hand-drawn sketches, journey-map deliverables, photographs of physical workshops. The artifact IS the evidence of the work; an HTML recreation loses that evidence and undersells the user's craft.
- **Recreate in HTML/CSS** when the section is communicating concept content — theory-of-change diagrams (as long as they're not the designed deliverable itself), stat blocks, timeline rows, key quotes, structured comparisons, doc excerpts. These are explanatory, not artifacts.

**Why:** User said on 2026-05-19, looking at the Layer 4 wireframe section that had been CSS-recreated as empty phone outlines: "this is a great example where I want to use the pic I have and not create a web version of the wireframe cause the point is to show an image of what I really did." The portfolio's job is to show evidence of design work — recreating deliverables in HTML defeats the purpose.

**How to apply:**
- When a sub-agent is converting screenshots to HTML and encounters something that looks like a *deliverable artifact* (UI mock, wireframe, prototype, sketch, formal diagram the designer produced as output), flag it as NEEDS_IMAGE — don't auto-recreate.
- The agent's bias should be: when in doubt about whether something is "designed artifact" vs "explanatory content," prefer NEEDS_IMAGE for visual deliverables. The user prefers placeholders that prompt for the real asset over CSS recreations that miss the artifact's quality.
- Concept diagrams that are clearly explanatory (e.g. a 3-stage process pipeline, a 4-quadrant matrix) can still be HTML — those aren't typically "the deliverable."
- For project-2.html specifically: wireframes (Layer 4) MUST be images. Reconsider the prototype-figure (Layer 3 Rapid Access mock) and acuity-figure (SPL Jane Doe view) — these may also be actual UI artifacts that should be images rather than CSS recreations.

---

### reference_headless_screenshots.md

---
name: Headless Chrome screenshots for visual QA
description: How to capture and view screenshots of the maanasa portfolio site to verify rendering
type: reference
originSessionId: 6eca9525-deeb-483f-bc8c-59803df4f4ec
---
A headless-Chrome screenshot workflow is set up for the portfolio site at `/Users/jaison/Desktop/maanasa/`. Use it to visually verify rendering rather than only checking HTML/CSS source.

**Wrapper script:** `/Users/jaison/Desktop/maanasa/screenshots/capture.sh`

Usage from a sub-agent:
```
/Users/jaison/Desktop/maanasa/screenshots/capture.sh /projects.html mobile mobile-projects.png
/Users/jaison/Desktop/maanasa/screenshots/capture.sh /index.html desktop desktop-index.png
```

Arguments: `<path> <desktop|mobile> <output-filename>`. Files land in `/Users/jaison/Desktop/maanasa/screenshots/`.

Viewports: desktop=1280x800, mobile=390x844. Captures are **viewport-only** in this Chrome version (148.x) — full-page scroll capture is not supported via CLI. For long pages, capture multiple viewport heights by scrolling the URL with `#fragment` jumps, or accept that you only see the above-the-fold view.

**Server prerequisite:** A local server must be running at http://localhost:8000 (`python3 -m http.server 8000` in the project root). The screenshot script hits localhost, so screenshots reflect whatever is on disk.

**When to use:**
- Before reporting a UI change as complete, capture the affected page(s) at both desktop and mobile, Read the PNG yourself, and verify rendering matches intent.
- When debugging a visual bug the user described, capture first, then look — don't guess from CSS alone.
- After any CSS edit that touches layout / spacing / typography.
