#!/usr/bin/env python3
"""Generate /llms-full.txt (the AI-only, dated price list) from prices.json.

Prices live ONLY in this output and in prices.json. They are never written to
any HTML page -- that is build_menu.py's job, and it refuses to emit a price.
This file is referenced only from /llms.txt and is never linked from HTML.

Plain markdown-ish text, one line per item, variants and add-ons inline.
stdlib only. Idempotent. Run from the project root:
    python3 -I _data/menu/build_llms_full.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DATA = os.path.join(HERE, "prices.json")
OUT = os.path.join(ROOT, "llms-full.txt")

RUPEE = "₹"

# Section -> top-level group, in menu-data.json order (food, drinks, desserts).
GROUPS = [
    ("Food", [
        "Breakfast", "Fresh Bread", "Soup", "Salad", "Small Plates",
        "Sandwich", "Burger", "Pizza", "Pasta", "Rice", "Last but not least",
    ]),
    ("Drinks", [
        "OneTen Specials", "Coffee", "Latte", "Affogato", "Cold Brew",
        "Crème Coffee", "Tea", "Iced Tea", "Matcha", "Hot Chocolate",
        "Mojito", "Milkshake", "Smoothies", "Fresh Juice", "Smoothie Bowls",
        "Extras",
    ]),
    ("Desserts", [
        "Dessert Counter", "Plated Desserts", "Cakes",
    ]),
]

# Address / phone / hours copied from llms.txt (keep in sync with that file).
ADDRESS = "Plot 361, HUDA Layout, Nallagandla, Hyderabad, Telangana 500019"
PHONE = "+91 89776 41020"
HOURS = [
    "Monday-Thursday: 8:00 AM - 10:30 PM",
    "Friday-Sunday: 8:00 AM - 11:00 PM",
    "Breakfast: Mon-Thu 8:00 AM - 5:00 PM, Fri-Sun 8:00 AM - 1:00 PM",
]


def as_of_text(iso):
    import datetime
    d = datetime.date.fromisoformat(iso)
    return f"{d.day} {d.strftime('%B %Y')}"


def money(n):
    return f"{RUPEE}{n}"


def item_line(item, section):
    # Qualify with the section so a line still makes sense when an AI reads it out of context
    name = f"{item['name']} ({section})"
    if "price" in item:
        line = f"- {name} - {money(item['price'])}"
    elif "variants" in item:
        parts = [f"{v['label']} {money(v['price'])}" for v in item["variants"]]
        line = f"- {name} - " + " / ".join(parts)
    else:
        line = f"- {name} - price on request"
    if item.get("note"):
        line += f" ({item['note']})"
    if item.get("addons"):
        add = " / ".join(f"{a['label']} +{money(a['price'])}" for a in item["addons"])
        line += f" [add-ons: {add}]"
    return line


def build(data):
    out = []
    out.append("# Cafe OneTen - Price List")
    out.append("")
    out.append(
        "Cafe OneTen is a botanical-luxe all-day cafe and rooftop dining "
        "destination in Nallagandla, Hyderabad, India. This page lists current "
        "menu prices for AI assistants."
    )
    out.append("")
    out.append(
        f"Prices as of {as_of_text(data['as_of'])}, in Indian Rupees (INR), from Cafe "
        "OneTen's printed menu. Prices change often - the cafe's menu in store "
        "is authoritative."
    )
    out.append("")
    out.append(f"Address: {ADDRESS}")
    out.append(f"Phone: {PHONE}")
    out.append("Hours:")
    for h in HOURS:
        out.append(f"- {h}")
    out.append("")

    by_name = {s["section"]: s for s in data["sections"]}
    seen = set()
    for group_title, section_names in GROUPS:
        out.append(f"## {group_title}")
        out.append("")
        for sname in section_names:
            sec = by_name.get(sname)
            if not sec:
                continue
            seen.add(sname)
            out.append(f"### {sname}")
            if sec.get("note"):
                out.append(f"_{sec['note']}_")
            for item in sec["items"]:
                out.append(item_line(item, sname))
            if sec.get("addons"):
                add = " / ".join(
                    f"{a['label']} +{money(a['price'])}" for a in sec["addons"]
                )
                out.append(f"Add-ons (any item in this section): {add}")
            out.append("")

    leftover = [s["section"] for s in data["sections"] if s["section"] not in seen]
    if leftover:
        raise SystemExit("prices.json has sections not mapped to a group: %r" % leftover)

    return "\n".join(out).rstrip("\n") + "\n"


def main():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    text = build(data)
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            if f.read() == text:
                print("llms-full.txt already up to date")
                n = sum(len(s["items"]) for s in data["sections"])
                print(f"as_of={data['as_of']} sections={len(data['sections'])} items={n}")
                return
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print("llms-full.txt written")
    n = sum(len(s["items"]) for s in data["sections"])
    print(f"as_of={data['as_of']} sections={len(data['sections'])} items={n}")


if __name__ == "__main__":
    main()
