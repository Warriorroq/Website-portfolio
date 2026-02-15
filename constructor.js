function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function buildFilters(filters) {
    const list = filters || [];
    const primary = list.filter(f => f.primary !== false && (f.primary === true || list.indexOf(f) < 7));
    const rest = list
        .filter(f => !primary.includes(f))
        .sort((a, b) => (a.label || a.tag || '').localeCompare(b.label || b.tag || '', undefined, { sensitivity: 'base' }));

    const btn = (f, active) =>
        `<button class="filter-btn${active ? ' active' : ''}" data-tag="${escapeHtml(f.tag || '')}">${escapeHtml(f.label || f.tag || '')}</button>`;

    const mainBtns = primary.map((f, i) => btn(f, i === 0)).join('');
    const moreBtn = rest.length
        ? `<button type="button" class="filter-more-btn" data-i18n="filter_more" aria-expanded="false"></button>`
        : '';
    const extraRow = rest.length
        ? `<div class="project-filters-extra"><div class="project-filters-extra-inner">${rest.map(f => btn(f, false)).join('')}</div></div>`
        : '';

    return `<div class="project-filters-main">${mainBtns}${moreBtn}</div>${extraRow}`;
}

function buildProjects(projects) {
    return (projects || []).map(p => {
        const tagsStr = (p.tags || []).join(' ');
        const slidesHtml = (p.slides || []).map((s, i) => {
            const mediaUrl = s.url || s.src || (typeof s.label === 'string' && /^https?:\/\//i.test(s.label) ? s.label : null);
            const alt = (s.label && !/^https?:\/\//i.test(s.label)) ? s.label : (p.title || 'Project media');
            const isVideo = s.type === 'video' || (mediaUrl && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl));
            if (mediaUrl && isVideo) {
                return `<div class="project-media-slide${i === 0 ? ' active' : ''}"><video src="${escapeHtml(mediaUrl)}" title="${escapeHtml(alt)}" loop muted playsinline preload="metadata"></video></div>`;
            }
            if (mediaUrl) {
                return `<div class="project-media-slide${i === 0 ? ' active' : ''}"><img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(alt)}" loading="lazy" referrerpolicy="no-referrer"></div>`;
            }
            return `<div class="project-media-slide${i === 0 ? ' active' : ''}"><div class="project-placeholder"><span>${escapeHtml(s.label || '')}</span></div></div>`;
        }).join('');
        const techHtml = (p.tech || []).map(t => `<li>${escapeHtml(t)}</li>`).join('');
        const achievementsHtml = (p.achievements || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');
        const linksHtml = (p.links || []).map(l => `<a href="${escapeHtml(l.url || '#')}" target="_blank">${escapeHtml(l.label || '')}</a>`).join('');

        return `
            <article class="project-card" data-tags="${escapeHtml(tagsStr)}" tabindex="0">
                <div class="project-preview">
                    <div class="project-media" title="Click to change photo">
                        <div class="project-media-slides">${slidesHtml}</div>
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
