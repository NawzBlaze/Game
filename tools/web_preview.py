#!/usr/bin/env python3
"""Serve the same web files packaged by Android, with caching disabled for review."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parent.parent / "web"


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


class PreviewServer(ThreadingHTTPServer):
    # The game requests many small images at startup. The default five-entry
    # socket backlog can stall requests when the public tunnel multiplexes them.
    request_queue_size = 128
    daemon_threads = True


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    handler = partial(PreviewHandler, directory=str(WEB_ROOT))
    server = PreviewServer(("0.0.0.0", port), handler)
    print(f"Little Parcel Crew web preview serving {WEB_ROOT} on port {port}", flush=True)
    server.serve_forever()
