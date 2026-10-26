// ================= 見える・見えない（草むら・透明） =================
// 透明：4マス以内の敵には見える（本家と同じ）。アリーの必殺技は2秒ごとに0.5秒だけ見える
// 草むら：2マス以内（ボウのサークリングイーグルがいるチームは5マス）の敵からは見える
function visibleTo(team,u){if(u.dead)return false;if(u.team===team)return true;
  if(u.invisT>G.t){if(u.bt==='alli'&&u.stalkT>G.t&&((u.stalkT-G.t)%2.5)<.5)return true;for(const o of G.units)if(!o.dead&&o.team===team&&Math.hypot(o.x-u.x,o.z-u.z)<TL(4))return true;return false}
  if(!u.inBush||u.revealT>0)return true;
  for(const o of G.units)if(!o.dead&&o.team===team&&Math.hypot(o.x-u.x,o.z-u.z)<(o.bt==='bo'&&hasSP(o,'eagle')?TL(5):3.8))return true;return false}
