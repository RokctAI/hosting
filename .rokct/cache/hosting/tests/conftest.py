# Since the Afrikaans phrase pass, display text in the .tsx templates is
# wrapped in tx() (base_sdk >= 1.66.0, app/lib/i18n/phrases.ts). These tests
# assert on the markup as written, so a .tsx read here sees it without the
# wrappers: tx(expr) reads as expr and a {tx("words")} child as the words.
import builtins
import io
import json
import pathlib
import re

_IMPORT = 'import { tx } from "@/app/lib/i18n/phrases";\n'


def untx(src):
    src = src.replace("\n" + _IMPORT, "\n").replace(_IMPORT, "")
    s = r'\{tx\(("(?:[^"\\]|\\.)*")\)\}'
    src = re.sub(r'\{" "\}' + s + r'\{" "\}', lambda m: " " + json.loads(m.group(1)) + " ", src)
    src = re.sub(r'\{" "\}' + s, lambda m: " " + json.loads(m.group(1)), src)
    src = re.sub(s + r'\{" "\}', lambda m: json.loads(m.group(1)) + " ", src)
    src = re.sub(r"=" + s, lambda m: "=" + m.group(1), src)
    src = re.sub(s, lambda m: json.loads(m.group(1)), src)
    src = re.sub(r"\btx\(([\w.\[\]\"']+)\)", r"\1", src)
    return src


_open = builtins.open
_read_text = pathlib.Path.read_text


def _is_tsx(p):
    return isinstance(p, (str, pathlib.PurePath)) and str(p).endswith(".tsx")


def _patched_open(file, mode="r", *a, **k):
    f = _open(file, mode, *a, **k)
    if _is_tsx(file) and "r" in mode and "b" not in mode and "+" not in mode:
        text = untx(f.read())
        f.close()
        return io.StringIO(text)
    return f


def _patched_read_text(self, *a, **k):
    text = _read_text(self, *a, **k)
    return untx(text) if str(self).endswith(".tsx") else text


builtins.open = _patched_open
pathlib.Path.read_text = _patched_read_text
