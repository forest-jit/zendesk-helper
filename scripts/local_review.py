#!/usr/bin/env python3
"""Run the local export reviewer. Only loopback and downloaded Ollama models are used.

The browser sends a chosen JSON file to this process. Raw input stays in memory;
review files go to a private local folder. Nothing is published to Notion.
"""
import argparse
import json
import secrets
import threading
import uuid
import webbrowser
import os
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from process_ticket import local_models, process

ROOT = Path(__file__).resolve().parents[1]
MAX_UPLOAD = 64 * 1024 * 1024


def default_output():
    return Path.home() / "Library/Application Support/Jones IT Zendesk Helper/Reviews"


class ReviewServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, output, processor=process):
        super().__init__(address, ReviewHandler)
        self.token = secrets.token_urlsafe(32)
        self.output = output
        self.processor = processor
        self.jobs = {}
        self.job_lock = threading.Lock()

    @property
    def origin(self):
        return "http://127.0.0.1:" + str(self.server_port)

    def start_review(self, ticket, read_images):
        with self.job_lock:
            if any(job["state"] == "running" for job in self.jobs.values()):
                return None
            key = uuid.uuid4().hex
            self.jobs[key] = {
                "id": key,
                "state": "running",
                "stage": "Checking local models",
            }
        thread = threading.Thread(
            target=self.run_review, args=(key, ticket, read_images), daemon=True
        )
        thread.start()
        return key

    def run_review(self, key, ticket, read_images):
        def progress(message):
            with self.job_lock:
                self.jobs[key]["stage"] = message

        try:
            self.output.mkdir(parents=True, exist_ok=True, mode=0o700)
            folder = self.output / key
            folder.mkdir(mode=0o700)
            result = self.processor(
                ticket,
                folder,
                "mistral:latest",
                "qwen2.5vl:3b",
                analyze_images=read_images,
                progress=progress,
            )
            with self.job_lock:
                self.jobs[key].update(
                    state="ready",
                    stage="Review ready",
                    result=result,
                    folder=str(folder),
                )
        except Exception as error:
            # Keep the chosen file untouched. Do not log its body or a full traceback.
            with self.job_lock:
                self.jobs[key].update(
                    state="error", stage="Review stopped", error=str(error)
                )


class ReviewHandler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def send(self, status, data, mime="application/json; charset=utf-8", filename=None):
        body = json.dumps(data).encode() if isinstance(data, dict) else data
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        )
        if filename:
            self.send_header(
                "Content-Disposition", 'attachment; filename="' + filename + '"'
            )
        self.end_headers()
        self.wfile.write(body)

    def allowed(self, token=False):
        # Exact Host blocks DNS rebinding. Foreign websites cannot authorize a local job.
        if self.headers.get("Host") != self.server.origin.removeprefix("http://"):
            return False
        origin = self.headers.get("Origin")
        if origin and origin != self.server.origin:
            return False
        if self.headers.get("Sec-Fetch-Site") == "cross-site":
            return False
        return not token or secrets.compare_digest(
            self.headers.get("X-Review-Token", ""), self.server.token
        )

    def do_GET(self):
        if not self.allowed():
            return self.send(
                403, {"error": "Open this reviewer through its 127.0.0.1 address."}
            )
        path = urlsplit(self.path).path
        assets = {
            "/": ("index.html", "text/html; charset=utf-8"),
            "/app.js": ("app.js", "text/javascript; charset=utf-8"),
            "/style.css": ("style.css", "text/css; charset=utf-8"),
        }
        if path in assets:
            name, mime = assets[path]
            return self.send(200, (ROOT / "local-review" / name).read_bytes(), mime)
        if path == "/health":
            return self.send(200, {"application": "Jones IT local ticket review"})
        if path == "/api/session":
            return self.send(200, {"token": self.server.token})
        if not self.allowed(token=True):
            return self.send(
                403, {"error": "Reload the local reviewer before continuing."}
            )
        if path == "/api/status":
            try:
                models = local_models()
                ready = all(
                    name in models for name in ["mistral:latest", "qwen2.5vl:3b"]
                )
                return self.send(
                    200,
                    {
                        "ready": ready,
                        "message": (
                            "Local models ready."
                            if ready
                            else "A required model is missing. See the setup guide."
                        ),
                    },
                )
            except Exception:
                return self.send(
                    200,
                    {
                        "ready": False,
                        "message": "Start Ollama on this Mac, then refresh this page.",
                    },
                )
        parts = path.strip("/").split("/")
        if len(parts) in (3, 4) and parts[:2] == ["api", "jobs"]:
            with self.server.job_lock:
                job = dict(self.server.jobs.get(parts[2], {}))
            if not job:
                return self.send(
                    404,
                    {
                        "error": "This review is no longer in memory. Your downloaded review files are unchanged."
                    },
                )
            if len(parts) == 3:
                return self.send(
                    200, {key: value for key, value in job.items() if key != "folder"}
                )
            name = parts[3]
            if job["state"] == "ready" and name in [
                "notion-draft.md",
                "processed.json",
            ]:
                content = (Path(job["folder"]) / name).read_bytes()
                return self.send(
                    200,
                    content,
                    (
                        "text/markdown; charset=utf-8"
                        if name.endswith(".md")
                        else "application/json"
                    ),
                    name,
                )
        self.send(404, {"error": "Not found."})

    def do_POST(self):
        if not self.allowed(token=True):
            return self.send(
                403, {"error": "The request did not come from this local review page."}
            )
        if urlsplit(self.path).path != "/api/jobs":
            return self.send(404, {"error": "Not found."})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= MAX_UPLOAD:
                return self.send(
                    413, {"error": "Choose a ticket export smaller than 64 MB."}
                )
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError("Unsupported request structure")
            ticket = data.get("ticket")
            if (
                not isinstance(ticket, dict)
                or not isinstance(ticket.get("comments"), list)
                or not ticket["comments"]
            ):
                raise ValueError(
                    "Choose a raw Zendesk Helper export containing messages."
                )
            if len(ticket["comments"]) > 5000 or any(
                not isinstance(c, dict) or not isinstance(c.get("body", ""), str)
                for c in ticket["comments"]
            ):
                raise ValueError(
                    "This export has an unsupported message structure or too many messages."
                )
            read_images = data.get("readImages", True)
            if not isinstance(read_images, bool):
                raise ValueError("Choose whether to read images.")
        except (ValueError, TypeError, RecursionError):
            return self.send(
                400,
                {
                    "error": "Choose a valid raw ticket JSON export. The file was not changed."
                },
            )
        key = self.server.start_review(ticket, read_images)
        if key is None:
            return self.send(
                409,
                {
                    "error": "A review is already running. Wait for it to finish before starting another."
                },
            )
        self.send(202, {"id": key})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8769)
    parser.add_argument("--output", type=Path, default=default_output())
    parser.add_argument(
        "--open",
        action="store_true",
        help="Open the local page in your default browser",
    )
    args = parser.parse_args()
    run_file = default_output().parent / ".review-server.json"
    try:
        previous = json.loads(run_file.read_text())
        url = urlsplit(previous["url"])
        if (
            url.scheme == "http"
            and url.hostname == "127.0.0.1"
            and url.port
            and not url.username
        ):
            with urllib.request.urlopen(
                previous["url"] + "/health", timeout=1
            ) as response:
                if (
                    json.load(response).get("application")
                    == "Jones IT local ticket review"
                ):
                    print("Reviewer already running: " + previous["url"], flush=True)
                    if args.open:
                        webbrowser.open(previous["url"])
                    return
    except (OSError, ValueError, KeyError):
        pass
    try:
        server = ReviewServer(("127.0.0.1", args.port), args.output)
    except OSError:
        # Another local tool may use the preferred port. Do not stop or modify it.
        server = ReviewServer(("127.0.0.1", 0), args.output)
    run_file.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    run_file.write_text(json.dumps({"url": server.origin, "pid": os.getpid()}))
    run_file.chmod(0o600)
    print("Local ticket review: " + server.origin, flush=True)
    print("Review files: " + str(args.output), flush=True)
    print("Stop with Control+C. No ticket is published to Notion.", flush=True)
    if args.open:
        webbrowser.open(server.origin)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        if run_file.exists():
            run_file.unlink()


if __name__ == "__main__":
    main()
