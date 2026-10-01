#!/usr/bin/env bash
# The study driver's client: s.sh <route> '<json>' (the body goes through a file, so accents survive Windows' command
# line, which re-encodes an inline curl -d argument)
f=$(mktemp)
printf '%s' "${2:-{\}}" > "$f"
curl -s "localhost:${STUDY_PORT:-5399}/$1" --data-binary @"$f"
rm -f "$f"
echo
