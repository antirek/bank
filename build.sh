#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

TAG="${TAG:-0.0.22}"

docker build -t "antirek/boqq:$TAG" .

docker push "antirek/boqq:$TAG"
