/* My skin — sunscreen monitoring sessions and the skin health record.
   Loaded after the main script and uses its globals (state, ui, smart, SPF_AR_ZONES, runSpfCam…).

   A session starts right after sunscreen is applied: a 30-frame capture records the colour of every
   face-mesh point with the fresh film on. Every N minutes the user takes a short check (15 frames);
   each point's colour drift from that reference, minus its own noise, divided by how strongly the film
   changed the skin (measured by a recent smart check, otherwise a typical value), gives how much of the
   film is still there ("hold"). Points are split by face side, so one side fading faster is caught and
   only that side is sent to reapply. Sessions are kept on this device (IndexedDB + localStorage mirror). */

const MON = {
  FILM_DE: 4,            // typical ΔE of a fresh film when no recent smart check measured it
  START_FRAMES: 30, CHECK_FRAMES: 15,
  REAPPLY: 60,           // hold % under which an area should be reapplied
  SIDE_GAP: 15,          // hold points between the face sides that count as uneven fading
  LIGHT_TOL: 12,         // L* difference from the reference capture that counts as different light
  PLACES: [['university', 'University'], ['home', 'At home'], ['work', 'Work'], ['outdoors', 'Outdoors'], ['car', 'Car'], ['other', 'Other']],
  EXPOSURE: [['low', 'Low'], ['moderate', 'Moderate'], ['high', 'High']],
  INTERVALS: [10, 15, 20, 30],
  SIDES: {R:'right side', L:'left side', all:'whole face'},
};
const SESSION_KEY = 'myskin:sessions';
const sessions = {list:[], loaded:false};
const monRun = {kind:'start'};
let monForm = null, monTimer = 0;

/* ---------------- storage ---------------- */
const recordOf = M => { const {base, cells, side, pose, bg, baseL, nextAt, pending, notified, ...r} = M; return r; };
const noPhotos = s => ({...s, checks:s.checks.map(c => { const {photo, ...r} = c; return r; })});
function mirrorSessions(){ try{ localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.list.map(noPhotos))); }catch(e){} }
async function loadSessions(){
  let ls = [], db = [];
  try{ ls = JSON.parse(localStorage.getItem(SESSION_KEY)) || []; }catch(e){}
  try{ db = await idbDo('readonly', s => s.getAll(), 'sessions') || []; }catch(e){}
  const byId = new Map();
  ls.forEach(r => { if(r && r.id) byId.set(r.id, r); });
  db.forEach(r => { if(r && r.id) byId.set(r.id, r); });          // the database copy keeps the photos
  sessions.list = [...byId.values()].sort((a, b) => b.at - a.at);
  const inDb = new Set(db.map(r => r.id));
  sessions.list.filter(r => !inDb.has(r.id)).forEach(r => idbDo('readwrite', s => s.put(r), 'sessions').catch(() => {}));
  mirrorSessions();
  sessions.loaded = true;
  if((view === 'record' || view === 'monitor') && smart.mode === 'idle') rerenderKeepScroll();
}
async function putSession(rec){
  const i = sessions.list.findIndex(x => x.id === rec.id);
  if(i >= 0) sessions.list[i] = rec; else sessions.list.push(rec);
  sessions.list.sort((a, b) => b.at - a.at);
  mirrorSessions();
  await idbDo('readwrite', s => s.put(rec), 'sessions').catch(() => {});
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
}
// save the active session's public record, keeping photos already stored for earlier checks
function saveActive(M, photo){
  const old = sessions.list.find(x => x.id === M.id);
  const photos = old ? old.checks.map(c => c.photo) : [];
  if(photo) photos[M.checks.length - 1] = photo;
  const rec = recordOf(M);
  rec.checks = rec.checks.map((c, i) => photos[i] ? {...c, photo:photos[i]} : c);
  return putSession(rec);
}
async function deleteSession(id){
  sessions.list = sessions.list.filter(r => r.id !== id);
  mirrorSessions();
  await idbDo('readwrite', s => s.delete(id), 'sessions').catch(() => {});
}
async function clearSessions(){
  sessions.list = [];
  try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
  await idbDo('readwrite', s => s.clear(), 'sessions').catch(() => {});
}
/* ---------------- AI skin analyses (pores, dark circles, pigmentation) ---------------- */
const ANA_KEY = 'myskin:analyses';
const analyses = {list:[]};
const noThumb = a => { const {thumb, ...r} = a; return r; };
function mirrorAnalyses(){ try{ localStorage.setItem(ANA_KEY, JSON.stringify(analyses.list.map(noThumb))); }catch(e){} }
async function loadAnalyses(){
  let ls = [], db = [];
  try{ ls = JSON.parse(localStorage.getItem(ANA_KEY)) || []; }catch(e){}
  try{ db = await idbDo('readonly', s => s.getAll(), 'analyses') || []; }catch(e){}
  const byId = new Map();
  ls.forEach(r => { if(r && r.id) byId.set(r.id, r); });
  db.forEach(r => { if(r && r.id) byId.set(r.id, r); });
  // the analysis already on the pore page (from before the record existed) goes in too, without its photo
  const a = state.poreAI;
  if(a && a.report && !byId.has('ana-' + a.at)) byId.set('ana-' + a.at, {id:'ana-' + a.at, at:a.at, runs:a.runs, report:a.report});
  analyses.list = [...byId.values()].sort((x, y) => y.at - x.at);
  const inDb = new Set(db.map(r => r.id));
  analyses.list.filter(r => !inDb.has(r.id)).forEach(r => idbDo('readwrite', s => s.put(r), 'analyses').catch(() => {}));
  mirrorAnalyses();
  if(view === 'record' && smart.mode === 'idle') rerenderKeepScroll();
}
async function putAnalysis(rec){
  analyses.list = analyses.list.filter(x => x.id !== rec.id).concat(rec).sort((x, y) => y.at - x.at);
  mirrorAnalyses();
  await idbDo('readwrite', s => s.put(rec), 'analyses').catch(() => {});
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
}
// called by the pore page after every AI analysis
function saveAnalysis(a, keepPhoto){
  const rec = {id:'ana-' + a.at, at:a.at, runs:a.runs, report:a.report};
  if(keepPhoto && a.thumb) rec.thumb = a.thumb;
  return putAnalysis(rec);
}
async function deleteAnalysis(id){
  analyses.list = analyses.list.filter(r => r.id !== id);
  mirrorAnalyses();
  await idbDo('readwrite', s => s.delete(id), 'analyses').catch(() => {});
}
// numeric scores for comparisons: pores 0 (fine) – 2 (enlarged), dark circles / pigmentation 0 (none) – 3 (marked)
function analysisScores(a){
  const r = a.report;
  if(!r || !r.image_ok) return null;
  const sev = v => ({none:0, mild:1, moderate:2, marked:3})[v];
  return {pores:poreScore(r), dark:r.dark_circles ? sev(r.dark_circles.level) ?? null : null, pig:r.pigmentation ? sev(r.pigmentation.level) ?? null : null};
}
function analysisLine(a){
  const r = a.report;
  if(!r.image_ok) return 'The photo isn’t clear enough.';
  const pl = poreLevel(r), d = SEV[(r.dark_circles || {}).level], p = SEV[(r.pigmentation || {}).level];
  return [pl ? `Pores: ${pl.label}` : '', d ? `Dark circles: ${d.label}` : '', p ? `Pigmentation: ${p.label}` : ''].filter(Boolean).join(' · ');
}
function openAnalysis(id){
  const a = analyses.list.find(x => x.id === id); if(!a) return;
  modal(`
    <span class="eyebrow">AI skin analysis</span>
    <h3>${dGreg(a.at, {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</h3>
    <p class="small">${dBoth(a.at)} · <span data-noi18n>${dTime(a.at)}</span></p>
    ${aiResultHtml(a, true)}
    <div class="btn-row">
      <button class="btn btn-primary" data-act="anaDownload" data-id="${esc(a.id)}">Download report</button>
      <button class="btn btn-outline" data-act="closeModal">Close</button>
    </div>
    <button class="link-btn" data-act="anaDelete" data-id="${esc(a.id)}">Delete this analysis</button>`);
}
const analysisDoc = a => `<div class="card"><span class="eyebrow">AI skin analysis</span><h2>${dGreg(a.at, {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</h2>
  <p class="small">${dBoth(a.at)} · <span data-noi18n>${dTime(a.at)}</span></p>${aiResultHtml(a, true)}</div>`;

async function deletePhotos(){
  const n = sessions.list.reduce((s, r) => s + r.checks.filter(c => c.photo).length, 0) + analyses.list.filter(a => a.thumb).length;
  if(!n) return toast('No face photos are saved.');
  if(!confirm('Delete all saved face photos? Notes and numbers stay.')) return;
  for(const r of sessions.list) if(r.checks.some(c => c.photo)) await putSession(noPhotos(r));
  for(const a of analyses.list) if(a.thumb) await putAnalysis(noThumb(a));
  state.anPhoto = false;
  if(state.monitor) state.monitor.photos = false, save();
  toast('Face photos deleted.');
  rerenderKeepScroll();
}

/* ---------------- dates: Gregorian + Hijri ---------------- */
const dGreg = (at, o) => new Date(at).toLocaleDateString(I18N.locale, o);
function dHijri(at, o){
  try{ return new Intl.DateTimeFormat(I18N.lang === 'ar' ? 'ar-SA' : I18N.lang, {calendar:'islamic-umalqura', numberingSystem:'latn', ...o}).format(new Date(at)); }
  catch(e){ return ''; }
}
const dTime = at => new Date(at).toLocaleTimeString(I18N.locale, {hour:'numeric', minute:'2-digit'});
const dBoth = at => `<span data-noi18n>${dGreg(at, {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</span> · <span data-noi18n>${dHijri(at, {day:'numeric', month:'long', year:'numeric'})}</span>`;

/* ---------------- measurement helpers ---------------- */
const zoneOf = k => SPF_AR_ZONES.find(z => z.key === k);
const holdCls = v => v == null ? {cls:'', color:'var(--muted)'} : v >= 75 ? {cls:'good', color:'#5E8F58'} : v >= MON.REAPPLY ? {cls:'warn', color:'#C99A2E'} : {cls:'bad', color:'#B5544A'};
const minHold = c => { const v = Object.values(c.hold || {}).filter(x => x != null); return v.length ? Math.min(...v) : null; };
const fmtN = (v, d = 1) => v == null ? '–' : (+v).toFixed(d);
const signed = (v, d = 1) => v == null ? '–' : (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);

function grabPhoto(){
  const v = $('#spfVideo'); if(!v || !v.videoWidth) return null;
  const w = 240, h = Math.round(v.videoHeight * w / v.videoWidth);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.translate(w, 0); x.scale(-1, 1); x.drawImage(v, 0, 0, w, h);
  try{ return c.toDataURL('image/jpeg', .72); }catch(e){ return null; }
}

// camera step for a monitoring capture: 'start' records the reference, 'check' measures the hold
function monitorStepper(kind){
  const M = kind === 'check' ? state.monitor : null;
  smart.mode = 'monitor'; smart.basePose = M ? M.pose : null; smart.poseGood = true;
  if(M && M.bg) smart.bgBase = M.bg;     // compensate exposure against the reference capture's background
  setSmartCtl('monitor');
  const prog = $('#spfProg'), fill = $('#spfFill'), txt = $('#spfTxt');
  prog.classList.add('show');
  const need = kind === 'start' ? MON.START_FRAMES : MON.CHECK_FRAMES;
  const acc = {}, poses = [];
  let prep = 0, n = 0, lightSince = 0, lightShift = false, lastLm = null;
  SPF_AR_ZONES.forEach(z => acc[z.key] = {cells:null, spec:[], gloss:[], tex:[], L:[]});

  const finish = () => {
    const meas = {};
    SPF_AR_ZONES.forEach(z => {
      const a = acc[z.key];
      meas[z.key] = {
        cells: a.cells.map(list => {
          if(list.length < 3) return null;
          const m = avgLab(list);
          return {mean:m.map(v => Math.round(v * 100) / 100), sd:Math.round(Math.sqrt(mean(list.map(c => labDist(c, m) ** 2))) * 100) / 100};
        }),
        spec:mean(a.spec), gloss:mean(a.gloss), tex:mean(a.tex), L:mean(a.L)
      };
    });
    const wantPhoto = kind === 'start' ? monForm && monForm.photos === 'yes' : M && M.photos;
    const photo = wantPhoto ? grabPhoto() : null;
    if(kind === 'start') monStartDone(meas, lastLm, poses.length ? avgPose(poses) : null, photo);
    else monCheckDone(meas, photo, lightShift);
    setTimeout(() => { stopCamera(); rerenderKeepScroll(); }, 0);
    return true;
  };

  return {step({dt, now, fr, isNew, ctx, W, H, hint}){
    if(!smart.tracked){
      toast('Face tracking is needed for monitoring — check your connection and try again.');
      setTimeout(stopCamera, 0); return true;
    }
    if(!fr || !fr.face){ hint.textContent = `Place your face inside the frame`; return; }
    SPF_AR_ZONES.forEach(z => paintZone(ctx, fr.geo[z.key], W, H, '255,255,255', .12, 2));
    if(prep < PREP_MS){ prep += dt; hint.textContent = 'Adjusting camera exposure…'; return; }
    if(!isNew) return;
    if(!fr.q.light){ hint.textContent = fr.q.dark ? `Too dark — face a window or a light source` : `Too much light on your face — move out of direct light`; return; }
    if(!fr.q.dist){ hint.textContent = `Move closer so your face fills the frame`; return; }
    if(!fr.q.still || fr.held || fr.handOnFace){ hint.textContent = 'Hold still and keep your hands away from your face'; return; }
    if(M && M.pose && fr.pose){ const d = poseDiff(M.pose, fr.pose); if(!poseGate(d)){ hint.textContent = poseHint(d); return; } }
    if(M && M.baseL != null){
      const Lnow = mean(SPF_AR_ZONES.map(z => fr.meas[z.key].L));
      if(Math.abs(Lnow - M.baseL) > MON.LIGHT_TOL){
        if(!lightSince) lightSince = now;
        if(now - lightSince < 8000){ hint.textContent = 'The light is different from the first capture — face the same light as before'; return; }
        lightShift = true;
      }
    }
    SPF_AR_ZONES.forEach(z => {
      const a = acc[z.key], m = fr.meas[z.key];
      if(!a.cells) a.cells = m.cells.map(() => []);
      m.cells.forEach((c, i) => { if(c && a.cells[i]) a.cells[i].push(c); });
      a.spec.push(m.spec); a.gloss.push(m.gloss); a.tex.push(m.tex); a.L.push(m.L);
    });
    if(fr.pose) poses.push(fr.pose);
    lastLm = fr.lm;
    n++;
    const pct = Math.round(n / need * 100);
    fill.style.width = pct + '%';
    hint.textContent = 'Hold still — measuring…';
    txt.textContent = kind === 'start' ? `Recording your skin with fresh sunscreen… ${pct}%` : `Measuring how well your sunscreen is holding… ${pct}%`;
    if(n >= need) return finish();
  }};
}

function monStartDone(meas, lm, pose, photo){
  const at = Date.now(), f = monForm, w = ui.weather.status === 'ready' ? ui.weather : null;
  const side = {}, base = {};
  SPF_AR_ZONES.forEach(z => {
    side[z.key] = smart.cells[z.key].map(i => lm && lm[i].x < lm[1].x ? 'R' : 'L');   // image left = the person's right
    base[z.key] = meas[z.key].cells;
  });
  // how strongly the film changed each zone: from a smart check done just before, otherwise a typical value
  const L = state.spfLive, recent = L && at - L.at < 45 * 60000;
  const ref = {};
  SPF_AR_ZONES.forEach(z => { const m = recent && L.zones[z.key] && L.zones[z.key].m; ref[z.key] = m && m.dE > 1.5 ? Math.round(m.dE * 100) / 100 : MON.FILM_DE; });
  const points = SPF_AR_ZONES.reduce((s, z) => s + base[z.key].filter(Boolean).length, 0);
  const hold = {}, spec = {}, tex = {};
  SPF_AR_ZONES.forEach(z => { hold[z.key] = 100; spec[z.key] = +(meas[z.key].spec * 100).toFixed(2); tex[z.key] = +(meas[z.key].tex * 100).toFixed(2); });
  const M = {
    id:'ses-' + at, v:1, at, status:'active',
    ctx:{temp:f.temp === '' || f.temp == null ? null : +f.temp, skin:f.skin, place:f.place, placeOther:(f.placeOther || '').trim(), exposure:f.exposure,
         spf:f.spf, interval:f.interval, uv:w ? w.uv : null, uvMax:w ? w.max : null, city:w ? w.place : ''},
    photos:f.photos === 'yes', refSource:recent ? 'measured' : 'typical', ref, tracked:smart.tracked,
    checks:[{at, n:0, kind:'start', points, hold, sideHold:{R:100, L:100}, spec, tex}],
    reapplies:[],
    // working data for the next checks (not part of the saved record)
    base, cells:smart.cells, side, pose, bg:smart.bgBase, baseL:mean(SPF_AR_ZONES.map(z => meas[z.key].L)),
    nextAt:at + f.interval * 60000, pending:null
  };
  state.monitor = M; save();
  saveActive(M, photo);
  armMonitor();
  buzz([60, 50, 60]);
  toast(`Session started — next check in ${f.interval} min`);
}

function monCheckDone(meas, photo, lightShift){
  const M = state.monitor; if(!M) return;
  const at = Date.now();
  // after a reapplication the re-covered points get a fresh reference
  const rebased = M.pending;
  if(rebased){
    SPF_AR_ZONES.forEach(z => {
      M.base[z.key] = M.base[z.key].map((b, i) => (rebased === 'all' || M.side[z.key][i] === rebased) && meas[z.key].cells[i] ? meas[z.key].cells[i] : b);
    });
  }
  const hold = {}, perSide = {R:[], L:[]}, spec = {}, tex = {};
  SPF_AR_ZONES.forEach(z => {
    const b = M.base[z.key], cur = meas[z.key].cells, r = [];
    b.forEach((bc, i) => {
      if(!bc || !cur[i]) return;
      const drift = Math.max(0, labDist(cur[i].mean, bc.mean) - (2 * bc.sd + .6));
      const v = clamp(1 - drift / M.ref[z.key], 0, 1);
      r.push(v); perSide[M.side[z.key][i]].push(v);
    });
    hold[z.key] = r.length ? Math.round(100 * median(r)) : null;
    spec[z.key] = +(meas[z.key].spec * 100).toFixed(2);
    tex[z.key] = +(meas[z.key].tex * 100).toFixed(2);
  });
  const sideHold = {R:perSide.R.length ? Math.round(100 * median(perSide.R)) : null, L:perSide.L.length ? Math.round(100 * median(perSide.L)) : null};
  const weak = SPF_AR_ZONES.filter(z => hold[z.key] != null && hold[z.key] < MON.REAPPLY).map(z => z.key);
  const gap = sideHold.R != null && sideHold.L != null ? sideHold.L - sideHold.R : 0;
  let alert = null;
  if(weak.length >= SPF_AR_ZONES.length - 1) alert = {type:'all'};
  else if(Math.abs(gap) >= MON.SIDE_GAP && Math.min(sideHold.R, sideHold.L) < 80) alert = {type:'side', side:gap > 0 ? 'R' : 'L'};
  else if(weak.length) alert = {type:'zones', zones:weak};
  const c = {at, n:M.checks.length, kind:'check', hold, sideHold, spec, tex, alert};
  if(lightShift) c.light = true;
  if(rebased) c.rebased = rebased;
  M.pending = null;
  M.checks.push(c);
  M.nextAt = at + M.ctx.interval * 60000;
  delete M.notified;
  save();
  saveActive(M, photo);
  armMonitor();
  buzz(alert ? [80, 60, 80] : 140);
  toast(alert ? '⚠️ ' + alertText(alert, c) : 'Check saved — all areas are holding well.');
}

/* ---------------- schedule ---------------- */
function armMonitor(){
  clearTimeout(monTimer);
  const M = state.monitor;
  if(!M || M.notified === M.nextAt) return;
  const ms = M.nextAt - Date.now();
  if(ms <= 0) return fireMonitor();
  monTimer = setTimeout(fireMonitor, Math.min(ms, 2147483000));
}
function fireMonitor(){
  const M = state.monitor; if(!M) return;
  M.notified = M.nextAt; save();
  const body = I18N.tr('Take a 10-second check so My skin can see how your sunscreen is holding.');
  try{ if('Notification' in window && Notification.permission === 'granted') new Notification(I18N.tr('Sunscreen check due'), {body}); }catch(e){}
  toast('⏰ ' + body); buzz([80, 60, 80]);
  refreshMonitor();
}
function refreshMonitor(){
  if(smart.mode !== 'idle') return;
  const a = $('#monActive'); if(a && state.monitor) a.outerHTML = activeCardHtml(state.monitor);
  const h = $('#monHome'); if(h) h.outerHTML = monitorHomeCard();
}
setInterval(refreshMonitor, 30000);

/* ---------------- notes (written like a daily follow-up) ---------------- */
function alertText(a, c){
  if(a.type === 'all') return `Protection has dropped on the whole face (lowest ${minHold(c)}%). Reapply sunscreen on the whole face.`;
  if(a.type === 'side') return a.side === 'R'
    ? 'Reapply on the right side only — the left side will be checked again in the next cycle.'
    : 'Reapply on the left side only — the right side will be checked again in the next cycle.';
  return a.zones.map(k => `Reapply on ${zoneOf(k).my} — the film there is down to ${c.hold[k]}%.`).join(' ');
}
function checkNotes(s, i){
  const c = s.checks[i], start = s.checks[0], prev = s.checks[i - 1], out = [];
  if(c.kind === 'start'){
    out.push(`Session started right after applying sunscreen. Reference recorded on ${c.points} points across 5 face areas.`);
    out.push(s.refSource === 'measured' ? 'The strength of the sunscreen film was taken from the smart check done just before.' : 'No smart check was done just before, so a typical sunscreen film strength was used.');
    return out;
  }
  if(c.rebased) out.push(`Measured fresh after reapplying on the ${MON.SIDES[c.rebased]}.`);
  const R = c.sideHold.R, L = c.sideHold.L;
  if(c.alert && c.alert.type === 'side'){
    out.push(c.alert.side === 'R'
      ? `The right side is fading faster than the left (${R}% vs ${L}%, a gap of ${L - R} points).`
      : `The left side is fading faster than the right (${L}% vs ${R}%, a gap of ${R - L} points).`);
  }
  if(c.alert) out.push(alertText(c.alert, c));
  else {
    const low = SPF_AR_ZONES.filter(z => c.hold[z.key] != null).reduce((a, z) => c.hold[z.key] < c.hold[a.key] ? z : a, SPF_AR_ZONES[0]);
    const weak = SPF_AR_ZONES.filter(z => c.hold[z.key] != null && c.hold[z.key] < MON.REAPPLY).map(z => z.key);
    if(weak.length) out.push(alertText({type:'zones', zones:weak}, c));
    else out.push(`All areas are holding well (lowest ${c.hold[low.key]}% on ${low.my}).`);
    if(R != null && L != null && Math.abs(R - L) >= 8) out.push(`The ${R < L ? 'right' : 'left'} side is slightly behind (${Math.min(R, L)}% vs ${Math.max(R, L)}%).`);
  }
  if(prev && prev.hold){
    let worst = null;
    SPF_AR_ZONES.forEach(z => { const d = (prev.hold[z.key] ?? 100) - (c.hold[z.key] ?? 100); if(!c.rebased && d >= 10 && (!worst || d > worst.d)) worst = {z, d}; });
    if(worst) out.push(`${worst.z.name} lost ${worst.d} points since the previous check.`);
  }
  const sh = c.spec.forehead - start.spec.forehead;
  if(sh > 1.5) out.push(`Forehead shine is up ${sh.toFixed(1)} points since application (oil or sweat), which can thin the film.`);
  let tx = null;
  SPF_AR_ZONES.forEach(z => { const r = start.tex[z.key] ? (c.tex[z.key] / start.tex[z.key] - 1) * 100 : 0; if(r > 8 && (!tx || r > tx.r)) tx = {z, r}; });
  if(tx) out.push(`Texture (pore visibility) on ${tx.z.my} is ${Math.round(tx.r)}% higher than at the start of the session.`);
  if(c.tex.cheekR && c.tex.cheekL){
    const r = (c.tex.cheekR / c.tex.cheekL - 1) * 100;
    if(Math.abs(r) > 12) out.push(r > 0 ? `Pores look more visible on the right cheek than on the left (texture ${fmtN(c.tex.cheekR)} vs ${fmtN(c.tex.cheekL)}).`
                                        : `Pores look more visible on the left cheek than on the right (texture ${fmtN(c.tex.cheekL)} vs ${fmtN(c.tex.cheekR)}).`);
  }
  if(c.light) out.push('The light was different from the first capture, so this reading is less certain.');
  return out;
}

/* ---------------- statistics and comparisons ---------------- */
function sessionStats(s){
  const ch = s.checks.filter(c => c.hold);
  const t0 = s.at, end = s.endAt || (ch.length ? ch[ch.length - 1].at : s.at);
  const firstRe = s.reapplies.length ? s.reapplies[0].at : Infinity;
  const pre = ch.filter(c => c.at <= firstRe);
  const last = pre[pre.length - 1], hrs = last ? (last.at - t0) / 3600000 : 0;
  const fade = {};
  if(hrs > .15) SPF_AR_ZONES.forEach(z => { const v = last.hold[z.key]; if(v != null) fade[z.key] = (100 - v) / hrs; });
  const fk = Object.keys(fade);
  const fastest = fk.length ? fk.reduce((a, b) => fade[b] > fade[a] ? b : a) : null;
  let under = null;
  for(const c of ch){ const m = minHold(c); if(m != null && m < MON.REAPPLY){ under = (c.at - t0) / 60000; break; } }
  const sideFade = hrs > .15 && last.sideHold ? {R:(100 - last.sideHold.R) / hrs, L:(100 - last.sideHold.L) / hrs} : null;
  const asymL = ch.filter(c => c.kind === 'check' && c.sideHold && c.sideHold.R != null && c.sideHold.L != null).map(c => c.sideHold.L - c.sideHold.R);
  const f0 = ch[0] && ch[0].spec ? ch[0].spec.forehead : null, f1 = last && last.spec ? last.spec.forehead : null;
  const tex0 = ch[0] && ch[0].tex ? mean(Object.values(ch[0].tex)) : null;
  return {
    dur:Math.round((end - t0) / 60000), checks:Math.max(0, ch.length - 1), reapplies:s.reapplies.length,
    fade, fastest, avgFade:fk.length ? mean(fk.map(k => fade[k])) : null, under,
    sideFade, asym:asymL.length ? mean(asymL) : null,
    shineRise:hrs > .15 && f0 != null && f1 != null ? (f1 - f0) / hrs : null,
    tex:tex0
  };
}
// metric, unit, and whether a lower value is better
const METRICS = [
  ['avgFade', 'Average fade', '% per hour', true],
  ['under', 'Time until protection dropped below 60%', 'min', false],
  ['asym', 'Side difference (left minus right)', 'points', 'abs'],
  ['shineRise', 'Forehead shine rise', 'points per hour', true],
  ['tex', 'Texture (pore visibility) index', '', true],
  ['reapplies', 'Reapplications per session', '', null],
  ['dur', 'Session length', 'min', null],
  ['pores', 'Pores (AI analysis)', '0 fine – 2 enlarged', true],
  ['dark', 'Dark circles (AI analysis)', '0 none – 3 marked', true],
  ['pig', 'Pigmentation (AI analysis)', '0 none – 3 marked', true],
];
function aggregate(list, anas = []){
  const st = list.map(sessionStats), sc = anas.map(analysisScores).filter(Boolean), o = {n:list.length, na:anas.length};
  METRICS.forEach(([k]) => {
    const src = ['pores', 'dark', 'pig'].includes(k) ? sc : st;
    const v = src.map(x => x[k]).filter(x => x != null); o[k] = v.length ? mean(v) : null;
  });
  return o;
}
function verdict(k, prev, cur){
  const m = METRICS.find(x => x[0] === k);
  if(prev == null || cur == null || m[3] == null) return {t:'', cls:''};
  const a = m[3] === 'abs' ? Math.abs(prev) : prev, b = m[3] === 'abs' ? Math.abs(cur) : cur;
  const rel = Math.abs(b - a) / Math.max(1e-6, Math.abs(a));
  if(rel < .08 || Math.abs(b - a) < .3) return {t:'about the same', cls:''};
  const better = m[3] === false ? b > a : b < a;
  return better ? {t:'better', cls:'good'} : {t:'worse', cls:'bad'};
}
const PERIODS = [['day', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly'], ['year', 'Yearly']];
function periodStart(at, type){
  const d = new Date(at); d.setHours(0, 0, 0, 0);
  if(type === 'week') d.setDate(d.getDate() - d.getDay());          // weeks start on Sunday
  if(type === 'month') d.setDate(1);
  if(type === 'year') d.setMonth(0, 1);
  return d.getTime();
}
function periodEnd(start, type){
  const d = new Date(start);
  if(type === 'day') d.setDate(d.getDate() + 1);
  if(type === 'week') d.setDate(d.getDate() + 7);
  if(type === 'month') d.setMonth(d.getMonth() + 1);
  if(type === 'year') d.setFullYear(d.getFullYear() + 1);
  return d.getTime() - 1;
}
function groupSessions(type){
  const map = new Map(), amap = new Map();
  sessions.list.forEach(s => { const k = periodStart(s.at, type); if(!map.has(k)) map.set(k, []); map.get(k).push(s); });
  analyses.list.forEach(a => { const k = periodStart(a.at, type); if(!map.has(k)) map.set(k, []); if(!amap.has(k)) amap.set(k, []); amap.get(k).push(a); });
  const keys = [...map.keys()].sort((a, b) => a - b);
  // number periods from the first one with data (Week 1, Week 2…), counting empty periods in between
  const first = new Date(keys[0] || 0);
  const nth = k => { const d = new Date(k);
    if(type === 'month') return (d.getFullYear() - first.getFullYear()) * 12 + d.getMonth() - first.getMonth() + 1;
    if(type === 'year') return d.getFullYear() - first.getFullYear() + 1;
    return Math.round((k - keys[0]) / ((type === 'week' ? 7 : 1) * 86400000)) + 1; };
  return keys.map(k => { const anas = (amap.get(k) || []).sort((a, b) => a.at - b.at);
    return {start:k, end:periodEnd(k, type), n:nth(k), list:map.get(k).sort((a, b) => a.at - b.at), anas, agg:aggregate(map.get(k), anas)}; });
}
function periodLabel(g, type){
  const name = {day:'Day', week:'Week', month:'Month', year:'Year'}[type];
  let g1, h1;
  if(type === 'day'){ g1 = dGreg(g.start, {weekday:'long', day:'numeric', month:'long', year:'numeric'}); h1 = dHijri(g.start, {day:'numeric', month:'long', year:'numeric'}); }
  else if(type === 'week'){ g1 = dGreg(g.start, {day:'numeric', month:'short'}) + ' – ' + dGreg(g.end, {day:'numeric', month:'short', year:'numeric'}); h1 = dHijri(g.start, {day:'numeric', month:'short'}) + ' – ' + dHijri(g.end, {day:'numeric', month:'short', year:'numeric'}); }
  else if(type === 'month'){ g1 = dGreg(g.start, {month:'long', year:'numeric'}); h1 = dHijri(g.start, {month:'long', year:'numeric'}) + ' – ' + dHijri(g.end, {month:'long', year:'numeric'}); }
  else { g1 = dGreg(g.start, {year:'numeric'}); h1 = dHijri(g.start, {year:'numeric'}) + ' – ' + dHijri(g.end, {year:'numeric'}); }
  return {title:`${name} ${g.n}`, dates:`<span data-noi18n>${g1}</span> · <span data-noi18n>${h1}</span>`};
}
function metricVal(k, v){
  if(v == null) return '–';
  if(k === 'under' || k === 'dur') return fmtMins(Math.round(v));
  if(k === 'asym') return signed(v);
  if(k === 'reapplies') return fmtN(v, 1);
  return fmtN(v, 1);
}
function compareTable(prev, cur, prevTitle, curTitle){
  const rows = METRICS.filter(([k]) => prev[k] != null || cur[k] != null).map(([k, label, unit]) => {
    const vd = verdict(k, prev[k], cur[k]);
    return `<tr><td><b>${label}</b>${unit ? `<br><span class="small">${unit}</span>` : ''}</td><td>${metricVal(k, prev[k])}</td><td>${metricVal(k, cur[k])}</td>
      <td>${vd.t ? `<span class="verdict ${vd.cls}" style="padding:2px 8px;display:inline-block">${vd.t}</span>` : '–'}</td></tr>`;
  }).join('');
  return `<table class="rep-t"><tr><th>Measure</th><th>${prevTitle}</th><th>${curTitle}</th><th>Change</th></tr>
    <tr><td><b>Sessions</b></td><td>${prev.n}</td><td>${cur.n}</td><td></td></tr>
    <tr><td><b>AI skin analyses</b></td><td>${prev.na || 0}</td><td>${cur.na || 0}</td><td></td></tr>${rows}</table>`;
}
// sentences comparing one session with the previous calendar week
function weekCompareNotes(s){
  const ws = periodStart(s.at, 'week'), pws = periodStart(ws - 86400000, 'week');
  const prev = sessions.list.filter(x => x.at >= pws && x.at < ws);
  if(!prev.length) return [];
  const a = aggregate(prev), b = sessionStats(s), out = [];
  const line = (k, text) => { if(a[k] == null || b[k] == null) return; const vd = verdict(k, a[k], b[k]); out.push(text.replace('{a}', metricVal(k, a[k])).replace('{b}', metricVal(k, b[k])) + ' — ' + vd.t + '.'); };
  line('shineRise', 'Forehead shine rise: {b} points per hour (last week {a})');
  line('avgFade', 'Average fade: {b}% per hour (last week {a})');
  line('asym', 'Side difference: {b} points (last week {a})');
  line('tex', 'Texture (pore visibility) index: {b} (last week {a})');
  return out;
}
function summaryNotes(s){
  const st = sessionStats(s), out = [];
  out.push(`Session length: ${fmtMins(st.dur)}.`);
  out.push(`Checks taken: ${st.checks}.`);
  out.push(`Reapplications: ${st.reapplies}.`);
  out.push(st.under != null ? `Protection first dropped below 60% after ${fmtMins(Math.round(st.under))}.` : 'Protection stayed above 60% for the whole session.');
  if(st.avgFade != null) out.push(`Average fade: ${fmtN(st.avgFade)}% per hour; fastest on ${zoneOf(st.fastest).my} (${fmtN(st.fade[st.fastest])}% per hour).`);
  if(st.sideFade && st.sideFade.R > 0 && st.sideFade.L > 0){
    const r = st.sideFade.R / st.sideFade.L;
    if(r >= 1.3) out.push(`The right side faded ${r.toFixed(1)}× faster than the left.`);
    else if(r <= 1 / 1.3) out.push(`The left side faded ${(1 / r).toFixed(1)}× faster than the right.`);
    else out.push('Both sides faded at a similar rate.');
  }
  if(st.shineRise != null) out.push(`Forehead shine changed by ${signed(st.shineRise)} points per hour.`);
  if(st.tex != null) out.push(`Texture (pore visibility) index at the start: ${fmtN(st.tex)}.`);
  return out;
}

/* ---------------- views ---------------- */
function monitorHomeCard(){
  const M = state.monitor;
  const due = M && M.nextAt <= Date.now();
  return `
    <div class="card" id="monHome">
      <span class="eyebrow">${ic('spf', 'width:14px;height:14px;vertical-align:-2px')} Sunscreen monitoring</span>
      ${M ? `<p class="sub">Session in progress since <b>${dTime(M.at)}</b> · ${due ? '<b>Check due now</b>' : `Next check in <b>${fmtRemaining(M.nextAt - Date.now())}</b>`}</p>`
          : `<p class="sub">Track how long your sunscreen holds on each part of your face, with a short camera check every few minutes and a daily report.</p>`}
      <div class="btn-row">
        <button class="btn btn-primary" data-act="go" data-v="monitor">${M ? 'Open session' : 'Start a session'}</button>
        <button class="btn btn-outline" data-act="go" data-v="record">Skin health record</button>
      </div>
    </div>`;
}
function camCardHtml(){
  return `
    <div class="card" id="smartCard">
      <div class="cam mirror" id="spfCam">
        <video id="spfVideo" playsinline muted></video>
        <canvas id="spfCanvas"></canvas>
        <div class="cam-ph" id="spfPh">${ic('camera', 'width:34px;height:34px')}<span>${state.monitor ? 'Hold the phone like in the first capture, in the same light.' : 'Fill in the details below, then start — the video is analysed on your device only.'}</span></div>
        <div class="cam-hint" id="spfHint"></div>
      </div>
      <div class="qual" id="spfQual"></div>
      <div class="progress" id="spfProg"><div class="bar"><i id="spfFill"></i></div><span id="spfTxt"></span></div>
      <div id="spfCtl">${monitorCtlHtml(smart.mode)}</div>
    </div>`;
}
function monitorCtlHtml(mode){
  if(mode === 'busy' || mode === 'monitor') return `<div class="btn-row"><button class="btn btn-outline" data-act="spfStop">Cancel</button></div>`;
  return state.monitor ? `<div class="btn-row"><button class="btn btn-primary" data-act="monCheck">Check now</button></div>` : '';
}
function chipRow(act, opts, cur){
  return `<div class="chips">${opts.map(([v, t]) => `<button class="chip${String(cur) === String(v) ? ' on' : ''}" data-act="${act}" data-v="${v}">${t}</button>`).join('')}</div>`;
}
function startFormHtml(){
  if(!monForm){
    const w = ui.weather.status === 'ready' ? ui.weather : null;
    monForm = {temp:w ? w.temp : '', skin:state.skinType ? state.skinType.raw : null, place:null, placeOther:'',
      exposure:w ? (w.uv < 3 ? 'low' : w.uv < 8 ? 'moderate' : 'high') : null,
      spf:(ui.spf && ui.spf.spf) || (state.spf && state.spf.spf) || null, interval:15, photos:null};
  }
  const f = monForm;
  const recent = state.spfLive && Date.now() - state.spfLive.at < 45 * 60000;
  return `
    <div class="card" id="monForm">
      <span class="eyebrow">Session details</span>
      ${recent ? '' : `<div class="notice">Tip: do the smart check on the sunscreen page while applying — the session then knows exactly how strong your film is.</div>`}
      <div class="field"><label for="monTemp">Temperature (°C)</label>
        <input class="input" id="monTemp" type="number" inputmode="numeric" value="${esc(f.temp ?? '')}" data-mon="temp"></div>
      <div class="field"><span class="field-label">Skin type</span>${chipRow('monSet', Object.keys(TYPE_INFO).map(k => ['skin:' + k, TYPE_INFO[k].label]), 'skin:' + f.skin)}</div>
      <div class="field"><span class="field-label">Where are you?</span>${chipRow('monSet', MON.PLACES.map(([v, t]) => ['place:' + v, t]), 'place:' + f.place)}
        ${f.place === 'other' ? `<input class="input" style="margin-top:8px" placeholder="Name the place" value="${esc(f.placeOther)}" data-mon="placeOther">` : ''}</div>
      <div class="field"><span class="field-label">Expected sun exposure / likely sun damage</span>${chipRow('monSet', MON.EXPOSURE.map(([v, t]) => ['exposure:' + v, t]), 'exposure:' + f.exposure)}</div>
      <div class="field"><span class="field-label">Your product’s SPF</span>${chipRow('monSet', ['15', '30', '50+', 'Not sure'].map(v => ['spf:' + v, v === 'Not sure' ? v : 'SPF ' + v]), 'spf:' + f.spf)}</div>
      <div class="field"><span class="field-label">Check every</span>${chipRow('monSet', MON.INTERVALS.map(m => ['interval:' + m, m + ' min']), 'interval:' + f.interval)}</div>
      <div class="field"><span class="field-label">Face photos</span>
        <button class="opt${f.photos === 'yes' ? ' on' : ''}" data-act="monSet" data-v="photos:yes"><b>Save a small face photo with each check</b><span>Kept only on this device, inside your skin health record. You can delete the photos at any time.</span></button>
        <button class="opt${f.photos === 'no' ? ' on' : ''}" data-act="monSet" data-v="photos:no"><b>Notes and numbers only — no photos</b><span>Only the measurements and written notes are saved.</span></button>
      </div>
      <div class="err" id="monErr"></div>
      <div class="btn-row"><button class="btn btn-primary" data-act="monStart">Start session — I have applied sunscreen</button></div>
    </div>`;
}
function zoneBars(c){
  return SPF_AR_ZONES.map(z => {
    const v = c.hold[z.key], k = holdCls(v);
    return `<div class="prot-row"><span>${z.name}</span><div class="prot-bar"><i style="width:${v ?? 0}%;background:${k.color}"></i></div><b style="color:${k.color}">${v == null ? '–' : v + '%'}</b></div>`;
  }).join('');
}
function activeCardHtml(M){
  const last = M.checks[M.checks.length - 1], due = M.nextAt <= Date.now();
  const elapsed = Math.round((Date.now() - M.at) / 60000);
  const side = last.sideHold;
  return `
    <div class="card" id="monActive">
      <span class="eyebrow">Session in progress</span>
      <p class="small" style="margin:4px 0 0">${dBoth(M.at)} · <span data-noi18n>${dTime(M.at)}</span> · ${fmtMins(elapsed)} ago</p>
      <p class="small" style="margin:4px 0 0">${ctxLine(M)}</p>
      <div class="verdict ${due ? 'warn' : ''}" style="margin-top:10px">${due ? 'Check due now — tap "Check now".' : `Next check in ${fmtRemaining(M.nextAt - Date.now())}`}</div>
      <h4 style="margin:14px 0 4px">${last.kind === 'start' ? 'Reference (fresh sunscreen)' : `Check ${last.n} · ${fmtMins(Math.round((last.at - M.at) / 60000))} after application`}</h4>
      <div class="prot">${zoneBars(last)}</div>
      <div class="prot" style="margin-top:6px">
        ${['R', 'L'].map(s => { const v = side[s], k = holdCls(v); return `<div class="prot-row"><span>${s === 'R' ? 'Right side' : 'Left side'}</span><div class="prot-bar"><i style="width:${v ?? 0}%;background:${k.color}"></i></div><b style="color:${k.color}">${v == null ? '–' : v + '%'}</b></div>`; }).join('')}
      </div>
      <ul class="list small" style="margin-top:10px">${checkNotes(M, M.checks.length - 1).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="field"><span class="field-label">I reapplied sunscreen on</span>
        <div class="chips">${Object.entries(MON.SIDES).map(([k, t]) => `<button class="chip${M.pending === k ? ' on' : ''}" data-act="monReapply" data-v="${k}">${t}</button>`).join('')}</div>
      </div>
      <div class="btn-row">
        <button class="btn btn-outline" data-act="monOpen" data-id="${M.id}">Today’s report</button>
        <button class="btn btn-dark" data-act="monEnd">End session</button>
      </div>
    </div>`;
}
function ctxLine(s){
  const c = s.ctx, parts = [];
  const place = c.place === 'other' ? (c.placeOther || 'Other') : (MON.PLACES.find(p => p[0] === c.place) || [0, ''])[1];
  if(place) parts.push(`Place: ${place}`);
  if(c.temp != null) parts.push(`Temperature: ${c.temp}°`);
  if(c.uv != null) parts.push(`UV at start: ${c.uv}`);
  if(c.skin && TYPE_INFO[c.skin]) parts.push(`Skin type: ${TYPE_INFO[c.skin].label}`);
  if(c.exposure) parts.push(`Sun exposure: ${(MON.EXPOSURE.find(e => e[0] === c.exposure) || [0, ''])[1]}`);
  parts.push(c.spf && c.spf !== 'Not sure' ? `SPF ${c.spf}` : 'SPF not given');
  parts.push(`Checks every ${c.interval} min`);
  parts.push(s.photos ? 'Face photos: saved' : 'Face photos: not saved');
  return parts.map(p => esc(p)).join(' · ');
}
function viewMonitor(){
  const M = state.monitor;
  return `
    <div class="card">
      <span class="eyebrow">Sunscreen monitoring session</span>
      <h2>${M ? 'Session in progress' : 'Start a monitoring session'}</h2>
      <p class="sub">Start right after you apply sunscreen. Every few minutes you take a short camera check; My skin compares each area of your face with the moment you applied it, finds which side is fading faster and tells you exactly where to reapply. Everything is written into your skin health record.</p>
      <p class="small">Checks run while this page is open: you get a reminder when one is due, then a 10-second scan.</p>
    </div>
    ${camCardHtml()}
    ${M ? activeCardHtml(M) : startFormHtml()}
    <div class="btn-row"><button class="btn btn-outline" data-act="go" data-v="record">Open my skin health record</button></div>`;
}

function sessionReportHtml(s, full){
  const rows = s.checks.filter(c => c.hold).map(c => `<tr>
      <td style="white-space:nowrap"><span data-noi18n>${dTime(c.at)}</span><br><span class="small">${c.kind === 'start' ? 'start' : '+' + fmtMins(Math.round((c.at - s.at) / 60000))}</span></td>
      ${SPF_AR_ZONES.map(z => { const v = c.hold[z.key]; return `<td style="color:${holdCls(v).color};font-weight:700">${v == null ? '–' : v + '%'}</td>`; }).join('')}
      <td style="white-space:nowrap">${c.sideHold.R ?? '–'} / ${c.sideHold.L ?? '–'}</td></tr>`).join('');
  const notes = s.checks.map((c, i) => `
      <li><b>${c.kind === 'start' ? 'Start' : `Check ${c.n}`}</b> · <span data-noi18n>${dTime(c.at)}</span>
        <ul>${checkNotes(s, i).map(x => `<li>${esc(x)}</li>`).join('')}</ul></li>`).join('');
  const re = s.reapplies.map(r => `<li><span data-noi18n>${dTime(r.at)}</span> · ${MON.SIDES[r.target]}</li>`).join('');
  const photos = s.checks.filter(c => c.photo);
  const cmp = weekCompareNotes(s);
  const end = s.endAt ? `<span data-noi18n>${dTime(s.at)} – ${dTime(s.endAt)}</span>` : `<span data-noi18n>${dTime(s.at)}</span> · in progress`;
  return `
    <p class="small" style="margin:0 0 6px">${dBoth(s.at)} · ${end}</p>
    <p class="small" style="margin:0 0 10px">${ctxLine(s)}</p>
    <h4 style="margin:10px 0 4px">Film hold by area</h4>
    <div style="overflow-x:auto"><table class="rep-t">
      <tr><th>Time</th>${SPF_AR_ZONES.map(z => `<th>${z.name}</th>`).join('')}<th>Right / left</th></tr>${rows}
    </table></div>
    <h4 style="margin:14px 0 4px">Follow-up notes</h4>
    <ul class="list small">${notes}</ul>
    ${re ? `<h4 style="margin:14px 0 4px">Reapplications</h4><ul class="list small">${re}</ul>` : ''}
    <h4 style="margin:14px 0 4px">Summary</h4>
    <ul class="list small">${summaryNotes(s).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${cmp.length ? `<h4 style="margin:14px 0 4px">Compared with last week</h4><ul class="list small">${cmp.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${photos.length ? `<h4 style="margin:14px 0 4px">Face photos</h4><div class="mon-photos">${photos.map(c => `<figure><img src="${c.photo}" alt=""><figcaption data-noi18n>${dTime(c.at)}</figcaption></figure>`).join('')}</div>` : ''}
    <p class="small" style="margin-top:10px">Hold = how much of the colour change made by the fresh sunscreen film is still there, measured on each face-mesh point and compared with the start of the session (CIELAB ΔE, minus each point’s own noise). It is an estimate from the camera, not a lab test or a medical diagnosis.</p>`;
}
function openSession(id){
  const s = sessions.list.find(x => x.id === id);
  if(!s) return;
  modal(`
    <span class="eyebrow">Daily sunscreen follow-up report</span>
    <h3>${dGreg(s.at, {weekday:'long', day:'numeric', month:'long'})}</h3>
    ${sessionReportHtml(s)}
    <div class="btn-row">
      <button class="btn btn-primary" data-act="monDownload" data-id="${esc(s.id)}">Download report</button>
      <button class="btn btn-outline" data-act="closeModal">Close</button>
    </div>
    ${s.status === 'done' ? `<button class="link-btn" data-act="monDelete" data-id="${esc(s.id)}">Delete this session</button>` : ''}`);
}

function viewRecord(){
  const type = ui.recPeriod || 'week';
  const groups = groupSessions(type);
  const photos = sessions.list.reduce((n, s) => n + s.checks.filter(c => c.photo).length, 0) + analyses.list.filter(a => a.thumb).length;
  const any = sessions.list.length + analyses.list.length;
  const latest = groups[groups.length - 1], prev = groups[groups.length - 2];
  let cmp = '';
  if(latest && prev){
    const a = periodLabel(prev, type), b = periodLabel(latest, type);
    cmp = `<div class="card">
      <span class="eyebrow">Automatic comparison</span>
      <h3>${b.title} vs ${a.title}</h3>
      <p class="small">${b.dates}<br>${a.dates}</p>
      <div style="overflow-x:auto">${compareTable(prev.agg, latest.agg, a.title, b.title)}</div>
    </div>`;
  } else if(latest){
    cmp = `<div class="card"><span class="eyebrow">Automatic comparison</span><p class="sub">Comparisons appear once you have records in two different periods.</p></div>`;
  }
  const list = groups.slice().reverse().map((g, i, arr) => {
    const lab = periodLabel(g, type), before = arr[i + 1];
    const changes = before ? METRICS.filter(m => m[3] != null).map(([k, label]) => { const vd = verdict(k, before.agg[k], g.agg[k]); return vd.t && vd.t !== 'about the same' ? `<li>${label}: <b class="${vd.cls}">${vd.t}</b> (${metricVal(k, before.agg[k])} → ${metricVal(k, g.agg[k])})</li>` : ''; }).join('') : '';
    return `<div class="card">
      <span class="eyebrow">${lab.title} · ${g.n === 1 ? 'first period · ' : ''}${g.list.length} sessions · ${g.anas.length} analyses</span>
      <p class="small" style="margin:4px 0 8px">${lab.dates}</p>
      ${g.list.length ? `<p class="small" style="margin:0">Average fade ${metricVal('avgFade', g.agg.avgFade)}% per hour · forehead shine rise ${metricVal('shineRise', g.agg.shineRise)} · side difference ${metricVal('asym', g.agg.asym)} · texture ${metricVal('tex', g.agg.tex)}</p>` : ''}
      ${g.anas.slice().reverse().map(a => `
        <button class="rep" data-act="anaOpen" data-id="${esc(a.id)}">
          ${a.thumb ? `<img class="rep-thumb" src="${a.thumb}" alt="">` : `<span class="ring" style="--p:100;--c:var(--rose)"><b>${ic('sparkle', 'width:16px;height:16px')}</b></span>`}
          <span class="rep-body"><b>AI skin analysis · ${dGreg(a.at, {weekday:'short', day:'numeric', month:'short'})} · <span data-noi18n>${dTime(a.at)}</span></b>
            <span><span data-noi18n>${dHijri(a.at, {day:'numeric', month:'long', year:'numeric'})}</span> · ${analysisLine(a)}</span></span>
          ${ic('chevron', 'color:var(--muted)')}
        </button>`).join('')}
      ${changes ? `<p class="small" style="margin:8px 0 0"><b>Compared with ${periodLabel(before, type).title}:</b></p><ul class="list small">${changes}</ul>` : ''}
      ${g.list.slice().reverse().map(s => { const st = sessionStats(s), m = minHold(s.checks[s.checks.length - 1]); return `
        <button class="rep" data-act="monOpen" data-id="${esc(s.id)}">
          <span class="ring" style="--p:${m ?? 0};--c:${holdCls(m).color}"><b>${m == null ? '–' : m + '%'}</b></span>
          <span class="rep-body"><b>${dGreg(s.at, {weekday:'short', day:'numeric', month:'short'})} · <span data-noi18n>${dTime(s.at)}</span></b>
            <span><span data-noi18n>${dHijri(s.at, {day:'numeric', month:'long', year:'numeric'})}</span> · ${fmtMins(st.dur)} · ${st.checks} checks${s.status === 'active' ? ' · in progress' : ''}</span></span>
          ${ic('chevron', 'color:var(--muted)')}
        </button>`; }).join('')}
    </div>`;
  }).join('');
  return `
    <div class="card">
      <span class="eyebrow">Skin health record</span>
      <h2>Your sunscreen follow-up file</h2>
      <p class="sub">Every monitoring session and AI skin analysis (pores, dark circles, pigmentation) is filed here by day, week, month and year, with Gregorian and Hijri dates, and compared automatically with the period before.</p>
      <p class="small">${sessions.list.length} sessions · ${analyses.list.length} analyses · ${photos ? `${photos} face photos saved on this device` : 'no face photos saved'}. Everything stays on this device.</p>
      <div class="chips" style="margin-top:10px">${PERIODS.map(([k, t]) => `<button class="chip${type === k ? ' on' : ''}" data-act="recPeriod" data-v="${k}">${t}</button>`).join('')}</div>
      <div class="btn-row">
        ${any ? `<button class="btn btn-primary" data-act="recExport">Export the record</button><button class="btn btn-outline" data-act="recBackup">Save backup file</button>` : ''}
        <button class="btn btn-outline" data-act="recRestore">Restore from file</button>
      </div>
      ${photos ? `<button class="link-btn" data-act="recPhotos">Delete all face photos</button>` : ''}
      <input type="file" id="recFile" accept=".json,application/json" hidden>
    </div>
    ${any ? cmp + list : `<div class="card"><p class="sub">Nothing recorded yet. Start a monitoring session right after you apply sunscreen, or take an AI skin analysis.</p>
      <div class="btn-row"><button class="btn btn-primary" data-act="go" data-v="monitor">Start a session</button><button class="btn btn-outline" data-act="go" data-v="pore">AI skin analysis</button></div></div>`}`;
}

/* ---------------- export ---------------- */
function docHtml(title, body){
  const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
  return I18N.translateHtml(`<!doctype html><html lang="${I18N.lang}" dir="${I18N.LANGS[I18N.lang].dir}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${css}</style></head>
<body><div class="app" style="padding-bottom:24px">${body}
<p class="disclaimer">Generated by My skin on this device. Guidance only — not a medical assessment.</p></div></body></html>`);
}
function downloadSession(id){
  const s = sessions.list.find(x => x.id === id); if(!s) return;
  saveFile(`my-skin-daily-report-${stamp(s.at)}.html`, docHtml('Daily sunscreen follow-up report',
    `<div class="card"><span class="eyebrow">Daily sunscreen follow-up report</span><h2>${dGreg(s.at, {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</h2>${sessionReportHtml(s, true)}</div>`), 'text/html');
}
function exportRecord(){
  const parts = [];
  const m = state.medical;
  parts.push(`<div class="card"><span class="eyebrow">Skin health record</span><h2>My skin</h2>
    <p class="small">${dBoth(Date.now())}</p>
    ${m ? `<p class="small">${m.age ? `Age ${esc(m.age)} · ` : ''}${state.skinType ? `Skin type: ${esc(state.skinType.label)} · ` : ''}${esc((m.conditions || []).join(', '))}</p>` : ''}</div>`);
  PERIODS.slice(1).forEach(([type, t]) => {
    const g = groupSessions(type);
    if(g.length < 2) return;
    const rows = g.slice(1).map((cur, i) => { const a = periodLabel(g[i], type), b = periodLabel(cur, type);
      return `<h4 style="margin:12px 0 4px">${b.title} vs ${a.title}</h4><div style="overflow-x:auto">${compareTable(g[i].agg, cur.agg, a.title, b.title)}</div>`; }).join('');
    parts.push(`<div class="card"><span class="eyebrow">${t}</span>${rows}</div>`);
  });
  [...sessions.list.map(s => ({at:s.at, html:
    `<div class="card"><span class="eyebrow">Daily sunscreen follow-up report</span><h2>${dGreg(s.at, {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</h2>${sessionReportHtml(s, true)}</div>`})),
   ...analyses.list.map(a => ({at:a.at, html:analysisDoc(a)}))].sort((a, b) => a.at - b.at).forEach(x => parts.push(x.html));
  saveFile(`my-skin-health-record-${stamp(Date.now())}.html`, docHtml('Skin health record', parts.join('')), 'text/html');
}
function backupSessions(){
  saveFile(`my-skin-health-record-${stamp(Date.now())}.json`, JSON.stringify({app:'my-skin', kind:'sessions', v:2, sessions:sessions.list, analyses:analyses.list}), 'application/json');
}
async function restoreSessions(file){
  if(!file) return;
  try{
    const d = JSON.parse(await file.text());
    const list = (Array.isArray(d) ? d : d.sessions || []).filter(r => r && typeof r.id === 'string' && r.at && Array.isArray(r.checks) && r.ctx);
    const alist = (d.analyses || []).filter(r => r && typeof r.id === 'string' && r.at && r.report);
    if(!list.length && !alist.length) throw new Error('empty');
    const known = new Set(sessions.list.map(r => r.id)), aknown = new Set(analyses.list.map(r => r.id));
    let added = 0;
    for(const r of list) if(!known.has(r.id)){ await putSession({...r, status:r.status === 'active' ? 'done' : r.status}); added++; }
    for(const r of alist) if(!aknown.has(r.id)){ await putAnalysis(r); added++; }
    toast(`Restored ${added} records`);
    rerenderKeepScroll();
  }catch(e){ toast('That file is not a My skin sessions backup.'); }
}

/* ---------------- actions ---------------- */
async function monStart(){
  const f = monForm, err = $('#monErr');
  const t = $('#monTemp'); if(t) f.temp = t.value;
  const miss = !f.skin ? 'Choose your skin type.' : !f.place ? 'Choose where you are.' : f.place === 'other' && !f.placeOther.trim() ? 'Name the place.'
    : !f.exposure ? 'Choose your expected sun exposure.' : !f.photos ? 'Choose whether to save face photos.' : '';
  if(miss){ err.textContent = miss; err.scrollIntoView({block:'center', behavior:'smooth'}); return; }
  err.textContent = '';
  if('Notification' in window && Notification.permission === 'default'){ try{ await Notification.requestPermission(); }catch(e){} }
  monRun.kind = 'start';
  window.scrollTo({top:0, behavior:'smooth'});
  runSpfCam('monitor');
}
function monCheck(){
  if(!state.monitor) return;
  monRun.kind = 'check';
  window.scrollTo({top:0, behavior:'smooth'});
  runSpfCam('monitor');
}
async function monEnd(){
  const M = state.monitor; if(!M) return;
  if(!confirm('End this monitoring session? Its report stays in your skin health record.')) return;
  M.status = 'done'; M.endAt = Date.now();
  await saveActive(M);
  state.monitor = null; save(); clearTimeout(monTimer);
  monForm = null;
  rerenderKeepScroll();
  openSession(M.id);
}
Object.assign(VIEWS, {monitor:viewMonitor, record:viewRecord});
Object.assign(ACTIONS, {
  monSet: d => {
    const [k, v] = d.v.split(':');
    const t = $('#monTemp'); if(t) monForm.temp = t.value;
    monForm[k] = k === 'interval' ? +v : v;
    const el = $('#monForm'); if(el) el.outerHTML = startFormHtml();
  },
  monStart, monCheck, monEnd,
  monReapply: d => {
    const M = state.monitor; if(!M) return;
    M.reapplies.push({at:Date.now(), target:d.v}); M.pending = d.v; save(); saveActive(M);
    toast('Noted — the next check measures the re-covered area fresh.');
    refreshMonitor();
  },
  monOpen: d => openSession(d.id),
  monDownload: d => downloadSession(d.id),
  monDelete: d => { if(confirm('Delete this session? This cannot be undone.')){ closeModal(); deleteSession(d.id).then(rerenderKeepScroll); } },
  recPeriod: d => { ui.recPeriod = d.v; rerenderKeepScroll(); },
  recExport: exportRecord,
  recBackup: backupSessions,
  recRestore: () => { const f = $('#recFile'); if(f){ f.value = ''; f.click(); } },
  recPhotos: deletePhotos,
  anaOpen: d => openAnalysis(d.id),
  anaDownload: d => { const a = analyses.list.find(x => x.id === d.id); if(a) saveFile(`my-skin-skin-analysis-${stamp(a.at)}.html`, docHtml('AI skin analysis', analysisDoc(a)), 'text/html'); },
  anaDelete: d => { if(confirm('Delete this analysis? This cannot be undone.')){ closeModal(); deleteAnalysis(d.id).then(rerenderKeepScroll); } },
});
const _reset = ACTIONS.reset;
ACTIONS.reset = () => {
  const before = state; _reset();
  if(state !== before){
    clearTimeout(monTimer); monForm = null; clearSessions();
    analyses.list = []; try{ localStorage.removeItem(ANA_KEY); }catch(e){}
    idbDo('readwrite', s => s.clear(), 'analyses').catch(() => {});
  }
};
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.mon; if(k && monForm) monForm[k] = e.target.value; });
document.addEventListener('change', e => { if(e.target.id === 'recFile') restoreSessions(e.target.files && e.target.files[0]); });

document.head.insertAdjacentHTML('beforeend', `<style>
.mon-photos{display:flex;flex-wrap:wrap;gap:8px}
.mon-photos figure{margin:0;text-align:center}
.mon-photos img{width:84px;border-radius:10px;display:block}
.mon-photos figcaption{font-size:11px;color:var(--muted)}
b.good{color:var(--good)} b.bad{color:var(--bad)}
.list ul{margin:4px 0 6px;padding-inline-start:18px}
.rep-thumb{width:46px;height:46px;border-radius:12px;object-fit:cover;flex:none}
.modal .ai-card{box-shadow:none;border:0;padding:0;margin:0}
</style>`);

loadSessions();
loadAnalyses();
armMonitor();
if(view === 'home') render();
