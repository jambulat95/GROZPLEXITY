Мы сделаем Single Page Application. Все будет на одной странице, разделенной на блоки, которые появляются по мере прогресса.
Логика UI:
Hero Section: Большое поле ввода ссылки (Как поиск Google, но киберпанк).
Loading State: Пока анализируем — показываем красивую анимацию (не просто крутилку, а "Декодирование матрицы").
Analysis Grid: Когда готово — показываем карточки: "Темп речи", "Тон", "Визуал" + Графики.
Generator: Внизу появляется поле "О чем снять новое видео?".
Промпт для Cursor (Самый важный):
code
JavaScript
@frontend/src/App.jsx @frontend/src/services/api.js

Создай главный компонент приложения (`App.jsx`).
Используй библиотеку `framer-motion` для анимаций появления.

### Структура UI:

**1. Header**
- Логотип "Grozplexity AI" (цвет text-neon).

**2. Hero Section (Input)**
- Заголовок: "Reverse Engineering Content".
- Большой Input для URL видео.
- Кнопка "Analyze" (Заливка neon, черный текст, hover-эффект).

**3. Status / Loading**
- Если `isLoading` = true: Показывай анимированный текст "Extracting Audio...", "Analyzing Frames...", "Building DNA...".

**4. Results Dashboard (Появляется после анализа)**
- Отобрази карточку автора (Username, Фото/Аватар если есть).
- **Grid Layout (3 колонки):**
  - Card 1: **Stats** (Просмотры, Лайки - используй красивые иконки lucide-react).
  - Card 2: **Voice DNA** (Скорость речи, Тон).
  - Card 3: **Visual DNA** (Стиль монтажа, Цвета).
- Используй стиль `.glass-panel` (темный фон, тонкая зеленая рамка).

**5. Script Generator (Секция "Level 3")**
- Заголовок "Generate New Content".
- Input: "Topic" (О чем видео?).
- Кнопка "Generate Script".
- **Output:** Отобрази сгенерированный сценарий в виде таблицы или списка карточек (Время | Визуал | Звук).
- Сделай кнопку "Copy to Clipboard".

### Логика State:
- Храни состояние `currentProfile` (данные из бэка).
- Если анализ прошел успешно, обновляй UI.

Стиль должен быть строгим, "хакерским", но удобным. Шрифты sans-serif.