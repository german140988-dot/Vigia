import { useState, useEffect, useRef, useCallback } from "react";

// ─── Initial demo cameras (YCC365plus style) ────────────────────────────────
const YCC365_RTSP_TEMPLATE = (ip, user, pass) =>
  `rtsp://${user}:${pass}@${ip}:554/onvif1`;

const initialCameras = [
  { id: 1, name: "Entrada Principal", location: "Frente", rtsp: YCC365_RTSP_TEMPLATE("192.168.1.101","admin",""), status: "online", recording: true,  source: "YCC365", motionEnabled: true,  personEnabled: true,  lastMotion: null, lastPerson: null, alerts: [] },
  { id: 2, name: "Jardín Trasero",    location: "Patio",  rtsp: YCC365_RTSP_TEMPLATE("192.168.1.102","admin",""), status: "online", recording: false, source: "YCC365", motionEnabled: true,  personEnabled: true,  lastMotion: null, lastPerson: null, alerts: [] },
  { id: 3, name: "Garaje",            location: "Lateral",rtsp: YCC365_RTSP_TEMPLATE("192.168.1.103","admin",""), status: "offline",recording: false, source: "YCC365", motionEnabled: false, personEnabled: false, lastMotion: null, lastPerson: null, alerts: [] },
  { id: 4, name: "Sala de Estar",     location: "Interior",rtsp:YCC365_RTSP_TEMPLATE("192.168.1.104","admin",""), status: "online", recording: true,  source: "manual", motionEnabled: true,  personEnabled: false, lastMotion: null, lastPerson: null, alerts: [] },
];

// ─── Styles ──────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#07090d;font-family:'Barlow',sans-serif;color:#c8d8e8;-webkit-tap-highlight-color:transparent;}
.app{max-width:430px;margin:0 auto;min-height:100vh;background:#07090d;position:relative;}
.scanlines{pointer-events:none;position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,160,.01) 2px,rgba(0,255,160,.01) 4px);z-index:999;}

/* ── HEADER ── */
.hdr{padding:18px 18px 10px;border-bottom:1px solid rgba(0,255,160,.1);background:linear-gradient(180deg,rgba(0,255,160,.06) 0%,transparent 100%);}
.hdr-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
.logo{font-family:'Share Tech Mono',monospace;font-size:17px;color:#00ffa0;letter-spacing:3px;}
.logo em{color:#fff;opacity:.45;font-style:normal;}
.sys-status{display:flex;align-items:center;gap:5px;font-size:10px;color:#00ffa0;font-family:'Share Tech Mono',monospace;}
.dot-pulse{width:6px;height:6px;border-radius:50%;background:#00ffa0;animation:dpulse 2s infinite;}
@keyframes dpulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,160,.5);}50%{box-shadow:0 0 0 5px rgba(0,255,160,0);}}
.hdr-sub{font-size:10px;color:rgba(200,216,232,.35);font-family:'Share Tech Mono',monospace;letter-spacing:1.5px;}

/* ── NAV ── */
.nav{display:flex;padding:10px 18px 0;gap:2px;border-bottom:1px solid rgba(255,255,255,.05);}
.ntab{padding:8px 12px;font-size:11px;font-weight:600;letter-spacing:.5px;border:none;background:none;color:rgba(200,216,232,.4);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;font-family:'Barlow',sans-serif;position:relative;}
.ntab.active{color:#00ffa0;border-bottom-color:#00ffa0;}
.ntab .badge{position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;background:#ff4060;}

/* ── SUMMARY ── */
.summary{display:flex;gap:6px;padding:12px 16px;background:rgba(0,0,0,.25);}
.sum-card{flex:1;text-align:center;padding:10px 2px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);}
.sum-n{font-family:'Share Tech Mono',monospace;font-size:20px;line-height:1;}
.sum-n.g{color:#00ffa0;} .sum-n.r{color:#ff4060;} .sum-n.b{color:#40b8ff;} .sum-n.y{color:#ffd060;}
.sum-l{font-size:8px;letter-spacing:.8px;color:rgba(200,216,232,.38);text-transform:uppercase;margin-top:3px;}

/* ── CAMERA CARD ── */
.cam-list{padding:0 14px 80px;display:flex;flex-direction:column;gap:10px;margin-top:2px;}
.cam-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;transition:border-color .2s,transform .15s;position:relative;}
.cam-card:active{transform:scale(.985);}
.cam-card.alert-active{border-color:rgba(255,40,60,.45);animation:alertBorder .6s ease infinite alternate;}
@keyframes alertBorder{from{border-color:rgba(255,40,60,.45);}to{border-color:rgba(255,40,60,.9);}}
.cam-card.person-active{border-color:rgba(255,208,60,.5);}
.cam-card.offline-card{opacity:.5;}

/* ── FEED ── */
.feed-wrap{height:158px;background:#0b0f14;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.feed-bg{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,45,30,.55) 0%,#0b0f14 72%);}
.feed-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,255,160,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,160,.035) 1px,transparent 1px);background-size:28px 28px;}
.feed-sim{position:absolute;inset:0;}
.feed-sim .shift{position:absolute;inset:0;animation:fshift 5s ease-in-out infinite alternate;}
@keyframes fshift{from{background:radial-gradient(ellipse 55% 38% at 28% 52%,rgba(0,60,40,.5) 0%,transparent 55%),radial-gradient(ellipse 38% 55% at 72% 38%,rgba(0,28,50,.42) 0%,transparent 55%);}
to{background:radial-gradient(ellipse 55% 38% at 38% 48%,rgba(0,60,40,.5) 0%,transparent 55%),radial-gradient(ellipse 38% 55% at 62% 42%,rgba(0,28,50,.42) 0%,transparent 55%);}}

/* motion flash overlay */
.motion-flash{position:absolute;inset:0;background:rgba(255,40,60,.08);opacity:0;pointer-events:none;border:2px solid rgba(255,40,60,.6);}
.motion-flash.show{animation:mflash .5s ease forwards;}
@keyframes mflash{0%{opacity:1;}100%{opacity:0;}}

/* person box */
.person-box{position:absolute;border:2px solid #ffd060;border-radius:3px;pointer-events:none;animation:pbox .3s ease;}
@keyframes pbox{from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);}}
.person-label{position:absolute;top:-18px;left:0;background:#ffd060;color:#07090d;font-size:9px;font-weight:700;padding:1px 5px;border-radius:2px;font-family:'Share Tech Mono',monospace;white-space:nowrap;}

/* feed overlays */
.feed-cam-label{position:absolute;top:7px;left:8px;font-family:'Share Tech Mono',monospace;font-size:9px;color:#00ffa0;background:rgba(0,0,0,.55);padding:2px 6px;border-radius:3px;letter-spacing:1px;z-index:5;}
.feed-ts{position:absolute;bottom:7px;right:8px;font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(200,216,232,.55);z-index:5;}
.feed-source{position:absolute;bottom:7px;left:8px;font-family:'Share Tech Mono',monospace;font-size:8px;color:rgba(200,216,232,.35);z-index:5;}
.rec-badge{position:absolute;top:7px;right:8px;display:flex;align-items:center;gap:3px;background:rgba(220,30,50,.9);border-radius:3px;padding:2px 6px;font-size:8px;font-weight:700;letter-spacing:1px;color:#fff;z-index:5;}
.rec-dot{width:5px;height:5px;border-radius:50%;background:#fff;animation:rblink 1s infinite;}
@keyframes rblink{0%,49%{opacity:1;}50%,100%{opacity:0;}}
.motion-badge{position:absolute;top:30px;right:8px;display:flex;align-items:center;gap:3px;background:rgba(255,90,30,.9);border-radius:3px;padding:2px 6px;font-size:8px;font-weight:700;letter-spacing:1px;color:#fff;z-index:5;animation:fadeIn .3s ease;}
.person-badge{position:absolute;top:53px;right:8px;display:flex;align-items:center;gap:3px;background:rgba(200,160,0,.92);border-radius:3px;padding:2px 6px;font-size:8px;font-weight:700;letter-spacing:1px;color:#07090d;z-index:5;animation:fadeIn .3s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}
.ai-scanning{position:absolute;inset:0;z-index:4;pointer-events:none;}
.scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,208,60,.6),transparent);animation:scanMove 1.5s linear infinite;}
@keyframes scanMove{from{top:0%;}to{top:100%;}}

/* ── CAMERA INFO ROW ── */
.cam-info{padding:9px 12px;display:flex;align-items:center;justify-content:space-between;}
.cam-name{font-size:13px;font-weight:600;color:#e8f0f8;}
.cam-loc{font-size:10px;color:rgba(200,216,232,.42);margin-top:1px;}
.cam-status{font-size:9px;font-family:'Share Tech Mono',monospace;padding:3px 8px;border-radius:20px;letter-spacing:.5px;}
.cam-status.online{background:rgba(0,255,160,.1);color:#00ffa0;border:1px solid rgba(0,255,160,.22);}
.cam-status.offline{background:rgba(255,40,60,.08);color:#ff4060;border:1px solid rgba(255,40,60,.18);}

/* ── ACTION BAR ── */
.cam-actions{display:flex;gap:1px;border-top:1px solid rgba(255,255,255,.05);}
.act-btn{flex:1;padding:9px 2px;background:none;border:none;color:rgba(200,216,232,.45);font-size:9px;font-family:'Barlow',sans-serif;cursor:pointer;transition:color .2s,background .2s;display:flex;flex-direction:column;align-items:center;gap:2px;letter-spacing:.2px;}
.act-btn:hover{color:#00ffa0;background:rgba(0,255,160,.05);}
.act-btn.danger:hover{color:#ff4060;background:rgba(255,40,60,.05);}
.act-btn .ai{font-size:13px;}

/* ── ALERTS PANEL ── */
.alert-strip{border-top:1px solid rgba(255,255,255,.05);max-height:70px;overflow-y:auto;}
.alert-item{display:flex;align-items:center;gap:8px;padding:5px 10px;border-bottom:1px solid rgba(255,255,255,.04);}
.alert-item:last-child{border-bottom:none;}
.alert-icon{font-size:11px;flex-shrink:0;}
.alert-txt{font-size:10px;color:rgba(200,216,232,.65);font-family:'Share Tech Mono',monospace;flex:1;}
.alert-time{font-size:9px;color:rgba(200,216,232,.3);font-family:'Share Tech Mono',monospace;flex-shrink:0;}

/* ── AI ANALYSIS PANEL ── */
.ai-panel{border-top:1px solid rgba(255,208,60,.15);background:rgba(255,208,60,.04);padding:10px 12px;}
.ai-panel-title{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,208,60,.6);font-family:'Share Tech Mono',monospace;margin-bottom:6px;display:flex;align-items:center;gap:5px;}
.ai-result{font-size:11px;color:rgba(200,216,232,.8);line-height:1.5;}
.ai-result.loading{color:rgba(200,216,232,.4);font-family:'Share Tech Mono',monospace;animation:blink .8s infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}

/* ── ALERTS TAB ── */
.alerts-list{padding:12px 16px;display:flex;flex-direction:column;gap:6px;}
.alert-card{padding:12px 14px;background:rgba(255,255,255,.03);border-radius:10px;border-left:3px solid;}
.alert-card.motion{border-left-color:#ff5a1e;}
.alert-card.person{border-left-color:#ffd060;}
.alert-card.offline{border-left-color:#ff4060;}
.alert-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;}
.alert-card-type{font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}
.alert-card.motion .alert-card-type{color:#ff5a1e;}
.alert-card.person .alert-card-type{color:#ffd060;}
.alert-card.offline .alert-card-type{color:#ff4060;}
.alert-card-ts{font-size:10px;color:rgba(200,216,232,.35);font-family:'Share Tech Mono',monospace;}
.alert-card-body{font-size:12px;color:rgba(200,216,232,.75);}
.alert-card-cam{font-size:10px;color:rgba(200,216,232,.4);margin-top:2px;}
.no-alerts{text-align:center;padding:40px 20px;color:rgba(200,216,232,.3);font-size:13px;}

/* ── YCC365 IMPORT ── */
.ycc-section{padding:14px 16px;}
.ycc-hero{background:linear-gradient(135deg,rgba(0,100,200,.15),rgba(0,200,120,.1));border:1px solid rgba(0,150,255,.2);border-radius:12px;padding:16px;margin-bottom:14px;}
.ycc-title{font-size:14px;font-weight:700;color:#40b8ff;margin-bottom:4px;display:flex;align-items:center;gap:6px;}
.ycc-sub{font-size:11px;color:rgba(200,216,232,.5);line-height:1.5;}
.ycc-steps{margin-top:12px;display:flex;flex-direction:column;gap:6px;}
.ycc-step{display:flex;align-items:flex-start;gap:8px;font-size:11px;color:rgba(200,216,232,.65);}
.ycc-step-n{width:18px;height:18px;border-radius:50%;background:rgba(0,150,255,.25);color:#40b8ff;font-family:'Share Tech Mono',monospace;font-size:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.ycc-step code{background:rgba(255,255,255,.08);border-radius:3px;padding:1px 5px;font-family:'Share Tech Mono',monospace;font-size:10px;color:#c8d8e8;}

/* ── MODALS ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:300;display:flex;align-items:flex-end;backdrop-filter:blur(5px);}
.modal{width:100%;max-width:430px;margin:0 auto;background:#0f1620;border-radius:20px 20px 0 0;padding:22px 18px 38px;border-top:1px solid rgba(0,255,160,.18);}
.modal-handle{width:34px;height:4px;background:rgba(255,255,255,.12);border-radius:2px;margin:0 auto 18px;}
.modal-title{font-size:15px;font-weight:700;color:#e8f0f8;margin-bottom:16px;}
.field{margin-bottom:12px;}
.field label{display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(200,216,232,.45);margin-bottom:5px;font-family:'Share Tech Mono',monospace;}
.field input,.field select{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:9px 11px;color:#e8f0f8;font-size:13px;font-family:'Barlow',sans-serif;outline:none;transition:border-color .2s;appearance:none;}
.field input:focus,.field select:focus{border-color:rgba(0,255,160,.38);}
.field input::placeholder{color:rgba(200,216,232,.22);}
.field select option{background:#0f1620;}
.field-row{display:flex;gap:8px;}
.field-row .field{flex:1;}
.modal-footer{display:flex;gap:10px;margin-top:18px;}
.btn-cancel{flex:1;padding:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:rgba(200,216,232,.55);font-size:13px;cursor:pointer;font-family:'Barlow',sans-serif;}
.btn-add{flex:2;padding:11px;background:#00ffa0;border:none;border-radius:10px;color:#07090d;font-size:13px;font-weight:700;cursor:pointer;font-family:'Barlow',sans-serif;}
.btn-ycc{flex:2;padding:11px;background:#40b8ff;border:none;border-radius:10px;color:#07090d;font-size:13px;font-weight:700;cursor:pointer;font-family:'Barlow',sans-serif;}

/* ── FAB ── */
.fab{position:fixed;bottom:26px;right:50%;transform:translateX(185px);width:50px;height:50px;border-radius:50%;background:#00ffa0;border:none;color:#07090d;font-size:22px;cursor:pointer;box-shadow:0 4px 22px rgba(0,255,160,.4);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;z-index:50;}
.fab:active{transform:translateX(185px) scale(.92);box-shadow:0 2px 10px rgba(0,255,160,.25);}

/* ── SETTINGS ── */
.settings-sec{padding:14px 18px;}
.sec-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(200,216,232,.3);font-family:'Share Tech Mono',monospace;margin:14px 0 8px;}
.set-row{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:10px;margin-bottom:5px;cursor:pointer;transition:background .2s;}
.set-row:hover{background:rgba(255,255,255,.055);}
.set-label{font-size:13px;color:#c8d8e8;}
.set-sub{font-size:10px;color:rgba(200,216,232,.38);margin-top:1px;}
.toggle{width:38px;height:21px;border-radius:11px;position:relative;transition:background .25s;flex-shrink:0;}
.toggle.on{background:#00ffa0;} .toggle.off{background:rgba(255,255,255,.1);}
.tog-thumb{position:absolute;top:2.5px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .22s;}
.toggle.on .tog-thumb{left:20px;} .toggle.off .tog-thumb{left:2.5px;}

/* ── UPLOAD IMAGE (AI demo) ── */
.upload-area{border:1px dashed rgba(255,208,60,.3);border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:border-color .2s;background:rgba(255,208,60,.03);}
.upload-area:hover{border-color:rgba(255,208,60,.6);}
.upload-area p{font-size:12px;color:rgba(200,216,232,.5);margin-top:6px;}
.preview-img{width:100%;border-radius:8px;margin-top:10px;max-height:180px;object-fit:cover;}
.analyze-btn{width:100%;padding:11px;background:rgba(255,208,60,.12);border:1px solid rgba(255,208,60,.3);border-radius:10px;color:#ffd060;font-size:13px;font-weight:600;cursor:pointer;font-family:'Barlow',sans-serif;margin-top:10px;transition:background .2s;}
.analyze-btn:hover{background:rgba(255,208,60,.22);}
.analyze-btn:disabled{opacity:.4;cursor:not-allowed;}
.ai-output{margin-top:12px;background:rgba(0,0,0,.3);border-radius:8px;padding:12px;font-size:12px;color:rgba(200,216,232,.8);line-height:1.6;border-left:3px solid #ffd060;white-space:pre-wrap;}

/* No signal */
.no-signal{position:relative;z-index:2;text-align:center;}
.ns-icon{font-size:28px;opacity:.25;display:block;margin-bottom:5px;}
.ns-txt{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:rgba(200,216,232,.25);}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtTime(d) {
  if (!d) return "";
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff/60)}m`;
  return d.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});
}
function nowStr() {
  return new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
function Toggle({ on }) {
  return <div className={`toggle ${on?"on":"off"}`}><div className="tog-thumb"/></div>;
}

// ─── Simulated motion/person detector ────────────────────────────────────────
// In a real deployment this hooks into your backend frame analysis
function useMotionSimulator(cameras, setCameras, setGlobalAlerts) {
  useEffect(() => {
    const interval = setInterval(() => {
      setCameras(prev => prev.map(cam => {
        if (cam.status !== "online") return cam;
        // ~12% chance of motion per 3s tick for enabled cams
        if (cam.motionEnabled && Math.random() < 0.12) {
          const ts = new Date();
          const alert = { type: "motion", ts, msg: `Movimiento detectado` };
          setGlobalAlerts(a => [{ ...alert, camId: cam.id, camName: cam.name }, ...a].slice(0, 50));
          return { ...cam, lastMotion: ts, alerts: [alert, ...cam.alerts].slice(0, 5) };
        }
        // ~4% chance of person detection for enabled cams
        if (cam.personEnabled && Math.random() < 0.04) {
          const ts = new Date();
          const alert = { type: "person", ts, msg: `Persona detectada por IA` };
          setGlobalAlerts(a => [{ ...alert, camId: cam.id, camName: cam.name }, ...a].slice(0, 50));
          return { ...cam, lastPerson: ts, alerts: [alert, ...cam.alerts].slice(0, 5) };
        }
        return cam;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [setCameras, setGlobalAlerts]);
}

// ─── Feed Preview ─────────────────────────────────────────────────────────────
function FeedPreview({ cam, onAiClick }) {
  const [ts, setTs] = useState(nowStr());
  const [showMotion, setShowMotion] = useState(false);
  const prevMotion = useRef(null);
  const prevPerson = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTs(nowStr()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (cam.lastMotion && cam.lastMotion !== prevMotion.current) {
      prevMotion.current = cam.lastMotion;
      setShowMotion(true);
      setTimeout(() => setShowMotion(false), 600);
    }
  }, [cam.lastMotion]);

  if (cam.status === "offline") {
    return (
      <div className="no-signal">
        <span className="ns-icon">📷</span>
        <div className="ns-txt">SIN SEÑAL</div>
      </div>
    );
  }

  const isScanning = cam.personEnabled && cam.lastPerson &&
    (new Date() - cam.lastPerson) < 5000;

  // random person box position (stable per detection)
  const px = cam.lastPerson ? (30 + (cam.lastPerson.getSeconds() % 3) * 20) : 30;
  const py = cam.lastPerson ? (20 + (cam.lastPerson.getSeconds() % 2) * 25) : 25;
  const showPersonBox = cam.lastPerson && (new Date() - cam.lastPerson) < 6000;

  return (
    <>
      <div className="feed-bg"/>
      <div className="feed-grid"/>
      <div className="feed-sim"><div className="shift"/></div>
      <div className={`motion-flash ${showMotion ? "show" : ""}`}/>
      {isScanning && (
        <div className="ai-scanning"><div className="scan-line"/></div>
      )}
      {showPersonBox && (
        <div className="person-box" style={{
          left:`${px}%`, top:`${py}%`, width:"22%", height:"45%"
        }}>
          <div className="person-label">PERSONA</div>
        </div>
      )}
      <div className="feed-cam-label">CAM {String(cam.id).padStart(2,"0")}</div>
      <div className="feed-ts">{ts}</div>
      <div className="feed-source">{cam.source === "YCC365" ? "YCC365+" : "MANUAL"}</div>
      {cam.recording && (
        <div className="rec-badge"><div className="rec-dot"/>REC</div>
      )}
      {cam.lastMotion && (new Date()-cam.lastMotion) < 8000 && (
        <div className="motion-badge">⚡ MOV</div>
      )}
      {cam.lastPerson && (new Date()-cam.lastPerson) < 8000 && (
        <div className="person-badge">🧍 PERSONA</div>
      )}
    </>
  );
}

// ─── AI Analysis Modal ────────────────────────────────────────────────────────
function AiModal({ cam, onClose }) {
  const [imgData, setImgData] = useState(null);
  const [imgBase64, setImgBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const inputRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImgData(ev.target.result);
      setImgBase64(ev.target.result.split(",")[1]);
      setResult("");
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!imgBase64) return;
    setLoading(true);
    setResult("");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Eres un sistema de análisis de seguridad para cámaras de vigilancia doméstica. Analiza la imagen y responde en español con:
1. ¿Hay personas? (cuántas, descripción breve)
2. ¿Hay movimiento sospechoso?
3. Nivel de riesgo: BAJO / MEDIO / ALTO
4. Observaciones relevantes para seguridad
Sé conciso y directo. No uses markdown, solo texto plano.`,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imgBase64 } },
              { type: "text", text: `Analiza esta imagen de la cámara "${cam.name}" (${cam.location}).` }
            ]
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.map(b => b.text||"").join("\n") || "Sin respuesta";
      setResult(text);
    } catch (err) {
      setResult("Error al conectar con la IA. Verifica la conexión.");
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{paddingBottom:24}}>
        <div className="modal-handle"/>
        <div className="modal-title">🤖 Análisis IA — {cam.name}</div>
        <div className="field">
          <label>Captura de imagen de la cámara</label>
          <div className="upload-area" onClick={() => inputRef.current.click()}>
            <span style={{fontSize:28}}>📸</span>
            <p>Toca para subir una captura de {cam.name}</p>
            {imgData && <img src={imgData} className="preview-img" alt="preview"/>}
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
        </div>
        <button className="analyze-btn" onClick={analyze} disabled={!imgBase64||loading}>
          {loading ? "Analizando con IA..." : "🔍 Detectar personas y movimiento"}
        </button>
        {loading && <div className="ai-output" style={{color:"rgba(200,216,232,.4)",fontFamily:"'Share Tech Mono',monospace"}}>Procesando imagen...</div>}
        {result && <div className="ai-output">{result}</div>}
        <button className="btn-cancel" style={{width:"100%",marginTop:12}} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

// ─── Add Camera Modal ─────────────────────────────────────────────────────────
function AddCameraModal({ onClose, onAdd }) {
  const [mode, setMode] = useState("ycc");
  const [form, setForm] = useState({ name:"", location:"", ip:"", user:"admin", pass:"", port:"554", rtsp:"" });

  function set(k,v){ setForm(f=>({...f,[k]:v})); }

  function buildRtsp() {
    if (mode === "ycc") {
      return `rtsp://${form.user}:${form.pass}@${form.ip}:${form.port}/onvif1`;
    }
    return form.rtsp;
  }

  function submit() {
    const rtsp = buildRtsp();
    if (!form.name || !rtsp) return;
    onAdd({ name: form.name, location: form.location||"Sin ubicación", rtsp, source: mode==="ycc"?"YCC365":"manual" });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <div className="modal-title">Conectar cámara</div>

        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {["ycc","rtsp"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              flex:1,padding:"8px",border:"1px solid",borderRadius:8,cursor:"pointer",
              fontFamily:"'Barlow',sans-serif",fontSize:12,fontWeight:600,
              borderColor: mode===m ? "#40b8ff" : "rgba(255,255,255,.1)",
              background: mode===m ? "rgba(64,184,255,.12)" : "rgba(255,255,255,.04)",
              color: mode===m ? "#40b8ff" : "rgba(200,216,232,.5)"
            }}>
              {m==="ycc" ? "📱 YCC365plus" : "🔗 URL RTSP"}
            </button>
          ))}
        </div>

        {mode==="ycc" && (
          <div style={{background:"rgba(64,184,255,.06)",border:"1px solid rgba(64,184,255,.15)",borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:11,color:"rgba(200,216,232,.55)",lineHeight:1.6}}>
            💡 Para conectar una cámara YCC365plus, activa el <strong style={{color:"rgba(64,184,255,.8)"}}>protocolo RTSP</strong> en la app: Cámara → Ajustes → Configuración RTSP. Obtén la IP de tu cámara en la misma sección.
          </div>
        )}

        <div className="field"><label>Nombre</label>
          <input placeholder="ej. Puerta trasera" value={form.name} onChange={e=>set("name",e.target.value)}/>
        </div>
        <div className="field"><label>Ubicación</label>
          <input placeholder="ej. Patio norte" value={form.location} onChange={e=>set("location",e.target.value)}/>
        </div>

        {mode==="ycc" ? (
          <>
            <div className="field"><label>IP de la cámara</label>
              <input placeholder="192.168.1.xxx" value={form.ip} onChange={e=>set("ip",e.target.value)}/>
            </div>
            <div className="field-row">
              <div className="field"><label>Usuario</label>
                <input placeholder="admin" value={form.user} onChange={e=>set("user",e.target.value)}/>
              </div>
              <div className="field"><label>Contraseña</label>
                <input type="password" placeholder="••••" value={form.pass} onChange={e=>set("pass",e.target.value)}/>
              </div>
            </div>
            <div className="field"><label>Puerto RTSP</label>
              <input placeholder="554" value={form.port} onChange={e=>set("port",e.target.value)}/>
            </div>
            {form.ip && <div style={{background:"rgba(0,0,0,.3)",borderRadius:6,padding:"6px 10px",fontSize:10,fontFamily:"'Share Tech Mono',monospace",color:"rgba(200,216,232,.4)",marginBottom:8,wordBreak:"break-all"}}>
              → {buildRtsp()}
            </div>}
          </>
        ) : (
          <div className="field"><label>URL RTSP completa</label>
            <input placeholder="rtsp://usuario:pass@IP:554/stream" value={form.rtsp} onChange={e=>set("rtsp",e.target.value)}/>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className={mode==="ycc"?"btn-ycc":"btn-add"} onClick={submit}>
            {mode==="ycc" ? "Conectar YCC365" : "Agregar cámara"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [cameras, setCameras]       = useState(initialCameras);
  const [tab, setTab]               = useState("cameras");
  const [globalAlerts, setGlobalAlerts] = useState([]);
  const [showAdd, setShowAdd]       = useState(false);
  const [aiCam, setAiCam]           = useState(null);
  const [notifs, setNotifs]         = useState(true);
  const [autoRec, setAutoRec]       = useState(true);
  const [nightVis, setNightVis]     = useState(false);
  const [aiEnabled, setAiEnabled]   = useState(true);

  useMotionSimulator(cameras, setCameras, setGlobalAlerts);

  const online    = cameras.filter(c=>c.status==="online").length;
  const recording = cameras.filter(c=>c.recording).length;
  const unread    = globalAlerts.filter(a=>(new Date()-a.ts)<30000).length;

  function toggleRecording(id){ setCameras(cs=>cs.map(c=>c.id===id?{...c,recording:!c.recording}:c)); }
  function toggleMotion(id){    setCameras(cs=>cs.map(c=>c.id===id?{...c,motionEnabled:!c.motionEnabled}:c)); }
  function togglePerson(id){    setCameras(cs=>cs.map(c=>c.id===id?{...c,personEnabled:!c.personEnabled}:c)); }
  function removeCamera(id){    setCameras(cs=>cs.filter(c=>c.id!==id)); }

  function addCamera(data) {
    setCameras(cs=>[...cs,{
      id: Date.now(), ...data, status:"online", recording:false,
      motionEnabled:true, personEnabled:true, lastMotion:null, lastPerson:null, alerts:[]
    }]);
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="scanlines"/>

        {/* Header */}
        <div className="hdr">
          <div className="hdr-top">
            <div className="logo">VIGI<em>CASA</em></div>
            <div className="sys-status"><div className="dot-pulse"/>SISTEMA ACTIVO</div>
          </div>
          <div className="hdr-sub">MONITOREO IA · YCC365+ · RTSP</div>
        </div>

        {/* Nav */}
        <div className="nav">
          {[
            { id:"cameras", label:"Cámaras" },
            { id:"alerts",  label:"Alertas",   badge: unread>0 },
            { id:"ai",      label:"IA / Análisis" },
            { id:"settings",label:"Ajustes" },
          ].map(t=>(
            <button key={t.id} className={`ntab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
              {t.label}
              {t.badge && <span className="badge"/>}
            </button>
          ))}
        </div>

        {/* ── CAMERAS TAB ── */}
        {tab==="cameras" && (
          <>
            <div className="summary">
              <div className="sum-card"><div className="sum-n">{cameras.length}</div><div className="sum-l">Total</div></div>
              <div className="sum-card"><div className="sum-n g">{online}</div><div className="sum-l">Online</div></div>
              <div className="sum-card"><div className="sum-n r">{cameras.length-online}</div><div className="sum-l">Offline</div></div>
              <div className="sum-card"><div className="sum-n b">{recording}</div><div className="sum-l">Grabando</div></div>
              <div className="sum-card"><div className="sum-n y">{globalAlerts.filter(a=>(new Date()-a.ts)<60000).length}</div><div className="sum-l">Alertas</div></div>
            </div>

            <div className="cam-list">
              {cameras.map(cam=>{
                const hasMotion = cam.lastMotion && (new Date()-cam.lastMotion)<8000;
                const hasPerson = cam.lastPerson && (new Date()-cam.lastPerson)<8000;
                return (
                  <div key={cam.id} className={`cam-card ${hasMotion?"alert-active":""} ${hasPerson&&!hasMotion?"person-active":""} ${cam.status==="offline"?"offline-card":""}`}>
                    <div className="feed-wrap">
                      <FeedPreview cam={cam} onAiClick={()=>setAiCam(cam)}/>
                    </div>
                    <div className="cam-info">
                      <div>
                        <div className="cam-name">{cam.name}</div>
                        <div className="cam-loc">{cam.location} · {cam.rtsp.replace(/rtsp:\/\/[^@]+@/,"").split(":")[0]}</div>
                      </div>
                      <span className={`cam-status ${cam.status}`}>{cam.status==="online"?"ONLINE":"OFFLINE"}</span>
                    </div>
                    <div className="cam-actions">
                      <button className="act-btn" onClick={()=>toggleRecording(cam.id)}>
                        <span className="ai">{cam.recording?"⏹":"⏺"}</span>
                        {cam.recording?"Stop":"Grabar"}
                      </button>
                      <button className="act-btn" onClick={()=>toggleMotion(cam.id)}>
                        <span className="ai">{cam.motionEnabled?"🔴":"⚫"}</span>
                        Movim.
                      </button>
                      <button className="act-btn" onClick={()=>togglePerson(cam.id)}>
                        <span className="ai">{cam.personEnabled?"🧍":"👤"}</span>
                        Persona
                      </button>
                      <button className="act-btn" onClick={()=>setAiCam(cam)}>
                        <span className="ai">🤖</span>
                        IA
                      </button>
                      <button className="act-btn danger" onClick={()=>removeCamera(cam.id)}>
                        <span className="ai">✕</span>
                        Quitar
                      </button>
                    </div>
                    {cam.alerts.length>0 && (
                      <div className="alert-strip">
                        {cam.alerts.map((a,i)=>(
                          <div key={i} className="alert-item">
                            <span className="alert-icon">{a.type==="motion"?"⚡":"🧍"}</span>
                            <span className="alert-txt">{a.msg}</span>
                            <span className="alert-time">{fmtTime(a.ts)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="fab" onClick={()=>setShowAdd(true)}>+</button>
          </>
        )}

        {/* ── ALERTS TAB ── */}
        {tab==="alerts" && (
          <div className="alerts-list">
            {globalAlerts.length===0 && <div className="no-alerts">Sin alertas recientes ✓</div>}
            {globalAlerts.map((a,i)=>(
              <div key={i} className={`alert-card ${a.type}`}>
                <div className="alert-card-top">
                  <div className="alert-card-type">
                    {a.type==="motion"?"⚡ Movimiento":a.type==="person"?"🧍 Persona":"🔴 Offline"}
                  </div>
                  <div className="alert-card-ts">{fmtTime(a.ts)}</div>
                </div>
                <div className="alert-card-body">{a.msg}</div>
                <div className="alert-card-cam">📷 {a.camName}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── AI TAB ── */}
        {tab==="ai" && (
          <div style={{padding:"14px 16px 80px"}}>
            <div style={{background:"rgba(255,208,60,.06)",border:"1px solid rgba(255,208,60,.18)",borderRadius:12,padding:14,marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:"#ffd060",marginBottom:4}}>🤖 Reconocimiento IA con Claude</div>
              <div style={{fontSize:11,color:"rgba(200,216,232,.55)",lineHeight:1.6}}>
                Sube una captura de cualquier cámara para analizar personas, objetos sospechosos y nivel de riesgo en tiempo real usando visión artificial.
              </div>
            </div>
            <div className="sec-label">Selecciona una cámara para analizar</div>
            {cameras.filter(c=>c.status==="online").map(cam=>(
              <div key={cam.id} className="set-row" onClick={()=>setAiCam(cam)}>
                <div>
                  <div className="set-label">{cam.name}</div>
                  <div className="set-sub">{cam.location} · {cam.source}</div>
                </div>
                <span style={{color:"#ffd060",fontSize:14}}>🤖</span>
              </div>
            ))}
            <div className="sec-label" style={{marginTop:20}}>Estado del sistema IA</div>
            <div className="set-row" onClick={()=>setAiEnabled(v=>!v)}>
              <div>
                <div className="set-label">Detección automática</div>
                <div className="set-sub">Movimiento + reconocimiento de personas</div>
              </div>
              <Toggle on={aiEnabled}/>
            </div>
            <div style={{marginTop:12,padding:"10px 12px",background:"rgba(0,0,0,.25)",borderRadius:8,fontSize:11,fontFamily:"'Share Tech Mono',monospace",color:"rgba(200,216,232,.4)"}}>
              CÁMARAS CON DETECCIÓN: {cameras.filter(c=>c.personEnabled||c.motionEnabled).length}/{cameras.length}{"\n"}
              PERSONAS DETECTADAS HOY: {globalAlerts.filter(a=>a.type==="person").length}{"\n"}
              EVENTOS MOVIMIENTO HOY: {globalAlerts.filter(a=>a.type==="motion").length}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab==="settings" && (
          <div className="settings-sec">
            <div className="sec-label">YCC365plus</div>
            <div className="set-row" onClick={()=>setShowAdd(true)}>
              <div>
                <div className="set-label">Importar cámara YCC365+</div>
                <div className="set-sub">Conectar via RTSP desde la app</div>
              </div>
              <span style={{color:"#40b8ff",fontSize:14}}>+</span>
            </div>
            <div className="sec-label">Grabación</div>
            <div className="set-row" onClick={()=>setAutoRec(v=>!v)}>
              <div><div className="set-label">Grabar al detectar movimiento</div><div className="set-sub">Activa rec automáticamente</div></div>
              <Toggle on={autoRec}/>
            </div>
            <div className="sec-label">Notificaciones</div>
            <div className="set-row" onClick={()=>setNotifs(v=>!v)}>
              <div><div className="set-label">Alertas en tiempo real</div><div className="set-sub">Movimiento, personas, offline</div></div>
              <Toggle on={notifs}/>
            </div>
            <div className="sec-label">Imagen</div>
            <div className="set-row" onClick={()=>setNightVis(v=>!v)}>
              <div><div className="set-label">Visión nocturna auto</div><div className="set-sub">Modo infrarrojo</div></div>
              <Toggle on={nightVis}/>
            </div>
            <div className="sec-label">Red</div>
            <div className="set-row">
              <div><div className="set-label">Protocolo</div><div className="set-sub">RTSP / H.264 / ONVIF</div></div>
              <span style={{color:"rgba(200,216,232,.35)",fontSize:16}}>›</span>
            </div>
            <div className="set-row">
              <div><div className="set-label">Puerto RTSP</div><div className="set-sub">554 (estándar YCC365)</div></div>
              <span style={{color:"rgba(200,216,232,.35)",fontSize:16}}>›</span>
            </div>
          </div>
        )}

        {/* Modals */}
        {showAdd && <AddCameraModal onClose={()=>setShowAdd(false)} onAdd={addCamera}/>}
        {aiCam   && <AiModal cam={aiCam} onClose={()=>setAiCam(null)}/>}
      </div>
    </>
  );
}
