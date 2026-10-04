import base64
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server


class DocumentUploadTests(unittest.TestCase):
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

    def post_json(self, path, payload):
        body = json.dumps(payload).encode("utf-8")
        request = Request(
            self.base_url + path,
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        try:
            with urlopen(request, timeout=5) as response:
                return response.status, json.loads(response.read())
        except HTTPError as error:
            error.payload = json.loads(error.read())
            raise

    def test_entry_document_upload_and_readback(self):
        content = b"%PDF-1.4\n% HALO upload test\n%%EOF\n"
        try:
            status, payload = self.post_json(
                "/api/document",
            {
                "fileName": "signed-sheet.pdf",
                "mimeType": "application/pdf",
                "contentBase64": base64.b64encode(content).decode("ascii"),
                    "source": "Excused signed judge sheet",
                },
            )
        except HTTPError as error:
            self.fail(error.payload)
        self.assertEqual(status, 200)
        self.assertTrue(payload["ok"])
        document = payload["document"]
        self.assertEqual(document["fileName"], "signed-sheet.pdf")
        self.assertEqual(document["sizeBytes"], len(content))
        with urlopen(self.base_url + "/api/document/" + document["id"], timeout=5) as response:
            self.assertEqual(response.read(), content)

    def test_invalid_base64_returns_json_error(self):
        with self.assertRaises(HTTPError) as raised:
            self.post_json(
                "/api/document",
                {"fileName": "bad.pdf", "mimeType": "application/pdf", "contentBase64": "not base64"},
            )
        self.assertEqual(raised.exception.code, 400)
        payload = raised.exception.payload
        self.assertFalse(payload["ok"])
        self.assertTrue(payload["error"])


if __name__ == "__main__":
    unittest.main()
