// Translations
const LANG_KEY = 'site-lang';
const TRANSLATIONS = {
    ru: {
        nav_home: 'Главная',
        nav_projects: 'Проекты',
        nav_skills: 'Навыки',
        nav_experience: 'Опыт',
        nav_about: 'Обо мне',
        nav_contact: 'Контакты',
        nav_menu: 'Меню',
        nav_settings: 'Настройки',
        settings_title: 'Настройки',
        settings_close: 'Закрыть',
        settings_lang: 'Язык',
        settings_theme: 'Тема',
        theme_dark: 'Тёмная',
        theme_light: 'Светлая',
        hero_greeting: 'Привет, я',
        hero_role: 'Unity Developer / Software Engineer',
        hero_tagline: '3+ года в мобильных и live-service играх. Gameplay systems, оптимизация, AWS backend.',
        hero_scroll: 'Прокрутка',
        section_projects: 'Проекты',
        section_skills: 'Навыки',
        section_experience: 'Опыт',
        section_about: 'Обо мне',
        section_contact: 'Контакты',
        projects_subtitle: 'Что я делал и чем могу быть полезен',
        skills_subtitle: 'Tech stack без лишнего',
        experience_subtitle: 'Где работал и что делал',
        about_p1: 'Unity Developer с 3+ годами опыта в мобильных и live-service играх. Shipped несколько Unity mobile titles, работал с backend-driven features на AWS.',
        about_p2: 'Фокус на gameplay systems, performance optimization и user experience. Образование: Computer Science (Step Academy, Kiev) и Software Engineering (University of Europe, Potsdam).',
        about_p3: 'Увлечения: game dev, настолки (D&D, Battle mages), шахматы, литература.',
        contact_subtitle: 'Свяжись со мной',
        contact_cv: 'Скачать CV',
        footer: '© 2025. Привет!',
        filter_all: 'Все',
        filter_mobile: 'Мобильные',
        filter_pc: 'PC',
        filter_unity: 'Unity',
        filter_csharp: 'C#',
        filter_aws: 'AWS',
        filter_liveops: 'LiveOps',
        filter_steam: 'Steam',
        skills_show_all: 'Показать все навыки',
        skills_hide: 'Скрыть навыки',
        projects_error: 'Не удалось загрузить проекты.',
        experience_error: 'Не удалось загрузить опыт.',
        skills_error: 'Не удалось загрузить навыки.'
    },
    en: {
        nav_home: 'Home',
        nav_projects: 'Projects',
        nav_skills: 'Skills',
        nav_experience: 'Experience',
        nav_about: 'About',
        nav_contact: 'Contact',
        nav_menu: 'Menu',
        nav_settings: 'Settings',
        settings_title: 'Settings',
        settings_close: 'Close',
        settings_lang: 'Language',
        settings_theme: 'Theme',
        theme_dark: 'Dark',
        theme_light: 'Light',
        hero_greeting: 'Hi, I\'m',
        hero_role: 'Unity Developer / Software Engineer',
        hero_tagline: '3+ years in mobile & live-service games. Gameplay systems, performance optimization, AWS backend.',
        hero_scroll: 'Scroll',
        section_projects: 'Projects',
        section_skills: 'Skills',
        section_experience: 'Experience',
        section_about: 'About',
        section_contact: 'Contact',
        projects_subtitle: 'What I\'ve done and how I can help',
        skills_subtitle: 'Tech stack, no fluff',
        experience_subtitle: 'Where I worked and what I did',
        about_p1: 'Unity Developer with 3+ years in mobile and live-service games. Shipped several Unity mobile titles, worked with backend-driven features on AWS.',
        about_p2: 'Focus on gameplay systems, performance optimization and user experience. Education: Computer Science (Step Academy, Kiev) and Software Engineering (University of Europe, Potsdam).',
        about_p3: 'Hobbies: game dev, board games (D&D, Battle mages), chess, literature.',
        contact_subtitle: 'Get in touch',
        contact_cv: 'Download CV',
        footer: '© 2025. Hello!',
        filter_all: 'All',
        filter_mobile: 'Mobile',
        filter_pc: 'PC',
        filter_unity: 'Unity',
        filter_csharp: 'C#',
        filter_aws: 'AWS',
        filter_liveops: 'LiveOps',
        filter_steam: 'Steam',
        skills_show_all: 'Show all skills',
        skills_hide: 'Hide skills',
        projects_error: 'Failed to load projects.',
        experience_error: 'Failed to load experience.',
        skills_error: 'Failed to load skills.'
    }
};

function getSavedLang() {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'en' || saved === 'ru' ? saved : 'en';
}

let currentLang = getSavedLang();

function t(key) {
    return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
}

function setLang(lang) {
    if (lang !== 'ru' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.title = lang === 'ru' ? 'Artur Okseniuk | Unity Developer & Software Engineer' : 'Artur Okseniuk | Unity Developer & Software Engineer';
    applyTranslations();
    updateLangButtons(lang);
    updateSkillsToggle();
    updateFilterLabels();
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (val && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
            el.textContent = val;
        }
    });
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

function updateFilterLabels() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const tag = btn.dataset.tag;
        if (tag) btn.textContent = t('filter_' + tag) || btn.textContent;
    });
}

// Theme switcher
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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel?.classList.contains('is-open')) {
            closeSettingsPanel();
        }
    });
}

initTheme();

function initLanguage() {
    document.documentElement.lang = currentLang;
    setLang(currentLang);

    document.querySelectorAll('.settings-lang-btn[data-lang]').forEach(btn => {
        btn.addEventListener('click', () => {
            setLang(btn.dataset.lang);
        });
    });
}

initLanguage();

// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            closeSettingsPanel();
        });
    });
}

// Navbar background on scroll
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

// Smooth scroll for anchor links (fallback for older browsers)
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

// Intersection Observer for scroll animations (optional)
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

// Add visible class styles via JS
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

// Load projects, experience and skills from JSON
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
        const filters = projectsData.filters || [];
        const experience = experienceData.experience || [];
        const skills = skillsData.skills || [];

        // Render filters
        const filtersContainer = document.querySelector('.project-filters');
        if (filtersContainer) {
            filtersContainer.innerHTML = buildFilters(filters);
            updateFilterLabels();
        }

        // Render projects
        if (projectsRow) {
            projectsRow.innerHTML = buildProjects(projects);
            initProjectCards();
        }

        // Render skills
        if (skillsGrid) {
            skillsGrid.innerHTML = buildSkills(skills);
            initSkillsItems();
            const totalItems = skills.reduce((n, cat) => n + (cat.items?.length || 0), 0);
            if (totalItems >= 10) {
                initSkillsCollapse(skillsGrid);
            }
            updateSkillsToggle();
        }

        // Render experience
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

function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');

    // Observe project cards for scroll animation
    projectCards.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });

    // Project filter by tags
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

    // Project expand on click
    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            if (hasDragged) return;
            if (card.classList.contains('expanded') && e.target.closest('.project-media')) {
                const slides = card.querySelectorAll('.project-media-slide');
                const active = card.querySelector('.project-media-slide.active');
                if (slides.length > 1) {
                    active?.classList.remove('active');
                    const next = active?.nextElementSibling || slides[0];
                    next.classList.add('active');
                }
                e.stopPropagation();
                return;
            }
            const wasExpanded = card.classList.contains('expanded');
            projectCards.forEach(c => c.classList.remove('expanded'));
            if (!wasExpanded) card.classList.add('expanded');
        });
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

loadData();

// Projects row drag-to-scroll
const projectsRow = document.querySelector('.projects-row');
let isDragging = false;
let hasDragged = false;
let startX = 0;
let scrollLeft = 0;

if (projectsRow) {
    projectsRow.addEventListener('mousedown', (e) => {
        if (e.target.closest('a')) return;
        isDragging = true;
        hasDragged = false;
        startX = e.pageX;
        scrollLeft = projectsRow.scrollLeft;
        projectsRow.style.cursor = 'grabbing';
        projectsRow.style.userSelect = 'none';
    });

    projectsRow.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const walk = (e.pageX - startX) * 1.2;
        projectsRow.scrollLeft = scrollLeft - walk;
        if (Math.abs(walk) > 5) hasDragged = true;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging && projectsRow) {
            isDragging = false;
            projectsRow.style.cursor = 'grab';
            projectsRow.style.userSelect = '';
            setTimeout(() => { hasDragged = false; }, 50);
        }
    });
}

