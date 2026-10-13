const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app/script.js', 'utf8');
const start = source.indexOf('function canonicalPremiumBreedCode(');
const end = source.indexOf('function premiumReviewFromParsed(', start);
assert(start >= 0 && end > start, 'Premium judge parser source should exist.');
const clean = (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9*]/g, '');
const context = vm.createContext({
  console,
  Date,
  clean,
  asfaRegularBreedCodes: ['AH', 'AZ', 'BA', 'BZ', 'CE', 'GH', 'IB', 'IW', 'IG', 'PIO', 'PH', 'RR', 'SA', 'DH', 'SW', 'SL', 'WH'],
  asfaProvisionalBreedCodes: ['CH', 'GA', 'MA', 'POD', 'PPP'],
  asfaPremiumBreedAliases: {
    A: 'AH', AF: 'AH', AH: 'AH', AZ: 'AZ', BA: 'BA', B: 'BZ', BO: 'BZ', BZ: 'BZ',
    C: 'CE', CE: 'CE', G: 'GH', GH: 'GH', IB: 'IB', IH: 'IB', IW: 'IW', IG: 'IG',
    PIO: 'PIO', P: 'PH', PH: 'PH', RR: 'RR', S: 'SA', SA: 'SA', SD: 'DH', DH: 'DH',
    SL: 'SL', SW: 'SW', W: 'WH', WH: 'WH', LCI: 'LCI', PRV: 'PROV', PROV: 'PROV',
    PROVISIONAL: 'PROV', SGL: 'SINGLES', SNG: 'SINGLES', SINGLES: 'SINGLES',
  },
  uniqueNames: (values) => [...new Map(values.filter(Boolean).map((value) => [clean(value), String(value).trim()])).values()],
});
vm.runInContext(source.slice(start, end), context);

const table = `| Day      | Name       | CH | WH | RR | IG | LCI | SD | PIO | SL | GH | AH | SA | AZ | IW | BA | Bo | SNG | SW | IH | PH | PRV | Ce |
| -------- | ---------- | -- | -- | -- | -- | --- | -- | --- | -- | -- | -- | -- | -- | -- | -- | -- | --- | -- | -- | -- | --- | -- |
| Saturday | Kathy      |    | S  | S  | S  | S   | S  | S   | S  |    |    |    |    |    |    |    |     |    |    |    |     |    |
| Saturday | Mary Ellen |    |    |    |    |     |    |     |    | s  | s  | s  | s  | s  | s  |    |     |    |    |    |     |    |
| Saturday | Paul       |    |    |    |    |     |    |     |    |    |    |    |    |    |    | s  | s   | s  | s  | s  | s   | s  |
| Sunday   | Paul       | s  |    |    |    | s   |    |     |    |    | s  | s  | s  | s  | s  |    |     |    |    |    |     |    |
| Sunday   | Mary Ellen |    | s  | s  | s  |     | s  | s   | s  |    |    |    |    |    |    |    |     | s  |    |    |     |    |
| Sunday   | Kathy      |    |    |    |    |     |    |     |    |    |    |    |    |    |    | s  | s   |    | s  | s  | s   | s  |`;
const parsed = context.parsePremiumJudgeAssignments(table);
assert.deepEqual(Array.from(parsed.judges), ['Kathy', 'Mary Ellen', 'Paul']);
const names = (day, code) => Array.from(parsed.assignmentsByDay[day][code] || [], (row) => row.judge);
assert.deepEqual(names('Saturday', 'WH'), ['Kathy']);
assert.deepEqual(names('Saturday', 'GH'), ['Mary Ellen']);
assert.deepEqual(names('Saturday', 'BZ'), ['Paul']);
assert.deepEqual(names('Saturday', 'SINGLES'), ['Paul']);
assert.deepEqual(names('Saturday', 'IB'), ['Paul']);
assert.deepEqual(names('Sunday', 'PROV'), ['Paul', 'Kathy']);
assert.deepEqual(names('Sunday', 'CE'), ['Kathy']);
const count = Object.values(parsed.assignmentsByDay).flatMap(Object.values).reduce((sum, rows) => sum + rows.length, 0);
assert.equal(count, 40);
console.log('Premium judge Markdown table import passed: 3 judges, 6 day rows, 40 assignments, mixed-case marks, and header aliases.');
