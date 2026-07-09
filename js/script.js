(() => {
  'use strict';

  /* ===== State ===== */
  const STORAGE_KEY = 'ledger.transactions';
  const CATEGORY_KEY = 'ledger.categories';
  const LIMIT_KEY = 'ledger.limit';

  const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];
  const PALETTE = {
    Food: '#34C98E',
    Transport: '#4E8CFF',
    Fun: '#F5A93C'
  };
  const EXTRA_PALETTE = ['#B48EF0', '#4FD1D9', '#FF9F6B', '#7EE787', '#FF8FC8'];

  let transactions = loadTransactions();
  let categories = loadCategories();
  let spendLimit = loadLimit();
  let sortMode = 'newest';
  let chart = null;

  /* ===== DOM refs ===== */
  const form = document.getElementById('transactionForm');
  const itemNameInput = document.getElementById('itemName');
  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const customCategoryField = document.getElementById('customCategoryField');
  const customCategoryInput = document.getElementById('customCategoryInput');
  const formError = document.getElementById('formError');

  const totalBalanceEl = document.getElementById('totalBalance');
  const todayDateEl = document.getElementById('todayDate');

  const listEl = document.getElementById('transactionList');
  const emptyStateEl = document.getElementById('emptyState');
  const sortSelect = document.getElementById('sortSelect');
  const limitInput = document.getElementById('limitInput');

  const chartCanvas = document.getElementById('categoryChart');
  const chartEmptyEl = document.getElementById('chartEmpty');
  const legendEl = document.getElementById('chartLegend');

  /* ===== Init ===== */
  function init() {
    todayDateEl.textContent = new Date().toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    populateCategorySelect();
    limitInput.value = spendLimit ?? '';
    render();

    form.addEventListener('submit', handleAddTransaction);
    addCategoryBtn.addEventListener('click', toggleCustomCategoryField);
    categorySelect.addEventListener('change', handleCategorySelectChange);
    sortSelect.addEventListener('change', () => {
      sortMode = sortSelect.value;
      renderTransactionList();
    });
    limitInput.addEventListener('input', () => {
      const val = limitInput.value === '' ? null : parseFloat(limitInput.value);
      spendLimit = (val !== null && val >= 0) ? val : null;
      localStorage.setItem(LIMIT_KEY, spendLimit === null ? '' : String(spendLimit));
      renderTransactionList();
    });
  }

  /* ===== Storage ===== */
  function loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
  function loadCategories() {
    try {
      const raw = localStorage.getItem(CATEGORY_KEY);
      const custom = raw ? JSON.parse(raw) : [];
      return [...DEFAULT_CATEGORIES, ...custom.filter(c => !DEFAULT_CATEGORIES.includes(c))];
    } catch { return [...DEFAULT_CATEGORIES]; }
  }
  function saveCategories() {
    const custom = categories.filter(c => !DEFAULT_CATEGORIES.includes(c));
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(custom));
  }
  function loadLimit() {
    const raw = localStorage.getItem(LIMIT_KEY);
    return raw ? parseFloat(raw) : null;
  }

  /* ===== Category select ===== */
  function populateCategorySelect() {
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
    const custom = document.createElement('option');
    custom.value = '__add_new__';
    custom.textContent = '+ New category…';
    categorySelect.appendChild(custom);
  }

  function toggleCustomCategoryField() {
    const isHidden = customCategoryField.hasAttribute('hidden');
    if (isHidden) {
      customCategoryField.removeAttribute('hidden');
      customCategoryInput.focus();
    } else {
      customCategoryField.setAttribute('hidden', '');
      customCategoryInput.value = '';
    }
  }

  function handleCategorySelectChange() {
    if (categorySelect.value === '__add_new__') {
      customCategoryField.removeAttribute('hidden');
      customCategoryInput.focus();
    }
  }

  function colorFor(category) {
    if (PALETTE[category]) return PALETTE[category];
    const customList = categories.filter(c => !DEFAULT_CATEGORIES.includes(c));
    const idx = customList.indexOf(category);
    return EXTRA_PALETTE[idx % EXTRA_PALETTE.length] || '#8A93A3';
  }

  /* ===== Add transaction ===== */
  function handleAddTransaction(e) {
    e.preventDefault();
    formError.textContent = '';
    itemNameInput.classList.remove('invalid');
    amountInput.classList.remove('invalid');

    const name = itemNameInput.value.trim();
    const amountRaw = amountInput.value.trim();
    const amount = parseFloat(amountRaw);

    let category = categorySelect.value;
    if (category === '__add_new__') {
      const newCat = customCategoryInput.value.trim();
      if (!newCat) {
        formError.textContent = 'Please name your new category.';
        customCategoryInput.classList.add('invalid');
        return;
      }
      if (!categories.includes(newCat)) {
        categories.push(newCat);
        saveCategories();
        populateCategorySelect();
      }
      category = newCat;
    }

    if (!name) {
      formError.textContent = 'Please enter an item name.';
      itemNameInput.classList.add('invalid');
      return;
    }
    if (amountRaw === '' || isNaN(amount) || amount <= 0) {
      formError.textContent = 'Please enter an amount greater than 0.';
      amountInput.classList.add('invalid');
      return;
    }

    transactions.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      name,
      amount,
      category,
      createdAt: Date.now()
    });
    saveTransactions();

    form.reset();
    populateCategorySelect();
    customCategoryField.setAttribute('hidden', '');
    render();
  }

  /* ===== Delete transaction ===== */
  function handleDelete(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    render();
  }

  /* ===== Render ===== */
  function render() {
    renderBalance();
    renderTransactionList();
    renderChart();
  }

  function renderBalance() {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    totalBalanceEl.textContent = formatMoney(total);
  }

  function sortedTransactions() {
    const list = [...transactions];
    switch (sortMode) {
      case 'amount-desc': return list.sort((a, b) => b.amount - a.amount);
      case 'amount-asc': return list.sort((a, b) => a.amount - b.amount);
      case 'category': return list.sort((a, b) => a.category.localeCompare(b.category));
      default: return list.sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  function renderTransactionList() {
    listEl.innerHTML = '';
    const list = sortedTransactions();

    if (list.length === 0) {
      listEl.appendChild(emptyStateEl);
      return;
    }

    list.forEach(t => {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      const overLimit = spendLimit !== null && t.amount > spendLimit;
      if (overLimit) li.classList.add('over-limit');

      li.innerHTML = `
        <div class="t-main">
          <span class="t-name">${escapeHtml(t.name)}</span>
          <span class="t-chip" style="color:${colorFor(t.category)}">${escapeHtml(t.category)}</span>
          ${overLimit ? '<span class="t-flag">OVER LIMIT</span>' : ''}
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="t-amount">${formatMoney(t.amount)}</span>
          <button class="btn-delete" data-id="${t.id}" aria-label="Delete ${escapeHtml(t.name)}">Delete</button>
        </div>
      `;
      listEl.appendChild(li);
    });

    listEl.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });
  }

  function renderChart() {
    const totalsByCategory = {};
    transactions.forEach(t => {
      totalsByCategory[t.category] = (totalsByCategory[t.category] || 0) + t.amount;
    });
    const labels = Object.keys(totalsByCategory);
    const data = Object.values(totalsByCategory);
    const colors = labels.map(colorFor);

    chartEmptyEl.style.display = labels.length === 0 ? 'flex' : 'none';
    chartCanvas.style.display = labels.length === 0 ? 'none' : 'block';

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = colors;
      chart.update();
    } else if (labels.length > 0) {
      chart = new Chart(chartCanvas, {
        type: 'pie',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderColor: '#172230', borderWidth: 2 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } }
        }
      });
    }

    legendEl.innerHTML = '';
    labels.forEach((label, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="l-name"><span class="swatch" style="background:${colors[i]}"></span>${escapeHtml(label)}</span>
        <span class="l-value">${formatMoney(data[i])}</span>
      `;
      legendEl.appendChild(li);
    });
  }

  /* ===== Utils ===== */
  function formatMoney(n) {
    return '$' + n.toFixed(2);
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  init();
})();