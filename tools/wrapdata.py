# Wraps data lines over 120 characters: breaks at ", " outside strings, as late as fits, indenting the rest.
# python3 tools/wrapdata.py FILE...
import sys

LIMIT = 118

def cut_points(line):
    out, q, esc = [], None, False
    for i, ch in enumerate(line):
        if esc: esc = False; continue
        if ch == "\\": esc = True; continue
        if q:
            if ch == q: q = None
            continue
        if ch in "\"'`": q = ch; continue
        if ch == "," and line[i + 1:i + 2] == " ": out.append(i + 1)
    return out

def wrap(line):
    if len(line) <= 120: return [line]
    ind = len(line) - len(line.lstrip())
    cuts = [c for c in cut_points(line) if ind + 4 < c <= LIMIT]
    if not cuts: return [line]
    c = cuts[-1]
    head, rest = line[:c].rstrip(), " " * (ind + 2) + line[c:].lstrip()
    return [head] + wrap(rest)

for p in sys.argv[1:]:
    lines = open(p, encoding="utf-8").read().split("\n")
    open(p, "w", encoding="utf-8").write("\n".join(l for line in lines for l in wrap(line)))
