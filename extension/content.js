console.log("LeetTube Loaded");

/* ================= CONFIG ================= */

const API_KEYS = [
  "AIzaSyCpqmcaGB09UA-Sx3-78CW4a4cn6dz-ptI",
  "AIzaSyA8AIggoWm7a1ZUoH6-c0YHNJtbH2km5gI",
  "AIzaSyCytE6Mp_SqQXjtslPJ-owQHqDAEQu-yDc",
  "AIzaSyDasBDfjIVGwXysCw-kt2NdK_QfdYN121I",
  "AIzaSyC6zqFybSqtazhCRDV7j7FwBTWZT3kFAk4",
  "AIzaSyAD0uy0HrgMiYIfJELaoOaUcCWYwy15GLI",
  "AIzaSyCMiM9GlkiD6xiKD5gLu9_ONpvR0Z-Zr1k",
  "AIzaSyCgixDjvzujZJXTynMrDixFuEnPPBoJe04",
  "AIzaSyAekkKFvYCKxB5WUf7dSnCdtvUiAhT9ac0",
  "AIzaSyCYLqHSF8kDjpRO8I1WuQt_EJOXpmZUYPM",
  "AIzaSyC2IF6orAWLz1eeb9JtmDtQonRheFLzSKg",
  "AIzaSyCW_jk0DFz9hZ1xdoMx8xpPGBxNGGO3BSM",
];

// MUST KEEP ALL CHANNELS HERE FOR PRIORITY TO WORK
const DEFAULT_CHANNELS = [
  { name: "Programming Live with Larry", id: "UCl3tJFKsFrw2p_Wxf1YDSow" },
  { name: "codestorywithMIK", id: "UCaw58edcO3ZqMw76Bvs0kGQ" },
  { name: "NeetCode", id: "UC_mYaQAE6-71rjSN6CeCA-g" },
  { name: "take U forward", id: "UCJskGeByzRRSvmOyZOz61ig" },
  { name: "Sanyam IIT Guwahati", id: "UCuMF6SFnqxmwOAA_zygHMrA" },
];

let keyIndex = 0;
function getKey() { return API_KEYS[keyIndex]; }
function rotateKey() { keyIndex++; }

// Helper to identify the current problem
function getSlugFromUrl() {
    const parts = location.pathname.split("/");
    const i = parts.indexOf("problems");
    return i === -1 ? null : parts[i + 1];
}
let currentSlug = null; 

/* ================= STORAGE ================= */

const CACHE_KEY = "leetTubeCache_v19";
const SETTINGS_KEY = "leetTubeSettings_v19";

function getCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; } }
function setCache(c) { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); }

function getSettings() {
  try {
    let s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    if (!s.channels || s.channels.length === 0) s.channels = DEFAULT_CHANNELS;
    return s;
  } catch {
    return { channels: DEFAULT_CHANNELS };
  }
}
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

/* ================= MATCHING LOGIC ================= */

function normalizeSeq(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
}

function orderedMatch(problemTitle, videoTitle) {
  const A = normalizeSeq(problemTitle);
  const B = normalizeSeq(videoTitle);
  let i = 0;
  for (const w of B) {
    if (w === A[i]) i++;
    if (i === A.length) return true;
  }
  return false;
}

/* ================= CSS ================= */

const STYLES = `
  #lt-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

  /* --- Floating Bubble --- */
  #lc-circle {
    position: fixed; width: 64px; height: 64px;
    background: rgba(18, 18, 18, 0.85);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    display: flex; align-items: center; justify-content: center;
    cursor: grab; z-index: 999990;
    transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.2s;
    font-weight: 800; color: #fff; font-size: 14px; gap: 2px;
  }
  #lc-circle.lc-dragging { transition: none !important; cursor: grabbing; }

  #lc-circle:hover { 
    transform: scale(1.08); 
    border-color: #ffa116; 
    box-shadow: 0 0 20px rgba(255, 161, 22, 0.4);
    color: #ffa116;
  }
  #lc-circle svg { fill: currentColor; width: 18px; height: 18px; }

  /* --- Main Panel --- */
  #lc-panel {
    position: fixed;
    background: rgba(22, 22, 22, 0.95);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    display: none; flex-direction: column;
    z-index: 999991;
    box-shadow: 0 25px 60px rgba(0,0,0,0.8);
    overflow: hidden;
    min-width: 280px; min-height: 200px;
    animation: lcFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes lcFadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

  /* --- Header --- */
  #lc-bar {
    height: 48px;
    background: linear-gradient(to right, rgba(255,255,255,0.03), rgba(255,255,255,0));
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px; cursor: grab; flex-shrink: 0; user-select: none;
  }
  #lc-title { color: #f0f0f0; font-size: 14px; font-weight: 600; letter-spacing: 0.3px; max-width: 60%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  
  .lc-ctrls { display: flex; gap: 12px; }
  .lc-icon-btn { 
    background: none; border: none; cursor: pointer; padding: 4px;
    color: #888; transition: color 0.2s; display: flex; align-items: center; 
  }
  .lc-icon-btn:hover { color: #ffa116; }
  .lc-icon-btn svg { width: 18px; height: 18px; fill: currentColor; }

  /* --- Content --- */
  #lc-content { 
    flex: 1; position: relative; background: #000; display: flex; 
    z-index: 10; width: 100%; height: 100%; overflow: hidden; 
  }
  #lc-frame { width: 100%; height: 100%; border: none; display: block; }
  
  /* --- Settings Overlay --- */
  #lc-settings-layer {
    position: absolute; top: 48px; left: 0; right: 0; bottom: 0;
    background: rgba(18, 18, 18, 1);
    z-index: 20; display: none; flex-direction: column;
  }

  .lc-page {
    flex: 1; display: none; flex-direction: column; padding: 20px;
    animation: lcSlideIn 0.2s ease-out; height: 100%; overflow: hidden;
  }
  .lc-page.active { display: flex; }
  @keyframes lcSlideIn { from { opacity: 0; transform: translateX(15px); } to { opacity: 1; transform: translateX(0); } }

  /* Menu Buttons */
  .lc-menu-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 16px; margin-bottom: 10px; border-radius: 12px;
    color: #fff; font-size: 14px; font-weight: 500;
    cursor: pointer; display: flex; align-items: center; justify-content: space-between;
    transition: all 0.2s ease; text-align: left;
  }
  .lc-menu-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); transform: translateX(4px); }
  .lc-menu-btn span { opacity: 0.5; font-size: 18px; }

  /* Reset Button */
  .lc-reset-container { margin-top: auto; }
  .lc-menu-btn.danger { 
    color: #ff6b6b; border: 1px solid rgba(255,107,107,0.3); background: rgba(255,107,107,0.05); 
    justify-content: center; text-align: center; font-weight: 600;
  }
  .lc-menu-btn.danger:hover { 
    color: #ff6b6b; background: rgba(255,107,107,0.15); border-color: rgba(255,107,107,0.6);
  }
  .lc-menu-btn.danger .lc-warn-text { display: none; font-size: 13px; font-weight: bold; }
  .lc-menu-btn.danger:hover .lc-def-text { display: none; }
  .lc-menu-btn.danger:hover .lc-warn-text { display: inline; }

  /* Headers */
  .lc-page-header { 
    display: flex; align-items: center; margin-bottom: 15px; 
    padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .lc-back-btn {
    background: none; border: none; color: #ffa116; cursor: pointer; 
    font-size: 14px; font-weight: 700; padding: 0 15px 0 0; display: flex; align-items: center;
    transition: 0.2s; white-space: nowrap;
  }
  .lc-back-btn:hover { color: #fff; transform: translateX(-2px); }
  .lc-page-title { font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Priority Grid */
  .lc-grid { display: grid; grid-template-columns: 1fr; gap: 8px; overflow-y: auto; padding-right: 4px; flex: 1; margin-bottom: 15px; }
  .lc-item {
    background: rgba(255,255,255,0.04); padding: 12px 14px; border-radius: 8px;
    border: 1px solid transparent; color: #ccc; font-size: 13px;
    cursor: pointer; display: flex; justify-content: space-between; align-items: center;
    transition: 0.2s; user-select: none;
  }
  .lc-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1); }
  .lc-item.selected { background: rgba(255, 161, 22, 0.15); border-color: #ffa116; color: #fff; }
  .lc-badge { 
    background: rgba(0,0,0,0.5); color: #777; font-size: 11px; 
    padding: 2px 8px; border-radius: 12px; font-weight: 600; 
  }
  .lc-item.selected .lc-badge { background: #ffa116; color: #000; }

  /* Buttons */
  .lc-actions { margin-top: auto; display: flex; gap: 10px; }
  .lc-act-btn {
    flex: 1; padding: 14px; border-radius: 10px; border: none; 
    font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s;
  }
  .lc-btn-primary { background: #ffa116; color: #000; }
  .lc-btn-primary:hover { background: #ffb84d; box-shadow: 0 0 15px rgba(255, 161, 22, 0.4); transform: translateY(-1px); }
  
  .lc-btn-sec { background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid rgba(255,255,255,0.08); }
  .lc-btn-sec:hover { background: rgba(255,255,255,0.1); color: #fff; }
`;

function injectStyles() {
  if (document.getElementById("lt-styles")) return;
  const s = document.createElement("style");
  s.id = "lt-styles";
  s.innerText = STYLES;
  document.head.appendChild(s);
}

/* ================= ICONS ================= */
const ICONS = {
  play: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`,
  settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.04.17 0 .36.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.04-.17 0-.36-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path></svg>`,
  maximize: `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`,
  back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>`
};

/* ================= UI BUILDER ================= */

function createUI(videoId, title, mode) {
  if (document.getElementById("lc-circle")) return;
  injectStyles();

  // Initial State: Tucked in bottom right
  const CIRCLE = 64, PAD = 10;
  let panelW = 420, panelH = 340;
  let cx = window.innerWidth - CIRCLE - PAD, cy = window.innerHeight - CIRCLE - PAD;
  let px = cx - panelW + CIRCLE, py = cy - panelH;
  let isMax = false, prevW = panelW, prevH = panelH, prevX = px, prevY = py;

  // DOM
  const circle = document.createElement("div");
  circle.id = "lc-circle"; 
  circle.innerHTML = `<span>LT</span>${ICONS.play}`;

  const panel = document.createElement("div");
  panel.id = "lc-panel";
  panel.style.width = panelW + "px"; panel.style.height = panelH + "px";
  panel.style.left = px + "px"; panel.style.top = py + "px";

  // Content
  const ytSrc = mode === "video" ? `https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1` : "";
  let contentHTML = "";
  
  // No Video HTML - Centered & Bold
  const noVidHTML = `
      <div style="height:100%;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#aaa;text-align:center;padding:20px;">
        <div style="font-size:26px;margin-bottom:10px;opacity:0.5;">📹</div>
        <div style="font-size:13px;font-weight:600;opacity:0.9;margin-top:4px;">This may be a new or recent contest problem,</div>
        <div style="font-size:13px;font-weight:600;opacity:0.9;">or an older problem without a proper solution video.</div>
        <div style="font-size:12px;font-weight:500;opacity:0.7;margin-top:8px;">The video will appear once a good solution is found.</div>
      </div>`;

  if (mode === "video") {
    contentHTML = `<iframe id="lc-frame" src="${ytSrc}" allowfullscreen></iframe>`;
  } else {
    contentHTML = noVidHTML;
  }

  // HTML
  panel.innerHTML = `
    <div id="lc-bar">
      <div id="lc-title">${title}</div>
      <div class="lc-ctrls">
        <button id="btn-set" class="lc-icon-btn" title="Settings">${ICONS.settings}</button>
        <button id="btn-max" class="lc-icon-btn" title="Maximize">${ICONS.maximize}</button>
        <button id="btn-close" class="lc-icon-btn" title="Close">${ICONS.close}</button>
      </div>
    </div>
    
    <div id="lc-content">${contentHTML}</div>

    <div id="lc-settings-layer">
      
      <div id="page-main" class="lc-page active">
        <div class="lc-page-header">
          <button class="lc-back-btn" id="main-back">← Back to Video</button>
          <div class="lc-page-title">Settings</div>
        </div>
        
        <div class="lc-menu-btn" id="nav-priority">
          <div>
            <div style="color:#fff;">Change Priority</div>
            <div style="font-size:11px;color:#888;">Order channels to search first</div>
          </div>
          <span>›</span>
        </div>

        <div class="lc-menu-btn" id="nav-check">
          <div>
            <div style="color:#fff;">Check for New Videos</div>
            <div style="font-size:11px;color:#888;">Clear cache & refresh search</div>
          </div>
          <span>↻</span>
        </div>

        <div class="lc-reset-container">
          <div class="lc-menu-btn danger" id="nav-reset">
            <span class="lc-def-text">Factory Reset</span>
            <span class="lc-warn-text">⚠ Hard Reset (Clears All Data)</span>
          </div>
        </div>
      </div>

      <div id="page-priority" class="lc-page">
        <div class="lc-page-header">
          <button class="lc-back-btn" id="back-to-main">← Back</button>
          <div class="lc-page-title">Select Priority</div>
        </div>
        
        <div id="lc-grid" class="lc-grid"></div>

        <div class="lc-actions">
          <button id="act-clear" class="lc-act-btn lc-btn-sec">Clear Selection</button>
          <button id="act-save" class="lc-act-btn lc-btn-primary">Save & Apply</button>
        </div>
      </div>

    </div>
  `;

  document.body.append(circle, panel);

  // --- RESPONSIVE POSITIONS ---
  const refreshPos = () => {
    const maxWidth = window.innerWidth - 20;
    const maxHeight = window.innerHeight - 20;
    
    if (panelW > maxWidth) panelW = maxWidth;
    if (panelH > maxHeight) panelH = maxHeight;

    cx = Math.max(0, Math.min(cx, window.innerWidth - CIRCLE));
    cy = Math.max(0, Math.min(cy, window.innerHeight - CIRCLE));
    
    px = Math.max(0, Math.min(px, window.innerWidth - panelW));
    py = Math.max(0, Math.min(py, window.innerHeight - panelH));

    circle.style.left = cx + "px"; circle.style.top = cy + "px";
    panel.style.left = px + "px"; panel.style.top = py + "px";
    panel.style.width = panelW + "px"; panel.style.height = panelH + "px";
  };
  refreshPos();
  window.addEventListener("resize", refreshPos);

  // --- DRAGGING LOGIC (FIXED) ---
  panel.querySelector("#lc-bar").onmousedown = e => {
    if(e.target.closest("button")) return;
    let sx = e.clientX, sy = e.clientY, ox = px, oy = py;
    
    function onMove(e2) { px = ox + (e2.clientX-sx); py = oy + (e2.clientY-sy); refreshPos(); }
    function onUp() { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); }
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  };

  circle.onmousedown = e => {
    let sx = e.clientX, sy = e.clientY, ox = cx, oy = cy, moved = false;
    circle.classList.add("lc-dragging");

    function onMove(e2) {
      if(Math.abs(e2.clientX-sx)>4) moved=true;
      cx = ox + (e2.clientX-sx); cy = oy + (e2.clientY-sy); 
      circle.style.left = cx + "px"; circle.style.top = cy + "px"; 
    }
    
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      
      circle.classList.remove("lc-dragging");
      if(!moved) { 
        circle.style.display="none"; panel.style.display="flex"; 
        refreshPos();
        const f = document.getElementById("lc-frame");
        if(f && ytSrc) f.src = ytSrc; 
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // --- Header Actions ---
  document.getElementById("btn-close").onclick = () => {
    const f = document.getElementById("lc-frame");
    if(f) { f.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); } 
    panel.style.display = "none"; circle.style.display = "flex";
  };

  document.getElementById("btn-max").onclick = () => {
    if(!isMax) {
      prevW=panelW; prevH=panelH; prevX=px; prevY=py;
      panelW=window.innerWidth*0.9; panelH=window.innerHeight*0.9;
      px=(window.innerWidth-panelW)/2; py=(window.innerHeight-panelH)/2;
      isMax=true;
    } else {
      panelW=prevW; panelH=prevH; px=prevX; py=prevY;
      isMax=false;
    }
    refreshPos();
  };

  // --- SETTINGS LOGIC ---
  const settingsLayer = document.getElementById("lc-settings-layer");
  let currentOrder = [];

  function showPage(pageId) {
    document.querySelectorAll(".lc-page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
  }

  document.getElementById("btn-set").onclick = () => {
    if (settingsLayer.style.display === "flex") {
      settingsLayer.style.display = "none";
    } else {
      if(!isMax){
        prevW=panelW; prevH=panelH; prevX=px; prevY=py;
        panelW = Math.min(500, window.innerWidth - 40);
        panelH = Math.min(450, window.innerHeight - 40);
        refreshPos();
      }
      settingsLayer.style.display = "flex";
      showPage("page-main");
    }
  };

  document.getElementById("main-back").onclick = () => {
    settingsLayer.style.display = "none";
  };

  document.getElementById("nav-priority").onclick = () => {
    const s = getSettings();
    let tempChannels = s.channels.filter(c => DEFAULT_CHANNELS.some(d => d.id === c.id));
    DEFAULT_CHANNELS.forEach(d => {
        if (!tempChannels.some(t => t.id === d.id)) tempChannels.push(d);
    });
    
    currentOrder = tempChannels.map(c => c.id);
    renderGrid();
    showPage("page-priority");
  };

  document.getElementById("nav-check").onclick = () => {
    if(confirm("Refresh cache to check for new videos?")) {
      localStorage.removeItem(CACHE_KEY);
      location.reload();
    }
  };

  document.getElementById("nav-reset").onclick = () => {
    if(confirm("Are you sure you want to hard reset (clear all data)?")) {
      localStorage.clear();
      location.reload();
    }
  };

  document.getElementById("back-to-main").onclick = () => showPage("page-main");

  // Priority Grid
  const grid = document.getElementById("lc-grid");
  function renderGrid() {
    grid.innerHTML = "";
    DEFAULT_CHANNELS.forEach(ch => {
      const idx = currentOrder.indexOf(ch.id);
      const isSelected = idx !== -1;
      const el = document.createElement("div");
      el.className = `lc-item ${isSelected ? 'selected' : ''}`;
      el.innerHTML = `<span>${ch.name}</span><span class="lc-badge">${isSelected ? '#'+(idx+1) : '+'}</span>`;
      el.onclick = () => {
        if(idx === -1) currentOrder.push(ch.id);
        else currentOrder.splice(idx, 1);
        renderGrid();
      };
      grid.appendChild(el);
    });
  }

  // Clear & Save
  document.getElementById("act-clear").onclick = () => {
    currentOrder = [];
    renderGrid();
  };

  document.getElementById("act-save").onclick = () => {
    const newChannels = currentOrder.map(id => DEFAULT_CHANNELS.find(c => c.id === id));
    DEFAULT_CHANNELS.forEach(c => { 
        if(!currentOrder.includes(c.id)) newChannels.push(c); 
    });
    
    saveSettings({ channels: newChannels });
    localStorage.removeItem(CACHE_KEY); 
    location.reload();
  };
}

/* ================= MAIN ================= */

async function main() {
  const slug = getSlugFromUrl();
  if (!slug) return;
  currentSlug = slug;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: `query($s:String!){question(titleSlug:$s){title questionFrontendId}}`, variables: { s: slug } })
  });
  const { questionFrontendId: lcNo, title } = (await res.json()).data.question;

  // Re-define No Video HTML here to ensure main() uses the latest style
  const noVidHTML = `
    <div style="height:100%;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#aaa;text-align:center;padding:20px;">
      <div style="font-size:26px;margin-bottom:10px;opacity:0.5;">📹</div>
      <div style="font-size:13px;font-weight:600;opacity:0.9;margin-top:4px;">This may be a new or recent contest problem,</div>
      <div style="font-size:13px;font-weight:600;opacity:0.9;">or an older problem without a proper solution video.</div>
      <div style="font-size:12px;font-weight:500;opacity:0.7;margin-top:8px;">The video will appear once a good solution is found.</div>
    </div>`;

  const cache = getCache();
  if (cache[lcNo]) {
    createUI(cache[lcNo].videoId, cache[lcNo].title, "video");
    return;
  }

  createUI(null, title, "loading");

  const settings = getSettings();
  const pattern = new RegExp(`(?:leetcode|lc|problem|q)[\\s.:|-]*${lcNo}(?!\\d)`, "i");
  
  let fallback = null; 

  for (const ch of settings.channels) {
    const yt = await searchLC(lcNo, ch.id);
    if (!yt?.items) continue;
    
    // 1. Strict Regex Match
    const strict = yt.items.find(v => pattern.test(v.snippet.title));
    if (strict) {
      cache[lcNo] = { videoId: strict.id.videoId, title: strict.snippet.title };
      setCache(cache);
      const f = document.getElementById("lc-frame");
      if(f) f.src = `https://www.youtube.com/embed/${strict.id.videoId}?autoplay=0&enablejsapi=1`;
      else document.getElementById("lc-content").innerHTML = `<iframe id="lc-frame" src="https://www.youtube.com/embed/${strict.id.videoId}?autoplay=0&enablejsapi=1" allowfullscreen></iframe>`;
      return;
    }

    // 2. Fuzzy/Backup Match
    if (!fallback) {
       if (yt.items.some(v => v.snippet.title.includes(lcNo))) {
           fallback = yt.items.find(v => v.snippet.title.includes(lcNo));
       }
    }
  }

  // Use fallback if strict match failed
  if (fallback) {
      cache[lcNo] = { videoId: fallback.id.videoId, title: fallback.snippet.title };
      setCache(cache);
      const f = document.getElementById("lc-frame");
      if(f) f.src = `https://www.youtube.com/embed/${fallback.id.videoId}?autoplay=0&enablejsapi=1`;
      else document.getElementById("lc-content").innerHTML = `<iframe id="lc-frame" src="https://www.youtube.com/embed/${fallback.id.videoId}?autoplay=0&enablejsapi=1" allowfullscreen></iframe>`;
      return;
  }
  
  document.getElementById("lc-content").innerHTML = noVidHTML;
}

async function searchLC(number, channelId) {
  const q = encodeURIComponent(`Leetcode ${number}`);
  while (keyIndex < API_KEYS.length) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${q}&channelId=${channelId}&key=${getKey()}`);
      const json = await res.json();
      if (json?.error) {
        if (["quotaExceeded", "dailyLimitExceeded"].includes(json.error.errors?.[0]?.reason)) { rotateKey(); continue; }
        return { fatal: true };
      }
      return json;
    } catch { rotateKey(); }
  }
}

// FIXED: Smart Interval - Checks SLUG not URL
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    
    // Only reset if the problem slug changes (avoid blinking on description/editorial tabs)
    const newSlug = getSlugFromUrl();
    if (newSlug && newSlug !== currentSlug) {
      document.getElementById("lc-circle")?.remove();
      document.getElementById("lc-panel")?.remove();
      currentSlug = null; // Reset
      setTimeout(main, 1500);
    }
  }
}, 1000);

setTimeout(main, 2000);