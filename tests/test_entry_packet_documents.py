import io
import json
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.request import Request, urlopen

from pypdf import PdfReader

import server


class EntryPacketDocumentTests(unittest.TestCase):
    def test_certificate_only_entry_appends_certificate_without_entry_form(self):
        trial = {
            "entries": [{
                "id": "entry-1",
                "firstTime": False,
                "infoChanged": False,
                "registrationCertDocumentId": "certificate-1",
            }]
        }
        group = {
            "breed": "WH",
            "stake": "Open",
            "courses": [{"hounds": [{"entryId": "entry-1"}]}],
        }
        writer = Mock()
        document = {
            "id": "certificate-1",
            "fileName": "registration.pdf",
            "mimeType": "application/pdf",
            "content": b"%PDF",
        }

        with (
            patch.object(server, "read_entry_document", return_value=document) as read_document,
            patch.object(server, "append_document_to_writer") as append_document,
            patch.object(server, "append_asfa_entry_form_for_entry") as append_form,
        ):
            server.append_first_time_documents_for_group(writer, trial, group)

        read_document.assert_called_once_with("certificate-1")
        append_document.assert_called_once_with(writer, document)
        append_form.assert_not_called()


class AsfaEntryFormsEndpointTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.original_db_path = server.DB_PATH
        self.original_blank_path = server.BLANK_DB_PATH
        self.original_data_dir = server.DATA_DIR
        self.original_backup_dir = server.DB_BACKUP_DIR
        self.original_archive_dir = server.TRIAL_ARCHIVE_DIR
        root = Path(self.temporary.name)
        server.DATA_DIR = root / "data"
        server.DB_PATH = server.DATA_DIR / "field_trial_secretary.sqlite"
        server.DB_BACKUP_DIR = root / "backups" / "database"
        server.TRIAL_ARCHIVE_DIR = root / "backups" / "trial_archives"
        server.BLANK_DB_PATH = root / "database" / "blank_field_trial_secretary.sqlite"
        server.build_blank_database(server.BLANK_DB_PATH)
        server.build_blank_database(server.DB_PATH)
        self.httpd = server.ExclusiveTrialHTTPServer(("127.0.0.1", 0), server.FieldTrialSecretaryHandler)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f"http://127.0.0.1:{self.httpd.server_port}"

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=5)
        server.DB_PATH = self.original_db_path
        server.BLANK_DB_PATH = self.original_blank_path
        server.DATA_DIR = self.original_data_dir
        server.DB_BACKUP_DIR = self.original_backup_dir
        server.TRIAL_ARCHIVE_DIR = self.original_archive_dir
        self.temporary.cleanup()

    def test_trial_wrap_entry_forms_endpoint_returns_pdf(self):
        trial = {
            "association": "ASFA",
            "clubName": "Test Club",
            "startsOn": "2026-10-04",
            "region": "7",
            "entries": [{
                "id": "entry-1",
                "firstTime": True,
                "callName": "Dash",
                "registeredName": "Dash Registered",
                "breed": "WH",
                "className": "Open",
                "registrationNumber": "HP123456",
                "sex": "Dog",
                "owner": "Owner One",
            }],
        }
        body = json.dumps({"trial": trial}).encode("utf-8")
        request = Request(
            self.base_url + "/api/asfa-entry-forms",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )

        with urlopen(request, timeout=10) as response:
            pdf = response.read()
            content_type = response.headers.get_content_type()

        self.assertEqual(content_type, "application/pdf")
        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertEqual(len(PdfReader(io.BytesIO(pdf)).pages), 1)


if __name__ == "__main__":
    unittest.main()
