const SAVE_KEY = "crypto_sim_save";
const USED_NAMES_KEY = "crypto_sim_used_names";
const TAKEN_NAMES = ["admin", "trader", "rocket", "crypto", "boss", "test", "user"];

window.saveGame = function() {
  try {
    if (!window.playerName) return;
    const data = {
      balance: window.balance || 1000,
      holdings: window.holdings || {},
      prices: window.prices || {},
      histories: window.histories || {},
      ownedGifts: window.ownedGifts || [],
      currentCoin: window.currentCoin || "TON",
      playerName: window.playerName
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { console.error("Ошибка сохранения:", e); }
};

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    
    window.balance = data.balance || 1000;
    window.holdings = data.holdings || {};
    window.prices = data.prices || {};
    window.histories = data.histories || {};
    window.ownedGifts = data.ownedGifts || [];
    window.currentCoin = data.currentCoin || "TON";
    window.playerName = data.playerName;
    
    return !!data.playerName;
  } catch (e) { return false; }
}

window.renderProfile = function() {
  const grid = document.getElementById('myGifts');
  if (!grid) return;
  grid.innerHTML = '';
  
  const nameEl = document.getElementById('profileName');
  if (nameEl) {
    nameEl.textContent = window.playerName ? window.playerName : "Трейдер";
  }

  if (!window.ownedGifts || window.ownedGifts.length === 0) {
    grid.innerHTML = '<div style="color:#666; grid-column: 1/-1;">Пока нет подарков. Загляни в магазин!</div>';
    return;
  }
  
  // Считаем количество каждого подарка
  const counts = {};
  window.ownedGifts.forEach(id => counts[id] = (counts[id] || 0) + 1);

  Object.entries(counts).forEach(([id, count]) => {
    const g = GIFTS.find(x => x.id === id);
    if (!g) return;
    
    // Считаем цену продажи с учетом 30% комиссии (игрок получает 70%)
    const sellPrice = Math.floor(g.price * 0.7);

    const card = document.createElement('div');
    card.className = 'gift-card';
    card.innerHTML = `
      <div class="gift-emoji">${g.emoji}</div>
      <div class="gift-name">${g.name}</div>
      <div style="color:#ffd700; font-size:16px; font-weight:bold; margin-top:5px;">x${count}</div>
      <button class="gift-sell" style="margin-top:10px; background:transparent; border:1px solid #ff4444; color:#ff4444; padding:5px 10px; border-radius:4px; font-size:12px; width:100%; cursor:pointer;">ПРОДАТЬ (+$${sellPrice})</button>
    `;
    
    card.querySelector('.gift-sell').onclick = () => {
      // Продаем 1 штуку
      const index = window.ownedGifts.indexOf(id);
      if (index > -1) {
        window.ownedGifts.splice(index, 1);
        window.balance += sellPrice;
        
        if (typeof logMsg === 'function') logMsg(`Продан "${g.name}" за $${sellPrice} (комиссия 30%)`, 'sell');
        if (typeof updateUI === 'function') updateUI();
        window.renderProfile();
        if (typeof window.saveGame === 'function') window.saveGame();
      }
    };
    grid.appendChild(card);
  });
};

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById(tab.dataset.tab);
      if (content) content.classList.add('active');
      
      if (tab.dataset.tab === 'shop') {
        if (typeof renderShop === 'function') renderShop();
        if (typeof renderCraft === 'function') renderCraft();
      }
      if (tab.dataset.tab === 'profile') {
        window.renderProfile();
      }
    };
  });

  document.getElementById('startBtn').onclick = () => {
    document.getElementById('intro').classList.add('hidden');
    const hasSavedName = loadGame();
    
    if (hasSavedName && window.playerName) {
      document.getElementById('mainGame').classList.remove('hidden');
      if (typeof updateUI === 'function') updateUI();
      if (typeof renderCoinList === 'function') renderCoinList();
      if (typeof drawChart === 'function') drawChart();
      window.renderProfile();
    } else {
      document.getElementById('nameScreen').classList.remove('hidden');
    }
  };

  document.getElementById('confirmNameBtn').onclick = () => {
    const name = document.getElementById('nameInput').value;
    const cleanName = name.trim().toLowerCase();
    const error = document.getElementById('nameError');

    if (cleanName.length < 2) { error.textContent = "Ник должен быть длиннее 2 символов"; return; }
    if (TAKEN_NAMES.includes(cleanName)) { error.textContent = "Этот ник уже занят!"; return; }
    
    const used = JSON.parse(localStorage.getItem(USED_NAMES_KEY) || "[]");
    if (used.includes(cleanName)) { error.textContent = "Этот ник уже занят на этом устройстве!"; return; }

    error.textContent = "";
    window.playerName = name.trim();
    
    if (!used.includes(cleanName)) {
      used.push(cleanName);
      localStorage.setItem(USED_NAMES_KEY, JSON.stringify(used));
    }

    window.saveGame();
    document.getElementById('nameScreen').classList.add('hidden');
    document.getElementById('mainGame').classList.remove('hidden');
    if (typeof updateUI === 'function') updateUI();
    if (typeof renderCoinList === 'function') renderCoinList();
    if (typeof drawChart === 'function') drawChart();
    window.renderProfile();
  };

  const nameInput = document.getElementById('nameInput');
  if (nameInput) {
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('confirmNameBtn').click();
    });
  }
});