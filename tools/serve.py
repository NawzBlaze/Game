#!/usr/bin/env python3
"""Local preview with release-like security headers; accepts Arena's proxy host."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--directory',default='web')
parser.add_argument('--port',type=int,default=4187)
a=parser.parse_args()
root=Path(a.directory).resolve()
if not (root/'index.html').is_file():raise SystemExit('Build or source index.html is missing')
class Handler(SimpleHTTPRequestHandler):
    def list_directory(self,path):
        self.send_error(403,'Directory listings disabled')
        return None
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Permissions-Policy','camera=(), microphone=(), geolocation=()')
        self.send_header('Cache-Control','no-store')
        # Do not set frame-ancestors or X-Frame-Options: Arena embeds its preview.
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'")
        super().end_headers()
ThreadingHTTPServer(('0.0.0.0',a.port),partial(Handler,directory=str(root))).serve_forever()
