# Dispatch Tag Taxonomy

Reference for any parallel workstream (Supabase, CMS, analytics, content tooling) that needs to handle dispatch post categorization.

## Model

Every dispatch post has:
- **Exactly one stack** (the framework dimension) — required
- **One or more topics** (the subject dimension) — at least one

Stacks describe *where in the framework* the piece sits. Topics describe *what it's about*. They are orthogonal — a post can be `Stack 4 · Resilience` AND `Supply Chain` AND `Risk` AND `Automation`.

## Stacks (closed set — do not extend)

| slug | display | order |
|---|---|---|
| `baseline` | Stack 1 · Baseline | 1 |
| `efficiency` | Stack 2 · Efficiency | 2 |
| `margin-recovery` | Stack 3 · Margin Recovery | 3 |
| `resilience` | Stack 4 · Resilience | 4 |
| `compounding` | Stack 5 · Compounding | 5 |

These are the framework. They will not change. Any tooling can hardcode them.

## Topics (closed set — extend only with deliberation)

| slug | display | scope |
|---|---|---|
| `energy` | Energy | prices, kWh, gas, grid |
| `supply-chain` | Supply Chain | suppliers, sourcing, logistics |
| `regulation` | Regulation | CSRD, CBAM, CSDDD, compliance |
| `margin` | Margin | cost-per-unit, pricing, profitability |
| `waste` | Waste | efficiency, remanufacturing, circularity |
| `data` | Data | measurement, baselines, feedback loops |
| `risk` | Risk | disruption, fragility, scenario planning |
| `strategy` | Strategy | downturns, positioning, long game |
| `automation` | Automation | AI, tooling, systems |

**Rules for adding a new topic:**
1. It has appeared in at least 2 published posts (or is planned for 2+).
2. It is not a synonym of an existing tag.
3. It is not universal (e.g. "SME" was rejected because every post is for SMEs — a tag that applies to everything is noise).
4. Reviewed and approved before adding to the taxonomy.

**Held / rejected tags** (do not reintroduce without discussion):
- `sme` — universal, no signal
- `workforce` — no current content
- `capital` — no current content

## Current post → tag mapping

| slug | stack | topics |
|---|---|---|
| `mod-w1-monday-baseline` | baseline | energy, margin |
| `mod-w1-tuesday-efficiency` | efficiency | waste, margin |
| `mod-w1-wednesday-margin` | margin-recovery | energy, waste |
| `mod-w1-thursday-resilience` | resilience | supply-chain, risk, automation |
| `mod-w1-friday-compounding` | compounding | data |
| `gain-ground-in-downturn` | baseline | strategy, risk |
| `regulation-is-here` | compounding | regulation, data |
| `supplier-problem` | resilience | supply-chain, risk |
| `margins-you-cant-see` | baseline | margin, data |
| `energy-crisis-operations` | baseline | energy, strategy |

## Suggested Supabase schema

```sql
create table stacks (
  slug text primary key,
  display text not null,
  ordinal int not null
);

create table topics (
  slug text primary key,
  display text not null
);

create table posts (
  slug text primary key,
  title text not null,        -- the question
  subtitle text,              -- the fact
  published_at date,
  stack_slug text references stacks(slug),
  url text                    -- /dispatch/<slug>.html
);

create table post_topics (
  post_slug text references posts(slug) on delete cascade,
  topic_slug text references topics(slug) on delete cascade,
  primary key (post_slug, topic_slug)
);
```

Notes:
- `stack_slug` is **nullable** if you want to allow stack-less posts in the future, but right now every dispatch post has one. Make it `not null` if you want to enforce that.
- Seed `stacks` and `topics` from the tables above.
- Topics are many-to-many; stack is single-valued (one-to-one from post to stack).

## Display rules

- Stack chip: filled (dark background, light text).
- Topic chip: outlined (transparent background, border).
- Order on cards: stack first, then topics in the order listed in the post mapping above.
- See `dispatch.css` (`.chip`, `.chip-topic`, `.blog-card-chips`) for the canonical styles.

## Source of truth

This file is the source of truth for the taxonomy. The HTML in `dispatch/` reflects it manually right now — there is no generator. If a parallel workstream introduces a database, this file should be migrated into seed data and this doc updated to point at the seed.
