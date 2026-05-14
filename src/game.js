(() => {
  "use strict";

  const canvas = document.getElementById("glCanvas");
  const gl = canvas.getContext("webgl", { antialias: true });

  const hud = {
    shell: document.querySelector(".shell"),
    score: document.getElementById("scoreValue"),
    hull: document.getElementById("hullValue"),
    cores: document.getElementById("coreValue"),
    dash: document.getElementById("dashValue"),
    speed: document.getElementById("speedValue"),
    buff: document.getElementById("buffValue"),
    fps: document.getElementById("fpsValue"),
    eventToast: document.getElementById("eventToast"),
    statusPanel: document.getElementById("statusPanel"),
    statusTitle: document.getElementById("statusTitle"),
    statusText: document.getElementById("statusText"),
    startButton: document.getElementById("startButton"),
    pauseButton: document.getElementById("pauseButton"),
    resetButton: document.getElementById("resetButton"),
    pilotBadge: document.getElementById("pilotBadge"),
    signInButton: document.getElementById("signInButton"),
    leaderboardList: document.getElementById("leaderboardList"),
    leaderboardStatus: document.getElementById("leaderboardStatus"),
    refreshLeaderboardButton: document.getElementById("refreshLeaderboardButton"),
    shareWhatsappButton: document.getElementById("shareWhatsappButton"),
    accountModal: document.getElementById("accountModal"),
    accountSummary: document.getElementById("accountSummary"),
    callsignInput: document.getElementById("callsignInput"),
    accessCodeInput: document.getElementById("accessCodeInput"),
    savePilotButton: document.getElementById("savePilotButton"),
    guestPilotButton: document.getElementById("guestPilotButton"),
    resetPilotButton: document.getElementById("resetPilotButton"),
    closeAccountButton: document.getElementById("closeAccountButton"),
    accountStatus: document.getElementById("accountStatus"),
    kasiComm: document.getElementById("kasiComm"),
    kasiCommToggle: document.getElementById("kasiCommToggle"),
    kasiCommList: document.getElementById("kasiCommList"),
    kasiCommStatus: document.getElementById("kasiCommStatus"),
    kasiCommForm: document.getElementById("kasiCommForm"),
    kasiCommInput: document.getElementById("kasiCommInput"),
    kasiCommSend: document.getElementById("kasiCommSend"),
    submitIdeaButton: document.getElementById("submitIdeaButton"),
    exportDiagnosticsButton: document.getElementById("exportDiagnosticsButton"),
    shareRow: document.getElementById("shareRow"),
    onboardingModal: document.getElementById("onboardingModal"),
    onboardingAck: document.getElementById("onboardingAck"),
    onboardingContinueButton: document.getElementById("onboardingContinueButton"),
    mobileFireButton: document.getElementById("mobileFireButton"),
    mobileLockdown: document.getElementById("mobileLockdown"),
    opsConsoleButton: document.getElementById("opsConsoleButton"),
    opsConsole: document.getElementById("opsConsole"),
    opsConsoleClose: document.getElementById("opsConsoleClose"),
    opsLog: document.getElementById("opsLog"),
    inviteFriendsButton: document.getElementById("inviteFriendsButton"),
    pilotPaletteSelect: document.getElementById("pilotPaletteSelect"),
    reviveModal: document.getElementById("reviveModal"),
    reviveArena: document.getElementById("reviveArena"),
    reviveTimer: document.getElementById("reviveTimer"),
    reviveProgress: document.getElementById("reviveProgress"),
    reviveSkipButton: document.getElementById("reviveSkipButton"),
    kasiCommEmojiBar: document.getElementById("kasiCommEmojiBar")
  };

  // Mobile: playable by default (touch + FIRE). Append ?strictMobile=1 to show the audit lockdown wall again.
  const MOBILE_LOCKDOWN =
    typeof window !== "undefined" &&
    window.location &&
    new URLSearchParams(window.location.search).get("strictMobile") === "1";
  const DIAG_PARAM = (typeof window !== "undefined" && window.location && window.location.search)
    ? new URLSearchParams(window.location.search).get("diag")
    : null;
  const DIAG_ENABLED = DIAG_PARAM === "1";

  if (!gl) {
    hud.statusTitle.textContent = "WebGL unavailable";
    hud.statusText.textContent = "Open this game in a browser with WebGL support enabled.";
    return;
  }

  canvas.addEventListener("mousedown", (event) => {
    if (isAccountModalOpen() || isTypingTarget(event.target)) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    mouseFireHeld = true;
    canvas.focus();
    if (state.mode === "playing") {
      spawnPlayerBullet();
    } else if (state.mode === "ready" || state.mode === "gameover") {
      startGame();
    }
  });
  window.addEventListener("mouseup", () => {
    mouseFireHeld = false;
  });
  window.addEventListener("pointerdown", () => canvas.focus());

  function syncShellPlayState() {
    const playing = state.mode === "playing";
    hud.shell.classList.toggle("is-playing", playing);
    hud.shell.classList.toggle("is-paused", state.mode === "paused");
    hud.shell.classList.toggle("is-ready", state.mode === "ready" || state.mode === "gameover");
  }

  function applyBuff(kind) {
    const def = BUFF_DEFS[kind];
    if (!def) {
      return;
    }
    player.buffKind = kind;
    player.buffTimer = def.duration;
    if (kind === "overcharge") {
      player.fireBoostTimer = Math.max(player.fireBoostTimer || 0, def.duration);
    }
    if (kind === "aegis") {
      player.aegisHits = 1;
    }
    setEventMessage(def.label);
    logEvent("buff_collected", { kind });
  }

  function tickBuffs(dt) {
    if (player.buffTimer > 0) {
      player.buffTimer = Math.max(0, player.buffTimer - dt);
      if (player.buffTimer <= 0) {
        player.buffKind = "";
        player.aegisHits = 0;
      }
    }
    if (player.buffKind !== "aegis") {
      player.aegisHits = 0;
    }
  }

  function activeBuffLabel() {
    if (!player.buffKind || player.buffTimer <= 0) {
      return player.fireBoostTimer > 0 ? "Rapid" : "—";
    }
    const def = BUFF_DEFS[player.buffKind];
    return def ? `${def.label} ${player.buffTimer.toFixed(0)}s` : "—";
  }

  function updateSpeedVisuals(multiplier) {
    const palette = document.body.dataset.pilotPalette || "default";
    const paletteHue = palette === "blossom" ? 318 : palette === "ember" ? 28 : palette === "mono" ? 210 : 188;
    const t = Math.max(0, Math.min(1, (multiplier - 1) / 3.2));
    const hue = Math.round(paletteHue - t * (palette === "mono" ? 24 : 148));
    const sat = Math.round((palette === "mono" ? 8 : 42) + t * 38);
    const light = Math.round(12 + t * 10);
    hud.shell.style.setProperty("--speed-hue", String(hue));
    hud.shell.style.setProperty("--speed-strength", t.toFixed(3));
    hud.shell.style.setProperty("--speed-accent", `hsl(${hue} ${sat}% ${light}%)`);
  }

  function applyPilotPalette(palette) {
    const valid = PILOT_PALETTES.includes(palette) ? palette : "default";
    document.body.dataset.pilotPalette = valid;
    if (hud.pilotPaletteSelect) {
      hud.pilotPaletteSelect.value = valid;
    }
    updateSpeedVisuals(state.lastSpeedMultiplier || 1);
  }


  const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aTexCoord;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    uniform vec2 uUvScale;

    varying vec3 vNormal;
    varying vec2 vTexCoord;
    varying float vDepth;

    void main() {
      vec4 worldPosition = uModel * vec4(aPosition, 1.0);
      gl_Position = uProjection * uView * worldPosition;
      vNormal = mat3(uModel) * aNormal;
      vTexCoord = aTexCoord * uUvScale;
      vDepth = clamp((-worldPosition.z - 4.0) / 70.0, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform vec4 uColor;
    uniform float uTextureMix;
    uniform float uPulse;
    uniform vec3 uLightDirection;
    uniform float uAmbientLight;
    uniform float uDiffuseStrength;

    varying vec3 vNormal;
    varying vec2 vTexCoord;
    varying float vDepth;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDirection = normalize(uLightDirection);
      float diffuse = max(dot(normal, lightDirection), 0.0);
      float light = clamp(uAmbientLight + diffuse * uDiffuseStrength, 0.0, 1.35);
      vec4 textureColor = texture2D(uTexture, vTexCoord);
      vec4 base = mix(uColor, uColor * textureColor, uTextureMix);
      vec3 fog = vec3(0.012, 0.016, 0.036);
      vec3 lit = mix(base.rgb * light, fog, vDepth * 0.62);
      gl_FragColor = vec4(lit + base.rgb * uPulse * 0.24, base.a);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  }

  function createProgram(vertexSource, fragmentSource) {
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(log);
    }
    return program;
  }

  const program = createProgram(vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

  const locations = {
    position: gl.getAttribLocation(program, "aPosition"),
    normal: gl.getAttribLocation(program, "aNormal"),
    texCoord: gl.getAttribLocation(program, "aTexCoord"),
    model: gl.getUniformLocation(program, "uModel"),
    view: gl.getUniformLocation(program, "uView"),
    projection: gl.getUniformLocation(program, "uProjection"),
    color: gl.getUniformLocation(program, "uColor"),
    texture: gl.getUniformLocation(program, "uTexture"),
    textureMix: gl.getUniformLocation(program, "uTextureMix"),
    uvScale: gl.getUniformLocation(program, "uUvScale"),
    pulse: gl.getUniformLocation(program, "uPulse"),
    lightDirection: gl.getUniformLocation(program, "uLightDirection"),
    ambientLight: gl.getUniformLocation(program, "uAmbientLight"),
    diffuseStrength: gl.getUniformLocation(program, "uDiffuseStrength")
  };

  const BASE_FOV = Math.PI / 3.1;
  const DASH_FOV = Math.PI / 2.55;
  const DASH_DURATION = 0.34;
  const DASH_COOLDOWN = 1.45;
  const LIGHT_DIRECTION = new Float32Array([0.35, 0.9, 0.55]);
  const PROFILE_STORAGE_KEY = "starfallSalvagePilotProfile";
  const SCORES_STORAGE_KEY = "starfallSalvageLocalScores";
  const ONBOARDING_STORAGE_KEY = "starfallSalvageOnboardingComplete";
  const EVENTS_STORAGE_KEY = "starfallSalvageEventLog";
  const RUN_RECEIPTS_STORAGE_KEY = "starfallSalvageRunReceipts";
  const EVENTS_MAX = 200;
  const LEADERBOARD_LIMIT = 12;
  const CHAT_LIMIT = 20;
  const CHAT_POLL_INTERVAL_MS = 3000;
  const KOPANO_BOUNTY_EMAIL = "rkholofelo@kopanolabs.com";
  const PUBLIC_LIVE_URL = "https://starfallsalvage.kopanolabs.com";
  const PUBLIC_REPO_URL = "https://github.com/Kopano-Labs/starfall-salvage";
  const GAME_BUILD = "20260514-engage-swarm";
  const PILOT_PALETTES = ["default", "blossom", "ember", "mono"];
  const REVIVE_TIME_SECONDS = 8;
  const REVIVE_CORES_NEEDED = 3;
  const REVIVE_CORE_COUNT = 6;
  const SIM_LAW_DEFAULT = {
    schemaVersion: 1,
    lanes: { count: 16, playerBounds: { xMin: -3.8, xMax: 3.8, yMin: -2.15, yMax: 1.55 } },
    speedTiers: [
      { id: "cruise", multiplierMin: 1, multiplierMax: 1.99 },
      { id: "danger", multiplierMin: 2, multiplierMax: 99, dangerZone: true }
    ],
    sectors: [
      { id: 1, label: "Approach", speedMultiplierMin: 1, bossGate: false },
      { id: 2, label: "Breach", speedMultiplierMin: 2, bossGate: true },
      { id: 3, label: "Deep salvage", speedMultiplierMin: 4, bossGate: true },
      { id: 4, label: "Core drift", speedMultiplierMin: 6, bossGate: true }
    ],
    spawn: {
      intervalMin: 0.34,
      intervalMax: 0.88,
      difficultyTimeScale: 85,
      difficultyCap: 0.52,
      deciStepDifficulty: 0.035,
      dangerZoneDifficulty: 0.06,
      spawnZ: { hazard: -72, pickup: -73, boss: -78, rangeTarget: -74 },
      boss: { baseChance: 0.055, deciStepBonus: 0.012, highSpeedBonus: 0.05, highSpeedThreshold: 4, chanceCap: 0.22 }
    },
    obstacleClasses: [
      { id: "rangeTarget", type: "rangeTarget", minMultiplier: 1.12, rollMax: 0.05 },
      { id: "buffOrb", type: "buffOrb", minMultiplier: 1.05, rollMax: 0.072 },
      { id: "powerOrb", type: "powerOrb", minMultiplier: 1.05, rollMax: 0.13 },
      { id: "boss", type: "boss", spawnVia: "bossGate", requiresDangerZone: true },
      { id: "crystal", type: "crystal", crystalBiasBase: 0.66, crystalBiasDeciStep: 0.012, crystalBiasCap: 0.14 },
      { id: "debris", type: "debris", fallback: true }
    ],
    salvage: { scorePerSecond: 14, coreScoreFactor: 0.015 },
    tempest: { laneIndexFire: false, sectorClear: { enabled: false, usesPerSector: 1 } },
    renderBudget: {
      tiers: [
        { id: "low", maxDpr: 1.35, particleScale: 0.55, tunnelDecorScale: 0.65, rotateTopology: false },
        { id: "mid", maxDpr: 1.75, particleScale: 0.82, tunnelDecorScale: 0.88, rotateTopology: false },
        { id: "high", maxDpr: 2, particleScale: 1, tunnelDecorScale: 1, rotateTopology: true }
      ]
    }
  };
  const SIM = structuredClone(SIM_LAW_DEFAULT);
  let sparksMax = 200;
  let trailMax = 150;

  function applySimSchema(patch) {
    if (!patch || typeof patch !== "object") {
      return;
    }
    if (patch.lanes) {
      Object.assign(SIM.lanes, patch.lanes);
    }
    if (Array.isArray(patch.speedTiers)) {
      SIM.speedTiers = patch.speedTiers;
    }
    if (Array.isArray(patch.sectors)) {
      SIM.sectors = patch.sectors;
    }
    if (patch.spawn) {
      Object.assign(SIM.spawn, patch.spawn);
      if (patch.spawn.boss) {
        Object.assign(SIM.spawn.boss, patch.spawn.boss);
      }
      if (patch.spawn.spawnZ) {
        SIM.spawn.spawnZ = { ...SIM.spawn.spawnZ, ...patch.spawn.spawnZ };
      }
    }
    if (Array.isArray(patch.obstacleClasses)) {
      SIM.obstacleClasses = patch.obstacleClasses;
    }
    if (patch.salvage) {
      Object.assign(SIM.salvage, patch.salvage);
    }
    if (patch.tempest) {
      SIM.tempest = { ...SIM.tempest, ...patch.tempest };
    }
    if (patch.renderBudget && Array.isArray(patch.renderBudget.tiers)) {
      SIM.renderBudget.tiers = patch.renderBudget.tiers;
    }
    refreshRenderBudgetLimits();
    logEvent("sim_schema_applied", { schemaVersion: patch.schemaVersion || SIM.schemaVersion });
  }

  async function loadSimLaw() {
    try {
      const response = await fetch(`src/sim.schema.json?v=${encodeURIComponent(GAME_BUILD)}`);
      if (response.ok) {
        applySimSchema(await response.json());
      }
    } catch {
      refreshRenderBudgetLimits();
    }
  }

  function getRenderBudgetTier() {
    const dpr = window.devicePixelRatio || 1;
    const tiers = (SIM.renderBudget && SIM.renderBudget.tiers) || SIM_LAW_DEFAULT.renderBudget.tiers;
    let chosen = tiers[0];
    tiers.forEach((tier) => {
      if (dpr <= tier.maxDpr) {
        chosen = tier;
      }
    });
    return chosen || tiers[tiers.length - 1];
  }

  function refreshRenderBudgetLimits() {
    const tier = getRenderBudgetTier();
    const scale = tier.particleScale || 1;
    sparksMax = Math.max(80, Math.floor(200 * scale));
    trailMax = Math.max(60, Math.floor(150 * scale));
  }

  function getSectorForMultiplier(multiplier) {
    const sectors = SIM.sectors || [];
    let current = sectors[0] || { id: 1, label: "Approach", bossGate: false };
    sectors.forEach((sector) => {
      if (multiplier >= (sector.speedMultiplierMin || 1)) {
        current = sector;
      }
    });
    return current;
  }

  function nextSpawnInterval(deciSteps, speedMultiplier) {
    const spawn = SIM.spawn;
    const difficulty =
      clamp(state.time / (spawn.difficultyTimeScale || 85), 0, spawn.difficultyCap || 0.52) +
      deciSteps * (spawn.deciStepDifficulty || 0.035) +
      (speedMultiplier >= 2 ? (speedMultiplier - 2) * (spawn.dangerZoneDifficulty || 0.06) : 0);
    return randomRange(spawn.intervalMin || 0.34, (spawn.intervalMax || 0.88) - Math.min(0.42, difficulty));
  }

  function obstacleClassForRoll(roll, mult, dangerActive) {
    const classes = SIM.obstacleClasses || [];
    for (let i = 0; i < classes.length; i += 1) {
      const entry = classes[i];
      if (entry.fallback || entry.spawnVia === "bossGate") {
        continue;
      }
      if (entry.requiresDangerZone && !dangerActive) {
        continue;
      }
      if (entry.minMultiplier && mult < entry.minMultiplier) {
        continue;
      }
      if (roll < (entry.rollMax || 0)) {
        return entry;
      }
    }
    return classes.find((entry) => entry.fallback) || { type: "debris" };
  }

  function bossSpawnChance(mult, dangerActive) {
    if (!dangerActive) {
      return 0;
    }
    const boss = SIM.spawn.boss || {};
    const deciStepsSpawn = mult >= 1 ? Math.floor((mult - 1) * 10) : 0;
    return Math.min(
      boss.chanceCap || 0.22,
      (boss.baseChance || 0.055) +
        deciStepsSpawn * (boss.deciStepBonus || 0.012) +
        (mult >= (boss.highSpeedThreshold || 4) ? boss.highSpeedBonus || 0.05 : 0)
    );
  }

  const BUFF_DEFS = {
    overcharge: { duration: 6.5, label: "Overcharge", color: [1, 0.82, 0.22, 1] },
    triad: { duration: 8, label: "Triad", color: [0.48, 1, 0.55, 1] },
    aegis: { duration: 5, label: "Aegis", color: [0.38, 0.92, 1, 1] },
    prism: { duration: 7, label: "Prism", color: [0.95, 0.42, 1, 1] }
  };
  /**
   * Main-Brain 1.2 — append-only vault on local metal (Chief Architect path).
   * Browser JS cannot write here; vault ingest is Owner/KC/Obsidian/CLI. Used for
   * diagnostics alignment and ops copy — canonical durable truth stays off the public CDN edge.
   */
  const MAIN_BRAIN_VAULT_CANONICAL_WIN = "E:\\KopanoLabs\\main-brain-1.2";
  /** Degraded fan-out / marketing surface — never treated as sole SoT when SQLite + vault exist. */
  const DEGRADED_SYNC_PUBLIC_ORIGIN = PUBLIC_LIVE_URL;
  let eventBuffer = [];
  let eventFlushHandle = 0;

  function resolveApiUrl(path) {
    if (typeof path !== "string" || !path.startsWith("/")) {
      return path;
    }
    const injected =
      typeof window !== "undefined" && window.__STARFALL_LOCAL_API_ORIGIN__;
    if (injected && typeof injected === "string" && /^https?:\/\//i.test(injected)) {
      return `${injected.replace(/\/$/, "")}${path}`;
    }
    try {
      if (typeof window !== "undefined" && window.location) {
        const raw = new URLSearchParams(window.location.search).get("localApiOrigin");
        if (raw && /^https?:\/\//i.test(raw)) {
          const u = new URL(raw);
          const host = u.hostname.replace(/^www\./i, "").toLowerCase();
          if (host === "localhost" || host.endsWith(".kopanolabs.com")) {
            return `${raw.replace(/\/$/, "")}${path}`;
          }
        }
      }
    } catch {
      // ignore malformed localApiOrigin
    }
    return path;
  }
  /** Set squad code to this value on Save Pilot to unlock local Ops console (events + pilot JSON). Not a server secret. */
  const ADMIN_OPS_CODE = "kopano-flight-ops-2026";
  const ADMIN_SESSION_KEY = "starfallSalvageOpsMonitor";

  const state = {
    mode: "ready",
    time: 0,
    score: 0,
    hull: 3,
    cores: 0,
    speed: 18,
    spawnTimer: 0,
    lastTime: 0,
    fps: 0,
    frameCounter: 0,
    fpsTimer: 0,
    hitShakeTime: 0,
    hitShakeStrength: 0,
    currentFov: BASE_FOV,
    targetFov: BASE_FOV,
    eventMessage: "",
    eventTimer: 0,
    hitFlashTimer: 0,
    scoreSubmitted: false,
    dangerZoneActive: false,
    lastSpeedMultiplier: 1,
    bulletCooldown: 0,
    diagFrames: 0,
    diagMaxDt: 0,
    diagSumDt: 0,
    lastBossWaveIndex: 0,
    forceBossSpawn: false,
    sectorIndex: 1,
    sectorLabel: "Approach",
    reviveUsedThisRun: false
  };

  const Mat4 = {
    create() {
      const out = new Float32Array(16);
      out[0] = 1;
      out[5] = 1;
      out[10] = 1;
      out[15] = 1;
      return out;
    },
    identity(out) {
      out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
      out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
      return out;
    },
    perspective(out, fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2);
      out[0] = f / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = (far + near) / (near - far);
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[14] = (2 * far * near) / (near - far);
      out[15] = 0;
      return out;
    },
    translate(out, a, v) {
      const x = v[0], y = v[1], z = v[2];
      if (a !== out) {
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
        out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
        out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
      }
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      return out;
    },
    scale(out, a, v) {
      const x = v[0], y = v[1], z = v[2];
      out[0] = a[0] * x; out[1] = a[1] * x; out[2] = a[2] * x; out[3] = a[3] * x;
      out[4] = a[4] * y; out[5] = a[5] * y; out[6] = a[6] * y; out[7] = a[7] * y;
      out[8] = a[8] * z; out[9] = a[9] * z; out[10] = a[10] * z; out[11] = a[11] * z;
      out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
      return out;
    },
    rotateX(out, a, rad) {
      const s = Math.sin(rad);
      const c = Math.cos(rad);
      const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      if (a !== out) {
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
      }
      out[4] = a10 * c + a20 * s;
      out[5] = a11 * c + a21 * s;
      out[6] = a12 * c + a22 * s;
      out[7] = a13 * c + a23 * s;
      out[8] = a20 * c - a10 * s;
      out[9] = a21 * c - a11 * s;
      out[10] = a22 * c - a12 * s;
      out[11] = a23 * c - a13 * s;
      return out;
    },
    rotateY(out, a, rad) {
      const s = Math.sin(rad);
      const c = Math.cos(rad);
      const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      if (a !== out) {
        out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
      }
      out[0] = a00 * c - a20 * s;
      out[1] = a01 * c - a21 * s;
      out[2] = a02 * c - a22 * s;
      out[3] = a03 * c - a23 * s;
      out[8] = a00 * s + a20 * c;
      out[9] = a01 * s + a21 * c;
      out[10] = a02 * s + a22 * c;
      out[11] = a03 * s + a23 * c;
      return out;
    },
    rotateZ(out, a, rad) {
      const s = Math.sin(rad);
      const c = Math.cos(rad);
      const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      if (a !== out) {
        out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
      }
      out[0] = a00 * c + a10 * s;
      out[1] = a01 * c + a11 * s;
      out[2] = a02 * c + a12 * s;
      out[3] = a03 * c + a13 * s;
      out[4] = a10 * c - a00 * s;
      out[5] = a11 * c - a01 * s;
      out[6] = a12 * c - a02 * s;
      out[7] = a13 * c - a03 * s;
      return out;
    }
  };

  const modelMatrix = Mat4.create();
  const viewMatrix = Mat4.create();
  const projectionMatrix = Mat4.create();
  const colorTexture = createTexture("plates");
  const crystalTexture = createTexture("crystal");
  const warningTexture = createTexture("warning");
  const starTexture = createTexture("star");

  function makeModel(position, rotation, scale) {
    Mat4.identity(modelMatrix);
    Mat4.translate(modelMatrix, modelMatrix, position);
    Mat4.rotateX(modelMatrix, modelMatrix, rotation[0]);
    Mat4.rotateY(modelMatrix, modelMatrix, rotation[1]);
    Mat4.rotateZ(modelMatrix, modelMatrix, rotation[2]);
    Mat4.scale(modelMatrix, modelMatrix, scale);
    return modelMatrix;
  }

  function createTexture(kind) {
    const textureSize = 128;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = textureSize;
    textureCanvas.height = textureSize;
    const ctx = textureCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, textureSize, textureSize);

    if (kind === "plates") {
      ctx.fillStyle = "#c9f2ff";
      ctx.fillRect(0, 0, textureSize, textureSize);
      ctx.strokeStyle = "#4b6a88";
      ctx.lineWidth = 3;
      for (let i = 0; i <= textureSize; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, textureSize);
        ctx.moveTo(0, i);
        ctx.lineTo(textureSize, i);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(8, 8, 28, 10);
    }

    if (kind === "crystal") {
      const half = textureSize / 2;
      const gradient = ctx.createRadialGradient(half, half, 4, half, half, 78);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.28, "#79f7ff");
      gradient.addColorStop(1, "#0f4b82");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, textureSize, textureSize);
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2;
      for (let i = -textureSize; i < textureSize * 2; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + textureSize, textureSize);
        ctx.stroke();
      }
    }

    if (kind === "warning") {
      ctx.fillStyle = "#3b1118";
      ctx.fillRect(0, 0, textureSize, textureSize);
      ctx.fillStyle = "#ffda5c";
      for (let i = -textureSize; i < textureSize * 2; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 14, 0);
        ctx.lineTo(i + textureSize + 14, textureSize);
        ctx.lineTo(i + textureSize, textureSize);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (kind === "star") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, textureSize, textureSize);
      const half = textureSize / 2;
      const gradient = ctx.createRadialGradient(half, half, 1, half, half, 56);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.2, "#bff7ff");
      gradient.addColorStop(1, "#334155");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, textureSize, textureSize);
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  }

  function createMesh(vertices, indices) {
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const stride = 8 * Float32Array.BYTES_PER_ELEMENT;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      vertexBuffer,
      indexBuffer,
      indexCount: indices.length,
      stride
    };
  }

  function createCubeMesh() {
    const vertices = [];
    const indices = [];
    const faces = [
      { normal: [0, 0, 1], points: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
      { normal: [0, 0, -1], points: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
      { normal: [1, 0, 0], points: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
      { normal: [-1, 0, 0], points: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
      { normal: [0, 1, 0], points: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
      { normal: [0, -1, 0], points: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] }
    ];
    const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];

    faces.forEach((face) => {
      const offset = vertices.length / 8;
      face.points.forEach((point, index) => {
        vertices.push(...point, ...face.normal, ...uvs[index]);
      });
      indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    });

    return createMesh(vertices, indices);
  }

  function normalFor(a, b, c) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    return [nx / len, ny / len, nz / len];
  }

  function createFaceMesh(faces) {
    const vertices = [];
    const indices = [];
    const uvTri = [[0.5, 1], [0, 0], [1, 0]];

    faces.forEach((face) => {
      const offset = vertices.length / 8;
      const normal = normalFor(face[0], face[1], face[2]);
      face.forEach((point, index) => {
        vertices.push(...point, ...normal, ...uvTri[index % 3]);
      });
      indices.push(offset, offset + 1, offset + 2);
    });

    return createMesh(vertices, indices);
  }

  function createOctahedronMesh() {
    const top = [0, 0.65, 0];
    const bottom = [0, -0.65, 0];
    const left = [-0.48, 0, 0];
    const right = [0.48, 0, 0];
    const front = [0, 0, 0.48];
    const back = [0, 0, -0.48];
    return createFaceMesh([
      [top, front, right],
      [top, right, back],
      [top, back, left],
      [top, left, front],
      [bottom, right, front],
      [bottom, back, right],
      [bottom, left, back],
      [bottom, front, left]
    ]);
  }

  function createShipMesh() {
    const nose = [0, 0, -0.9];
    const rearTop = [0, 0.42, 0.62];
    const rearBottom = [0, -0.32, 0.66];
    const rearLeft = [-0.72, -0.08, 0.48];
    const rearRight = [0.72, -0.08, 0.48];
    return createFaceMesh([
      [nose, rearTop, rearRight],
      [nose, rearLeft, rearTop],
      [nose, rearBottom, rearLeft],
      [nose, rearRight, rearBottom],
      [rearTop, rearLeft, rearRight],
      [rearLeft, rearBottom, rearRight]
    ]);
  }

  const meshes = {
    cube: createCubeMesh(),
    crystal: createOctahedronMesh(),
    ship: createShipMesh()
  };

  const keys = new Set();
  const blockingKeys = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d", "f"]);
  let fireHeld = false;
  let mouseFireHeld = false;
  let dashRequested = false;
  const touchAxis = { x: 0, y: 0 };
  let activeTouchId = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchMaxTravel = 0;
  const TOUCH_DEADZONE_PX = 8;
  const TOUCH_FULL_RANGE_PX = 70;
  const TOUCH_TAP_MAX_PX = 14;
  const TOUCH_TAP_MAX_MS = 260;
  const isTouchCapable = (typeof window !== "undefined") && (
    "ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  );
  let pilotProfile = loadPilotProfile();
  let wasPlayingBeforeHidden = false;
  let contextLost = false;

  window.addEventListener("keydown", (event) => {
    if (isAccountModalOpen() || isTypingTarget(event.target)) {
      if (event.key === "Escape" && isAccountModalOpen()) {
        closeAccountModal();
      }
      return;
    }
    const key = event.key.toLowerCase();
    if (blockingKeys.has(key)) {
      event.preventDefault();
    }
    keys.add(key);
    if (key === " ") {
      dashRequested = true;
    }
    if (key === "enter" && state.mode !== "playing") {
      startGame();
    }
    if (key === "p") {
      togglePause();
    }
    if (key === "r") {
      resetGame();
      startGame();
    }
    if (key === "f") {
      fireHeld = true;
      spawnPlayerBullet();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key.toLowerCase() === "f") {
      fireHeld = false;
    }
    if (isAccountModalOpen() || isTypingTarget(event.target)) {
      return;
    }
    keys.delete(event.key.toLowerCase());
  });

  function applyTouchVector(touch) {
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const dist = Math.hypot(dx, dy);
    if (dist > touchMaxTravel) {
      touchMaxTravel = dist;
    }
    if (dist <= TOUCH_DEADZONE_PX) {
      touchAxis.x = 0;
      touchAxis.y = 0;
      return;
    }
    const range = TOUCH_FULL_RANGE_PX - TOUCH_DEADZONE_PX;
    const magnitude = Math.min(1, (dist - TOUCH_DEADZONE_PX) / range);
    touchAxis.x = (dx / dist) * magnitude;
    // Browser y-axis is inverted vs game world Y (up is negative pixel delta).
    touchAxis.y = -(dy / dist) * magnitude;
  }

  function clearTouchAxis() {
    touchAxis.x = 0;
    touchAxis.y = 0;
    activeTouchId = null;
  }

  function isOnboardingDone() {
    try {
      return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function markOnboardingDone() {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      /* storage unavailable - persist for session only */
    }
  }

  function showOnboardingModal() {
    if (!hud.onboardingModal) {
      return;
    }
    hud.onboardingModal.classList.remove("is-hidden");
    if (hud.onboardingAck) {
      hud.onboardingAck.checked = false;
    }
    if (hud.onboardingContinueButton) {
      hud.onboardingContinueButton.disabled = true;
    }
    logEvent("onboarding_open", {});
  }

  function hideOnboardingModal() {
    if (!hud.onboardingModal) {
      return;
    }
    hud.onboardingModal.classList.add("is-hidden");
  }

  function dismissOnboarding() {
    if (hud.onboardingAck && !hud.onboardingAck.checked) {
      return;
    }
    markOnboardingDone();
    hideOnboardingModal();
    logEvent("onboarding_complete", {});
    if (pilotProfile.mode === "guest") {
      window.setTimeout(() => {
        setEventMessage("Sign in to save scores and squad up with friends");
      }, 700);
    }
  }

  if (hud.onboardingAck) {
    hud.onboardingAck.addEventListener("change", () => {
      if (hud.onboardingContinueButton) {
        hud.onboardingContinueButton.disabled = !hud.onboardingAck.checked;
      }
    });
  }
  if (hud.onboardingContinueButton) {
    hud.onboardingContinueButton.addEventListener("click", dismissOnboarding);
  }
  if (!isOnboardingDone()) {
    showOnboardingModal();
  }

  const mobileLockdownActive = MOBILE_LOCKDOWN && isTouchCapable;
  if (mobileLockdownActive) {
    if (hud.mobileLockdown) {
      hud.mobileLockdown.classList.remove("is-hidden");
    }
    if (hud.onboardingModal) {
      hud.onboardingModal.classList.add("is-hidden");
    }
    if (hud.mobileFireButton) {
      hud.mobileFireButton.classList.add("is-hidden");
    }
    state.mode = "lockdown";
    logEvent("mobile_lockdown_engaged", {
      build: GAME_BUILD,
      reason: "Protocol 13 / Commandment XII Save Kill",
      threshold: "80% optimal not met"
    });
  }

  if (hud.mobileFireButton && isTouchCapable && !mobileLockdownActive) {
    hud.mobileFireButton.classList.remove("is-hidden");
    const fireHandler = (event) => {
      event.preventDefault();
      spawnPlayerBullet();
    };
    hud.mobileFireButton.addEventListener("touchstart", fireHandler, { passive: false });
    hud.mobileFireButton.addEventListener("click", (event) => {
      event.preventDefault();
      spawnPlayerBullet();
    });
  }

  refreshOpsConsoleVisibility();

  if (canvas && isTouchCapable && !mobileLockdownActive) {
    canvas.addEventListener("touchstart", (event) => {
      if (isAccountModalOpen() || isTypingTarget(event.target)) {
        return;
      }
      if (activeTouchId !== null) {
        return;
      }
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }
      event.preventDefault();
      activeTouchId = touch.identifier;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = performance.now();
      touchMaxTravel = 0;
      touchAxis.x = 0;
      touchAxis.y = 0;
    }, { passive: false });

    canvas.addEventListener("touchmove", (event) => {
      if (activeTouchId === null) {
        return;
      }
      for (const touch of event.changedTouches) {
        if (touch.identifier === activeTouchId) {
          event.preventDefault();
          applyTouchVector(touch);
          break;
        }
      }
    }, { passive: false });

    const handleTouchEnd = (event) => {
      if (activeTouchId === null) {
        return;
      }
      for (const touch of event.changedTouches) {
        if (touch.identifier === activeTouchId) {
          const elapsed = performance.now() - touchStartTime;
          const wasTap = elapsed <= TOUCH_TAP_MAX_MS && touchMaxTravel <= TOUCH_TAP_MAX_PX;
          if (wasTap) {
            if (state.mode !== "playing") {
              startGame();
            } else {
              dashRequested = true;
              logEvent("touch_dash", {});
            }
          }
          clearTouchAxis();
          break;
        }
      }
    };
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", () => clearTouchAxis(), { passive: true });
  }

  hud.startButton.addEventListener("click", startGame);
  hud.pauseButton.addEventListener("click", togglePause);
  hud.resetButton.addEventListener("click", () => {
    resetGame();
    startGame();
  });
  hud.signInButton.addEventListener("click", openAccountModal);
  if (hud.inviteFriendsButton) {
    hud.inviteFriendsButton.addEventListener("click", inviteFriendsToLane);
  }
  if (hud.reviveSkipButton) {
    hud.reviveSkipButton.addEventListener("click", () => completeRevive(false));
  }
  if (hud.pilotPaletteSelect) {
    hud.pilotPaletteSelect.addEventListener("change", () => {
      applyPilotPalette(hud.pilotPaletteSelect.value);
    });
  }
  if (hud.kasiCommEmojiBar) {
    hud.kasiCommEmojiBar.querySelectorAll(".kasi-comm-emoji").forEach((button) => {
      button.addEventListener("click", () => {
        const emoji = button.dataset.emoji || "";
        if (!emoji || !hud.kasiCommInput) {
          return;
        }
        const next = `${hud.kasiCommInput.value}${emoji}`.slice(0, 240);
        hud.kasiCommInput.value = next;
        hud.kasiCommInput.focus();
      });
    });
  }
  hud.closeAccountButton.addEventListener("click", closeAccountModal);
  hud.guestPilotButton.addEventListener("click", useGuestPilot);
  hud.resetPilotButton.addEventListener("click", resetPilotSession);
  hud.refreshLeaderboardButton.addEventListener("click", () => {
    refreshLeaderboard();
  });
  hud.shareWhatsappButton.addEventListener("click", () => {
    shareScoreToWhatsapp();
  });
  hud.kasiCommToggle.addEventListener("click", toggleKasiComm);
  hud.kasiCommForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendChatMessage();
  });
  hud.kasiCommInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });
  hud.kasiCommInput.addEventListener("keyup", (event) => {
    event.stopPropagation();
  });
  if (hud.submitIdeaButton) {
    hud.submitIdeaButton.addEventListener("click", openIdeaMailto);
  }
  if (hud.exportDiagnosticsButton) {
    hud.exportDiagnosticsButton.addEventListener("click", exportDiagnostics);
  }
  if (hud.shareRow) {
    hud.shareRow.querySelectorAll("button[data-share]").forEach((button) => {
      button.addEventListener("click", () => {
        shareToChannel(button.dataset.share || "whatsapp");
      });
    });
  }
  hud.savePilotButton.addEventListener("click", () => {
    signInPilot();
  });
  hud.accountModal.addEventListener("click", (event) => {
    if (event.target === hud.accountModal) {
      closeAccountModal();
    }
  });
  hud.callsignInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      signInPilot();
    }
  });
  hud.accessCodeInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      signInPilot();
    }
  });
  if (hud.opsConsoleButton) {
    hud.opsConsoleButton.addEventListener("click", openOpsConsole);
  }
  if (hud.opsConsoleClose) {
    hud.opsConsoleClose.addEventListener("click", closeOpsConsole);
  }
  const opsConsoleScrim = document.querySelector(".ops-console-scrim");
  if (opsConsoleScrim) {
    opsConsoleScrim.addEventListener("click", closeOpsConsole);
  }
  if (hud.opsConsole) {
    hud.opsConsole.addEventListener("click", (event) => {
      if (event.target === hud.opsConsole) {
        closeOpsConsole();
      }
    });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      wasPlayingBeforeHidden = state.mode === "playing";
      if (wasPlayingBeforeHidden || state.mode === "revive") {
        if (state.mode === "revive") {
          wasPlayingBeforeHidden = true;
          if (hud.reviveModal) {
            hud.reviveModal.classList.add("is-hidden");
          }
        }
        state.mode = "paused";
        hud.pauseButton.textContent = "Resume";
        setStatus("Paused", "Mission paused while the tab is hidden.", false);
      }
      return;
    }
    state.lastTime = 0;
    if (wasPlayingBeforeHidden && state.mode === "paused") {
      setStatus("Paused", "Resume when ready. Timing stayed delta-time safe while hidden.", false);
    }
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    state.mode = "paused";
    setStatus("Graphics Context Lost", "The browser paused WebGL. The game will rebuild the scene when the context returns.", false);
  });
  canvas.addEventListener("webglcontextrestored", () => {
    window.location.reload();
  });

  const player = {
    x: 0,
    y: -0.45,
    z: -7.8,
    vx: 0,
    vy: 0,
    radius: 0.62,
    dash: 0,
    dashCooldown: 0,
    trailTimer: 0,
    fireBoostTimer: 0,
    buffKind: "",
    buffTimer: 0,
    aegisHits: 0
  };

  const objects = [];
  const sparks = [];
  const trailParticles = [];
  const stars = Array.from({ length: 80 }, () => ({
    x: randomRange(-9, 9),
    y: randomRange(-5, 5),
    z: randomRange(-12, -80),
    size: randomRange(0.025, 0.09),
    phase: Math.random() * Math.PI * 2
  }));

  function getPlayerBounds() {
    const base = (SIM.lanes && SIM.lanes.playerBounds) || SIM_LAW_DEFAULT.lanes.playerBounds;
    if (!isTouchCapable) {
      return base;
    }
    return {
      xMin: base.xMin * 0.7,
      xMax: base.xMax * 0.7,
      yMin: base.yMin * 0.62,
      yMax: base.yMax * 0.62
    };
  }

  function getCameraFollow() {
    if (isTouchCapable) {
      return { x: 1, y: 1 };
    }
    return { x: 0.018, y: 0.016 };
  }

  function getViewportCssSize() {
    const vv = window.visualViewport;
    if (vv && Number.isFinite(vv.width) && Number.isFinite(vv.height)) {
      return { width: vv.width, height: vv.height };
    }
    return { width: canvas.clientWidth, height: canvas.clientHeight };
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resizeCanvas() {
    const budget = getRenderBudgetTier();
    const dprCap = budget.maxDpr || (isTouchCapable ? 1.5 : 2);
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const { width: cssWidth, height: cssHeight } = getViewportCssSize();
    const width = Math.floor(cssWidth * dpr);
    const height = Math.floor(cssHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener("resize", resizeCanvas);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resizeCanvas);
    window.visualViewport.addEventListener("scroll", resizeCanvas);
  }
  window.addEventListener("orientationchange", () => {
    window.setTimeout(resizeCanvas, 120);
  });

  const reviveState = {
    timer: 0,
    caught: 0,
    need: REVIVE_CORES_NEEDED
  };

  function clearReviveArena() {
    if (!hud.reviveArena) {
      return;
    }
    hud.reviveArena.textContent = "";
  }

  function spawnReviveCores() {
    if (!hud.reviveArena) {
      return;
    }
    clearReviveArena();
    const rect = hud.reviveArena.getBoundingClientRect();
    const width = Math.max(rect.width, 280);
    const height = Math.max(rect.height, 200);
    for (let i = 0; i < REVIVE_CORE_COUNT; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "revive-core";
      button.style.left = `${randomRange(12, width - 12)}px`;
      button.style.top = `${randomRange(12, height - 12)}px`;
      button.setAttribute("aria-label", `Salvage core ${i + 1}`);
      button.addEventListener("click", () => {
        if (button.classList.contains("is-caught") || state.mode !== "revive") {
          return;
        }
        button.classList.add("is-caught");
        reviveState.caught += 1;
        if (hud.reviveProgress) {
          hud.reviveProgress.textContent = `${reviveState.caught} / ${reviveState.need}`;
        }
        if (navigator.vibrate) {
          navigator.vibrate(18);
        }
        if (reviveState.caught >= reviveState.need) {
          completeRevive(true);
        }
      });
      hud.reviveArena.append(button);
    }
  }

  function startReviveMiniGame() {
    state.reviveUsedThisRun = true;
    state.mode = "revive";
    reviveState.timer = REVIVE_TIME_SECONDS;
    reviveState.caught = 0;
    reviveState.need = REVIVE_CORES_NEEDED;
    if (hud.reviveModal) {
      hud.reviveModal.classList.remove("is-hidden");
    }
    if (hud.reviveTimer) {
      hud.reviveTimer.textContent = REVIVE_TIME_SECONDS.toFixed(1);
    }
    if (hud.reviveProgress) {
      hud.reviveProgress.textContent = `0 / ${REVIVE_CORES_NEEDED}`;
    }
    window.requestAnimationFrame(() => spawnReviveCores());
    setEventMessage("Core Salvage — tap three cores to relaunch");
    syncShellPlayState();
  }

  function completeRevive(success) {
    if (hud.reviveModal) {
      hud.reviveModal.classList.add("is-hidden");
    }
    clearReviveArena();
    if (success) {
      state.hull = 1;
      state.mode = "playing";
      setEventMessage("Hull restored — keep flying!");
      logEvent("revive_success", { score: Math.floor(state.score) });
      syncShellPlayState();
      updateHud();
      return;
    }
    handleGameOver();
  }

  function tickRevive(dt) {
    if (state.mode !== "revive") {
      return;
    }
    reviveState.timer -= dt;
    if (hud.reviveTimer) {
      hud.reviveTimer.textContent = Math.max(0, reviveState.timer).toFixed(1);
    }
    if (reviveState.caught >= reviveState.need) {
      completeRevive(true);
      return;
    }
    if (reviveState.timer <= 0) {
      completeRevive(false);
    }
  }

  function attemptGameOver() {
    if (!state.reviveUsedThisRun) {
      startReviveMiniGame();
      return;
    }
    handleGameOver();
  }

  function resetGame() {
    state.mode = "ready";
    state.time = 0;
    state.score = 0;
    state.hull = 3;
    state.cores = 0;
    state.speed = 18;
    state.spawnTimer = 0;
    state.fps = 0;
    state.frameCounter = 0;
    state.fpsTimer = 0;
    state.hitShakeTime = 0;
    state.hitShakeStrength = 0;
    state.currentFov = BASE_FOV;
    state.targetFov = BASE_FOV;
    state.eventMessage = "";
    state.eventTimer = 0;
    state.hitFlashTimer = 0;
    state.scoreSubmitted = false;
    state.dangerZoneActive = false;
    state.lastSpeedMultiplier = 1;
    state.bulletCooldown = 0;
    state.diagFrames = 0;
    state.diagMaxDt = 0;
    state.diagSumDt = 0;
    state.lastBossWaveIndex = 0;
    state.forceBossSpawn = false;
    state.sectorIndex = 1;
    state.sectorLabel = "Approach";
    state.reviveUsedThisRun = false;
    player.x = 0;
    player.y = -0.45;
    player.z = -7.8;
    player.vx = 0;
    player.vy = 0;
    player.dash = 0;
    player.dashCooldown = 0;
    player.trailTimer = 0;
    player.fireBoostTimer = 0;
    player.buffKind = "";
    player.buffTimer = 0;
    player.aegisHits = 0;
    objects.length = 0;
    sparks.length = 0;
    trailParticles.length = 0;
    dashRequested = false;
    hud.shell.classList.remove("is-hit");
    hud.eventToast.classList.remove("is-visible");
    hud.eventToast.textContent = "";
    if (hud.shareWhatsappButton) {
      hud.shareWhatsappButton.classList.add("is-hidden");
    }
    updateHud();
    syncShellPlayState();
    setStatus("Ready", "Collect blue energy cores, dodge red debris, and use Space to phase dash through danger.", false);
  }

  function startGame() {
    if (state.mode === "gameover") {
      resetGame();
    }
    state.mode = "playing";
    hud.pauseButton.textContent = "Pause";
    setStatus("", "", true);
    syncShellPlayState();
    canvas.focus();
  }

  function togglePause() {
    if (state.mode === "playing") {
      state.mode = "paused";
      hud.pauseButton.textContent = "Resume";
      setStatus("Paused", "The salvage drone is holding position.", false);
    } else if (state.mode === "paused") {
      state.mode = "playing";
      hud.pauseButton.textContent = "Pause";
      setStatus("", "", true);
      canvas.focus();
    }
    syncShellPlayState();
  }

  function setStatus(title, text, hidden) {
    hud.statusTitle.textContent = title;
    hud.statusText.textContent = text;
    hud.statusPanel.classList.toggle("is-hidden", hidden);
  }

  function setEventMessage(text, duration = 0.9) {
    state.eventMessage = text;
    state.eventTimer = duration;
    hud.eventToast.textContent = text;
    hud.eventToast.classList.add("is-visible");
  }

  function isAccountModalOpen() {
    return !hud.accountModal.classList.contains("is-hidden");
  }

  function isTypingTarget(target) {
    if (!target || !(target instanceof HTMLElement)) {
      return false;
    }
    const tag = target.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || target.isContentEditable;
  }

  function defaultPilotProfile() {
    return {
      id: "guest",
      callsign: "Guest Pilot",
      mode: "guest",
      palette: "default",
      bestScore: 0,
      lastSeen: new Date().toISOString()
    };
  }

  function readJsonStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function normalizeCallsign(value) {
    return (value || "")
      .replace(/[^a-z0-9 _-]/gi, "")
      .trim()
      .slice(0, 24);
  }

  function localPilotId(callsign) {
    const slug = callsign.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pilot";
    const suffix = Math.random().toString(36).slice(2, 8);
    return `local-${slug}-${suffix}`;
  }

  function loadPilotProfile() {
    const saved = readJsonStorage(PROFILE_STORAGE_KEY, null);
    if (!saved || typeof saved !== "object" || !saved.callsign) {
      return defaultPilotProfile();
    }
    return {
      id: saved.id || localPilotId(saved.callsign),
      callsign: normalizeCallsign(saved.callsign) || "Guest Pilot",
      mode: saved.mode || "local",
      palette: PILOT_PALETTES.includes(saved.palette) ? saved.palette : "default",
      bestScore: Number(saved.bestScore) || 0,
      lastSeen: saved.lastSeen || new Date().toISOString()
    };
  }

  function persistPilotProfile(profile) {
    pilotProfile = {
      ...profile,
      callsign: normalizeCallsign(profile.callsign) || "Guest Pilot",
      palette: PILOT_PALETTES.includes(profile.palette) ? profile.palette : "default",
      bestScore: Number(profile.bestScore) || 0,
      lastSeen: new Date().toISOString()
    };
    writeJsonStorage(PROFILE_STORAGE_KEY, pilotProfile);
    applyPilotPalette(pilotProfile.palette);
    updatePilotBadge();
  }

  function formatScore(value) {
    return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("en-US");
  }

  function localLeaderboardRows() {
    const scores = readJsonStorage(SCORES_STORAGE_KEY, []);
    return (Array.isArray(scores) ? scores : [])
      .map((score) => ({
        pilotId: score.pilotId || "local",
        callsign: normalizeCallsign(score.callsign) || "Local Pilot",
        score: Math.max(0, Math.floor(Number(score.score) || 0)),
        cores: Math.max(0, Math.floor(Number(score.cores) || 0)),
        time: Math.max(0, Number(score.time) || 0),
        savedAt: score.savedAt || ""
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_LIMIT);
  }

  function renderLeaderboard(scores, statusText) {
    const rows = (Array.isArray(scores) ? scores : [])
      .map((score) => ({
        callsign: normalizeCallsign(score.callsign) || "Unknown Pilot",
        score: Math.max(0, Math.floor(Number(score.score) || 0)),
        cores: Math.max(0, Math.floor(Number(score.cores) || 0)),
        time: Math.max(0, Number(score.time) || 0)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_LIMIT);

    hud.leaderboardList.textContent = "";
    if (!rows.length) {
      const empty = document.createElement("li");
      empty.className = "leaderboard-empty";
      empty.textContent = "No runs submitted yet. Sign in, launch, and fly until mission end.";
      hud.leaderboardList.append(empty);
    } else {
      rows.forEach((row, index) => {
        const item = document.createElement("li");
        item.className = "leaderboard-row";

        const rank = document.createElement("span");
        rank.className = "leaderboard-rank";
        rank.textContent = `#${index + 1}`;

        const pilot = document.createElement("span");
        pilot.className = "leaderboard-pilot";
        pilot.textContent = row.callsign;
        pilot.title = row.callsign;

        const score = document.createElement("span");
        score.className = "leaderboard-score";
        score.textContent = formatScore(row.score);

        const meta = document.createElement("span");
        meta.className = "leaderboard-meta";
        meta.textContent = `${row.cores} cores | ${row.time.toFixed(1)}s`;

        item.append(rank, pilot, score, meta);
        hud.leaderboardList.append(item);
      });
    }

    hud.leaderboardStatus.textContent = statusText;
  }

  async function refreshLeaderboard(options = {}) {
    const quiet = options.quiet === true;
    if (!quiet) {
      hud.leaderboardStatus.textContent = "Checking SQLite leaderboard...";
    }
    hud.refreshLeaderboardButton.disabled = true;
    try {
      const data = await requestJson("/api/leaderboard");
      if (!data.ok || !Array.isArray(data.scores)) {
        throw new Error("Invalid leaderboard response");
      }
      renderLeaderboard(data.scores, "SQLite leaderboard synced.");
      return data.scores;
    } catch {
      const localRows = localLeaderboardRows();
      const status = localRows.length
        ? "Backend offline. Showing local browser scores."
        : "Start the local backend for SQLite leaderboard scores.";
      renderLeaderboard(localRows, status);
      return localRows;
    } finally {
      hud.refreshLeaderboardButton.disabled = false;
    }
  }

  function updateAccountSummary() {
    const modeLabel = pilotProfile.mode === "backend"
      ? "SQLite backend"
      : pilotProfile.mode === "local"
        ? "local browser profile"
        : "guest session";

    hud.accountSummary.textContent = "";

    const identity = document.createElement("span");
    identity.textContent = `Signed in as ${pilotProfile.callsign} (${modeLabel})`;

    const best = document.createElement("strong");
    best.textContent = `Best score ${formatScore(pilotProfile.bestScore)}`;

    hud.accountSummary.append(identity, best);
  }

  async function refreshPilotBestScore() {
    updateAccountSummary();
    if (pilotProfile.mode !== "backend" || pilotProfile.id === "guest") {
      return;
    }
    try {
      const data = await requestJson(`/api/me?pilotId=${encodeURIComponent(pilotProfile.id)}`);
      if (data.ok && data.pilot) {
        persistPilotProfile({
          ...pilotProfile,
          bestScore: Number(data.pilot.bestScore) || 0,
          lastSeen: data.pilot.lastSeen
        });
        hud.accountStatus.textContent = "SQLite profile loaded for this pilot.";
      }
    } catch {
      hud.accountStatus.textContent = "SQLite profile could not be refreshed. Cached best score shown.";
      updateAccountSummary();
    }
  }

  function updatePilotBadge() {
    hud.pilotBadge.textContent = pilotProfile.callsign;
    hud.pilotBadge.title = `${pilotProfile.callsign} (${pilotProfile.mode})`;
    hud.signInButton.textContent = pilotProfile.mode === "guest" ? "Sign in" : "Pilot";
    updateAccountSummary();
  }

  function openAccountModal() {
    if (state.mode === "playing") {
      state.mode = "paused";
      hud.pauseButton.textContent = "Resume";
      setStatus("Pilot Access", "Mission paused while pilot credentials are entered.", false);
    }
    hud.callsignInput.value = pilotProfile.mode === "guest" ? "" : pilotProfile.callsign;
    hud.accessCodeInput.value = "";
    if (hud.pilotPaletteSelect) {
      hud.pilotPaletteSelect.value = pilotProfile.palette || "default";
    }
    hud.accountStatus.textContent = pilotProfile.mode === "backend"
      ? "Backend profile active. Scores will sync when the local server is running."
      : "Offline profile mode is available with no network account.";
    refreshPilotBestScore();
    hud.accountModal.classList.remove("is-hidden");
    hud.callsignInput.focus();
  }

  function closeAccountModal() {
    hud.accountModal.classList.add("is-hidden");
    canvas.focus();
  }

  function useGuestPilot() {
    pilotProfile = defaultPilotProfile();
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      // Local storage may be unavailable in locked-down browsers.
    }
    updatePilotBadge();
    hud.accountStatus.textContent = "Guest pilot active. Scores stay in this browser session.";
    refreshLeaderboard({ quiet: true });
    closeAccountModal();
  }

  function resetPilotSession() {
    pilotProfile = defaultPilotProfile();
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      window.localStorage.removeItem(SCORES_STORAGE_KEY);
    } catch {
      // Local storage may be unavailable in locked-down browsers.
    }
    updatePilotBadge();
    renderLeaderboard([], "Local pilot data cleared. SQLite scores remain on the backend.");
    setEventMessage("Pilot reset");
    hud.accountStatus.textContent = "Pilot reset. Sign in again to link scores with SQLite.";
    refreshLeaderboard({ quiet: true });
  }

  async function requestJson(url, options = {}) {
    const resolvedUrl = resolveApiUrl(url);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 1200);
    try {
      const response = await fetch(resolvedUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function signInPilot() {
    const callsign = normalizeCallsign(hud.callsignInput.value) || "Salvage Pilot";
    const palette = hud.pilotPaletteSelect ? hud.pilotPaletteSelect.value : pilotProfile.palette;
    const fallbackProfile = {
      id: pilotProfile.id !== "guest" ? pilotProfile.id : localPilotId(callsign),
      callsign,
      mode: "local",
      palette,
      bestScore: pilotProfile.bestScore || 0
    };
    hud.accountStatus.textContent = "Checking local backend...";
    hud.savePilotButton.disabled = true;

    try {
      const data = await requestJson("/api/signin", {
        method: "POST",
        body: JSON.stringify({
          callsign,
          squadCode: hud.accessCodeInput.value.trim()
        })
      });
      if (!data.ok || !data.pilot) {
        throw new Error("Invalid backend response");
      }
      persistPilotProfile({
        id: data.pilot.id,
        callsign: data.pilot.callsign,
        mode: "backend",
        palette,
        bestScore: Number(data.pilot.bestScore) || 0,
        lastSeen: data.pilot.lastSeen
      });
      if (Array.isArray(data.leaderboard)) {
        renderLeaderboard(data.leaderboard, "SQLite leaderboard synced.");
      }
      hud.accountStatus.textContent = `Signed in as ${pilotProfile.callsign}. Best score ${formatScore(pilotProfile.bestScore)}.`;
      setEventMessage(`Pilot linked: ${pilotProfile.callsign}`);
      maybeEnableOpsConsole();
      closeAccountModal();
    } catch {
      persistPilotProfile(fallbackProfile);
      renderLeaderboard(localLeaderboardRows(), "Backend offline. Showing local browser scores.");
      hud.accountStatus.textContent = "Backend unavailable. Local pilot saved for offline demo mode.";
      setEventMessage(`Local pilot: ${pilotProfile.callsign}`);
      maybeEnableOpsConsole();
      closeAccountModal();
    } finally {
      hud.savePilotButton.disabled = false;
    }
  }

  let chatPollHandle = 0;
  let lastChatId = 0;
  let chatBackendOnline = false;

  function loadEventLog() {
    try {
      const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveEventLog(log) {
    try {
      window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(log.slice(-EVENTS_MAX)));
    } catch {
      /* storage full or unavailable - silently drop */
    }
  }

  function flushEventBuffer() {
    eventFlushHandle = 0;
    if (eventBuffer.length === 0) return;
    const log = loadEventLog();
    for (let i = 0; i < eventBuffer.length; i++) {
      log.push(eventBuffer[i]);
    }
    eventBuffer.length = 0;
    saveEventLog(log);
  }

  function logEvent(type, payload) {
    eventBuffer.push({
      type,
      payload: payload || {},
      pilotId: pilotProfile.id || null,
      callsign: pilotProfile.callsign || null,
      score: Math.floor(state.score || 0),
      mode: state.mode || "init",
      ts: new Date().toISOString()
    });
    if (!eventFlushHandle) {
      eventFlushHandle = window.setTimeout(flushEventBuffer, 1000);
    }
  }

  function refreshOpsConsoleVisibility() {
    let ok = false;
    try {
      ok = window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
    } catch {
      ok = false;
    }
    if (hud.opsConsoleButton) {
      hud.opsConsoleButton.classList.toggle("is-hidden", !ok);
    }
  }

  function maybeEnableOpsConsole() {
    const code = hud.accessCodeInput.value.trim();
    if (code === ADMIN_OPS_CODE) {
      try {
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      logEvent("ops_console_enabled", {
        callsign: pilotProfile.callsign,
        touch: Boolean(isTouchCapable)
      });
    }
    refreshOpsConsoleVisibility();
  }

  function openOpsConsole() {
    flushEventBuffer();
    if (!hud.opsConsole || !hud.opsLog) return;
    const events = loadEventLog().slice(-140);
    hud.opsLog.textContent = JSON.stringify(
      {
        pilot: pilotProfile,
        speedMultiplier: Number((state.lastSpeedMultiplier || 1).toFixed(2)),
        dangerZone: state.dangerZoneActive,
        generatedAt: new Date().toISOString(),
        events
      },
      null,
      2
    );
    hud.opsConsole.classList.remove("is-hidden");
  }

  function closeOpsConsole() {
    if (hud.opsConsole) {
      hud.opsConsole.classList.add("is-hidden");
    }
  }

  function shareScoreText() {
    const score = Math.floor(Number(hud.shareWhatsappButton && hud.shareWhatsappButton.dataset.score) || state.score || pilotProfile.bestScore || 0);
    return `I just survived ${score} parsecs in Starfall Salvage. Beat my score at ${PUBLIC_LIVE_URL}! 🚀`;
  }

  function inviteFriendsToLane() {
    const squad = (hud.accessCodeInput && hud.accessCodeInput.value.trim()) || "SALVAGE";
    const url = new URL(PUBLIC_LIVE_URL);
    url.searchParams.set("squad", squad);
    const inviteText = `${pilotProfile.callsign} wants you in the Starfall Salvage lane. Squad code: ${squad}. Fly here: ${url}`;
    if (navigator.share) {
      navigator.share({
        title: "Starfall Salvage — squad invite",
        text: inviteText,
        url: url.toString()
      }).catch(() => {});
      logEvent("invite_share", { squad });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteText).then(() => setEventMessage("Squad invite copied"));
    } else {
      window.prompt("Copy squad invite:", inviteText);
    }
    logEvent("invite_share", { squad });
  }

  function shareToChannel(channel) {
    const text = shareScoreText();
    const encoded = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(PUBLIC_LIVE_URL);
    let url = "";
    switch (channel) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encoded}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "copy":
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => setEventMessage("Link copied"));
        } else {
          window.prompt("Copy this:", text);
        }
        logEvent("share_copy", { channel });
        return;
      case "whatsapp":
      default:
        url = `https://api.whatsapp.com/send?text=${encoded}`;
        break;
    }
    logEvent("share_click", { channel });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openIdeaMailto() {
    flushEventBuffer();
    const log = loadEventLog();
    const recent = log.slice(-15).map((e) => `${e.ts} ${e.type} ${JSON.stringify(e.payload)}`).join("\n");
    const subject = `Starfall Salvage idea — ${pilotProfile.callsign || "Guest Pilot"}`;
    const body = [
      "Drop your idea below. Strong upgrade ideas can earn a Sovereign Tech bounty",
      "(R150–R5000+ ZAR, paid Yoco / PayFast / EFT, see CONTRIBUTING.md).",
      "",
      "--- IDEA ---",
      "(write here)",
      "",
      "--- WHY IT MATTERS ---",
      "(one or two lines)",
      "",
      "--- CONTACT FOR PAYOUT ---",
      "Name:",
      "Bank / EFT details:",
      "",
      "--- AUTOMATIC DIAGNOSTIC SNAPSHOT ---",
      `Pilot: ${pilotProfile.callsign || "Guest"} (${pilotProfile.id || "anon"})`,
      `Best score: ${pilotProfile.bestScore || 0}`,
      `Mode at submit: ${state.mode}`,
      `Game version: ${GAME_BUILD}`,
      `URL: ${PUBLIC_LIVE_URL}`,
      `Repo: ${PUBLIC_REPO_URL}`,
      "Recent events:",
      recent || "(no events captured yet)"
    ].join("\n");
    const url = `mailto:${KOPANO_BOUNTY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    logEvent("idea_submit_click", {});
    window.location.href = url;
  }

  function exportDiagnostics() {
    flushEventBuffer();
    const payload = {
      generatedAt: new Date().toISOString(),
      gameVersion: GAME_BUILD,
      liveUrl: PUBLIC_LIVE_URL,
      mainBrainSyncRouting: {
        vaultCanonicalWinPath: MAIN_BRAIN_VAULT_CANONICAL_WIN,
        degradedPublicOrigin: DEGRADED_SYNC_PUBLIC_ORIGIN,
        mobileLockdownStrictMobileParam: MOBILE_LOCKDOWN,
        apiDefault: "same-origin /api/* (SQLite server on deploy host)",
        apiOverride:
          "Optional: window.__STARFALL_LOCAL_API_ORIGIN__ = 'http://127.0.0.1:PORT' or ?localApiOrigin= for dev bridge; public live URL remains degraded fan-out only."
      },
      pilot: pilotProfile,
      currentMode: state.mode,
      currentScore: Math.floor(state.score || 0),
      events: loadEventLog()
    };
    const text = JSON.stringify(payload, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => setEventMessage("Diagnostics copied to clipboard"));
    } else {
      const blob = new Blob([text], { type: "application/json" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `starfall-diagnostics-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    }
    logEvent("diagnostics_export", {});
  }

  function toggleKasiComm() {
    const collapsed = hud.kasiComm.classList.toggle("is-collapsed");
    hud.kasiCommToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    if (!collapsed) {
      refreshChatMessages();
      startChatPolling();
      window.setTimeout(() => hud.kasiCommInput.focus(), 30);
    } else {
      stopChatPolling();
    }
  }

  function startChatPolling() {
    if (chatPollHandle) {
      return;
    }
    chatPollHandle = window.setInterval(refreshChatMessages, CHAT_POLL_INTERVAL_MS);
  }

  function stopChatPolling() {
    if (chatPollHandle) {
      window.clearInterval(chatPollHandle);
      chatPollHandle = 0;
    }
  }

  function renderChatMessages(messages) {
    hud.kasiCommList.textContent = "";
    if (!Array.isArray(messages) || messages.length === 0) {
      const empty = document.createElement("li");
      empty.className = "kasi-comm-empty";
      empty.textContent = "No transmissions yet. Drop a line and rally the lane.";
      hud.kasiCommList.append(empty);
      lastChatId = 0;
      return;
    }
    messages.forEach((row) => {
      const item = document.createElement("li");
      item.className = "kasi-comm-row";
      if (row.pilotId && row.pilotId === pilotProfile.id) {
        item.classList.add("is-self");
      }
      const author = document.createElement("span");
      author.className = "kasi-comm-author";
      author.textContent = row.callsign || "Unknown";
      const text = document.createElement("span");
      text.className = "kasi-comm-text";
      text.textContent = row.message || "";
      item.append(author, text);
      hud.kasiCommList.append(item);
    });
    lastChatId = Number(messages[messages.length - 1].id) || lastChatId;
    hud.kasiCommList.scrollTop = hud.kasiCommList.scrollHeight;
  }

  async function refreshChatMessages() {
    try {
      const data = await requestJson(`/api/chat?limit=${CHAT_LIMIT}`);
      if (!data.ok || !Array.isArray(data.messages)) {
        throw new Error("Invalid chat response");
      }
      chatBackendOnline = true;
      hud.kasiCommStatus.textContent = `Lobby live. ${data.messages.length} recent transmissions.`;
      hud.kasiCommSend.disabled = false;
      renderChatMessages(data.messages);
    } catch {
      chatBackendOnline = false;
      hud.kasiCommStatus.textContent = "Lobby offline on this build — drop your upgrade idea below for a Sovereign Tech bounty.";
      hud.kasiCommSend.disabled = true;
    }
  }

  async function sendChatMessage() {
    const raw = hud.kasiCommInput.value.trim();
    if (!raw) {
      return;
    }
    if (!chatBackendOnline) {
      hud.kasiCommStatus.textContent = "Lobby offline. Start the local backend to chat.";
      return;
    }
    hud.kasiCommSend.disabled = true;
    try {
      const data = await requestJson("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          callsign: pilotProfile.callsign,
          pilotId: pilotProfile.id,
          message: raw.slice(0, 240)
        })
      });
      if (!data.ok || !Array.isArray(data.messages)) {
        throw new Error("Invalid chat post response");
      }
      hud.kasiCommInput.value = "";
      renderChatMessages(data.messages);
      hud.kasiCommStatus.textContent = "Transmission delivered.";
    } catch {
      hud.kasiCommStatus.textContent = "Send failed. Backend may be offline.";
    } finally {
      hud.kasiCommSend.disabled = false;
      hud.kasiCommInput.focus();
    }
  }

  function saveLocalScore(payload) {
    const scores = readJsonStorage(SCORES_STORAGE_KEY, []);
    const cleanScores = Array.isArray(scores) ? scores : [];
    cleanScores.push({
      ...payload,
      savedAt: new Date().toISOString()
    });
    cleanScores.sort((a, b) => Number(b.score) - Number(a.score));
    writeJsonStorage(SCORES_STORAGE_KEY, cleanScores.slice(0, 12));

    const bestScore = Math.max(pilotProfile.bestScore || 0, Math.floor(payload.score));
    if (bestScore !== pilotProfile.bestScore && pilotProfile.mode !== "guest") {
      persistPilotProfile({ ...pilotProfile, bestScore });
    }
    return bestScore;
  }

  async function submitScore() {
    if (state.scoreSubmitted) {
      return;
    }
    state.scoreSubmitted = true;

    const payload = {
      pilotId: pilotProfile.id,
      callsign: pilotProfile.callsign,
      mode: pilotProfile.mode,
      score: Math.floor(state.score),
      cores: state.cores,
      time: Number(state.time.toFixed(2))
    };
    const bestScore = saveLocalScore(payload);

    if (pilotProfile.mode !== "backend") {
      renderLeaderboard(localLeaderboardRows(), "Backend offline. Showing local browser scores.");
      setEventMessage(`Local best: ${bestScore}`);
      return;
    }

    try {
      const data = await requestJson("/api/score", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (data.ok && data.pilot) {
        persistPilotProfile({
          ...pilotProfile,
          bestScore: Number(data.pilot.bestScore) || bestScore
        });
        if (Array.isArray(data.leaderboard)) {
          renderLeaderboard(data.leaderboard, "SQLite leaderboard synced.");
        }
        setEventMessage("Score synced");
      }
    } catch {
      renderLeaderboard(localLeaderboardRows(), "Score saved locally. SQLite sync failed.");
      setEventMessage("Score saved offline");
    }
  }

  function revealShareButton(finalScore) {
    if (!hud.shareWhatsappButton) {
      return;
    }
    hud.shareWhatsappButton.dataset.score = String(Math.max(0, Math.floor(Number(finalScore) || 0)));
    hud.shareWhatsappButton.classList.remove("is-hidden");
    hud.shareWhatsappButton.textContent = "Share to WhatsApp";
  }

  function shareScoreToWhatsapp() {
    shareToChannel("whatsapp");
  }

  function persistRunReceipt(finalScore) {
    const receipt = {
      score: finalScore,
      cores: state.cores,
      timeAlive: Number(state.time.toFixed(2)),
      sectorIndex: state.sectorIndex,
      sectorLabel: state.sectorLabel,
      speedMultiplier: Number((state.lastSpeedMultiplier || 1).toFixed(2)),
      build: GAME_BUILD,
      callsign: pilotProfile.callsign || "Guest",
      savedAt: new Date().toISOString()
    };
    const receipts = readJsonStorage(RUN_RECEIPTS_STORAGE_KEY, []);
    receipts.unshift(receipt);
    writeJsonStorage(RUN_RECEIPTS_STORAGE_KEY, receipts.slice(0, 50));
    const vaultReady = window.__kopanoVaultReady;
    if (vaultReady && typeof vaultReady.then === "function") {
      vaultReady
        .then((vault) => {
          if (!vault) {
            return null;
          }
          return vault.scores.add({
            callsign: receipt.callsign,
            score: receipt.score,
            cores: receipt.cores,
            timeAlive: receipt.timeAlive,
            wave: receipt.sectorIndex,
            mode: isTouchCapable ? "mobile" : "desktop"
          });
        })
        .catch(() => null);
    }
    logEvent("run_receipt_saved", {
      score: receipt.score,
      sector: receipt.sectorIndex,
      build: receipt.build
    });
  }

  function handleGameOver() {
    if (hud.reviveModal) {
      hud.reviveModal.classList.add("is-hidden");
    }
    clearReviveArena();
    state.mode = "gameover";
    hud.pauseButton.textContent = "Pause";
    if (navigator.vibrate) {
      navigator.vibrate([400, 120, 400, 120, 600]);
    }
    const finalScore = Math.floor(state.score);
    const bestScore = Math.max(pilotProfile.bestScore || 0, finalScore);
    setStatus("Mission Failed", `Pilot: ${pilotProfile.callsign} | Final score: ${finalScore} | Best: ${bestScore} | Cores: ${state.cores} | Time: ${state.time.toFixed(1)}s. Invite friends or sign in to save your lane. Reset to fly again.`, false);
    submitScore();
    persistRunReceipt(finalScore);
    revealShareButton(finalScore);
    logEvent("game_over", { score: finalScore, cores: state.cores, time: Number(state.time.toFixed(2)) });
    syncShellPlayState();
  }

  function updateHud() {
    hud.score.textContent = Math.floor(state.score).toString();
    hud.hull.textContent = state.hull.toString();
    hud.cores.textContent = state.cores.toString();
    hud.dash.textContent = player.dashCooldown <= 0 ? "Ready" : `${player.dashCooldown.toFixed(1)}s`;
    hud.speed.textContent = `${(state.speed / 18).toFixed(1)}x`;
    if (hud.buff) {
      hud.buff.textContent = activeBuffLabel();
    }
    hud.fps.textContent = state.fps ? Math.round(state.fps).toString() : "--";
  }

  function spawnBossEntity(mult) {
    const spawnZ = (SIM.spawn.spawnZ && SIM.spawn.spawnZ.boss) || -78;
    const size = randomRange(1.65, 2.15);
    const extraHp = mult >= 2 ? Math.max(0, Math.floor((mult - 2) * 2.2)) : 0;
    const hp = 4 + extraHp;
    objects.push({
      type: "boss",
      x: randomRange(-3.2, 3.2),
      y: randomRange(-1.4, 1.0),
      z: spawnZ,
      size,
      radius: size * 0.85,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      spinX: randomRange(-0.6, 0.6),
      spinY: randomRange(-0.8, 0.8),
      spinZ: randomRange(-0.5, 0.5),
      hp,
      maxHp: hp,
      bossShootTimer: randomRange(1.0, 1.9)
    });
    logEvent("boss_spawned", { hp });
  }

  function spawnObject() {
    const roll = Math.random();
    const dangerActive = !!state.dangerZoneActive;
    const mult = state.lastSpeedMultiplier || 1;
    const spawnZ = SIM.spawn.spawnZ || SIM_LAW_DEFAULT.spawn.spawnZ;

    if (state.forceBossSpawn && dangerActive) {
      state.forceBossSpawn = false;
      spawnBossEntity(mult);
      return;
    }

    const bossChance = bossSpawnChance(mult, dangerActive);
    if (dangerActive && roll < bossChance) {
      spawnBossEntity(mult);
      return;
    }

    const picked = obstacleClassForRoll(roll, mult, dangerActive);
    if (picked.type === "rangeTarget") {
      const s = randomRange(0.42, 0.62);
      objects.push({
        type: "rangeTarget",
        x: randomRange(-3.4, 3.4),
        y: randomRange(-1.8, 1.4),
        z: spawnZ.rangeTarget,
        size: s,
        radius: s * 0.75,
        hp: 2,
        maxHp: 2,
        rotX: randomRange(0, Math.PI * 2),
        rotY: randomRange(0, Math.PI * 2),
        rotZ: randomRange(0, Math.PI * 2),
        spinX: randomRange(-0.9, 0.9),
        spinY: randomRange(-1.1, 1.1),
        spinZ: randomRange(-0.8, 0.8)
      });
      return;
    }

    if (picked.type === "buffOrb") {
      const buffKinds = ["overcharge", "triad", "aegis", "prism"];
      const buffKind = buffKinds[Math.floor(Math.random() * buffKinds.length)];
      const s = randomRange(0.36, 0.52);
      objects.push({
        type: "buffOrb",
        buffKind,
        x: randomRange(-3.2, 3.2),
        y: randomRange(-1.7, 1.3),
        z: spawnZ.pickup,
        size: s,
        radius: s * 0.72,
        rotX: randomRange(0, Math.PI * 2),
        rotY: randomRange(0, Math.PI * 2),
        rotZ: randomRange(0, Math.PI * 2),
        spinX: randomRange(-1.2, 1.2),
        spinY: randomRange(-1.2, 1.2),
        spinZ: randomRange(-1.0, 1.0)
      });
      return;
    }

    if (picked.type === "powerOrb") {
      const s = randomRange(0.38, 0.55);
      objects.push({
        type: "powerOrb",
        x: randomRange(-3.2, 3.2),
        y: randomRange(-1.7, 1.3),
        z: spawnZ.pickup,
        size: s,
        radius: s * 0.72,
        rotX: randomRange(0, Math.PI * 2),
        rotY: randomRange(0, Math.PI * 2),
        rotZ: randomRange(0, Math.PI * 2),
        spinX: randomRange(-1.2, 1.2),
        spinY: randomRange(-1.2, 1.2),
        spinZ: randomRange(-1.0, 1.0)
      });
      return;
    }

    const crystalRule = SIM.obstacleClasses.find((entry) => entry.type === "crystal") || {};
    const deciStepsSpawn = mult >= 1 ? Math.floor((mult - 1) * 10) : 0;
    const crystalBias =
      (crystalRule.crystalBiasBase || 0.66) -
      Math.min(crystalRule.crystalBiasCap || 0.14, deciStepsSpawn * (crystalRule.crystalBiasDeciStep || 0.012));
    const isCrystal = roll > crystalBias;
    const size = isCrystal ? randomRange(0.55, 0.85) : randomRange(0.85, 1.35);
    objects.push({
      type: isCrystal ? "crystal" : "debris",
      x: randomRange(-3.8, 3.8),
      y: randomRange(-2.0, 1.6),
      z: spawnZ.hazard,
      size,
      radius: isCrystal ? size * 0.68 : size * 0.82,
      rotX: randomRange(0, Math.PI * 2),
      rotY: randomRange(0, Math.PI * 2),
      rotZ: randomRange(0, Math.PI * 2),
      spinX: randomRange(-1.4, 1.4),
      spinY: randomRange(-1.6, 1.6),
      spinZ: randomRange(-1.2, 1.2)
    });
  }

  function spawnPlayerBullet() {
    if (state.mode !== "playing") {
      return;
    }
    if (state.bulletCooldown > 0) {
      return;
    }
    if (sparks.length >= sparksMax) {
      return;
    }
    const rapid = player.fireBoostTimer > 0 || (player.buffKind === "overcharge" && player.buffTimer > 0);
    state.bulletCooldown = rapid ? 0.09 : 0.18;
    const triad = player.buffKind === "triad" && player.buffTimer > 0;
    const prism = player.buffKind === "prism" && player.buffTimer > 0;
    const offsets = triad ? [-0.14, 0, 0.14] : [0];
    const bulletColor = prism ? [0.95, 0.48, 1, 1] : rapid ? [1, 0.88, 0.38, 1] : [0.42, 0.96, 1, 1];
    offsets.forEach((offsetX) => {
      if (sparks.length >= sparksMax) {
        return;
      }
      sparks.push({
        kind: "bullet",
        team: "player",
        x: player.x + offsetX,
        y: player.y + 0.18,
        z: player.z + 0.1,
        vx: offsetX * 8,
        vy: 0,
        vz: -64,
        life: 1.6,
        maxLife: 1.6,
        size: triad ? 0.19 : 0.22,
        color: bulletColor,
        pierce: prism
      });
    });
    logEvent("player_shoot", { triad, prism });
  }

  function spawnBossBullet(boss) {
    if (sparks.length >= sparksMax) return;
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dz = player.z - boss.z;
    const distance = Math.hypot(dx, dy, dz) || 1;
    const speed = 26;
    sparks.push({
      kind: "bullet",
      team: "boss",
      x: boss.x,
      y: boss.y,
      z: boss.z + 0.4,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed,
      vz: (dz / distance) * speed,
      life: 2.4,
      maxLife: 2.4,
      size: 0.26,
      color: [1, 0.32, 0.46, 1]
    });
  }

  function spawnSparks(x, y, z, color, count = 14) {
    const budget = sparksMax - sparks.length;
    if (budget <= 0) return;
    const actual = Math.min(count, budget);
    for (let i = 0; i < actual; i++) {
      sparks.push({
        x,
        y,
        z,
        vx: randomRange(-2.8, 2.8),
        vy: randomRange(-2.1, 2.1),
        vz: randomRange(-3, 4),
        life: randomRange(0.28, 0.52),
        maxLife: 0.52,
        size: randomRange(0.06, 0.14),
        color
      });
    }
  }

  function spawnTrailParticle(force = false) {
    if (trailParticles.length >= trailMax) return;
    const moving = Math.hypot(player.vx, player.vy) > 0.1;
    if (!force && state.mode !== "playing") {
      return;
    }
    if (!force && !moving && player.dash <= 0) {
      return;
    }
    const dashBoost = player.dash > 0 ? 1.8 : 1;
    trailParticles.push({
      x: player.x + randomRange(-0.16, 0.16),
      y: player.y + randomRange(-0.12, 0.12),
      z: player.z + 0.72,
      vx: -player.vx * 0.055 + randomRange(-0.35, 0.35),
      vy: -player.vy * 0.055 + randomRange(-0.25, 0.25),
      vz: randomRange(1.8, 3.8) * dashBoost,
      life: player.dash > 0 ? 0.46 : 0.32,
      maxLife: player.dash > 0 ? 0.46 : 0.32,
      size: player.dash > 0 ? randomRange(0.14, 0.24) : randomRange(0.08, 0.16),
      color: player.dash > 0 ? [0.25, 0.95, 1, 0.78] : [0.42, 1, 0.72, 0.52]
    });
  }

  function absorbHullHit() {
    if (player.aegisHits > 0) {
      player.aegisHits -= 1;
      setEventMessage("Aegis absorbed");
      spawnSparks(player.x, player.y, player.z, [0.38, 0.92, 1, 0.95], 16);
      return true;
    }
    return false;
  }

  function updateGame(dt) {
    if (state.mode !== "playing") {
      return;
    }

    state.time += dt;
    const previousMultiplier = state.lastSpeedMultiplier || 1;
    const deciSteps = previousMultiplier >= 1 ? Math.floor((previousMultiplier - 1) * 10) : 0;
    const rampBase = isTouchCapable ? 0.28 : 0.34;
    const ramp =
      rampBase +
      deciSteps * (isTouchCapable ? 0.042 : 0.05) +
      (previousMultiplier >= 2 ? (previousMultiplier - 2) * (isTouchCapable ? 0.13 : 0.16) : 0);
    const maxSpeed = isTouchCapable ? 52 : 58;
    state.speed = Math.min(maxSpeed, 14 + state.time * ramp);
    const speedMultiplier = state.speed / 18;
    state.lastSpeedMultiplier = speedMultiplier;
    if (previousMultiplier < 2 && speedMultiplier >= 2) {
      state.dangerZoneActive = true;
      state.lastBossWaveIndex = Math.max(state.lastBossWaveIndex || 0, 1);
      state.forceBossSpawn = true;
      logEvent("danger_zone_entered", { speedMultiplier: Number(speedMultiplier.toFixed(2)) });
      setEventMessage("Danger zone — boss wave");
    }
    if (previousMultiplier >= 2 && speedMultiplier < 2) {
      state.dangerZoneActive = false;
    }
    const bossWave = Math.floor(speedMultiplier / 2);
    if (bossWave >= 2 && bossWave > (state.lastBossWaveIndex || 0)) {
      state.lastBossWaveIndex = bossWave;
      state.forceBossSpawn = true;
      logEvent("boss_wave_milestone", { wave: bossWave, speedMultiplier: Number(speedMultiplier.toFixed(2)) });
      setEventMessage(`Boss wave at ${(bossWave * 2).toFixed(0)}x thrust`);
    }
    const sector = getSectorForMultiplier(speedMultiplier);
    if (sector && sector.id !== state.sectorIndex) {
      state.sectorIndex = sector.id;
      state.sectorLabel = sector.label || `Sector ${sector.id}`;
      logEvent("sector_entered", {
        sector: sector.id,
        label: state.sectorLabel,
        speedMultiplier: Number(speedMultiplier.toFixed(2))
      });
      if (sector.bossGate) {
        state.forceBossSpawn = true;
        setEventMessage(`${state.sectorLabel} — boss gate`);
      }
    }
    player.fireBoostTimer = Math.max(0, (player.fireBoostTimer || 0) - dt);
    tickBuffs(dt);
    if (fireHeld || mouseFireHeld) {
      spawnPlayerBullet();
    }
    state.score += dt * (SIM.salvage.scorePerSecond || 14) * (1 + state.cores * (SIM.salvage.coreScoreFactor || 0.015));
    state.bulletCooldown = Math.max(0, (state.bulletCooldown || 0) - dt);
    if (DIAG_ENABLED) {
      state.diagFrames = (state.diagFrames || 0) + 1;
      state.diagMaxDt = Math.max(state.diagMaxDt || 0, dt);
      state.diagSumDt = (state.diagSumDt || 0) + dt;
      if (state.diagFrames % 60 === 0) {
        logEvent("frame_profile", {
          frames: state.diagFrames,
          meanDt: Number(((state.diagSumDt || 0) / 60).toFixed(4)),
          maxDt: Number((state.diagMaxDt || 0).toFixed(4)),
          sparkCount: sparks.length,
          objectCount: objects.length,
          trailCount: trailParticles.length
        });
        state.diagMaxDt = 0;
        state.diagSumDt = 0;
      }
    }
    updateSpeedVisuals(speedMultiplier);
    state.spawnTimer -= dt;

    if (state.spawnTimer <= 0) {
      spawnObject();
      state.spawnTimer = nextSpawnInterval(deciSteps, speedMultiplier);
    }

    let moveX = 0;
    let moveY = 0;
    if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
    if (keys.has("d") || keys.has("arrowright")) moveX += 1;
    if (keys.has("w") || keys.has("arrowup")) moveY += 1;
    if (keys.has("s") || keys.has("arrowdown")) moveY -= 1;
    moveX += touchAxis.x;
    moveY += touchAxis.y;

    const length = Math.hypot(moveX, moveY) || 1;
    moveX /= length;
    moveY /= length;

    const controlSpeed = player.dash > 0 ? 11 : 7.2;
    player.vx = moveX * controlSpeed;
    player.vy = moveY * controlSpeed;
    const bounds = getPlayerBounds();
    player.x = clamp(player.x + player.vx * dt, bounds.xMin, bounds.xMax);
    player.y = clamp(player.y + player.vy * dt, bounds.yMin, bounds.yMax);

    player.dash = Math.max(0, player.dash - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    if (dashRequested && player.dashCooldown <= 0) {
      player.dash = DASH_DURATION;
      player.dashCooldown = DASH_COOLDOWN;
      setEventMessage("Phase dash");
      spawnSparks(player.x, player.y, player.z + 0.4, [0.25, 0.95, 1, 0.9], 18);
      for (let i = 0; i < 8; i++) {
        spawnTrailParticle(true);
      }
    }
    dashRequested = false;

    player.trailTimer -= dt;
    if (player.trailTimer <= 0) {
      spawnTrailParticle();
      player.trailTimer = player.dash > 0 ? 0.026 : 0.055;
    }

    for (let i = objects.length - 1; i >= 0; i--) {
      const object = objects[i];
      object.z += state.speed * dt * (object.type === "boss" ? 0.55 : 1);
      object.rotX += object.spinX * dt;
      object.rotY += object.spinY * dt;
      object.rotZ += object.spinZ * dt;
      if (object.type === "boss") {
        object.bossShootTimer = (object.bossShootTimer || 1.5) - dt;
        if (object.bossShootTimer <= 0 && object.z > -50 && object.z < player.z - 4) {
          spawnBossBullet(object);
          object.bossShootTimer = randomRange(1.4, 2.4);
        }
      }

      let removeObject = false;
      const dz = Math.abs(object.z - player.z);
      if (object.type !== "rangeTarget" && dz < 1.1) {
        const distance = Math.hypot(object.x - player.x, object.y - player.y);
        if (distance < object.radius + player.radius) {
          if (object.type === "boss") {
            if (player.dash > 0) {
              object.hp = (object.hp || 1) - 1;
              spawnSparks(player.x, player.y, player.z, [1, 0.95, 0.32, 1], 12);
              if (object.hp <= 0) {
                state.score += 320;
                setEventMessage("Boss down!");
                spawnSparks(object.x, object.y, object.z, [1, 0.4, 0.92, 1], 30);
                removeObject = true;
                logEvent("boss_destroyed", { method: "ram-dash" });
              }
            } else {
              if (!absorbHullHit()) {
                state.hull -= 1;
                state.hitShakeTime = 0.42;
                state.hitShakeStrength = 1;
                state.hitFlashTimer = 0.42;
                hud.shell.classList.add("is-hit");
                setEventMessage("Boss collision");
                spawnSparks(object.x, object.y, object.z, [1, 0.4, 0.92, 0.95], 26);
                if (navigator.vibrate) {
                  navigator.vibrate([260, 120, 260]);
                }
                if (state.hull <= 0) {
                  attemptGameOver();
                }
              }
            }
          } else {
            if (object.type === "buffOrb") {
              applyBuff(object.buffKind || "overcharge");
              state.score += 110;
              const def = BUFF_DEFS[object.buffKind] || BUFF_DEFS.overcharge;
              spawnSparks(object.x, object.y, object.z, def.color, 24);
            } else if (object.type === "powerOrb") {
              applyBuff("overcharge");
              state.score += 95;
              spawnSparks(object.x, object.y, object.z, [1, 0.62, 0.35, 1], 24);
              logEvent("power_orb_collected", {});
            } else if (object.type === "crystal") {
              state.cores += 1;
              state.score += 140;
              if (state.cores % 7 === 0) {
                state.hull = Math.min(5, state.hull + 1);
                setEventMessage("Hull restored");
              } else {
                setEventMessage("+ Core");
              }
              spawnSparks(object.x, object.y, object.z, [0.45, 0.95, 1, 0.9], 18);
            } else if (player.dash > 0) {
              state.score += 90;
              setEventMessage("Debris phased");
              spawnSparks(object.x, object.y, object.z, [1, 0.82, 0.28, 0.86], 20);
            } else {
              if (!absorbHullHit()) {
                state.hull -= 1;
                state.hitShakeTime = 0.42;
                state.hitShakeStrength = 1;
                state.hitFlashTimer = 0.42;
                hud.shell.classList.add("is-hit");
                setEventMessage("Hull damaged");
                spawnSparks(object.x, object.y, object.z, [1, 0.25, 0.34, 0.94], 26);
                if (navigator.vibrate) {
                  navigator.vibrate([200, 100, 200]);
                }
                if (state.hull <= 0) {
                  attemptGameOver();
                }
              }
            }
            removeObject = true;
          }
        }
      }

      if (!removeObject && object.z > 8) {
        removeObject = true;
      }
      if (removeObject) {
        objects[i] = objects[objects.length - 1];
        objects.pop();
      }
    }

    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const trail = trailParticles[i];
      trail.life -= dt;
      trail.x += trail.vx * dt;
      trail.y += trail.vy * dt;
      trail.z += trail.vz * dt;
      if (trail.life <= 0) {
        trailParticles[i] = trailParticles[trailParticles.length - 1];
        trailParticles.pop();
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.z += spark.vz * dt;
      let removeSpark = false;
      if (spark.kind === "bullet" && spark.team === "player") {
        for (let j = objects.length - 1; j >= 0; j--) {
          const obj = objects[j];
          if (Math.abs(obj.z - spark.z) > 1.0) continue;
          if (Math.hypot(obj.x - spark.x, obj.y - spark.y) > obj.radius + 0.32) continue;
          if (obj.type === "debris") {
            state.score += 60;
            spawnSparks(obj.x, obj.y, obj.z, [1, 0.65, 0.22, 0.9], 14);
            objects[j] = objects[objects.length - 1];
            objects.pop();
            logEvent("debris_destroyed", {});
            removeSpark = !spark.pierce;
            break;
          }
          if (obj.type === "rangeTarget") {
            obj.hp = (obj.hp || 2) - 1;
            spawnSparks(spark.x, spark.y, spark.z, [1, 0.72, 0.2, 1], 10);
            if (obj.hp <= 0) {
              state.score += 150;
              setEventMessage("Target cleared");
              spawnSparks(obj.x, obj.y, obj.z, [1, 0.5, 0.15, 0.95], 20);
              objects[j] = objects[objects.length - 1];
              objects.pop();
              logEvent("range_target_destroyed", {});
            }
            removeSpark = !spark.pierce;
            break;
          }
          if (obj.type === "boss") {
            obj.hp = (obj.hp || 1) - 1;
            spawnSparks(spark.x, spark.y, spark.z, [1, 0.95, 0.32, 1], 8);
            if (obj.hp <= 0) {
              state.score += 320;
              setEventMessage("Boss down!");
              spawnSparks(obj.x, obj.y, obj.z, [1, 0.4, 0.92, 1], 30);
              objects[j] = objects[objects.length - 1];
              objects.pop();
              logEvent("boss_destroyed", { score: 320 });
            }
            removeSpark = !spark.pierce;
            break;
          }
        }
      } else if (spark.kind === "bullet" && spark.team === "boss") {
        if (Math.abs(player.z - spark.z) < 1.0 &&
            Math.hypot(player.x - spark.x, player.y - spark.y) < player.radius + 0.32) {
          if (player.dash <= 0) {
            if (!absorbHullHit()) {
              state.hull -= 1;
              state.hitShakeTime = 0.42;
              state.hitShakeStrength = 1;
              state.hitFlashTimer = 0.42;
              hud.shell.classList.add("is-hit");
              setEventMessage("Boss hit!");
              spawnSparks(spark.x, spark.y, spark.z, [1, 0.32, 0.46, 0.95], 18);
              if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
              }
              if (state.hull <= 0) {
                attemptGameOver();
              }
            }
            removeSpark = true;
          }
        }
      }
      if (removeSpark || spark.life <= 0) {
        sparks[i] = sparks[sparks.length - 1];
        sparks.pop();
      }
    }

    updateHud();
  }

  function updatePresentation(dt) {
    state.frameCounter += 1;
    state.fpsTimer += dt;
    if (state.fpsTimer >= 1) {
      state.fps = state.frameCounter / state.fpsTimer;
      state.frameCounter = 0;
      state.fpsTimer = 0;
      updateHud();
    }

    state.hitShakeTime = Math.max(0, state.hitShakeTime - dt);
    state.hitFlashTimer = Math.max(0, state.hitFlashTimer - dt);
    if (state.hitFlashTimer <= 0) {
      hud.shell.classList.remove("is-hit");
    }

    state.eventTimer = Math.max(0, state.eventTimer - dt);
    if (state.eventTimer <= 0 && state.eventMessage) {
      state.eventMessage = "";
      hud.eventToast.classList.remove("is-visible");
    }

    state.targetFov = player.dash > 0 ? DASH_FOV : BASE_FOV;
    const fovEase = Math.min(1, dt * 10);
    state.currentFov += (state.targetFov - state.currentFov) * fovEase;
    syncShellPlayState();
  }

  function bindMesh(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.vertexAttribPointer(locations.position, 3, gl.FLOAT, false, mesh.stride, 0);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.normal, 3, gl.FLOAT, false, mesh.stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(locations.normal);
    gl.vertexAttribPointer(locations.texCoord, 2, gl.FLOAT, false, mesh.stride, 6 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(locations.texCoord);
  }

  function drawMesh(mesh, options) {
    bindMesh(mesh);
    const matrix = makeModel(options.position, options.rotation, options.scale);
    gl.uniformMatrix4fv(locations.model, false, matrix);
    gl.uniform4fv(locations.color, options.color);
    gl.uniform1f(locations.textureMix, options.textureMix ?? 0.65);
    gl.uniform2fv(locations.uvScale, options.uvScale ?? [1, 1]);
    gl.uniform1f(locations.pulse, options.pulse ?? 0);
    gl.bindTexture(gl.TEXTURE_2D, options.texture);
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  function renderScene(alphaTime) {
    resizeCanvas();
    const aspect = canvas.width / Math.max(1, canvas.height);
    let renderFov = state.currentFov;
    if (isTouchCapable && aspect < 0.92) {
      renderFov *= 1.14;
    }
    Mat4.perspective(projectionMatrix, renderFov, aspect, 0.1, 120);

    const shakeLife = state.hitShakeTime > 0 ? state.hitShakeTime / 0.42 : 0;
    const shakeAmount = shakeLife * shakeLife * state.hitShakeStrength * 0.085;
    const shakeX = Math.sin(alphaTime * 82) * shakeAmount;
    const shakeY = Math.cos(alphaTime * 67) * shakeAmount * 0.72;
    const follow = getCameraFollow();
    Mat4.identity(viewMatrix);
    Mat4.translate(
      viewMatrix,
      viewMatrix,
      [shakeX - player.x * follow.x, shakeY - player.y * follow.y, 0]
    );

    const speedMultiplier = state.lastSpeedMultiplier || 1;
    const speedT = Math.max(0, Math.min(1, (speedMultiplier - 1) / 3.5));
    const dangerLerp = speedMultiplier >= 2
      ? Math.max(0.48, Math.min(1, 0.48 + ((speedMultiplier - 2) / 0.8) * 0.52))
      : speedT * 0.35;
    const calm = [0.01 + speedT * 0.04, 0.012 + speedT * 0.06, 0.022 + speedT * 0.08];
    const danger = [0.22 + speedT * 0.12, 0.04 + speedT * 0.08, 0.12 + speedT * 0.18];
    const cr = calm[0] + (danger[0] - calm[0]) * dangerLerp;
    const cg = calm[1] + (danger[1] - calm[1]) * dangerLerp;
    const cb = calm[2] + (danger[2] - calm[2]) * dangerLerp;
    gl.clearColor(cr, cg, cb, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(locations.view, false, viewMatrix);
    gl.uniformMatrix4fv(locations.projection, false, projectionMatrix);
    gl.uniform1i(locations.texture, 0);
    gl.uniform3fv(locations.lightDirection, LIGHT_DIRECTION);
    gl.uniform1f(locations.ambientLight, 0.28);
    gl.uniform1f(locations.diffuseStrength, 0.86);

    gl.disable(gl.BLEND);
    gl.depthMask(true);

    renderStars(alphaTime);
    renderTunnel(alphaTime);
    renderObjects(alphaTime);
    renderPlayer(alphaTime);
    renderGlowPass(alphaTime);
  }

  function renderGlowPass(alphaTime) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);
    renderPlayerGlow(alphaTime);
    renderCoreGlows(alphaTime);
    renderTrail(alphaTime);
    renderSparks(alphaTime);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  function renderStars(alphaTime) {
    stars.forEach((star) => {
      const wrappedZ = -10 - (((-star.z + state.time * state.speed * 0.72) % 72 + 72) % 72);
      const twinkle = 0.15 + Math.sin(alphaTime * 3 + star.phase) * 0.08;
      drawMesh(meshes.cube, {
        position: [star.x, star.y, wrappedZ],
        rotation: [0, 0, 0],
        scale: [star.size, star.size, star.size],
        color: [0.78, 0.94, 1, 1],
        texture: starTexture,
        textureMix: 0.85,
        pulse: twinkle
      });
    });
  }

  function renderTunnel(alphaTime) {
    const spacing = 6;
    const offset = (state.time * state.speed) % spacing;
    for (let z = -10 + offset; z > -82; z -= spacing) {
      const pulse = 0.05 + Math.sin(alphaTime * 2 + z * 0.2) * 0.04;
      drawMesh(meshes.cube, {
        position: [0, -3.75, z],
        rotation: [0, 0, 0],
        scale: [11.4, 0.08, 0.85],
        color: [0.12, 0.35, 0.52, 1],
        texture: colorTexture,
        textureMix: 0.72,
        uvScale: [10, 1],
        pulse
      });
      drawMesh(meshes.cube, {
        position: [-5.85, 0, z],
        rotation: [0, 0, 0],
        scale: [0.08, 7.4, 0.85],
        color: [0.12, 0.27, 0.48, 1],
        texture: colorTexture,
        textureMix: 0.65,
        uvScale: [1, 7],
        pulse
      });
      drawMesh(meshes.cube, {
        position: [5.85, 0, z],
        rotation: [0, 0, 0],
        scale: [0.08, 7.4, 0.85],
        color: [0.12, 0.27, 0.48, 1],
        texture: colorTexture,
        textureMix: 0.65,
        uvScale: [1, 7],
        pulse
      });
    }
  }

  function renderPlayer(alphaTime) {
    const dashPulse = player.dash > 0 ? 0.75 : 0.12 + Math.sin(alphaTime * 7) * 0.04;
    const shipZ = player.z + 0.45;
    drawMesh(meshes.ship, {
      position: [player.x, player.y, shipZ],
      rotation: [player.vy * -0.035, player.vx * 0.04, player.vx * -0.09],
      scale: isTouchCapable ? [0.82, 0.76, 0.96] : [0.72, 0.66, 0.88],
      color: player.dash > 0 ? [0.35, 0.95, 1, 1] : [0.42, 1, 0.72, 1],
      texture: crystalTexture,
      textureMix: 0.42,
      pulse: dashPulse
    });
  }

  function renderPlayerGlow(alphaTime) {
    if (state.mode !== "playing" && state.mode !== "paused") {
      return;
    }
    const shipZ = player.z + 0.45;
    const pulse = 0.42 + Math.sin(alphaTime * 6) * 0.14;
    drawMesh(meshes.ship, {
      position: [player.x, player.y, shipZ],
      rotation: [player.vy * -0.02, player.vx * 0.02, player.vx * -0.05],
      scale: isTouchCapable ? [0.98, 0.9, 1.12] : [0.86, 0.78, 1],
      color: [0.35, 0.95, 1, isTouchCapable ? 0.42 : 0.28],
      texture: crystalTexture,
      textureMix: 0.18,
      pulse
    });
  }

  function renderObjects(alphaTime) {
    objects.forEach((object) => {
      if (object.type === "crystal") {
        drawMesh(meshes.crystal, {
          position: [object.x, object.y, object.z],
          rotation: [object.rotX, object.rotY + alphaTime * 0.8, object.rotZ],
          scale: [object.size, object.size, object.size],
          color: [0.48, 1, 1, 1],
          texture: crystalTexture,
          textureMix: 0.78,
          pulse: 0.48 + Math.sin(alphaTime * 5 + object.x) * 0.16
        });
      } else if (object.type === "powerOrb") {
        drawMesh(meshes.crystal, {
          position: [object.x, object.y, object.z],
          rotation: [object.rotX, object.rotY + alphaTime * 1.1, object.rotZ],
          scale: [object.size * 1.1, object.size * 1.1, object.size * 1.1],
          color: [1, 0.78, 0.28, 1],
          texture: crystalTexture,
          textureMix: 0.82,
          pulse: 0.55 + Math.sin(alphaTime * 8 + object.y) * 0.22
        });
      } else if (object.type === "buffOrb") {
        const def = BUFF_DEFS[object.buffKind] || BUFF_DEFS.overcharge;
        drawMesh(meshes.crystal, {
          position: [object.x, object.y, object.z],
          rotation: [object.rotX, object.rotY + alphaTime * 1.35, object.rotZ],
          scale: [object.size * 1.15, object.size * 1.15, object.size * 1.15],
          color: def.color,
          texture: crystalTexture,
          textureMix: 0.88,
          pulse: 0.62 + Math.sin(alphaTime * 9 + object.x) * 0.28
        });
      } else if (object.type === "rangeTarget") {
        const hpRatio = Math.max(0.2, (object.hp || 2) / (object.maxHp || 2));
        drawMesh(meshes.cube, {
          position: [object.x, object.y, object.z],
          rotation: [object.rotX + alphaTime * 0.6, object.rotY + alphaTime * 0.9, object.rotZ],
          scale: [object.size * 1.4, object.size * 0.35, object.size * 1.4],
          color: [1, 0.45 + (1 - hpRatio) * 0.35, 0.12, 1],
          texture: warningTexture,
          textureMix: 0.7,
          uvScale: [1.8, 1.8],
          pulse: 0.42 + Math.sin(alphaTime * 11) * 0.2
        });
      } else if (object.type === "boss") {
        const hpRatio = Math.max(0.25, (object.hp || 1) / (object.maxHp || 4));
        drawMesh(meshes.cube, {
          position: [object.x, object.y, object.z],
          rotation: [object.rotX + alphaTime * 0.4, object.rotY + alphaTime * 0.5, object.rotZ],
          scale: [object.size, object.size * 0.9, object.size * 0.95],
          color: [1, 0.32 + (1 - hpRatio) * 0.4, 0.92, 1],
          texture: warningTexture,
          textureMix: 0.62,
          uvScale: [2, 2],
          pulse: 0.55 + Math.sin(alphaTime * 9) * 0.32
        });
      } else {
        drawMesh(meshes.cube, {
          position: [object.x, object.y, object.z],
          rotation: [object.rotX, object.rotY, object.rotZ],
          scale: [object.size * 1.15, object.size * 0.9, object.size],
          color: [1, 0.24, 0.08, 1],
          texture: warningTexture,
          textureMix: 0.82,
          uvScale: [1.5, 1.5],
          pulse: 0.18
        });
      }
    });
  }

  function renderCoreGlows(alphaTime) {
    objects.forEach((object) => {
      if (object.type !== "crystal") {
        return;
      }
      const pulse = 0.45 + Math.sin(alphaTime * 5 + object.x) * 0.18;
      drawMesh(meshes.crystal, {
        position: [object.x, object.y, object.z],
        rotation: [object.rotX * 0.6, object.rotY + alphaTime, object.rotZ],
        scale: [object.size * 1.75, object.size * 1.75, object.size * 1.75],
        color: [0.25, 0.95, 1, 0.22],
        texture: crystalTexture,
        textureMix: 0.45,
        pulse
      });
    });
  }

  function renderTrail(alphaTime) {
    trailParticles.forEach((trail) => {
      const lifeRatio = Math.max(0, trail.life / trail.maxLife);
      drawMesh(meshes.cube, {
        position: [trail.x, trail.y, trail.z],
        rotation: [alphaTime * 2.4, alphaTime * 3.2, alphaTime * 1.7],
        scale: [trail.size * lifeRatio, trail.size * lifeRatio, trail.size * 1.8 * lifeRatio],
        color: [trail.color[0], trail.color[1], trail.color[2], trail.color[3] * lifeRatio],
        texture: starTexture,
        textureMix: 0.7,
        pulse: 0.9 * lifeRatio
      });
    });
  }

  function renderSparks(alphaTime) {
    sparks.forEach((spark) => {
      const lifeRatio = Math.max(0, spark.life / spark.maxLife);
      drawMesh(meshes.cube, {
        position: [spark.x, spark.y, spark.z],
        rotation: [alphaTime * 3, alphaTime * 4, alphaTime * 2],
        scale: [spark.size * lifeRatio, spark.size * lifeRatio, spark.size * lifeRatio],
        color: [spark.color[0], spark.color[1], spark.color[2], spark.color[3] * lifeRatio],
        texture: starTexture,
        textureMix: 0.55,
        pulse: 0.95 * lifeRatio
      });
    });
  }

  function frame(time) {
    const seconds = time * 0.001;
    const dt = Math.min(0.033, seconds - (state.lastTime || seconds));
    state.lastTime = seconds;
    if (contextLost || document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    if (state.mode === "revive") {
      tickRevive(dt);
    } else {
      updateGame(dt);
    }
    updatePresentation(dt);
    renderScene(seconds);
    requestAnimationFrame(frame);
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.activeTexture(gl.TEXTURE0);
  resizeCanvas();

  async function boot() {
    refreshRenderBudgetLimits();
    await loadSimLaw();
    applyPilotPalette(pilotProfile.palette || "default");
    const squadParam = new URLSearchParams(window.location.search).get("squad");
    if (squadParam && hud.accessCodeInput) {
      hud.accessCodeInput.value = squadParam.slice(0, 32);
      setEventMessage(`Squad lane opened — code ${squadParam}`);
    }
    updatePilotBadge();
    resetGame();
    refreshLeaderboard({ quiet: true });
    requestAnimationFrame(frame);
  }

  boot();
})();
