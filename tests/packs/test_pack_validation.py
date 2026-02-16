import tempfile
import unittest
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


class TestPackValidation(unittest.TestCase):
    def setUp(self) -> None:
        import sys

        sys.path.insert(0, str(_repo_root()))
        sys.path.insert(0, str(_repo_root() / "scripts" / "packs"))

    def test_missing_pack_json(self) -> None:
        from pack_contract import PackValidationError, validate_pack_dir

        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / "compose.pack.yml").write_text("services: {}\n", encoding="utf-8")
            (d / ".env.example").write_text("PORT_OFFSET=0\n", encoding="utf-8")
            with self.assertRaises(PackValidationError) as ctx:
                validate_pack_dir(d)
            self.assertIn("pack.json", str(ctx.exception))

    def test_invalid_pack_json_schema(self) -> None:
        from pack_contract import PackValidationError, validate_pack_dir

        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            # Missing required fields / wrong shape.
            (d / "pack.json").write_text('{"pack_id":"x"}', encoding="utf-8")
            (d / "compose.pack.yml").write_text("services: {}\n", encoding="utf-8")
            (d / ".env.example").write_text("PORT_OFFSET=0\n", encoding="utf-8")
            with self.assertRaises(PackValidationError) as ctx:
                validate_pack_dir(d)
            self.assertIn("pack_version", str(ctx.exception))

    def test_missing_compose(self) -> None:
        from pack_contract import PackValidationError, validate_pack_dir

        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / "pack.json").write_text(
                '{"pack_id":"x","pack_version":"0.1.0","required_corestack_version":">=0.1.0"}\n',
                encoding="utf-8",
            )
            (d / ".env.example").write_text("PORT_OFFSET=0\n", encoding="utf-8")
            with self.assertRaises(PackValidationError) as ctx:
                validate_pack_dir(d)
            self.assertIn("compose.pack.yml", str(ctx.exception))

    def test_container_name_is_forbidden(self) -> None:
        from pack_contract import PackValidationError, validate_pack_dir

        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / "pack.json").write_text(
                '{"pack_id":"x","pack_version":"0.1.0","required_corestack_version":">=0.1.0"}\n',
                encoding="utf-8",
            )
            (d / ".env.example").write_text("PORT_OFFSET=0\n", encoding="utf-8")
            (d / "compose.pack.yml").write_text(
                "services:\n  a:\n    image: alpine\n    container_name: a\n",
                encoding="utf-8",
            )
            with self.assertRaises(PackValidationError) as ctx:
                validate_pack_dir(d)
            self.assertIn("container_name", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
