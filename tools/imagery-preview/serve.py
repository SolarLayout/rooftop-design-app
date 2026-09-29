"""Throwaway preview of the Esri imagery, address search and roof outlining.

Run:  python3 tools/imagery-preview/serve.py      then open http://localhost:4700
The key is read from apps/web/.env.local and handed to the page; it is never written anywhere else.
Port 4700 is used because the key only accepts that referrer.
"""

from __future__ import annotations

import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(__file__).with_name("index.html")
PORT = 4700


def read_key() -> str:
    env = ROOT / "apps" / "web" / ".env.local"
    m = re.search(r"^NEXT_PUBLIC_ESRI_API_KEY=(.*)$", env.read_text(), re.M) if env.exists() else None
    return m.group(1).strip() if m else ""


class Handler(BaseHTTPRequestHandler):
    def _send(self, body: bytes, kind: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path in ("/", "/index.html"):
            self._send(PAGE.read_bytes(), "text/html; charset=utf-8")
        elif self.path == "/config.js":
            self._send(f"window.ESRI_KEY = {read_key()!r};".encode(), "application/javascript")
        else:
            self._send(b"not found", "text/plain", 404)

    def log_message(self, *_args) -> None:
        pass


if __name__ == "__main__":
    if not read_key():
        raise SystemExit("No key in apps/web/.env.local")
    print(f"Imagery preview on http://localhost:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
