/* eslint-disable @typescript-eslint/no-require-imports */
// Uses a small hook/Firestore-repository harness to exercise real handlers without adding dependencies.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
// Firestore document IDs are strings; createdAt/updatedAt come from serverTimestamp().
const product = { id: 'qa-doc-1', name: 'QA', category: 'food', quantity: 1, minStock: 2, unit: '個', isFavorite: false, createdAt: null, updatedAt: null };

function harness() {
  const updates = [], updateIds = [], histories = [], routes = [], timers = new Map(), states = [];
  let nextTimer = 0;
  const products = [{ ...product }];
  // In-memory stand-in for lib/repositories/firestore/products.ts (same exported API).
  const firestoreProducts = {
    useFirestoreProducts: () => ({ products: products.map(p => ({ ...p })), error: null }),
    useFirestoreProduct: id => ({ product: products.find(p => p.id === id) ?? null, error: null }),
    getProducts: async () => products.map(p => ({ ...p })),
    addProduct: async value => {
      const id = 'doc-' + (products.length + 1);
      products.push({ ...value, id, createdAt: null, updatedAt: null });
      return id;
    },
    updateProduct: async (id, value) => {
      const target = products.find(p => p.id === id);
      if (!target) throw new Error('No product with id ' + id);
      updates.push(value); updateIds.push(id); Object.assign(target, value);
    },
    deleteProduct: async id => { const i = products.findIndex(p => p.id === id); if (i >= 0) products.splice(i, 1); },
  };
  // In-memory stand-in for lib/repositories/firestore/history.ts.
  const firestoreHistory = {
    addHistory: async value => { histories.push(value); },
    useFirestoreHistories: () => ({ histories: [], error: null }),
  };
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: { useCallback: f => f, useRef: current => ({ current }), useState: value => [value, v => states.push(v)], useEffect: () => {} },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'next/navigation': { useRouter: () => ({ push: url => routes.push(url) }), usePathname: () => '/ja/inventory' },
    'next/link': { default: 'a' },
    'next-intl': { useLocale: () => 'ja', useTranslations: () => key => key },
    'lucide-react': {},
    '@/lib/repositories/firestore/products': firestoreProducts,
    '@/lib/repositories/firestore/history': firestoreHistory,
    '@/components/layout/Header': { default: 'header' },
    '@/components/layout/BackButton': { default: 'button' },
  };
  function load(file) {
    let source = fs.readFileSync(path.join(root, file), 'utf8');
    if (file.endsWith('InventoryClient.tsx')) source += '\nexport { InventoryRow };';
    if (file.endsWith('StockSection.tsx')) source += '\nexport { SwipeableStockRow };';
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
    const module = { exports: {} };
    const requireMock = id => {
      if (mocks[id]) return mocks[id];
      let target = id.startsWith('@/') ? id.slice(2) : path.join(path.dirname(file), id);
      if (!path.extname(target)) target += '.ts';
      return load(target);
    };
    vm.runInNewContext('(function(require,module,exports,setTimeout,clearTimeout){' + code + '\n})', {})(
      requireMock, module, module.exports,
      (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
      id => timers.delete(id)
    );
    return module.exports;
  }
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const match = find(child, predicate); if (match) return match; }
    return null;
  }
  const row = () => find(load('components/inventory/InventoryClient.tsx').InventoryRow({ product, isLast: true }), n => !!n.props?.onPointerMove);
  // Home row = StockSection's SwipeableStockRow (useSwipeQuantity + Firestore onChangeQuantity wiring).
  const home = () => find(load('components/home/StockSection.tsx').SwipeableStockRow({ product, dotColor: '', isLast: true }), n => !!n.props?.onPointerMove).props;
  return { load, row, home, products, updates, updateIds, histories, routes, timers, states };
}
const event = (x=0, y=0) => ({ clientX:x, clientY:y, pointerId:1, button:0, isPrimary:true, currentTarget:{ setPointerCapture() {} } });
const tests=[];
function test(name, fn) { tests.push([name,fn]); }
for (const kind of ['row', 'home']) {
 test(kind + ': cancelled gesture does not mutate stock or navigate', async () => {
  const h=harness(), handlers=kind==='row'?h.row().props:h.home();
  handlers.onPointerDown(event()); handlers.onPointerMove(event(90)); await handlers.onPointerCancel(event(90));
  assert.equal(h.updates.length,0);assert.equal(h.routes.length,0);assert.equal(h.histories.length,0);
 });
 test(kind + ': vertical movement does not navigate or change stock', async () => {
  const h=harness(), handlers=kind==='row'?h.row().props:h.home();
  handlers.onPointerDown(event());handlers.onPointerMove(event(0,100));await handlers.onPointerUp(event(0,100));
  assert.equal(h.updates.length,0);assert.equal(h.routes.length,0);
 });
 test(kind + ': horizontal swipe updates once; tap navigates once', async () => {
  const h=harness(), handlers=kind==='row'?h.row().props:h.home();
  handlers.onPointerDown(event());handlers.onPointerMove(event(90));await handlers.onPointerUp(event(90));
  assert.equal(h.updates.length,1);assert.equal(h.updates[0].quantity,2);assert.equal(h.histories.length,1);assert.equal(h.routes.length,0);
  assert.equal(h.updateIds[0],'qa-doc-1');assert.equal(h.histories[0].productId,'qa-doc-1');assert.equal(h.histories[0].action,'restock');
  handlers.onPointerDown(event());await handlers.onPointerUp(event());assert.equal(h.routes.length,1);assert.equal(h.routes[0],'/ja/product/qa-doc-1');
 });
}
test('inventory: long press opens menu without navigating on release', async () => {
 const h=harness(), handlers=h.row().props;handlers.onPointerDown(event());
 for(const {fn,delay} of [...h.timers.values()]) if(delay===500) fn();
 await handlers.onPointerUp(event());assert.equal(h.routes.length,0);assert.ok(h.states.includes(true));
});
test('CSV: duplicate names within new file use duplicate resolution', async () => {
 const h=harness();h.products.length=0;const calls=[];
 const row={...product,name:'New CSV item'};
 const result=await h.load('lib/csv-import.ts').importProducts([row,{...row,quantity:9}],async (...args)=>{calls.push(args);return 'overwrite';});
 assert.equal(h.products.length,1);assert.equal(h.products[0].quantity,9);assert.equal(calls.length,1);assert.equal(calls[0][2],1);
 assert.equal(result.added,1);assert.equal(result.overwritten,1);
});
test('CSV: reject non-finite and empty numbers', () => {
 const {parseProductsCsv}=harness().load('lib/csv.ts');
 for(const bad of ['Infinity','1e999','']) {
  for(const column of [2,3]) {
   const cells=['CSV test','food','1','1','個','TRUE'];cells[column]=bad;
   const result=parseProductsCsv('商品名,カテゴリ,数量,最低在庫,単位,お気に入り\n'+cells.join(','),key=>key);
   assert.equal(result.rows.length,0,bad);assert.equal(result.errors.length,1);
  }
 }
});
test('CSV: export/import keeps quoted names and stored units', () => {
 const {parseProductsCsv,productsToCsv}=harness().load('lib/csv.ts');
 const original={...product,name:'QA, "quoted"\nline',unit:'缶'};
 const result=parseProductsCsv(productsToCsv([original]),key=>key);
 assert.equal(result.rows[0].name,original.name);assert.equal(result.rows[0].unit,'缶');assert.equal(result.errors.length,0);
});
test('CSV: skip-all covers existing and file-internal duplicates', async () => {
 const h=harness(), calls=[], progress=[];
 const rows=[{...product},{...product},{...product,name:'New'},{...product,name:'New',quantity:5}];
 const lib=h.load('lib/csv-import.ts');
 assert.equal(lib.countDuplicates(rows,['QA']),3);
 const result=await lib.importProducts(rows,async (...args)=>{calls.push(args);return 'skip-all';},n=>progress.push(n));
 assert.equal(calls.length,1);assert.equal(calls[0][2],3);
 assert.equal(result.added,1);assert.equal(result.skipped,3);assert.equal(h.products.length,2);
 assert.equal(h.products[1].quantity,1);assert.deepEqual(progress,[1,2,3,4]);
});
test('inventory: release without a row press does not navigate', async () => {
 const h=harness();await h.row().props.onPointerUp(event());assert.equal(h.routes.length,0);assert.equal(h.updates.length,0);
});
(async()=>{let failed=0;for(const [name,fn] of tests){try{await fn();console.log('PASS '+name);}catch(e){failed++;console.log('FAIL '+name+': '+e.message);}}console.log(`${tests.length-failed}/${tests.length} passed`);process.exitCode=failed?1:0;})();
