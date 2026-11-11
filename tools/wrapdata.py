# One-off helper: wraps over-long option lines in data files at ", y: {" / ", n: {". python3 tools/wrapdata.py FILE...
import sys
def wrap(lines):
    out = []
    for l in lines:
        if len(l) <= 120:
            out.append(l); continue
        ind = len(l) - len(l.lstrip())
        for sep in (', n: {', ', y: {'):
            if sep in l:
                a, b = l.rsplit(sep, 1)
                out += wrap([a + ','])
                out += wrap([' ' * (ind + 2) + sep[2:] + b])
                break
        else:
            if l.lstrip().startswith('band(') and '", [' in l:
                a, b = l.split('", [', 1)
                out += [a + '",', ' ' * (ind + 2) + '[' + b]
            else:
                out.append(l)
    return out
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read().split('\n')
    open(p, 'w', encoding='utf-8').write('\n'.join(wrap(s)))
