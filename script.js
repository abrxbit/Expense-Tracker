let entries = [];
let currentType = 'expense';
let idCounter = 1;

const form = document.getElementById('entryForm');
const descInput = document.getElementById('descInput');
const catInput = document.getElementById('catInput');
const amountInput = document.getElementById('amountInput');
const currencyInput = document.getElementById('currencyInput');
const entryList = document.getElementById('entryList');
const emptyMsg = document.getElementById('emptyMsg');
const entryCount = document.getElementById('entryCount');
const balanceAmt = document.getElementById('balanceAmt');
const balanceBar = document.getElementById('balanceBar');
const breakdown = document.getElementById('breakdown');
const breakdownList = document.getElementById('breakdownList');
const typeButtons = document.querySelectorAll('.type-toggle button');

document.getElementById('today').textContent = new Date().toLocaleDateString(undefined, {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

typeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    typeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  if (!desc || !amount || amount <= 0) return;

  entries.unshift({
    id: idCounter++,
    desc,
    category: catInput.value,
    amount,
    currency: currencyInput.value,
    type: currentType,
    date: new Date()
  });

  form.reset();
  descInput.focus();
  render();
});

function deleteEntry(id){
  entries = entries.filter(e => e.id !== id);
  render();
}

function formatMoney(sym, val){
  return sym + Math.abs(val).toFixed(2);
}

function render(){
  entryList.innerHTML = '';
  entryCount.textContent = entries.length;
  emptyMsg.style.display = entries.length === 0 ? 'block' : 'none';

  let balance = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  const symbol = entries.length ? entries[0].currency : '$';

  entries.forEach(entry => {
    balance += convertToPrimary(entry, symbol);
    if (entry.type === 'income') totalIncome += entry.amount;
    else totalExpense += entry.amount;

    const row = document.createElement('div');
    row.className = 'entry';
    row.innerHTML = `
      <div class="meta">
        <div class="desc">${escapeHtml(entry.desc)}</div>
        <div class="cat">${entry.category}</div>
      </div>
      <div class="right">
        <div class="val ${entry.type === 'income' ? 'pos' : 'neg'}">
          ${entry.type === 'income' ? '+' : '−'}${formatMoney(entry.currency, entry.amount)}
        </div>
        <button class="del" title="Delete entry" data-id="${entry.id}">✕</button>
      </div>
    `;
    entryList.appendChild(row);
  });

  entryList.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry(parseInt(btn.dataset.id)));
  });

  balanceAmt.textContent = (balance < 0 ? '−' : '') + formatMoney(symbol, balance);
  balanceAmt.className = 'amount ' + (balance < 0 ? 'neg' : 'pos');

  const total = totalIncome + totalExpense;
  const pct = total > 0 ? Math.min(100, (totalExpense / total) * 100) : 0;
  balanceBar.style.width = pct + '%';

  renderBreakdown(symbol);
}

function convertToPrimary(entry, symbol){
  return entry.type === 'income' ? entry.amount : -entry.amount;
}

function renderBreakdown(symbol){
  const expenseEntries = entries.filter(e => e.type === 'expense');
  if (expenseEntries.length === 0){
    breakdown.style.display = 'none';
    return;
  }
  breakdown.style.display = 'block';

  const byCat = {};
  let max = 0;
  expenseEntries.forEach(e => {
    byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    if (byCat[e.category] > max) max = byCat[e.category];
  });

  breakdownList.innerHTML = '';
  Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amt]) => {
      const row = document.createElement('div');
      row.className = 'bd-row';
      const pct = (amt / max) * 100;
      row.innerHTML = `
        <div class="top"><span>${cat}</span><span>${formatMoney(symbol, amt)}</span></div>
        <div class="bd-track"><div class="bd-fill" style="width:${pct}%"></div></div>
      `;
      breakdownList.appendChild(row);
    });
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

render();