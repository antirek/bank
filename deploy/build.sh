#!/bin/bash
set -e
cd "$(dirname "$0")/.."
docker build -f deploy/Dockerfile -t antirek/boqq:0.0.1 .
docker push antirek/boqq:0.0.1
