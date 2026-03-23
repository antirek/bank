#!/bin/bash
set -e
cd "$(dirname "$0")"

TAG=0.0.2

docker build -t antirek/boqq:$TAG .

docker push antirek/boqq:$TAG

