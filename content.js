console.log("LeetTube Loaded");

/* ================= API POOL ================= */

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

let keyIndex = 0;
function getKey() {
  return API_KEYS[keyIndex];
}
function rotateKey() {
  keyIndex++;
}

/* ================= CHANNELS ================= */

const CHANNELS = [
  "UCaw58edcO3ZqMw76Bvs0kGQ",
  "UCl3tJFKsFrw2p_Wxf1YDSow",
  "UCuMF6SFnqxmwOAA_zygHMrA",
  "UCJskGeByzRRSvmOyZOz61ig",
  "UC_mYaQAE6-71rjSN6CeCA-g",
];

// ------------------ CACHE ------------------
const CACHE_KEY = "leetTubeCache";

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function setCache(c) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(c));
}

// ------------------ URL ------------------
function getSlug() {
  const parts = location.pathname.split("/");
  const i = parts.indexOf("problems");
  return i === -1 ? null : parts[i + 1];
}

// ------------------ LeetCode ------------------
async function getProblemFromLeetCode(slug) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query getQuestion($titleSlug:String!){
          question(titleSlug:$titleSlug){
            title
            questionFrontendId
          }
        }
      `,
      variables: { titleSlug: slug },
    }),
  });
  const json = await res.json();
  return json.data.question;
}

// ------------------ YouTube ------------------
async function searchLC(number, channelId) {
  const q = encodeURIComponent(`Leetcode ${number}`);
  while (keyIndex < API_KEYS.length) {
    const key = getKey();
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${q}&channelId=${channelId}&key=${key}`
      );
      const json = await res.json();
      if (json?.error) {
        const r = json.error.errors?.[0]?.reason;
        if (r === "quotaExceeded" || r === "dailyLimitExceeded") {
          rotateKey();
          continue;
        }
        return { fatal: true };
      }
      return json;
    } catch {
      rotateKey();
    }
  }
  return { quotaExhausted: true };
}

// ------------------ MATCH ------------------
function normalizeSeq(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
function orderedMatch(problemTitle, videoTitle) {
  const A = normalizeSeq(problemTitle),
    B = normalizeSeq(videoTitle);
  let i = 0;
  for (const w of B) {
    if (w === A[i]) i++;
    if (i === A.length) return true;
  }
  return false;
}

// ------------------ UI ------------------
function showVideo(videoId, title, mode) {
  if (document.getElementById("lc-circle")) return;

  const PAD = 16,
    CIRCLE = 56,
    MIN_W = 420,
    MIN_H = 260;
  let panelW = MIN_W,
    panelH = MIN_H,
    isMax = false;
  let cx = window.innerWidth - CIRCLE - PAD,
    cy = window.innerHeight - CIRCLE - PAD;
  let px = 0,
    py = 0;
  const hasVideo = mode === "video";

  const circle = document.createElement("div");
  circle.id = "lc-circle";
  circle.style = `position:fixed;width:${CIRCLE}px;height:${CIRCLE}px;background:#0b0b0b;border:1px solid #333;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:grab;z-index:999999`;
  circle.innerText = "LT▶";

  const panel = document.createElement("div");
  panel.id = "lc-panel";
  panel.style = `position:fixed;background:#0b0b0b;color:white;border:1px solid #333;border-radius:10px;padding:12px;display:none;z-index:999999;box-sizing:border-box`;

  let content = "";
  if (mode === "video")
    content = `<iframe id="lc-frame" src="https://www.youtube.com/embed/${videoId}" style="width:100%;border:none;border-radius:8px;" allowfullscreen></iframe>`;
  else if (mode === "coming")
    content = `
<div style="
  height:160px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  color:#aaa;
  text-align:center;
">
  <div style="font-size:22px;">📹</div>
  <div>No high-quality solution available</div>
  <div style="font-size:12px;opacity:0.7;margin-top:4px;">
    This may be a new or recent contest problem,
  </div>
  <div style="font-size:12px;opacity:0.7;">
    or an older problem without a proper solution video.
  </div>
  <div style="font-size:12px;opacity:0.7;margin-top:6px;">
    The video will appear once a good solution is found.
  </div>
</div>`;
  else
    content = `<div style="height:160px;display:flex;align-items:center;justify-content:center;color:#aaa;">⚠ Under Maintenance</div>`;

  panel.innerHTML = `<div id="lc-bar" style="height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-bottom:1px solid #333;cursor:grab;"><span>${title}</span><div style="display:flex;gap:12px;">${
    hasVideo ? `<span id="lc-max">⤢</span>` : ""
  }<span id="lc-close">✕</span></div></div><div style="padding-top:10px;">${content}</div>`;

  document.body.appendChild(circle);
  document.body.appendChild(panel);

  function updateCircle() {
    cx = Math.max(0, Math.min(cx, window.innerWidth - CIRCLE));
    cy = Math.max(0, Math.min(cy, window.innerHeight - CIRCLE));
    circle.style.left = cx + "px";
    circle.style.top = cy + "px";
  }
  function updatePanel() {
    px = Math.max(PAD, Math.min(px, window.innerWidth - panelW - PAD));
    py = Math.max(PAD, Math.min(py, window.innerHeight - panelH - PAD));
    panel.style.left = px + "px";
    panel.style.top = py + "px";
    panel.style.width = panelW + "px";
    panel.style.height = panelH + "px";
    if (hasVideo)
      document.getElementById("lc-frame").style.height = panelH - 70 + "px";
  }
  updateCircle();

  let moved = false;
  circle.onmousedown = (e) => {
    let sx = e.clientX,
      sy = e.clientY,
      ox = cx,
      oy = cy;
    moved = false;
    document.onmousemove = (e2) => {
      let dx = e2.clientX - sx,
        dy = e2.clientY - sy;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      cx = ox + dx;
      cy = oy + dy;
      updateCircle();
    };
    document.onmouseup = () => {
      document.onmousemove = null;
      if (!moved) {
        px = cx;
        py = cy;
        panel.style.display = "block";
        circle.style.display = "none";
        updatePanel();
      }
    };
  };
  panel.querySelector("#lc-close").onclick = () => {
    panel.style.display = "none";
    circle.style.display = "flex";
    if (hasVideo) {
      const f = document.getElementById("lc-frame");
      f.src = f.src;
    }
  };
}

// ------------------ MAIN ------------------
async function main() {
  const slug = getSlug();
  if (!slug) return;
  const problem = await getProblemFromLeetCode(slug);
  const lcNo = problem.questionFrontendId,
    title = problem.title;

  const cache = getCache();
  if (cache[lcNo]) {
    const c = cache[lcNo];
    showVideo(c.videoId || null, c.title || title, c.mode || "video");
    return;
  }

  const pattern = new RegExp(`leetcode[\\s-]+${lcNo}(?!\\d)`, "i");
  let quotaDead = false,
    fallback = null;

  for (const ch of CHANNELS) {
    const yt = await searchLC(lcNo, ch);
    if (yt?.quotaExhausted) {
      quotaDead = true;
      break;
    }
    if (!yt || !Array.isArray(yt.items)) continue;

    for (const v of yt.items) {
      const t = v.snippet.title;
      if (pattern.test(t)) {
        cache[lcNo] = { videoId: v.id.videoId, title: t, mode: "video" };
        setCache(cache);
        showVideo(v.id.videoId, t, "video");
        return;
      }
      if (orderedMatch(title, t)) fallback = v;
    }
  }

  if (fallback) {
    cache[lcNo] = {
      videoId: fallback.id.videoId,
      title: fallback.snippet.title,
      mode: "video",
    };
    setCache(cache);
    showVideo(fallback.id.videoId, fallback.snippet.title, "video");
    return;
  }

  cache[lcNo] = { mode: quotaDead ? "maintenance" : "coming", title };
  setCache(cache);
  showVideo(null, title, quotaDead ? "maintenance" : "coming");
}

setTimeout(main, 2000);

let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    document.getElementById("lc-circle")?.remove();
    document.getElementById("lc-panel")?.remove();
    setTimeout(main, 1500);
  }
}, 800);
