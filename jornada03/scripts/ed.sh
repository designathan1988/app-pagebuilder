#!/usr/bin/env bash
# ed.sh "<text now on the canvas>" "<new text>": double-click it, select all, type, Escape (a person editing a text)
here=$(dirname "$0")
read -r x y <<<"$("$here/at.sh" "$1" frame "${3:-1}")"
[ "$x" = "none" ] && { echo "NOT FOUND: $1"; exit 1; }
body=$(node -e 'const [x,y,t]=process.argv.slice(1);process.stdout.write(JSON.stringify([{do:"click",x:+x,y:+y,count:2,why:"edita "+t.slice(0,20)},{do:"key",key:"Control+a"},{do:"type",text:t},{do:"key",key:"Escape"}]))' "$x" "$y" "$2")
"$here/s.sh" act "$body" | grep -o '"status":"[^"]*"'
