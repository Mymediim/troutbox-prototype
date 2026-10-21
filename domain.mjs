export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function validQuantity(quantity) {
  const q = Number(quantity);
  if (!Number.isInteger(q) || q < 1 || q > 9999) throw new Error('Укажите целое количество от 1 до 9999');
  return q;
}
export function addStock(state, id, quantity) {
  const q = validQuantity(quantity);
  const next = (state.stock[id]?.quantity ?? 0) + q;
  validQuantity(next);
  state.stock[id] ??= { quantity: 0, condition: 'Хорошее', tags: [], note: '', purchaseDate: '' };
  state.stock[id].quantity = next;
  return state.stock[id];
}
export function loseStock(state, id, quantity) {
  const q = validQuantity(quantity);
  if (!state.stock[id] || state.stock[id].quantity < q) throw new Error('В коробке недостаточно приманок');
  const loss = { id: uid(), variantId: id, quantity: q, date: new Date().toISOString() };
  state.stock[id].quantity -= q;
  state.losses.unshift(loss);
  return loss;
}
export function restoreLoss(state, lossId, quantity) {
  const loss = state.losses.find(l => l.id === lossId);
  if (!loss) throw new Error('Запись о потере уже восстановлена');
  const q = validQuantity(quantity ?? loss.quantity);
  if (q > loss.quantity) throw new Error('Количество больше оставшегося в архиве');
  addStock(state, loss.variantId, q);
  loss.quantity -= q;
  state.losses = state.losses.filter(l => l.quantity > 0);
}
export function wish(state, id) {
  const added = !state.wishes.includes(id);
  if (added) state.wishes.push(id);
  return added;
}
export function parseWeight(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (!/^\d+(?:[.,]\d+)?$/.test(raw)) throw new Error('Укажите вес больше нуля, например 1,25');
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) throw new Error('Укажите вес больше нуля, например 1,25');
  return n;
}
export function saveCatch(state, id, input, catchId) {
  const weight = parseWeight(input.weight);
  const species = String(input.species ?? '').trim().slice(0, 80);
  if (catchId) {
    const record = state.catches.find(c => c.id === catchId && c.variantId === id);
    if (!record) throw new Error('Улов не найден');
    Object.assign(record, { weight, species });
    return record;
  }
  const record = { id: uid(), variantId: id, weight, species, date: new Date().toISOString() };
  state.catches.push(record);
  return record;
}
export function deleteCatch(state, catchId) { state.catches = state.catches.filter(c => c.id !== catchId); }
export function catchStats(state, id) {
  const records = state.catches.filter(c => c.variantId === id);
  const weights = records.map(c => c.weight).filter(w => w != null);
  return { count: records.length, best: weights.length ? Math.max(...weights) : null };
}
