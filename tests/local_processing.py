"""Small offline checks; no model calls or customer data."""

import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "process_ticket", Path(__file__).parents[1] / "scripts/process_ticket.py"
)
processor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(processor)


class PrivacyChecks(unittest.TestCase):
    def test_known_identities_and_contact_details_are_removed(self):
        scrub = processor.redactor(
            {"requester": "Alice Example", "organization": "Example Co", "comments": []}
        )
        result = scrub(
            "Alice Example at Example Co: alice@example.com, +1 (415) 555-0199. Error E42. password: abc123"
        )
        for value in (
            "Alice Example",
            "Example Co",
            "alice@example.com",
            "555-0199",
            "abc123",
        ):
            self.assertNotIn(value, result)
        self.assertIn("Error E42", result)

    def test_legacy_author_timestamps_and_first_names_are_removed(self):
        scrub = processor.redactor(
            {
                "title": "Example Company - Alice Example - Login issue",
                "comments": [{"author": "Alice ExampleInternal•Oct 07 9:54 am"}],
            }
        )
        result = scrub(
            "Alice Example confirmed Alice can access customer.example.com. Run process.py. Error E42."
        )
        for identity in ("Alice", "Example Company", "customer.example.com"):
            self.assertNotIn(identity, result)
        self.assertIn("process.py", result)
        self.assertIn("Error E42", result)

    def test_extra_terms_and_street_addresses_are_removed(self):
        scrub = processor.redactor({"comments": []}, ["Pat Sample"])
        result = scrub("Pat Sample, 1370 Harrison Street. account number: ABC123")
        for identity in ("Pat Sample", "Harrison", "ABC123"):
            self.assertNotIn(identity, result)
        self.assertIn("[ADDRESS]", result)
        self.assertIn("[ACCOUNT]", result)

    def test_card_tails_and_expiry_are_removed(self):
        scrub = processor.redactor({"comments": []})
        for text in [
            "card ending in 1234",
            "Visa - 1234",
            "expiration date is May 2035",
            "expires 05/30",
            'The expiration date is also partially visible and shows "May 2035."',
        ]:
            result = scrub(text)
            self.assertNotIn("1234", result)
            self.assertNotIn("2035", result)
            self.assertNotIn("05/30", result)
        self.assertIn("Error E42", scrub("Error E42"))

    def test_support_sender_does_not_erase_product_name(self):
        scrub = processor.redactor(
            {"comments": [{"body": "From: Productname Support <help@example.com>"}]}
        )
        self.assertIn("Productname", scrub("Open Productname Settings."))
        self.assertNotIn("Jones IT", scrub("Jones IT checked the result."))

    def test_private_media_urls_are_not_requested(self):
        for url in (
            "http://example.com/x.png",
            "https://127.0.0.1/x.png",
            "https://user:pass@example.com/x.png",
        ):
            with self.assertRaises(ValueError):
                processor.validate_public_url(url)

    def test_cloud_models_are_rejected_before_a_request(self):
        with self.assertRaises(ValueError):
            processor.generate("model:cloud", "test")

    def test_media_id_cannot_escape_the_selected_folder(self):
        with self.assertRaises(ValueError):
            processor.image_bytes({"id": "../../private"}, Path("/tmp"), False)


if __name__ == "__main__":
    unittest.main()
