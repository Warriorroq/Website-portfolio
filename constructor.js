function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function buildFilters(filters) {
    return (filters || []).map((f, i) =>
        `<button class="filter-btn${i === 0 ? ' active' : ''}" data-tag="${escapeHtml(f.tag || '')}">${escapeHtml(f.label || f.tag || '')}</button>`
    ).join('');
}

function buildProjects(projects) {
    return (projects || []).map(p => {
        const tagsStr = (p.tags || []).join(' ');
        const slidesHtml = (p.slides || []).map((s, i) =>
            `<div class="project-media-slide${i === 0 ? ' active' : ''}"><div class="project-placeholder"><span>${escapeHtml(s.label || '')}</span></div></div>`
        ).join('');
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
