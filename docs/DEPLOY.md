# Хостинг SageRead (Render + litlense.com)

Документ фиксирует текущий процесс деплоя и настройки хостинга. Используется для воспроизведения деплоя и понимания инфраструктуры.

---

## Текущий стек хостинга

| Компонент | Сервис | Домен / URL |
|-----------|--------|-------------|
| Фронт (React) | Render **Static Site** | https://litlense.com, https://www.litlense.com |
| Бэкенд (Express) | Render **Web Service** | https://sage-read-api.onrender.com |
| Домен, DNS | Reg.ru, панель **ispmanager** | litlense.com |

Репозиторий: **GitHub** `Oginsky-Alexandr/Litlens`, ветка **master**. Push в master запускает автодеплой обоих сервисов.

---

## Бэкенд (Web Service)

- **Сервис в Render:** sage-read-api (тип Web Service).
- **Репозиторий:** Oginsky-Alexandr/Litlens, ветка **master**.
- **Root Directory:** `sage-read-backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Instance Type:** Free (инстанс засыпает при простое, см. раздел про холодный старт).
- **Environment:**
  - `DEEPSEEK_API_KEY` — ключ API DeepSeek (задаётся в Render, не в репозитории).
- **URL:** https://sage-read-api.onrender.com

Опционально можно привязать **api.litlense.com** через Custom Domains (CNAME в DNS). Для работы приложения это не обязательно.

---

## Фронт (Static Site)

- **Сервис в Render:** sage-read-app (тип Static Site).
- **Репозиторий:** Oginsky-Alexandr/Litlens, ветка **master**.
- **Root Directory:** `sage-read-app`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`
- **Environment:**
  - `REACT_APP_API_URL` — базовый URL API. Сейчас: `https://sage-read-api.onrender.com`. Если привяжешь api.litlense.com к Web Service, можно сменить на `https://api.litlense.com` и сделать Manual Deploy.
- **Custom Domains:** litlense.com, www.litlense.com (редирект www → litlense.com).

---

## Домен litlense.com

- **Регистратор / DNS:** Reg.ru, управление зоной в ispmanager (Управление DNS).
- **Назначение доменов:**
  - **litlense.com**, **www.litlense.com** → Static Site (sage-read-app).
  - **api.litlense.com** (опционально) → Web Service (sage-read-api).

---

## DNS в ispmanager (Reg.ru)

Записи создаются в разделе **Управление DNS** → выбор домена **litlense.com** → **DNS записи** → **Создать запись**.

| Имя (поддомен) | Тип | Значение | Назначение |
|----------------|-----|----------|------------|
| www | CNAME | sage-read-app.onrender.com | www.litlense.com → фронт |
| litlense.com. (корень) | A | 216.24.57.1 | litlense.com → фронт |

Важно:

- Для **корня** используется **A**-запись (CNAME на корень в ispmanager не подходит). IP **216.24.57.1** — из инструкции Render для Custom Domains.
- Если для **www** уже была AAAA-запись — её нужно удалить перед созданием CNAME (одно имя — один тип записи).
- Если для **корня** было две A-записи (старый хостинг и Render) — оставить только A → 216.24.57.1; старую A и при необходимости AAAA для корня удалить, иначе верификация в Render может не пройти.
- В полях «Имя» / «Домен» в ispmanager следовать подсказкам (иногда с точкой в конце, для поддомена www — часто достаточно `www`).

Изменения DNS вступают в силу в течение часа (Reg.ru); распространение по интернету может занять до 24 часов (Render).

---

## SSL

Сертификаты для litlense.com и www.litlense.com выпускает **Render** после успешной верификации доменов (Custom Domains → Verify). Дополнительно настраивать SSL в ispmanager не нужно.

---

## Ограничения Free (холодный старт)

На тарифе **Free** Web Service (sage-read-api) **засыпает** после нескольких минут без запросов. **Первый запрос после простоя** ждёт пробуждения инстанса — задержка **до ~50 секунд и больше** (указано в Render). Дальнейшие запросы в активной сессии обрабатываются без этой задержки.

Пользователь может один раз долго ждать ответ (например, после «Start Analysis»). Для пет-проекта и ограниченной аудитории обычно приемлемо. Варианты: платный инстанс (без засыпания), информирование во фронте («подождите до минуты»), опционально — внешний keep-alive (осторожно с правилами Free tier).

---

## Обновление деплоя

- **Код:** push в **master** → Render автоматически пересобирает и деплоит оба сервиса.
- **Переменные окружения:** изменение в Render → для **Static Site** нужен **Manual Deploy** (или push), чтобы `REACT_APP_API_URL` и другие переменные попали в новую сборку.
- **Домен / DNS:** после смены записей в ispmanager верификацию в Render повторить через Custom Domains → Verify (при необходимости подождать распространения DNS).
