# Changelog

## v0.5.0
- `cms-filter` modülü: `data-rc="cms-filter"` arama formu, kapsam içindeki `[data-rc-filter-item]` kartlarını `[data-rc-filter-text]` metnine göre yerinde süzer; eşleşmeleri `<mark class="rc-filter-hl">` ile vurgular. İlk sorguda `[data-rc-filter-paged]` listelerin diğer sayfalama sayfalarını fetch edip ekler (en çok 20 sayfa). `[data-rc-filter-pager]` sorgu sırasında gizlenir, `[data-rc-filter-empty]` sonuç yoksa görünür, `role=status` sonuç sayısı. `?q=` URL'de tutulur (replaceState) ve açılışta uygulanır. Türkçe İ/ı ve aksan duyarsız. JS yoksa form düz GET, kartlar görünür kalır. Gizleme `hidden` + `[data-rc-filtered="out"]`.

## v0.4.0
- `modal` modülü: `data-rc="modal"` DOM `<dialog id>` popup'ları. Aynı sayfa `#id` linkleri ve `[data-rc-modal-open]` showModal() ile açar; `[data-rc-modal-close]`, Esc ve backdrop tıklaması kapatır; odak tetikleyene döner, hash temizlenir. `<html>.rc-modal-ready` / `.rc-modal-open` sınıfları. JS yoksa Global Styles `dialog:target` fallback'i.

## v0.3.0
- `carousel` modülü: `data-rc="carousel"` + `data-rc-carousel="track|prev|next"`. Önceki/sonraki ile kart kart kaydırma (opsiyonel `data-rc-carousel-step="page"`), uçlarda disabled, reduced-motion desteği. JS yoksa native yatay scroll.

## v0.2.0
- `nav-scroll` modülü: fixed navbar en üst / kaydırılmış durumu.

## v0.1.0
- İlk iskelet: data-rc loader.
