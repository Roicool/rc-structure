# RC Structure

İnavitas grubu sitelerinin ortak rc-structure kodu: ortak JS modülleri ve Global Styles CSS.

Webflow custom code deposu. Kurallar: rc-structure çerçevesi (İnavitas grubu `CLAUDE.md` §7).

## Webflow'a ekleme

Site Settings → Custom Code → **Footer (Before </body>)**:

```html
<script defer src="https://cdn.jsdelivr.net/gh/Roicool/rc-structure@v0.2.0/dist/main.min.js"></script>
```

- Production'da **her zaman sürüm etiketi** (`@vX.Y.Z`). `@main` sadece staging testinde.
- Script her zaman `defer`, head'e konmaz.

## Geliştirme

```bash
npm install
npm run build      # dist/main.min.js üretir (commit'lenir)
```

## Sürüm çıkarma

1. `package.json` version + `CHANGELOG.md` güncelle
2. `npm run build` ve commit
3. `git tag vX.Y.Z && git push --tags`
4. Webflow'daki URL'de etiketi güncelle, yayınla

## Modüller (`data-rc` sözlüğü)

| Attribute | Modül | Açıklama |
|-----------|-------|----------|
| `data-rc="nav-scroll"` | `nav-scroll` | Fixed navbar: sayfa en üstteyken `data-rc-nav="top"` ekler (CSS şeffaf yapar), kaydırınca kaldırır. IntersectionObserver, scroll event yok. |
| `data-rc="modal"` (DOM `<dialog id>`) | `modal` | Popup: `<a href="#id">` veya `[data-rc-modal-open="id"]` açar (showModal), `[data-rc-modal-close]` / Esc / backdrop kapatır. Açıkken `<html>.rc-modal-open` (kaydırma kilidi), init'te `<html>.rc-modal-ready`. JS yoksa Global Styles `dialog:target` fallback'i. Kapanınca odak geri döner, `#id` URL'den silinir. |
| `data-rc="cms-filter"` (arama `<form>`) | `cms-filter` | CMS kartlarını yerinde süzer. Kapsam: formun en yakın `[data-rc-filter-scope]` / `<section>` / `<main>` atası. `[data-rc-filter-input]` arama alanı, `[data-rc-filter-clear]` temizle, `[data-rc-filter-list="ad"]` liste (`[data-rc-filter-paged]` → diğer sayfalama sayfaları ilk sorguda fetch edilir), `[data-rc-filter-item]` kart, `[data-rc-filter-text]` aranan metin (eşleşme `<mark class="rc-filter-hl">`), `[data-rc-filter-pager]` sorgu varken gizlenir, `[data-rc-filter-empty]` sonuç yoksa görünür. `?q=` URL ile senkron. Gizlenen öğe: `hidden` + `[data-rc-filtered="out"]`. JS yoksa form düz GET, kartlar görünür. |

Yeni modül: `src/modules/<ad>.js` (default export `(el) => {}`), `src/main.js` içindeki `modules` listesine eklenir, Webflow'da elemana `data-rc="<ad>"` verilir.

> Bu repo public'tir (jsDelivr gereği). İçine API anahtarı, token veya gizli bilgi **koyma**.
