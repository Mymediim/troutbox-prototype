import { models, variants, seed } from './data.mjs';
import { lureArt } from './art.mjs';
import { uid, validQuantity, addStock, loseStock, restoreLoss, wish, saveCatch, deleteCatch, catchStats } from './domain.mjs';

const KEY = 'troutbox.prototype.v1';
let state, storageError = false;
try {
  const raw = localStorage.getItem(KEY);
  state = raw ? JSON.parse(raw) : seed();
  if (state.version !== 1 || !state.stock || !Array.isArray(state.catches) || !Array.isArray(state.losses) || !Array.isArray(state.wishes) || !Array.isArray(state.customModels) || !Array.isArray(state.customVariants)) throw Error();
} catch { state = seed(); storageError = true; }
let page = 'box', archive = false, detail = null;
const filters = { box: { search: '', category: 'Все', tag: 'Все', brand: 'Все', min: '', max: '', sort: 'default' }, catalog: { search: '', category: 'Все', tag: 'Все', brand: 'Все', min: '', max: '', sort: 'default' }, wish: { search: '', category: 'Все', tag: 'Все', brand: 'Все', min: '', max: '', sort: 'default' } };
let focusBeforeSheet, scrollBeforeDetail = 0, toastTimer, toastActions = {};
const root = document.querySelector('#app'), sheet = document.querySelector('#sheet');
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = value => value == null ? '—' : Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 3, useGrouping: false });
const date = value => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
const allModels = () => [...models, ...state.customModels];
const allVariants = () => [...variants, ...state.customVariants];
const variant = id => allVariants().find(v => v.id === id);
const modelFor = v => allModels().find(m => m.id === v.modelId);
const paths = {
 box: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M3 12h18M8 7V4h8v3m-4 5v4"/>',
 catalog: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
 fish: '<path d="M3 12c4-7 12-7 16 0-4 7-12 7-16 0Zm16 0 3-5v10l-3-5M9 7l2-3 4 3M9 17l2 3 4-3"/><circle cx="7" cy="11" r=".7"/>',
 search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 filter: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
 plus: '<path d="M12 5v14M5 12h14"/>', back: '<path d="m14 5-7 7 7 7"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
 settings: '<path d="m9 3-1 3-3 1 1 4-2 2 2 3 3 1 1 4 4-1 2-2 4 1 1-4-2-2 1-4-4-1-2-3Z"/><circle cx="12" cy="12" r="3"/>',
 check: '<path d="m5 12 4 4L20 5"/>', more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
 moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>',
 lost: '<path d="M12 3v9a5 5 0 0 1-10 0V9l3 3M12 3h7m-3 0v4m-2 10 7 4m-7 0 7-4"/>',
 edit: '<path d="m15 4 5 5M4 20l1-6L17 2l5 5L10 19l-6 1Z"/>', trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', photo: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="m6 17 5-5 4 4 3-3M9 5l2-3h4l2 3"/><circle cx="8" cy="9" r="1"/>',
 trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.fish}</svg>`;
const btn = (action, label, cls = '', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageError = false; }
  catch { storageError = true; }
}
function applyTheme() { document.documentElement.dataset.theme = state.theme === 'light' ? 'light' : 'dark'; document.querySelector('meta[name="theme-color"]').content = state.theme === 'light' ? '#f5f4f0' : '#11171b'; }
function commit(message) { persist(); render(); if (message) toast(message); }
function toast(message, actions = []) {
  clearTimeout(toastTimer); toastActions = Object.fromEntries(actions.map((a, i) => [i, a.run]));
  const el = document.querySelector('#toast');
  el.innerHTML = `<span>${e(message)}</span>${actions.length ? `<div>${actions.map((a, i) => btn('toast', e(a.label), 'toast-action', `data-index="${i}"`)).join('')}</div>` : ''}`;
  el.classList.add('visible'); toastTimer = setTimeout(() => el.classList.remove('visible'), actions.length ? 15000 : 4000);
}
function modal(title, content, subtitle = '') {
  focusBeforeSheet = document.activeElement;
  document.querySelector('#sheet-content').innerHTML = `<div class="sheet-handle"></div><div class="sheet-head"><div><h2 id="sheet-title">${e(title)}</h2>${subtitle ? `<p>${e(subtitle)}</p>` : ''}</div>${btn('close', icon('close'), 'icon-button', 'aria-label="Закрыть"')}</div>${content}`;
  if (!sheet.open) sheet.showModal();
  document.body.classList.add('modal-open');
}
function closeModal() { sheet.close(); document.body.classList.remove('modal-open'); if (focusBeforeSheet?.isConnected) focusBeforeSheet.focus(); }
sheet.addEventListener('close', () => document.body.classList.remove('modal-open'));
sheet.addEventListener('click', ev => { if (ev.target === sheet) { const r = sheet.getBoundingClientRect(); if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) closeModal(); } });
const field = (label, name, value = '', attr = '', type = 'text') => `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${e(value)}" ${attr}></label>`;
const errorBox = '<p class="form-error" role="alert"></p>';
function render() {
  applyTheme();
  const total = Object.values(state.stock).reduce((s, p) => s + p.quantity, 0);
  const count = Object.values(state.stock).filter(p => p.quantity > 0).length;
  root.innerHTML = `<header class="brand-header"><a class="wordmark" href="#" data-action="home" aria-label="TroutBox — моя коробка"><span class="brand-symbol">${icon('fish')}</span>TROUT<span>BOX</span><b>®</b></a>${btn('settings', icon('settings'), 'icon-button', 'aria-label="Настройки"')}</header>${storageError ? '<div class="storage-warning" role="alert">Не удалось прочитать или сохранить данные. Сейчас изменения могут храниться только до закрытия страницы.</div>' : ''}<main>${detail ? renderDetail() : `<section class="page-heading"><div class="eyebrow">${page === 'box' ? 'ЛИЧНЫЙ АРСЕНАЛ' : page === 'catalog' ? 'НАЙДИ СВОЮ ПРИМАНКУ' : 'СЛЕДУЮЩИЕ В КОРОБКУ'}</div><div class="title-row"><h1>${page === 'box' ? 'Моя коробка' : page === 'catalog' ? 'Каталог' : 'Хочу'}</h1>${page === 'box' ? btn('add-menu', icon('plus'), 'add-button', 'aria-label="Добавить приманку"') : `<span class="heading-count">${page === 'catalog' ? allModels().length : state.wishes.length}</span>`}</div><p class="page-caption">${page === 'box' ? `${count} вариантов · ${total} приманок в арсенале` : page === 'catalog' ? 'Твой следующий рабочий вариант' : 'Чтобы не забыть, за чем вернуться'}</p></section>${page === 'box' && !archive ? `<section class="field-summary"><div><span class="summary-label">НА ВОДЕ РЕШАЮТ ДЕТАЛИ</span><h2>У каждой приманки<br>своя история.</h2><p>${icon('fish')} <strong>${state.catches.length}</strong> рыб в твоей истории</p></div><div class="summary-art"><span class="orbit"></span>${icon('fish')}<span class="coordinate">TROUT / AREA</span></div></section>` : ''}${page === 'box' ? `<div class="segments" role="group" aria-label="Состояние арсенала">${btn('available', 'В наличии', !archive ? 'active' : '', `aria-pressed="${!archive}"`)}${btn('archive', `Потеряно <span>${state.losses.reduce((s, l) => s + l.quantity, 0)}</span>`, archive ? 'active' : '', `aria-pressed="${archive}"`)}</div>` : ''}${renderSearch()}${renderCategories()}<div id="results">${renderResults()}</div>`}</main><nav class="bottom-nav" aria-label="Главная навигация">${[['box', 'box', 'Моя коробка'], ['catalog', 'catalog', 'Каталог'], ['wish', 'heart', 'Хочу']].map(([key, glyph, label]) => btn('navigate', `${icon(glyph)}<span>${label}</span>${key === 'wish' && state.wishes.length ? `<b>${state.wishes.length}</b>` : ''}`, page === key ? 'active' : '', `data-page="${key}" ${page === key ? 'aria-current="page"' : ''}`)).join('')}</nav>`;
}
function renderSearch() {
  const f = filters[page], active = f.tag !== 'Все' || f.brand !== 'Все' || f.min || f.max || f.sort !== 'default';
  return `<div class="search-row"><label class="search">${icon('search')}<input id="search" type="search" placeholder="Найти приманку" aria-label="Найти приманку" value="${e(f.search)}" autocomplete="off"></label>${btn('filters', icon('filter') + (active ? '<i></i>' : ''), 'filter-button', 'aria-label="Фильтры"')}</div>`;
}
function renderCategories() {
  return `<div class="chips" role="group" aria-label="Категории приманок">${['Все', 'Блёсны', 'Воблеры', 'Силикон'].map(c => btn('category', e(c), `chip ${filters[page].category === c ? 'selected' : ''}`, `data-category="${c}" aria-pressed="${filters[page].category === c}"`)).join('')}</div>`;
}
function getEntries() {
  let entries;
  if (page === 'box' && archive) entries = state.losses.map(l => ({ v: variant(l.variantId), loss: l }));
  else if (page === 'box') entries = Object.entries(state.stock).filter(([, p]) => p.quantity > 0).map(([id]) => ({ v: variant(id) }));
  else if (page === 'wish') entries = state.wishes.map(id => ({ v: variant(id) }));
  else entries = allModels().map(m => ({ v: allVariants().find(v => v.modelId === m.id) }));
  const f = filters[page];
  return entries.filter(entry => {
    if (!entry.v) return false;
    const v = entry.v, m = modelFor(v);
    if (f.category !== 'Все' && m.category !== f.category) return false;
    if (f.brand !== 'Все' && m.brand !== f.brand) return false;
    if (f.tag !== 'Все' && !state.stock[v.id]?.tags.includes(f.tag)) return false;
    if (f.search && !`${m.name} ${m.brand} ${v.colour}`.toLowerCase().includes(f.search.toLowerCase().trim())) return false;
    // Catalogue shows a matching weight variant rather than excluding a model whose default weight differs.
    if (page === 'catalog' && (f.min || f.max)) {
      const matching = allVariants().find(x => x.modelId === m.id && (!f.min || x.weight >= Number(f.min)) && (!f.max || x.weight <= Number(f.max)));
      if (!matching) return false; entry.v = matching;
    } else if ((f.min && v.weight < Number(f.min)) || (f.max && v.weight > Number(f.max))) return false;
    return true;
  }).sort((a, b) => f.sort === 'name' ? modelFor(a.v).name.localeCompare(modelFor(b.v).name) : f.sort === 'weight' ? a.v.weight - b.v.weight : 0);
}
function renderResults() {
  const entries = getEntries();
  if (!entries.length) return `<section class="empty">${icon(page === 'wish' ? 'heart' : 'box')}<h2>${filters[page].search || filters[page].category !== 'Все' ? 'Ничего не нашлось' : page === 'wish' ? 'Планы на следующую рыбалку' : archive ? 'Пока без потерь' : 'Начни свою коллекцию'}</h2><p>${page === 'wish' ? 'Сохраняй здесь варианты, которые хочешь добавить в коробку.' : archive ? 'Потерянные приманки появятся здесь. Их можно будет сразу добавить в «Хочу».' : 'Выбери приманку из каталога или добавь свою.'}</p>${btn('clear-filters', 'Сбросить фильтры', 'secondary')}${btn('go-catalog', 'Открыть каталог', 'primary')}</section>`;
  return `<div class="list-caption"><span>${page === 'box' ? archive ? 'АРХИВ ПОТЕРЬ' : 'ТВОЯ КОЛЛЕКЦИЯ' : page === 'wish' ? 'СПИСОК ЖЕЛАНИЙ' : 'МОДЕЛИ'} <b>${entries.length}</b></span><span>${page === 'catalog' ? 'ДЕМОКАТАЛОГ' : 'ПО ВАРИАНТАМ'}</span></div><div class="lure-grid">${entries.map(({ v, loss }) => card(v, loss)).join('')}</div><div class="end-mark"><span></span>${icon('fish')}<span></span></div>`;
}
function card(v, loss) {
  const m = modelFor(v), p = state.stock[v.id], stats = catchStats(state, v.id), inBox = p?.quantity > 0, inWish = state.wishes.includes(v.id);
  return `<article class="lure-card"><button class="card-open" data-action="detail" data-id="${v.id}" aria-label="${e(m.name)}, ${e(v.colour)}, ${num(v.weight)} г"><div class="product-image"><span class="image-code">${e(m.brand.toUpperCase())}</span><img src="${e(lureArt(m, v))}" alt="${e(m.name)} — ${e(v.colour)}" loading="lazy">${(loss?.quantity ?? (page === 'box' ? p?.quantity : 0)) > 1 ? `<span class="quantity" aria-label="Количество: ${loss?.quantity ?? p.quantity}">${loss?.quantity ?? p.quantity}</span>` : ''}${page === 'box' && !archive && stats.count ? `<span class="catch-badge" aria-label="Поймано рыб: ${stats.count}">${icon('fish')}${stats.count}</span>` : ''}${page === 'catalog' && (inBox || inWish) ? `<span class="owned-badge">${icon(inBox ? 'check' : 'heart')}${inBox ? 'В коробке' : 'В Хочу'}</span>` : ''}</div><div class="card-copy"><span class="brand-label">${e(m.brand)}</span><h3>${e(m.name)}</h3><p><span class="colour-dot" style="--swatch:${v.hex}"></span>${e(v.colour)}</p><div class="card-bottom"><span>${num(v.weight)} г <i>·</i> ${m.length ? `${num(m.length)} мм` : m.category}</span>${page === 'box' && !archive && p?.tags[0] ? `<span class="tag-label ${p.tags[0] === 'Рабочая' ? 'working' : ''}">${e(p.tags[0])}</span>` : ''}</div></div></button>${loss ? `<div class="archive-actions"><small>${date(loss.date)}</small>${btn('wish', `${icon('heart')} В Хочу`, 'small-primary', `data-id="${v.id}"`)}${btn('restore', 'Восстановить', 'text-button', `data-loss="${loss.id}"`)}</div>` : page === 'wish' ? `<div class="wish-actions">${btn('add-stock', `${icon('plus')} В коробку`, 'small-primary', `data-id="${v.id}"`)}${btn('unwish', icon('close'), 'icon-button', `data-id="${v.id}" aria-label="Убрать ${e(m.name)} из Хочу"`)}</div>` : ''}</article>`;
}
function renderDetail() {
  const v = variant(detail.id), m = modelFor(v), p = state.stock[v.id], stats = catchStats(state, v.id), owned = p?.quantity > 0, isWish = state.wishes.includes(v.id);
  const siblings = allVariants().filter(x => x.modelId === m.id);
  const colours = siblings.filter((x, i, a) => a.findIndex(y => y.colour === x.colour) === i);
  const weights = [...new Set(siblings.filter(x => x.colour === v.colour).map(x => x.weight))];
  const catches = state.catches.filter(c => c.variantId === v.id).sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="detail-top">${btn('back', `${icon('back')} Назад`, 'back-button')}${btn('detail-menu', icon('more'), 'icon-button', 'aria-label="Действия с приманкой"')}</div><section class="detail-hero"><span class="detail-category">${e(m.kind)}</span><img src="${e(lureArt(m, v))}" alt="${e(m.name)} — ${e(v.colour)}">${p?.quantity > 1 ? `<span class="quantity">${p.quantity}</span>` : ''}<div class="hero-bottom"><span>${e(m.brand.toUpperCase())}</span><span>${e(v.code || 'CUSTOM')} / ${num(v.weight)} G</span></div></section><section class="detail-intro"><div class="brand-label">${e(m.brand)}</div><div class="title-row"><h1>${e(m.name)}</h1>${btn('wish', icon(isWish ? 'check' : 'heart'), `icon-button ${isWish ? 'accent' : ''}`, `data-id="${v.id}" aria-label="${isWish ? 'Уже в Хочу' : 'Добавить в Хочу'}"`)}</div><p class="variant-caption">${e(v.colour)} · ${num(v.weight)} г ${owned ? `<span class="stock-indicator">${p.quantity} шт. в коробке</span>` : '<span class="muted">Нет в коробке</span>'}</p></section><section class="variant-picker"><div class="section-mini">РАСЦВЕТКА <span>${e(v.colour)}</span></div><div class="swatches">${colours.map(c => btn('variant-colour', `<span style="background:linear-gradient(135deg,${c.hex} 45%,${c.back} 55%)"></span>`, c.colour === v.colour ? 'selected' : '', `data-colour="${e(c.colour)}" aria-label="Расцветка ${e(c.colour)}" aria-pressed="${c.colour === v.colour}"`)).join('')}</div><div class="weight-pills">${weights.map(w => btn('variant-weight', `${num(w)} г`, w === v.weight ? 'selected' : '', `data-weight="${w}" aria-pressed="${w === v.weight}"`)).join('')}</div></section><div class="detail-main-action">${owned ? btn('catch', `${icon('fish')} Поймал рыбу ${icon('plus')}`, 'primary wide', `data-id="${v.id}"`) : btn('add-stock', `${icon('plus')} Добавить в коробку`, 'primary wide', `data-id="${v.id}"`)}</div>${stats.count || owned ? `<section class="catch-section"><div class="section-title"><h2>История уловов</h2><span>${stats.count}</span></div><div class="catch-stats"><div>${icon('fish')}<strong>${stats.count}</strong><small>поймано рыб</small></div><div>${icon('trophy')}<strong>${stats.best == null ? '—' : `${num(stats.best)} <em>кг</em>`}</strong><small>самый крупный улов</small></div></div>${catches.length ? `<div class="catch-list">${catches.map(c => `<div class="catch-row"><div class="fish-mark">${icon('fish')}</div><div><strong>${e(c.species || 'Рыба поймана')}</strong><small>${date(c.date)} · ${new Date(c.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small></div><b>${c.weight == null ? '—' : `${num(c.weight)} кг`}</b>${btn('edit-catch', icon('more'), 'icon-button', `data-catch="${c.id}" aria-label="Редактировать улов ${e(c.species || '')}"`)}</div>`).join('')}</div>` : '<p class="empty-history">Первый улов — начало истории.<br>Отметь рыбу, пойманную на эту приманку.</p>'}</section>` : ''}<section class="spec-section"><h2>О приманке</h2><dl><div><dt>Тип</dt><dd>${e(m.type || 'Не указан')}</dd></div><div><dt>Длина</dt><dd>${m.length ? `${num(m.length)} мм` : 'Не указана'}</dd></div><div><dt>Вес</dt><dd>${num(v.weight)} г</dd></div><div><dt>Материал</dt><dd>${e(m.material || 'Не указан')}</dd></div></dl>${p ? `<div class="personal-note"><div class="section-title"><h3>Мои заметки</h3>${btn('edit-stock', icon('edit'), 'icon-button', 'aria-label="Редактировать заметки"')}</div><p>${e(p.note || 'Добавь проводку, условия или то, что стоит запомнить.')}</p><div class="tag-row">${p.tags.map(t => `<span class="chip">${e(t)}</span>`).join('')}<span class="condition">${e(p.condition)}</span></div>${p.purchaseDate ? `<small class="muted">Дата покупки: ${date(p.purchaseDate)}</small>` : ''}</div>` : ''}</section>${!owned && state.losses.some(l => l.variantId === v.id) ? `<section class="lost-notice">${icon('lost')}<p>Приманка в архиве потерь.<br>История уловов сохранена.</p>${btn('wish', 'В Хочу', 'text-button', `data-id="${v.id}"`)}</section>` : ''}`;
}
function openDetail(id) { scrollBeforeDetail = window.scrollY; detail = { id }; render(); window.scrollTo(0, 0); }
function navigate(next) { detail = null; page = next; render(); window.scrollTo(0, 0); }
function addDialog(id) {
  const v = variant(id), m = modelFor(v);
  modal('Добавить в коробку', `<form id="add-form" data-id="${id}"><div class="mini-product"><img src="${e(lureArt(m, v))}" alt=""><div><strong>${e(m.name)}</strong><p>${e(v.colour)} · ${num(v.weight)} г</p></div></div>${field('Количество, шт.', 'quantity', 1, 'min="1" max="9999" step="1" required inputmode="numeric"', 'number')}${errorBox}<button class="primary wide" type="submit">${icon('plus')} Добавить в коробку</button></form>`);
}
function catchDialog(id, catchId) {
  const record = state.catches.find(c => c.id === catchId), v = variant(id), m = modelFor(v);
  modal(record ? 'Этот улов' : 'Есть рыба!', `<form id="catch-form" data-id="${id}" ${record ? `data-catch="${record.id}"` : ''}><div class="catch-celebration">${icon('fish')}<span>${e(m.name)} · ${e(v.colour)}</span></div>${field('Вид рыбы <span class="optional">необязательно</span>', 'species', record?.species, 'maxlength="80" placeholder="Например, радужная форель" list="fish-types"')}<datalist id="fish-types"><option>Радужная форель</option><option>Форель</option><option>Окунь</option><option>Голавль</option><option>Щука</option></datalist>${field('Вес, кг <span class="optional">необязательно</span>', 'weight', record?.weight == null ? '' : num(record.weight), 'inputmode="decimal" placeholder="Например, 1,25" autocomplete="off"')}<p class="form-hint">Можно просто сохранить — главное, что приманка работает.</p>${errorBox}<button class="primary wide" type="submit">${icon('check')} Сохранить улов</button>${record ? btn('delete-catch', `${icon('trash')} Удалить запись`, 'danger-text wide', `data-catch="${record.id}"`) : ''}</form>`);
}
function lossDialog(id) {
  const q = state.stock[id]?.quantity || 0;
  if (!q) return toast('Этой приманки уже нет в коробке');
  if (q === 1) return performLoss(id, 1);
  modal('Потерял приманку', `<form id="loss-form" data-id="${id}"><p class="form-hint">В коробке ${q} шт. Сколько потеряно?</p>${field('Количество, шт.', 'quantity', 1, `min="1" max="${q}" step="1" required inputmode="numeric"`, 'number')}${errorBox}<button class="primary wide" type="submit">Отметить потерю</button></form>`);
}
function performLoss(id, q) {
  const loss = loseStock(state, id, q); if (sheet.open) closeModal(); persist(); render();
  toast(q === 1 ? 'Приманка отмечена как потерянная' : `Отмечено как потерянные: ${q} шт.`, [
    { label: 'В Хочу', run: () => addWish(id) },
    { label: 'Отменить', run: () => { try { restoreLoss(state, loss.id); commit('Потеря отменена'); } catch (err) { toast(err.message); } } }
  ]);
}
function addWish(id) {
  if (sheet.open) closeModal();
  const added = wish(state, id); persist(); render();
  toast(added ? 'Этот вариант добавлен в Хочу' : 'Уже в Хочу', [{ label: 'Открыть список', run: () => navigate('wish') }]);
}
function restoreDialog(lossId) {
  const loss = state.losses.find(l => l.id === lossId); if (!loss) return;
  if (loss.quantity === 1) { restoreLoss(state, lossId); return commit('Приманка возвращена в коробку'); }
  modal('Вернуть в коробку', `<form id="restore-form" data-loss="${lossId}">${field('Количество, шт.', 'quantity', loss.quantity, `min="1" max="${loss.quantity}" step="1" required`, 'number')}${errorBox}<button class="primary wide" type="submit">Восстановить</button></form>`);
}
function editStockDialog() {
  const p = state.stock[detail.id];
  if (!p) return;
  modal('Моя приманка', `<form id="edit-stock-form" data-id="${detail.id}">${p.quantity > 0 ? field('Количество в наличии, шт.', 'quantity', p.quantity, 'min="1" max="9999" required step="1"', 'number') : '<p class="form-hint">Все экземпляры в архиве. Количество можно вернуть через восстановление.</p>'}<label class="field"><span>Состояние</span><select name="condition">${['Новая', 'Хорошее', 'Есть следы использования', 'Нужен ремонт'].map(c => `<option ${c === p.condition ? 'selected' : ''}>${c}</option>`).join('')}</select></label>${field('Дата покупки', 'purchaseDate', p.purchaseDate, '', 'date')}<fieldset><legend>Теги</legend><div class="check-chips">${['Рабочая', 'Новая', 'На тесте'].map(t => `<label><input type="checkbox" name="tags" value="${t}" ${p.tags.includes(t) ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></fieldset><label class="field"><span>Заметка</span><textarea name="note" rows="3" maxlength="2000" placeholder="Проводка, условия, наблюдения…">${e(p.note)}</textarea></label>${errorBox}<button class="primary wide" type="submit">Сохранить</button></form>`);
}
function manualDialog() {
  modal('Своя приманка', `<form id="manual-form"><label class="photo-upload">${icon('photo')}<span id="photo-label">Добавить фото</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp"><img id="photo-preview" alt="Предпросмотр фото" hidden></label>${field('Название <span class="required">*</span>', 'name', '', 'required maxlength="100" placeholder="Как называется приманка?"')}${field('Бренд', 'brand', '', 'maxlength="80" placeholder="Необязательно"')}<label class="field"><span>Категория</span><select name="category"><option value="">Не указана</option>${['Блёсны', 'Воблеры', 'Силикон', 'Другое'].map(c => `<option>${c}</option>`).join('')}</select></label><div class="two-fields">${field('Вес, г', 'weight', '', 'inputmode="decimal" placeholder="2,5"')}${field('Длина, мм', 'length', '', 'inputmode="decimal" placeholder="30"')}</div>${field('Расцветка', 'colour', '', 'maxlength="80" placeholder="Например, розовый / серебро"')}${field('Количество, шт. <span class="required">*</span>', 'quantity', 1, 'min="1" max="9999" step="1" required', 'number')}<label class="field"><span>Заметка</span><textarea name="note" rows="2" maxlength="2000"></textarea></label>${errorBox}<button class="primary wide" type="submit">Добавить в мою коробку</button></form>`, 'Только в твоём арсенале, не в общем каталоге');
}
function filtersDialog() {
  const f = filters[page];
  modal('Фильтры', `<form id="filter-form">${page === 'box' && !archive ? `<label class="field"><span>Тег</span><select name="tag">${['Все', 'Рабочая', 'Новая', 'На тесте'].map(t => `<option ${t === f.tag ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}<label class="field"><span>Бренд</span><select name="brand">${['Все', ...new Set(allModels().map(m => m.brand))].map(b => `<option ${b === f.brand ? 'selected' : ''}>${e(b)}</option>`).join('')}</select></label><div class="two-fields">${field('Вес от, г', 'min', f.min, 'min="0" step="any" inputmode="decimal" placeholder="Любой"', 'number')}${field('Вес до, г', 'max', f.max, 'min="0" step="any" inputmode="decimal" placeholder="Любой"', 'number')}</div><label class="field"><span>Сортировка</span><select name="sort"><option value="default">По умолчанию</option><option value="name" ${f.sort === 'name' ? 'selected' : ''}>По названию</option><option value="weight" ${f.sort === 'weight' ? 'selected' : ''}>По весу</option></select></label>${errorBox}<button class="primary wide" type="submit">Показать приманки</button>${btn('clear-filters', 'Сбросить фильтры', 'text-button wide')}</form>`);
}
function settingsDialog() {
  modal('Настройки', `<div class="settings-section"><h3>Оформление</h3><div class="theme-options">${btn('theme', `${icon('moon')} Тёмная`, state.theme !== 'light' ? 'selected' : '', 'data-theme="dark" aria-pressed="' + (state.theme !== 'light') + '"')}${btn('theme', `${icon('sun')} Светлая`, state.theme === 'light' ? 'selected' : '', 'data-theme="light" aria-pressed="' + (state.theme === 'light') + '"')}</div></div><div class="about-block"><span class="eyebrow">TRОUTBOX / PROTOTYPE 01</span><h3>Твоя коробка всегда рядом.</h3><p>Это интерактивный прототип. Модели, характеристики, уловы и изображения демонстрационные. Иллюстрации не являются фотографиями товаров.</p><p>Изменения и твои фото хранятся только в этом браузере. Заказов, аккаунтов и облачной синхронизации здесь нет.</p></div><div class="settings-section"><h3>Начать заново</h3>${btn('reset-confirm', 'Вернуть демоколлекцию', 'secondary wide', 'data-empty="false"')}${btn('reset-confirm', 'Начать с пустой коробки', 'text-button wide', 'data-empty="true"')}</div>`);
}
function resetFilters() { Object.assign(filters[page], { search: '', category: 'Все', tag: 'Все', brand: 'Все', min: '', max: '', sort: 'default' }); }
function positiveOptional(raw, label) {
  const text = String(raw || '').trim(); if (!text) return null;
  const n = Number(text.replace(',', '.'));
  if (!/^\d+(?:[.,]\d+)?$/.test(text) || !Number.isFinite(n) || n <= 0) throw Error(`${label}: укажите число больше нуля`);
  return n;
}
async function photoData(file) {
  if (!file?.size) return null;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Выберите фото JPG, PNG или WebP');
  if (file.size > 8 * 1024 * 1024) throw Error('Фото должно быть меньше 8 МБ');
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw Error('Не удалось открыть фото. Выберите другое изображение JPG, PNG или WebP'); }
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = bitmap.width * scale; canvas.height = bitmap.height * scale;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return canvas.toDataURL('image/jpeg', .8);
}
document.addEventListener('input', ev => {
  if (ev.target.id === 'search') { filters[page].search = ev.target.value; document.querySelector('#results').innerHTML = renderResults(); }
});
document.addEventListener('change', async ev => {
  if (ev.target.name === 'photo') {
    const form = ev.target.form, err = form.querySelector('.form-error'); err.textContent = '';
    try { const data = await photoData(ev.target.files[0]); const preview = form.querySelector('#photo-preview'); preview.src = data || ''; preview.hidden = !data; form.querySelector('#photo-label').textContent = data ? 'Изменить фото' : 'Добавить фото'; }
    catch (error) { err.textContent = error.message; ev.target.value = ''; }
  }
});
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-action]'); if (!b) return; ev.preventDefault();
  const id = b.dataset.id || detail?.id;
  try {
    switch (b.dataset.action) {
      case 'home': navigate('box'); break;
      case 'navigate': navigate(b.dataset.page); break;
      case 'available': archive = false; render(); break;
      case 'archive': archive = true; filters.box.tag = 'Все'; render(); break;
      case 'detail': openDetail(id); break;
      case 'back': detail = null; render(); window.scrollTo(0, scrollBeforeDetail); break;
      case 'close': closeModal(); break;
      case 'settings': settingsDialog(); break;
      case 'theme': state.theme = b.dataset.theme; persist(); applyTheme(); settingsDialog(); break;
      case 'add-menu': modal('Пополнить коробку', `<div class="action-menu">${btn('catalog-from-menu', `${icon('catalog')}<span><strong>Из каталога</strong><small>Выбрать модель и расцветку</small></span>${icon('arrow')}`)}${btn('manual', `${icon('plus')}<span><strong>Добавить свою</strong><small>Если приманки нет в каталоге</small></span>${icon('arrow')}`)}</div>`); break;
      case 'catalog-from-menu': closeModal(); navigate('catalog'); break;
      case 'go-catalog': navigate('catalog'); break;
      case 'manual': manualDialog(); break;
      case 'category': filters[page].category = b.dataset.category; render(); break;
      case 'filters': filtersDialog(); break;
      case 'clear-filters': resetFilters(); if (sheet.open) closeModal(); render(); break;
      case 'add-stock': addDialog(id); break;
      case 'wish': addWish(id); break;
      case 'unwish': state.wishes = state.wishes.filter(x => x !== id); commit('Убрано из Хочу'); break;
      case 'catch': catchDialog(id); break;
      case 'edit-catch': catchDialog(detail.id, b.dataset.catch); break;
      case 'delete-catch': modal('Удалить этот улов?', `<p class="form-hint">Запись исчезнет из истории этой приманки.</p>${btn('confirm-delete-catch', 'Удалить запись', 'danger wide', `data-catch="${b.dataset.catch}"`)}${btn('close', 'Оставить', 'secondary wide')}`); break;
      case 'confirm-delete-catch': deleteCatch(state, b.dataset.catch); closeModal(); commit('Запись удалена'); break;
      case 'detail-menu': {
        const owned = state.stock[detail.id]?.quantity > 0;
        modal('Действия с приманкой', `<div class="action-menu">${owned ? btn('catch', `${icon('fish')}<span>Поймал рыбу</span>`) + btn('edit-stock', `${icon('edit')}<span>Редактировать</span>`) : ''}${btn('add-stock', `${icon('plus')}<span>${owned ? 'Добавить ещё' : 'Добавить в коробку'}</span>`)}${btn('wish', `${icon('heart')}<span>Добавить в Хочу</span>`)}${owned ? btn('loss', `${icon('lost')}<span>Потерял</span>`, 'danger-text') : state.stock[detail.id] ? btn('edit-stock', `${icon('edit')}<span>Редактировать заметки</span>`) : ''}</div>`); break;
      }
      case 'edit-stock': editStockDialog(); break;
      case 'loss': lossDialog(detail.id); break;
      case 'restore': restoreDialog(b.dataset.loss); break;
      case 'variant-colour': { const current = variant(detail.id); detail.id = allVariants().find(v => v.modelId === current.modelId && v.colour === b.dataset.colour && v.weight === current.weight)?.id || allVariants().find(v => v.modelId === current.modelId && v.colour === b.dataset.colour).id; render(); break; }
      case 'variant-weight': { const current = variant(detail.id); detail.id = allVariants().find(v => v.modelId === current.modelId && v.colour === current.colour && String(v.weight) === b.dataset.weight).id; render(); break; }
      case 'toast': { const fn = toastActions[b.dataset.index]; document.querySelector('#toast').classList.remove('visible'); fn?.(); break; }
      case 'remove-wish-after-add': state.wishes = state.wishes.filter(x => x !== id); closeModal(); commit('Убрано из Хочу'); break;
      case 'reset-confirm': modal('Начать заново?', `<p class="form-hint">Текущая коробка, свои фото, желания и история уловов будут заменены. Это действие нельзя отменить.</p>${btn('reset', b.dataset.empty === 'true' ? 'Создать пустую коробку' : 'Вернуть демоколлекцию', 'primary wide', `data-empty="${b.dataset.empty}"`)}${btn('close', 'Отмена', 'secondary wide')}`); break;
      case 'reset': { const theme = state.theme; state = seed(b.dataset.empty === 'true'); state.theme = theme; closeModal(); detail = null; page = 'box'; archive = false; Object.keys(filters).forEach(key => Object.assign(filters[key], { search: '', category: 'Все', tag: 'Все', brand: 'Все', min: '', max: '', sort: 'default' })); commit('Коробка готова'); window.scrollTo(0, 0); break; }
    }
  } catch (err) { toast(err.message); }
});
document.addEventListener('submit', async ev => {
  ev.preventDefault(); const form = ev.target, data = new FormData(form), values = Object.fromEntries(data), error = form.querySelector('.form-error'); if (error) error.textContent = '';
  try {
    if (form.id === 'add-form') {
      const id = form.dataset.id; addStock(state, id, values.quantity); closeModal(); commit('Добавлено в коробку');
      if (state.wishes.includes(id)) modal('Теперь в твоей коробке', `<p class="form-hint">Убрать этот вариант из списка желаний?</p>${btn('remove-wish-after-add', 'Убрать из Хочу', 'primary wide', `data-id="${id}"`)}${btn('close', 'Оставить в списке', 'secondary wide')}`);
    } else if (form.id === 'catch-form') { saveCatch(state, form.dataset.id, values, form.dataset.catch); closeModal(); commit('Улов сохранён. Хорошая работа!'); }
    else if (form.id === 'loss-form') performLoss(form.dataset.id, values.quantity);
    else if (form.id === 'restore-form') { restoreLoss(state, form.dataset.loss, values.quantity); closeModal(); commit('Приманка возвращена в коробку'); }
    else if (form.id === 'edit-stock-form') {
      const p = state.stock[form.dataset.id];
      const quantity = values.quantity == null ? p.quantity : validQuantity(values.quantity);
      Object.assign(p, { quantity, condition: values.condition, note: values.note.trim(), tags: data.getAll('tags'), purchaseDate: values.purchaseDate });
      closeModal(); commit('Изменения сохранены');
    } else if (form.id === 'filter-form') {
      if (values.min && values.max && Number(values.min) > Number(values.max)) throw Error('Вес «от» не должен быть больше веса «до»');
      Object.assign(filters[page], values); closeModal(); render();
    } else if (form.id === 'manual-form') {
      if (!values.name.trim()) throw Error('Введите название приманки');
      const quantity = validQuantity(values.quantity), weight = positiveOptional(values.weight, 'Вес'), length = positiveOptional(values.length, 'Длина');
      const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
      let photo; try { photo = await photoData(data.get('photo')); } finally { submit.disabled = false; }
      if (!form.isConnected) return;
      const modelId = `custom-${uid()}`, id = `${modelId}-v1`;
      state.customModels.push({ id: modelId, name: values.name.trim(), brand: values.brand.trim() || 'Моя приманка', category: values.category || 'Другое', length, kind: values.category || 'Своя приманка', type: '', material: '' });
      state.customVariants.push({ id, modelId, colour: values.colour.trim() || 'Своя расцветка', weight, hex: '#d89c57', back: '#d0b784', photo });
      addStock(state, id, quantity); state.stock[id].note = values.note.trim(); closeModal(); page = 'box'; archive = false; resetFilters(); detail = { id }; commit('Своя приманка добавлена'); window.scrollTo(0, 0);
    }
  } catch (err) { if (error?.isConnected) error.textContent = err.message; else toast(err.message); }
});
render();
