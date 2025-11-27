import importlib.util
import uvicorn
import pathlib

# Load the existing FastAPI module (file name contains spaces)
api_path = pathlib.Path(__file__).parent / "smart_city_api (1).py"
spec = importlib.util.spec_from_file_location("smart_city_api", str(api_path))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
app = getattr(module, "app")

if __name__ == '__main__':
    # Run without reload to support loading the module by file path
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
