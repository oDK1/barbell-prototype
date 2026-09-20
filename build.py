#!/usr/bin/env python3
"""Inline the whole prototype into one self-contained HTML file.

The dev version loads src/*.js over HTTP and compiles JSX in the browser. That
needs a server. This flattens everything — React, Babel, every module and the
stylesheet — into a single file that runs from anywhere, including a hosted
link or a double-clicked local file.

    python3 build.py            -> barbell.html
"""
import re, pathlib, sys

ROOT = pathlib.Path(__file__).parent
src = (ROOT / "index.html").read_text()

def read(p):
    return (ROOT / p).read_text()

# stylesheet -> <style>
src = re.sub(
    r'<link rel="stylesheet" href="(src/[^"?]+)(\?[^"]*)?" />',
    lambda m: "<style>\n" + read(m.group(1)) + "\n</style>",
    src,
)

# vendored libraries -> inline classic scripts
src = re.sub(
    r'<script src="(vendor/[^"?]+)(\?[^"]*)?"></script>',
    lambda m: "<script>\n" + read(m.group(1)) + "\n</script>",
    src,
)

# application modules -> inline JSX, compiled in the browser by Babel
def inline_babel(m):
    path = m.group(1)
    body = read(path)
    assert "</script" not in body, path
    return ('<script type="text/babel" data-presets="react" data-file="%s">\n%s\n</script>' % (path, body))

src = re.sub(
    r'<script type="text/babel" data-presets="react" src="(src/[^"?]+)(\?[^"]*)?"></script>',
    inline_babel,
    src,
)

# a short product name reads better as a tab title and a card title
src = src.replace(
    "<title>Barbell — Institutional Wealth Operating System</title>",
    "<title>Barbell Wealth Operating System</title>",
)

leftovers = re.findall(r'(?:src|href)="(?:src|vendor)/[^"]+"', src)
if leftovers:
    sys.exit("unresolved references: %s" % leftovers)

out = ROOT / "barbell.html"
out.write_text(src)
print("%s — %.1f MB" % (out.name, out.stat().st_size / 1e6))
