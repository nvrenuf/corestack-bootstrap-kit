FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /workspace

# The tool-system tests import `tool-gateway/app/*` directly (via sys.path),
# so we must install the gateway runtime deps in the test image.
COPY tool-gateway/requirements.txt /tmp/tool-gateway-requirements.txt

# Pin test deps for reproducibility.
RUN python -m pip install --no-cache-dir \
    pytest==8.3.4 \
    jsonschema==4.23.0 \
    referencing==0.36.2 \
    httpx==0.28.1 \
 && python -m pip install --no-cache-dir -r /tmp/tool-gateway-requirements.txt

ENTRYPOINT ["python", "-m", "pytest"]
