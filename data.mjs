import { uid } from './domain.mjs';
const names = ['MIU', 'PAL', 'NOA', 'Rooney', 'Dohna', 'Nories Masukurouto', 'Pure', 'Witch', 'Banna', 'Tearo', 'Factor', 'Adam', 'Chibi Pani', 'Moca', 'Presso Double Clutch', 'Mini Grasshopper', 'Haze', 'Fuwatoro', 'Chubby', 'Rigge', 'Tanta', 'Polaris', 'Trout Worm', 'Nymph'];
const brands = ['Forest', 'Forest', 'Rodio Craft', 'Nories', 'Angler’z System', 'Nories', 'Smith', 'Daiwa', 'New Drawer', 'Jackall', 'Forest', 'Daiwa', 'Jackall', 'Rodio Craft', 'Daiwa', 'Bassday', 'Daiwa', 'Shimano', 'Jackall', 'ZipBaits', 'FishUp', 'Crazy Fish', 'Berkley', 'Trout Zone'];
const colours = [
  { name: 'Orange / Gold', hex: '#f47b35', back: '#d6ab52', code: '01' },
  { name: 'Pink / Silver', hex: '#ee69a3', back: '#b6c7d6', code: '07' },
  { name: 'Olive / Black', hex: '#a8b36a', back: '#303d32', code: '12' }
];
export const models = names.map((name, i) => ({ id: `m${i}`, name, brand: brands[i], category: i < 12 ? 'Блёсны' : i < 20 ? 'Воблеры' : 'Силикон', kind: i < 12 ? 'Колеблющаяся блесна' : i < 20 ? 'Воблер' : 'Мягкая приманка', length: i < 12 ? 22 + (i % 4) * 3 : i < 20 ? 28 + (i % 4) * 5 : 35 + (i % 3) * 10, type: i < 12 ? 'Тонущая' : i < 20 ? 'Плавающий' : 'Тонущая', material: i < 12 ? 'Латунь' : i < 20 ? 'ABS-пластик' : 'Силикон' }));
export const variants = models.flatMap((m, i) => colours.flatMap((c, j) => [0, 1].map(w => ({ id: `${m.id}-c${j}-w${w}`, modelId: m.id, colour: c.name, hex: c.hex, back: c.back, code: c.code, weight: +( (i < 12 ? 1.5 + (i % 3) * .3 : i < 20 ? 2.1 + (i % 3) * .4 : .6 + (i % 3) * .2) + w * .5 ).toFixed(1) }))));
export function seed(empty = false) {
  const s = { version: 1, stock: {}, losses: [], wishes: [], catches: [], customModels: [], customVariants: [], theme: 'dark' };
  if (empty) return s;
  for (let i = 0; i < 12; i++) {
    const v = variants[i * 6 + (i % 3) * 2];
    s.stock[v.id] = { quantity: [3, 1, 2, 1, 1, 2, 1, 3, 1, 2, 1, 1][i], condition: i === 3 ? 'Новая' : 'Хорошее', tags: [i % 3 === 0 ? 'Рабочая' : i % 3 === 1 ? 'На тесте' : 'Новая'], note: i === 0 ? 'Медленная равномерная проводка. Хорошо показала себя утром.' : '', purchaseDate: '2026-09-12' };
  }
  s.wishes = [variants[73].id, variants[86].id, variants[97].id, variants[122].id, variants[132].id];
  s.losses = [8, 14, 17].map((i, n) => ({ id: uid(), variantId: variants[i * 6].id, quantity: n === 0 ? 2 : 1, date: `2026-10-${String(18 - n * 3).padStart(2, '0')}T08:15:00.000Z` }));
  const fish = ['Радужная форель', 'Форель', 'Окунь'];
  for (let i = 0; i < 12; i++) for (let n = 0; n < [7, 2, 0, 3, 0, 1, 0, 2, 0, 1, 0, 0][i]; n++) {
    s.catches.push({ id: uid(), variantId: variants[i * 6 + (i % 3) * 2].id, species: fish[n % 3], weight: n === 2 ? null : +(.65 + ((n * 3 + i) % 13) / 10).toFixed(2), date: new Date(Date.UTC(2026, 9, 19 - n, 6 + n)).toISOString() });
  }
  return s;
}
