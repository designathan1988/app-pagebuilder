#!/usr/bin/env bash
# pick.sh "<text inside>" "<breadcrumb name>": scroll the canvas until the text shows, click it, then climb to the
# named ancestor in the breadcrumb (a person's way to select a block)
here=$(dirname "$0"); S="$here/s.sh"
for i in 1 2 3 4 5 6 7 8 9 10; do
  read -r x y <<<"$("$here/at.sh" "$1")"
  [ "$x" != "none" ] && [ "$y" -gt 140 ] && [ "$y" -lt 860 ] && break
  "$S" act "{\"do\":\"wheel\",\"x\":700,\"y\":500,\"dy\":$([ $i -eq 1 ] && echo -6000 || echo 450),\"why\":\"procura\"}" >/dev/null
done
[ "$x" = "none" ] && { echo "NOT FOUND: $1"; exit 1; }
"$S" act "{\"do\":\"click\",\"x\":$x,\"y\":$y,\"why\":\"texto\"}" >/dev/null
items=$("$S" look "{\"filter\":$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$2"),\"max\":400}")
read -r bx by <<<"$(node -e 'const it=JSON.parse(process.argv[1]).items.filter(i=>!i.frame&&i.y>870&&i.t===process.argv[2]).pop();process.stdout.write(it?`${it.x} ${it.y}`:"none")' "$items" "$2")"
[ "$bx" = "none" ] && { echo "NO CRUMB: $2"; exit 1; }
"$S" act "{\"do\":\"click\",\"x\":$bx,\"y\":$by,\"why\":\"breadcrumb\"}" | grep -o '"status":"[^"]*"'
