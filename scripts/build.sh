#!/bin/sh
# Builds the table: TypeScript → Script/tavola, SCSS → CSS/tavola.css, then the unit tests.
# Nothing is installed in the repo: npx fetches the compilers on demand, at fixed versions so that a local
# build and the CI (.github/workflows/check.yml) compile exactly the same files.
set -e
cd "$(dirname "$0")/.."
npx -y -p typescript@7.0.2 tsc
npx -y sass@1.108.2 --no-source-map CSS/tavola.scss CSS/tavola.css
node --test tests/
echo "Built."
