import { useState, useEffect, useRef } from "react";

const DEFAULT_ACTIVITIES = [
  { id:"gym",      label:"Gym Session",          xp:50,  icon:"🏋️", color:"#FF4D00", unit:"per session", inputType:"tap" },
  { id:"run",      label:"Running",              xp:10,  icon:"🏃", color:"#FF6B35", unit:"XP per km",   inputType:"km" },
  { id:"reading",  label:"Read 30min",           xp:25,  icon:"📖", color:"#88DDAA", unit:"per session", inputType:"tap" },
  { id:"water",    label:"Drink 2L Water",       xp:20,  icon:"💧", color:"#00C2FF", unit:"per day",     inputType:"tap" },
  { id:"meditate", label:"Meditate",             xp:20,  icon:"🧘", color:"#B388FF", unit:"per session", inputType:"tap" },
  { id:"nophone",  label:"No Phone Before 9am",  xp:30,  icon:"📵", color:"#B388FF", unit:"per day",     inputType:"tap" },
  { id:"sleep",    label:"Sleep Before Midnight",xp:20,  icon:"😴", color:"#7799FF", unit:"per day",     inputType:"tap" },
  { id:"healthy",  label:"Healthy Meal",         xp:15,  icon:"🥗", color:"#88DDAA", unit:"per meal",    inputType:"tap" },
  // Default negative activity
  { id:"socmed",   label:"Social Media Scroll",  xp:1,   icon:"📱", color:"#FF4466", unit:"-1 XP per 5 min", inputType:"minutes", isNegative:true },
];

const DEFAULT_MILESTONES = [
  { id:"t1", xpRequired:5000,  title:"IRON",    icon:"🔩", reward:"Choose your own reward 🎁",  color:"#9E9E9E" },
  { id:"t2", xpRequired:10000, title:"BRONZE",  icon:"🥉", reward:"Choose your own reward 🎁",  color:"#CD7F32" },
  { id:"t3", xpRequired:20000, title:"SILVER",  icon:"🥈", reward:"Choose your own reward 🎁",  color:"#C0C0C0" },
  { id:"t4", xpRequired:40000, title:"GOLD",    icon:"🥇", reward:"Choose your own reward 🎁",  color:"#FFD700" },
  { id:"t5", xpRequired:80000, title:"DIAMOND", icon:"💎", reward:"Choose your own reward 🎁",  color:"#00DFFF" },
];

const TIER_RANGES = [
  { tier:1, start:0,     end:5000,  milestone:"t1" },
  { tier:2, start:5000,  end:10000, milestone:"t2" },
  { tier:3, start:10000, end:20000, milestone:"t3" },
  { tier:4, start:20000, end:40000, milestone:"t4" },
  { tier:5, start:40000, end:80000, milestone:"t5" },
];
const TIER_COLORS = { 1:"#9E9E9E", 2:"#CD7F32", 3:"#C0C0C0", 4:"#FFD700", 5:"#00DFFF" };

const DEFAULT_TIER_REWARDS = [
  ["Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁"],
  ["Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁"],
  ["Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁"],
  ["Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁"],
  ["Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁","Choose your reward 🎁"],
];

function buildDefaultLevels() {
  const levels = [];
  TIER_RANGES.forEach((tr, ti) => {
    const span = tr.end - tr.start;
    for (let i = 0; i < 5; i++) {
      levels.push({ level: ti*5+i+1, tierLevel: i+1, tier: tr.tier, xpRequired: tr.start + Math.round((span/5)*i), title:`Level ${i+1}`, reward: DEFAULT_TIER_REWARDS[ti][i], milestoneId: tr.milestone });
    }
  });
  return levels;
}

function getCurrentLevel(xp, levels) {
  let current = levels[0];
  for (let i = 0; i < levels.length; i++) { if (xp >= levels[i].xpRequired) current = levels[i]; }
  return { current, next: levels.find(l => l.xpRequired > xp) || null };
}
function getCurrentTier(xp) {
  for (let i = TIER_RANGES.length-1; i >= 0; i--) { if (xp >= TIER_RANGES[i].start) return TIER_RANGES[i]; }
  return TIER_RANGES[0];
}
function getNextMilestone(xp, milestones) { return milestones.find(m => xp < m.xpRequired) || null; }

function toSvDate(d) { return d.toLocaleDateString("sv-SE"); }
function getWeekStart() { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }
function getLastWeekStart() { const d = getWeekStart(); d.setDate(d.getDate()-7); return d; }

const EMOJI_OPTIONS = ["🍳","💧","🥗","🧘","📝","🎯","🚴","🏊","🧠","💊","🛌","🚶","🎸","🎨","🧹","📞","💼","🤝","📚","🌅","🥤","🏆","⭐","🔥","📱","🎮","🍺","🍕","😴","🚬","📺"];
const INPUT_TYPES = [["tap","Tap"],["quantity","×Qty"],["km","km"],["amount","kr"],["minutes","min"]];

// ── ADD ACTIVITY BUTTON ──────────────────────────────────────────────────────
function AddActivityButton({ setActivities }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [xp, setXp] = useState(20);
  const [icon, setIcon] = useState("⭐");
  const [inputType, setInputType] = useState("tap");
  const [isNegative, setIsNegative] = useState(false);

  function handleAdd() {
    if (!label.trim()) return;
    const unitMap = { km:"XP per km", amount:"XP per 1000kr", minutes:`XP per 5 min`, tap:"per log", quantity:"per log" };
    setActivities(prev => [...prev, {
      id: `custom_${Date.now()}`, label: label.trim(), xp: parseFloat(xp)||20, icon,
      color: isNegative ? "#FF4466" : "#00FF94",
      unit: isNegative ? `-${parseFloat(xp)||20} XP ${inputType==="minutes"?"per 5 min":"per use"}` : unitMap[inputType]||"per log",
      inputType, custom:true, multi: inputType==="quantity", isNegative,
    }]);
    setLabel(""); setXp(20); setIcon("⭐"); setInputType("tap"); setIsNegative(false); setOpen(false);
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ background:"#0f0f0f",border:"1px dashed #2a2a2a",borderRadius:"10px",padding:"14px",width:"100%",color:"#555",fontFamily:"'DM Mono',monospace",fontSize:"12px",cursor:"pointer",letterSpacing:"1px" }}>
      + ADD CUSTOM ACTIVITY
    </button>
  );
  return (
    <div style={{ background:"#141414",border:"1px solid #2a2a2a",borderRadius:"12px",padding:"16px" }}>
      <div style={{ fontSize:"10px",color:"#aaa",letterSpacing:"2px",marginBottom:"12px" }}>NEW ACTIVITY</div>

      {/* Positive/Negative toggle */}
      <div style={{ display:"flex",gap:"6px",marginBottom:"12px" }}>
        <button onClick={() => setIsNegative(false)} style={{ flex:1,background:!isNegative?"#0d1a0d":"#0d0d0d",border:`1px solid ${!isNegative?"#00FF9444":"#222"}`,borderRadius:"8px",padding:"7px",color:!isNegative?"#00FF94":"#555",fontFamily:"'DM Mono',monospace",fontSize:"10px",cursor:"pointer",letterSpacing:"1px" }}>
          ＋ GAINS XP
        </button>
        <button onClick={() => setIsNegative(true)} style={{ flex:1,background:isNegative?"#1a0d0d":"#0d0d0d",border:`1px solid ${isNegative?"#FF446644":"#222"}`,borderRadius:"8px",padding:"7px",color:isNegative?"#FF4466":"#555",fontFamily:"'DM Mono',monospace",fontSize:"10px",cursor:"pointer",letterSpacing:"1px" }}>
          － LOSES XP
        </button>
      </div>

      <div style={{ display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px" }}>
        {EMOJI_OPTIONS.map(e => <button key={e} onClick={() => setIcon(e)} style={{ background:icon===e?"#2a2a2a":"none",border:`1px solid ${icon===e?"#555":"#1e1e1e"}`,borderRadius:"6px",padding:"4px 6px",cursor:"pointer",fontSize:"18px" }}>{e}</button>)}
      </div>
      <div style={{ display:"flex",gap:"8px",marginBottom:"10px" }}>
        <div style={{ flex:"0 0 70px" }}>
          <div style={{ fontSize:"10px",color:"#888",marginBottom:"4px" }}>XP</div>
          <input className="edit-input" type="number" value={xp} onChange={e => setXp(e.target.value)} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"10px",color:"#888",marginBottom:"4px" }}>NAME</div>
          <input className="edit-input" type="text" value={label} placeholder="e.g. Instagram time" onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key==="Enter" && handleAdd()} />
        </div>
      </div>
      <div style={{ marginBottom:"12px" }}>
        <div style={{ fontSize:"10px",color:"#888",marginBottom:"6px" }}>INPUT TYPE</div>
        <div style={{ display:"flex",gap:"6px",flexWrap:"wrap" }}>
          {INPUT_TYPES.map(([val,lbl]) => (
            <button key={val} onClick={() => setInputType(val)} style={{ flex:1,minWidth:"50px",background:inputType===val?(isNegative?"#1a0d0d":"#0d1a0d"):"#0d0d0d",border:`1px solid ${inputType===val?(isNegative?"#FF446644":"#00FF9444"):"#222"}`,borderRadius:"8px",padding:"7px 4px",color:inputType===val?(isNegative?"#FF4466":"#00FF94"):"#666",fontFamily:"'DM Mono',monospace",fontSize:"10px",cursor:"pointer",letterSpacing:"1px" }}>{lbl}</button>
          ))}
        </div>
        <div style={{ fontSize:"10px",color:"#555",marginTop:"5px" }}>
          {isNegative
            ? inputType==="minutes" ? `Every 5 min = −${xp} XP` : `Each use = −${xp} XP`
            : inputType==="tap"?"One tap = one log":inputType==="quantity"?"Enter a number, get XP × qty":inputType==="km"?`Enter km — ${xp} XP per km`:inputType==="minutes"?`Enter minutes — ${xp} XP per 5 min`:`Enter kr — ${xp} XP per 1000kr`}
        </div>
      </div>
      <div style={{ display:"flex",gap:"8px" }}>
        <button onClick={() => setOpen(false)} style={{ flex:1,background:"none",border:"1px solid #222",borderRadius:"8px",padding:"8px",color:"#555",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer" }}>CANCEL</button>
        <button onClick={handleAdd} style={{ flex:2,background:isNegative?"#1a0d0d":"#0d1a0d",border:`1px solid ${isNegative?"#FF446644":"#00FF9444"}`,borderRadius:"8px",padding:"8px",color:isNegative?"#FF4466":"#00FF94",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer",letterSpacing:"1px" }}>ADD {icon} {label||"ACTIVITY"}</button>
      </div>
    </div>
  );
}

// ── CONFETTI ─────────────────────────────────────────────────────────────────
function Confetti({ pieces }) {
  return (
    <div style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:300,overflow:"hidden" }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:"-10px", width:`${p.size}px`, height:`${p.size}px`,
          background:p.color, borderRadius:p.id%3===0?"50%":"2px",
          animation:`confettiFall ${1.5+p.delay}s ${p.delay}s ease-in forwards`,
          transform:`rotate(${p.id*15}deg)`
        }} />
      ))}
    </div>
  );
}

// ── XP CHART with Y-axis labels ───────────────────────────────────────────────
function XPChart({ log, bestDay }) {
  const [view, setView] = useState("week");
  const [tooltip, setTooltip] = useState(null);
  const today = new Date();
  const todayStr = toSvDate(today);
  const count = view === "week" ? 7 : 30;
  const days = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = toSvDate(d);
    const xpForDay = log.filter(l => l.date === dateStr).reduce((s,l) => s+l.xp, 0);
    days.push({ dateStr, xpForDay, d });
  }
  const maxXP = Math.max(...days.map(d => d.xpForDay), 1);
  const cardBg = "#121212"; const cardBorder = "#1e1e1e";
  const dayLabel = (d) => ["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()];

  // Y-axis padding for labels
  const Y_LABEL_W = 36;
  const W = 320, H = 80, PAD_L = Y_LABEL_W, PAD_R = 4, PAD_T = 10, PAD_B = 0;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const gridRatios = [0.25, 0.5, 0.75, 1];

  // Format tick: abbreviate thousands
  const fmtTick = v => v >= 1000 ? `${(v/1000).toFixed(v%1000===0?0:1)}k` : `${Math.round(v)}`;

  // For chart positioning: treat negative daily XP as 0 (dot stays on the baseline)
  const pts = days.map((day, i) => ({
    x: PAD_L + (i / Math.max(days.length - 1, 1)) * plotW,
    y: PAD_T + plotH - (Math.max(day.xpForDay, 0) / maxXP) * plotH,
    ...day,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x.toFixed(1)} ${(PAD_T+plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD_T+plotH).toFixed(1)} Z`;

  return (
    <div style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"12px",padding:"14px 14px 10px",marginBottom:"4px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px" }}>
        <div style={{ fontSize:"10px",color:"#555",letterSpacing:"2px" }}>XP PER DAY</div>
        <div style={{ display:"flex",gap:"4px" }}>
          {[["week","7D"],["month","30D"]].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ background:view===v?"#1a2a1a":"none",border:`1px solid ${view===v?"#00FF9444":"#222"}`,borderRadius:"6px",padding:"3px 10px",color:view===v?"#00FF94":"#555",fontFamily:"'DM Mono',monospace",fontSize:"10px",cursor:"pointer",letterSpacing:"1px" }}>{l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position:"relative" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H + 18}`} style={{ overflow:"visible", display:"block" }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00FF94" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#00FF94" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines + labels */}
          {gridRatios.map((r) => {
            const yPos = PAD_T + plotH * (1 - r);
            const tickVal = maxXP * r;
            return (
              <g key={r}>
                <line x1={PAD_L} y1={yPos} x2={W - PAD_R} y2={yPos} stroke="#1a1a1a" strokeWidth="1" />
                <text x={PAD_L - 5} y={yPos + 3.5} textAnchor="end" fontSize="7.5" fill="#3a3a3a" fontFamily="DM Mono, monospace">
                  {fmtTick(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {pts.length > 1 && <path d={areaD} fill="url(#lineGrad)" />}

          {/* Line */}
          {pts.length > 1 && <path d={pathD} fill="none" stroke="#00FF9444" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />}

          {/* Dots + labels */}
          {pts.map((p, i) => {
            const isToday = p.dateStr === todayStr;
            const isBest = p.dateStr === bestDay.date && p.xpForDay > 0;
            const hasData = p.xpForDay > 0;
            const dotColor = isBest ? "#FFD700" : isToday ? "#00FF94" : hasData ? "#00FF9499" : "#2a2a2a";
            const dotR = isBest || isToday ? 4 : 3;
            const showLabel = view === "week" || i === 0 || i === days.length-1 || i % 5 === 0;

            return (
              <g key={p.dateStr}>
                {isBest && <circle cx={p.x} cy={p.y} r="8" fill="#FFD70011" />}
                <circle cx={p.x} cy={p.y} r={dotR} fill={dotColor} stroke={isBest?"#FFD700":isToday?"#00FF94":"#080808"} strokeWidth="1.5"
                  style={{ cursor:"pointer" }}
                  onMouseEnter={() => setTooltip({ i, x: p.x, y: p.y, dateStr: p.dateStr, xp: p.xpForDay })}
                  onMouseLeave={() => setTooltip(null)} />
                {showLabel && (
                  <text x={p.x} y={H + 14} textAnchor="middle" fontSize="8" fill={isToday?"#00FF94":"#444"} fontFamily="DM Mono, monospace">
                    {view === "week" ? dayLabel(p.d) : (p.d.getDate() === 1 || i === 0 || i === days.length-1 || i % 5 === 0 ? p.d.getDate() : "")}
                  </text>
                )}
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && (() => {
            const tx = Math.min(Math.max(tooltip.x, PAD_L + 30), W - 30);
            const ty = tooltip.y - 28;
            return (
              <g>
                <rect x={tx - 28} y={ty - 10} width="56" height="18" rx="4" fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1" />
                <text x={tx} y={ty + 4} textAnchor="middle" fontSize="9" fill="#00FF94" fontFamily="DM Mono, monospace">{tooltip.xp} XP</text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

// ── EDIT LOG ENTRY MODAL ─────────────────────────────────────────────────────
function EditLogModal({ entry, onSave, onClose }) {
  const [label, setLabel] = useState(entry.label);
  const [xp, setXp] = useState(Math.abs(entry.xp));
  const [isNeg] = useState(entry.xp < 0);

  function handleSave() {
    const newXp = isNeg ? -Math.abs(parseFloat(xp)||0) : Math.abs(parseFloat(xp)||0);
    onSave({ ...entry, label: label.trim()||entry.label, xp: newXp });
  }

  return (
    <div style={{ position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.85)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ background:"#141414",border:"1px solid #2a2a2a",borderRadius:"16px",padding:"24px",width:"320px",maxWidth:"90vw" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:"10px",color:"#aaa",letterSpacing:"2px",marginBottom:"16px" }}>EDIT LOG ENTRY</div>
        <div style={{ display:"flex",gap:"8px",alignItems:"center",marginBottom:"16px" }}>
          <span style={{ fontSize:"24px" }}>{entry.icon}</span>
          <div style={{ fontSize:"11px",color:"#555" }}>{entry.date} {entry.time}</div>
        </div>
        <div style={{ marginBottom:"12px" }}>
          <div style={{ fontSize:"10px",color:"#888",marginBottom:"6px" }}>LABEL</div>
          <input className="edit-input" type="text" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSave()} />
        </div>
        <div style={{ marginBottom:"20px" }}>
          <div style={{ fontSize:"10px",color:"#888",marginBottom:"6px" }}>{isNeg ? "XP LOST" : "XP GAINED"}</div>
          <input className="edit-input" type="number" value={xp} onChange={e => setXp(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSave()} />
        </div>
        <div style={{ display:"flex",gap:"8px" }}>
          <button onClick={onClose} style={{ flex:1,background:"none",border:"1px solid #222",borderRadius:"8px",padding:"10px",color:"#555",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer" }}>CANCEL</button>
          <button onClick={handleSave} style={{ flex:2,background:"#0d1a0d",border:"1px solid #00FF9444",borderRadius:"8px",padding:"10px",color:"#00FF94",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer",letterSpacing:"1px" }}>SAVE CHANGES</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [xp, setXp] = useState(0);
  const [displayXP, setDisplayXP] = useState(0);
  const [log, setLog] = useState([]);
  const [flash, setFlash] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [milestoneHit, setMilestoneHit] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [tab, setTab] = useState("main");
  const [saleInput, setSaleInput] = useState("");
  const [kmInput, setKmInput] = useState("");
  const [multiQty, setMultiQty] = useState({});
  const [todayCounts, setTodayCounts] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES);
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [levels, setLevels] = useState(buildDefaultLevels);
  const [streak, setStreak] = useState(0);
  const [lastLogDate, setLastLogDate] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(300);
  const [editingGoal, setEditingGoal] = useState(false);
  const [_bestDay, _setBestDay] = useState({ date:null, xp:0 }); // kept for legacy storage compat
  const [editingLogEntry, setEditingLogEntry] = useState(null); // { index, entry }
  const animRef = useRef(null);

  const todayKey = new Date().toDateString();
  const todayDate = toSvDate(new Date());

  // Midnight reset
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1) - now;
      return setTimeout(() => { setTodayCounts({}); checkMidnight(); }, msUntilMidnight);
    };
    const t = checkMidnight();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("laurin_xp_v8");
      if (saved) {
        const d = JSON.parse(saved);
        const v = d.xp||0;
        setXp(v); setDisplayXP(v);
        setLog(d.log||[]);
        setTodayCounts(d.todayCounts||{});
        if (d.activities) setActivities(d.activities);
        if (d.milestones) setMilestones(d.milestones);
        if (d.levels) setLevels(d.levels);
        if (d.streak) setStreak(d.streak);
        if (d.lastLogDate) setLastLogDate(d.lastLogDate);
        if (d.dailyGoal) setDailyGoal(d.dailyGoal);
        if (d.bestDay) setBestDay(d.bestDay);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("laurin_xp_v8", JSON.stringify({ xp, log, todayCounts, activities, milestones, levels, streak, lastLogDate, dailyGoal })); } catch {}
  }, [xp, log, todayCounts, activities, milestones, levels, streak, lastLogDate, dailyGoal]);

  const { current, next } = getCurrentLevel(xp, levels);
  const tierRange = getCurrentTier(xp);
  const tierProgress = Math.min(((xp - tierRange.start) / (tierRange.end - tierRange.start)) * 100, 100);
  const nextMilestone = getNextMilestone(xp, milestones);
  const currentMilestone = milestones.find(m => m.id === tierRange.milestone);
  const tierColor = TIER_COLORS[tierRange.tier] || "#00FF94";

  const todayXP = log.filter(l => l.date === todayDate).reduce((s,l) => s+l.xp, 0);

  // Compute bestDay reactively from log so deletes are reflected immediately
  const bestDay = (() => {
    const byDate = {};
    log.forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + l.xp; });
    let best = { date: null, xp: 0 };
    Object.entries(byDate).forEach(([date, xp]) => { if (xp > best.xp) best = { date, xp }; });
    return best;
  })();
  const todayCalls = (todayCounts[todayKey]||{}).call || 0;
  const dailyProgress = Math.min((todayXP / dailyGoal) * 100, 100);

  const weekStart = getWeekStart();
  const lastWeekStart = getLastWeekStart();
  const thisWeekXP = log.filter(l => new Date(l.date) >= weekStart).reduce((s,l) => s+l.xp, 0);
  const lastWeekXP = log.filter(l => { const d = new Date(l.date); return d >= lastWeekStart && d < weekStart; }).reduce((s,l) => s+l.xp, 0);

  const saleActivity = activities.find(a => a.id==="sale");
  const runActivity = activities.find(a => a.id==="run");

  function animateXPCount(from, to) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const duration = 500; const startTime = Date.now();
    const step = () => {
      const p = Math.min((Date.now()-startTime)/duration, 1);
      const eased = 1 - Math.pow(1-p, 3);
      setDisplayXP(Math.round(from + (to-from)*eased));
      if (p < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }

  function doAddXP(activity, gained, label) {
    const newXp = xp + gained;
    const prevLevelNum = getCurrentLevel(xp, levels).current.level;
    const prevMilestoneId = getNextMilestone(xp, milestones)?.id;

    setXp(newXp);
    animateXPCount(xp, newXp);
    setFlash(activity.id);
    setTimeout(() => setFlash(null), 600);

    // Streak (only for positive gains)
    if (gained > 0) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
      const yStr = toSvDate(yesterday);
      setStreak(prev => lastLogDate===todayDate ? prev : lastLogDate===yStr ? prev+1 : 1);
      setLastLogDate(todayDate);
    }

    // Best day is now computed reactively from log

    setTodayCounts(prev => ({ ...prev, [todayKey]: { ...(prev[todayKey]||{}), [activity.id]: ((prev[todayKey]||{})[activity.id]||0)+1 } }));
    setLog(prev => [{ label:label||activity.label, xp:gained, icon:activity.icon, time:new Date().toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"}), date:todayDate, activityId:activity.id, isNegative: gained < 0 }, ...prev.slice(0,99)]);

    if (gained > 0) {
      const newLevelNum = getCurrentLevel(newXp, levels).current.level;
      if (newLevelNum > prevLevelNum) { setLevelUp(getCurrentLevel(newXp, levels).current); setTimeout(() => setLevelUp(null), 4000); }

      const newMilestoneId = getNextMilestone(newXp, milestones)?.id;
      if (prevMilestoneId && prevMilestoneId !== newMilestoneId) {
        const hit = milestones.find(m => m.id===prevMilestoneId);
        if (hit) {
          setMilestoneHit(hit); setTimeout(() => setMilestoneHit(null), 5000);
          const pieces = Array.from({length:70}, (_,i) => ({ id:i, x:Math.random()*100, color:["#00FF94","#FFD700","#FF6B35","#00C2FF","#B388FF","#fff"][Math.floor(Math.random()*6)], delay:Math.random()*0.8, size:5+Math.random()*9 }));
          setConfetti(pieces); setTimeout(() => setConfetti([]), 4000);
        }
      }
    }
  }

  // Apply negative XP for a "penalty" activity
  function doNegXP(activity, minutes) {
    const intervals = Math.floor(minutes / 5);
    if (intervals <= 0) return;
    const lost = -(activity.xp * intervals);
    doAddXP({ ...activity, isNegative: true }, lost, `${activity.label} — ${minutes} min`);
  }

  function handleSale() { const kr=parseFloat(saleInput); if(!kr||kr<=0) return; doAddXP(saleActivity, Math.round(kr*saleActivity.xp), `Sale — ${kr.toLocaleString()}kr`); setSaleInput(""); }
  function handleRun() { const km=parseFloat(kmInput); if(!km||km<=0) return; doAddXP(runActivity, Math.round(km*runActivity.xp), `Run — ${km}km`); setKmInput(""); }

  function updateActivity(id, field, val) { setActivities(prev => prev.map(a => a.id===id ? {...a,[field]:field==="xp"?parseFloat(val)||0:val} : a)); }
  function updateActivity2(id, field, val) { setActivities(prev => prev.map(a => a.id===id ? {...a,[field]:val} : a)); }
  function deleteActivity(id) { setActivities(prev => prev.filter(a => a.id!==id)); }
  function updateMilestone(id, field, val) { setMilestones(prev => prev.map(m => m.id===id ? {...m,[field]:field==="xpRequired"?parseInt(val)||0:val} : m)); }
  function updateLevel(levelNum, field, val) { setLevels(prev => prev.map(l => l.level===levelNum ? {...l,[field]:field==="xpRequired"?parseInt(val)||0:val} : l)); }
  function addLevelToTier(tierNum) {
    setLevels(prev => {
      const tl = prev.filter(l => l.tier===tierNum); const last = tl[tl.length-1];
      const tr = TIER_RANGES.find(t => t.tier===tierNum); const max = Math.max(...prev.map(l=>l.level));
      return [...prev, { level:max+1, tierLevel:tl.length+1, tier:tierNum, xpRequired:last?Math.min(last.xpRequired+500,tr.end-1):tr.start, title:`Level ${tl.length+1}`, reward:"New reward", milestoneId:tr.milestone }].sort((a,b)=>a.tier-b.tier||a.level-b.level);
    });
  }
  function removeLevelFromTier(tierNum) {
    setLevels(prev => { const tl=prev.filter(l=>l.tier===tierNum); if(tl.length<=1) return prev; return prev.filter(l=>l.level!==tl[tl.length-1].level); });
  }

  // Edit log entry: adjust XP delta
  function handleSaveLogEdit(index, updatedEntry) {
    const oldXp = log[index].xp;
    const newXp = updatedEntry.xp;
    const delta = newXp - oldXp;
    const adjustedTotal = xp + delta;
    setXp(adjustedTotal);
    animateXPCount(xp, adjustedTotal);
    setLog(prev => prev.map((e, i) => i === index ? updatedEntry : e));
    setEditingLogEntry(null);
  }

  const cardBg = "#121212";
  const cardBorder = "#1e1e1e";
  const cardBg2 = "#0d0d0d";

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"#fff", fontFamily:"'DM Mono',monospace", maxWidth:"480px", margin:"0 auto", paddingBottom:"80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Archivo+Black&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#080808}
        ::-webkit-scrollbar{display:none}
        @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
        @keyframes popNeg{0%{transform:scale(1)}40%{transform:scale(0.96)}100%{transform:scale(1)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes overlayAnim{0%{opacity:0;transform:translate(-50%,-50%) scale(0.85)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.02)}85%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(0.95)}}
        @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
        @keyframes xpPop{0%{transform:scale(1)}30%{transform:scale(1.08)}100%{transform:scale(1)}}
        .btn{background:#141414;border:1px solid #222;border-radius:10px;cursor:pointer;color:#fff;font-family:'DM Mono',monospace;transition:all 0.12s ease}
        .btn:hover{background:#1a1a1a;border-color:#333}
        .btn:active{transform:scale(0.97)}
        .btn-neg{background:#1a0a0a;border:1px solid #FF446622;border-radius:10px;cursor:pointer;color:#fff;font-family:'DM Mono',monospace;transition:all 0.12s ease}
        .btn-neg:hover{background:#220d0d;border-color:#FF446644}
        .btn-neg:active{transform:scale(0.97)}
        .flashing{animation:pop 0.6s ease}
        .flashing-neg{animation:popNeg 0.6s ease}
        .tab{flex:1;padding:10px;background:none;border:none;border-bottom:2px solid transparent;color:#666;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;cursor:pointer;transition:all 0.15s;text-transform:uppercase}
        .tab.active{color:#fff;border-bottom-color:#00FF94}
        .edit-input{background:#0d0d0d;border:1px solid #2a2a2a;border-radius:6px;padding:6px 8px;color:#fff;font-family:'DM Mono',monospace;font-size:16px;outline:none;width:100%}
        .edit-input:focus{border-color:#444}
        input[type=number]::-webkit-inner-spin-button{opacity:0}
        .num-input{background:#0d0d0d;border:1px solid #222;border-radius:8px;padding:8px 12px;color:#fff;font-family:'DM Mono',monospace;font-size:16px;outline:none;flex:1}
        .num-input:focus{border-color:#333}
        .del-btn{background:none;border:1px solid #252525;border-radius:6px;color:#555;cursor:pointer;font-size:12px;padding:3px 8px;font-family:'DM Mono',monospace;transition:all 0.15s}
        .del-btn:hover{color:#FF4466;border-color:#FF446644}
        .edit-log-btn{background:none;border:1px solid #252525;border-radius:6px;color:#555;cursor:pointer;font-size:11px;padding:3px 8px;font-family:'DM Mono',monospace;transition:all 0.15s;letter-spacing:1px}
        .edit-log-btn:hover{color:#FFD700;border-color:#FFD70044}
      `}</style>

      <Confetti pieces={confetti} />

      {/* Edit Log Modal */}
      {editingLogEntry && (
        <EditLogModal
          entry={editingLogEntry.entry}
          onSave={(updated) => handleSaveLogEdit(editingLogEntry.index, updated)}
          onClose={() => setEditingLogEntry(null)}
        />
      )}

      {levelUp && (
        <div style={{ position:"fixed",top:"50%",left:"50%",zIndex:200,animation:"overlayAnim 4s ease forwards",background:"#0a0f0a",border:`1px solid ${tierColor}55`,borderRadius:"20px",padding:"32px 40px",textAlign:"center",boxShadow:`0 0 80px ${tierColor}22`,width:"300px" }}>
          <div style={{ fontSize:"34px",marginBottom:"10px" }}>⚡</div>
          <div style={{ fontFamily:"'Archivo Black'",fontSize:"11px",letterSpacing:"4px",color:tierColor,marginBottom:"6px" }}>LEVEL UP</div>
          <div style={{ fontFamily:"'Archivo Black'",fontSize:"20px",marginBottom:"4px" }}>LEVEL {levelUp.tierLevel}</div>
          <div style={{ color:tierColor,fontSize:"13px",marginBottom:"14px" }}>{currentMilestone?.title} TIER</div>
          {levelUp.reward && <div style={{ color:"#ccc",fontSize:"12px",lineHeight:1.6 }}>🎁 {levelUp.reward}</div>}
        </div>
      )}

      {milestoneHit && (
        <div style={{ position:"fixed",top:"50%",left:"50%",zIndex:200,animation:"overlayAnim 5s ease forwards",background:"#0d0d0d",border:`2px solid ${milestoneHit.color}`,borderRadius:"20px",padding:"32px 40px",textAlign:"center",boxShadow:`0 0 100px ${milestoneHit.color}55`,width:"300px" }}>
          <div style={{ fontSize:"52px",marginBottom:"10px" }}>{milestoneHit.icon}</div>
          <div style={{ fontFamily:"'Archivo Black'",fontSize:"11px",letterSpacing:"4px",color:milestoneHit.color,marginBottom:"8px" }}>MILESTONE UNLOCKED</div>
          <div style={{ fontFamily:"'Archivo Black'",fontSize:"30px",color:milestoneHit.color,marginBottom:"14px" }}>{milestoneHit.title}</div>
          <div style={{ color:"#ddd",fontSize:"13px",lineHeight:1.6 }}>{milestoneHit.reward}</div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ padding:"24px 20px 0" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <div style={{ fontFamily:"'Archivo Black'",fontSize:"10px",letterSpacing:"4px",color:"#333",marginBottom:"4px" }}>LEVEL XP // YOUR JOURNEY</div>
            <div style={{ fontFamily:"'Archivo Black'",fontSize:"42px",lineHeight:1,letterSpacing:"-1px",transition:"color 0.3s",color:displayXP < 0 ? "#FF4466" : "inherit" }}>
              {displayXP.toLocaleString()}
              <span style={{ fontSize:"13px",color:"#444",marginLeft:"6px",letterSpacing:"2px" }}>XP</span>
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"8px",paddingTop:"6px" }}>
            <button onClick={() => setEditMode(e => !e)} style={{ background:editMode?"#1a1500":"#141414",border:`1px solid ${editMode?"#FFD70044":"#222"}`,borderRadius:"8px",padding:"6px 12px",color:editMode?"#FFD700":"#777",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",transition:"all 0.15s" }}>
              {editMode?"✓ DONE":"✎ EDIT"}
            </button>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:"#bbb",fontSize:"11px" }}>{todayXP >= 0 ? "+" : ""}{todayXP} today</div>
              <div style={{ color:"#555",fontSize:"10px" }}>{streak}🔥 day streak</div>
            </div>
          </div>
        </div>

        {/* Daily goal bar */}
        <div style={{ marginTop:"16px",background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"12px",padding:"12px 14px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px" }}>
            <div style={{ fontSize:"10px",color:"#888",letterSpacing:"2px" }}>DAILY GOAL</div>
            {editingGoal ? (
              <div style={{ display:"flex",gap:"6px",alignItems:"center" }}>
                <input type="number" defaultValue={dailyGoal} id="goalInput"
                  style={{ width:"70px",background:"#0d0d0d",border:"1px solid #333",borderRadius:"6px",padding:"3px 6px",color:"#fff",fontFamily:"'DM Mono',monospace",fontSize:"16px",outline:"none",textAlign:"right" }} />
                <button onClick={() => { const v=parseInt(document.getElementById("goalInput").value); if(v>0) setDailyGoal(v); setEditingGoal(false); }}
                  style={{ background:"none",border:"none",color:"#00FF94",fontSize:"11px",cursor:"pointer",fontFamily:"'DM Mono',monospace" }}>SET</button>
              </div>
            ) : (
              <div style={{ display:"flex",gap:"8px",alignItems:"center" }}>
                <div style={{ fontSize:"11px",color:dailyProgress>=100?"#00FF94":"#bbb" }}>{todayXP} / {dailyGoal} XP</div>
                <button onClick={() => setEditingGoal(true)} style={{ background:"none",border:"none",color:"#444",fontSize:"10px",cursor:"pointer",fontFamily:"'DM Mono',monospace" }}>edit</button>
              </div>
            )}
          </div>
          <div style={{ background:"#1a1a1a",borderRadius:"4px",height:"6px",overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${Math.max(0,dailyProgress)}%`,background:dailyProgress>=100?"linear-gradient(90deg,#00FF94,#00FFCC)":"linear-gradient(90deg,#00FF9466,#00FF94)",borderRadius:"4px",transition:"width 0.5s ease" }} />
          </div>
        </div>

        {/* Tier card */}
        <div style={{ marginTop:"8px",background:cardBg,border:`1px solid ${tierColor}22`,borderRadius:"12px",padding:"14px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
              <span style={{ fontSize:"18px" }}>{currentMilestone?.icon}</span>
              <div>
                <div style={{ fontFamily:"'Archivo Black'",fontSize:"13px",color:tierColor,letterSpacing:"2px" }}>{currentMilestone?.title} TIER</div>
                <div style={{ fontSize:"10px",color:"#777",marginTop:"2px" }}>Level {current.tierLevel} of {levels.filter(l=>l.tier===tierRange.tier).length}</div>
              </div>
            </div>
            {nextMilestone && <div style={{ textAlign:"right" }}><div style={{ fontSize:"9px",color:"#555" }}>MILESTONE IN</div><div style={{ fontSize:"11px",color:"#bbb",marginTop:"2px" }}>{(nextMilestone.xpRequired-xp).toLocaleString()} XP</div></div>}
          </div>
          <div style={{ background:"#1a1a1a",borderRadius:"3px",height:"5px",overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${tierProgress}%`,background:`linear-gradient(90deg,${tierColor}88,${tierColor})`,borderRadius:"3px",transition:"width 0.5s ease" }} />
          </div>
          <div style={{ display:"flex",gap:"6px",marginTop:"8px" }}>
            {levels.filter(l=>l.tier===tierRange.tier).map((l,i) => (
              <div key={i} style={{ flex:1,height:"4px",borderRadius:"2px",background:l.level<=current.level?tierColor:"#1e1e1e",transition:"background 0.3s" }} />
            ))}
          </div>
          {next && <div style={{ marginTop:"8px",fontSize:"11px",color:"#777" }}>Next: <span style={{ color:"#ddd" }}>{(next.xpRequired-xp).toLocaleString()} XP</span>{next.reward?<span style={{ color:"#999" }}> — {next.reward}</span>:null}</div>}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display:"flex",borderBottom:"1px solid #111",padding:"0 20px",marginTop:"16px" }}>
        {[["main","Log"],["levels","Rewards"],["log","History"]].map(([id,label]) => (
          <button key={id} className={`tab ${tab===id?"active":""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={{ padding:"16px 20px" }}>

        {/* ── LOG TAB ── */}
        {tab==="main" && (
          <div style={{ display:"flex",flexDirection:"column",gap:"8px",animation:"slideUp 0.3s ease" }}>
            {activities.map(activity => {
              const isFlashing = flash===activity.id;
              const count = (todayCounts[todayKey]||{})[activity.id]||0;
              const isNeg = activity.isNegative;

              // ── NEGATIVE / PENALTY ACTIVITY ──────────────────────────────
              if (isNeg) {
                const minKey = activity.id+"_min";
                const minVal = multiQty[minKey]||"";
                const setMinVal = v => setMultiQty(p=>({...p,[minKey]:v}));
                const mins = parseFloat(minVal)||0;
                const intervals = Math.floor(mins/5);
                const lost = intervals * activity.xp;

                if (editMode) return (
                  <div key={activity.id} style={{ background:"#1a0a0a",border:"1px solid #FF446622",borderRadius:"10px",padding:"12px 14px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px" }}>
                      <div style={{ display:"flex",gap:"8px",alignItems:"center" }}>
                        <span style={{ fontSize:"18px" }}>{activity.icon}</span>
                        <div>
                          <div style={{ fontSize:"12px",color:"#FF4466" }}>{activity.label}</div>
                          <div style={{ fontSize:"10px",color:"#553344",marginTop:"2px" }}>PENALTY ACTIVITY</div>
                        </div>
                      </div>
                      {editMode && <button className="del-btn" onClick={() => deleteActivity(activity.id)}>✕</button>}
                    </div>
                    <div style={{ display:"flex",gap:"8px" }}>
                      <div style={{ flex:"0 0 80px" }}><div style={{ fontSize:"10px",color:"#888",marginBottom:"4px" }}>XP/5MIN</div><input className="edit-input" type="number" value={activity.xp} onChange={e => updateActivity(activity.id,"xp",e.target.value)} /></div>
                      <div style={{ flex:1 }}><div style={{ fontSize:"10px",color:"#888",marginBottom:"4px" }}>LABEL</div><input className="edit-input" type="text" value={activity.label} onChange={e => updateActivity(activity.id,"label",e.target.value)} /></div>
                    </div>
                  </div>
                );

                return (
                  <div key={activity.id} style={{ background:"#0f0808",border:`1px solid #FF446633`,borderRadius:"10px",padding:"14px",animation:isFlashing?"flashing-neg 0.6s ease":"none" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
                      <div style={{ display:"flex",gap:"10px",alignItems:"center" }}>
                        <span style={{ fontSize:"18px" }}>{activity.icon}</span>
                        <div>
                          <div style={{ fontSize:"12px",color:"#FF6688" }}>{activity.label}</div>
                          <div style={{ fontSize:"10px",color:"#553344",marginTop:"2px" }}>
                            {count>0?`${count}x today · −${activity.xp} XP per 5 min`:`−${activity.xp} XP per 5 min`}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontFamily:"'Archivo Black'",fontSize:"13px",color:"#FF4466" }}>
                        {mins>0?`−${lost} XP`:"−XP"}
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:"8px" }}>
                      <input
                        type="number" placeholder="Minutes (e.g. 45)"
                        value={minVal} onChange={e => setMinVal(e.target.value)}
                        onKeyDown={e => { if(e.key==="Enter"&&mins>0){ doNegXP(activity,mins); setMinVal(""); } }}
                        className="num-input" step="5"
                      />
                      <button
                        className="btn-neg"
                        onClick={() => { if(mins>0){ doNegXP(activity,mins); setMinVal(""); } }}
                        style={{ padding:"8px 14px",fontSize:"12px",color:"#FF4466",whiteSpace:"nowrap",minWidth:"80px" }}>
                        LOG −{lost||"?"}
                      </button>
                    </div>
                    {mins > 0 && intervals === 0 && <div style={{ fontSize:"10px",color:"#553344",marginTop:"6px" }}>Min 5 minutes to deduct XP</div>}
                  </div>
                );
              }

              // ── SALE ─────────────────────────────────────────────────────
              if (activity.id==="sale") return (
                <div key="sale" style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"14px",animation:isFlashing?"pop 0.6s ease":"none" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
                    <div style={{ display:"flex",gap:"10px",alignItems:"center" }}>
                      <span style={{ fontSize:"18px" }}>💰</span>
                      <div>
                        <div style={{ fontSize:"12px",fontWeight:"500",color:"#fff" }}>Sale Made</div>
                        <div style={{ fontSize:"10px",color:"#888",marginTop:"2px" }}>{count>0?`${count}x today`:`${Math.round((saleActivity?.xp||0.1)*1000)} XP per 1000kr`}</div>
                      </div>
                    </div>
                    {editMode && <div style={{ display:"flex",alignItems:"center",gap:"6px" }}><div style={{ fontSize:"10px",color:"#888" }}>XP/1000kr</div><input className="edit-input" type="number" value={Math.round((saleActivity?.xp||0)*1000)} step="1" onChange={e => updateActivity("sale","xp",(parseFloat(e.target.value)||0)/1000)} style={{ width:"70px" }} /></div>}
                  </div>
                  {!editMode && <div style={{ display:"flex",gap:"8px" }}>
                    <input type="number" placeholder="Sale amount in kr (e.g. 3350)" value={saleInput} onChange={e => setSaleInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleSale()} className="num-input" />
                    <button className="btn" onClick={handleSale} style={{ padding:"8px 14px",fontSize:"12px",color:"#FFD700",whiteSpace:"nowrap" }}>+{saleInput&&parseFloat(saleInput)>0?Math.round(parseFloat(saleInput)*(saleActivity?.xp||0.1)):"XP"}</button>
                  </div>}
                </div>
              );

              // ── RUN ──────────────────────────────────────────────────────
              if (activity.id==="run") return (
                <div key="run" style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"14px",animation:isFlashing?"pop 0.6s ease":"none" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
                    <div style={{ display:"flex",gap:"10px",alignItems:"center" }}>
                      <span style={{ fontSize:"18px" }}>🏃</span>
                      <div>
                        <div style={{ fontSize:"12px",fontWeight:"500",color:"#fff" }}>Running</div>
                        <div style={{ fontSize:"10px",color:"#888",marginTop:"2px" }}>{count>0?`${count}x today`:`${runActivity?.xp} XP per km`}</div>
                      </div>
                    </div>
                    {editMode && <div style={{ display:"flex",alignItems:"center",gap:"6px" }}><div style={{ fontSize:"10px",color:"#888" }}>XP/km</div><input className="edit-input" type="number" value={runActivity?.xp} onChange={e => updateActivity("run","xp",e.target.value)} style={{ width:"70px" }} /></div>}
                  </div>
                  {!editMode && <div style={{ display:"flex",gap:"8px" }}>
                    <input type="number" placeholder="Distance in km (e.g. 5.5)" value={kmInput} onChange={e => setKmInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleRun()} className="num-input" step="0.1" />
                    <button className="btn" onClick={handleRun} style={{ padding:"8px 14px",fontSize:"12px",color:"#FF6B35",whiteSpace:"nowrap" }}>+{kmInput&&parseFloat(kmInput)>0?Math.round(parseFloat(kmInput)*(runActivity?.xp||10)):"XP"}</button>
                  </div>}
                </div>
              );

              // ── CUSTOM km ────────────────────────────────────────────────
              if (activity.custom && activity.inputType==="km") {
                const ck = multiQty[activity.id+"_km"]||"";
                const setCk = v => setMultiQty(p=>({...p,[activity.id+"_km"]:v}));
                return (
                  <div key={activity.id} style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"14px",animation:isFlashing?"pop 0.6s ease":"none" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
                      <div style={{ display:"flex",gap:"10px",alignItems:"center" }}><span style={{ fontSize:"18px" }}>{activity.icon}</span><div><div style={{ fontSize:"12px",color:"#fff" }}>{activity.label}</div><div style={{ fontSize:"10px",color:"#888",marginTop:"2px" }}>{count>0?`${count}x today`:`${activity.xp} XP per km`}</div></div></div>
                      {editMode && <button className="del-btn" onClick={() => deleteActivity(activity.id)}>✕</button>}
                    </div>
                    {!editMode && <div style={{ display:"flex",gap:"8px" }}><input type="number" placeholder="Distance in km" value={ck} onChange={e=>setCk(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const km=parseFloat(ck);if(km>0){doAddXP(activity,Math.round(km*activity.xp),`${activity.label} — ${km}km`);setCk("");}}}} className="num-input" step="0.1"/><button className="btn" onClick={()=>{const km=parseFloat(ck);if(km>0){doAddXP(activity,Math.round(km*activity.xp),`${activity.label} — ${km}km`);setCk("");}}} style={{ padding:"8px 14px",fontSize:"12px",color:activity.color,whiteSpace:"nowrap" }}>+{ck&&parseFloat(ck)>0?Math.round(parseFloat(ck)*activity.xp):"XP"}</button></div>}
                  </div>
                );
              }

              // ── CUSTOM amount ────────────────────────────────────────────
              if (activity.custom && activity.inputType==="amount") {
                const ca = multiQty[activity.id+"_amt"]||"";
                const setCa = v => setMultiQty(p=>({...p,[activity.id+"_amt"]:v}));
                return (
                  <div key={activity.id} style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"14px",animation:isFlashing?"pop 0.6s ease":"none" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
                      <div style={{ display:"flex",gap:"10px",alignItems:"center" }}><span style={{ fontSize:"18px" }}>{activity.icon}</span><div><div style={{ fontSize:"12px",color:"#fff" }}>{activity.label}</div><div style={{ fontSize:"10px",color:"#888",marginTop:"2px" }}>{count>0?`${count}x today`:`${activity.xp} XP per 1000kr`}</div></div></div>
                      {editMode && <button className="del-btn" onClick={() => deleteActivity(activity.id)}>✕</button>}
                    </div>
                    {!editMode && <div style={{ display:"flex",gap:"8px" }}><input type="number" placeholder="Amount in kr" value={ca} onChange={e=>setCa(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const kr=parseFloat(ca);if(kr>0){doAddXP(activity,Math.round(kr*(activity.xp/1000)),`${activity.label} — ${kr.toLocaleString()}kr`);setCa("");}}}} className="num-input"/><button className="btn" onClick={()=>{const kr=parseFloat(ca);if(kr>0){doAddXP(activity,Math.round(kr*(activity.xp/1000)),`${activity.label} — ${kr.toLocaleString()}kr`);setCa("");}}} style={{ padding:"8px 14px",fontSize:"12px",color:activity.color,whiteSpace:"nowrap" }}>+{ca&&parseFloat(ca)>0?Math.round(parseFloat(ca)*(activity.xp/1000)):"XP"}</button></div>}
                  </div>
                );
              }

              // ── CUSTOM minutes ───────────────────────────────────────────
              if (activity.custom && activity.inputType==="minutes") {
                const mk = activity.id+"_min";
                const mv = multiQty[mk]||"";
                const setMv = v => setMultiQty(p=>({...p,[mk]:v}));
                const minsV = parseFloat(mv)||0;
                const intervals2 = Math.floor(minsV/5);
                const xpEarned = intervals2 * activity.xp;
                return (
                  <div key={activity.id} style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"14px",animation:isFlashing?"pop 0.6s ease":"none" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
                      <div style={{ display:"flex",gap:"10px",alignItems:"center" }}><span style={{ fontSize:"18px" }}>{activity.icon}</span><div><div style={{ fontSize:"12px",color:"#fff" }}>{activity.label}</div><div style={{ fontSize:"10px",color:"#888",marginTop:"2px" }}>{count>0?`${count}x today`:`${activity.xp} XP per 5 min`}</div></div></div>
                      {editMode && <button className="del-btn" onClick={() => deleteActivity(activity.id)}>✕</button>}
                    </div>
                    {!editMode && <div style={{ display:"flex",gap:"8px" }}><input type="number" placeholder="Minutes" value={mv} onChange={e=>setMv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&minsV>0){doAddXP(activity,xpEarned,`${activity.label} — ${minsV} min`);setMv("");}}} className="num-input" step="5"/><button className="btn" onClick={()=>{if(minsV>0){doAddXP(activity,xpEarned,`${activity.label} — ${minsV} min`);setMv("");}}} style={{ padding:"8px 14px",fontSize:"12px",color:activity.color,whiteSpace:"nowrap" }}>+{xpEarned||"XP"}</button></div>}
                  </div>
                );
              }

              // ── EDIT MODE for normal activities ──────────────────────────
              if (editMode) return (
                <div key={activity.id} style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"12px 14px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px" }}>
                    <div style={{ display:"flex",gap:"8px",alignItems:"center" }}><span style={{ fontSize:"18px" }}>{activity.icon}</span><div style={{ fontSize:"12px",color:"#ccc" }}>{activity.label}</div></div>
                    <div style={{ display:"flex",gap:"6px",alignItems:"center" }}>
                        {activity.custom && <select value={activity.inputType} onChange={e => updateActivity2(activity.id,"inputType",e.target.value)} style={{ background:"#0d0d0d",border:"1px solid #2a2a2a",borderRadius:"6px",padding:"4px 6px",color:"#aaa",fontFamily:"'DM Mono',monospace",fontSize:"11px",outline:"none" }}>
                          {INPUT_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                        </select>}
                        <button className="del-btn" onClick={() => deleteActivity(activity.id)}>✕</button>
                      </div>
                  </div>
                  <div style={{ display:"flex",gap:"8px" }}>
                    <div style={{ flex:"0 0 80px" }}><div style={{ fontSize:"10px",color:"#888",marginBottom:"4px" }}>XP</div><input className="edit-input" type="number" value={activity.xp} onChange={e => updateActivity(activity.id,"xp",e.target.value)} /></div>
                    <div style={{ flex:1 }}><div style={{ fontSize:"10px",color:"#888",marginBottom:"4px" }}>LABEL</div><input className="edit-input" type="text" value={activity.label} onChange={e => updateActivity(activity.id,"label",e.target.value)} /></div>
                  </div>
                </div>
              );

              // ── TAP / QUANTITY BUTTON ────────────────────────────────────
              const hasQty = activity.id==="call" || activity.multi;
              const qty = multiQty[activity.id]||"";
              const times = hasQty&&qty&&parseInt(qty)>0?parseInt(qty):1;
              const gainedXP = activity.xp*times;
              return (
                <button key={activity.id} className={`btn ${isFlashing?"flashing":""}`}
                  onClick={() => { doAddXP({...activity,xp:gainedXP},gainedXP,times>1?`${activity.label} ×${times}`:activity.label); if(hasQty) setMultiQty(p=>({...p,[activity.id]:""})); }}
                  style={{ padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%" }}>
                  <div style={{ display:"flex",gap:"10px",alignItems:"center" }}>
                    <span style={{ fontSize:"18px" }}>{activity.icon}</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:"12px",fontWeight:"500",color:"#fff" }}>{activity.label}</div>
                      <div style={{ fontSize:"10px",color:"#888",marginTop:"2px" }}>{count>0?`${count}x today`:activity.unit}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                    {hasQty && <input type="number" placeholder="×1" value={qty} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();setMultiQty(p=>({...p,[activity.id]:e.target.value}));}} style={{ width:"48px",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:"8px",padding:"5px 6px",color:"#aaa",fontFamily:"'DM Mono',monospace",fontSize:"16px",outline:"none",textAlign:"center" }} />}
                    <div style={{ color:activity.color,fontFamily:"'Archivo Black'",fontSize:"16px",minWidth:"40px",textAlign:"right" }}>+{gainedXP}</div>
                  </div>
                </button>
              );
            })}
            <AddActivityButton setActivities={setActivities} />
          </div>
        )}

        {/* ── REWARDS TAB ── */}
        {tab==="levels" && (
          <div style={{ animation:"slideUp 0.3s ease" }}>
            {TIER_RANGES.map(tierR => {
              const tm = milestones.find(m=>m.id===tierR.milestone);
              const tc = TIER_COLORS[tierR.tier];
              const tierLevels = levels.filter(l=>l.tier===tierR.tier).sort((a,b)=>a.level-b.level);
              const tierComplete = xp>=tierR.end;
              const isCurrentTier = tierRange.tier===tierR.tier;
              const tierUnlocked = xp>=tierR.start;
              return (
                <div key={tierR.tier} style={{ marginBottom:"28px",opacity:tierUnlocked?1:0.3 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px" }}>
                    <span style={{ fontSize:"20px" }}>{tm?.icon}</span>
                    <div>
                      <div style={{ fontFamily:"'Archivo Black'",fontSize:"14px",color:tc,letterSpacing:"2px" }}>{tm?.title} TIER</div>
                      <div style={{ fontSize:"10px",color:"#666",marginTop:"2px" }}>{tierR.start.toLocaleString()} – {tierR.end.toLocaleString()} XP</div>
                    </div>
                    <div style={{ marginLeft:"auto",display:"flex",gap:"8px",alignItems:"center" }}>
                      {tierComplete && <div style={{ fontSize:"12px",color:tc }}>✓</div>}
                      {isCurrentTier && !tierComplete && <div style={{ fontSize:"10px",color:tc,letterSpacing:"2px" }}>ACTIVE</div>}
                      {editMode && (<><button onClick={()=>removeLevelFromTier(tierR.tier)} style={{ background:"none",border:"1px solid #2a2a2a",borderRadius:"6px",color:"#888",cursor:"pointer",fontSize:"14px",padding:"2px 8px",lineHeight:1 }}>−</button><button onClick={()=>addLevelToTier(tierR.tier)} style={{ background:"none",border:"1px solid #2a2a2a",borderRadius:"6px",color:"#888",cursor:"pointer",fontSize:"14px",padding:"2px 8px",lineHeight:1 }}>+</button></>)}
                    </div>
                  </div>

                  <div style={{ display:"flex",flexDirection:"column",gap:"6px",marginBottom:"10px" }}>
                    {tierLevels.map((level,li) => {
                      const unlocked = xp>=level.xpRequired;
                      const isCurrent = current.level===level.level;
                      if (editMode) return (
                        <div key={level.level} style={{ background:cardBg,border:`1px solid ${isCurrent?tc+"44":cardBorder}`,borderRadius:"10px",padding:"12px" }}>
                          <div style={{ fontSize:"10px",color:"#fff",letterSpacing:"1px",marginBottom:"8px" }}>LEVEL {li+1}</div>
                          <div style={{ display:"flex",gap:"8px",marginBottom:"8px" }}>
                            <div style={{ flex:"0 0 110px" }}><div style={{ fontSize:"10px",color:"#aaa",marginBottom:"4px" }}>XP TO UNLOCK</div><input className="edit-input" type="number" value={level.xpRequired} onChange={e=>updateLevel(level.level,"xpRequired",e.target.value)} /></div>
                            <div style={{ flex:1 }}><div style={{ fontSize:"10px",color:"#aaa",marginBottom:"4px" }}>TITLE</div><input className="edit-input" type="text" value={level.title} onChange={e=>updateLevel(level.level,"title",e.target.value)} /></div>
                          </div>
                          <div><div style={{ fontSize:"10px",color:"#aaa",marginBottom:"4px" }}>REWARD</div><input className="edit-input" type="text" value={level.reward} onChange={e=>updateLevel(level.level,"reward",e.target.value)} /></div>
                        </div>
                      );
                      return (
                        <div key={level.level} style={{ background:isCurrent?"#111":cardBg2,border:`1px solid ${isCurrent?tc+"44":"#161616"}`,borderRadius:"10px",padding:"12px 14px",display:"flex",gap:"12px",alignItems:"flex-start" }}>
                          <div style={{ fontFamily:"'Archivo Black'",fontSize:"16px",color:isCurrent?tc:unlocked?tc+"88":"#333",minWidth:"22px",paddingTop:"1px" }}>{unlocked&&!isCurrent?"✓":li+1}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex",justifyContent:"space-between" }}>
                              <div style={{ fontSize:"11px",color:isCurrent?"#fff":unlocked?"#ccc":"#555" }}>LEVEL {li+1}</div>
                              <div style={{ fontSize:"10px",color:"#444" }}>{level.xpRequired.toLocaleString()} XP</div>
                            </div>
                            <div style={{ fontSize:"12px",color:unlocked?"#ddd":"#666",marginTop:"4px" }}>🎁 {level.reward}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background:cardBg,border:`1px solid ${tc}${tierComplete?"55":"22"}`,borderRadius:"12px",padding:"14px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px" }}>
                      <div style={{ display:"flex",gap:"8px",alignItems:"center" }}><span style={{ fontSize:"20px" }}>{tm?.icon}</span><div style={{ fontFamily:"'Archivo Black'",fontSize:"13px",color:tc,letterSpacing:"2px" }}>{tm?.title} MILESTONE</div></div>
                      {tierComplete && <div style={{ fontSize:"12px",color:tc }}>✓</div>}
                    </div>
                    {editMode ? (
                      <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                        <div><div style={{ fontSize:"10px",color:"#aaa",marginBottom:"4px" }}>XP REQUIRED</div><input className="edit-input" type="number" value={tm?.xpRequired} onChange={e=>updateMilestone(tm.id,"xpRequired",e.target.value)} /></div>
                        <div><div style={{ fontSize:"10px",color:"#aaa",marginBottom:"4px" }}>REWARD</div><input className="edit-input" type="text" value={tm?.reward} onChange={e=>updateMilestone(tm.id,"reward",e.target.value)} /></div>
                      </div>
                    ) : <div style={{ fontSize:"13px",color:"#ddd",paddingLeft:"28px" }}>{tm?.reward}</div>}
                    {!tierComplete && isCurrentTier && (
                      <div style={{ marginTop:"10px",paddingLeft:"28px" }}>
                        <div style={{ background:"#1a1a1a",borderRadius:"3px",height:"3px" }}><div style={{ height:"100%",width:`${Math.min(((xp-tierR.start)/(tierR.end-tierR.start))*100,100)}%`,background:tc,borderRadius:"3px",transition:"width 0.5s ease" }} /></div>
                        <div style={{ color:"#555",fontSize:"10px",marginTop:"5px" }}>{(tierR.end-xp).toLocaleString()} XP to go</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab==="log" && (
          <div style={{ animation:"slideUp 0.3s ease" }}>
            {/* Stat cards */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"16px" }}>
              <div style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"10px 12px" }}>
                <div style={{ fontSize:"9px",color:"#555",letterSpacing:"2px",marginBottom:"4px" }}>THIS WEEK</div>
                <div style={{ fontFamily:"'Archivo Black'",fontSize:"18px",color:"#00FF94" }}>{thisWeekXP.toLocaleString()}</div>
                <div style={{ fontSize:"9px",color:"#333",marginTop:"2px" }}>XP</div>
              </div>
              <div style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"10px 12px" }}>
                <div style={{ fontSize:"9px",color:"#555",letterSpacing:"2px",marginBottom:"4px" }}>LAST WEEK</div>
                <div style={{ fontFamily:"'Archivo Black'",fontSize:"18px",color:"#888" }}>{lastWeekXP.toLocaleString()}</div>
                <div style={{ fontSize:"9px",color:"#333",marginTop:"2px" }}>XP</div>
              </div>
              <div style={{ background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"10px",padding:"10px 12px" }}>
                <div style={{ fontSize:"9px",color:"#555",letterSpacing:"2px",marginBottom:"4px" }}>BEST DAY</div>
                <div style={{ fontFamily:"'Archivo Black'",fontSize:"18px",color:"#FFD700" }}>{bestDay.xp.toLocaleString()}</div>
                <div style={{ fontSize:"9px",color:"#333",marginTop:"2px" }}>{bestDay.date||"—"}</div>
              </div>
            </div>

            {/* Chart */}
            <XPChart log={log} bestDay={bestDay} />

            {/* Log list */}
            {log.length===0 ? (
              <div style={{ color:"#333",textAlign:"center",padding:"60px 0",fontSize:"13px" }}>Nothing logged yet.<br/>Log your first activity above.</div>
            ) : (
              <>
                <div style={{ fontSize:"10px",color:"#444",letterSpacing:"2px",marginBottom:"12px",marginTop:"16px" }}>TAP ✎ TO EDIT · ✕ TO REMOVE</div>
                {log.map((entry,i) => {
                  const isNegEntry = entry.xp < 0 || entry.isNegative;
                  return (
                    <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #111",animation:i===0?"slideUp 0.3s ease":"none" }}>
                      <div style={{ display:"flex",gap:"10px",alignItems:"center",flex:1,minWidth:0 }}>
                        <span style={{ fontSize:"16px" }}>{entry.icon}</span>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:"12px",color:"#ccc",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{entry.label}</div>
                          <div style={{ fontSize:"10px",color:"#444",marginTop:"2px" }}>{entry.date} {entry.time}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:"8px",flexShrink:0 }}>
                        <div style={{ fontFamily:"'Archivo Black'",fontSize:"13px",color:isNegEntry?"#FF4466":"#00FF94" }}>
                          {isNegEntry ? "" : "+"}{entry.xp}
                        </div>
                        <button className="edit-log-btn" onClick={() => setEditingLogEntry({ index:i, entry })}>✎</button>
                        <button className="del-btn" onClick={() => {
                          setXp(prev=>prev-entry.xp);
                          setDisplayXP(prev=>prev-entry.xp);
                          setLog(prev=>prev.filter((_,idx)=>idx!==i));
                          if(entry.date===todayDate&&entry.activityId) setTodayCounts(prev=>({...prev,[todayKey]:{...(prev[todayKey]||{}),[entry.activityId]:Math.max(0,((prev[todayKey]||{})[entry.activityId]||1)-1)}}));
                        }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
