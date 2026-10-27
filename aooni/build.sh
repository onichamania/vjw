#!/bin/sh
# concatenate the sources into one page
D=$(cd "$(dirname "$0")" && pwd)
S=$D/src
cat $S/00_head.html $S/10_core.js $S/20_textures.js $S/30_audio.js $S/40_build.js $S/45_mansion.js $S/60_world.js $S/70_player.js $S/80_oni.js $S/90_main.js $S/99_tail.html > $D/index.html
wc -c $D/index.html
