# Portfolio — Game Developer & Software Engineer

Сайт-портфолио на чистом HTML, CSS и JavaScript.

## Структура

- **Home** — имя, роль, tech stack, кнопки
- **Projects** — проекты с описанием, tech stack, ссылками
- **Skills** — навыки по категориям
- **Experience** — опыт работы
- **About** — коротко о себе
- **Contact** — email, GitHub, LinkedIn, Itch.io

## Запуск

Открой `index.html` в браузере или используй локальный сервер:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve
```

## Настройка

1. **Обнови ссылки** в `index.html`:
   - GitHub и Itch.io — вставь свои профили
   - Ссылки на проекты (Google Play, Steam, видео)

2. **CV** — `Artur Okseniuk CV.pdf` уже в проекте

3. **Видео/GIF проектов** — замени блоки `.project-placeholder` на `<img>` или `<video>`:

```html
<div class="project-media">
    <img src="path/to/video-preview.gif" alt="Moon Match">
</div>
```

## Файлы

- `index.html` — разметка
- `styles.css` — стили
- `script.js` — навигация, анимации
