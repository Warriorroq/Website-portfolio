const LANG_KEY = 'site-lang';
const SUPPORTED_LANGS = ['en', 'ru', 'de', 'uk'];
let translations = {};
let currentLang = 'en';

async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
    }
    return await response.json();
}

function getSavedLang() {
    const saved = localStorage.getItem(LANG_KEY);
    return SUPPORTED_LANGS.includes(saved) ? saved : 'en';
}

async function loadLocale(lang) {
    const path = `locales/${lang}.json`;
    try {
        translations = await fetchJson(path);
        return translations;
    } catch {
        if (lang !== 'en') return loadLocale('en');
        translations = {};
    }
}

function t(key) {
    return translations[key] ?? key;
}

function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    loadLocale(lang).then(() => {
        currentLang = lang;
        localStorage.setItem(LANG_KEY, lang);
        document.documentElement.lang = lang;
        const title = t('page_title');
        if (title) document.title = title;
        applyTranslations();
        updateLangButtons(lang);
        updateSkillsToggle();
        updateFilterLabels();
    });
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (val && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
            el.textContent = val;
        }
    });
    updateThemeMoreBtn();
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        const val = t(key);
        if (val) el.setAttribute('aria-label', val);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = t(key);
        if (val && val !== key) el.setAttribute('placeholder', val);
    });
    updateProjectsCarouselDotsI18n();
}

function updateLangButtons(lang) {
    document.querySelectorAll('.settings-lang-btn[data-lang]').forEach(btn => {
        if (btn.dataset.lang === lang) {
            btn.setAttribute('data-active', '');
        } else {
            btn.removeAttribute('data-active');
        }
    });
}

function updateSkillsToggle() {
    const toggle = document.querySelector('.skills-toggle');
    const wrapper = document.querySelector('.skills-grid-wrapper');
    if (toggle && wrapper) {
        const isCollapsed = wrapper.classList.contains('collapsed');
        toggle.textContent = isCollapsed ? t('skills_show_all') : t('skills_hide');
    }
}

function initFilterMore() {
    const moreBtn = document.querySelector('.filter-more-btn');
    const extra = document.querySelector('.project-filters-extra');
    if (!moreBtn || !extra) return;
    moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        extra.classList.toggle('is-open');
        const isOpen = extra.classList.contains('is-open');
        moreBtn.setAttribute('aria-expanded', isOpen);
        updateFilterLabels();
    });
}

function updateFilterLabels() {
    document.querySelectorAll('[data-tag-label]').forEach(el => {
        const tag = el.getAttribute('data-tag-label');
        if (!tag) return;
        const key = 'filter_' + tag;
        const translated = t(key);
        if (translated !== key) el.textContent = translated;
    });
    updatePetProjectsBtn();
}

function updatePetProjectsBtn() {
    const btn = document.querySelector('.projects-pet-btn');
    const extra = document.getElementById('projects-pet-extra');
    if (!btn || !extra) return;
    const isOpen = extra.classList.contains('is-open');
    btn.textContent = isOpen ? t('projects_pet_hide') : t('projects_pet_projects');
    btn.setAttribute('aria-expanded', isOpen);
    extra.setAttribute('aria-hidden', !isOpen);
}

function getVisibleProjectCards(row) {
    return Array.from(row.querySelectorAll('.project-card:not(.hidden)'));
}

function carouselGotoLabel(i) {
    const tpl = t('projects_carousel_goto');
    if (!tpl || tpl === 'projects_carousel_goto') return `Go to project ${i + 1}`;
    return tpl.replace(/\{\{\s*n\s*\}\}/gi, String(i + 1));
}

function updateProjectsCarouselDotsI18n() {
    document.querySelectorAll('.projects-carousel-dots').forEach(dotsEl => {
        const tablistKey = dotsEl.getAttribute('data-i18n-aria');
        if (tablistKey) {
            const val = t(tablistKey);
            if (val && val !== tablistKey) dotsEl.setAttribute('aria-label', val);
        }
        dotsEl.querySelectorAll('.projects-carousel-dot').forEach((btn, i) => {
            btn.setAttribute('aria-label', carouselGotoLabel(i));
        });
    });
}

let projectsCarouselDotsTeardown = null;

/** Horizontal scroll progress in [0, 1]: 0 = start, 1 = end of row. */
function carouselScrollProgress(row) {
    const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
    if (maxScroll <= 0) return { maxScroll, t: 0 };
    const t = Math.min(1, Math.max(0, row.scrollLeft / maxScroll));
    return { maxScroll, t };
}

function syncProjectsCarouselDotsActive(row, dotsEl) {
    if (dotsEl.hidden || !dotsEl.querySelector('.projects-carousel-dot')) return;
    const visible = getVisibleProjectCards(row);
    const dots = dotsEl.querySelectorAll('.projects-carousel-dot');
    if (!visible.length || dots.length !== visible.length) return;
    const n = dots.length;
    const { t } = carouselScrollProgress(row);
    const idx = n <= 1 ? 0 : Math.round(t * (n - 1));
    dots.forEach((d, i) => d.setAttribute('aria-selected', i === idx ? 'true' : 'false'));
}

function buildProjectsCarouselDots(row, dotsEl) {
    const visible = getVisibleProjectCards(row);
    const canScroll = row.scrollWidth > row.clientWidth + 2;
    if (visible.length <= 1 || !canScroll) {
        dotsEl.hidden = true;
        dotsEl.innerHTML = '';
        return;
    }
    dotsEl.hidden = false;
    dotsEl.innerHTML = '';
    visible.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'projects-carousel-dot';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('aria-label', carouselGotoLabel(i));
        b.addEventListener('click', () => {
            const cards = getVisibleProjectCards(row);
            const n = cards.length;
            if (n <= 0) return;
            const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
            const targetLeft = n <= 1 ? 0 : maxScroll * (i / (n - 1));
            row.scrollTo({ left: targetLeft, behavior: 'smooth' });
        });
        dotsEl.appendChild(b);
    });
    syncProjectsCarouselDotsActive(row, dotsEl);
}

function setupProjectsCarouselDots() {
    if (projectsCarouselDotsTeardown) {
        projectsCarouselDotsTeardown();
        projectsCarouselDotsTeardown = null;
    }
    const cleanups = [];
    document.querySelectorAll('.projects-carousel').forEach(carousel => {
        const dotsEl = carousel.querySelector('.projects-carousel-dots');
        const row = carousel.querySelector('.projects-row');
        if (!dotsEl || !row) return;

        let rafScroll = null;
        const onScroll = () => {
            if (rafScroll) return;
            rafScroll = requestAnimationFrame(() => {
                rafScroll = null;
                syncProjectsCarouselDotsActive(row, dotsEl);
            });
        };

        let resizeRaf = null;
        const onResizeObs = () => {
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(() => {
                resizeRaf = null;
                const visible = getVisibleProjectCards(row);
                const canScroll = row.scrollWidth > row.clientWidth + 2;
                const dots = dotsEl.querySelectorAll('.projects-carousel-dot');
                const needDots = visible.length > 1 && canScroll;
                if (!needDots) {
                    if (!dotsEl.hidden || dots.length) {
                        dotsEl.hidden = true;
                        dotsEl.innerHTML = '';
                    }
                    return;
                }
                if (dots.length !== visible.length) {
                    buildProjectsCarouselDots(row, dotsEl);
                    updateProjectsCarouselDotsI18n();
                } else {
                    dotsEl.hidden = false;
                    syncProjectsCarouselDotsActive(row, dotsEl);
                }
            });
        };

        row.addEventListener('scroll', onScroll, { passive: true });
        const ro = new ResizeObserver(onResizeObs);
        ro.observe(row);

        const onVisibleChanged = () => {
            buildProjectsCarouselDots(row, dotsEl);
            updateProjectsCarouselDotsI18n();
        };
        carousel.addEventListener('projects-visible-changed', onVisibleChanged);

        buildProjectsCarouselDots(row, dotsEl);
        requestAnimationFrame(() => {
            buildProjectsCarouselDots(row, dotsEl);
            updateProjectsCarouselDotsI18n();
        });

        cleanups.push(() => {
            row.removeEventListener('scroll', onScroll);
            ro.disconnect();
            carousel.removeEventListener('projects-visible-changed', onVisibleChanged);
        });
    });
    updateProjectsCarouselDotsI18n();
    projectsCarouselDotsTeardown = () => cleanups.forEach(fn => fn());
}

function initPetProjectsToggle() {
    const btn = document.querySelector('.projects-pet-btn');
    const extra = document.getElementById('projects-pet-extra');
    if (!btn || !extra) return;
    btn.addEventListener('click', () => {
        extra.classList.toggle('is-open');
        updatePetProjectsBtn();
        const petCarousel = document.querySelector('.projects-pet-carousel');
        requestAnimationFrame(() => {
            petCarousel?.dispatchEvent(new CustomEvent('projects-visible-changed'));
        });
    });
    updatePetProjectsBtn();
}

const THEME_KEY = 'site-theme';
const THEMES = ['dark', 'light', 'nord', 'forest', 'monokai', 'dracula', 'gruvbox', 'tokyo', 'catppuccin', 'solarized', 'rose', 'onedark', 'ocean', 'sunset', 'cyber'];

function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
}

function setTheme(name) {
    if (!THEMES.includes(name)) name = 'dark';
    const link = document.getElementById('theme-link');
    if (link) {
        link.href = `css/themes/theme-${name}.css`;
        localStorage.setItem(THEME_KEY, name);
        updateThemeButtons(name);
    }
}

function updateThemeButtons(activeName) {
    document.querySelectorAll('.settings-theme-grid button[data-theme]').forEach(btn => {
        const name = btn.dataset.theme;
        if (name === activeName) {
            btn.setAttribute('data-active', '');
        } else {
            btn.removeAttribute('data-active');
        }
    });
}

function updateThemeMoreBtn() {
    const moreBtn = document.querySelector('.settings-theme-more');
    const extra = document.getElementById('settings-theme-extra');
    if (!moreBtn || !extra) return;
    const isOpen = extra.classList.contains('is-open');
    moreBtn.textContent = isOpen ? t('settings_less_styles') : t('settings_more_styles');
    moreBtn.setAttribute('aria-expanded', isOpen);
    extra.setAttribute('aria-hidden', !isOpen);
}

function openSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const btn = document.querySelector('.nav-settings-btn');
    panel?.classList.add('is-open');
    panel?.setAttribute('aria-hidden', 'false');
    btn?.setAttribute('aria-expanded', 'true');
}

function closeSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const btn = document.querySelector('.nav-settings-btn');
    panel?.classList.remove('is-open');
    panel?.setAttribute('aria-hidden', 'true');
    btn?.setAttribute('aria-expanded', 'false');
}

function initTheme() {
    const saved = getSavedTheme();
    setTheme(saved);

    const settingsBtn = document.querySelector('.nav-settings-btn');
    const panel = document.getElementById('settings-panel');
    const closeBtn = document.querySelector('.settings-panel-close');
    const backdrop = document.querySelector('.settings-panel-backdrop');

    settingsBtn?.addEventListener('click', () => {
        if (panel?.classList.contains('is-open')) {
            closeSettingsPanel();
        } else {
            openSettingsPanel();
        }
    });

    closeBtn?.addEventListener('click', closeSettingsPanel);
    backdrop?.addEventListener('click', closeSettingsPanel);

    panel?.querySelectorAll('.settings-theme-grid button[data-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
            setTheme(btn.dataset.theme);
        });
    });

    const themeMoreBtn = document.querySelector('.settings-theme-more');
    const themeExtra = document.getElementById('settings-theme-extra');
    themeMoreBtn?.addEventListener('click', () => {
        themeExtra?.classList.toggle('is-open');
        updateThemeMoreBtn();
    });
    updateThemeMoreBtn();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel?.classList.contains('is-open')) {
            closeSettingsPanel();
        }
    });
}

initTheme();

async function initLanguage() {
    currentLang = getSavedLang();
    await loadLocale(currentLang);
    document.documentElement.lang = currentLang;
    const title = t('page_title');
    if (title) document.title = title;
    applyTranslations();
    updateLangButtons(currentLang);
    updateSkillsToggle();
    updateFilterLabels();

    document.querySelectorAll('.settings-lang-btn[data-lang]').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    loadData();
}

initLanguage();

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            closeSettingsPanel();
        });
    });
}

const nav = document.querySelector('.nav');

function updateNavBackground() {
    if (window.scrollY > 50) {
        nav?.classList.add('scrolled');
    } else {
        nav?.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', updateNavBackground);
updateNavBackground();

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

const style = document.createElement('style');
style.textContent = `
    .project-card.visible,
    .experience-item.visible,
    .skills-category.visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

async function loadData() {
    const projectsRow = document.querySelector('.projects-row');
    const experienceList = document.querySelector('.experience-list');
    const skillsGrid = document.querySelector('.skills-grid');
    if (!projectsRow && !experienceList && !skillsGrid) return;

    try {
        const [projectsData, tagsData, experienceData, skillsData] = await Promise.all([
            fetchJson('data/projects.json'),
            fetchJson('data/tags.json'),
            fetchJson('data/experience.json'),
            fetchJson('data/skills.json')
        ]);
        const projects = projectsData.projects || [];
        const petProjects = projectsData.petProjects || [];
        const filters = tagsData.filters || [];
        const experience = experienceData.experience || [];
        const skills = skillsData.skills || [];

        const filtersContainer = document.querySelector('.project-filters');
        if (filtersContainer) {
            const allProjects = [...projects, ...petProjects];
            const tagCounts = allProjects.reduce((acc, p) => {
                const unique = new Set((p?.tags || []).filter(Boolean));
                unique.forEach(tag => {
                    acc[tag] = (acc[tag] || 0) + 1;
                });
                return acc;
            }, {});
            tagCounts.all = allProjects.length;
            filtersContainer.innerHTML = buildFilters(filters, tagCounts);
            updateFilterLabels();
        }

        if (projectsRow) {
            projectsRow.innerHTML = buildProjects(projects);
        }

        const petWrap = document.getElementById('projects-pet-wrap');
        const petExtra = document.getElementById('projects-pet-extra');
        const petRow = document.querySelector('.projects-pet-row');
        if (petWrap && petExtra && petRow) {
            petWrap.hidden = false;
            if (petProjects.length === 0) {
                const emptyEl = document.createElement('p');
                emptyEl.className = 'projects-pet-empty';
                emptyEl.setAttribute('data-i18n', 'projects_pet_empty');
                emptyEl.textContent = t('projects_pet_empty');
                petRow.innerHTML = '';
                petRow.appendChild(emptyEl);
            } else {
                petRow.innerHTML = buildProjects(petProjects);
            }
            petExtra.classList.add('is-open');
            initPetProjectsToggle();
        }

        initProjectCards();
        initProjectsRowsScroll();
        setupProjectsCarouselDots();

        if (skillsGrid) {
            skillsGrid.innerHTML = buildSkills(skills);
            initSkillsItems();
            initSkillsCollapse(skillsGrid);
            updateSkillsToggle();
        }

        if (experienceList) {
            experienceList.innerHTML = buildExperience(experience);
            initExperienceItems();
        }
    } catch (err) {
        console.error('Failed to load data:', err);
        if (projectsRow) projectsRow.innerHTML = '<p class="projects-error">' + t('projects_error') + '</p>';
        if (experienceList) experienceList.innerHTML = '<p class="experience-error">' + t('experience_error') + '</p>';
        if (skillsGrid) skillsGrid.innerHTML = '<p class="skills-error">' + t('skills_error') + '</p>';
    }
}

function initSkillsItems() {
    document.querySelectorAll('.skills-category').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

function initSkillsCollapse(skillsGrid) {
    const container = skillsGrid.parentElement;
    const actionsSlot = container.querySelector('.section-header-actions');
    const toggle = document.createElement('button');
    toggle.className = 'skills-toggle';
    toggle.type = 'button';
    toggle.textContent = t('skills_show_all');
    toggle.setAttribute('aria-expanded', 'false');
    if (actionsSlot) {
        actionsSlot.appendChild(toggle);
    } else {
        container.insertBefore(toggle, skillsGrid);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'skills-grid-wrapper collapsed';
    container.insertBefore(wrapper, skillsGrid);
    wrapper.appendChild(skillsGrid);

    toggle.addEventListener('click', () => {
        const isCollapsed = wrapper.classList.toggle('collapsed');
        toggle.textContent = isCollapsed ? t('skills_show_all') : t('skills_hide');
        toggle.setAttribute('aria-expanded', !isCollapsed);
    });
}

function initExperienceItems() {
    document.querySelectorAll('.experience-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

const CONTAINER_ASPECT = 16 / 9;
const ASPECT_SIMILAR_THRESHOLD = 0.18;

function updateMediaArrowsVisibility(card) {
    const media = card?.querySelector('.project-media');
    const active = card?.querySelector('.project-media-slide.active');
    if (!media || !active) return;
    const isImage = !!active.querySelector('img');
    media.classList.toggle('project-media-arrows-hidden', isImage);
}

function updateSlidePopsOut(slide) {
    if (!slide) return;
    const img = slide.querySelector('img');
    const video = slide.querySelector('video');
    const media = img || video;
    if (!media) {
        slide.classList.remove('slide-pops-out', 'slide-cover');
        return;
    }
    const w = img ? img.naturalWidth : (video.videoWidth || 0);
    const h = img ? img.naturalHeight : (video.videoHeight || 0);
    if (!w || !h) {
        slide.classList.remove('slide-pops-out', 'slide-cover');
        if (video) video.addEventListener('loadedmetadata', () => updateSlidePopsOut(slide), { once: true });
        return;
    }
    const aspect = w / h;
    const diff = Math.abs(aspect - CONTAINER_ASPECT) / CONTAINER_ASPECT;
    const shouldPopOut = diff > ASPECT_SIMILAR_THRESHOLD && h > w;
    const shouldCover = w > h;
    if (shouldPopOut) {
        slide.classList.add('slide-pops-out');
        slide.classList.remove('slide-cover');
    } else if (shouldCover) {
        slide.classList.add('slide-cover');
        slide.classList.remove('slide-pops-out');
    } else {
        slide.classList.remove('slide-pops-out', 'slide-cover');
    }
}

function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });

    const tagSearch = document.querySelector('[data-tag-search]');
    const tagInput = tagSearch?.querySelector('.tag-search-input');
    const dropdown = tagSearch?.querySelector('[data-tag-dropdown]');
    const clearBtn = tagSearch?.querySelector('[data-tag-clear]');
    const selectedWrap = tagSearch?.querySelector('[data-tag-selected]');
    const options = Array.from(tagSearch?.querySelectorAll('.tag-option') || []);

    const selected = new Set();

    function normalizeTags(str) {
        return (str || '').split(/\s+/).map(s => s.trim()).filter(Boolean);
    }

    function applyTagFilter() {
        const activeTags = Array.from(selected);
        projectCards.forEach(card => {
            const tags = normalizeTags(card.dataset.tags);
            const match = activeTags.length === 0 || activeTags.every(tg => tags.includes(tg));
            card.classList.toggle('hidden', !match);
        });
        document.querySelectorAll('.projects-carousel').forEach(c => {
            c.dispatchEvent(new CustomEvent('projects-visible-changed'));
        });
    }

    function getTagLabel(tag) {
        const key = 'filter_' + tag;
        const translated = t(key);
        if (translated !== key) return translated;
        const el = tagSearch?.querySelector(`[data-tag-label="${CSS.escape(tag)}"]`);
        return el?.textContent || tag;
    }

    function renderSelectedChips() {
        if (!selectedWrap) return;
        const tags = Array.from(selected);
        selectedWrap.innerHTML = tags.map(tag => {
            const label = getTagLabel(tag);
            return `
                <button type="button" class="tag-chip" data-tag-chip="${escapeHtml(tag)}" aria-label="${escapeHtml(label)}">
                    <span class="tag-chip-label">${escapeHtml(label)}</span>
                    <span class="tag-chip-x" aria-hidden="true">×</span>
                </button>
            `;
        }).join('');
        selectedWrap.querySelectorAll('[data-tag-chip]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag-chip');
                if (!tag) return;
                selected.delete(tag);
                applyTagFilter();
                renderSelectedChips();
                updateClearBtn();
            });
        });
    }

    function openDropdown() {
        if (!tagSearch || !dropdown) return;
        dropdown.hidden = false;
        tagSearch.querySelector('.tag-search-bar')?.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
        if (!tagSearch || !dropdown) return;
        dropdown.hidden = true;
        tagSearch.querySelector('.tag-search-bar')?.setAttribute('aria-expanded', 'false');
    }

    function updateClearBtn() {
        if (!clearBtn) return;
        clearBtn.hidden = selected.size === 0 && !(tagInput?.value || '').trim();
    }

    function filterDropdownOptions(q) {
        const query = (q || '').trim().toLowerCase();
        let anyVisible = false;
        options.forEach(opt => {
            const tag = opt.dataset.tag || '';
            const labelEl = opt.querySelector('[data-tag-label]');
            const label = (labelEl?.textContent || tag).toLowerCase();
            const isSelected = selected.has(tag);
            const matches = !query || tag.toLowerCase().includes(query) || label.includes(query);
            const show = matches && !isSelected;
            opt.hidden = !show;
            if (show) anyVisible = true;
        });
        const empty = dropdown?.querySelector('.tag-option-empty');
        if (empty) empty.hidden = anyVisible;
    }

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            if (opt.disabled) return;
            const tag = opt.dataset.tag;
            if (!tag) return;
            selected.add(tag);
            applyTagFilter();
            renderSelectedChips();
            filterDropdownOptions(tagInput?.value || '');
            updateClearBtn();
            tagInput?.focus();
            openDropdown();
        });
    });

    tagInput?.addEventListener('focus', () => {
        filterDropdownOptions(tagInput.value);
        openDropdown();
        updateClearBtn();
    });
    tagInput?.addEventListener('input', () => {
        filterDropdownOptions(tagInput.value);
        openDropdown();
        updateClearBtn();
    });
    tagInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
            tagInput.blur();
        }
    });

    clearBtn?.addEventListener('click', () => {
        selected.clear();
        if (tagInput) tagInput.value = '';
        applyTagFilter();
        renderSelectedChips();
        filterDropdownOptions('');
        closeDropdown();
        updateClearBtn();
    });

    document.addEventListener('click', (e) => {
        if (!tagSearch) return;
        if (tagSearch.contains(e.target)) return;
        closeDropdown();
    });

    applyTagFilter();
    renderSelectedChips();
    filterDropdownOptions('');
    updateClearBtn();

    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            if (hasDragged) return;
            if (card.classList.contains('expanded') && e.target.closest('.project-media')) {
                const arrowPrev = e.target.closest('.project-media-arrow-prev');
                const arrowNext = e.target.closest('.project-media-arrow-next');
                const slides = card.querySelectorAll('.project-media-slide');
                const active = card.querySelector('.project-media-slide.active');
                if (slides.length > 1) {
                    active?.querySelector('video')?.pause();
                    active?.classList.remove('active');
                    const next = arrowPrev
                        ? (active?.previousElementSibling || slides[slides.length - 1])
                        : (active?.nextElementSibling || slides[0]);
                    next.classList.add('active');
                    next.querySelector('video')?.play().catch(() => {});
                    updateSlidePopsOut(next);
                    updateMediaArrowsVisibility(card);
                }
                e.stopPropagation();
                if (arrowPrev || arrowNext) e.preventDefault();
                return;
            }
            const wasExpanded = card.classList.contains('expanded');
            projectCards.forEach(c => c.classList.remove('expanded'));
            if (!wasExpanded) {
                card.classList.add('expanded');
                const activeSlide = card.querySelector('.project-media-slide.active');
                if (activeSlide) {
                    updateSlidePopsOut(activeSlide);
                    updateMediaArrowsVisibility(card);
                    activeSlide.querySelector('video')?.play().catch(() => {});
                }
            } else {
                card.querySelector('.project-media-slide.active video')?.pause();
            }
        });
    });

    projectCards.forEach(card => {
        card.querySelectorAll('.project-media-slide').forEach(slide => {
            const img = slide.querySelector('img');
            const video = slide.querySelector('video');
            if (img) {
                img.addEventListener('load', () => updateSlidePopsOut(slide));
                if (img.complete) updateSlidePopsOut(slide);
            }
            if (video) {
                video.addEventListener('loadedmetadata', () => updateSlidePopsOut(slide));
                if (video.readyState >= 1) updateSlidePopsOut(slide);
            }
        });
        const initialActive = card.querySelector('.project-media-slide.active');
        if (initialActive) {
            updateSlidePopsOut(initialActive);
            updateMediaArrowsVisibility(card);
            initialActive.querySelector('video')?.play().catch(() => {});
        }
    });

    projectCards.forEach(card => {
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

let isDragging = false;
let hasDragged = false;
let startX = 0;
let startY = 0;
let scrollLeft = 0;
let activeProjectsRow = null;

function initProjectsRowsScroll() {
    document.querySelectorAll('.projects-row').forEach(projectsRow => {
        const onWheel = (e) => {
            // Allow normal page scroll on vertical wheel.
            // Only "capture" the wheel when user is clearly scrolling horizontally
            // (trackpad deltaX) or uses Shift+wheel (common horizontal scroll gesture).
            const dx = e.deltaX || 0;
            const dy = e.deltaY || 0;
            const wantsHorizontal = Math.abs(dx) > Math.abs(dy) || e.shiftKey;
            if (!wantsHorizontal) return;

            e.preventDefault();
            const delta = dx !== 0 ? dx : dy; // shift+wheel often comes via deltaY
            projectsRow.scrollLeft += delta;
        };

        projectsRow.addEventListener('wheel', onWheel, { passive: false });

        function startDrag(clientX, clientY) {
            isDragging = true;
            hasDragged = false;
            activeProjectsRow = projectsRow;
            startX = clientX;
            startY = clientY;
            scrollLeft = projectsRow.scrollLeft;
            projectsRow.style.cursor = 'grabbing';
        }

        projectsRow.addEventListener('mousedown', (e) => {
            if (e.target.closest('a')) return;
            startDrag(e.pageX, e.pageY);
        });

        projectsRow.addEventListener('touchstart', (e) => {
            if (e.target.closest('a')) return;
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        projectsRow.addEventListener('touchmove', (e) => {
            if (!isDragging || !activeProjectsRow || activeProjectsRow !== projectsRow) return;
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const dx = x - startX;
            const dy = y - startY;

            // If the gesture is primarily vertical, don't block page scroll.
            if (Math.abs(dy) > Math.abs(dx) + 4) {
                endDragScroll();
                return;
            }

            // Horizontal drag: prevent page scroll and move carousel.
            e.preventDefault();
            const walk = dx * 1.2;
            activeProjectsRow.scrollLeft = scrollLeft - walk;
            if (Math.abs(walk) > 5) hasDragged = true;
        }, { passive: false });
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !activeProjectsRow) return;
        e.preventDefault();
        const walk = (e.pageX - startX) * 1.2;
        activeProjectsRow.scrollLeft = scrollLeft - walk;
        if (Math.abs(walk) > 5) hasDragged = true;
    });

    function endDragScroll() {
        if (isDragging && activeProjectsRow) {
            activeProjectsRow.style.cursor = 'grab';
            activeProjectsRow = null;
            isDragging = false;
            setTimeout(() => { hasDragged = false; }, 50);
        }
    }

    document.addEventListener('mouseup', endDragScroll);
    document.addEventListener('touchend', endDragScroll);
    document.addEventListener('touchcancel', endDragScroll);
}

