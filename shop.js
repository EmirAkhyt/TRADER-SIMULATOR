const GIFTS = [
  { id: "bear",   name: "Мишка",  emoji: "🧸", price: 50 },
  { id: "heart",  name: "Сердце", emoji: "❤️", price: 30 },
  { id: "rose",   name: "Роза",   emoji: "🌹", price: 25 },
  { id: "rocket", name: "Ракета", emoji: "🚀", price: 100 },
  { id: "crown",  name: "Корона", emoji: "👑", price: 200 },
  { id: "diamond",name: "Алмаз",  emoji: "💎", price: 300 },
  { id: "star",   name: "Звезда", emoji: "⭐", price: 75 },
  { id: "cake",   name: "Торт",   emoji: "🎂", price: 40 },
  { id: "super_rocket", name: "Супер Ракета", emoji: "🛸", price: 500 },
  { id: "heart_eyes",   name: "Влюбленный",   emoji: "😍", price: 150 },
];

const CRAFT_RECIPES = [
  { result: "super_rocket", requires: ["rocket", "star", "rocket"] },
  { result: "heart_eyes",   requires: ["heart", "heart", "heart"] }
];

window.ownedGifts = window.ownedGifts || [];

function renderShop() {
  const grid = document.getElementById('giftGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  // Отрисовываем только те подарки, которые НЕ крафтятся
  GIFTS.filter(g => !CRAFT_RECIPES.some(r => r.result === g.id)).forEach(g => {
    const card = document.createElement('div');
    card.className = 'gift-card';
    card.innerHTML = `
      <div class="gift-emoji">${g.emoji}</div>
      <div class="gift-name">${g.name}</div>
      <div class="gift-price">$${g.price}</div>
      <button class="gift-buy">КУПИТЬ</button>
    `;
    const btn = card.querySelector('.gift-buy');
    if (btn) {
      btn.onclick = () => {
        if (window.balance < g.price) { 
          if (typeof logMsg === 'function') logMsg('Недостаточно средств!', 'info'); 
          return; 
        }
        window.balance -= g.price;
        // Добавляем подарок в массив (можно покупать много раз)
        window.ownedGifts.push(g.id);
        
        if (typeof logMsg === 'function') logMsg(`Куплен "${g.name}" за $${g.price}`, 'gift');
        if (typeof updateUI === 'function') updateUI();
        renderShop();
        renderCraft();
        if (typeof window.renderProfile === 'function') window.renderProfile();
        if (typeof window.saveGame === 'function') window.saveGame();
      };
    }
    grid.appendChild(card);
  });
}

function renderCraft() {
  const grid = document.getElementById('craftGrid');
  if (!grid) return;
  grid.innerHTML = '';

  CRAFT_RECIPES.forEach(recipe => {
    const resultGift = GIFTS.find(g => g.id === recipe.result);
    
    // Проверяем, хватает ли ингредиентов в инвентаре
    let canCraft = true;
    const reqCounts = {};
    recipe.requires.forEach(id => reqCounts[id] = (reqCounts[id] || 0) + 1);

    for (const [id, count] of Object.entries(reqCounts)) {
      if (window.ownedGifts.filter(gId => gId === id).length < count) canCraft = false;
    }

    let reqHtml = recipe.requires.map(id => {
      const g = GIFTS.find(x => x.id === id);
      return `<span title="${g.name}">${g.emoji}</span>`;
    }).join(' + ');

    const card = document.createElement('div');
    card.className = 'gift-card';
    card.innerHTML = `
      <div class="gift-emoji">${resultGift.emoji}</div>
      <div class="gift-name">${resultGift.name}</div>
      <div style="font-size:12px; color:#888; margin-bottom:10px;">Нужно: ${reqHtml}</div>
      <button class="gift-buy" ${!canCraft ? 'disabled' : ''}>СКРАФТИТЬ</button>
    `;

    const btn = card.querySelector('.gift-buy');
    if (canCraft && btn) {
      btn.onclick = () => {
        // Удаляем использованные ингредиенты
        recipe.requires.forEach(id => {
          const index = window.ownedGifts.indexOf(id);
          if (index > -1) window.ownedGifts.splice(index, 1);
        });
        // Добавляем результат
        window.ownedGifts.push(recipe.result);
        
        if (typeof logMsg === 'function') logMsg(`Скрафчен "${resultGift.name}"!`, 'gift');
        renderCraft();
        renderShop();
        if (typeof window.renderProfile === 'function') window.renderProfile();
        if (typeof window.saveGame === 'function') window.saveGame();
      };
    }
    grid.appendChild(card);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderShop();
  renderCraft();
});