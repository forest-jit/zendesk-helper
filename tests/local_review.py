"""Offline reviewer checks: local request boundaries, job lifetime and useful output shape."""

import json
import sys
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))
import local_review
import process_ticket


def sample_summary():
    return {
        "title": "A connection problem",
        "summary": "A connection failed.",
        "conclusion": "No successful fix is recorded.",
        "resolutionStatus": "not_recorded",
        "actions": [
            {
                "text": "A restart did not help.",
                "sources": ["C1"],
                "evidence": "A restart did not help.",
            }
        ],
        "verification": [],
        "conclusionSources": [],
        "knowledge": [],
        "openQuestions": ["Was the certificate checked?"],
    }


class SummaryChecks(unittest.TestCase):
    def test_chunks_keep_message_references_and_all_text(self):
        ticket = {
            "comments": [
                {"body": "A" * 350, "visibility": "public"},
                {"body": "B" * 150, "visibility": "internal"},
            ]
        }
        chunks, refs = process_ticket.evidence_chunks(ticket, str, limit=250)
        self.assertEqual([r["id"] for r in refs], ["C1", "C2"])
        self.assertIn("continued", "".join(chunks))
        self.assertEqual("".join(chunks).count("A"), 350)
        self.assertEqual("".join(chunks).count("B"), 150)

    def test_invented_references_are_rejected(self):
        summary = sample_summary()
        summary["actions"][0]["sources"] = ["C99"]
        with self.assertRaises(ValueError):
            process_ticket.validate_summary(
                summary, [{"id": "C1", "text": "A restart did not help."}], str
            )

    def test_existing_reference_with_wrong_excerpt_is_rejected(self):
        summary = sample_summary()
        with self.assertRaises(ValueError):
            process_ticket.validate_summary(
                summary,
                [{"id": "C1", "text": "The requester asked for a different thing."}],
                str,
            )

    def test_shifted_reference_is_corrected_only_by_unique_original_excerpt(self):
        summary = sample_summary()
        summary["actions"][0]["evidence"] = "[C1] A restart did not help."
        refs = [
            {"id": "C1", "text": "An unrelated request."},
            {"id": "C2", "text": "A restart did not help."},
        ]
        checked = process_ticket.validate_summary(summary, refs, str)
        self.assertEqual(checked["actions"][0]["sources"], ["C2"])
        self.assertTrue(checked["actions"][0]["referenceCorrectedByExcerpt"])

    def test_future_followup_is_not_presented_as_verification(self):
        summary = sample_summary()
        summary["verification"] = [
            {
                "text": "The requester will follow up tomorrow.",
                "sources": ["C1"],
                "evidence": "The requester will follow up tomorrow.",
            }
        ]
        refs = [
            {
                "id": "C1",
                "text": "A restart did not help. The requester will follow up tomorrow.",
            }
        ]
        checked = process_ticket.validate_summary(summary, refs, str)
        self.assertEqual(checked["verification"], [])
        self.assertIn("pending work", checked["reviewNotes"][0])

    def test_not_a_procedure_is_a_valid_useful_result(self):
        summary = process_ticket.validate_summary(
            sample_summary(), [{"id": "C1", "text": "A restart did not help."}], str
        )
        markdown = process_ticket.review_markdown(summary, [], [])
        self.assertIn("## Conclusion", markdown)
        self.assertIn("No reusable procedure was established", markdown)
        self.assertIn("C1", markdown)


class LocalServerChecks(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.release = threading.Event()

        def fake_processor(ticket, folder, *_args, progress=None, **_kwargs):
            progress("Reading messages")
            self.release.wait(3)
            result = {"summary": sample_summary(), "markdown": "A reviewed draft"}
            (folder / "notion-draft.md").write_text(result["markdown"])
            (folder / "processed.json").write_text(json.dumps(result))
            return result

        self.server = local_review.ReviewServer(
            ("127.0.0.1", 0), Path(self.folder.name), fake_processor
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.release.set()
        self.server.shutdown()
        self.server.server_close()
        self.folder.cleanup()

    def request(self, path, data=None, headers=None, token=True):
        own_headers = {"Origin": self.server.origin}
        if token:
            own_headers["X-Review-Token"] = self.server.token
        own_headers.update(headers or {})
        body = json.dumps(data).encode() if data is not None else None
        return urllib.request.urlopen(
            urllib.request.Request(
                self.server.origin + path, data=body, headers=own_headers
            ),
            timeout=3,
        )

    def test_foreign_origin_host_and_missing_token_are_rejected(self):
        for headers, token in [
            ({"Origin": "https://outside.example"}, True),
            ({"Host": "outside.example"}, True),
            ({}, False),
        ]:
            with self.assertRaises(urllib.error.HTTPError) as error:
                self.request(
                    "/api/jobs",
                    {"ticket": {"comments": [{"body": "Test"}]}},
                    headers,
                    token,
                )
            self.assertEqual(error.exception.code, 403)

    def test_one_local_job_continues_without_a_browser_connection(self):
        response = json.load(
            self.request(
                "/api/jobs",
                {"ticket": {"comments": [{"body": "Test"}]}, "readImages": False},
            )
        )
        key = response["id"]
        with self.assertRaises(urllib.error.HTTPError) as error:
            self.request("/api/jobs", {"ticket": {"comments": [{"body": "Another"}]}})
        self.assertEqual(error.exception.code, 409)
        self.release.set()
        deadline = time.monotonic() + 3
        job = None
        while time.monotonic() < deadline:
            job = json.load(self.request("/api/jobs/" + key))
            if job["state"] == "ready":
                break
            time.sleep(0.01)
        self.assertEqual(job["state"], "ready")
        self.assertEqual(
            self.request("/api/jobs/" + key + "/notion-draft.md").read(),
            b"A reviewed draft",
        )
        with self.assertRaises(urllib.error.HTTPError):
            self.request("/api/jobs/" + key + "/other-file")
        self.assertNotIn("ticket", job)


if __name__ == "__main__":
    unittest.main()
