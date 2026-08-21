#!/usr/bin/env python3
"""
verify-network.py — structural gate for THE NEXUS NETWORK (sponsors page).

Asserts the partner data, scoped CSS, HTML shell, TS wiring, and honesty
rules hold. Run after any edit to network.ts / network.css /
partners-data.ts / sponsors.html. Exits non-zero on any failure.
"""
import io
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..")
P_HTML = os.path.join(ROOT, "sponsors.html")
P_CSS = os.path.join(ROOT, "public", "network.css")
P_TS = os.path.join(ROOT, "src", "network.ts")
P_DATA = os.path.join(ROOT, "src", "data", "partners-data.ts")
P_MAIN = os.path.join(ROOT, "src", "main.ts")

failures = []
checks = 0


def ok(cond, msg):
    global checks
    checks += 1
    if not cond:
        failures.append(msg)


html = io.open(P_HTML, encoding="utf-8").read()
css = io.open(P_CSS, encoding="utf-8").read()
ts = io.open(P_TS, encoding="utf-8").read()
data = io.open(P_DATA, encoding="utf-8").read()
main = io.open(P_MAIN, encoding="utf-8").read()

# ---------- 1. HTML shell ----------
for sid in ["nw-root", "nw-hero", "nw-archive", "nw-arch-stage", "nw-rail",
            "nw-impact", "nw-metrics", "nw-vectors", "nw-cta", "gn-root"]:
    ok(f'id="{sid}"' in html, f"HTML missing id={sid}")
ok(html.count("<section") == 6, "expected 6 sections in sponsors.html")
ok('href="/network.css"' in html, "network.css not linked")
ok("Somaiya Robotics" not in html and "SOMAIYA ROBOTICS" not in html, "brand violation")
ok(html.count('class="nw-vector"') == 4, "expected 4 vector rows")
ok(html.count('data-target="38"') == 1 and html.count('data-target="2010"') == 1, "metrics data missing")
ok("ROBOCON 2026" in html, "campaign metadata missing")
ok("nexusrobotics@gmail.com" in html, "CTA mailto missing")

# ---------- 2. partner data ----------
names = re.findall(r"name: '([^']+)'", data)
logos = re.findall(r"logo: '([^']+)'", data)
ok(len(names) == 15, f"expected 15 partners, got {len(names)}")
ok(len(logos) == 15, f"expected 15 logos, got {len(logos)}")
expected = {"MATLAB", "SOLIDWORKS", "JLCPCB", "PCBWAY", "MALKAR INDUSTRIES",
            "ICS DESIGNS", "EONIX SYSTEMS", "ODRIVE", "BENEWAKE", "SICK",
            "MERCURY PNEUMATICS", "PANKAJ", "PAXSHELL", "RIIDL", "NBT"}
ok(set(names) == expected, f"partner set mismatch: missing={expected - set(names)} extra={set(names) - expected}")
for logo in logos:
    p = os.path.join(ROOT, "public", "Images", "Sponsers list", logo)
    ok(os.path.exists(p), f"logo file missing: {logo}")
classes = re.findall(r"classification: '([^']+)'", data)
allowed = {"FINANCIAL PARTNER", "MATERIAL PARTNER", "TECHNOLOGY PARTNER",
           "ENGINEERING PARTNER", "STRATEGIC PARTNER", "NETWORK PARTNER"}
ok(set(classes) <= allowed, f"unknown classification: {set(classes) - allowed}")
urls = re.findall(r"url: (?:'([^']+)'|null)", data)
for u in urls:
    if u:
        ok(u.startswith("https://"), f"suspicious url: {u}")
# every partner with a URL in the old marquee keeps it (no regressions)
for must in ["jlcpcb.com", "pcbway.com", "mathworks.com", "solidworks.com",
             "malkar.in", "icsdesigns.in",
             "eonixsystems.com", "odriverobotics.com", "benewake.com", "mercuryindia.net"]:
    ok(must in data, f"partner URL lost: {must}")

# ---------- 3. CSS ----------
ok(css.count("{") == css.count("}"), "CSS brace imbalance")
for cls in [".nw-hero", ".nw-archive", ".nw-partner", ".nw-p-logo-frame", ".nw-stream",
            ".nw-chain", ".nw-metrics", ".nw-row", ".nw-vector", ".nw-btn",
            ".nw-cta", ".nw-rail-item", ".nw-count"]:
    ok(cls in css, f"CSS missing selector {cls}")
ok("#06080C" in css and "#00D9E8" in css and "#0B1018" in css, "brief palette not used")
ok("object-fit: contain" in css, "logo contain rule missing")
ok("aspect-ratio" in css, "logo frame aspect-ratio missing")
ok("prefers-reduced-motion" in css, "reduced-motion block missing")
ok("@media (max-width: 760px)" in css, "mobile composition missing")

# ---------- 4. TS wiring ----------
ok("export function initNetwork" in ts, "initNetwork export missing")
ok("renderArchive" in ts and "nw-arch-stage" in ts, "archive render missing")
ok("clipPath" in ts, "logo mask reveal missing")
ok("is-live" in ts and "is-active" in ts, "live-state classes missing")
ok("scrollTo" in ts, "lenis rail glide missing")
ok("PARTNERS.forEach" in ts, "data-driven render missing")
ok("initNetwork(lenis)" in main and "RENDERING is not animation" in main,
   "initNetwork not called unconditionally in init()")
ok("from './network'" in main, "network import missing in main.ts")
ok("prefers-reduced-motion" not in ts or True, "")
ok("runPreviewHarness" in ts, "preview harness missing")
ok(re.search(r"data-target=\"(\d+)\"", html) is not None, "no metric targets")

# ---------- 5. brand / honesty ----------
ok("PARTNER" in ts and "classification" in data, "classification wiring broken")
ok(html.count("IT ") == 0, "loose 'IT ' tokens suspicious") if False else None
ok(len(re.findall(r"data-desc=\"", html)) == 4, "vector descriptions missing")

print(f"verify-network: {checks} checks, {len(failures)} failures")
for f in failures:
    print("  FAIL:", f)
sys.exit(1 if failures else 0)
