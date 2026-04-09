function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
}

function safeJsonParse(text) {
    try {
        return { ok: true, value: JSON.parse(text) };
    } catch (e) {
        return { ok: false, error: e };
    }
}

function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function linesToArray(v) {
    return String(v || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
}

function arrayToLines(arr) {
    return (arr || []).join('\n');
}

function uniq(arr) {
    const out = [];
    const set = new Set();
    (arr || []).forEach(v => {
        const s = String(v || '').trim();
        if (!s || set.has(s)) return;
        set.add(s);
        out.push(s);
    });
    return out;
}

const DEFAULT_PROJECT = () => ({
    title: 'New project',
    role: '',
    platform: '',
    tags: [],
    tech: [],
    achievements: [],
    slides: [],
    links: []
});

const DEFAULT_FILTER = () => ({
    tag: 'new-tag',
    label: 'New Tag',
    primary: false
});

const ui = {
    projectsList: document.querySelector('[data-list="projects"]'),
    petList: document.querySelector('[data-list="petProjects"]'),
    filtersList: document.querySelector('[data-list="filters"]'),
    panelTitle: document.querySelector('[data-ui="panel-title"]'),
    form: document.querySelector('[data-ui="form"]'),
    filterForm: document.querySelector('[data-ui="filter-form"]'),
    raw: document.querySelector('[data-ui="raw"]'),
    status: document.querySelector('[data-ui="status"]'),
    btnDelete: document.querySelector('[data-action="delete"]'),
    btnDuplicate: document.querySelector('[data-action="duplicate"]'),
    btnApplyRaw: document.querySelector('[data-action="apply-raw"]'),
    btnFormatRaw: document.querySelector('[data-action="format-raw"]'),
    btnDownloadProjects: document.querySelector('[data-action="download-projects"]'),
    btnDownloadTags: document.querySelector('[data-action="download-tags"]'),
    btnLoad: document.querySelector('[data-action="load"]')
};

let state = { projects: [], petProjects: [] };
let tagsState = { filters: [] };
let selection = null; // { kind: 'projects'|'petProjects'|'filters', index: number }

function setStatus(msg, isError = false) {
    if (!ui.status) return;
    ui.status.textContent = msg || '';
    ui.status.style.color = isError ? '#ef4444' : '';
}

function getSelectedItem() {
    if (!selection) return null;
    const root = selection.kind === 'filters' ? tagsState : state;
    const arr = root[selection.kind];
    if (!Array.isArray(arr)) return null;
    return arr[selection.index] ?? null;
}

function setSelection(kind, index) {
    selection = { kind, index };
    renderSidebar();
    renderPanel();
}

function renderList(el, kind, items, getTitle, getMeta) {
    if (!el) return;
    el.innerHTML = '';
    (items || []).forEach((item, idx) => {
        const active = selection && selection.kind === kind && selection.index === idx;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'editor-item';
        btn.dataset.active = active ? 'true' : 'false';
        btn.innerHTML = `
            <span class="editor-item-title">${escapeHtml(getTitle(item, idx))}</span>
            <span class="editor-item-meta">${escapeHtml(getMeta(item, idx))}</span>
        `;
        btn.addEventListener('click', () => setSelection(kind, idx));
        el.appendChild(btn);
    });
}

function renderSidebar() {
    renderList(ui.projectsList, 'projects', state.projects,
        (p, i) => p?.title || `Project ${i + 1}`,
        (p) => (p?.tags || []).length ? `${(p.tags || []).length} tags` : ''
    );
    renderList(ui.petList, 'petProjects', state.petProjects,
        (p, i) => p?.title || `Pet ${i + 1}`,
        (p) => (p?.tags || []).length ? `${(p.tags || []).length} tags` : ''
    );
    renderList(ui.filtersList, 'filters', tagsState.filters,
        (f) => f?.label || f?.tag || 'Filter',
        (f) => f?.tag || ''
    );
}

function setButtonsEnabled(enabled) {
    ui.btnDelete.disabled = !enabled;
    ui.btnDuplicate.disabled = !enabled;
    ui.btnApplyRaw.disabled = !enabled;
    ui.btnFormatRaw.disabled = !enabled;
    ui.raw.disabled = !enabled;
}

function fillField(name, value) {
    const el = document.querySelector(`[data-field="${name}"]`);
    if (!el) return;
    if (el.type === 'checkbox') {
        el.checked = !!value;
        return;
    }
    el.value = value ?? '';
}

function readField(name) {
    const el = document.querySelector(`[data-field="${name}"]`);
    if (!el) return null;
    if (el.type === 'checkbox') return !!el.checked;
    return el.value;
}

function allKnownTags() {
    const fromFilters = (tagsState.filters || []).map(f => f?.tag).filter(Boolean);
    const fromProjects = []
        .concat(...(state.projects || []).map(p => p?.tags || []))
        .concat(...(state.petProjects || []).map(p => p?.tags || []));
    return uniq([...fromFilters, ...fromProjects]).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function renderTagsWidget(tags) {
    const wrap = ui.form?.querySelector('[data-ui="tags"]');
    const selectedEl = ui.form?.querySelector('[data-ui="tags-selected"]');
    const input = ui.form?.querySelector('[data-ui="tags-input"]');
    const dropdown = ui.form?.querySelector('[data-ui="tags-dropdown"]');
    if (!wrap || !selectedEl || !input || !dropdown) return;

    const selected = new Set((tags || []).map(t => String(t || '').trim()).filter(Boolean));
    const known = allKnownTags();

    function renderSelected() {
        selectedEl.innerHTML = Array.from(selected).map(tag => `
            <button type="button" class="editor-tag-pill" data-tag-pill="${escapeHtml(tag)}">
                <span>${escapeHtml(tag)}</span>
                <span class="editor-tag-pill-x" aria-hidden="true">×</span>
            </button>
        `).join('');
        selectedEl.querySelectorAll('[data-tag-pill]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag-pill');
                if (!tag) return;
                selected.delete(tag);
                applyToModel();
                renderSelected();
                filterOptions(input.value);
            });
        });
    }

    function buildOptions() {
        dropdown.innerHTML = known.map(tag => `
            <button type="button" class="editor-tag-option" data-tag-opt="${escapeHtml(tag)}">
                <span>${escapeHtml(tag)}</span>
                <span style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.82rem;">tag</span>
            </button>
        `).join('');
        dropdown.querySelectorAll('[data-tag-opt]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag-opt');
                if (!tag) return;
                selected.add(tag);
                input.value = '';
                applyToModel();
                renderSelected();
                filterOptions('');
                input.focus();
            });
        });
    }

    function open() { dropdown.hidden = false; }
    function close() { dropdown.hidden = true; }

    function filterOptions(q) {
        const query = String(q || '').trim().toLowerCase();
        let any = false;
        dropdown.querySelectorAll('[data-tag-opt]').forEach(btn => {
            const tag = btn.getAttribute('data-tag-opt') || '';
            const isSelected = selected.has(tag);
            const matches = !query || tag.toLowerCase().includes(query);
            const show = matches && !isSelected;
            btn.hidden = !show;
            if (show) any = true;
        });
        dropdown.hidden = !any && !query;
    }

    function applyToModel() {
        const item = getSelectedItem();
        if (!item) return;
        item.tags = Array.from(selected);
        renderSidebar();
        syncRawFromModel();
    }

    buildOptions();
    renderSelected();
    filterOptions('');

    input.addEventListener('focus', () => { open(); filterOptions(input.value); });
    input.addEventListener('input', () => { open(); filterOptions(input.value); });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); input.blur(); }
        if (e.key === 'Enter') {
            e.preventDefault();
            const v = input.value.trim();
            if (v) {
                selected.add(v);
                input.value = '';
                applyToModel();
                renderSelected();
                filterOptions('');
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (wrap.contains(e.target)) return;
        close();
    });
}

function syncFormFromModel() {
    const item = getSelectedItem();
    if (!item) return;

    if (selection.kind === 'filters') {
        ui.form.hidden = true;
        ui.filterForm.hidden = false;
        fillField('tag', item.tag || '');
        fillField('label', item.label || '');
        fillField('primary', !!item.primary);
        return;
    }

    ui.filterForm.hidden = true;
    ui.form.hidden = false;
    fillField('title', item.title || '');
    fillField('role', item.role || '');
    fillField('platform', item.platform || '');
    fillField('tech_lines', arrayToLines(item.tech || []));
    fillField('achievements_lines', arrayToLines(item.achievements || []));
    fillField('slides_json', JSON.stringify(item.slides || [], null, 2));
    fillField('links_json', JSON.stringify(item.links || [], null, 2));
    renderTagsWidget(item.tags || []);
}

function syncModelFromForm() {
    const item = getSelectedItem();
    if (!item) return;

    if (selection.kind === 'filters') {
        item.tag = String(readField('tag') || '').trim();
        item.label = String(readField('label') || '').trim();
        item.primary = !!readField('primary');
        return;
    }

    item.title = readField('title') || '';
    item.role = readField('role') || '';
    item.platform = readField('platform') || '';
    item.tech = linesToArray(readField('tech_lines'));
    item.achievements = linesToArray(readField('achievements_lines'));

    const slidesRes = safeJsonParse(readField('slides_json') || '[]');
    if (slidesRes.ok && Array.isArray(slidesRes.value)) item.slides = slidesRes.value;
    const linksRes = safeJsonParse(readField('links_json') || '[]');
    if (linksRes.ok && Array.isArray(linksRes.value)) item.links = linksRes.value;
}

function syncRawFromModel() {
    const item = getSelectedItem();
    if (!item) return;
    ui.raw.value = JSON.stringify(item, null, 2);
}

function applyRawToModel() {
    const item = getSelectedItem();
    if (!item) return;
    const res = safeJsonParse(ui.raw.value);
    if (!res.ok) {
        setStatus(String(res.error?.message || 'Invalid JSON'), true);
        return;
    }
    const root = selection.kind === 'filters' ? tagsState : state;
    root[selection.kind][selection.index] = res.value;
    setStatus('Applied raw JSON.');
    renderSidebar();
    renderPanel();
}

function renderPanel() {
    setStatus('');
    if (!selection) {
        ui.panelTitle.textContent = 'Select an item';
        setButtonsEnabled(false);
        ui.form.hidden = true;
        ui.filterForm.hidden = true;
        ui.raw.value = '';
        ui.raw.placeholder = 'Select an item to edit…';
        return;
    }

    const item = getSelectedItem();
    const title = selection.kind === 'filters'
        ? `Filter: ${item?.tag || ''}`
        : `${selection.kind === 'petProjects' ? 'Pet project' : 'Project'}: ${item?.title || ''}`;
    ui.panelTitle.textContent = title;

    setButtonsEnabled(true);
    syncFormFromModel();
    syncRawFromModel();
}

function attachFormListeners() {
    const onAnyChange = () => {
        syncModelFromForm();
        renderSidebar();
        syncRawFromModel();
    };
    document.querySelectorAll('[data-ui="form"] [data-field], [data-ui="filter-form"] [data-field]').forEach(el => {
        el.addEventListener('input', onAnyChange);
        el.addEventListener('change', onAnyChange);
    });
}

function addItem(kind, item) {
    const root = kind === 'filters' ? tagsState : state;
    root[kind] = root[kind] || [];
    root[kind].push(item);
    setSelection(kind, root[kind].length - 1);
}

function duplicateSelected() {
    if (!selection) return;
    const item = getSelectedItem();
    if (!item) return;
    const copy = JSON.parse(JSON.stringify(item));
    if (selection.kind !== 'filters') copy.title = (copy.title || 'Project') + ' (copy)';
    const root = selection.kind === 'filters' ? tagsState : state;
    root[selection.kind].splice(selection.index + 1, 0, copy);
    setSelection(selection.kind, selection.index + 1);
}

function deleteSelected() {
    if (!selection) return;
    const { kind, index } = selection;
    const root = kind === 'filters' ? tagsState : state;
    root[kind].splice(index, 1);
    const nextIdx = Math.min(index, root[kind].length - 1);
    selection = null;
    renderSidebar();
    if (nextIdx >= 0) setSelection(kind, nextIdx);
    else renderPanel();
}

async function load() {
    setStatus('Loading…');
    selection = null;
    renderSidebar();
    renderPanel();

    const [projectsRes, tagsRes] = await Promise.all([
        fetch('data/projects.json', { cache: 'no-cache' }),
        fetch('data/tags.json', { cache: 'no-cache' })
    ]);
    const [projectsJson, tagsJson] = await Promise.all([projectsRes.json(), tagsRes.json()]);
    state = {
        projects: Array.isArray(projectsJson.projects) ? projectsJson.projects : [],
        petProjects: Array.isArray(projectsJson.petProjects) ? projectsJson.petProjects : []
    };
    tagsState = {
        filters: Array.isArray(tagsJson.filters) ? tagsJson.filters : []
    };

    setStatus('Loaded `data/projects.json` and `data/tags.json`.');
    renderSidebar();
    renderPanel();
}

function downloadProjects() {
    const out = {
        petProjects: state.petProjects || [],
        projects: state.projects || []
    };
    downloadText('projects.modified.json', JSON.stringify(out, null, 2));
    setStatus('Downloaded `projects.modified.json`.');
}

function downloadTags() {
    const out = {
        filters: tagsState.filters || []
    };
    downloadText('tags.modified.json', JSON.stringify(out, null, 2));
    setStatus('Downloaded `tags.modified.json`.');
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const act = btn.getAttribute('data-action');
    if (act === 'download-projects') downloadProjects();
    if (act === 'download-tags') downloadTags();
    if (act === 'load') load();
    if (act === 'add-project') addItem('projects', DEFAULT_PROJECT());
    if (act === 'add-pet') addItem('petProjects', DEFAULT_PROJECT());
    if (act === 'add-filter') addItem('filters', DEFAULT_FILTER());
    if (act === 'duplicate') duplicateSelected();
    if (act === 'delete') deleteSelected();
    if (act === 'apply-raw') applyRawToModel();
    if (act === 'format-raw') {
        const res = safeJsonParse(ui.raw.value);
        if (!res.ok) return setStatus(String(res.error?.message || 'Invalid JSON'), true);
        ui.raw.value = JSON.stringify(res.value, null, 2);
        setStatus('Formatted.');
    }
});

attachFormListeners();
load().catch(err => {
    console.error(err);
    setStatus('Failed to load projects.json. See console.', true);
});

