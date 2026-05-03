/* ═══════════════════════════════════════════════════════
   GSE Quotation History — Application Logic
   ═══════════════════════════════════════════════════════ */

'use strict';

// ── CONFIGURATION ─────────────────────────────────────
const API       = 'https://greensunesbe.onrender.com';

const TOKEN_KEY = 'gse_auth_token';
const NAME_KEY  = 'gse_user_name';

// ── STATE ──────────────────────────────────────────────
const state = {
  page: 1,
  limit: 10,
  search: '',
  vendor: '',
  kw: '',
  type: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  totalPages: 1,
  total: 0,
  editingId: null,
  deleteTargetId: null,
  deleteTargetName: '',
  searchTimer: null,
};

// ── DOM REFS ───────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── INIT ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  wireEvents();
});

function checkAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    showHistoryView();
    loadQuotations();
  } else {
    showLoginView();
  }
}

// ── AUTH ───────────────────────────────────────────────
function showLoginView() {
  $('login-view').classList.remove('hidden');
  $('history-view').classList.add('hidden');
}

function showHistoryView() {
  $('login-view').classList.add('hidden');
  $('history-view').classList.remove('hidden');
  const name = localStorage.getItem(NAME_KEY) || '';
  if (name) $('user-greeting').textContent = `Hello, ${name}`;
}

async function handleLogin() {
  const btn  = $('login-btn');
  const name = $('login-name').value.trim();
  const code = $('login-code').value.trim();
  const err  = $('login-error');

  err.classList.add('hidden');
  if (!name || !code) { showLoginError('Enter your name and access code.'); return; }

  btn.disabled = true;
  btn.textContent = 'Verifying…';

  try {
    const res = await apiFetch('/api/auth/login', 'POST', { name, code }, false);
    const data = await res.json();
    if (!res.ok) { showLoginError(data.error || 'Invalid access code.'); return; }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(NAME_KEY, data.name);
    showHistoryView();
    loadQuotations();
  } catch {
    showLoginError('Connection error. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg> Unlock History`;
  }
}

function showLoginError(msg) {
  const err = $('login-error');
  err.textContent = msg;
  err.classList.remove('hidden');
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
  showLoginView();
}

// ── API CLIENT ─────────────────────────────────────────
async function apiFetch(path, method = 'GET', body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['x-auth-token'] = localStorage.getItem(TOKEN_KEY) || '';
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (res.status === 401 && auth) { handleLogout(); }
  return res;
}

// ── DATA LOADING ───────────────────────────────────────
async function loadQuotations() {
  showLoading(true);

  const params = new URLSearchParams({
    page:      state.page,
    limit:     state.limit,
    sortBy:    state.sortBy,
    sortOrder: state.sortOrder,
  });
  if (state.search) params.set('q', state.search);
  if (state.vendor) params.set('vendor', state.vendor);
  if (state.kw)     params.set('kw', state.kw);
  if (state.type)   params.set('type', state.type);

  try {
    const res  = await apiFetch('/api/quotations?' + params.toString());
    if (!res.ok) { showToast('Failed to load quotations', 'error'); return; }
    const data = await res.json();
    state.totalPages = data.pagination.pages || 1;
    state.total      = data.pagination.total  || 0;
    renderAll(data.data, data.pagination);
  } catch {
    showToast('Network error — could not load quotations', 'error');
  } finally {
    showLoading(false);
  }
}

function showLoading(on) {
  const el = $('loading-indicator');
  if (on) el.classList.remove('hidden');
  else    el.classList.add('hidden');
}

// ── RENDERING ──────────────────────────────────────────
function renderAll(quotes, pagination) {
  // results count
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end   = Math.min(pagination.page * pagination.limit, pagination.total);
  $('results-count').textContent = pagination.total === 0
    ? 'No quotations found'
    : `Showing ${start}–${end} of ${pagination.total} quotation${pagination.total !== 1 ? 's' : ''}`;

  // desktop table
  renderTable(quotes, pagination);
  // mobile cards
  renderCards(quotes, pagination);
  // pagination
  renderPagination(pagination);
}

function fmtAmount(v) {
  if (!v) return '—';
  const n = parseFloat(String(v).replace(/,/g, ''));
  if (isNaN(n)) return v;
  return '₹' + n.toLocaleString('en-IN');
}

function renderTable(quotes, pagination) {
  const tbody = $('table-body');
  const empty = $('table-empty');
  if (!quotes || quotes.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  tbody.innerHTML = quotes.map((q, i) => {
    const seq = (pagination.page - 1) * pagination.limit + i + 1;
    return `
    <tr data-id="${q._id}">
      <td>${seq}</td>
      <td>${q.date || '—'}</td>
      <td class="ref-cell" title="${escHtml(q.ref_no || '')}">${escHtml(q.ref_no || '—')}</td>
      <td class="client-cell" title="${escHtml(q.client_name || '')}">${escHtml(q.client_name || '—')}</td>
      <td>${escHtml(q.client_number || '—')}</td>
      <td>${escHtml(q.kw || '—')}</td>
      <td>${escHtml(q.vendor_name || '—')}</td>
      <td class="amount-cell">${fmtAmount(q.base_cost)}</td>
      <td class="amount-cell">${fmtAmount(q.final_amount)}</td>
      <td><span class="badge badge-${q.type}">${q.type || '—'}</span></td>
      <td>
        <div class="tbl-actions">
          <button class="btn-icon btn-icon-edit edit-btn" data-id="${q._id}" title="Edit quotation" aria-label="Edit ${escHtml(q.client_name || '')}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon btn-icon-delete delete-btn" data-id="${q._id}" data-name="${escHtml(q.client_name || '')}" title="Delete quotation" aria-label="Delete ${escHtml(q.client_name || '')}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderCards(quotes, pagination) {
  const body  = $('cards-body');
  const empty = $('cards-empty');
  if (!quotes || quotes.length === 0) {
    body.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  body.innerHTML = quotes.map((q, i) => {
    const seq   = (pagination.page - 1) * pagination.limit + i + 1;
    const delay = (i * 0.05).toFixed(2);
    return `
    <div class="quote-card" style="animation-delay:${delay}s">
      <div class="quote-card-header">
        <span class="card-seq">#${seq}</span>
        <span class="badge badge-${q.type}">${(q.type || '').toUpperCase()}</span>
        <span class="card-date">${q.date || '—'}</span>
      </div>
      <div class="quote-card-body">
        <div class="card-client-name">${escHtml(q.client_name || '—')}</div>
        <div class="card-meta">
          <div class="card-meta-item">Capacity: <span>${escHtml(q.kw || '—')} kW</span></div>
          <div class="card-meta-item">Vendor: <span>${escHtml(q.vendor_name || '—')}</span></div>
          ${q.client_number ? `<div class="card-meta-item">Mobile: <span>${escHtml(q.client_number)}</span></div>` : ''}
        </div>
        <div class="card-amount">${fmtAmount(q.final_amount)}</div>
        <div class="card-ref">${escHtml(q.ref_no || '—')}</div>
        <div class="card-actions">
          <button class="card-btn-edit edit-btn" data-id="${q._id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit
          </button>
          <button class="card-btn-delete delete-btn" data-id="${q._id}" data-name="${escHtml(q.client_name || '')}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
            Delete
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderPagination(pagination) {
  $('prev-btn').disabled = pagination.page <= 1;
  $('next-btn').disabled = pagination.page >= pagination.pages;
  $('page-info').textContent = pagination.pages > 0
    ? `Page ${pagination.page} of ${pagination.pages}`
    : 'No results';
}

// ── EDIT ───────────────────────────────────────────────
let _editQuoteData = null;

function openEditModal(id) {
  // find quote in current rendered rows
  const row = document.querySelector(`[data-id="${id}"]`);
  if (!row) return;

  state.editingId = id;

  // gather current values from DOM row cells
  const cells = row.querySelectorAll('td');
  const data = {
    client_name:  cells[3]?.textContent.trim() || '',
    kw:           cells[5]?.textContent.trim() || '',
    vendor_name:  cells[6]?.textContent.trim() || '',
    base_cost:    cells[7]?.textContent.replace('₹','').replace(/,/g,'').trim() || '',
    final_amount: cells[8]?.textContent.replace('₹','').replace(/,/g,'').trim() || '',
    type:         row.querySelector('.badge')?.textContent.trim().toLowerCase() || '',
  };
  _editQuoteData = data;

  const fields = $('edit-fields');
  fields.innerHTML = `
    <div class="edit-field-group">
      <label for="ef-client_name">Client Name</label>
      <input id="ef-client_name" type="text" value="${escHtml(data.client_name)}">
    </div>
    <div class="edit-field-group">
      <label for="ef-vendor_name">Vendor Name</label>
      <input id="ef-vendor_name" type="text" value="${escHtml(data.vendor_name)}">
    </div>
    <div class="edit-field-group">
      <label for="ef-kw">Capacity (kW)</label>
      <input id="ef-kw" type="number" step="0.5" min="0" value="${escHtml(data.kw)}">
    </div>
    <div class="edit-field-group">
      <label for="ef-base_cost">Base Cost (₹)</label>
      <input id="ef-base_cost" type="number" step="1" min="0" value="${escHtml(data.base_cost)}">
    </div>
    <div class="edit-field-group">
      <label for="ef-final_amount">Final Amount (₹)</label>
      <input id="ef-final_amount" type="number" step="1" min="0" value="${escHtml(data.final_amount)}">
    </div>
    <div class="edit-field-group">
      <label for="ef-type">Type</label>
      <select id="ef-type">
        <option value="bank" ${data.type === 'bank' ? 'selected' : ''}>Bank</option>
        <option value="client" ${data.type === 'client' ? 'selected' : ''}>Client</option>
      </select>
    </div>`;

  $('edit-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('ef-client_name')?.focus(), 100);
}

function closeEditModal() {
  $('edit-modal').classList.add('hidden');
  document.body.style.overflow = '';
  state.editingId = null;
}

async function saveEdit() {
  if (!state.editingId) return;
  const btn = $('save-edit-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const updates = {
    client_name:  $('ef-client_name')?.value.trim(),
    vendor_name:  $('ef-vendor_name')?.value.trim(),
    kw:           $('ef-kw')?.value.trim(),
    base_cost:    $('ef-base_cost')?.value.trim(),
    final_amount: $('ef-final_amount')?.value.trim(),
    type:         $('ef-type')?.value,
  };

  // remove empty
  Object.keys(updates).forEach(k => { if (!updates[k]) delete updates[k]; });

  try {
    const res  = await apiFetch(`/api/quotations/${state.editingId}`, 'PUT', updates);
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Update failed', 'error'); return; }
    showToast('Quotation updated successfully', 'success');
    closeEditModal();
    loadQuotations();
  } catch {
    showToast('Network error — update failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Changes`;
  }
}

// ── DELETE ─────────────────────────────────────────────
function openDeleteModal(id, name) {
  state.deleteTargetId   = id;
  state.deleteTargetName = name;
  $('delete-confirm-text').textContent = `Delete quotation for "${name}"?`;
  $('delete-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('confirm-delete-btn')?.focus(), 100);
}

function closeDeleteModal() {
  $('delete-modal').classList.add('hidden');
  document.body.style.overflow = '';
  state.deleteTargetId = null;
}

async function confirmDelete() {
  if (!state.deleteTargetId) return;
  const btn = $('confirm-delete-btn');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  try {
    const res  = await apiFetch(`/api/quotations/${state.deleteTargetId}`, 'DELETE');
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Delete failed', 'error'); return; }
    showToast('Quotation deleted', 'success');
    closeDeleteModal();
    // reset to page 1 if last item on page
    if (state.page > 1) state.page = 1;
    loadQuotations();
  } catch {
    showToast('Network error — delete failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg> Yes, Delete`;
  }
}

// ── TOASTS ─────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const tc   = $('toast-container');
  const el   = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  tc.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── HELPERS ────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── EVENT WIRING ───────────────────────────────────────
function wireEvents() {
  // Login
  $('login-btn')?.addEventListener('click', handleLogin);
  $('login-code')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  $('login-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('login-code')?.focus(); });

  // Logout
  $('logout-btn')?.addEventListener('click', handleLogout);

  // Search (debounced)
  $('search-input')?.addEventListener('input', e => {
    const val = e.target.value;
    $('clear-search-btn').classList.toggle('hidden', !val);
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => {
      state.search = val.trim();
      state.page   = 1;
      loadQuotations();
    }, 350);
  });

  $('clear-search-btn')?.addEventListener('click', () => {
    $('search-input').value = '';
    $('clear-search-btn').classList.add('hidden');
    state.search = '';
    state.page   = 1;
    loadQuotations();
  });

  // Filters
  $('filter-vendor')?.addEventListener('change', e => {
    state.vendor = e.target.value;
    state.page   = 1;
    loadQuotations();
  });

  $('filter-kw')?.addEventListener('change', e => {
    state.kw   = e.target.value;
    state.page = 1;
    loadQuotations();
  });

  $('filter-type')?.addEventListener('change', e => {
    state.type = e.target.value;
    state.page = 1;
    loadQuotations();
  });

  $('sort-select')?.addEventListener('change', e => {
    const [field, order] = e.target.value.split('_');
    // handle two-word fields like final_amount_number
    const parts     = e.target.value.split('_');
    const sortOrder = parts.pop();
    const sortBy    = parts.join('_');
    state.sortBy    = sortBy;
    state.sortOrder = sortOrder;
    state.page      = 1;
    loadQuotations();
  });

  // Pagination
  $('prev-btn')?.addEventListener('click', () => {
    if (state.page > 1) { state.page--; loadQuotations(); }
  });

  $('next-btn')?.addEventListener('click', () => {
    if (state.page < state.totalPages) { state.page++; loadQuotations(); }
  });

  // Edit modal
  $('cancel-edit-btn')?.addEventListener('click', closeEditModal);
  $('cancel-edit-btn2')?.addEventListener('click', closeEditModal);
  $('save-edit-btn')?.addEventListener('click', saveEdit);
  $('edit-modal')?.addEventListener('click', e => { if (e.target === $('edit-modal')) closeEditModal(); });

  // Delete modal
  $('cancel-delete-btn')?.addEventListener('click', closeDeleteModal);
  $('cancel-delete-btn-x')?.addEventListener('click', closeDeleteModal);
  $('confirm-delete-btn')?.addEventListener('click', confirmDelete);
  $('delete-modal')?.addEventListener('click', e => { if (e.target === $('delete-modal')) closeDeleteModal(); });

  // Delegated: edit / delete buttons in table and cards
  document.addEventListener('click', e => {
    const editBtn   = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    if (editBtn)   { openEditModal(editBtn.dataset.id); return; }
    if (deleteBtn) { openDeleteModal(deleteBtn.dataset.id, deleteBtn.dataset.name || 'this quotation'); }
  });

  // Keyboard: close modals on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!$('edit-modal').classList.contains('hidden'))   closeEditModal();
      if (!$('delete-modal').classList.contains('hidden')) closeDeleteModal();
    }
  });
}
