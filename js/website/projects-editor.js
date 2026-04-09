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

function slideRowValues(s) {
    const raw = s || {};
    const url = String(raw.url || raw.src || '').trim();
    const type = String(raw.type || '').trim();
    return { label: String(raw.label || '').trim(), url, type };
}

function normalizeSlideFromRow(row) {
    const label = row.querySelector('[data-slide-part="label"]')?.value?.trim() ?? '';
    const url = row.querySelector('[data-slide-part="url"]')?.value?.trim() ?? '';
    const type = row.querySelector('[data-slide-part="type"]')?.value?.trim() ?? '';
    const o = {};
    if (label) o.label = label;
    if (url) o.url = url;
    if (type) o.type = type;
    return o;
}

function normalizeLinkFromRow(row) {
    const label = row.querySelector('[data-link-part="label"]')?.value?.trim() ?? '';
    const url = row.querySelector('[data-link-part="url"]')?.value?.trim() ?? '';
    const o = {};
    if (label) o.label = label;
    if (url) o.url = url;
    return o;
}

function readSlidesLinksFromDom(item) {
    if (!item) return;
    const sw = ui.form?.querySelector('[data-ui="slides-list"]');
    const lw = ui.form?.querySelector('[data-ui="links-list"]');
    if (sw) {
        item.slides = Array.from(sw.querySelectorAll('.editor-slide-row'))
            .map(row => normalizeSlideFromRow(row))
            .filter(s => s.label || s.url || s.type);
    }
    if (lw) {
        item.links = Array.from(lw.querySelectorAll('.editor-link-row'))
            .map(row => normalizeLinkFromRow(row))
            .filter(l => l.label || l.url);
    }
}

function slideRowHtml(s, i, n) {
    const { label, url, type } = slideRowValues(s);
    return `
        <div class="editor-slide-row" data-slide-index="${i}">
            <div class="editor-slide-fields">
                <input type="text" class="editor-input" placeholder="Label" data-slide-part="label" value="${escapeHtml(label)}" />
                <input type="text" class="editor-input editor-mono" placeholder="https://… or images/…" data-slide-part="url" value="${escapeHtml(url)}" spellcheck="false" />
                <select class="editor-input editor-select" data-slide-part="type" title="Media type">
                    <option value=""${!type ? ' selected' : ''}>Auto</option>
                    <option value="youtube"${type === 'youtube' ? ' selected' : ''}>YouTube</option>
                    <option value="yt"${type === 'yt' ? ' selected' : ''}>YouTube (yt)</option>
                    <option value="vimeo"${type === 'vimeo' ? ' selected' : ''}>Vimeo</option>
                    <option value="video"${type === 'video' ? ' selected' : ''}>Video file</option>
                </select>
            </div>
            <div class="editor-row-actions">
                <button type="button" class="editor-icon-btn" data-action="slide-up" data-index="${i}"${i === 0 ? ' disabled' : ''} title="Move up">↑</button>
                <button type="button" class="editor-icon-btn" data-action="slide-down" data-index="${i}"${i >= n - 1 ? ' disabled' : ''} title="Move down">↓</button>
                <button type="button" class="editor-icon-btn" data-action="slide-remove" data-index="${i}" title="Remove">×</button>
            </div>
        </div>
    `;
}

function linkRowHtml(l, i, n) {
    const label = String(l?.label || '').trim();
    const url = String(l?.url || '').trim();
    return `
        <div class="editor-link-row" data-link-index="${i}">
            <div class="editor-link-fields">
                <input type="text" class="editor-input" placeholder="Label" data-link-part="label" value="${escapeHtml(label)}" />
                <input type="text" class="editor-input editor-mono" placeholder="https://…" data-link-part="url" value="${escapeHtml(url)}" spellcheck="false" />
            </div>
            <div class="editor-row-actions">
                <button type="button" class="editor-icon-btn" data-action="link-up" data-index="${i}"${i === 0 ? ' disabled' : ''} title="Move up">↑</button>
                <button type="button" class="editor-icon-btn" data-action="link-down" data-index="${i}"${i >= n - 1 ? ' disabled' : ''} title="Move down">↓</button>
                <button type="button" class="editor-icon-btn" data-action="link-remove" data-index="${i}" title="Remove">×</button>
            </div>
        </div>
    `;
}

function renderSlidesLinksUI(item) {
    const sw = ui.form?.querySelector('[data-ui="slides-list"]');
    const lw = ui.form?.querySelector('[data-ui="links-list"]');
    if (!sw || !lw || !item) return;
    const slides = Array.isArray(item.slides) ? item.slides : [];
    const links = Array.isArray(item.links) ? item.links : [];
    sw.innerHTML = slides.length
        ? slides.map((s, i) => slideRowHtml(s, i, slides.length)).join('')
        : '<div class="editor-list-empty">No slides yet — add one.</div>';
    lw.innerHTML = links.length
        ? links.map((l, i) => linkRowHtml(l, i, links.length)).join('')
        : '<div class="editor-list-empty">No links yet — add one.</div>';
}

const DEFAULT_FILTER = () => ({
    tag: 'new-tag',
    label: 'New Tag',
    primary: false
});

const ui = {
    sidebarList: document.querySelector('[data-ui="sidebar-list"]'),
    sidebarSearch: document.querySelector('[data-ui="sidebar-search"]'),
    sidebarAdd: document.querySelector('[data-ui="sidebar-add"]'),
    sidebarTabs: Array.from(document.querySelectorAll('[data-tab]')),
    sidebarCounts: Array.from(document.querySelectorAll('[data-count]')),
    projectPanel: document.querySelector('[data-ui="project-panel"]'),
    tagPanel: document.querySelector('[data-ui="tag-panel"]'),
    projectBadge: document.querySelector('[data-ui="project-badge"]'),
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
let sidebarTab = 'projects';
let sidebarQuery = '';

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
    (items || []).forEach((row, idx) => {
        const item = row && typeof row === 'object' && 'item' in row ? row.item : row;
        const realIndex = row && typeof row === 'object' && 'idx' in row ? row.idx : idx;
        const active = selection && selection.kind === kind && selection.index === realIndex;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'editor-item';
        btn.dataset.active = active ? 'true' : 'false';
        btn.innerHTML = `
            <span class="editor-item-title">${escapeHtml(getTitle(row, idx))}</span>
            <span class="editor-item-meta">${escapeHtml(getMeta(row, idx))}</span>
        `;
        btn.addEventListener('click', () => setSelection(kind, realIndex));
        el.appendChild(btn);
    });
}

function getSidebarSource(kind) {
    if (kind === 'filters') return tagsState.filters || [];
    return state[kind] || [];
}

function getSidebarTitle(kind, item, idx) {
    if (kind === 'filters') return item?.label || item?.tag || `Tag ${idx + 1}`;
    return item?.title || `${kind === 'petProjects' ? 'Pet' : 'Project'} ${idx + 1}`;
}

function getSidebarMeta(kind, item) {
    if (kind === 'filters') return item?.tag || '';
    const n = (item?.tags || []).length;
    return n ? `${n} tags` : '';
}

function matchesSidebarQuery(kind, item, q) {
    if (!q) return true;
    const query = q.toLowerCase();
    if (kind === 'filters') {
        return String(item?.tag || '').toLowerCase().includes(query) || String(item?.label || '').toLowerCase().includes(query);
    }
    const title = String(item?.title || '').toLowerCase();
    const role = String(item?.role || '').toLowerCase();
    const platform = String(item?.platform || '').toLowerCase();
    const tags = (item?.tags || []).join(' ').toLowerCase();
    return title.includes(query) || role.includes(query) || platform.includes(query) || tags.includes(query);
}

function renderSidebar() {
    ui.sidebarTabs?.forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        btn.setAttribute('aria-selected', tab === sidebarTab ? 'true' : 'false');
    });

    ui.sidebarCounts?.forEach(el => {
        const kind = el.getAttribute('data-count');
        if (!kind) return;
        el.textContent = String(getSidebarSource(kind).length);
    });

    const list = getSidebarSource(sidebarTab);
    const filtered = (list || []).map((item, idx) => ({ item, idx }))
        .filter(x => matchesSidebarQuery(sidebarTab, x.item, sidebarQuery));

    const addAction = sidebarTab === 'projects'
        ? 'add-project'
        : (sidebarTab === 'petProjects' ? 'add-pet' : 'add-filter');
    if (ui.sidebarAdd) ui.sidebarAdd.setAttribute('data-action', addAction);

    renderList(ui.sidebarList, sidebarTab, filtered,
        (x) => getSidebarTitle(sidebarTab, x.item, x.idx),
        (x) => getSidebarMeta(sidebarTab, x.item)
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

/** Catalog entries for the site (tags.json). Excludes pseudo-tag "all". */
function tagCatalogEntries() {
    return (tagsState.filters || [])
        .map(f => ({ tag: String(f?.tag || '').trim(), label: String(f?.label || f?.tag || '').trim() }))
        .filter(x => x.tag && x.tag !== 'all');
}

function catalogTagSet() {
    return new Set(tagCatalogEntries().map(x => x.tag));
}

function labelForCatalogTag(tag) {
    const e = tagCatalogEntries().find(x => x.tag === tag);
    return e?.label || tag;
}

function renderTagsWidget(tags) {
    const wrap = ui.form?.querySelector('[data-ui="tags"]');
    const selectedEl = ui.form?.querySelector('[data-ui="tags-selected"]');
    const input = ui.form?.querySelector('[data-ui="tags-input"]');
    const dropdown = ui.form?.querySelector('[data-ui="tags-dropdown"]');
    if (!wrap || !selectedEl || !input || !dropdown) return;

    if (wrap._tagsAbort) wrap._tagsAbort.abort();
    const ac = new AbortController();
    wrap._tagsAbort = ac;

    const catalog = catalogTagSet();
    const assigned = (tags || []).map(t => String(t || '').trim()).filter(Boolean);
    const selected = new Set(assigned.filter(t => catalog.has(t)));
    let orphans = assigned.filter(t => !catalog.has(t));

    function renderSelected() {
        const orphanHtml = orphans.map(tag => `
            <button type="button" class="editor-tag-pill editor-tag-pill-orphan" data-tag-pill="${escapeHtml(tag)}" title="Not in tags.json — add this slug under Tags, or remove">
                <span>${escapeHtml(tag)}</span>
                <span class="editor-tag-pill-x" aria-hidden="true">×</span>
            </button>
        `).join('');
        const normalHtml = Array.from(selected).map(tag => `
            <button type="button" class="editor-tag-pill" data-tag-pill="${escapeHtml(tag)}" title="${escapeHtml(labelForCatalogTag(tag))}">
                <span>${escapeHtml(tag)}</span>
                <span class="editor-tag-pill-x" aria-hidden="true">×</span>
            </button>
        `).join('');
        selectedEl.innerHTML = orphanHtml + normalHtml;
        selectedEl.querySelectorAll('[data-tag-pill]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag-pill');
                if (!tag) return;
                selected.delete(tag);
                const oi = orphans.indexOf(tag);
                if (oi >= 0) orphans.splice(oi, 1);
                applyToModel();
                renderSelected();
                filterOptions(input.value);
            });
        });
    }

    function buildOptions() {
        const rows = tagCatalogEntries();
        dropdown.innerHTML = rows.map(({ tag: t, label }) => `
            <button type="button" class="editor-tag-option" data-tag-opt="${escapeHtml(t)}" data-tag-label="${escapeHtml(label)}">
                <span>${escapeHtml(label)}</span>
                <span class="editor-tag-option-slug">${escapeHtml(t)}</span>
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
            const label = (btn.getAttribute('data-tag-label') || '').toLowerCase();
            const isSelected = selected.has(tag);
            const matches = !query || tag.toLowerCase().includes(query) || label.includes(query);
            const show = matches && !isSelected;
            btn.hidden = !show;
            if (show) any = true;
        });
        dropdown.hidden = !any;
    }

    function applyToModel() {
        const item = getSelectedItem();
        if (!item) return;
        item.tags = uniq([...orphans, ...selected]);
        renderSidebar();
        syncRawFromModel();
    }

    buildOptions();
    renderSelected();
    filterOptions('');

    const onDocClick = (e) => {
        if (wrap.contains(e.target)) return;
        close();
    };

    input.addEventListener('focus', () => { open(); filterOptions(input.value); }, { signal: ac.signal });
    input.addEventListener('input', () => { open(); filterOptions(input.value); }, { signal: ac.signal });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); input.blur(); }
        if (e.key === 'Enter') e.preventDefault();
    }, { signal: ac.signal });

    document.addEventListener('click', onDocClick, { signal: ac.signal });
}

function syncFormFromModel() {
    const item = getSelectedItem();
    if (!item) return;

    if (selection.kind === 'filters') {
        fillField('tag', item.tag || '');
        fillField('label', item.label || '');
        fillField('primary', !!item.primary);
        return;
    }

    fillField('title', item.title || '');
    fillField('role', item.role || '');
    fillField('platform', item.platform || '');
    fillField('tech_lines', arrayToLines(item.tech || []));
    fillField('achievements_lines', arrayToLines(item.achievements || []));
    renderSlidesLinksUI(item);
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
    readSlidesLinksFromDom(item);
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
        if (ui.projectPanel) ui.projectPanel.hidden = true;
        if (ui.tagPanel) ui.tagPanel.hidden = true;
        ui.raw.value = '';
        ui.raw.placeholder = 'Select an item to edit…';
        return;
    }

    const item = getSelectedItem();
    const isTag = selection.kind === 'filters';
    if (ui.projectPanel) ui.projectPanel.hidden = isTag;
    if (ui.tagPanel) ui.tagPanel.hidden = !isTag;
    if (ui.projectBadge) {
        ui.projectBadge.textContent = selection.kind === 'petProjects' ? 'projects.json · pet' : 'projects.json';
    }

    const title = isTag
        ? `Tag: ${item?.tag || ''}`
        : `${selection.kind === 'petProjects' ? 'Pet project' : 'Project'}: ${item?.title || ''}`;
    ui.panelTitle.textContent = title;

    setButtonsEnabled(true);
    syncFormFromModel();
    syncRawFromModel();
}

function initSidebarUx() {
    ui.sidebarTabs?.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            if (!tab) return;
            sidebarTab = tab;
            sidebarQuery = ui.sidebarSearch?.value || '';
            selection = null;
            renderSidebar();
            renderPanel();
        });
    });
    ui.sidebarSearch?.addEventListener('input', () => {
        sidebarQuery = ui.sidebarSearch.value || '';
        renderSidebar();
    });
}

function attachFormListeners() {
    const onAnyChange = () => {
        syncModelFromForm();
        renderSidebar();
        syncRawFromModel();
    };
    document.querySelectorAll('[data-ui="project-panel"] [data-field], [data-ui="tag-panel"] [data-field]').forEach(el => {
        el.addEventListener('input', onAnyChange);
        el.addEventListener('change', onAnyChange);
    });
    const onSlidesLinksInput = () => {
        if (!selection || selection.kind === 'filters') return;
        const item = getSelectedItem();
        if (!item) return;
        readSlidesLinksFromDom(item);
        syncRawFromModel();
    };
    ui.form?.addEventListener('input', (e) => {
        if (!e.target.closest('[data-slide-part], [data-link-part]')) return;
        onSlidesLinksInput();
    });
    ui.form?.addEventListener('change', (e) => {
        if (!e.target.closest('[data-slide-part], [data-link-part]')) return;
        onSlidesLinksInput();
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

    const item = getSelectedItem();
    const isProject = item && selection && selection.kind !== 'filters';

    if (act === 'slide-add' && isProject) {
        readSlidesLinksFromDom(item);
        if (!Array.isArray(item.slides)) item.slides = [];
        item.slides.push({ label: `Slide ${item.slides.length + 1}`, url: '' });
        renderSlidesLinksUI(item);
        syncRawFromModel();
        return;
    }
    if (act === 'slide-remove' && isProject) {
        const idx = Number(btn.dataset.index);
        if (Number.isNaN(idx)) return;
        readSlidesLinksFromDom(item);
        if (!Array.isArray(item.slides)) item.slides = [];
        item.slides.splice(idx, 1);
        renderSlidesLinksUI(item);
        syncRawFromModel();
        return;
    }
    if (act === 'slide-up' && isProject) {
        const idx = Number(btn.dataset.index);
        if (Number.isNaN(idx) || idx < 1) return;
        readSlidesLinksFromDom(item);
        if (!Array.isArray(item.slides)) item.slides = [];
        const a = item.slides[idx - 1];
        item.slides[idx - 1] = item.slides[idx];
        item.slides[idx] = a;
        renderSlidesLinksUI(item);
        syncRawFromModel();
        return;
    }
    if (act === 'slide-down' && isProject) {
        const idx = Number(btn.dataset.index);
        readSlidesLinksFromDom(item);
        if (!Array.isArray(item.slides)) item.slides = [];
        if (Number.isNaN(idx) || idx >= item.slides.length - 1) return;
        const a = item.slides[idx + 1];
        item.slides[idx + 1] = item.slides[idx];
        item.slides[idx] = a;
        renderSlidesLinksUI(item);
        syncRawFromModel();
        return;
    }
    if (act === 'link-add' && isProject) {
        readSlidesLinksFromDom(item);
        if (!Array.isArray(item.links)) item.links = [];
        item.links.push({ label: 'Link', url: '' });
        renderSlidesLinksUI(item);
        syncRawFromModel();
        return;
    }
    if (act === 'link-remove' && isProject) {
        const idx = Number(btn.dataset.index);
        if (Number.isNaN(idx)) return;
        readSlidesLinksFromDom(item);
        if (!Array.isArray(item.links)) item.links = [];
        item.links.splice(idx, 1);
        renderSlidesLinksUI(item);
        syncRawFromModel();
        return;
    }
    if (act === 'link-up' && isProject) {
        const idx = Number(btn.dataset.index);
        if (Number.isNaN(idx) || idx < 1) return;
        readSlidesLinksFromDom(item);
        if (!Array.isArray(item.links)) item.links = [];
        const a = item.links[idx - 1];
        item.links[idx - 1] = item.links[idx];
        item.links[idx] = a;
        renderSlidesLinksUI(item);
        syncRawFromModel();
        return;
    }
    if (act === 'link-down' && isProject) {
        const idx = Number(btn.dataset.index);
        readSlidesLinksFromDom(item);
        if (!Array.isArray(item.links)) item.links = [];
        if (Number.isNaN(idx) || idx >= item.links.length - 1) return;
        const a = item.links[idx + 1];
        item.links[idx + 1] = item.links[idx];
        item.links[idx] = a;
        renderSlidesLinksUI(item);
        syncRawFromModel();
        return;
    }

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
initSidebarUx();
load().catch(err => {
    console.error(err);
    setStatus('Failed to load projects.json. See console.', true);
});

