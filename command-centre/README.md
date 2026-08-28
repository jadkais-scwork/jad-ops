# Jad Command Centre

A published artefact showing Jad's operating picture for the day: the focus queue,
the shape of the day, Launch Pad bookings and staffing, open asks, the week, and
low-stakes overdue admin.

**Live page:** https://claude.ai/code/artifact/175a2573-54d8-41ee-a544-dc92a45754a8

It is a **snapshot, not a live feed.** The page carries its data baked in, so it needs
no runtime capabilities, works for anyone the page is shared with, and renders even if
the connectors are down. A Routine refreshes it.

## How it fits together

```
data.json        the only file the Routine rewrites — all page content, no markup
template.html    page shell: fonts, design tokens, all CSS, the freshness script
build.mjs        renders data.json into the template (server-side, no client JS needed)
dist/index.html  the generated file that gets published — never edit by hand
```

Rebuild with:

```
node command-centre/build.mjs
```

## Refreshing the page

1. Rewrite `command-centre/data.json` from the connected sources.
2. `node command-centre/build.mjs`
3. Publish `command-centre/dist/index.html` with the Artifact tool, passing the live
   URL above as `url` so it updates in place instead of creating a second artefact.
   Omit `favicon` on a republish — the page keeps the icon it has.
4. Commit `data.json` and `dist/index.html` so the history shows what the board said
   on any given day.

Step 3 is the one that is easy to get wrong: **publishing without `url` makes a new
artefact at a new address**, and Jad's bookmark keeps showing the old one.

## The shape of data.json

| Key | What it drives |
|---|---|
| `meta` | Date line, the "updated N ago" chip (`generatedAtISO` feeds it), source health row |
| `tiles` | The four headline counts. `tone`: `accent`, `critical`, `warn`, `neutral` |
| `focus` | Today's ranked queue. Order is meaningful — it is the priority order, and the page numbers it |
| `schedule` | `allDay[]` plus `items[]`. `kind`: `event`, `meeting`, `focus`, `task`, `break`, `admin`, `team`. `status: "declined"` strikes it through; `conflict` prints an amber flag |
| `venue` | Launch Pad table. `staffStatus`: `ok` (green), `self` (violet, Jad supervising), `none` (grey), `gap` (red — rostered staff missing) |
| `asks` | Open asks. `state`: `critical`, `stalled`, `open`, `moving` — sets the left stripe and the badge |
| `week` | THIS WEEK list. `priority`: `High`, `Medium`, `Low` sets the dot. `due` only when overdue |
| `flagged` | Low-stakes overdue admin, shown as chips so it stays visible without taking a slot |

Every field is escaped on render, so task names with `&` or `<` are safe.

## Design

Stone & Chalk's own system: Poppins throughout, Primary Purple `#a434ff` as the single
accent, Stone `#CCC9C3` in the supporting range. Neutrals are biased toward violet
rather than pure grey. Semantic colour (critical / warn / good) is kept separate from
the brand accent so "needs attention" never reads as "on brand". Light and dark are
both defined at token level, including the un-stamped `prefers-color-scheme` case.
