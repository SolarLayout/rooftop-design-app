# The API as a container image for AWS Lambda (plan/phase-12-plan.md, decision 1), built for arm64 from this folder:
#   docker buildx build --platform linux/arm64 --provenance=false --build-arg ROOFTOP_COMMIT=<sha> -t rooftop-api apps/api
# provenance=false: Lambda refuses a manifest list. The image is uvicorn behind AWS's Lambda Web Adapter, which turns
# each invocation into an HTTP request and streams the answer back (a Function URL in RESPONSE_STREAM mode), so the
# design run's events reach the browser as they happen. Outside Lambda the adapter stays out of the way and the image
# is a plain web server on port 8080: `docker run -p 8080:8080 rooftop-api`.
# Every base is pinned by digest (decision D4 of plan/README.md).

FROM ghcr.io/astral-sh/uv:0.11.26@sha256:3d868e555f8f1dbc324afa005066cd11e1053fc4743b9808ca8025283e65efa5 AS uv
FROM public.ecr.aws/awsguru/aws-lambda-adapter:1.1.0@sha256:17cfd08eff1dfea3f6a9a1e9c65fdac80aa4919b6085e746615530f43f57d2f1 AS adapter

FROM debian:trixie-slim@sha256:a99cfc517144bc59b1978475ec53b46ecabec7e43635402ee5b77cc54cd1b20a AS build
COPY --from=uv /uv /usr/local/bin/uv
# uv's own Python, never another (apps/api/pyproject.toml, [tool.uv]); compiled to bytecode now, because Lambda's
# file system is read-only and a cold start should not compile.
ENV UV_PYTHON_PREFERENCE=only-managed \
    UV_PYTHON_INSTALL_DIR=/opt/python \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy
WORKDIR /build
COPY pyproject.toml uv.lock .python-version ./
RUN uv python install && uv sync --locked --no-dev --no-install-project
COPY src ./src
RUN uv sync --locked --no-dev --no-editable

FROM debian:trixie-slim@sha256:a99cfc517144bc59b1978475ec53b46ecabec7e43635402ee5b77cc54cd1b20a
COPY --from=adapter /lambda-adapter /opt/extensions/lambda-adapter
COPY --from=build /opt/python /opt/python
COPY --from=build /opt/venv /opt/venv
ARG ROOFTOP_COMMIT
# The adapter: the port it forwards to, the path it waits on before the first request, and the answer streamed.
# Matplotlib keeps its cache under /tmp, the one place Lambda lets a function write.
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    MPLCONFIGDIR=/tmp/matplotlib \
    PORT=8080 \
    AWS_LWA_READINESS_CHECK_PATH=/health \
    AWS_LWA_INVOKE_MODE=response_stream \
    ROOFTOP_COMMIT=${ROOFTOP_COMMIT}
USER 1000:1000
EXPOSE 8080
CMD ["uvicorn", "rooftop_api.main:app", "--host", "0.0.0.0", "--port", "8080", "--timeout-keep-alive", "75"]
