import { useEffect, useRef, useState } from "react";

/**
 * Launch: the global sweep. A wireframe globe draws itself around the mark, the source cities light up as signal points,
 * packets travel from each city into the hub, the radar sweep runs over the top, and a terminal readout reports the radar
 * coming online. On "ready" the instrument pulses and the star glints; then it lifts away into the site.
 * Shown once per browser session (decided before first paint by the inline script in layout.tsx); skipped for
 * prefers-reduced-motion; click or any key skips it. Same geometry and timing as the iOS launch screen.
 */
const READOUT = ["radar online, 34 sources", "freshness gate 7 days, primary sources first", "grading, four tiers, strict rubric", "ready"];
const CITIES = [
  [37.77, -122.42], [47.61, -122.33], [38.9, -77.04], [40.71, -74.01], [42.36, -71.06], [43.65, -79.38],
  [51.51, -0.13], [48.86, 2.35], [52.52, 13.4], [50.85, 4.35], [32.08, 34.78], [25.2, 55.27],
  [28.61, 77.21], [12.97, 77.59], [1.35, 103.82], [39.9, 116.4], [31.23, 121.47], [37.57, 126.98],
  [35.68, 139.69], [-33.87, 151.21], [-23.55, -46.63], [19.43, -99.13], [55.75, 37.62], [59.33, 18.07],
];
const STREAM = ["deepmind.google", "openai.com", "anthropic.com", "defense.gov", "darpa.mil", "nist.gov", "arxiv.org", "nature.com", "nvidia.com", "europa.eu", "cisa.gov", "fda.gov", "whitehouse.gov", "microsoft.com", "meta.com", "defensescoop.com", "breakingdefense.com", "thelancet.com", "huggingface.co", "mistral.ai"];

export default function BootScreen() {
  const [mounted, setMounted] = useState(false);
  const [lines, setLines] = useState(0);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [stamp0, setStamp0] = useState(0); // set on mount: nothing time-dependent may render during hydration
  const canvas = useRef(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (document.documentElement.dataset.boot === "skip") { setGone(true); return; }
    setStamp0(Date.now());
    setMounted(true);
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const S = 360, dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = S * dpr; c.height = S * dpr; ctx.scale(dpr, dpr);
    const cx = S / 2, cy = S / 2, R = 148, OUTER = 160, HUB = 66, TILT = 0.4;
    const blue = (a) => `rgba(46,125,255,${a})`;
    const pearl = (a) => `rgba(248,250,252,${a})`;
    const t0 = performance.now();
    let raf = 0;

    const draw = (now) => {
      const t = (now - t0) / 1000;
      const sweep = ((t % 3) / 3) * Math.PI * 2 - Math.PI / 2;
      const spin = ((t % 40) / 40) * Math.PI * 2;
      const project = (lat, lon) => {
        const φ = (lat * Math.PI) / 180, λ = (lon * Math.PI) / 180 + spin;
        const x = Math.cos(φ) * Math.sin(λ), y0 = Math.sin(φ), z0 = Math.cos(φ) * Math.cos(λ);
        const y = y0 * Math.cos(TILT) - z0 * Math.sin(TILT), z = y0 * Math.sin(TILT) + z0 * Math.cos(TILT);
        return { x: cx + x * R, y: cy - y * R, z };
      };
      const polyline = (pts, front) => {
        ctx.beginPath(); let pen = false;
        for (const p of pts) { const vis = front ? p.z >= 0 : p.z < 0; if (vis) { if (pen) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); pen = true; } } else pen = false; }
        ctx.stroke();
      };
      ctx.clearRect(0, 0, S, S);
      ctx.lineWidth = 1;
      const lines = [];
      for (let m = 0; m < 180; m += 30) { const l = []; for (let lat = -90; lat <= 90; lat += 4) l.push(project(lat, m)); lines.push(l); }
      for (let lat = -60; lat <= 60; lat += 30) { const l = []; for (let lon = 0; lon <= 360; lon += 4) l.push(project(lat, lon)); lines.push(l); }
      ctx.strokeStyle = blue(0.1); for (const l of lines) polyline(l, false);
      ctx.strokeStyle = blue(0.34); for (const l of lines) polyline(l, true);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.strokeStyle = blue(0.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, OUTER, 0, Math.PI * 2); ctx.strokeStyle = blue(readyRef.current ? 0.9 : 0.55); ctx.stroke();
      for (let k = 0; k < 72; k++) {
        const a = (k / 72) * Math.PI * 2 - Math.PI / 2;
        let d = (sweep - a) % (Math.PI * 2); if (d < 0) d += Math.PI * 2;
        const glow = Math.max(0, 1 - d / (Math.PI * 0.5));
        const r0 = OUTER + 5, r1 = OUTER + (k % 6 === 0 ? 14 : 9);
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.strokeStyle = blue(0.16 + 0.74 * glow); ctx.stroke();
      }
      CITIES.forEach(([lat, lon], i) => {
        const p = project(lat, lon); if (p.z <= 0.05) return;
        const depth = 0.35 + 0.65 * p.z;
        const sa = Math.atan2(p.y - cy, p.x - cx);
        let d = (sweep - sa) % (Math.PI * 2); if (d < 0) d += Math.PI * 2;
        const pulse = Math.max(0, 1 - d / (Math.PI * 0.7));
        const dx = cx - p.x, dy = cy - p.y, len = Math.max(1, Math.hypot(dx, dy));
        const ex = cx - (dx / len) * HUB, ey = cy - (dy / len) * HUB;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ex, ey); ctx.strokeStyle = blue(0.1 + 0.25 * pulse); ctx.stroke();
        const phase = (t * 0.45 + i * 0.37) % 1;
        ctx.beginPath(); ctx.arc(p.x + (ex - p.x) * phase, p.y + (ey - p.y) * phase, 1.5, 0, Math.PI * 2); ctx.fillStyle = pearl(0.5 * depth); ctx.fill();
        const sz = 3 + 4 * pulse;
        ctx.beginPath(); ctx.arc(p.x, p.y, sz / 2, 0, Math.PI * 2); ctx.fillStyle = pearl((0.35 + 0.65 * pulse) * depth); ctx.fill();
        if (pulse > 0.6) { const ring = 8 + 10 * (1 - pulse); ctx.beginPath(); ctx.arc(p.x, p.y, ring, 0, Math.PI * 2); ctx.strokeStyle = blue(pulse - 0.6); ctx.stroke(); }
      });
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sweep) * OUTER, cy + Math.sin(sweep) * OUTER); ctx.strokeStyle = blue(1); ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, HUB, 0, Math.PI * 2); ctx.fillStyle = "#0B1F3B"; ctx.fill(); ctx.strokeStyle = blue(readyRef.current ? 0.9 : 0.55); ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const timers = [];
    let at = 350;
    for (let i = 1; i <= READOUT.length; i++) { timers.push(setTimeout(() => setLines(i), at)); at += 640; }
    timers.push(setTimeout(() => { readyRef.current = true; setReady(true); }, at - 640 + 20));
    timers.push(setTimeout(() => setLeaving(true), 3350));
    timers.push(setTimeout(() => setGone(true), 4000));
    const skip = () => { setLeaving(true); setTimeout(() => setGone(true), 550); };
    window.addEventListener("keydown", skip);
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); window.removeEventListener("keydown", skip); };
  }, []);

  if (gone) return null;
  const stamp = (i) => (stamp0 ? new Date(stamp0 + 350 + i * 640).toLocaleTimeString("en-GB", { hour12: false }) : "");
  return (
    <div
      className={"boot" + (mounted ? " boot-on" : "") + (ready ? " boot-ready" : "") + (leaving ? " boot-leave" : "")}
      role="status" aria-live="polite"
      onClick={() => { setLeaving(true); setTimeout(() => setGone(true), 550); }}
    >
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-stream boot-stream-l" aria-hidden="true"><div>{[...STREAM, ...STREAM].map((n, i) => <span key={i}>{n}</span>)}</div></div>
      <div className="boot-stream boot-stream-r" aria-hidden="true"><div>{[...STREAM, ...STREAM].map((n, i) => <span key={i}>{n}</span>)}</div></div>
      <div className="boot-center">
        <canvas ref={canvas} className="boot-radar" aria-hidden="true" />
                <img className="boot-mark" src="/gsi-icon-512-transparent.png" alt="" width={120} height={120} />
        <span className="boot-glint" aria-hidden="true">✦</span>
      </div>
      <div className="boot-brand">
        <div className="boot-wordmark"><span className="star">✦</span>GLOBAL SI NEWS</div>
        <div className="boot-tagline">Real intelligence. A clearer tomorrow.</div>
      </div>
      <div className="boot-status">
        <div className="boot-readout">
          {READOUT.slice(0, Math.max(lines, 0)).map((l, i) => (
            <div key={i} className={"boot-ln" + (i === READOUT.length - 1 ? " last" : "")}>
              <span className="ts">{stamp(i)}</span><span>{l}</span>{i === lines - 1 && <i className="cur" />}
            </div>
          ))}
          {lines === 0 && <div className="boot-ln"><span className="ts">{stamp(0)}</span><i className="cur" /></div>}
        </div>
        <div className="boot-bar"><i /></div>
        <div className="boot-caption"><span>34 sources  /  every 30 minutes  /  primary sources first</span><span>v2.0.1</span></div>
      </div>
    </div>
  );
}
