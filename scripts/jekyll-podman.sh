#!/usr/bin/env bash
set -euo pipefail

cmd="${1:-}"

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
docs_dir="${repo_root}/docs"

image="docker.io/library/ruby:3.1"

run_build() {
  podman run --rm --user 0:0 \
    -v "${docs_dir}":/srv/jekyll \
    -w /srv/jekyll \
    "${image}" \
    bash -lc "bundle config set --local path vendor/bundle && bundle install && bundle exec jekyll build"
}

run_serve() {
  podman run --rm --user 0:0 \
    -p 4000:4000 \
    -v "${docs_dir}":/srv/jekyll \
    -w /srv/jekyll \
    "${image}" \
    bash -lc "bundle config set --local path vendor/bundle && bundle install && bundle exec jekyll serve --livereload --baseurl '' --host 0.0.0.0"
}

case "${cmd}" in
  build)
    run_build
    ;;
  serve)
    run_serve
    ;;
  *)
    echo "Usage: $(basename "$0") {build|serve}" >&2
    exit 2
    ;;
esac
