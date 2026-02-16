import os
import shutil
import subprocess
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
CORESTACK_BIN = REPO_ROOT / "corestack"
PACKS_DIR = REPO_ROOT / "packs"


PACK_JSON = """{
  "id": "test-runtime-pack",
  "name": "Test Runtime Pack",
  "version": "0.1.0",
  "description": "Runtime compose command test pack",
  "required_corestack_version": ">=0.1.0",
  "ports": {
    "offset_required": true,
    "exposed": ["TEST_RUNTIME_HTTP_PORT"]
  },
  "services": [
    "hello-web: tiny web service"
  ]
}
"""

PACK_COMPOSE = """services:
  hello-web:
    image: nginx:alpine
    ports:
      - "${TEST_RUNTIME_HTTP_PORT}:80"
"""

PACK_ENV_EXAMPLE = """PORT_OFFSET=0
TEST_RUNTIME_HTTP_PORT=18089
"""


def _extract_dry_run_args(output: str) -> list[str]:
    lines = output.splitlines()
    start = "DRY_RUN_COMPOSE_ARGS_BEGIN"
    end = "DRY_RUN_COMPOSE_ARGS_END"
    if start not in lines or end not in lines:
        return []
    s = lines.index(start)
    e = lines.index(end, s + 1)
    return lines[s + 1 : e]


class TestPackRuntime(unittest.TestCase):
    def setUp(self) -> None:
        self.pack_id = "test-runtime-pack"
        self.pack_dir = PACKS_DIR / self.pack_id
        if self.pack_dir.exists():
            shutil.rmtree(self.pack_dir)
        self.pack_dir.mkdir(parents=True)
        (self.pack_dir / "pack.json").write_text(PACK_JSON, encoding="utf-8")
        (self.pack_dir / "compose.pack.yml").write_text(PACK_COMPOSE, encoding="utf-8")
        (self.pack_dir / ".env.example").write_text(PACK_ENV_EXAMPLE, encoding="utf-8")

    def tearDown(self) -> None:
        if self.pack_dir.exists():
            shutil.rmtree(self.pack_dir)

    def test_pack_up_uses_only_pack_compose_file(self) -> None:
        env = os.environ.copy()
        env["CORESTACK_DRY_RUN"] = "1"

        proc = subprocess.run(
            [str(CORESTACK_BIN), "up", self.pack_id],
            cwd=str(REPO_ROOT),
            env=env,
            text=True,
            capture_output=True,
            check=False,
        )

        self.assertEqual(proc.returncode, 0, msg=proc.stderr)
        dry_run_args = _extract_dry_run_args(proc.stdout + proc.stderr)
        self.assertTrue(dry_run_args, msg=proc.stdout + proc.stderr)

        base_compose = str(REPO_ROOT / "deploy" / "compose" / "docker-compose.yml")
        pack_compose = str(self.pack_dir / "compose.pack.yml")

        self.assertIn("-f", dry_run_args)
        self.assertIn(pack_compose, dry_run_args)
        self.assertNotIn(base_compose, dry_run_args)


if __name__ == "__main__":
    unittest.main()
