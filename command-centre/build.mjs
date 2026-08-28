#!/usr/bin/env node
// Renders command-centre/data.json into dist/index.html using template.html.
// The Routine rewrites data.json, runs this, then republishes the artefact.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, "data.json"), "utf8"));
const template = readFileSync(join(here, "template.html"), "utf8");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const list = (v) => (Array.isArray(v) ? v : []);
const section = (title, count, inner) =>
  `<section><h2>${esc(title)}${count != null ? `<span class="count">${esc(count)}</span>` : ""}</h2>${inner}</section>`;

/* ---- masthead ---- */
const meta = data.meta ?? {};
const sources = list(meta.sources)
  .map((s) => `<span class="${s.status === "ok" ? "" : "down"}">${esc(s.name)}${s.detail ? " · " + esc(s.detail) : ""}</span>`)
  .join("");

const mast = `
<header class="mast">
  <div>
    <h1>Jad Command Centre<span class="rule-dot">.</span></h1>
    <p class="date">${esc(meta.dateLabel)} · Stone &amp; Chalk Adelaide</p>
  </div>
  <div class="stamp">
    <span class="freshness" id="freshness" data-at="${esc(meta.generatedAtISO)}">
      <span class="pulse"></span><span class="txt">${esc(meta.generatedAtLabel)}</span>
    </span>
    <div class="sources">${sources}</div>
  </div>
</header>`;

/* ---- tiles ---- */
const tiles = `<div class="tiles">${list(data.tiles)
  .map(
    (t) => `<div class="tile ${esc(t.tone ?? "neutral")}">
    <div class="label">${esc(t.label)}</div>
    <div class="value">${esc(t.value)}</div>
    <div class="note">${esc(t.note)}</div>
  </div>`
  )
  .join("")}</div>`;

/* ---- focus queue (rank is meaningful: the routine's priority order) ---- */
const focus = `<div class="focus">${list(data.focus)
  .map((f, i) => {
    const chips = [
      `<span class="chip high">${esc(f.priority)}</span>`,
      f.due ? `<span class="chip due">${esc(f.due)}</span>` : "",
      f.source ? `<span class="chip">${esc(f.source)}</span>` : "",
    ].join("");
    const heading = f.link
      ? `<a href="${esc(f.link)}" target="_blank" rel="noopener">${esc(f.title)}</a>`
      : esc(f.title);
    return `<article class="item">
      <div class="rank">${String(i + 1).padStart(2, "0")}</div>
      <div>
        <h3>${heading}</h3>
        <p class="why">${esc(f.why)}</p>
        <div class="metarow">${chips}</div>
      </div>
    </article>`;
  })
  .join("")}</div>`;

/* ---- day rail ---- */
const sched = data.schedule ?? {};
const allDay = list(sched.allDay)
  .map((a) => `<div class="allday">All day · <b>${esc(a.title)}</b></div>`)
  .join("");
const rail = `<div class="rail">${allDay}${list(sched.items)
  .map((s) => {
    const cls = [s.kind, s.status === "declined" ? "declined" : ""].filter(Boolean).join(" ");
    return `<div class="slot ${esc(cls)}">
      <div class="time">${esc(s.start)}</div>
      <div class="body">
        <div class="title">${esc(s.title)}</div>
        ${s.location ? `<div class="where">${esc(s.location)}</div>` : ""}
        ${s.conflict ? `<span class="flag">${esc(s.conflict)}</span>` : ""}
      </div>
    </div>`;
  })
  .join("")}</div>`;

/* ---- venue and staffing ---- */
const venue = `<div class="scroll"><table>
<thead><tr><th>When</th><th>Event</th><th>Event time</th><th>Bump in / out</th><th>Expected</th><th>Set-up</th><th>Staffing</th></tr></thead>
<tbody>${list(data.venue)
  .map(
    (v) => `<tr>
    <td class="when">${esc(v.when)}</td>
    <td class="ev">${esc(v.title)}</td>
    <td class="num">${esc(v.eventTime)}</td>
    <td class="num">${esc(v.bookingTime)}</td>
    <td class="num">${esc(v.attendees)}</td>
    <td>${esc(v.setup)}</td>
    <td><span class="staff ${esc(v.staffStatus ?? "none")}">${esc(v.staffing)}</span></td>
  </tr>`
  )
  .join("")}</tbody></table></div>`;

/* ---- open asks ---- */
const asks = `<div class="asks">${list(data.asks)
  .map(
    (a) => `<article class="ask ${esc(a.state)}">
    <div class="head">
      <span class="who">${esc(a.who)}</span>
      <span class="state">${esc(a.stateLabel)}</span>
    </div>
    <p class="text">${esc(a.ask)}</p>
    <div class="foot">${esc(a.channel)} · ${esc(a.age)} · ${esc(a.tracked)}</div>
  </article>`
  )
  .join("")}</div>`;

/* ---- this week ---- */
const week = `<div class="week">${list(data.week)
  .map(
    (w) => `<div class="wk">
    <span class="pri ${esc(w.priority)}" title="${esc(w.priority)} priority"></span>
    <a href="${esc(w.link)}" target="_blank" rel="noopener">${esc(w.title)}</a>
    <span class="due">${w.due ? esc(w.due) : ""}</span>
  </div>`
  )
  .join("")}</div>`;

/* ---- flagged ---- */
const flagged = `<div class="flagged">${list(data.flagged)
  .map((f) => `<span class="fl">${esc(f.title)}<span class="d">${esc(f.due)}</span></span>`)
  .join("")}</div>`;

const body = `
${mast}
${tiles}
<div class="split">
  <div class="stack">
    ${section("Today's focus", `${list(data.focus).length} items, in priority order`, focus)}
    ${section("Open asks", `${list(data.asks).length} awaiting Jad`, asks)}
  </div>
  <div class="stack">
    ${section("The day", meta.dateLabel, rail)}
  </div>
</div>
<div class="stack" style="margin-top:30px">
  ${section("Launch Pad and staffing", "today and the week ahead", venue)}
  ${section("This week", `${list(data.week).length} tasks`, week)}
  ${section("Flagged for end of day", "low-stakes overdue admin, not competing for a slot", flagged)}
</div>
<footer>
  <span>Built from Asana, Google Calendar, Gmail and Slack. A snapshot, not a live feed.</span>
  <span>${esc(meta.generatedAtLabel)} · ${esc(meta.timezone)}</span>
</footer>`;

const out = template.replace("<!--@BODY@-->", body);
mkdirSync(join(here, "dist"), { recursive: true });
writeFileSync(join(here, "dist", "index.html"), out);
console.log(`Built dist/index.html — ${(out.length / 1024).toFixed(1)} KB, as at ${meta.generatedAtLabel}`);
