const API_BASE_URL = 'https://greensunesbe.onrender.com';

const tableDefaults = [
    { component: 'PV Modules', spec: 'TOPCon', company: 'Adani', qty: '10 No.' },
    { component: 'Grid-Tie Inverter', spec: 'Capacity of {{kw}} kW', company: 'K Solar / Polycab / Millenium / FoxESS', qty: '1 Nos.' },
    { component: 'Structure', spec: 'GP Pipe (Apollo) Galvanized', company: 'Apollo 2mm', qty: 'As Required' },
    { component: 'Meter', spec: 'Net Meter & Solar', company: 'Genius / L&T', qty: '1 set' },
    { component: 'DC Wire', spec: '4 mm', company: 'Polycab', qty: 'As Required' },
    { component: 'AC Wire', spec: 'As Required', company: 'Polycab / Finolex', qty: 'As Required' },
    { component: 'Earthing Wire', spec: '1" Strip', company: 'GI / Tata', qty: 'As Required' },
    { component: 'Earthing Material', spec: '2 Meter GI Earthing Rod + Chemical', company: 'GI / Tata', qty: '1 Set' },
    { component: 'Lighting Arrestor', spec: 'As Required', company: 'As Per Standard', qty: '1 No.' },
    { component: 'Fitting Accessories', spec: 'As Required', company: 'As Per Standard', qty: 'As Required' },
    { component: 'ACDB / DCDB / MCB Box / Busbar / Panel Box', spec: 'As Required', company: 'As Per Standard', qty: '1 Set' }
];

let qtyOptions = ['As Required', '1 set', '1 Set'];
for (let i = 1; i <= 100; i++) {
    qtyOptions.push(`${i} No.`);
}

let globalCount = 0;
let quoteFinalized = false;
let isGenerating = false;

function getFormattedDate() {
    const inputDate = document.getElementById('date').value;
    let dateObj = inputDate ? new Date(inputDate) : new Date();
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    return `${dd}${mm}${yy}`;
}

function getClientShortName() {
    const name = document.getElementById('client_name').value.trim();
    if (!name) return 'NA';
    const words = name.split(' ');
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return (words[0].slice(0, 3) + words[words.length - 1].slice(0, 3)).toUpperCase();
}

function convertNumberToWords(amount) {
    const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (amount === 0) return 'Zero Rupees Only';
    let a = Math.round(amount).toString();
    if (a.length > 9) return 'Amount too large';
    let n = ('000000000' + a).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (words[Number(n[1])] || tens[n[1][0]] + ' ' + words[n[1][1]]) + ' Crore ' : '';
    str += (n[2] != 0) ? (words[Number(n[2])] || tens[n[2][0]] + ' ' + words[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] != 0) ? (words[Number(n[3])] || tens[n[3][0]] + ' ' + words[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] != 0) ? (words[Number(n[4])] || tens[n[4][0]] + ' ' + words[n[4][1]]) + ' Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (words[Number(n[5])] || tens[n[5][0]] + ' ' + words[n[5][1]]) + ' ' : '';
    return str.trim() + ' Rupees Only';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount);
}


function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (el && el.tomselect) {
        if (!el.tomselect.options[value]) {
            el.tomselect.addOption({ value: value, text: value });
        }
        el.tomselect.setValue(value, true);
    } else if (el) {
        el.value = value;
    }
}

function renderOptions(options) {
    return options.map(option => `<option value="${escapeHtml(option)}"></option>`).join('');
}

function editableInput(id, options = []) {
    let html = `<select id="${id}" class="row-input custom-select">`;
    options.forEach(opt => {
        html += `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`;
    });
    html += `</select>`;
    return html;
}

function specOptions(component) {
    if (component.includes('PV Modules')) return ['Mono PERC', 'Half Cut', 'TOPCon', 'Bifacial'];
    return [];
}

function companyOptions(component) {
    if (component.includes('Modules')) return ['GREW', 'Waaree', 'INA Solar', 'Vikram Solar', 'Renew', 'Adani'];
    if (component.includes('Inverter')) return ['K Solar', 'Polycab', 'Millenium', 'FoxESS'];
    if (component.includes('Meter')) return ['Genius', 'L&T'];
    if (component.includes('DC Wire')) return ['Polycab'];
    if (component.includes('AC Wire')) return ['Polycab', 'Finolex', 'Polycab / Finolex'];
    if (component.includes('Earthing')) return ['GI', 'Tata', 'GI / Tata'];
    return ['As Per Standard'];
}

function renderTable() {
    const container = document.getElementById('materials-body');
    container.innerHTML = '';
    for (let i = 0; i < 11; i++) {
        const d = tableDefaults[i];
        const num = String(i + 1).padStart(2, '0');
        const card = document.createElement('div');
        card.className = 'material-card';
        card.innerHTML = `
            <div class="material-card-header"><div class="material-card-title">${d.component}</div><span class="material-card-num">${num}</span></div>
            <div class="material-card-body">
                <div class="material-field"><label for="spec_${i + 1}">Specifications</label>${editableInput(`spec_${i + 1}`, specOptions(d.component))}</div>
                <div class="material-field"><label for="company_${i + 1}">Company / Make</label>${editableInput(`company_${i + 1}`, companyOptions(d.component))}</div>
                <div class="material-field"><label for="qty_${i + 1}">Quantity</label>${editableInput(`qty_${i + 1}`, qtyOptions)}</div>
            </div>`;
        container.appendChild(card);
    }

    // Initialize Tom Select
    for (let i = 0; i < 11; i++) {
        const ids = [`spec_${i + 1}`, `company_${i + 1}`, `qty_${i + 1}`];
        ids.forEach(id => {
            let config = {
                create: true,
                maxOptions: null
            };
            if (id.startsWith('qty_')) {
                config.sortField = [{ field: '$order' }];
            }
            new TomSelect(`#${id}`, config);
            // Re-trigger calculation and state save on change
            document.getElementById(id).addEventListener('change', () => {
                markDraftChanged();
                calculate();
                updateRefNo();
                saveState();
            });
        });
    }
}

function loadDefaults() {
    const kw = document.getElementById('kw').value || '';
    for (let i = 0; i < 11; i++) {
        const d = tableDefaults[i];
        let specStr = d.spec;
        if (i === 1) specStr = specStr.replace('{{kw}}', kw);
        setSelectValue(`spec_${i + 1}`, specStr);
        setSelectValue(`company_${i + 1}`, d.company);
        setSelectValue(`qty_${i + 1}`, d.qty);
    }
}

function validateInputs() {
    const clientName = document.getElementById('client_name').value.trim();
    const kw = document.getElementById('kw').value.trim();
    const baseCost = document.getElementById('base_cost').value.trim();
    if (!clientName || !kw || !baseCost) {
        showToast('Please fill out Client Name, Capacity (kW), and Base Cost.', 'error');
        return false;
    }
    return true;
}

function calculate() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const base_cost = parseFloat(document.getElementById('base_cost').value) || 0;
    const gst_pct = parseFloat(document.getElementById('gst_pct').value) || 0;
    const central_subsidy = parseFloat(document.getElementById('central_subsidy').value) || 0;
    const state_subsidy = parseFloat(document.getElementById('state_subsidy').value) || 0;
    const discount = parseFloat(document.getElementById('discount_amount').value) || 0;
    document.getElementById('discount-container').style.display = type === 'client' ? 'block' : 'none';
    const gst_amount = (base_cost * gst_pct) / 100;
    const total_subsidy = central_subsidy + state_subsidy;
    let final_amount = base_cost + gst_amount;
    if (type === 'client') final_amount -= discount;
    final_amount = Math.round(final_amount);
    document.getElementById('gst_display').value = formatCurrency(gst_amount);
    document.getElementById('total_subsidy').value = formatCurrency(total_subsidy);
    document.getElementById('final_amount').value = formatCurrency(final_amount);
    document.getElementById('final_amount_words').value = convertNumberToWords(final_amount);
    updateRefNo();
}

function updateRefNo() {
    const refInput = document.getElementById('ref_no');
    if (quoteFinalized && refInput.value) return;
    const type = document.querySelector('input[name="type"]:checked').value;
    const kw = document.getElementById('kw').value || '0';
    const padded = globalCount.toString().padStart(4, '0');
    const tStr = type === 'bank' ? 'B' : 'C';
    const dateStr = getFormattedDate();
    const clientShort = getClientShortName();
    refInput.value = `GSE/${tStr}/${kw}kW/${dateStr}/${clientShort}/${padded}`;
}

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function setActionDisabled(disabled) {
    document.getElementById('btn-doc').disabled = disabled;
    document.getElementById('btn-pdf').disabled = disabled;
    document.getElementById('clear-btn').disabled = disabled;
}

function setStatus(state) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    dot.className = `dot ${state}`;
    if (state === 'idle') text.textContent = 'Ready';
    if (state === 'loading') text.textContent = 'Generating...';
    if (state === 'success') text.textContent = 'Done';
    if (state === 'error') text.textContent = 'Failed';
}

function buildPayload() {
    const client_number = document.getElementById('client_number').value;
    const base_cost = parseFloat(document.getElementById('base_cost').value) || 0;
    const gst_pct = parseFloat(document.getElementById('gst_pct').value) || 0;
    const gst = (base_cost * gst_pct) / 100;
    const central_subsidy = parseFloat(document.getElementById('central_subsidy').value) || 0;
    const state_subsidy = parseFloat(document.getElementById('state_subsidy').value) || 0;
    const type = document.querySelector('input[name="type"]:checked').value;
    let discount = type === 'client' ? parseFloat(document.getElementById('discount_amount').value) || 0 : 0;
    let final_amount = base_cost + gst;
    if (type === 'client') final_amount -= discount;
    final_amount = Math.round(final_amount);
    const payload = {
        type,
        client_number,
        base_cost: formatCurrency(base_cost),
        client_address: document.getElementById('client_address').value || '',
        client_name: document.getElementById('client_name').value || '',
        date: document.getElementById('date').value ? new Date(document.getElementById('date').value).toLocaleDateString('en-GB') : '',
        final_amount_words: convertNumberToWords(final_amount),
        final_amount: formatCurrency(final_amount),
        gst: formatCurrency(gst),
        kw: document.getElementById('kw').value || '0',
        ref_no: document.getElementById('ref_no').value || '',
        vendor_name: document.getElementById('vendor_phone').dataset.vendorName || '',
        vendor_phone: document.getElementById('vendor_phone').value || '',
        central_subsidy: formatCurrency(central_subsidy),
        state_subsidy: formatCurrency(state_subsidy)
    };
    if (type === 'client') payload['Discount_amount'] = formatCurrency(discount);
    for (let i = 1; i <= 11; i++) {
        payload[`spec_${i}`] = document.getElementById(`spec_${i}`).value || '';
        payload[`company_${i}`] = document.getElementById(`company_${i}`).value || '';
        payload[`qty_${i}`] = document.getElementById(`qty_${i}`).value || '';
    }
    return payload;
}

function saveState() {
    const state = {
        quoteFinalized,
        type: document.querySelector('input[name="type"]:checked').value,
        ref_no: document.getElementById('ref_no').value,
        date: document.getElementById('date').value,
        kw: document.getElementById('kw').value,
        client_name: document.getElementById('client_name').value,
        client_number: document.getElementById('client_number').value,
        client_address: document.getElementById('client_address').value,
        base_cost: document.getElementById('base_cost').value,
        gst_pct: document.getElementById('gst_pct').value,
        central_subsidy: document.getElementById('central_subsidy').value,
        state_subsidy: document.getElementById('state_subsidy').value,
        discount_amount: document.getElementById('discount_amount').value,
        vendor_select: document.getElementById('vendor_select').value,
        vendor_phone: document.getElementById('vendor_phone').value,
        table: {}
    };
    for (let i = 1; i <= 11; i++) {
        state.table[i] = {
            spec: document.getElementById(`spec_${i}`).value,
            company: document.getElementById(`company_${i}`).value,
            qty: document.getElementById(`qty_${i}`).value
        };
    }
    sessionStorage.setItem('gse_quote_state', JSON.stringify(state));
}

function restoreState() {
    const saved = sessionStorage.getItem('gse_quote_state');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            quoteFinalized = Boolean(state.quoteFinalized);
            document.querySelector(`input[name="type"][value="${state.type}"]`).checked = true;
            document.getElementById('ref_no').value = state.ref_no || '';
            document.getElementById('date').value = state.date;
            document.getElementById('kw').value = state.kw;
            document.getElementById('client_name').value = state.client_name;
            document.getElementById('client_number').value = state.client_number || '';
            document.getElementById('client_address').value = state.client_address;
            document.getElementById('base_cost').value = String(state.base_cost || '').replace(/,/g, '');
            document.getElementById('gst_pct').value = state.gst_pct;
            document.getElementById('central_subsidy').value = state.central_subsidy;
            document.getElementById('state_subsidy').value = state.state_subsidy;
            document.getElementById('discount_amount').value = state.discount_amount;
            if (state.vendor_select) {
                document.getElementById('vendor_select').value = state.vendor_select;
                if (document.getElementById('vendor_select').tomselect) {
                    document.getElementById('vendor_select').tomselect.setValue(state.vendor_select, true);
                }
                document.getElementById('vendor_phone').value = state.vendor_phone || '';
                document.getElementById('vendor_phone').dataset.vendorName = state.vendor_select.split('|')[0] || '';
            }
            for (let i = 1; i <= 11; i++) {
                if (state.table[i]) {
                    setSelectValue(`spec_${i}`, state.table[i].spec);
                    setSelectValue(`company_${i}`, state.table[i].company);
                    setSelectValue(`qty_${i}`, state.table[i].qty);
                }
            }
        } catch (e) { }
    } else {
        loadDefaults();
    }
}

async function fetchCount() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/next-count`);
        const data = await res.json();
        globalCount = data.count;
        updateRefNo();
    } catch (e) { console.error(e); }
}

function markDraftChanged() {
    if (!quoteFinalized) return;
    quoteFinalized = false;
    fetchCount();
}

async function downloadDoc(ext) {
    if (isGenerating) return;
    if (!validateInputs()) return;
    isGenerating = true;
    setActionDisabled(true);
    setStatus('loading');
    const overlay = document.getElementById('loading-overlay');
    document.getElementById('loading-msg').textContent = ext === 'pdf' ? 'Generating PDF...' : 'Generating DOCX...';
    overlay.style.display = 'flex';
    const type = document.querySelector('input[name="type"]:checked').value;
    updateRefNo();
    const payload = buildPayload();
    try {
        const res = await fetch(`${API_BASE_URL}/api/download/${ext}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data: payload })
        });
        if (!res.ok) {
            let errMsg = `Server error ${res.status}`;
            try {
                const rawText = await res.text();
                console.error('Server raw response:', rawText);
                try { errMsg = JSON.parse(rawText).error || rawText; } catch (e) { errMsg = rawText; }
            } catch (e2) { }
            throw new Error(errMsg);
        }
        const clientName = document.getElementById('client_name').value || 'Draft';
        const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${safeName}_GSE_Quotation.${ext}`;
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.hidden = true;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        quoteFinalized = true;
        saveState();
        setStatus('success');
        showToast(`Successfully downloaded ${ext.toUpperCase()}`, 'success');
    } catch (error) {
        console.error(error);
        setStatus('error');
        showToast(error.message, 'error');
    } finally {
        isGenerating = false;
        setActionDisabled(false);
        document.getElementById('loading-overlay').style.display = 'none';
    }
}

function resetFormForNewQuote() {
    quoteFinalized = false;
    sessionStorage.removeItem('gse_quote_state');
    document.querySelectorAll('input:not([type="radio"]), textarea').forEach(el => el.value = '');
    document.getElementById('vendor_select').value = '';
    if (document.getElementById('vendor_select').tomselect) {
        document.getElementById('vendor_select').tomselect.clear();
    }
    document.getElementById('vendor_phone').value = '';
    document.getElementById('vendor_phone').dataset.vendorName = '';
    document.getElementById('gst_pct').value = '8.9';
    document.getElementById('central_subsidy').value = '78000';
    document.getElementById('state_subsidy').value = '17000';
    document.querySelector('input[name="type"][value="bank"]').checked = true;
    loadDefaults();
    fetchCount();
    calculate();
}

function init() {
    new TomSelect('#vendor_select', { create: false, sortField: [{ field: '$order' }] });
    renderTable();
    restoreState();
    fetchCount();
    calculate();
    document.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', () => {
            markDraftChanged();
            if (el.id === 'kw') {
                const spec2 = document.getElementById('spec_2');
                const newVal = `Capacity of ${el.value} kW`;
                if (spec2 && spec2.tomselect && spec2.tomselect.getValue().startsWith('Capacity of')) {
                    setSelectValue('spec_2', newVal);
                } else if (spec2 && spec2.value.startsWith('Capacity of')) {
                    spec2.value = newVal;
                }
            }
            calculate();
            updateRefNo();
            saveState();
        });
    });
    document.getElementById('date').addEventListener('change', () => {
        markDraftChanged();
        updateRefNo();
        saveState();
    });
    document.querySelectorAll('input[name="type"]').forEach(el => {
        el.addEventListener('change', () => {
            markDraftChanged();
            calculate();
            updateRefNo();
            saveState();
        });
    });
    document.getElementById('client_number').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        saveState();
    });
    document.getElementById('vendor_select').addEventListener('change', () => {
        markDraftChanged();
        const val = document.getElementById('vendor_select').value;
        const phoneEl = document.getElementById('vendor_phone');
        if (val) {
            const [name, phone] = val.split('|');
            phoneEl.value = phone || '';
            phoneEl.dataset.vendorName = name || '';
        } else {
            phoneEl.value = '';
            phoneEl.dataset.vendorName = '';
        }
        saveState();
    });
    document.getElementById('btn-doc').addEventListener('click', () => downloadDoc('docx'));
    document.getElementById('btn-pdf').addEventListener('click', () => downloadDoc('pdf'));
    document.getElementById('clear-btn').addEventListener('click', resetFormForNewQuote);
}

document.addEventListener('DOMContentLoaded', init);
