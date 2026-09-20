#!/usr/bin/env python3
"""Static server for the Barbell prototype. No caching, so edits show on reload."""
import http.server, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8777

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()
    def log_message(self, *a):
        pass

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Barbell running at http://localhost:%d" % PORT)
    httpd.serve_forever()
