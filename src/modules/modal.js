/**
 * modal — Webflow'da DOM <dialog> olarak kurulan popup'ları (Form Modal) yönetir.
 *
 * Kullanım (Webflow):
 *   <dialog data-rc="modal" id="talk-to-sales" class="fm-modal" aria-label="Talk to sales">
 *     <a href="#_" data-rc-modal-close aria-label="Close">…</a>
 *     …içerik / Webflow formu…
 *   </dialog>
 *   Tetik: <a href="#talk-to-sales"> (aynı sayfa) veya [data-rc-modal-open="talk-to-sales"].
 *   Kapat: [data-rc-modal-close] (dialog içinde), Esc, backdrop'a tıklama.
 *
 * JS yoksa (progressive enhancement): Global Styles'taki
 *   html:not(.rc-modal-ready) dialog.fm-modal:target{display:block}
 * kuralı popup'ı hash ile açar, kapat linki (href="#_") hash'i boşaltıp kapatır.
 * JS gelince <html>'e .rc-modal-ready eklenir; açma showModal() ile yapılır
 * (top layer, ::backdrop, odak tuzağı, Esc). Açıkken <html>.rc-modal-open → kaydırma kilidi.
 * Kapanınca odak tetikleyene döner, URL'deki #id temizlenir.
 * Animasyon yalnız CSS'tedir ve prefers-reduced-motion: no-preference ile sınırlıdır.
 */
const READY = 'rc-modal-ready';
const OPEN = 'rc-modal-open';
const dialogs = new Set();
let wired = false;

const root = document.documentElement;

function find(id) {
  if (!id) return null;
  const el = document.getElementById(id);
  return el && dialogs.has(el) ? el : null;
}

function openModal(d, opener) {
  if (d.open) return;
  d.__rcOpener = opener || document.activeElement;
  if (typeof d.showModal === 'function') d.showModal();
  else d.setAttribute('open', '');
  root.classList.add(OPEN);
}

function afterClose(d) {
  if (![...dialogs].some((x) => x.open)) root.classList.remove(OPEN);
  if (location.hash === `#${d.id}`) {
    history.replaceState(history.state, '', location.pathname + location.search);
  }
  const opener = d.__rcOpener;
  d.__rcOpener = null;
  if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
    opener.focus({ preventScroll: true });
  }
}

function closeModal(d) {
  if (!d.open) return;
  if (typeof d.close === 'function') d.close(); // 'close' olayı afterClose'u çağırır
  else {
    d.removeAttribute('open');
    afterClose(d);
  }
}

// Aynı sayfayı hedefleyen bir linkin hash'ini döndürür, yoksa null.
function samePageHash(a) {
  const href = a.getAttribute('href') || '';
  const i = href.indexOf('#');
  if (i < 0) return null;
  if (i > 0) {
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname) return null;
    } catch (e) {
      return null;
    }
  }
  try {
    return decodeURIComponent(href.slice(i + 1));
  } catch (e) {
    return href.slice(i + 1);
  }
}

function wire() {
  root.classList.add(READY);

  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-rc-modal-close], [data-rc-modal-open], a[href*="#"]');
    if (!t) return;

    if (t.hasAttribute('data-rc-modal-close')) {
      const d = t.closest('dialog');
      if (d && dialogs.has(d)) {
        e.preventDefault();
        closeModal(d);
      }
      return;
    }

    const id = t.getAttribute('data-rc-modal-open') || (t.tagName === 'A' ? samePageHash(t) : null);
    const d = find(id);
    if (!d) return;
    e.preventDefault();
    openModal(d, t);
  });

  // Elle yazılan / geri-ileri ile gelen #id
  window.addEventListener('hashchange', () => {
    const d = find(location.hash.slice(1));
    if (d) openModal(d);
  });
}

export default function modal(d) {
  if (!d || d.tagName !== 'DIALOG' || !d.id) return;
  dialogs.add(d);
  if (!wired) {
    wired = true;
    wire();
  }

  d.addEventListener('close', () => afterClose(d));

  // Backdrop'a tıklama: hedef dialog'un kendisi ve imleç kutunun dışında
  d.addEventListener('click', (e) => {
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeModal(d);
  });

  // Sayfa doğrudan #id ile açıldıysa
  if (location.hash === `#${d.id}`) openModal(d);
}
