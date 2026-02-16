import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT / "scripts" / "packs") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "scripts" / "packs"))

from pack_contract import PackValidationError, ensure_env_file, validate_pack_dir


VALID_PACK_JSON = """{
  "id": "test-pack",
  "name": "Test Pack",
  "version": "0.1.0",
  "description": "Test package",
  "required_corestack_version": ">=0.1.0",
  "ports": {
    "offset_required": true,
    "exposed": ["TEST_HTTP_PORT"]
  },
  "services": [
    "test-svc: http api"
  ]
}
"""


class TestPackValidation(unittest.TestCase):
    def test_missing_pack_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / "compose.pack.yml").write_text("services: {}\n", encoding="utf-8")
            (d / ".env.example").write_text("PORT_OFFSET=0\n", encoding="utf-8")
            with self.assertRaises(PackValidationError) as ctx:
                validate_pack_dir(d)
            self.assertIn("pack.json", str(ctx.exception))

    def test_invalid_pack_json_schema(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / "pack.json").write_text('{"id":"bad"}\n', encoding="utf-8")
            (d / "compose.pack.yml").write_text(
                'services:\n  svc:\n    image: nginx:alpine\n    ports:\n      - "${TEST_HTTP_PORT}:80"\n',
                encoding="utf-8",
            )
            (d / ".env.example").write_text("PORT_OFFSET=0\nTEST_HTTP_PORT=18080\n", encoding="utf-8")
            with self.assertRaises(PackValidationError) as ctx:
                validate_pack_dir(d)
            self.assertIn("schema validation failed", str(ctx.exception))

    def test_missing_compose_pack_yml(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / "pack.json").write_text(VALID_PACK_JSON, encoding="utf-8")
            (d / ".env.example").write_text("PORT_OFFSET=0\nTEST_HTTP_PORT=18080\n", encoding="utf-8")
            with self.assertRaises(PackValidationError) as ctx:
                validate_pack_dir(d)
            self.assertIn("compose.pack.yml", str(ctx.exception))

    def test_container_name_detection(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / "pack.json").write_text(VALID_PACK_JSON, encoding="utf-8")
            (d / ".env.example").write_text("PORT_OFFSET=0\nTEST_HTTP_PORT=18080\n", encoding="utf-8")
            (d / "compose.pack.yml").write_text(
                "services:\n  svc:\n    image: nginx:alpine\n    container_name: static-name\n",
                encoding="utf-8",
            )
            with self.assertRaises(PackValidationError) as ctx:
                validate_pack_dir(d)
            self.assertIn("container_name", str(ctx.exception))

    def test_env_creation_from_env_example(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            example = d / ".env.example"
            example.write_text("PORT_OFFSET=0\nTEST_HTTP_PORT=18080\n", encoding="utf-8")

            env_path = ensure_env_file(d)

            self.assertTrue(env_path.is_file())
            self.assertEqual((d / ".env").read_text(encoding="utf-8"), example.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
