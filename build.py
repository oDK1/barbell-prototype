#!/usr/bin/env python3
"""Inline a prototype into one self-contained HTML file.

The dev versions load their JS over HTTP and compile JSX in the browser, which
needs a server. This flattens everything — React, Babel, every module and the
stylesheet — into a single file that runs from anywhere, including a hosted
link or a double-clicked local file.

    python3 build.py            -> barbell.html (take 1), take2.html (take 2)
"""
import re, pathlib, sys

ROOT = pathlib.Path(__file__).parent


def build(page, out_name, title=None):
    """Inline `page` (an index.html) and its references into ROOT/out_name.

    References are resolved relative to the page's own directory, so a nested
    prototype that points at ../vendor and ../src works unchanged.
    """
    page = ROOT / page
    base = page.parent
    src = page.read_text()

    def read(rel):
        return (base / rel).read_text()

    # stylesheet -> <style>
    src = re.sub(
        r'<link rel="stylesheet" href="([^"?]+)(\?[^"]*)?" ?/?>',
        lambda m: "<style>\n" + read(m.group(1)) + "\n</style>",
        src,
    )

    # application modules -> inline JSX, compiled in the browser by Babel
    def inline_babel(m):
        path = m.group(1)
        body = read(path)
        assert "</script" not in body, path
        return ('<script type="text/babel" data-presets="react" data-file="%s">\n%s\n</script>'
                % (path, body))

    src = re.sub(
        r'<script type="text/babel" data-presets="react" src="([^"?]+)(\?[^"]*)?"></script>',
        inline_babel,
        src,
    )

    # plain scripts (vendored libraries, and any module that needs no compiling)
    def inline_plain(m):
        body = read(m.group(1))
        assert "</script" not in body, m.group(1)
        return "<script>\n" + body + "\n</script>"

    src = re.sub(r'<script src="([^"?]+)(\?[^"]*)?"></script>', inline_plain, src)

    if title:
        src = re.sub(r"<title>.*?</title>", "<title>%s</title>" % title, src, flags=re.S)

    leftovers = re.findall(r'(?:src|href)="(?!https?:|data:|#)[^"]+"', src)
    if leftovers:
        sys.exit("unresolved references in %s: %s" % (page, leftovers))

    out = ROOT / out_name
    out.write_text(src)
    print("%s — %.1f MB" % (out.name, out.stat().st_size / 1e6))


if __name__ == "__main__":
    build("index.html", "barbell.html", title="Barbell Wealth Operating System")
    build("take2/index.html", "take2.html", title="Barbell — Family Office Workspace")
