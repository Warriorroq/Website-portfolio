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
        }

        // Render experience
        if (experienceList) {
            experienceList.innerHTML = buildExperience(experience);
            initExperienceItems();
        }
    } catch (err) {
        console.error('Failed to load data:', err);
        if (projectsRow) projectsRow.innerHTML = '<p class="projects-error">Не удалось загрузить проекты.</p>';
        if (experienceList) experienceList.innerHTML = '<p class="experience-error">Не удалось загрузить опыт.</p>';
        if (skillsGrid) skillsGrid.innerHTML = '<p class="skills-error">Не удалось загрузить навыки.</p>';
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
    const toggle = document.createElement('button');
    toggle.className = 'skills-toggle';
    toggle.type = 'button';
    toggle.textContent = 'Show all skills';
    toggle.setAttribute('aria-expanded', 'false');
    container.insertBefore(toggle, skillsGrid);

    const wrapper = document.createElement('div');
    wrapper.className = 'skills-grid-wrapper collapsed';
    container.insertBefore(wrapper, skillsGrid);
    wrapper.appendChild(skillsGrid);

    toggle.addEventListener('click', () => {
        const isCollapsed = wrapper.classList.toggle('collapsed');
        toggle.textContent = isCollapsed ? 'Show all skills' : 'Hide skills';
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

