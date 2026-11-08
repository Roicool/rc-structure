/**
 * RC loader — data-rc attribute'larını tarar, ilgili modülü başlatır.
 * Kural: JS class'lara değil data-rc="<modul>" attribute'una bağlanır.
 * Her modül izole çalışır; biri hata verirse diğerleri etkilenmez.
 */
const modules = {
  'nav-scroll': () => import('./modules/nav-scroll.js'),
  carousel: () => import('./modules/carousel.js'),
  modal: () => import('./modules/modal.js'),
  'cms-filter': () => import('./modules/cms-filter.js'),
};

function init(root = document) {
  root.querySelectorAll('[data-rc]').forEach((el) => {
    if (el.__rcInit) return;
    el.dataset.rc.split(/\s+/).forEach(async (name) => {
      const load = modules[name];
      if (!load) return;
      try {
        const mod = await load();
        (mod.default || mod.init)(el);
        el.__rcInit = true;
      } catch (err) {
        console.warn(`[RC] "${name}" başlatılamadı`, err);
      }
    });
  });
}

window.RC = Object.assign(window.RC || {}, { init, version: __VERSION__ });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}
