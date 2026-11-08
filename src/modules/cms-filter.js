/**
 * cms-filter — in-page search over Webflow CMS cards (Blogs search, export "Blogs _ Search results").
 *
 * Markup (Webflow):
 *   <form data-rc="cms-filter" action="/blogs" method="get" role="search">
 *     <input type="search" name="q" data-rc-filter-input aria-label="Search posts">
 *     <button type="button" data-rc-filter-clear aria-label="Clear search">×</button>
 *   </form>
 *   Scope = the closest [data-rc-filter-scope] ancestor of the form, else the closest <section>, else <main>.
 *   Inside the scope:
 *     [data-rc-filter-list="<name>"]     Collection List wrapper(s) holding cards. Lists with
 *                                        data-rc-filter-paged also get their other pagination pages
 *                                        fetched (only once, on the first query).
 *     [data-rc-filter-item]              a card (usually the link inside .w-dyn-item)
 *     [data-rc-filter-text]              searchable text inside a card (title, summary); matches get
 *                                        <mark class="rc-filter-hl">
 *     [data-rc-filter-pager]             hidden while a query is active (Webflow pagination)
 *     [data-rc-filter-empty]             shown (hidden attr removed) when nothing matches
 *
 * Progressive enhancement: without JS the form is a plain GET to the same page and every card stays
 * visible. With JS the form filters in place, ?q= is kept in the URL (replaceState) and a ?q= on load
 * is applied. Cards are never hidden before a query exists. No animation is used, so
 * prefers-reduced-motion needs no special case beyond not scrolling.
 */
const HIDE = 'data-rc-filtered';
const MAX_PAGES = 20;
const MIN_CHARS = 2;

// Case- and accent-insensitive key; Turkish dotless/dotted i fold to "i".
function fold(s) {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Per-character folded string with an index map back to the original string.
function foldMap(s) {
  let out = '';
  const map = [];
  for (let i = 0; i < s.length; i++) {
    const f = fold(s[i]);
    for (let k = 0; k < f.length; k++) {
      out += f[k];
      map.push(i);
    }
  }
  return { out, map };
}

function scopeOf(form) {
  return (
    form.closest('[data-rc-filter-scope]') ||
    form.closest('section') ||
    form.closest('main') ||
    document
  );
}

function hide(el) {
  el.setAttribute(HIDE, 'out');
  el.hidden = true;
}

function show(el) {
  el.removeAttribute(HIDE);
  el.hidden = false;
}

function isHidden(el) {
  return el.hasAttribute(HIDE);
}

function rowOf(item) {
  return item.closest('.w-dyn-item') || item;
}

function textNodesOf(el) {
  const out = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) if (n.nodeValue.trim()) out.push(n);
  return out;
}

function clearMarks(el) {
  el.querySelectorAll('mark.rc-filter-hl').forEach((m) => {
    m.replaceWith(document.createTextNode(m.textContent));
  });
  el.normalize();
}

// Wraps every occurrence of the folded query in the element's text nodes. Returns true on a match.
function mark(el, q) {
  let hit = false;
  textNodesOf(el).forEach((node) => {
    const src = node.nodeValue;
    const { out, map } = foldMap(src);
    let from = 0;
    const ranges = [];
    let i;
    while ((i = out.indexOf(q, from)) !== -1) {
      const start = map[i];
      const end = map[i + q.length - 1] + 1;
      ranges.push([start, end]);
      from = i + q.length;
    }
    if (!ranges.length) return;
    hit = true;
    const frag = document.createDocumentFragment();
    let last = 0;
    ranges.forEach(([s, e]) => {
      if (s > last) frag.appendChild(document.createTextNode(src.slice(last, s)));
      const m = document.createElement('mark');
      m.className = 'rc-filter-hl';
      m.textContent = src.slice(s, e);
      frag.appendChild(m);
      last = e;
    });
    if (last < src.length) frag.appendChild(document.createTextNode(src.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  return hit;
}

function itemKey(item) {
  return item.getAttribute('href') || item.textContent.trim();
}

export default function cmsFilter(form) {
  const input = form.querySelector('[data-rc-filter-input]') || form.querySelector('input');
  if (!input) return;
  const scope = scopeOf(form);
  const clearBtn = form.querySelector('[data-rc-filter-clear]');
  const empty = scope.querySelector('[data-rc-filter-empty]');
  const pagers = () => scope.querySelectorAll('[data-rc-filter-pager]');

  // Screen-reader status (created once, visually hidden by the sr-only utility / inline fallback).
  let status = scope.querySelector('[data-rc-filter-status]');
  if (!status) {
    status = document.createElement('div');
    status.setAttribute('data-rc-filter-status', '');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.className = 'sr-only';
    status.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
    form.appendChild(status);
  }

  let fetched = null; // Promise, resolved once extra pages are merged
  let timer = 0;
  let current = '';

  // Fetch the remaining pages of every paged list and append their cards (hidden) to the live list.
  function fetchRest() {
    if (fetched) return fetched;
    const lists = [...scope.querySelectorAll('[data-rc-filter-list][data-rc-filter-paged]')];
    fetched = Promise.all(
      lists.map(async (list) => {
        const name = list.getAttribute('data-rc-filter-list');
        const host = list.querySelector('.w-dyn-items') || list;
        const seen = new Set([...list.querySelectorAll('[data-rc-filter-item]')].map(itemKey));
        let next = list.querySelector('a.w-pagination-next');
        let pages = 0;
        while (next && pages < MAX_PAGES) {
          pages += 1;
          let doc;
          try {
            const res = await fetch(new URL(next.getAttribute('href'), location.href), {
              credentials: 'same-origin',
            });
            if (!res.ok) break;
            doc = new DOMParser().parseFromString(await res.text(), 'text/html');
          } catch (e) {
            break;
          }
          const remote = doc.querySelector(`[data-rc-filter-list="${name}"]`);
          if (!remote) break;
          remote.querySelectorAll('[data-rc-filter-item]').forEach((item) => {
            const key = itemKey(item);
            if (seen.has(key)) return;
            seen.add(key);
            const row = document.importNode(rowOf(item), true);
            row.setAttribute('data-rc-filter-extra', '');
            hide(row);
            host.appendChild(row);
          });
          next = remote.querySelector('a.w-pagination-next');
        }
      })
    ).catch(() => {});
    return fetched;
  }

  function items() {
    return [...scope.querySelectorAll('[data-rc-filter-item]')];
  }

  function reset() {
    items().forEach((item) => {
      item.querySelectorAll('[data-rc-filter-text]').forEach(clearMarks);
      const row = rowOf(item);
      if (row.hasAttribute('data-rc-filter-extra')) hide(row);
      else show(row);
    });
    scope.querySelectorAll('[data-rc-filter-list]').forEach(show);
    pagers().forEach(show);
    if (empty) empty.hidden = true;
    status.textContent = '';
  }

  function apply(raw) {
    const q = fold(raw.trim());
    current = q;
    reset();
    if (q.length < MIN_CHARS) return;
    pagers().forEach(hide);
    let count = 0;
    items().forEach((item) => {
      let hit = false;
      item.querySelectorAll('[data-rc-filter-text]').forEach((t) => {
        if (mark(t, q)) hit = true;
      });
      const row = rowOf(item);
      if (hit) {
        show(row);
        count += 1;
      } else {
        hide(row);
      }
    });
    // Hide lists that ended up with no visible card (keeps grid spacing clean).
    scope.querySelectorAll('[data-rc-filter-list]').forEach((l) => {
      const visible = [...l.querySelectorAll('[data-rc-filter-item]')].some(
        (i) => !isHidden(rowOf(i))
      );
      if (visible) show(l);
      else hide(l);
    });
    if (empty) empty.hidden = count > 0;
    status.textContent = count === 1 ? '1 result' : `${count} results`;
  }

  function syncUrl(raw) {
    const name = input.getAttribute('name') || 'q';
    const url = new URL(location.href);
    if (raw.trim()) url.searchParams.set(name, raw.trim());
    else url.searchParams.delete(name);
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }

  function run() {
    const raw = input.value;
    syncUrl(raw);
    const q = fold(raw.trim());
    if (q.length >= MIN_CHARS && !fetched) {
      apply(raw); // show what's on this page right away…
      fetchRest().then(() => {
        if (current === q) apply(input.value); // …then include the fetched pages
      });
    } else {
      apply(raw);
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(run, 150);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    run();
  });
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      input.value = '';
      run();
      input.focus();
    });
  }

  // Apply ?q= from the URL (also the no-JS GET target).
  const initial = new URL(location.href).searchParams.get(input.getAttribute('name') || 'q');
  if (initial) {
    input.value = initial;
    run();
  }
}
