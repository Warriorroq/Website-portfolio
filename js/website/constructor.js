function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getEmbedVideoUrl(url, type) {
    if (!url || typeof url !== 'string') return null;
    if (type === 'youtube' || type === 'yt') {
        const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (m) return 'https://www.youtube.com/embed/' + m[1] + '?rel=0';
    }
    if (type === 'vimeo') {
        const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (m) return 'https://player.vimeo.com/video/' + m[1];
    }
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1] + '?rel=0';
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1];
    return null;
}

function buildFilters(filters, tagCounts) {
    const list = filters || [];
    const counts = tagCounts || {};

    const getCount = (tag) => {
        if (!tag) return 0;
        const v = counts[tag];
        return Number.isFinite(v) ? v : 0;
    };

    const tags = list
        .map(f => ({ tag: f?.tag || '', label: f?.label || f?.tag || '' }))
        .filter(x => x.tag && x.tag !== 'all')
        .map(x => ({ ...x, count: getCount(x.tag) }))
        .sort((a, b) => {
            const byCount = (b.count - a.count);
            if (byCount) return byCount;
            return (a.label || a.tag).localeCompare(b.label || b.tag, undefined, { sensitivity: 'base' });
        });

    const optionsHtml = tags.map(tg => {
        const disabled = tg.count <= 0;
        return `
            <button type="button" class="tag-option" role="option" data-tag="${escapeHtml(tg.tag)}" ${disabled ? 'disabled aria-disabled="true"' : ''}>
                <span class="tag-option-label" data-tag-label="${escapeHtml(tg.tag)}">${escapeHtml(tg.label)}</span>
                <span class="tag-option-count" aria-hidden="true">${tg.count}</span>
            </button>
        `;
    }).join('');

    return `
        <div class="tag-search" data-tag-search>
            <div class="tag-search-bar" role="combobox" aria-expanded="false" aria-haspopup="listbox">
                <div class="tag-search-selected" data-tag-selected></div>
                <input class="tag-search-input" type="text" autocomplete="off" spellcheck="false" data-i18n-placeholder="filter_search_placeholder" data-i18n-aria="filter_search_aria" placeholder="Search by title or tags" aria-label="Search projects" />
                <button type="button" class="tag-search-clear" data-tag-clear aria-label="Clear">×</button>
            </div>
            <div class="tag-search-dropdown" data-tag-dropdown role="listbox" hidden>
                ${optionsHtml || '<div class="tag-option-empty" data-tag-empty>No tags</div>'}
            </div>
        </div>
    `;
}

function buildProjects(projects) {
    return (projects || []).map(p => {
        const tagsStr = (p.tags || []).join(' ');
        const slidesHtml = (p.slides || []).map((s, i) => {
            const mediaUrl = s.url || s.src || (typeof s.label === 'string' && /^https?:\/\//i.test(s.label) ? s.label : null);
            const alt = (s.label && !/^https?:\/\//i.test(s.label)) ? s.label : (p.title || 'Project media');
            const embedSrc = getEmbedVideoUrl(mediaUrl, s.type);
            const isVideo = s.type === 'video' || (mediaUrl && !embedSrc && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl));
            if (embedSrc) {
                return `<div class="project-media-slide${i === 0 ? ' active' : ''}"><iframe src="${escapeHtml(embedSrc)}" title="${escapeHtml(alt)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
            }
            if (mediaUrl && isVideo) {
                return `<div class="project-media-slide${i === 0 ? ' active' : ''}"><video src="${escapeHtml(mediaUrl)}" title="${escapeHtml(alt)}" loop muted playsinline preload="metadata"></video></div>`;
            }
            if (mediaUrl) {
                return `<div class="project-media-slide${i === 0 ? ' active' : ''}"><img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(alt)}" loading="lazy" referrerpolicy="no-referrer"></div>`;
            }
            return `<div class="project-media-slide${i === 0 ? ' active' : ''}"><div class="project-placeholder"><span>${escapeHtml(s.label || '')}</span></div></div>`;
        }).join('');
        const slidesCount = (p.slides || []).length;
        const arrowsHtml = slidesCount > 1
            ? `<button type="button" class="project-media-arrow project-media-arrow-prev" aria-label="Previous slide">&larr;</button><button type="button" class="project-media-arrow project-media-arrow-next" aria-label="Next slide">&rarr;</button>`
            : '';
        const techHtml = (p.tech || []).map(t => `<li>${escapeHtml(t)}</li>`).join('');
        const achievementsHtml = (p.achievements || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');
        const linksHtml = (p.links || []).map(l => `<a href="${escapeHtml(l.url || '#')}" target="_blank">${escapeHtml(l.label || '')}</a>`).join('');

        return `
            <article class="project-card" data-tags="${escapeHtml(tagsStr)}" data-title="${escapeHtml(p.title || '')}" tabindex="0">
                <div class="project-preview">
                    <div class="project-media" title="Click to change photo">
                        <div class="project-media-slides">${slidesHtml}</div>
                        ${arrowsHtml}
                        <span class="project-media-hint">Click to change</span>
                    </div>
                    <div class="project-head">
                        <h3>${escapeHtml(p.title || '')}</h3>
                        <p class="project-role">${escapeHtml(p.role || '')}</p>
                    </div>
                </div>
                <div class="project-details">
                    <div class="project-details-inner">
                        <p class="project-platform">${escapeHtml(p.platform || '')}</p>
                        <ul class="project-tech">${techHtml}</ul>
                        <ul class="project-did">${achievementsHtml}</ul>
                        <div class="project-links">${linksHtml}</div>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function buildSkills(skills) {
    return (skills || []).map(cat => {
        const itemsHtml = (cat.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
        return `
            <div class="skills-category">
                <h4>${escapeHtml(cat.title || '')}</h4>
                <ul>${itemsHtml}</ul>
            </div>
        `;
    }).join('');
}

function buildExperience(experience) {
    return (experience || []).map(exp => {
        const itemsHtml = (exp.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
        return `
            <article class="experience-item">
                <div class="experience-header">
                    <h3>${escapeHtml(exp.company || '')}</h3>
                    <span class="experience-period">${escapeHtml(exp.period || '')}</span>
                </div>
                <p class="experience-role">${escapeHtml(exp.role || '')}</p>
                <ul>${itemsHtml}</ul>
            </article>
        `;
    }).join('');
}
