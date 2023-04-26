#!/bin/bash

npx esbuild ./node_modules/leaflet-area-select/src/Map.SelectArea.js \
    --bundle --format=esm --outfile=./src/crate-builder/lib/Map.SelectArea.js

npx esbuild ./node_modules/@paralleldrive/cuid2/index.js \
    --bundle --format=esm --outfile=./src/crate-builder/lib/cuid2.js

npx esbuild ./node_modules/validate-iri/lib/Validate.js \
    --bundle --format=esm --outfile=./src/crate-builder/lib/validate-iri.js