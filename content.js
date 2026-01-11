console.log("MIK LeetCode Loaded");

const API_KEY = "AIzaSyCkci-3ZXY1EwT-OzrMqyPeJg9wLREN83w";
const CHANNEL_ID = "UCaw58edcO3ZqMw76Bvs0kGQ";

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
        query getQuestion($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            title
          }
        }
      `,
      variables: { titleSlug: slug }
    })
  });
  const json = await res.json();
  return json.data.question;
}

// ------------------ YouTube ------------------
async function fetchVideo(title) {
  const q = encodeURIComponent(title);
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${q}&channelId=${CHANNEL_ID}&key=${API_KEY}`
  );
  return res.json();
}

// ------------------ TITLE MATCHING ------------------
function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[0-9]/g, "")        // remove all numbers
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleScore(a, b) {
  const A = new Set(normalize(a).split(" "));
  const B = new Set(normalize(b).split(" "));
  let common = 0;
  A.forEach(w => B.has(w) && common++);
  return common / Math.max(A.size, 1);
}

// ------------------ UI ------------------
function showVideo(videoId, title) {
  if (document.getElementById("lc-circle")) return;

  const PAD = 16;
  const CIRCLE = 56;
  const MIN_W = 420;
  const MIN_H = 260;

  let panelW = MIN_W;
  let panelH = MIN_H;
  let isMax = false;

  let cx = window.innerWidth - CIRCLE - PAD;
  let cy = window.innerHeight - CIRCLE - PAD;

  let px = 0, py = 0;
  const hasVideo = !!videoId;

  const circle = document.createElement("div");
  circle.id = "lc-circle";
  circle.style = `
    position:fixed;
    width:${CIRCLE}px;
    height:${CIRCLE}px;
    background:#0b0b0b;
    border:1px solid #333;
    border-radius:50%;
    color:white;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:14px;
    cursor:grab;
    z-index:999999;
  `;
  circle.innerText = "MIK▶";

  const panel = document.createElement("div");
  panel.id = "lc-panel";
  panel.style = `
    position:fixed;
    background:#0b0b0b;
    color:white;
    border:1px solid #333;
    border-radius:10px;
    padding:12px;
    display:none;
    z-index:999999;
    box-sizing:border-box;
  `;

  panel.innerHTML = `
    <div id="lc-bar" style="height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-bottom:1px solid #333;cursor:grab;">
      <span style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</span>
      <div style="display:flex;gap:12px;">
        ${hasVideo ? `<span id="lc-max" style="cursor:pointer;">⤢</span>` : ``}
        <span id="lc-close" style="cursor:pointer;">✕</span>
      </div>
    </div>
    <div style="padding-top:10px;">
      ${
        hasVideo
          ? `<iframe id="lc-frame"
              src="https://www.youtube.com/embed/${videoId}"
              style="width:100%;border:none;border-radius:8px;"
              allowfullscreen></iframe>`
          : `<div style="height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#aaa;border:1px dashed #333;border-radius:8px;">
                <div style="font-size:28px;">🎬</div>
                <div>Video not available</div>
                <div style="font-size:12px;">Coming soon</div>
             </div>`
      }
    </div>
  `;

  document.body.appendChild(circle);
  document.body.appendChild(panel);

  function clampCircle() {
    cx = Math.max(0, Math.min(cx, window.innerWidth - CIRCLE));
    cy = Math.max(0, Math.min(cy, window.innerHeight - CIRCLE));
  }

  function clampPanel() {
    px = Math.max(PAD, Math.min(px, window.innerWidth - panelW - PAD));
    py = Math.max(PAD, Math.min(py, window.innerHeight - panelH - PAD));
  }

  function updateCircle() {
    clampCircle();
    circle.style.left = cx + "px";
    circle.style.top = cy + "px";
  }

  function updatePanel() {
    clampPanel();
    panel.style.left = px + "px";
    panel.style.top = py + "px";
    panel.style.width = panelW + "px";
    panel.style.height = panelH + "px";
    const frame = document.getElementById("lc-frame");
    if (frame && hasVideo) frame.style.height = panelH - 70 + "px";
  }

  updateCircle();

  let moved = false;
  circle.onmousedown = e => {
    let sx = e.clientX, sy = e.clientY;
    let ox = cx, oy = cy;
    moved = false;

    document.onmousemove = e2 => {
      const dx = e2.clientX - sx;
      const dy = e2.clientY - sy;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      cx = ox + dx;
      cy = oy + dy;
      updateCircle();
    };

    document.onmouseup = () => {
      document.onmousemove = null;
      if (!moved) {
        px = Math.min(cx, window.innerWidth - panelW - PAD);
        py = Math.min(cy, window.innerHeight - panelH - PAD);
        panel.style.display = "block";
        circle.style.display = "none";
        updatePanel();
      }
    };
  };

  panel.querySelector("#lc-close").onclick = () => {
    panel.style.display = "none";
    circle.style.display = "flex";
    const frame = document.getElementById("lc-frame");
    if (frame && frame.tagName === "IFRAME") frame.src = frame.src;
    updateCircle();
  };

  if (hasVideo) {
    panel.querySelector("#lc-max").onclick = () => {
      if (!isMax) {
        panelW = window.innerWidth * 0.9;
        panelH = window.innerHeight * 0.9;
        px = (window.innerWidth - panelW) / 2;
        py = (window.innerHeight - panelH) / 2;
      } else {
        panelW = MIN_W;
        panelH = MIN_H;
        px = Math.min(cx, window.innerWidth - panelW - PAD);
        py = Math.min(cy, window.innerHeight - panelH - PAD);
      }
      isMax = !isMax;
      updatePanel();
    };
  }

  let sx, sy, ox, oy;
  panel.querySelector("#lc-bar").onmousedown = e => {
    sx = e.clientX; sy = e.clientY;
    ox = px; oy = py;
    document.onmousemove = e2 => {
      px = ox + (e2.clientX - sx);
      py = oy + (e2.clientY - sy);
      updatePanel();
    };
    document.onmouseup = () => document.onmousemove = null;
  };
}

// ------------------ MAIN ------------------
async function main() {
  const slug = getSlug();
  if (!slug) return;

  const problem = await getProblemFromLeetCode(slug);
  const yt = await fetchVideo(problem.title);

  const ptitle = problem.title.toLowerCase();

  const video = yt.items?.find(v => {
    const t = v.snippet.title.toLowerCase();
    if (t.includes("concept") || t.includes("qns") || t.includes("questions")) return false;
    return titleScore(ptitle, t) > 0.6;
  });

  showVideo(video?.id?.videoId || null, video?.snippet?.title || problem.title);
}

setTimeout(main, 2000);

let lastUrl = location.href;

setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;

    // Remove old UI
    document.getElementById("lc-circle")?.remove();
    document.getElementById("lc-panel")?.remove();

    // Load new problem
    setTimeout(main, 1500);
  }
}, 800);