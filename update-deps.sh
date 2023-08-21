#!/bin/bash

npx esbuild ./node_modules/validate-iri/lib/Validate.js \
    --bundle --format=esm --outfile=./src/crate-builder/lib/validate-iri.js