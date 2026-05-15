const { chromium } = require('playwright'); 
const fs = require('fs'); 
const os = require('os'); 
const path = require('path'); 

const target = 'http://127.0.0.1:5177/'; 
const outDir = path.join(os.tmpdir(), 'starfall-mobile-audit-20260514'); 
fs.mkdirSync(outDir, { recursive: true }); 

function intersect(a, b) { 
  if (!a || !b || !a.visible || !b.visible) return false; 
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom); 
} 

async function inspect(page, label) { 
  const metrics = await page.evaluate(() => { 
    const pack = (selector) => { 
      const el = document.querySelector(selector); 
      if (!el) return null; 
      const r = el.getBoundingClientRect(); 
      const cs = window.getComputedStyle(el); 
      return { 
        selector, 
        display: cs.display, 
        visibility: cs.visibility, 
        opacity: cs.opacity, 
        pointerEvents: cs.pointerEvents, 
        top: Math.round(r.top), 
        left: Math.round(r.left), 
        right: Math.round(r.right), 
        bottom: Math.round(r.bottom), 
        width: Math.round(r.width), 
        height: Math.round(r.height), 
        visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 
      }; 
    }; 
    
    const buttons = Array.from(document.querySelectorAll('.hud-actions button, .leaderboard-share-row button, .kasi-comm-toggle, #mobileFireButton')).map((el) => { 
      const r = el.getBoundingClientRect(); 
      const cs = window.getComputedStyle(el); 
      return { 
        id: el.id || el.dataset.share || el.textContent.trim(), 
        width: Math.round(r.width), 
        height: Math.round(r.height), 
        display: cs.display, 
        visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 
      }; 
    }); 
    
    return { 
      viewport: { width: window.innerWidth, height: window.innerHeight }, 
      title: document.title, 
      bodyOverflow: window.getComputedStyle(document.body).overflow, 
      bodyOverscroll: window.getComputedStyle(document.body).overscrollBehavior, 
      docScrollWidth: document.documentElement.scrollWidth, 
      docScrollHeight: document.documentElement.scrollHeight, 
      bodyScrollWidth: document.body.scrollWidth, 
      bodyScrollHeight: document.body.scrollHeight, 
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1, 
      verticalOverflow: document.documentElement.scrollHeight > window.innerHeight + 1 || document.body.scrollHeight > window.innerHeight + 1, 
      canvas: pack('#glCanvas'), 
      hud: pack('.hud'), 
      leaderboard: pack('.leaderboard-panel'), 
      ecosystem: pack('.kopano-ecosystem'), 
      ecosystemCopy: pack('.kopano-ecosystem-copy'), 
      ecosystemLinks: pack('.kopano-ecosystem-links'), 
      status: pack('.status-panel'), 
      fire: pack('#mobileFireButton'), 
      kasi: pack('.kasi-comm-toggle'), 
      shareButtons: Array.from(document.querySelectorAll('.leaderboard-share-row button')).map((el) => { 
        const r = el.getBoundingClientRect(); 
        const cs = window.getComputedStyle(el); 
        return { name: el.textContent.trim(), width: Math.round(r.width), height: Math.round(r.height), display: cs.display }; 
      }), 
      buttons 
    }; 
  }); 
  
  metrics.overlap = { 
    leaderboardFire: intersect(metrics.leaderboard, metrics.fire), 
    ecosystemFire: intersect(metrics.ecosystem, metrics.fire), 
    ecosystemLeaderboard: intersect(metrics.ecosystem, metrics.leaderboard), 
    statusFire: intersect(metrics.status, metrics.fire), 
    statusLeaderboard: intersect(metrics.status, metrics.leaderboard) 
  }; 
  
  const screenshot = path.join(outDir, `${label}.png`); 
  await page.screenshot({ path: screenshot, fullPage: false }); 
  return { label, screenshot, metrics }; 
} 

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 873 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2.75
  });
  
  const page = await context.newPage();
  console.log(`Navigating to ${target}`);
  try {
    await page.goto(target, { waitUntil: 'networkidle', timeout: 15000 });
    const result = await inspect(page, 'redmi_13_audit');
    console.log(JSON.stringify(result, null, 2));
    fs.writeFileSync(path.join(outDir, 'audit_results.json'), JSON.stringify(result, null, 2));
    console.log(`Audit saved to ${outDir}`);
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await browser.close();
  }
})();
