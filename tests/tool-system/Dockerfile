FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /workspace

# Pin test deps for reproducibility.
RUN python -m pip install --no-cache-dir \
    pytest==8.3.4 \
    jsonschema==4.23.0 \
    referencing==0.36.2

ENTRYPOINT ["python", "-m", "pytest"]
