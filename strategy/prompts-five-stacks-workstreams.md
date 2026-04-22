# Five Stacks — Workstream Prompts

Use these in separate Claude sessions. Each is self-contained with full context.

---

## Prompt 2: Content Batch Creation

```
I need to batch-create content for launching a new brand called Five Stacks.

CONTEXT:
- Five Stacks is a methodology and framework for building business capability through 5 progressive layers: Metrics (visibility), Efficiency (save money), Circularity (keep more money), Resilience (protect your money), Regeneration (find more money).
- Core positioning: "Sustainability is the output, not the objective. The objective is a stronger business."
- The book manuscript is at five-stacks/manuscript-v1.1.md — it's called "The Modern Sustainability Playbook"
- Target audience: SME owner-operators (sub-250 employees), no dedicated sustainability team. EU + USA.
- EU pitch: build sustainability capability, answer questionnaires, access green financing
- US pitch: see where your money goes, stop the leaks, run a tighter operation
- The brand has ZERO existing content — no articles, no social presence, nothing. Starting from scratch.
- Competitors all frame sustainability as compliance. We frame it as business capability and competitive advantage.

WHAT I NEED:
1. Read the book manuscript to extract the strongest ideas, frameworks, and quotable insights
2. Create a content calendar / batch plan for the first 30 days across: Substack (newsletter/long-form), LinkedIn (professional/thought leadership), Bluesky, Mastodon, and Reddit (if applicable — identify which subreddits)
3. For each platform, define: posting frequency, content format, tone, and how it differs from the others
4. Write the first 10 pieces of content across platforms — ready to post. Not drafts, finished pieces.
5. Identify the 5 strongest "hook" ideas from the book that would work as viral/shareable content
6. Suggest a Substack name and structure (free vs paid tiers)

PRINCIPLES:
- Never lead with "sustainability" in US-facing content. Lead with money, business strength, operational clarity.
- No jargon. Write like a smart friend who runs a business, not a sustainability consultant.
- The tone is direct, practical, slightly provocative. Not corporate. Not preachy.
- Every piece should make the reader think "I never looked at it that way."
- No emojis unless the platform convention demands it.
```

---

## Prompt 3: Stacks 2-5 Agnostic Tool Plan

```
I need to create an implementation plan for building Stacks 2-5 of the Five Stacks framework as agnostic (industry-neutral) tools.

CONTEXT:
- Five Stacks is a progressive sustainability operating system for SMEs. Stack 1 (Metrics/Visibility) is built and live.
- The full brainstorm and competitive analysis are at:
  - _shared/five-stacks-brainstorm-feb-2026.md (strategy, MVPs, positioning)
  - _shared/competitive-analysis-five-stacks.md (detailed competitor research per stack)
- Read BOTH files before starting.

THE FOUR STACKS TO PLAN:
- Stack 2 (Efficiency): "Save money" — surfaces patterns in user's own data showing where money leaks. Internal anomaly detection, cross-site comparison, trends, optional sector benchmarks. Improvement tracker.
- Stack 3 (Circularity): "Keep more money" — shows value leaving the system. Flips waste data frame. Category-based pathway suggestions. Initiative tracker. Long-term: marketplace for waste-to-resource matching.
- Stack 4 (Resilience): "Protect your money" — auto-calculated concentration risk from existing data. Supplier, customer, energy, geographic, key-person concentration. Risk gauge + prompt questions. Diversification tracker.
- Stack 5 (Regeneration): "Find more money" — scans proof across all stacks. Maps to certification thresholds, financing eligibility, defensible claims inventory.

WHAT I NEED:
1. Read the brainstorm doc and competitive analysis for full context
2. For each stack, define:
   - Data inputs (what existing Stack 1 data it uses — no new data collection)
   - Analysis logic (what calculations/comparisons/rules to run)
   - UI/UX concept (what the user sees — screens, views, overlays)
   - MVP scope (absolute minimum to charge €10/month for)
   - Build effort estimate (days/weeks for a solo developer)
3. Define the build order and why
4. Identify shared infrastructure needed across all 4 stacks (benchmark data system, improvement tracking, proof documentation)
5. Data model considerations — what needs to be structured now for the future marketplace
6. Technical architecture: these are layers on existing Next.js + Supabase + Zustand stack

PRINCIPLES:
- Agnostic first. No industry-specific logic. That comes in vertical implementations (Ecosystems United = agriculture).
- Tools are lenses, not reports. They add intelligence layers on data already entered in Stack 1.
- Internal self-discovery first, external benchmarks second.
- Always express insights in money (euros), not tonnes or scores.
- The system is a "semi self-help consultant" — it surfaces, prompts, mirrors. Does NOT prescribe.
- Design the data model knowing a marketplace is coming (waste matching, supplier discovery, buyer visibility).
- Simple. The right amount of complexity is the minimum needed.
```

---

## Prompt 4: Stack 3 Circularity Outreach Plan

```
I need to create an outreach plan for Stack 3 (Circularity) of the Five Stacks framework. The long-term vision is a marketplace that matches one company's waste to another's input — the digital, EU-wide version of what NISP (UK National Industrial Symbiosis Programme) proved works. But we start by manually building connections and a database.

CONTEXT:
- Five Stacks is a progressive sustainability operating system for SMEs.
- Stack 3 = "Keep more money" — capture value that's currently leaving the system (waste streams, by-products, underused assets).
- The long game is a circularity marketplace. But marketplaces need supply and demand. So we start manually.
- Read _shared/five-stacks-brainstorm-feb-2026.md — specifically the "Stack 3 Deep Dive: The Circularity Marketplace" section for full context on NISP, Sfridoo, FLOOW2, and Excess Materials Exchange.
- I am based in Rome, Italy. Italian manufacturing clusters are a natural starting point.
- The first ~100 connections/entries should be free to build the database and prove the model. Then start charging.

MODELS TO STUDY AND STEAL FROM:
- NISP (UK): Facilitated workshops, £1.1B in cost reductions for SMEs. Blueprint.
- Sfridoo (Italy): B2B waste marketplace, freemium + pro, Italian manufacturing clusters.
- FLOOW2 (Netherlands): Asset sharing marketplace, SharingScan financial calculator.
- Excess Materials Exchange (Netherlands): AI-powered waste-to-revenue matching.
- Kalundborg Symbiosis (Denmark): Original industrial symbiosis network since 1961.

WHAT I NEED:
1. An outreach strategy: who to reach out to first, how to find them, what to say
2. Target segments: which industries/sectors have the most valuable waste-to-resource matches? (Start with highest opportunity, not broadest reach)
3. A pitch framework: how to explain "your waste has value" in 30 seconds to an SME owner who's never thought about it
4. Database structure: what information to collect from each company (waste streams, volumes, materials, location, industry, current disposal method/cost)
5. A simple matching methodology: how to identify potential matches even manually
6. Geographic strategy: start in Rome/Lazio? Italian manufacturing districts? Go broader?
7. Channel strategy: cold outreach? Industry association partnerships? Chamber of commerce? Trade fairs? Online communities?
8. The free-to-paid transition: when and how to start charging (after 100 entries? After first successful match? What to charge?)
9. Legal/regulatory considerations for waste exchange in Italy/EU
10. How this feeds the platform: how manual outreach data eventually becomes the digital marketplace

PRINCIPLES:
- Start manual. Don't build the marketplace platform yet. Build the database and the connections first.
- The pitch is always about money: "You're paying to dispose of this. Someone else would pay for it."
- Geographic proximity matters — transport costs kill long-distance waste exchange.
- Trust matters — facilitated introductions > cold marketplace listings.
- Even 2-3 successful matches is a proof point worth more than 1,000 listings.
- This is the path to a movement. But today it starts with a spreadsheet and a phone.
```

---

*Created Feb 21, 2026. Use each prompt in a separate Claude session for focused work.*
