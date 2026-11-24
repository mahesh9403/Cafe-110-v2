#!/usr/bin/env python3
"""Splice the text menu and Menu JSON-LD into menu/index.html from menu-data.json.
One data source -> both outputs, so item names stay in sync.
Replaces the content between the MENU:TEXT / MENU:JSONLD marker comments.
Refuses to write if any item carries a price. Idempotent.
stdlib only. Run from the project root: python3 -I _data/menu/build_menu.py
"""
import json
import os

import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DATA = os.path.join(HERE, "menu-data.json")
PAGE = os.path.join(ROOT, "menu", "index.html")

PRICE_KEYS = {"price", "prices", "cost", "mrp", "rate", "amount", "inr"}
PRICE_RE = re.compile(r"₹|\bRs\.?\s*\d|\bINR\b|\$\s*\d|\bprice", re.I)


def check_no_prices(sections):
    bad = []
    for sec in sections:
        for key, val in sec.items():
            if key.lower() in PRICE_KEYS or (isinstance(val, str) and PRICE_RE.search(val)):
                bad.append((sec["section"], key))
        for item in sec["items"]:
            for key, val in item.items():
                if key.lower() in PRICE_KEYS:
                    bad.append((item.get("name"), key))
                vals = val if isinstance(val, list) else [val]
                if any(isinstance(v, str) and PRICE_RE.search(v) for v in vals):
                    bad.append((item.get("name"), key))
    if bad:
        sys.exit("REFUSING TO WRITE - price data found (prices are never shown): %r" % bad)


def splice(page, tag, body):
    pat = re.compile(r"(<!-- MENU:%s:START -->\n).*?^([ \t]*<!-- MENU:%s:END -->)" % (tag, tag), re.S | re.M)
    if len(pat.findall(page)) != 1:
        sys.exit("marker pair MENU:%s not found exactly once in menu/index.html" % tag)
    return pat.sub(lambda m: m.group(1) + body + m.group(2), page)

TAG_SPAN = {
    "bestseller": '<span class="menu-tag bestseller">Bestseller</span>',
    "egg": '<span class="menu-tag egg">Contains egg</span>',
    "nuts": '<span class="menu-tag nuts">Contains nuts</span>',
}
TAG_ORDER = ["bestseller", "egg", "nuts"]


def esc(text):
    """HTML-escape structural chars only; accents stay as raw UTF-8."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def delay_for(i):
    d = 0.1 + (i % 12) * 0.05
    s = f"{d:.2f}".rstrip("0").rstrip(".")
    if s.startswith("0"):
        s = s[1:]
    return s + "s"


def build_html(sections):
    lines = []
    for i, sec in enumerate(sections):
        name = sec["section"]
        sub_parts = []
        if sec.get("subtitle"):
            sub_parts.append(esc(sec["subtitle"]))
        if sec.get("note"):
            sub_parts.append(esc(sec["note"]))
        lines.append(f"    <!-- {name} -->")
        lines.append(
            f'    <div class="menu-category-block reveal" style="transition-delay:{delay_for(i)}">'
        )
        if sub_parts:
            sub = " &middot; ".join(sub_parts)
            lines.append(
                f'      <div class="menu-category-title">{esc(name)}'
                f'<span class="menu-category-sub">{sub}</span></div>'
            )
        else:
            lines.append(f'      <div class="menu-category-title">{esc(name)}</div>')
        for item in sec["items"]:
            lines.append('      <div class="menu-dish-row">')
            lines.append('        <div class="menu-dish-info">')
            lines.append(f'          <div class="menu-dish-name">{esc(item["name"])}</div>')
            if item.get("desc"):
                lines.append(f'          <div class="menu-dish-desc">{esc(item["desc"])}</div>')
            tags = [t for t in TAG_ORDER if t in item.get("tags", [])]
            if tags:
                spans = "".join(TAG_SPAN[t] for t in tags)
                lines.append(f'          <div class="menu-dish-tags">{spans}</div>')
            lines.append('        </div>')
            lines.append('      </div>')
        lines.append('    </div>')
        lines.append('')
    return "\n".join(lines).rstrip("\n") + "\n"


def build_jsonld(sections):
    menu = {
        "@context": "https://schema.org",
        "@type": "Menu",
        "@id": "https://cafeoneten.com/menu#menu",
        "name": "Cafe OneTen Menu",
        "inLanguage": "en-IN",
        "hasMenuSection": [],
    }
    for sec in sections:
        s = {"@type": "MenuSection", "name": sec["section"], "hasMenuItem": []}
        for item in sec["items"]:
            mi = {"@type": "MenuItem", "name": item["name"]}
            if item.get("desc"):
                mi["description"] = item["desc"]
            s["hasMenuItem"].append(mi)
        menu["hasMenuSection"].append(s)
    return menu


def main():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    sections = data["sections"]
    check_no_prices(sections)

    text = build_html(sections)
    jsonld = json.dumps(build_jsonld(sections), indent=2, ensure_ascii=False)
    jsonld = "\n".join(("  " + l) if l else l for l in jsonld.split("\n"))
    jsonld_block = '  <script type="application/ld+json">\n' + jsonld + "\n  </script>\n"
    if "\u20b9" in text or "\u20b9" in jsonld_block:
        sys.exit("REFUSING TO WRITE - rupee sign in output")

    with open(PAGE, encoding="utf-8") as f:
        page = f.read()
    new = splice(splice(page, "TEXT", text), "JSONLD", jsonld_block)
    if new == page:
        print("menu/index.html already up to date")
    else:
        with open(PAGE, "w", encoding="utf-8") as f:
            f.write(new)
        print("menu/index.html updated")

    n_items = sum(len(s["items"]) for s in sections)
    print(f"sections={len(sections)} items={n_items}")


if __name__ == "__main__":
    main()
