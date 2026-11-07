/**
 * carousel — yatay kaydırmalı şeridi önceki/sonraki butonlarıyla yönetir.
 *
 * Kullanım (Webflow):
 *   <div data-rc="carousel">
 *     <div data-rc-carousel="track"> …kartlar… </div>   ← overflow-x:auto + scroll-snap (CSS'te)
 *     <button data-rc-carousel="prev" aria-label="Previous">…</button>
 *     <button data-rc-carousel="next" aria-label="Next">…</button>
 *   </div>
 * Opsiyonel: data-rc-carousel-step="page" → bir kart yerine görünen genişlik kadar kaydırır.
 *
 * JS yoksa şerit native yatay scroll olarak çalışır (progressive enhancement).
 * Uçlarda butonlar disabled + aria-disabled alır. prefers-reduced-motion → anında kaydırma.
 */
export default function carousel(root) {
  const track = root.querySelector('[data-rc-carousel="track"]');
  const prev = root.querySelector('[data-rc-carousel="prev"]');
  const next = root.querySelector('[data-rc-carousel="next"]');
  if (!track || (!prev && !next)) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pageStep = root.getAttribute('data-rc-carousel-step') === 'page';

  const step = () => {
    if (pageStep) return track.clientWidth;
    const items = track.children;
    if (items.length < 2) return track.clientWidth;
    // kart genişliği + gap = ardışık iki kartın sol kenar farkı
    return items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
  };

  const setState = (btn, off) => {
    if (!btn) return;
    btn.disabled = off;
    btn.setAttribute('aria-disabled', String(off));
  };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    setState(prev, track.scrollLeft <= 1);
    setState(next, track.scrollLeft >= max);
  };

  const go = (dir) => {
    track.scrollBy({ left: dir * step(), behavior: reduce.matches ? 'auto' : 'smooth' });
  };

  if (prev) prev.addEventListener('click', () => go(-1));
  if (next) next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', update, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
  update();
}
