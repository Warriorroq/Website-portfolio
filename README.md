A portfolio website.

## Project Structure

```
Proj/
├── index.html          # Main HTML file
├── js/                 # JavaScript files
│   ├── script.js       # Main application logic
│   └── constructor.js  # HTML builders for dynamic content
├── css/                # Stylesheets
│   ├── styles.css      # Main styles
│   └── themes/         # Theme files
├── data/               # JSON data files
│   ├── projects.json
│   ├── experience.json
│   └── skills.json
├── locales/            # Translation files
│   ├── en.json
│   ├── ru.json
│   ├── de.json
│   └── uk.json
├── images/             # Image assets
│   └── bg.png
└── docs/               # Documentation
    └── Artur Okseniuk CV.pdf
```

## Website Structure

- **Home** — name, role, tech stack, action buttons
- **Projects** — projects with descriptions, tech stack, and links
- **Skills** — skills organized by categories
- **Experience** — work experience
- **About** — brief introduction
- **Contact** — email, GitHub, LinkedIn, Itch.io

## Getting Started

Open `index.html` in your browser or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve
```

Then navigate to `http://localhost:8000` (or the port shown by `npx serve`).

