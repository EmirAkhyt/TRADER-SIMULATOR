const COINS = [
  { name: "TON",  color: "#0098EA", price: 5.0,     vol: 0.10 },
  { name: "Pepe", color: "#4CAF50", price: 0.00001, vol: 0.25 },
  { name: "Doug", color: "#FF9800", price: 0.001,   vol: 0.20 },
  { name: "BTC",  color: "#F7931A", price: 60000,   vol: 0.05 },
  { name: "ETH",  color: "#627EEA", price: 3000,    vol: 0.07 },
  { name: "SOL",  color: "#9945FF", price: 150,     vol: 0.12 },
  { name: "DOGE", color: "#C2A633", price: 0.1,     vol: 0.18 },
];

window.balance = 1000;
window.holdings = {};
window.prices = {};
window.histories = {};
window.currentCoin = "TON";

COINS.forEach(c => {
  window.holdings[c.name] = 0;
  window.prices[c.name] = c.price;
  window.histories[c.name] = [c.price];
});

function fmt(p) {
  if (p >= 1000) return '$' + p.toFixed(0);
  if (p >= 1) return '$' + p.toFixed(2);
  if (p >= 0.01) return '$' + p.toFixed(4);
  return '$' + p.toFixed(8);
}

function renderCoinList() {
  const list = document.getElementById('coinList');
  if (!list) return;
  list.innerHTML = '';
  COINS.forEach(c => {
    const hist = window.histories[c.name] || [c.price];
    const prev = hist.length > 1 ? hist[hist.length - 2] : hist[0];
    const cur = window.prices[c.name] || c.price;
    const change = prev ? ((cur - prev) / prev) * 100 : 0;
    
    const div = document.createElement('div');
    div.className = 'coin-item' + (c.name === window.currentCoin ? ' active' : '');
    div.onclick = () => {
      window.currentCoin = c.name;
      renderCoinList();
      updateUI();
      drawChart();
    };
    div.innerHTML = `
      <div>
        <div class="coin-name" style="color:${c.color}">${c.name}</div>
        <div class="coin-price">${fmt(cur)}</div>
      </div>
      <div class="coin-change ${change >= 0 ? 'up' : 'down'}">${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}%</div>
    `;
    list.appendChild(div);
  });
}

function updateUI() {
  const b = document.getElementById('balance');
  const c = document.getElementById('coins');
  const p = document.getElementById('price');
  const pb = document.getElementById('profileBalance');
  if (b) b.textContent = '$' + (window.balance || 0).toFixed(2);
  if (c) c.textContent = (window.holdings[window.currentCoin] || 0).toFixed(4);
  if (p) p.textContent = fmt(window.prices[window.currentCoin] || 0);
  if (pb) pb.textContent = '$' + (window.balance || 0).toFixed(2);
}

function drawChart() {
  const chart = document.getElementById('chart');
  if (!chart) return;
  const ctx = chart.getContext('2d');
  const w = chart.width, h = chart.height;
  ctx.clearRect(0, 0, w, h);
  
  ctx.strokeStyle = '#222';
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, (h/5)*i); ctx.lineTo(w, (h/5)*i); ctx.stroke(); }
  
  const history = window.histories[window.currentCoin] || [];
  if (history.length < 2) return;
  
  const min = Math.min(...history), max = Math.max(...history);
  const range = max - min || 1;
  const coin = COINS.find(c => c.name === window.currentCoin);
  
  ctx.strokeStyle = coin.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 20) - 10;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function logMsg(msg, cls) {
  const logEl = document.getElementById('log');
  if (!logEl) return;
  const div = document.createElement('div');
  div.className = cls;
  div.textContent = '> ' + msg;
  logEl.prepend(div);
}

function updatePrices() {
  COINS.forEach(c => {
    const prev = window.prices[c.name] || c.price;
    const change = (Math.random() - 0.5) * c.vol * 2;
    window.prices[c.name] = Math.max(0.00000001, prev * (1 + change));
    if (!window.histories[c.name]) window.histories[c.name] = [prev];
    window.histories[c.name].push(window.prices[c.name]);
    if (window.histories[c.name].length > 100) window.histories[c.name].shift();
  });
  renderCoinList();
  updateUI();
  drawChart();
  if (typeof window.saveGame === 'function') window.saveGame();
}

function buy() {
  const amount = parseFloat(document.getElementById('amount').value);
  if (isNaN(amount) || amount <= 0) return;
  const cost = (window.prices[window.currentCoin] || 0) * amount;
  if (cost > window.balance) { logMsg('Недостаточно средств!', 'info'); return; }
  window.balance -= cost;
  window.holdings[window.currentCoin] = (window.holdings[window.currentCoin] || 0) + amount;
  logMsg(`Куплено ${amount} ${window.currentCoin} за $${cost.toFixed(2)}`, 'buy');
  updateUI();
  if (typeof window.saveGame === 'function') window.saveGame();
}

function sell() {
  const amount = parseFloat(document.getElementById('amount').value);
  if (isNaN(amount) || amount <= 0) return;
  if (amount > (window.holdings[window.currentCoin] || 0)) { logMsg(`Недостаточно ${window.currentCoin}!`, 'info'); return; }
  const revenue = (window.prices[window.currentCoin] || 0) * amount;
  window.holdings[window.currentCoin] -= amount;
  window.balance += revenue;
  logMsg(`Продано ${amount} ${window.currentCoin} за $${revenue.toFixed(2)}`, 'sell');
  updateUI();
  if (typeof window.saveGame === 'function') window.saveGame();
}

window.addEventListener('DOMContentLoaded', () => {
  const buyBtn = document.getElementById('buyBtn');
  if (buyBtn) buyBtn.onclick = buy;
  const sellBtn = document.getElementById('sellBtn');
  if (sellBtn) sellBtn.onclick = sell;
  
  renderCoinList();
  updateUI();
  drawChart();
  setInterval(updatePrices, 2000);
});