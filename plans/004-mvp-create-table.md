Мы решили отказаться от файлового хранения и использовать **SQLite** с библиотекой **SQLModel**.
Это необходимо для надежного хранения истории авторов и их видео.

### 1. Настройка БД
- Добавь `sqlmodel` в `requirements.txt`.
- Создай файл `app/core/db.py`:
  - Настройка `create_engine` ('sqlite:///database.db').
  - Функция `get_session` для Dependency Injection в FastAPI.

### 2. Модели данных (Schema)
Создай файл `app/models.py`. Нам нужны две таблицы:

**A. UserProfile (Author)**
- `id`: int (primary key)
- `username`: str (unique, index=True)
- `master_profile`: dict (JSON) — здесь хранится "Синтезированное ДНК стиля" (по умолчанию null или пустой dict).
- `last_updated`: datetime

**B. VideoAnalysis**
- `id`: int (primary key)
- `user_id`: int (Foreign Key к UserProfile)
- `youtube_url`: str
- `title`: str
- `stats`: dict (JSON) — просмотры, лайки.
- `analysis_result`: dict (JSON) — результат работы Gemini (Hook, Structure и т.д.).
- `created_at`: datetime

*Важно:* Для полей типа `dict` (JSON) в SQLModel используй `sa_column=Column(JSON)` (нужно импортировать `JSON` из `sqlalchemy` и `Column` из `sqlmodel`).

### 3. Refactoring Services (Бизнес-логика)

**Обнови `services/analyzer.py`:**
- Функция больше не пишет в файлы. Она принимает `Session` базы данных.
- Логика:
  1. Получаем результат от Gemini и yt-dlp.
  2. Ищем автора в БД по `username`. Если нет — создаем.
  3. Сохраняем видео в таблицу `VideoAnalysis`, привязав к автору.
  4. (Триггер) После сохранения вызываем `services/profile_builder.py` для обновления `master_profile` автора.

**Обнови `services/profile_builder.py`:**
- Принимает `user_id` и `Session`.
- Делает `select` всех видео этого автора из БД.
- Отправляет их данные в Gemini для синтеза.
- Обновляет поле `master_profile` в таблице `UserProfile`.

**Обнови `services/generator.py`:**
- Принимает `username`.
- Делает запрос в БД, достает `master_profile`.
- Генерирует сценарий.

### 4. API Routes
- Обнови все эндпоинты, чтобы они использовали `Depends(get_session)`.
- Эндпоинт `GET /profile/{username}` теперь делает простой SQL-запрос и возвращает объект автора со списком его видео.

Реализуй миграцию на SQLite. Код должен быть асинхронным где возможно, но SQLModel (пока) лучше использовать в синхронном режиме или с `AsyncEngine` (на твое усмотрение, главное стабильность). Рекомендую стандартный синхронный Engine для SQLite, так проще для хакатона.