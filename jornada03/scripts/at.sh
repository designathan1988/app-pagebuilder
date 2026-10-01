#!/usr/bin/env bash
# at.sh "<text>" [frame|ui] [n] → "x y" of the n-th visible item whose words start with <text> (the canvas by default)
here=$(dirname "$0")
"$here/s.sh" look "{\"filter\":$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$1"),\"max\":400}" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const want=process.argv[1],where=process.argv[2]||"frame",n=Number(process.argv[3]||1);
const items=JSON.parse(s).items.filter(i=>(where==="frame")===i.frame&&i.t.toLowerCase().startsWith(want.toLowerCase()));
const it=items[n-1];process.stdout.write(it?`${it.x} ${it.y}`:"none")})' "$1" "$2" "$3"
