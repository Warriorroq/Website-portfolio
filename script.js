const LANG_KEY = 'site-lang';
const SUPPORTED_LANGS = ['en', 'ru', 'de', 'uk'];
let translations = {};
let currentLang = 'en';

function getSavedLang() {
    const saved = localStorage.getItem(LANG_KEY);
    return SUPPORTED_LANGS.includes(saved) ? saved : 'en';
}

async function loadLocale(lang) {
    const path = `locales/${lang}.json`;
    const res = await fetch(path);
    if (!res.ok) {
        if (lang !== 'en') return loadLocale('en');
        translations = {};
        return;
    }
    translations = await res.json();
    return translations;
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
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const tag = btn.dataset.tag;
        if (!tag) return;
        const key = 'filter_' + tag;
        const translated = t(key);
        if (translated !== key) btn.textContent = translated;
    });
    document.querySelectorAll('.filter-more-btn').forEach(btn => {
        const extra = document.querySelector('.project-filters-extra');
        btn.textContent = extra && extra.classList.contains('is-open') ? t('filter_less') : t('filter_more');
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

function initPetProjectsToggle() {
    const btn = document.querySelector('.projects-pet-btn');
    const extra = document.getElementById('projects-pet-extra');
    if (!btn || !extra) return;
    btn.addEventListener('click', () => {
        extra.classList.toggle('is-open');
        updatePetProjectsBtn();
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
        const [projectsRes, experienceRes, skillsRes] = await Promise.all([
            fetch('projects.json'),
            fetch('experience.json'),
            fetch('skills.json')
        ]);
        const projectsData = await projectsRes.json();
        const experienceData = await experienceRes.json();
        const skillsData = await skillsRes.json();
        const projects = projectsData.projects || [];
        const petProjects = projectsData.petProjects || [];
        const filters = projectsData.filters || [];
        const experience = experienceData.experience || [];
        const skills = skillsData.skills || [];

        const filtersContainer = document.querySelector('.project-filters');
        if (filtersContainer) {
            filtersContainer.innerHTML = buildFilters(filters);
            initFilterMore();
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
            initPetProjectsToggle();
        }

        initProjectCards();
        initProjectsRowsScroll();

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

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            projectCards.forEach(card => {
                const tags = card.dataset.tags || '';
                const match = tag === 'all' || tags.split(' ').includes(tag);
                card.classList.toggle('hidden', !match);
            });
        });
    });

    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            if (hasDragged) return;
            if (card.classList.contains('expanded') && e.target.closest('.project-media')) {
                const slides = card.querySelectorAll('.project-media-slide');
                const active = card.querySelector('.project-media-slide.active');
                if (slides.length > 1) {
                    active?.querySelector('video')?.pause();
                    active?.classList.remove('active');
                    const next = active?.nextElementSibling || slides[0];
                    next.classList.add('active');
                    next.querySelector('video')?.play().catch(() => {});
                    updateSlidePopsOut(next);
                }
                e.stopPropagation();
                return;
            }
            const wasExpanded = card.classList.contains('expanded');
            projectCards.forEach(c => c.classList.remove('expanded'));
            if (!wasExpanded) {
                card.classList.add('expanded');
                const activeSlide = card.querySelector('.project-media-slide.active');
                if (activeSlide) {
                    updateSlidePopsOut(activeSlide);
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
let scrollLeft = 0;
let activeProjectsRow = null;

function initProjectsRowsScroll() {
    document.querySelectorAll('.projects-row').forEach(projectsRow => {
        projectsRow.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                projectsRow.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        projectsRow.addEventListener('mousedown', (e) => {
            if (e.target.closest('a')) return;
            isDragging = true;
            hasDragged = false;
            activeProjectsRow = projectsRow;
            startX = e.pageX;
            scrollLeft = projectsRow.scrollLeft;
            projectsRow.style.cursor = 'grabbing';
            projectsRow.style.userSelect = 'none';
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !activeProjectsRow) return;
        e.preventDefault();
        const walk = (e.pageX - startX) * 1.2;
        activeProjectsRow.scrollLeft = scrollLeft - walk;
        if (Math.abs(walk) > 5) hasDragged = true;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging && activeProjectsRow) {
            activeProjectsRow.style.cursor = 'grab';
            activeProjectsRow.style.userSelect = '';
            activeProjectsRow = null;
            isDragging = false;
            setTimeout(() => { hasDragged = false; }, 50);
        }
    });
}

