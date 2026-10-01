#!/usr/bin/env bash
# setf.sh "<field label>" "<value>": click the inspector input labelled so, select all, type, Enter. When the input is
# squeezed (narrower than 25 px, the defect met in M2) it says so and uses the field's reset first, as the persona learned.
here=$(dirname "$0")
find_field() {
items=$("$here/s.sh" look "{\"filter\":$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$1"),\"max\":400}")
read -r x y w rx ry <<<"$(node -e '
const items=JSON.parse(process.argv[1]).items.filter(i=>!i.frame);const want=process.argv[2];
const inp=items.find(i=>i.tag==="input"&&i.t===want);const reset=items.find(i=>i.tag==="button"&&i.t.startsWith("Redefinir")&&i.t.endsWith(want));
process.stdout.write(inp?`${inp.x} ${inp.y} ${inp.w} ${reset?reset.x:0} ${reset?reset.y:0}`:"none")' "$items" "$1")"
}
# like a person: scroll the inspector from its top down until the field is in sight
"$here/s.sh" act '{"do":"wheel","x":1290,"y":500,"dy":-3000,"why":"inspetor topo"}' >/dev/null
for i in 1 2 3 4 5 6 7 8; do
  find_field "$1"
  [ "$x" != "none" ] && [ "$y" -gt 290 ] && [ "$y" -lt 860 ] && break
  "$here/s.sh" act '{"do":"wheel","x":1290,"y":500,"dy":250,"why":"rola inspetor"}' >/dev/null
  x=none
done
[ "$x" = "none" ] && { echo "NO FIELD: $1"; exit 1; }
if [ "$w" -lt 25 ] && [ "$rx" != "0" ]; then echo "SQUEEZED: $1 (w=$w) -> reset first"; "$here/s.sh" act "{\"do\":\"click\",\"x\":$rx,\"y\":$ry,\"why\":\"reset squeezed\"}" >/dev/null; x=$((x-4)); fi
body=$(node -e 'const [x,y,v]=process.argv.slice(1);process.stdout.write(JSON.stringify([{do:"click",x:+x,y:+y,why:"campo"},{do:"key",key:"Control+a"},{do:"type",text:v},{do:"key",key:"Enter"}]))' "$x" "$y" "$2")
"$here/s.sh" act "$body" >/dev/null
"$here/s.sh" read '{"expr":"window.__study.messages.at(-1)?.text"}'
