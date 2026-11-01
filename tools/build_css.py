"""Gera static/css/<nome>.css a partir de static/css/<nome>.src.css.

O site tem muitas camadas antigas de CSS com !important. Para que a nova home
não brigue com elas, cada seletor ganha um reforço de especificidade e cada
declaração ganha !important (menos dentro de @keyframes, onde não é permitido).

Uso: python3 tools/build_css.py nova-home passeio
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
BOOST = ":not(#nh1):not(#nh2):not(#nh3)"


def boost_selector(sel: str) -> str:
    sel = sel.strip()
    if sel.startswith("html"):
        head, _, rest = sel.partition(" ")
        return f"{head}{BOOST} {rest}".strip()
    return f"html{BOOST} {sel}"


def important(body: str) -> str:
    out = []
    for decl in body.split(";"):
        if ":" in decl and decl.strip() and "!important" not in decl:
            decl = decl.rstrip() + "!important"
        out.append(decl)
    return ";".join(out)


def process(css: str, in_keyframes: bool = False) -> str:
    out, i = [], 0
    while i < len(css):
        j = css.find("{", i)
        if j == -1:
            out.append(css[i:])
            break
        prelude = css[i:j]
        depth, k = 1, j + 1
        while depth:
            if css[k] == "{":
                depth += 1
            elif css[k] == "}":
                depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        # comentários antes do seletor ou do @media ficam como estão
        comment = ""
        m = re.match(r"(\s*/\*.*?\*/\s*)+", prelude, re.S)
        if m:
            comment, prelude = m.group(0), prelude[m.end():]
        head = prelude.strip()
        if head.startswith("@keyframes"):
            out.append(comment + prelude + "{" + body + "}")
        elif head.startswith("@"):
            out.append(comment + prelude + "{" + process(body) + "}")
        else:
            sels = ",".join(boost_selector(s) for s in head.split(","))
            out.append(comment + sels + "{" + important(body) + "}")
        i = k
    return "".join(out)


if __name__ == "__main__":
    for name in sys.argv[1:] or ["nova-home", "passeio"]:
        src = ROOT / f"static/css/{name}.src.css"
        out = ROOT / f"static/css/{name}.css"
        out.write_text(f"/* Gerado por tools/build_css.py — edite {name}.src.css */\n" + process(src.read_text()))
        print(f"ok: {out.relative_to(ROOT)}")
