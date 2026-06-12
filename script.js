/* ===== Nav ===== */
const nav = document.getElementById('nav');
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

/* ===== Parallax hero ===== */
const heroEl = document.getElementById('hero');
function applyHeroParallax() {
  if (!heroEl || document.documentElement.classList.contains('journey-on')) return;
  const scrollY = window.scrollY;
  heroEl.style.backgroundPositionY = `calc(50% + ${scrollY * 0.32}px)`;
}

/* ===== Background color per chapter ===== */
const chapters = document.querySelectorAll('.chapter');
const heroBg = '#0d0d0d';
let activeBg = heroBg;

function syncBg() {
  let next = heroBg;
  chapters.forEach(ch => {
    if (ch.getBoundingClientRect().top <= window.innerHeight * 0.5) {
      next = ch.dataset.bg;
    }
  });
  if (next !== activeBg) {
    activeBg = next;
    document.body.style.backgroundColor = next;
  }
}

/* ===== Unified rAF scroll handler ===== */
let rafPending = false;
window.addEventListener('scroll', () => {
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      syncBg();
      applyHeroParallax();
      rafPending = false;
    });
  }
}, { passive: true });

/* ===== Mobile menu ===== */
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  links.classList.toggle('open', !open);
});

links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('open');
  });
});

/* ===== Scroll reveal (section elements) ===== */
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.10, rootMargin: '0px 0px -48px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
/* chapter-header の line-draw アニメーション用 */
document.querySelectorAll('.chapter-header').forEach(el => revealObserver.observe(el));

/* ===== Stagger list items ===== */
document.querySelectorAll(
  '.product-list, .research-list, .book-list, .timeline-list, .award-list, .menu-list, .concept-list, .notice-list'
).forEach(list => {
  const items = Array.from(list.querySelectorAll(':scope > li'));
  items.forEach((item, i) => {
    item.classList.add('stagger-item');
    item.style.transitionDelay = `${i * 0.07}s`;
  });
});

const staggerObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      staggerObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
);
document.querySelectorAll('.stagger-item').forEach(el => staggerObserver.observe(el));

/* ===== Lightbox ===== */
(function initLightbox() {
  const cells = document.querySelectorAll('.photo-category-cell[style*="background-image"]');
  if (!cells.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<button class="lightbox-close" aria-label="閉じる">&times;</button><img src="" alt="">';
  document.body.appendChild(lb);

  const img = lb.querySelector('img');
  const closeBtn = lb.querySelector('.lightbox-close');

  function openLightbox(url) {
    img.src = url;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  cells.forEach(cell => {
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', () => {
      const bg = cell.style.backgroundImage;
      const match = bg.match(/url\(['"]?(.+?)['"]?\)/);
      if (match) openLightbox(match[1]);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
})();

/* ===== Custom cursor (desktop only) ===== */
(function initCursor() {
  if ('ontouchstart' in window) return;

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot  hidden';
  ring.className = 'cursor-ring hidden';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mx = 0, my = 0;   /* current mouse */
  let rx = 0, ry = 0;   /* ring (lerped) */

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    dot.classList.remove('hidden');
    ring.classList.remove('hidden');
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    dot.classList.add('hidden');
    ring.classList.add('hidden');
  });

  /* smooth follow for ring */
  function animateCursor() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  /* scale ring on interactive elements */
  document.querySelectorAll('a, button, .btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });
})();

/* ===== Journey background：スクロールで宇宙→空→木（螺旋）→水面→水中 ===== */
(function initJourney() {
  /* トップページ専用（サブページには journey の対象セクションがない） */
  if (!document.getElementById('hero') || !document.getElementById('salon')) return;
  let gl = null;
  const canvas = document.createElement('canvas');
  canvas.id = 'journey-canvas';
  try {
    gl = canvas.getContext('webgl', {
      antialias: false, depth: false, alpha: true, premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
  } catch (e) { gl = null; }
  if (!gl) return;   /* WebGL 非対応環境は従来の背景のまま */

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = 'ontouchstart' in window || Math.min(screen.width, screen.height) < 768;
  const COUNT = MOBILE ? 24000 : 52000;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  let rafId = null;
  let removed = false;
  let restoreContent = null;   /* ギャラリー初期化後に設定（コンテキストロスト時の完全復元） */
  function cleanup() {
    if (removed) return;
    removed = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('load', computeAnchors);
    document.removeEventListener('mousemove', onMouseMove);
    root.classList.remove('journey-on');
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (bgHost.parentNode) bgHost.parentNode.removeChild(bgHost);
    if (rail.parentNode) rail.parentNode.removeChild(rail);
    /* JSが書き込んだインラインスタイル・DOM移動を戻し、従来表示に完全復帰する */
    if (restoreContent) restoreContent();
  }

  /* --- shader helpers --- */
  function compile(type, srcText) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, srcText);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
    return sh;
  }
  function program(vsText, fsText, binds) {
    const vs = compile(gl.VERTEX_SHADER, vsText);
    const fs = compile(gl.FRAGMENT_SHADER, fsText);
    if (!vs || !fs) return null;
    const pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    /* 属性番号を明示割当（背景用と衝突させない） */
    binds.forEach(([idx, name]) => gl.bindAttribLocation(pr, idx, name));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    return pr;
  }

  const POINT_VS = `
attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2;
attribute vec3 aP3; attribute vec3 aP4;
attribute vec4 aSeed;
uniform float uScene;
uniform float uTime;
uniform float uMotion;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec3 uColA[5];
uniform vec3 uColB[5];
uniform float uHalo;
varying vec3 vColor;
varying float vAlpha;
varying float vInner;
varying float vShape;

float wgt(float k) { return clamp(1.0 - abs(uScene - k), 0.0, 1.0); }

void main() {
  float w0 = wgt(0.0), w1 = wgt(1.0), w2 = wgt(2.0), w3 = wgt(3.0), w4 = wgt(4.0);
  vec3 pos = aP0*w0 + aP1*w1 + aP2*w2 + aP3*w3 + aP4*w4;

  /* 場面転換のたびに粒子が爆ぜて再集合する */
  float f = fract(uScene);
  float burst = sin(f * 3.14159);
  vec3 dir = normalize(aSeed.xyz - 0.5 + vec3(0.001));
  pos += dir * burst * (0.18 + aSeed.w * 0.5) * uMotion;

  /* 生きている揺らぎ */
  pos += vec3(
    sin(uTime * (0.4 + aSeed.x * 0.7) + aSeed.y * 6.28),
    cos(uTime * (0.3 + aSeed.y * 0.7) + aSeed.z * 6.28),
    sin(uTime * (0.5 + aSeed.z * 0.7) + aSeed.x * 6.28)
  ) * 0.014 * uMotion;

  /* 雲の横流れ */
  pos.x += sin(uTime * 0.07 + aSeed.x * 6.28) * 0.18 * w1 * uMotion;

  /* 水面：上から雫が落ちて吸い込まれる */
  float isDrop = step(0.06, aP3.y);
  float fall = fract(aSeed.w * 7.0 + uTime * 0.22 * (0.5 + aSeed.x));
  float dropY = (0.25 + aSeed.y * 0.55) * (1.0 - fall * fall);
  pos.y = mix(pos.y, dropY, isDrop * w3 * uMotion);

  /* 水面のうねり */
  pos.y += (sin(pos.x * 5.0 + uTime * 1.4) + cos(pos.z * 4.0 + uTime)) * 0.035 * w3 * uMotion * (1.0 - isDrop * 0.7);

  /* 水中：ゆっくり立ちのぼる */
  float rise = (fract(aSeed.z + uTime * 0.02 * (0.4 + aSeed.w)) - 0.5) * 2.2;
  pos.y = mix(pos.y, rise, 0.3 * w4 * uMotion);

  /* 回転：銀河はゆっくり・木の螺旋はねじれながら強く回る */
  float rot = (uTime * (0.05 * w0 + 0.35 * w2) + pos.y * 0.5 * w2 * sin(uTime * 0.25)) * uMotion;
  float c = cos(rot), s = sin(rot);
  pos.xz = mat2(c, -s, s, c) * pos.xz;

  /* カメラ（マウス視差・少し見下ろし／木の場面ではさらに俯瞰して螺旋を立体に見せる） */
  float ry = uMouse.x * 0.12;
  float rx = 0.12 - uMouse.y * 0.08 + 0.24 * w2;
  float cy = cos(ry), sy = sin(ry);
  pos.xz = mat2(cy, -sy, sy, cy) * pos.xz;
  float cx = cos(rx), sx = sin(rx);
  pos.yz = mat2(cx, -sx, sx, cx) * pos.yz;
  float camDist = 2.15 - 0.35 * w2;
  vec3 view = pos - vec3(0.0, 0.0, camDist);

  float depth = -view.z;
  float aspect = uRes.x / uRes.y;

  /* マウスに反応：近くの粒子が逃げながら渦を巻く */
  vec2 ndc = vec2(view.x * 1.7 / aspect, view.y * 1.7) / max(depth, 0.1);
  vec2 dm = ndc - uMouse * vec2(1.0, -1.0);
  float md = length(dm);
  float push = smoothstep(0.55, 0.0, md) * 0.20 * uMotion;
  vec2 pdir = dm / max(md, 0.001);
  vec2 swirl = vec2(-pdir.y, pdir.x);
  view.xy += (pdir * 0.7 + swirl * 0.6) * push * depth / 1.7;

  gl_Position = vec4(view.x * 1.7 / aspect, view.y * 1.7, 0.0, depth);

  /* 被写界深度：ピント面から離れるほど大きく・薄く・柔らかく（ボケ） */
  float coc = clamp(abs(depth - camDist) * 0.85, 0.0, 1.0);

  float sizeMod = 1.0 + w1 * 4.2 + w4 * 0.4;
  gl_PointSize = min((0.7 + aSeed.w * 2.2) * sizeMod * (1.0 + coc * 2.1) * uRes.y * 0.002 / max(depth, 0.1), 56.0);
  /* グロー用ハローパス：大きく淡く */
  gl_PointSize = min(gl_PointSize * (1.0 + uHalo * 2.4), 72.0);

  float base = 0.16 + aSeed.x * 0.5;
  base *= 1.0 - w1 * 0.8;   /* 雲は柔らかく */
  vAlpha = base * smoothstep(4.5, 1.4, depth) * smoothstep(0.05, 0.35, depth);
  /* 木の場面：手前の粒を明るくして立体感を強調 */
  vAlpha *= 1.0 + w2 * clamp(2.2 - depth, 0.0, 1.2) * 0.7;
  /* ボケた粒は薄く・ハローはさらに淡く */
  vAlpha *= 1.0 / (1.0 + coc * 2.4);
  vAlpha *= mix(1.0, 0.15, uHalo);
  /* 粒の輪郭：ピントが合うほどシャープ・ハローはフルソフト */
  vInner = mix(0.40 - coc * 0.38, 0.0, uHalo);
  vShape = aSeed.z;

  vColor = mix(uColA[0], uColB[0], aSeed.y) * w0
         + mix(uColA[1], uColB[1], aSeed.y) * w1
         + mix(uColA[2], uColB[2], aSeed.y) * w2
         + mix(uColA[3], uColB[3], aSeed.y) * w3
         + mix(uColA[4], uColB[4], aSeed.y) * w4;
}
`;

  const POINT_FS = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
varying float vInner;
varying float vShape;
void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float a;
  if (vShape < 0.78) {
    /* 丸い粒 */
    a = smoothstep(0.5, vInner, length(pc));
  } else if (vShape < 0.94) {
    /* 縦に流れる筋 */
    a = smoothstep(0.5, vInner * 0.5, length(vec2(pc.x * 2.4, pc.y * 0.9)));
  } else {
    /* 鋭い輝点（中心が強い） */
    float r = length(pc);
    a = smoothstep(0.5, 0.02, r) * (0.55 + 0.45 * smoothstep(0.18, 0.0, r));
  }
  a *= vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}
`;

  const BG_VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

  const BG_FS = `
precision mediump float;
varying vec2 vUv;
uniform vec3 uTop;
uniform vec3 uBot;
uniform float uAlpha;
void main() {
  vec3 c = mix(uBot, uTop, vUv.y);
  float d = distance(vUv, vec2(0.5));
  c *= 1.0 - smoothstep(0.45, 0.95, d) * 0.45;
  /* 半透明：奥のセクション背景写真が透ける（TOPでは薄く） */
  gl_FragColor = vec4(c, uAlpha);
}
`;

  const pointPr = program(POINT_VS, POINT_FS,
    [[0,'aP0'],[1,'aP1'],[2,'aP2'],[3,'aP3'],[4,'aP4'],[5,'aSeed']]);
  const bgPr = program(BG_VS, BG_FS, [[6,'aPos']]);
  if (!pointPr || !bgPr) return;

  /* --- 5つの場面の粒子配置 --- */
  const rand = Math.random;
  function gauss() { return (rand() + rand() + rand() - 1.5) * 0.8; }

  function genGalaxy(n) {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      let x, y, z;
      if (rand() < 0.78) {
        /* 3本腕の渦巻銀河 */
        const r = Math.pow(rand(), 0.55);
        const arm = (i % 3) * (Math.PI * 2 / 3);
        const ang = arm + r * 4.0 + gauss() * 0.22;
        x = Math.cos(ang) * r * 1.25;
        z = Math.sin(ang) * r * 1.25;
        y = gauss() * 0.05 * (1.3 - r);
      } else {
        /* ハロー（外周の星） */
        const R = 0.15 + Math.pow(rand(), 2) * 1.2;
        const th = rand() * Math.PI * 2;
        const ph = Math.acos(rand() * 2 - 1);
        x = R * Math.sin(ph) * Math.cos(th);
        y = R * Math.cos(ph) * 0.7;
        z = R * Math.sin(ph) * Math.sin(th);
      }
      /* 銀河を傾けて立体感を出す */
      const tilt = 0.45, ct = Math.cos(tilt), st = Math.sin(tilt);
      a[i*3] = x;
      a[i*3+1] = y * ct - z * st;
      a[i*3+2] = y * st + z * ct;
    }
    return a;
  }

  function genSky(n) {
    const blobs = Array.from({ length: 8 }, () => [
      (rand() - 0.5) * 2.4, (rand() - 0.5) * 1.1, (rand() - 0.5) * 1.4,
    ]);
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      if (rand() < 0.7) {
        const b = blobs[(rand() * blobs.length) | 0];
        a[i*3]   = b[0] + gauss() * 0.55;
        a[i*3+1] = b[1] + gauss() * 0.22;
        a[i*3+2] = b[2] + gauss() * 0.4;
      } else {
        a[i*3] = (rand()-0.5)*3; a[i*3+1] = (rand()-0.5)*2; a[i*3+2] = (rand()-0.5)*2;
      }
    }
    return a;
  }

  function genTree(n) {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rand(), p = rand();
      let x, y, z;
      if (p < 0.30) {
        /* 幹＝脊髄：中心にそびえる節くれだった柱 */
        const seg = Math.floor(rand() * 16);
        y = -1.05 + seg * 0.14 + gauss() * 0.03;
        const r = 0.045 + (seg % 2) * 0.022;   /* 節ごとに太さが脈打つ */
        x = gauss() * r;
        z = gauss() * r;
      } else if (p < 0.78) {
        /* 幹に絡む二重らせん（チューブ状の太さ） */
        const strand = (i % 2) * Math.PI;
        const ang = u * Math.PI * 8.0 + strand;
        const radius = 0.10 + u * 0.42;
        x = Math.cos(ang) * radius + gauss() * 0.04;
        y = 1.0 - u * 2.1 + gauss() * 0.035;
        z = Math.sin(ang) * radius + gauss() * 0.04;
      } else {
        /* 舞う葉 */
        x = (rand()-0.5)*2.6; y = (rand()-0.5)*2.2; z = (rand()-0.5)*2.0;
      }
      a[i*3] = x; a[i*3+1] = y; a[i*3+2] = z;
    }
    return a;
  }

  function genSurface(n) {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      if (rand() < 0.8) {
        a[i*3]   = (rand()-0.5)*3.2;
        a[i*3+1] = gauss() * 0.03;
        a[i*3+2] = (rand()-0.5)*2.6;
      } else {
        /* 雫（上から水面へ落ちる粒） */
        a[i*3] = (rand()-0.5)*2.8; a[i*3+1] = 0.1 + rand()*0.5; a[i*3+2] = (rand()-0.5)*2.2;
      }
    }
    return a;
  }

  function genDeep(n) {
    const cols = Array.from({ length: 5 }, () => [(rand()-0.5)*1.8, (rand()-0.5)*1.4]);
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = rand();
      let x, y, z;
      if (p < 0.55) {
        /* 漂う微粒子 */
        x = (rand()-0.5)*3; y = (rand()-0.5)*2.4; z = (rand()-0.5)*2.4;
      } else if (p < 0.85) {
        /* 泡の柱 */
        const c = cols[(rand() * cols.length) | 0];
        x = c[0] + gauss()*0.07; y = (rand()-0.5)*2.4; z = c[1] + gauss()*0.07;
      } else {
        /* 上から差す光 */
        x = gauss()*0.5; y = 0.4 + rand()*0.9; z = gauss()*0.4;
      }
      a[i*3] = x; a[i*3+1] = y; a[i*3+2] = z;
    }
    return a;
  }

  const seeds = new Float32Array(COUNT * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rand();

  function bindAttr(pr, name, data, size) {
    const loc = gl.getAttribLocation(pr, name);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  gl.useProgram(pointPr);
  bindAttr(pointPr, 'aP0', genGalaxy(COUNT), 3);
  bindAttr(pointPr, 'aP1', genSky(COUNT), 3);
  bindAttr(pointPr, 'aP2', genTree(COUNT), 3);
  bindAttr(pointPr, 'aP3', genSurface(COUNT), 3);
  bindAttr(pointPr, 'aP4', genDeep(COUNT), 3);
  bindAttr(pointPr, 'aSeed', seeds, 4);

  /* 場面ごとの粒子カラー（A/Bを粒子ごとに混ぜる） */
  function hex(c) {
    return [parseInt(c.slice(1,3),16)/255, parseInt(c.slice(3,5),16)/255, parseInt(c.slice(5,7),16)/255];
  }
  const colA = [hex('#ffffff'), hex('#ffffff'), hex('#a8c386'), hex('#d9f4ff'), hex('#7fc4d8')];
  const colB = [hex('#8fb0ff'), hex('#cfe2f0'), hex('#e6d6a0'), hex('#7fd2e6'), hex('#1f6a85')];
  gl.uniform3fv(gl.getUniformLocation(pointPr, 'uColA[0]'), colA.flat());
  gl.uniform3fv(gl.getUniformLocation(pointPr, 'uColB[0]'), colB.flat());

  const uScene = gl.getUniformLocation(pointPr, 'uScene');
  const uHalo = gl.getUniformLocation(pointPr, 'uHalo');
  const uTime = gl.getUniformLocation(pointPr, 'uTime');
  const uMotion = gl.getUniformLocation(pointPr, 'uMotion');
  const uRes = gl.getUniformLocation(pointPr, 'uRes');
  const uMouse = gl.getUniformLocation(pointPr, 'uMouse');

  /* 背景クアッド */
  gl.useProgram(bgPr);
  const bgBuf = gl.createBuffer();
  const bgLoc = gl.getAttribLocation(bgPr, 'aPos');
  gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const uTop = gl.getUniformLocation(bgPr, 'uTop');
  const uBot = gl.getUniformLocation(bgPr, 'uBot');
  const uBgAlpha = gl.getUniformLocation(bgPr, 'uAlpha');

  /* 場面ごとの背景グラデーション [top, bottom] */
  const BG = [
    [hex('#05030f'), hex('#0e0a24')],   /* 宇宙 */
    [hex('#1d4060'), hex('#47678c')],   /* 空 */
    [hex('#14231a'), hex('#091108')],   /* 木 */
    [hex('#0d3e51'), hex('#082b3c')],   /* 水面 */
    [hex('#03141f'), hex('#01070c')],   /* 水中 */
  ];
  function bgColor(v) {
    const i = Math.max(0, Math.min(3, Math.floor(v)));
    const f = Math.max(0, Math.min(1, v - i));
    const mix = (a, b) => [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f];
    return [mix(BG[i][0], BG[i+1][0]), mix(BG[i][1], BG[i+1][1])];
  }

  /* --- スクロール → 場面値（セクション中心をアンカーにする） --- */
  const SECTION_SCENE = [
    ['hero', 0, 'images/hero-bg.jpg'],
    ['salon', 1, 'images/salon-bg.jpg'],
    ['photography', 2, 'images/photography-bg.jpg'],
    ['products', 3, 'images/products-bg.jpg'],
    ['research', 4, 'images/research-bg.jpg'],
    ['contact', 4, 'images/contact-bg.jpg'],
  ];
  let anchors = [];
  let secRanges = [];
  function computeAnchors() {
    anchors = [];
    secRanges = [];
    SECTION_SCENE.forEach(entry => {
      const el = document.getElementById(entry[0]);
      if (!el) return;
      /* 各セクションの中腹に同値の区間を作り、場面が一瞬で通過しないようにする */
      anchors.push([el.offsetTop + el.offsetHeight * 0.35, entry[1]]);
      anchors.push([el.offsetTop + el.offsetHeight * 0.65, entry[1]]);
      secRanges.push([el.offsetTop, entry[2]]);
    });
  }

  /* 旅の現在地レール */
  const RAIL = [
    ['hero', 'Space'], ['salon', 'Sky'], ['photography', 'Tree'],
    ['products', 'Surface'], ['research', 'Deep'],
  ];
  const rail = document.createElement('nav');
  rail.id = 'journey-rail';
  rail.setAttribute('aria-label', '場面ナビゲーション');
  const railDots = RAIL.map(item => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'journey-rail-dot';
    b.setAttribute('data-label', item[1]);
    b.setAttribute('aria-label', item[1]);
    b.addEventListener('click', () => {
      const el = document.getElementById(item[0]);
      if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    });
    rail.appendChild(b);
    return b;
  });
  let railActive = -1;
  function updateRail() {
    const idx = Math.max(0, Math.min(4, Math.round(scene)));
    if (idx === railActive) return;
    railActive = idx;
    railDots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  /* 元のセクション背景写真：粒子の奥でクロスフェード */
  const bgHost = document.createElement('div');
  bgHost.id = 'journey-bg';
  const bgLayerA = document.createElement('div');
  const bgLayerB = document.createElement('div');
  bgLayerA.className = 'journey-bg-layer';
  bgLayerB.className = 'journey-bg-layer';
  bgHost.appendChild(bgLayerA);
  bgHost.appendChild(bgLayerB);

  let bgCurrent = '';
  let bgFlip = false;
  function updateBackdrop() {
    if (!secRanges.length) return;
    const y = window.scrollY + window.innerHeight * 0.5;
    let img = secRanges[0][1];
    for (let i = 0; i < secRanges.length; i++) {
      if (y >= secRanges[i][0]) img = secRanges[i][1];
    }
    if (img === bgCurrent) return;
    bgCurrent = img;
    bgFlip = !bgFlip;
    const showEl = bgFlip ? bgLayerA : bgLayerB;
    const hideEl = bgFlip ? bgLayerB : bgLayerA;
    showEl.style.backgroundImage = 'url("' + img + '")';
    showEl.classList.add('on');
    hideEl.classList.remove('on');
  }
  function sceneFromScroll() {
    if (!anchors.length) return 0;
    const y = window.scrollY + window.innerHeight * 0.5;
    if (y <= anchors[0][0]) return anchors[0][1];
    for (let i = 0; i < anchors.length - 1; i++) {
      const a0 = anchors[i], a1 = anchors[i + 1];
      if (y < a1[0]) return a0[1] + (a1[1] - a0[1]) * ((y - a0[0]) / (a1[0] - a0[0]));
    }
    return anchors[anchors.length - 1][1];
  }

  let W, H;
  function resize() {
    /* iOS Safariはスクロール中にアドレスバー伸縮でresizeを連発する。寸法不変なら何もしない */
    if (W === window.innerWidth && H === window.innerHeight) return;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    gl.viewport(0, 0, canvas.width, canvas.height);
    computeAnchors();
  }

  /* --- 起動 --- */
  document.body.insertBefore(canvas, document.body.firstChild);
  document.body.insertBefore(bgHost, canvas);
  document.body.appendChild(rail);
  root.classList.add('journey-on');
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('load', computeAnchors);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cleanup(); });

  let mouseX = 0, mouseY = 0, mx = 0, my = 0;
  function onMouseMove(e) {
    mouseX = (e.clientX / W) * 2 - 1;
    mouseY = (e.clientY / H) * 2 - 1;
  }
  document.addEventListener('mousemove', onMouseMove, { passive: true });

  /* 螺旋状のウィンドウ展開：セクション内容が3D回転しつつ弧を描いて通過する */
  const contentEls = Array.prototype.slice.call(document.querySelectorAll('.chapter-inner'))
    .filter(el => !el.closest('#products') && !el.closest('#research') && !el.closest('#contact'));
  const heroInner = document.querySelector('.hero-inner');
  /* 縦螺旋ウィンドウギャラリー（Products＋Research） */
  const galleries = [];
  const movedBooks = [];        /* Products へ移した写真集 li（復元用） */
  let movedBooksHome = null;    /* 元の book-list */
  const createdFlowUls = [];    /* 動的生成した photo-flow の ul（復元用） */

  (function setupProductsGallery() {
    const sec = document.getElementById('products');
    const list = document.querySelector('.product-list');
    if (!sec || !list) return;
    /* 写真集は1冊ずつ独立した小窓としてギャラリー後半に流す */
    const bookList = sec.querySelector('.book-list');
    if (bookList) {
      Array.prototype.slice.call(bookList.children).forEach(li => {
        li.classList.add('product-item', 'product-item--book');
        movedBooks.push(li);
        list.appendChild(li);
      });
      movedBooksHome = bookList;
    }
    const items = Array.prototype.slice.call(list.children);
    /* 写真集は間隔を詰めて流す（かたまり防止と尺の両立） */
    let acc = 0;
    const pos = items.map((el, i) => {
      if (i === 0) return 0;
      acc += el.classList.contains('product-item--book') ? 0.62 : 1.0;
      return acc;
    });
    galleries.push({
      sec: sec, items: items, pos: pos, maxPos: acc,
      latMax: 250, latFrac: 0.17, twist: 1.4,
    });
  })();

  (function setupResearchGallery() {
    const sec = document.getElementById('research');
    const list = document.querySelector('.research-list');
    if (!sec || !list) return;
    /* ねじれ幅は細め */
    const items = Array.prototype.slice.call(list.children);
    galleries.push({
      sec: sec, items: items,
      pos: items.map((el, i) => i), maxPos: items.length - 1,
      latMax: 130, latFrac: 0.09, twist: 1.1,
    });
  })();

  /* Salon・Photography：写真ウィンドウの縦螺旋フロー */
  (function setupPhotoFlows() {
    const flows = [
      ['salon', [
        'images/salon/salon-1.jpg', 'images/salon/salon-2.jpg', 'images/salon/salon-3.jpg',
        'images/salon/salon-4.jpg', 'images/salon/salon-5.jpg', 'images/salon/salon-6.jpg',
      ], { latMax: 200, latFrac: 0.14, twist: 1.2 }],
      ['photography', [
        'images/journey/photo-1.jpg', 'images/journey/photo-2.jpg', 'images/journey/photo-3.jpg',
        'images/journey/photo-4.jpg', 'images/journey/photo-5.jpg', 'images/journey/photo-6.jpg',
        'images/journey/photo-7.jpg', 'images/journey/photo-8.jpg',
      ], { latMax: 360, latFrac: 0.25, twist: 1.3, mode: 'branch' }],
    ];
    flows.forEach(flow => {
      const sec = document.getElementById(flow[0]);
      const inner = sec && sec.querySelector('.chapter-inner');
      if (!inner) return;
      const ul = document.createElement('ul');
      ul.className = 'photo-flow';
      createdFlowUls.push(ul);
      const items = flow[1].map(srcPath => {
        const li = document.createElement('li');
        li.className = 'photo-flow-item';
        const img = document.createElement('img');
        img.src = srcPath;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        li.appendChild(img);
        ul.appendChild(li);
        return li;
      });
      inner.appendChild(ul);
      galleries.push({
        sec: sec, items: items,
        pos: items.map((el, i) => i), maxPos: items.length - 1,
        latMax: flow[2].latMax, latFrac: flow[2].latFrac, twist: flow[2].twist,
        mode: flow[2].mode,
        /* 枝葉モードは幹が中心なのでオフセットなし・通常フローは左パネルを避けて右寄り */
        oxFrac: flow[2].mode === 'branch' ? 0 : 0.09,
      });
    });
  })();

  /* コンテキストロスト時：インラインスタイルとDOM移動をすべて元に戻す */
  restoreContent = function () {
    galleries.forEach(g => {
      g.items.forEach(el => { el.style.cssText = ''; el.inert = false; });
    });
    contentEls.forEach(el => { el.style.cssText = ''; });
    if (heroInner) heroInner.style.cssText = '';
    createdFlowUls.forEach(ul => { if (ul.parentNode) ul.parentNode.removeChild(ul); });
    if (movedBooksHome) {
      movedBooks.forEach(li => {
        li.classList.remove('product-item', 'product-item--book');
        movedBooksHome.appendChild(li);
      });
    }
  };

  /* センターでロック：各ウィンドウが正面で一瞬とどまる磁石カーブ（不等間隔対応） */
  function detent(G, pos) {
    if (G <= pos[0]) return G;
    for (let k = 0; k < pos.length - 1; k++) {
      if (G < pos[k + 1]) {
        const span = pos[k + 1] - pos[k];
        const t = (G - pos[k]) / span;
        return pos[k] + (t - Math.sin(t * Math.PI * 2) * 0.13) * span;
      }
    }
    return G;
  }

  function updateGalleries(vh) {
    galleries.forEach(g => {
      const r = g.sec.getBoundingClientRect();
      const total = r.height - vh;
      const prog = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
      const G = detent(prog * g.maxPos, g.pos);
      const lateral = Math.min(g.latMax, W * g.latFrac);
      const ox = (g.oxFrac && W > 960) ? W * g.oxFrac : 0;
      g.items.forEach((el, i) => {
        /* q = 0 でウィンドウが正面・±で上下へ流れる */
        const q = G - g.pos[i];
        if (q < -1.7 || q > 2.4) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';   /* Tab・スクリーンリーダーからも除外 */
          el.style.pointerEvents = 'none';
          el.inert = true;
          return;
        }
        el.style.visibility = 'visible';
        const y = -q * vh * 0.58;
        /* 貫通する奥行き：手前(+)から飛び込み、正面でピント、奥(-)へ抜ける。
           手前は抑えめにしてセンターが最大サイズになる */
        const zThrough = q < 0 ? -q * 240 : -q * 440;
        let open = 1 - Math.min(1, Math.abs(q));
        open = open * open * (3 - 2 * open);
        /* センターで一番大きく：手前側は遠近の拡大を打ち消し、純粋なピント送りで近づく */
        let scaleLock = 0.85 + 0.40 * open;   /* センター最大125% */
        if (q < 0) scaleLock *= (1100 - zThrough) / 1100;
        let transform;
        if (g.mode === 'branch') {
          /* 枝葉：幹（中心の柱）から左右交互に葉が開くように展開
             スマホは張り出しを縮めて写真が画面端で切れないようにする */
          const side = (i % 2 === 0) ? 1 : -1;
          const sideBase = W < 760 ? 10 : 56;
          const sideLat = W < 760 ? Math.min(44, W * 0.1) : lateral;
          const x = side * (sideBase + open * sideLat);
          transform =
            'translateY(-50%)' +
            ' translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, ' + zThrough.toFixed(1) + 'px)' +
            ' rotateY(' + (side * (1 - open) * -62).toFixed(1) + 'deg)' +
            ' scale(' + scaleLock.toFixed(3) + ')';
        } else {
          /* 縦に流れる螺旋：下から湧き、ねじれながら上へ抜ける（折り返しなしの単調軌道） */
          const phi = q * g.twist;
          const drift = Math.tanh(phi);          /* -1〜1 で滑らかに飽和 */
          const x = drift * lateral + ox;
          transform =
            'translateY(-50%)' +
            ' translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, ' + zThrough.toFixed(1) + 'px)' +
            ' rotateY(' + (drift * -30).toFixed(1) + 'deg)' +
            ' rotateZ(' + (q * -4).toFixed(1) + 'deg)' +
            ' scale(' + scaleLock.toFixed(3) + ')';
        }
        el.style.transform = transform;
        /* 手前側は速く・奥側はゆっくり消える */
        const fade = q < 0 ? 1 + q * 0.62 : 1 - q * 0.42;
        el.style.opacity = Math.max(0, Math.min(1, fade)).toFixed(3);
        /* 被写界深度：ピントから離れるほどボケる（手前は強く） */
        const blurPx = Math.min(6, Math.abs(q) * (q < 0 ? 3.4 : 1.9));
        el.style.filter = blurPx > 0.15 ? 'blur(' + blurPx.toFixed(2) + 'px)' : '';
        el.style.zIndex = String(200 - Math.round(q * 20));
        el.style.pointerEvents = Math.abs(q) < 0.5 ? 'auto' : 'none';
        /* マウスで押せない窓はキーボード（Tab）からも除外して整合させる */
        el.inert = Math.abs(q) >= 0.5;
      });
    });
  }

  function updateContent() {
    const vh = window.innerHeight;
    updateGalleries(vh);
    if (reduced) return;
    contentEls.forEach(el => {
      const r = el.getBoundingClientRect();
      let c = (r.top + r.height / 2 - vh / 2) / ((vh + r.height) / 2);
      c = Math.max(-1, Math.min(1, c));
      const fade = 1 - Math.min(1, Math.max(0, (Math.abs(c) - 0.5) / 0.5));
      el.style.transform =
        'perspective(1400px)' +
        ' rotateY(' + (c * 24).toFixed(2) + 'deg)' +
        ' rotateZ(' + (c * 5).toFixed(2) + 'deg)' +
        ' translateX(' + (Math.sin(c * Math.PI) * -36).toFixed(1) + 'px)' +
        ' translateY(' + (c * 70).toFixed(1) + 'px)' +
        ' scale(' + (1 - Math.abs(c) * 0.07).toFixed(3) + ')';
      el.style.opacity = fade.toFixed(3);
    });
    if (heroInner) {
      const f = Math.min(1, window.scrollY / (vh * 0.9));
      heroInner.style.transform =
        'translateY(' + (f * -70).toFixed(1) + 'px) scale(' + (1 - f * 0.12).toFixed(3) + ')';
      heroInner.style.opacity = Math.max(0, 1 - f * 1.15).toFixed(3);
    }
  }

  let scene = 0;
  function render(nowMs) {
    if (removed) return;
    const t = nowMs / 1000;
    scene += (sceneFromScroll() - scene) * 0.085;
    mx += (mouseX - mx) * 0.04;
    my += (mouseY - my) * 0.04;
    updateContent();
    updateBackdrop();
    updateRail();

    /* 透明クリア（奥に写真レイヤー） */
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    /* 背景 */
    gl.disable(gl.BLEND);
    gl.useProgram(bgPr);
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
    gl.enableVertexAttribArray(bgLoc);
    gl.vertexAttribPointer(bgLoc, 2, gl.FLOAT, false, 0, 0);
    const [top, bot] = bgColor(scene);
    gl.uniform3fv(uTop, top);
    gl.uniform3fv(uBot, bot);
    gl.uniform1f(uBgAlpha, 0.46 - 0.16 * Math.max(0, Math.min(1, 1 - scene)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(bgLoc);

    /* 粒子（加算合成） */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(pointPr);
    gl.uniform1f(uScene, scene);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uMotion, reduced ? 0 : 1);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uMouse, mx, my);
    /* 1パス目：にじむ光（ハロー）・2パス目：粒の芯 */
    gl.uniform1f(uHalo, 1);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    gl.uniform1f(uHalo, 0);
    gl.drawArrays(gl.POINTS, 0, COUNT);

    rafId = requestAnimationFrame(render);
  }

  /* バックグラウンドタブでは停止する */
  document.addEventListener('visibilitychange', () => {
    if (removed) return;
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    if (!document.hidden) rafId = requestAnimationFrame(render);
  });

  rafId = requestAnimationFrame(render);
})();
