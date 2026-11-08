# Changelog

## v0.4.0
- `modal` modülü: `data-rc="modal"` DOM `<dialog id>` popup'ları. Aynı sayfa `#id` linkleri ve `[data-rc-modal-open]` showModal() ile açar; `[data-rc-modal-close]`, Esc ve backdrop tıklaması kapatır; odak tetikleyene döner, hash temizlenir. `<html>.rc-modal-ready` / `.rc-modal-open` sınıfları. JS yoksa Global Styles `dialog:target` fallback'i.

## v0.3.0
- `carousel` modülü: `data-rc="carousel"` + `data-rc-carousel="track|prev|next"`. Önceki/sonraki ile kart kart kaydırma (opsiyonel `data-rc-carousel-step="page"`), uçlarda disabled, reduced-motion desteği. JS yoksa native yatay scroll.

## v0.2.0
- `nav-scroll` modülü: fixed navbar en üst / kaydırılmış durumu.

## v0.1.0
- İlk iskelet: data-rc loader.
