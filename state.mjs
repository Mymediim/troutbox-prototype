import { models, variants } from './catalog.mjs';
import { models as legacyModels, variants as legacyVariants, seed as oldSeed } from './data.mjs';
import { uid } from './domain.mjs';
export { models, variants, legacyModels, legacyVariants };
export function seed(empty = false) {
  const s = { version: 2, stock: {}, losses: [], wishes: [], catches: [], customModels: [], customVariants: [], theme: 'dark' };
  if (empty) return s;
  for (let i = 0; i < 8; i++) {
    const v = variants.find(v => v.modelId === models[i].id);
    s.stock[v.id] = { quantity: [3,1,2,1,1,2,1,1][i], condition: 'Хорошее', tags: i % 2 ? ['На тесте'] : ['Рабочая'], note: '', purchaseDate: '2026-10-12' };
    if (i < 4) for (let n = 0; n < [3,1,2,1][i]; n++) s.catches.push({ id: uid(), variantId: v.id, species: i === 2 ? 'Окунь' : 'Радужная форель', weight: +(.6 + i * .3 + n * .2).toFixed(2), place: i % 2 ? 'Река Чусовая' : 'Лесной пруд', date: new Date(Date.UTC(2026,9,19-n,7+i)).toISOString() });
  }
  s.wishes = models.slice(8,12).map(m => variants.find(v => v.modelId === m.id).id);
  s.losses = models.slice(12,15).map((m,i) => ({ id: uid(), variantId: variants.find(v => v.modelId === m.id).id, quantity: i === 0 ? 2 : 1, date: new Date(Date.UTC(2026,9,18-i)).toISOString() }));
  return s;
}
export function migrate(s) {
  if (s.version === 2) return s;
  const old = oldSeed();
  const untouched = JSON.stringify(s.stock) === JSON.stringify(old.stock) && JSON.stringify(s.wishes) === JSON.stringify(old.wishes) && s.catches.length === old.catches.length && s.catches.every((c,i) => c.variantId === old.catches[i].variantId && c.weight === old.catches[i].weight && c.species === old.catches[i].species && c.date === old.catches[i].date) && s.customModels.length === 0 && s.losses.length === 3 && s.losses.every((l,i) => l.variantId === old.losses[i].variantId && l.quantity === old.losses[i].quantity);
  if (untouched) { const next = seed(); next.theme = s.theme; return next; }
  // Keep modified historical data under its original variant identities.
  return { ...s, version: 2, catches: s.catches.map(c => ({ ...c, place: c.place || '' })) };
}
