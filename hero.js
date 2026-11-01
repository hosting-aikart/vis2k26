// Home screen animation: a robot hand and a human hand, drawn as dot matrices,
// reaching toward a rotating glass star. Both hands are baked from a posed 3D hand
// mesh into filmstrips (assets/hand-*.webp). All frames are sampled onto one fixed
// dot grid. The hands fly in open, close to a pointing finger and swing in until
// each fingertip touches the star, then hold there.
(() => {
  const canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas) return;

  const hero = canvas.parentElement;
  const stage = hero.querySelector('.hero__stage');
  const starBox = hero.querySelector('[data-hero-star]');
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeBack = (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;
  const rgb = ([r, g, b]) => `rgb(${r | 0} ${g | 0} ${b | 0})`;

  function ramp(stops, t) {
    const at = clamp(t) * (stops.length - 1);
    const i = Math.min(at | 0, stops.length - 2);
    return stops[i].map((c, k) => lerp(c, stops[i + 1][k], at - i));
  }

  // Set to true to bring the glass star back between the fingertips.
  const SHOW_STAR = false;

  /* Star: six hooked arms of solid glass, ray-marched per pixel so it gets real
     reflections, refraction and rounded edges that catch the light. */

  // The star canvas extends past the star itself, so its corners never clip.
  const STAR_MARGIN = 1.3;
  const STAR_SHADER = `
    precision highp float;
    uniform vec2 uRes;
    uniform mat3 uRot;
    uniform float uScale;
    uniform float uAlpha;
    uniform float uFlash;

    const float SECTOR = 1.0471976;

    float box(vec2 p, vec2 c, vec2 b) {
      vec2 d = abs(p - c) - b;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }

    // A slim arm that jogs sideways twice on its way out.
    float arm(vec2 p) {
      float d = box(p, vec2(0.28, 0.0), vec2(0.30, 0.118));
      d = min(d, box(p, vec2(0.60, 0.075), vec2(0.15, 0.118)));
      return min(d, box(p, vec2(0.85, 0.15), vec2(0.12, 0.118)));
    }

    // One arm, repeated six times by folding the angle. Rotating rather than
    // mirroring keeps every hook turning the same way. The neighbouring arm is
    // checked too, or its hook gets cut where it crosses into this sector.
    float outline(vec2 p) {
      float a = mod(atan(p.y, p.x) + SECTOR * 0.5, SECTOR) - SECTOR * 0.5;
      float r = length(p);
      return min(arm(r * vec2(cos(a), sin(a))), arm(r * vec2(cos(a + SECTOR), sin(a + SECTOR))));
    }

    float map(vec3 p) {
      vec2 w = vec2(outline(p.xy) + 0.014, abs(p.z) - 0.17);
      return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.014;
    }

    vec3 normalAt(vec3 p) {
      vec2 e = vec2(0.0015, -0.0015);
      return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx)
        + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
    }

    // A black room with hard-edged lights. Glass reads as glass through sharp
    // reflections against near-black, so nothing here is a soft wash.
    vec3 studio(vec3 d) {
      vec3 c = mix(vec3(0.004, 0.002, 0.016), vec3(0.03, 0.014, 0.1), smoothstep(-0.8, 1.0, d.y));
      float a = dot(d, normalize(vec3(0.62, 0.76, 0.2)));
      float bands = smoothstep(0.03, 0.0, abs(fract(a * 1.9 + 0.1) - 0.5) - 0.13);
      c += mix(vec3(0.5, 0.28, 1.6), vec3(1.5, 1.4, 2.0), smoothstep(0.1, 0.8, d.y)) * bands;
      c += vec3(3.0, 2.9, 3.4) * smoothstep(0.93, 0.965, dot(d, normalize(vec3(-0.55, 0.75, 0.3))));
      c += vec3(2.6, 0.95, 0.4) * smoothstep(0.7, 0.88, dot(d, normalize(vec3(0.92, -0.2, 0.35))));
      c += vec3(0.62, 0.34, 1.9) * smoothstep(0.62, 0.9, dot(d, normalize(vec3(-0.1, -0.95, 0.3))));
      c += vec3(1.5, 0.3, 0.75) * smoothstep(0.93, 0.98, dot(d, normalize(vec3(0.15, -0.98, 0.1))));
      return c;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y * ${STAR_MARGIN.toFixed(2)} / max(uScale, 0.01);
      // Soft flare behind the star. Zero alpha makes it add to whatever is beneath.
      float spread = length(uv);
      float beams = pow(abs(cos(atan(uv.y, uv.x) * 3.0 + 0.5)), 10.0);
      vec3 flareTint = mix(vec3(0.62, 0.48, 1.0), vec3(1.0, 0.5, 0.42), smoothstep(0.0, 0.8, (uv.x - uv.y) * 0.6));
      vec3 flare = flareTint * exp(-spread * 3.0) * (0.34 + 0.9 * beams) * smoothstep(1.28, 0.8, spread) * uAlpha;

      vec3 ro = vec3(0.0, 0.0, 4.0);
      vec3 rd = normalize(vec3(uv, -4.0));
      vec3 oo = ro * uRot;
      vec3 od = rd * uRot;

      // Skip everything outside the star's bounding sphere.
      float b = dot(oo, od);
      float h = b * b - dot(oo, oo) + 1.1;
      if (h < 0.0) { gl_FragColor = vec4(flare, 0.0); return; }

      float t = -b - sqrt(h);
      float tEnd = -b + sqrt(h);
      float nearest = 1.0;
      bool hit = false;
      for (int i = 0; i < 44; i++) {
        float d = map(oo + od * t);
        nearest = min(nearest, d);
        if (d < 0.0008) { hit = true; break; }
        t += d * 0.85;
        if (t > tEnd) break;
      }

      float pixel = 2.4 * ${STAR_MARGIN.toFixed(2)} / uRes.y;
      float cover = hit ? 1.0 : 1.0 - smoothstep(0.0, pixel, nearest);
      if (cover <= 0.0) { gl_FragColor = vec4(flare, 0.0); return; }

      vec3 p = oo + od * t;
      vec3 n = normalAt(p);
      // Grazing surface is the silhouette, so softening it there smooths the outline.
      cover *= smoothstep(0.0, 0.22, dot(-od, n));
      vec3 worldN = uRot * n;

      vec3 inside = refract(od, n, 0.68);
      vec3 q = p;
      float depth = 0.0;
      vec3 emission = vec3(0.0);
      for (int i = 0; i < 14; i++) {
        float d = -map(p + inside * (depth + 0.012));
        if (d < 0.0015) break;
        float step = max(d, 0.016);
        depth += step;
        q = p + inside * depth;
        // Heat from the core, warm on the side facing right.
        float r = length(q.xy);
        float side = smoothstep(-0.04, 0.3, (uRot * q).x);
        vec3 heat = mix(vec3(0.62, 0.38, 1.0), vec3(1.0, 0.36, 0.16), side);
        emission += step * (heat * 3.6 * exp(-r * r * 26.0) + vec3(1.0, 0.96, 0.92) * 11.0 * exp(-r * r * 170.0));
      }

      vec3 absorb = exp(-vec3(1.5, 2.2, 0.4) * (depth * 3.0 + 0.2));
      vec3 through = studio(uRot * refract(inside, -n, 1.3)) * absorb;
      through += vec3(0.16, 0.06, 0.58) * 0.1;

      vec3 mirrored = studio(uRot * reflect(od, n));
      float facing = max(dot(-od, n), 0.0);
      float fresnel = 0.22 + 0.78 * pow(1.0 - facing, 3.0);
      vec3 color = mix(through, mirrored, fresnel) + emission * (1.0 + uFlash * 2.5);

      // The light runs out along the middle of each arm from a white-hot centre,
      // turning peach on the right and fading to violet at the tips.
      float r = length(p.xy);
      float face = smoothstep(0.75, 0.95, abs(n.z));
      float spine = smoothstep(-0.015, -0.07, outline(p.xy));
      float warmth = smoothstep(-0.02, 0.2, (uRot * p).x) * exp(-r * r * 3.2);
      vec3 lit = mix(vec3(0.5, 0.34, 1.0), vec3(1.0, 0.97, 1.0), exp(-r * 4.2));
      lit = mix(lit, vec3(1.0, 0.44, 0.2), warmth);
      color += lit * face * spine * 1.1 * exp(-r * r * 9.0);

      // Deep walls, blue-violet above and magenta low down, with bright bevels.
      float wall = 1.0 - face;
      float low = smoothstep(0.0, -0.8, (uRot * p).y);
      vec3 side = mix(vec3(0.09, 0.04, 0.42), vec3(0.8, 0.12, 0.46), low);
      color += side * wall * 0.1;
      float bevel = smoothstep(0.86, 0.55, abs(n.z)) * smoothstep(0.2, 0.6, abs(n.z));
      color += vec3(0.9, 0.82, 1.0) * bevel * 2.4;

      color = pow(1.0 - exp(-color * 1.5), vec3(1.2));
      float alpha = cover * uAlpha;
      gl_FragColor = vec4(color * alpha + flare * (1.0 - cover), alpha);
    }
  `;

  function createStar(host) {
    const fallback = () => {
      host.classList.add('is-fallback');
      return { resize() {}, draw() {} };
    };
    const surface = document.createElement('canvas');
    const gl = surface.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return fallback();

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, STAR_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return fallback();
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'p'), 2, gl.FLOAT, false, 0, 0);

    const uniform = (name) => gl.getUniformLocation(program, name);
    const [uRes, uRot, uScale, uAlpha, uFlash] = ['uRes', 'uRot', 'uScale', 'uAlpha', 'uFlash'].map(uniform);
    host.append(surface);

    return {
      resize(px) {
        surface.width = px;
        surface.height = px;
        gl.viewport(0, 0, px, px);
        gl.uniform2f(uRes, px, px);
      },
      draw(rotation, scale, alpha, flash) {
        gl.uniformMatrix3fv(uRot, false, rotation);
        gl.uniform1f(uScale, scale);
        gl.uniform1f(uAlpha, alpha);
        gl.uniform1f(uFlash, flash);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  }

  const star = SHOW_STAR ? createStar(starBox) : { resize() {}, draw() {} };

  /* Hands */

  const FRAMES = 8;
  const FRAME_W = 700;
  const FRAME_H = 500;
  // Index fingertip inside a frame, as a fraction of its size.
  const TIP = [0.89, 0.44];
  const HAND_LENGTH = 0.46;

  // Entrance, in seconds: dots fly in arm-first, the fingertips land last, and the
  // star ignites as they arrive. The fingers start flexing once it has finished.
  const FLIGHT = 0.9;
  const ASSEMBLE = 1;
  const ARRIVAL = ASSEMBLE + 0.25 + FLIGHT;
  const IGNITE = 1.5;
  const REACH = 2.2;
  const TOUCH = ARRIVAL + REACH + 0.25;

  const LEVELS = 12;
  const palette = (stops) => Array.from({ length: LEVELS }, (_, i) => rgb(ramp(stops, i / (LEVELS - 1))));
  const silver = palette([[26, 26, 30], [74, 74, 82], [132, 132, 140], [190, 190, 198], [236, 236, 240], [255, 255, 255]]);
  const skin = palette([[64, 30, 28], [132, 68, 60], [196, 118, 96], [232, 164, 134], [248, 204, 178], [255, 234, 218]]);

  let W = 0;
  let H = 0;
  let cx = 0;
  let cy = 0;
  let size = 0;
  let hands = [];
  let strips = null;
  let lowPower = false;

  // One mask pixel per dot, doubled across so odd rows can sit half a step over.
  function sampleHand(strip, { tipX, tipY, rotate, scale, mirror, pitch, colors, dir, delay }) {
    const cols = Math.ceil(W / pitch) + 1;
    const rows = Math.ceil(H / pitch) + 1;
    const mask = document.createElement('canvas');
    mask.width = cols * 2;
    mask.height = rows;
    const m = mask.getContext('2d', { willReadFrequently: true });
    const lum = new Float32Array(cols * rows * FRAMES);

    for (let f = 0; f < FRAMES; f++) {
      m.setTransform(1, 0, 0, 1, 0, 0);
      m.fillStyle = '#000';
      m.fillRect(0, 0, mask.width, rows);
      m.setTransform(2 / pitch, 0, 0, 1 / pitch, 0, 0);
      m.translate(tipX, tipY);
      m.rotate(rotate);
      m.scale(mirror ? -scale : scale, scale);
      m.drawImage(strip, f * FRAME_W, 0, FRAME_W, FRAME_H, -TIP[0] * FRAME_W, -TIP[1] * FRAME_H, FRAME_W, FRAME_H);
      // Stretch the frame's arm edge outward so the arm always reaches the screen edge.
      m.drawImage(strip, f * FRAME_W + 1, 0, 2, FRAME_H, -TIP[0] * FRAME_W - 4000, -TIP[1] * FRAME_H, 4001, FRAME_H);

      const { data } = m.getImageData(0, 0, mask.width, rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const value = data[(y * mask.width + x * 2 + (y & 1)) * 4] / 255;
          lum[(y * cols + x) * FRAMES + f] = clamp((value - 0.1) * 1.2) ** 1.4;
        }
      }
    }

    const dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const at = (y * cols + x) * FRAMES;
        let peak = 0;
        for (let f = 0; f < FRAMES; f++) peak = Math.max(peak, lum[at + f]);
        if (peak < 0.04) continue;
        const px = (x + (y & 1) * 0.5) * pitch;
        const py = y * pitch;
        dots.push({ x: px, y: py, at, dist: Math.hypot(px - tipX, py - tipY) });
      }
    }
    const reach = dots.reduce((max, d) => Math.max(max, d.dist), 1);
    for (const d of dots) {
      d.wait = (1 - d.dist / reach) * ASSEMBLE + Math.random() * 0.25;
      d.fromX = d.x + dir * (120 + Math.random() * 320);
      d.fromY = d.y + (Math.random() - 0.5) * 260;
    }
    return { dots, lum, colors, dir, reach, delay, pitch, pivotX: dir < 0 ? -W * 0.1 : W * 1.1, pivotY: tipY };
  }

  function layout() {
    const dpr = lowPower ? 1 : Math.min(devicePixelRatio || 1, 2);
    const box = hero.getBoundingClientRect();
    const area = stage.getBoundingClientRect();
    W = Math.ceil(box.width);
    H = Math.ceil(box.height);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cx = area.left - box.left + area.width / 2;
    cy = area.top - box.top + area.height / 2;

    const portrait = W < H * 0.9;
    size = portrait ? Math.min(area.height * 0.2, W * 0.2) : Math.min(area.height * 0.32, W * 0.105);
    if (portrait) cy -= area.height * 0.25;

    const starSize = Math.round(size * 2 * STAR_MARGIN);
    starBox.style.width = `${starSize}px`;
    starBox.style.height = `${starSize}px`;
    starBox.style.left = `${cx - starSize / 2}px`;
    starBox.style.top = `${cy - starSize / 2}px`;
    // Rendered above 1x even on standard monitors, which smooths the glass edges.
    star.resize(Math.min(Math.round(starSize * (lowPower ? 1 : 1.5)), 760));

    if (!strips) return;

    const coarse = lowPower ? 1.3 : 1;
    const pitch = (W < 700 ? 4.4 : clamp(W / 205, 5.5, 13)) * coarse;
    const handScale = (width) => width / (HAND_LENGTH * FRAME_W);

    if (portrait) {
      const spread = SHOW_STAR ? size * 0.44 : W * 0.012;
      const lean = SHOW_STAR ? 1.02 : 0.8;
      const tipY = SHOW_STAR ? cy + size * 0.56 : cy;
      hands = [
        sampleHand(strips.robot, { tipX: cx - spread, tipY, rotate: -lean, scale: handScale(W * 0.42), mirror: false, pitch, colors: silver, dir: -1, delay: 0 }),
        sampleHand(strips.human, { tipX: cx + spread, tipY, rotate: lean, scale: handScale(W * 0.42), mirror: true, pitch, colors: skin, dir: 1, delay: 0.35 }),
      ];
      return;
    }

    const limit = area.height * 0.92;
    const gap = SHOW_STAR ? size * 0.6 : W * 0.005;
    const lift = SHOW_STAR ? size * 0.2 : 0;

    // Robot high on the left, human nearly level on the right so its whole hand
    // clears the bottom of the hero. Both fingertips sit on the star.
    hands = [
      sampleHand(strips.robot, { tipX: cx - gap, tipY: cy - lift, rotate: 0.24, scale: handScale(Math.min(W * 0.27, limit)), mirror: false, pitch, colors: silver, dir: -1, delay: 0 }),
      sampleHand(strips.human, { tipX: cx + gap, tipY: cy + lift * 0.4, rotate: 0.02, scale: handScale(Math.min(W * 0.3, limit)), mirror: true, pitch, colors: skin, dir: 1, delay: 0.35 }),
    ];
  }

  /* Rendering */

  const pointer = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, tiltX: 0, tiltY: 0, easedX: 0, easedY: 0 };

  function drawHand(hand, t, intro) {
    const settle = easeOut(clamp(intro / ARRIVAL));
    const { lum, pitch } = hand;

    // The fingers close first; the swing in overlaps and finishes on the touch.
    const reach = still ? 1 : clamp((t - ARRIVAL - hand.delay) / REACH);
    const beat = smooth(clamp((reach - 0.2) / 0.8));
    const position = smooth(clamp(reach / 0.65)) * (FRAMES - 1);
    const frame = Math.min(position | 0, FRAMES - 2);
    const blend = position - frame;

    const ox = hand.dir * ((1 - settle) * 60 + (1 - beat) * W * 0.05);
    const oy = 0;
    const swing = -(1 - beat) * 0.06;
    const [swingSin, swingCos] = [Math.sin(swing), Math.cos(swing)];
    const reachR = 90;

    const buckets = hand.colors.map(() => new Path2D());
    for (const d of hand.dots) {
      const fade = intro < ARRIVAL ? easeOut(clamp((intro - d.wait) / FLIGHT)) : 1;
      if (fade <= 0) continue;

      const shade = lerp(lum[d.at + frame], lum[d.at + frame + 1], blend);
      if (shade < 0.03) continue;

      const rx = d.x - hand.pivotX;
      const ry = d.y - hand.pivotY;
      const homeX = hand.pivotX + rx * swingCos - ry * swingSin;
      const homeY = hand.pivotY + rx * swingSin + ry * swingCos;
      let x = lerp(d.fromX, homeX, fade) + ox;
      let y = lerp(d.fromY, homeY, fade) + oy;
      const dx = x - pointer.sx;
      const dy = y - pointer.sy;
      const near = dx * dx + dy * dy;
      if (near < reachR * reachR) {
        const dist = Math.sqrt(near) || 1;
        const push = (1 - dist / reachR) ** 2 * 18;
        x += (dx / dist) * push;
        y += (dy / dist) * push;
      }

      const r = pitch * (0.16 + 0.34 * shade ** 0.7) * fade;
      const path = buckets[Math.min((shade * LEVELS) | 0, LEVELS - 1)];
      path.moveTo(x + r, y);
      path.arc(x, y, r, 0, Math.PI * 2);
    }
    buckets.forEach((path, i) => {
      ctx.fillStyle = hand.colors[i];
      ctx.fill(path);
    });
  }

  function drawGlow(radius, stops) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    stops.forEach(([at, color]) => g.addColorStop(at, color));
    ctx.fillStyle = g;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  function drawRays(t, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.05);
    for (let i = 0; i < 18; i++) {
      const length = size * (1.25 + 0.5 * Math.sin(t * 0.9 + i * 2.4));
      ctx.rotate((Math.PI * 2) / 18);
      const g = ctx.createLinearGradient(0, 0, length, 0);
      g.addColorStop(0, `rgb(255 240 245 / ${0.16 * alpha})`);
      g.addColorStop(1, 'rgb(150 90 255 / 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.04);
      ctx.lineTo(length, 0);
      ctx.lineTo(0, size * 0.04);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStar(t, grow, alpha, flash) {
    // Spins flat and only rocks in depth, so it never turns edge-on to the viewer.
    const spin = t * 0.2;
    const rotY = 0.3 + 0.32 * Math.sin(t * 0.4) + pointer.easedX * 0.7;
    const rotX = 0.6 + Math.sin(t * 0.31) * 0.12 + pointer.easedY * 0.5;
    const [sz, cz] = [Math.sin(spin), Math.cos(spin)];
    const [sy, cyr] = [Math.sin(rotY), Math.cos(rotY)];
    const [sx, cxr] = [Math.sin(rotX), Math.cos(rotX)];
    const turn = (x0, y0, z) => {
      const x = x0 * cz - y0 * sz;
      const y = x0 * sz + y0 * cz;
      const x1 = x * cyr + z * sy;
      const z1 = -x * sy + z * cyr;
      return [x1, y * cxr - z1 * sx, y * sx + z1 * cxr];
    };
    star.draw([...turn(1, 0, 0), ...turn(0, 1, 0), ...turn(0, 0, 1)], grow, alpha, flash);
  }

  function frame(t, intro) {
    const grow = 0.15 + 0.85 * easeBack(clamp((intro - IGNITE) / 0.7));
    const alpha = clamp((intro - IGNITE) / 0.4);
    const burst = intro > IGNITE + 0.2 ? clamp(1 - (intro - IGNITE - 0.2)) : 0;
    // The star flares at the moment of touch, then settles into a slow breath.
    const touch = still ? 0 : intro > TOUCH ? clamp(1 - (intro - TOUCH) / 1.3) : 0;
    const breathe = 1 + Math.sin(t * 1.1) * 0.05;

    pointer.sx += (pointer.x - pointer.sx) * 0.14;
    pointer.sy += (pointer.y - pointer.sy) * 0.14;
    pointer.easedX += (pointer.tiltX - pointer.easedX) * 0.05;
    pointer.easedY += (pointer.tiltY - pointer.easedY) * 0.05;

    ctx.clearRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    drawGlow(size * 3 * breathe, [[0, 'rgb(124 58 237 / .26)'], [0.5, 'rgb(90 40 200 / .08)'], [1, 'rgb(60 20 160 / 0)']]);
    if (SHOW_STAR) drawRays(t, 1);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    hands.forEach((hand) => drawHand(hand, t, intro));

    if (SHOW_STAR) drawStar(t, grow * (1 + touch * 0.1), alpha, Math.max(touch, burst));

    ctx.globalCompositeOperation = 'lighter';
    if (touch > 0) {
      drawGlow(size * (4 - 2.6 * touch), [[0, `rgb(255 230 240 / ${0.7 * touch})`], [0.4, `rgb(170 110 255 / ${0.3 * touch})`], [1, 'rgb(90 40 200 / 0)']]);
    }
    // With no star, a small spark marks the point where the fingertips meet.
    if (!SHOW_STAR && intro > TOUCH - 0.2) {
      drawGlow(size * 0.26 * breathe, [[0, 'rgb(255 255 255 / .9)'], [0.25, 'rgb(204 204 255 / .45)'], [1, 'rgb(139 92 246 / 0)']]);
    }
    if (SHOW_STAR && burst > 0) {
      drawGlow(size * (3.6 - 2.4 * burst), [[0, `rgb(255 220 235 / ${0.55 * burst})`], [0.4, `rgb(150 90 255 / ${0.25 * burst})`], [1, 'rgb(90 40 200 / 0)']]);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /* Lifecycle */

  let raf = 0;
  let booted = false;
  let onScreen = true;
  let startedAt = 0;
  let lastFrame = 0;
  let sampled = 0;
  let slow = 0;

  // Older phones get fewer dots and lower resolution rather than a stuttering hero.
  function watchSpeed(now, t) {
    const delta = now - lastFrame;
    lastFrame = now;
    if (lowPower || t < 3 || delta > 1500) return;
    sampled++;
    if (delta > 30) slow++;
    if (sampled < 40) return;
    if (slow > 20) {
      lowPower = true;
      layout();
    }
    sampled = 0;
    slow = 0;
  }

  function loop(now) {
    const t = (now - startedAt) / 1000;
    watchSpeed(now, t);
    frame(t, t);
    raf = requestAnimationFrame(loop);
  }

  function resume() {
    if (still || raf || !booted || !onScreen || document.hidden) return;
    raf = requestAnimationFrame(loop);
  }

  function pause() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function render() {
    layout();
    if (still) frame(8, 8);
  }

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 120);
  }).observe(hero);

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) resume();
    else pause();
  }).observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else resume();
  });

  if (!still) {
    hero.addEventListener('pointermove', (event) => {
      const box = hero.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      pointer.tiltX = (pointer.x - W / 2) / W;
      pointer.tiltY = (pointer.y - H / 2) / H;
    });
    // A touch that turns into a scroll ends in pointercancel, not pointerleave.
    ['pointerleave', 'pointercancel', 'pointerup'].forEach((name) => {
      hero.addEventListener(name, (event) => {
        if (name === 'pointerup' && event.pointerType === 'mouse') return;
        pointer.x = -1e4;
        pointer.y = -1e4;
      });
    });
  }

  const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  Promise.all([load('assets/hand-robot.webp'), load('assets/hand-human.webp')])
    .then(([robot, human]) => {
      strips = { robot, human };
    })
    .catch(() => {})
    .finally(() => {
      booted = true;
      startedAt = performance.now();
      render();
      resume();
    });
})();
