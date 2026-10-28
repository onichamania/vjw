#!/bin/sh
# concatenate the sources into one page
D=$(cd "$(dirname "$0")" && pwd)
S=$D/src
cat $S/00_head.html $S/10_core.js $S/20_textures.js $S/30_audio.js $S/40_build.js $S/45_mansion.js $S/50_annex.js $S/60_world.js $S/70_player.js $S/80_oni.js $S/85_net.js $S/90_main.js $S/92_story2.js $S/93_bath.js $S/99_tail.html > $D/index.html
wc -c $D/index.html
