import importlib.util
from pathlib import Path
import sys


ROOT_DIR = Path(__file__).resolve().parent
BACKEND_APP_PATH = ROOT_DIR / "backend" / "app.py"
BACKEND_DIR = BACKEND_APP_PATH.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

spec = importlib.util.spec_from_file_location("resume_backend_app", BACKEND_APP_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Unable to load Flask app from {BACKEND_APP_PATH}")

module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app
