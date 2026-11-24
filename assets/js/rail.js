/* Auto-scrolling work carousel. A native scroller, so swipe, trackpad and arrow keys
   work without it; this adds the loop, the timer and the controls. */
(function () {
  var rail = document.getElementById('rail'), nav = document.getElementById('rail-nav');
  if (!rail || !nav) return;

  var DELAY = 4200;
  var cards = [].slice.call(rail.children), count = cards.length;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paused = still, hover = false, focus = false, visible = false, touchedAt = 0, settle;

  // A second copy of the set makes the loop seamless; assistive tech and the tab order only see the first.
  cards.forEach(function (card) {
    var copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    [].forEach.call(copy.querySelectorAll('a'), function (a) { a.tabIndex = -1; });
    rail.appendChild(copy);
  });

  function step() { return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left; }
  function loop() { return step() * count; }
  function jump(x) { rail.scrollTo({ left: x, behavior: 'instant' }); }

  function go(dir) {
    var s = step(), i = Math.round(rail.scrollLeft / s);
    if (dir < 0 && i === 0) { jump(loop()); i = count; }
    if (dir > 0 && i >= count) { jump(rail.scrollLeft - loop()); i -= count; }
    rail.scrollTo({ left: (i + dir) * s, behavior: still ? 'instant' : 'smooth' });
  }

  rail.addEventListener('scroll', function () {
    clearTimeout(settle);
    settle = setTimeout(function () {
      if (rail.scrollLeft >= loop() - 1) jump(rail.scrollLeft - loop());
    }, 140);
  }, { passive: true });

  setInterval(function () {
    if (paused || hover || focus || !visible || document.hidden || Date.now() - touchedAt < 7000) return;
    go(1);
  }, DELAY);

  rail.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
  rail.addEventListener('pointerleave', function () { hover = false; });
  rail.addEventListener('touchstart', function () { touchedAt = Date.now(); }, { passive: true });
  rail.addEventListener('wheel', function () { touchedAt = Date.now(); }, { passive: true });
  rail.addEventListener('focusin', function (e) { focus = e.target.matches(':focus-visible'); });
  rail.addEventListener('focusout', function () { focus = false; });

  function setPaused(v) {
    paused = v;
    nav.classList.toggle('is-paused', v);
    nav.querySelector('[data-toggle]').setAttribute('aria-label', (v ? 'Start' : 'Pause') + ' automatic scrolling');
  }
  nav.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-toggle')) return setPaused(!paused);
    touchedAt = Date.now();
    go(+b.getAttribute('data-go'));
  });
  rail.addEventListener('keydown', function (e) {
    if (e.target !== rail || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    go(e.key === 'ArrowRight' ? 1 : -1);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (s) { visible = s[0].isIntersecting; }, { threshold: 0.35 }).observe(rail);
  }
  setPaused(paused);
  nav.hidden = false;
})();
