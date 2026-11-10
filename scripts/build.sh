#!/bin/sh
# Builds the table: TypeScript → Script/tavola, SCSS → CSS/tavola.css, then the unit tests.
# Nothing is installed in the repo: npx fetches the compilers on demand.
set -e
cd "$(dirname "$0")/.."
npx -y -p typescript tsc
npx -y sass --no-source-map CSS/tavola.scss CSS/tavola.css
node --test tests/
echo "Built."
