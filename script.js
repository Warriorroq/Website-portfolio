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

// Observe experience and skills (static content)
document.querySelectorAll('.experience-item, .skills-category').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});

// Load projects from JSON and render
async function loadProjects() {
    const projectsRow = document.querySelector('.projects-row');
    if (!projectsRow) return;

    try {
        const res = await fetch('projects.json');
        const data = await res.json();
        const projects = data.projects || [];

        projectsRow.innerHTML = projects.map(p => {
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

        initProjectCards();
    } catch (err) {
        console.error('Failed to load projects:', err);
        projectsRow.innerHTML = '<p class="projects-error">Не удалось загрузить проекты.</p>';
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

loadProjects();

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

