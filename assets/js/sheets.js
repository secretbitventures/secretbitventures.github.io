/* 2-of-2 visual cryptography (Naor & Shamir, 1994).
   Each secret pixel becomes a 2x2 block with two dark subpixels. Sheet A's block is
   uniformly random; sheet B repeats it for a white pixel and inverts it for a black one.
   Either sheet alone is uniform noise, independent of the secret. */
(function () {
  var canvas = document.getElementById('sheets');
  var range = document.getElementById('sheets-range');
  if (!canvas || !range) return;

  var ctx = canvas.getContext('2d');
  var BLOCKS = [[1,1,0,0], [0,0,1,1], [1,0,1,0], [0,1,0,1], [1,0,0,1], [0,1,1,0]];
  var INK = [12, 27, 42];
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sheetA, sheetB, sub, width = 0, offset = 0, frame = 0;

  function randomBlocks(n) {
    var out = new Uint8Array(n), buf = new Uint8Array(4096), i = 0, j = buf.length;
    while (i < n) {
      if (j === buf.length) { crypto.getRandomValues(buf); j = 0; }
      var b = buf[j++];
      if (b < 252) out[i++] = b % 6; // reject the tail so the choice is unbiased
    }
    return out;
  }

  function secret(cols, rows) {
    var c = document.createElement('canvas');
    c.width = cols; c.height = rows;
    var g = c.getContext('2d', { willReadFrequently: true });
    var lines = ['SecretBit', 'Ventures'];
    var family = '900 100px Inter, system-ui, sans-serif';
    g.font = family;
    var widest = Math.max.apply(null, lines.map(function (l) { return g.measureText(l).width; }));
    var size = Math.min(cols * 0.9 / widest * 100, rows * 0.45);
    g.font = family.replace('100px', size + 'px');
    g.textAlign = 'center';
    var step = size * 0.86, first = rows / 2 + size * 0.355 - step * (lines.length - 1) / 2;
    lines.forEach(function (l, i) { g.fillText(l, cols / 2, first + i * step); });
    var px = g.getImageData(0, 0, cols, rows).data, bits = new Uint8Array(cols * rows);
    for (var k = 0; k < bits.length; k++) bits[k] = px[k * 4 + 3] > 127 ? 1 : 0;
    return bits;
  }

  function sheet(cols, rows, blocks, flip) {
    var c = document.createElement('canvas');
    c.width = cols * 2; c.height = rows * 2;
    var g = c.getContext('2d'), img = g.createImageData(c.width, c.height);
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var i = y * cols + x, b = BLOCKS[blocks[i]], inv = flip ? flip[i] : 0;
      for (var s = 0; s < 4; s++) {
        if ((b[s] ^ inv) === 0) continue;
        var p = ((y * 2 + (s >> 1)) * c.width + x * 2 + (s & 1)) * 4;
        img.data[p] = INK[0]; img.data[p + 1] = INK[1]; img.data[p + 2] = INK[2]; img.data[p + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function reach() { return Math.floor(width * 0.55 / sub) * sub; }

  function draw() {
    frame = 0;
    var r = devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    var s = Math.round(sub * r), shift = Math.round(offset / sub) * s;
    ctx.drawImage(sheetA, 0, 0, sheetA.width * s, sheetA.height * s);
    ctx.drawImage(sheetB, shift, 0, sheetB.width * s, sheetB.height * s);
  }

  function setOffset(v, fromRange) {
    offset = Math.max(0, Math.min(reach(), v));
    if (!fromRange) range.value = offset / reach() * 100;
    range.setAttribute('aria-valuetext', offset < sub ? 'Aligned, the words SecretBit Ventures are visible' : 'Apart, only noise is visible');
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function build() {
    var w = canvas.clientWidth, h = canvas.clientHeight, r = devicePixelRatio || 1;
    width = w;
    sub = Math.round((w < 720 ? 1.5 : w < 1800 ? 2 : 3) * r) / r; // whole device pixels
    canvas.width = Math.round(w * r); canvas.height = Math.round(h * r);
    var cols = Math.ceil(w / (sub * 2)), rows = Math.ceil(h / (sub * 2));
    var blocks = randomBlocks(cols * rows);
    sheetA = sheet(cols, rows, blocks, null);
    sheetB = sheet(cols, rows, blocks, secret(cols, rows));
    draw();
  }

  var playing = 0;
  function stop() { if (playing) cancelAnimationFrame(playing); playing = 0; }
  function glide(from, to, ms) {
    stop();
    var t0 = performance.now();
    (function tick(t) {
      var k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 4);
      setOffset(from + (to - from) * e);
      playing = k < 1 ? requestAnimationFrame(tick) : 0;
    })(t0);
  }

  function settle() { if (offset > 0 && offset < 24) still ? setOffset(0) : glide(offset, 0, 250); }

  range.addEventListener('input', function () { stop(); setOffset(range.value / 100 * reach(), true); });

  var drag = null;
  canvas.addEventListener('pointerdown', function (e) {
    stop(); drag = { x: e.clientX, from: offset };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) { if (drag) setOffset(drag.from + e.clientX - drag.x); });
  ['pointerup', 'pointercancel'].forEach(function (n) {
    canvas.addEventListener(n, function () { if (drag) { drag = null; settle(); } });
  });

  var timer;
  addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { if (canvas.clientWidth !== width) { stop(); build(); setOffset(0); } }, 150);
  });

  function start() {
    build();
    if (still || !('IntersectionObserver' in window)) return setOffset(0);
    setOffset(reach());
    new IntersectionObserver(function (seen, io) {
      if (!seen[0].isIntersecting) return;
      io.disconnect();
      setTimeout(function () { if (!drag && offset === reach()) glide(reach(), 0, 2200); }, 350);
    }, { threshold: 0.6 }).observe(canvas);
  }
  var font = document.fonts && document.fonts.load ? document.fonts.load('900 100px Inter') : Promise.resolve();
  font.then(start, start);
})();
