/**
 * nav-scroll — fixed navbar'ın "en üstte" durumunu işaretler.
 *
 * Kullanım (Webflow): header elemanına  data-rc="nav-scroll"
 * Davranış: Sayfa en üstteyken elemana  data-rc-nav="top"  eklenir,
 *           kaydırılınca kaldırılır. Stiller CSS'te (Global Styles):
 *           varsayılan = koyu zemin (JS yüklenmezse okunur kalır),
 *           [data-rc-nav="top"] = şeffaf.
 * Scroll event yok — tek bir IntersectionObserver, maliyeti ~0.
 */
export default function navScroll(el) {
  if (!('IntersectionObserver' in window)) return; // eski tarayıcı: koyu bar kalır

  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText =
    'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;visibility:hidden;';
  document.body.prepend(sentinel);

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) el.setAttribute('data-rc-nav', 'top');
    else el.removeAttribute('data-rc-nav');
  });
  io.observe(sentinel);
}
