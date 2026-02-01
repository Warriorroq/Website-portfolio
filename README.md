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

3. **Фото проектов** — в развёрнутой карточке можно кликать по фото для смены. Добавь несколько слайдов в `.project-media-slides`:

```html
<div class="project-media-slides">
    <div class="project-media-slide active">
        <img src="screenshot1.jpg" alt="Screenshot 1">
    </div>
    <div class="project-media-slide">
        <img src="screenshot2.jpg" alt="Screenshot 2">
    </div>
</div>
```

## Файлы

- `index.html` — разметка
- `styles.css` — стили
- `script.js` — навигация, анимации
