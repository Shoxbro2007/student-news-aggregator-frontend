 import os
import requests
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import time

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# New GNews API key from the screenshot
NEWS_API_KEY = os.environ.get('NEWS_API_KEY', 'b5a28610eee2bc54ecd939f832d6bb9f')
# Replace with your actual Gemini API key (or leave empty if using Canvas default)
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyCkXhzHaPgkTRsiNkNbqTvEMMEve0P7LXM')

# Base URL for GNews API
NEWS_API_BASE_URL = "https://gnews.io/api/v4"
# Base URL for Gemini API
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


# Cache file path (убедитесь, что этот путь существует и доступен для записи)
CACHE_FILE = '/home/Shoxbro2007/my_news_app/news_cache.json'
CACHE_EXPIRATION_SECONDS = 3600 # 1 час (3600 секунд)

def load_cache():
    """Загружает кэш новостей из JSON файла."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Ошибка декодирования кэша новостей, начинаем с пустого кэша.")
            return {}
    return {}

def save_cache(cache_data):
    """Сохраняет кэш новостей в JSON файл."""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=4)
    except IOError as e:
        print(f"Ошибка сохранения кэша новостей: {e}")

# Загружаем кэш при запуске приложения
news_cache = load_cache()

@app.route('/')
def home():
    return "Welcome to the Student News Aggregator Backend!"

@app.route('/api/news')
def get_news():
    query = request.args.get('query', '')
    category = request.args.get('category', '')
    author = request.args.get('author', '') # Автор будет фильтроваться вручную
    language = request.args.get('language', 'ru') # Язык по умолчанию - русский
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 9, type=int) # Размер страницы по умолчанию
    from_date_str = request.args.get('from_date') # Формат ISO 8601
    to_date_str = request.args.get('to_date')   # Формат ISO 8601
    sources_filter_ids = request.args.get('sources', '').split(',') # ID источников для ручной фильтрации

    # Генерируем уникальный ключ кэша на основе релевантных параметров
    cache_key_params = {
        'lang': language,
        'page': page,
        'pageSize': page_size,
    }
    if query:
        # Обрезаем запрос до 200 символов, как требует GNews API
        cache_key_params['q'] = query[:200]
    if category:
        cache_key_params['category'] = category
    if from_date_str:
        cache_key_params['from'] = from_date_str
    if to_date_str:
        cache_key_params['to'] = to_date_str

    # Сортируем ключи для консистентной генерации ключа кэша
    sorted_cache_key_params = sorted(cache_key_params.items())
    cache_key = json.dumps(sorted_cache_key_params)

    # Сначала проверяем кэш
    if cache_key in news_cache:
        cached_data = news_cache[cache_key]
        if time.time() - cached_data['timestamp'] < CACHE_EXPIRATION_SECONDS:
            print(f"Обслуживаем из кэша для ключа: {cache_key}")
            # Применяем фильтр по автору и источникам к кэшированным данным, если они есть
            articles = cached_data['data']['articles']
            total_results = cached_data['data']['totalResults']

            if author:
                articles = [
                    article for article in articles
                    if article.get('author') and author.lower() in article['author'].lower()
                ]
            if sources_filter_ids and sources_filter_ids[0]: # Проверяем, что sources_filter_ids не пуст или не ['']
                articles = [
                    article for article in articles
                    if article.get('source_id') in sources_filter_ids
                ]
            return jsonify({
                'articles': articles,
                'totalResults': total_results # Общее количество результатов из оригинального API-вызова
            })

    # Если нет в кэше или кэш устарел, получаем данные из GNews API
    gnews_params = {
        'apikey': NEWS_API_KEY,
        'lang': language,
        'max': page_size, # GNews использует 'max' вместо 'pageSize'
    }

    endpoint = '/top-headlines' # Эндпоинт по умолчанию для GNews

    if query:
        endpoint = '/search'
        gnews_params['q'] = query[:200] # Обрезаем запрос до 200 символов
        # Эндпоинт поиска GNews также поддерживает 'from' и 'to'
        if from_date_str:
            gnews_params['from'] = from_date_str
        if to_date_str:
            gnews_params['to'] = to_date_str
        # Удаляем категорию для эндпоинта поиска
        gnews_params.pop('category', None)
    elif category:
        endpoint = '/top-headlines'
        gnews_params['category'] = category
        # Удаляем поисковый запрос и даты для top-headlines
        gnews_params.pop('q', None)
        gnews_params.pop('from', None)
        gnews_params.pop('to', None)

    # GNews не поддерживает прямую фильтрацию 'sources' в /top-headlines или /search
    # и не имеет прямого параметра 'author' для фильтрации.
    # Мы будем получать данные, а затем вручную фильтровать, если эти параметры предоставлены.

    try:
        gnews_url = f"{NEWS_API_BASE_URL}{endpoint}"
        print(f"Получаем данные из GNews API: {gnews_url} с параметрами: {gnews_params}")
        gnews_response = requests.get(gnews_url, params=gnews_params)
        gnews_response.raise_for_status() # Вызываем HTTPError для плохих ответов (4xx или 5xx)
        gnews_data = gnews_response.json()

        articles = gnews_data.get('articles', [])

        # Ручная фильтрация по автору, если предоставлен
        if author:
            articles = [
                article for article in articles
                if article.get('source', {}).get('name') and author.lower() in article['source']['name'].lower()
                # GNews статьи имеют объект 'source' с 'name' (автор обычно является частью контента/описания)
                # Это попытка фильтрации по автору на основе имени источника, а не фактического автора.
                # Если требуется более точная фильтрация по автору, это потребует парсинга содержимого статьи.
            ]

        # Ручная фильтрация по источникам, если предоставлены (GNews API не имеет прямой фильтрации источников для статей)
        if sources_filter_ids and sources_filter_ids[0]: # Проверяем, что sources_filter_ids не пуст или не ['']
            # В GNews источнике статьи есть 'name' и 'url', но нет 'id' в самом объекте статьи.
            # Мы должны сопоставить имена источников с ID, которые мы получаем из /api/sources, если хотим фильтровать по ID.
            # Для простоты, давайте считать, что source_id на фронтенде - это source_name для GNews.
            # Это потенциальная точка несоответствия, если source_id действительно является уникальным ID.
            # Для GNews 'id' из /sources часто является именем источника в нижнем регистре, через дефис.
            # Давайте использовать source_name для фильтрации.
            articles = [
                article for article in articles
                if article.get('source', {}).get('name') and article['source']['name'].lower().replace(' ', '-') in [s.lower() for s in sources_filter_ids]
            ]


        formatted_articles = [
            {
                # Структура статьи GNews: 'source': {'name': '...', 'url': '...'}, 'title', 'description', 'url', 'image', 'publishedAt', 'content'
                'source_id': article.get('source', {}).get('name').lower().replace(' ', '-') if article.get('source', {}).get('name') else None, # Используем имя источника как ID для GNews
                'source_title': article.get('source', {}).get('name'),
                'author': article.get('source', {}).get('name'), # GNews не предоставляет явного автора, используем имя источника как запасной вариант
                'title': article.get('title'),
                'snippet': article.get('description'),
                'url': article.get('url'),
                'image_url': article.get('image'), # GNews использует 'image' вместо 'urlToImage'
                'published_at': article.get('publishedAt')
            }
            for article in articles if article.get('title') and article.get('url')
        ]

        # GNews API возвращает 'totalArticles' для /search и не имеет прямого общего количества для /top-headlines
        # Мы будем использовать длину списка статей для top-headlines, или totalArticles, если доступно.
        total_results = gnews_data.get('totalArticles', len(formatted_articles))

        response_data = {
            'articles': formatted_articles,
            'totalResults': total_results
        }

        # Сохраняем в кэш
        news_cache[cache_key] = {
            'timestamp': time.time(),
            'data': response_data
        }
        save_cache(news_cache)
        print(f"Сохранено в кэш для ключа: {cache_key}")

        return jsonify(response_data)

    except requests.exceptions.RequestException as e:
        print(f"Ошибка получения новостей из GNews API: {e}")
        if hasattr(gnews_response, 'status_code'):
            print(f"Статус ответа GNews API: {gnews_response.status_code}, текст: {gnews_response.text}")
            if gnews_response.status_code == 429: # Слишком много запросов
                # Пытаемся отдать из старого кэша, если достигнут лимит API
                if cache_key in news_cache:
                    print("Достигнут лимит запросов GNews API, обслуживаем из старого кэша.")
                    return jsonify(news_cache[cache_key]['data'])
                return jsonify({'error': 'Достигнут лимит запросов GNews API. Пожалуйста, попробуйте позже.'}), 429
            elif gnews_response.status_code == 403: # Запрещено (например, недействительный или заблокированный API-ключ)
                return jsonify({'error': 'Недействительный или заблокированный API-ключ GNews. Пожалуйста, проверьте свой ключ.'}), 403
            elif gnews_response.status_code == 400: # Неверный запрос (например, недействительные параметры)
                return jsonify({'error': f'Неверный запрос GNews API: {gnews_response.text}'}), 400

        # Если нет конкретного статуса или другая сетевая ошибка
        # Пытаемся отдать из старого кэша, если произошла какая-либо сетевая ошибка
        if cache_key in news_cache:
            print("Сетевая ошибка, обслуживаем из старого кэша.")
            return jsonify(news_cache[cache_key]['data'])
        return jsonify({'error': f'Не удалось получить новости из GNews: {e}'}), 500
    except Exception as e:
        print(f"Произошла непредвиденная ошибка: {e}")
        # Пытаемся отдать из старого кэша для непредвиденных ошибок
        if cache_key in news_cache:
            print("Непредвиденная ошибка, обслуживаем из старого кэша.")
            return jsonify(news_cache[cache_key]['data'])
        return jsonify({'error': f'Произошла непредвиденная ошибка: {e}'}), 500

@app.route('/api/sources')
def get_sources():
    # GNews API не предоставляет эндпоинта /sources.
    # Возвращаем жестко закодированный список популярных источников.
    # ID должны соответствовать формату: source_name.lower().replace(' ', '-')
    sources_list = [
        {'id': 'lenta.ru', 'name': 'Lenta.ru', 'description': 'Российское интернет-издание' },
        {'id': 'rt', 'name': 'RT', 'description': 'Российский международный новостной телеканал' },
        {'id': 'ria-novosti', 'name': 'РИА Новости', 'description': 'Российское информационное агентство' },
        {'id': 'bbc-news', 'name': 'BBC News', 'description': 'British Broadcasting Corporation' },
        {'id': 'cnn', 'name': 'CNN', 'description': 'Cable News Network' },
        {'id': 'the-new-york-times', 'name': 'The New York Times', 'description': 'American daily newspaper' },
        {'id': 'the-guardian', 'name': 'The Guardian', 'description': 'British daily newspaper' },
        {'id': 'reuters', 'name': 'Reuters', 'description': 'International news agency' },
        {'id': 'kommersant', 'name': 'Коммерсантъ', 'description': 'Российская ежедневная газета' },
        {'id': 'izvestia', 'name': 'Известия', 'description': 'Российская общественно-политическая газета' },
        {'id': 'gazeta.ru', 'name': 'Газета.Ru', 'description': 'Российское интернет-издание' },
        {'id': 'rbc', 'name': 'РБК', 'description': 'Российский медиахолдинг' },
        {'id': 'vesti.ru', 'name': 'Вести.Ru', 'description': 'Российский новостной портал' },
        {'id': 'tass', 'name': 'ТАСС', 'description': 'Российское государственное информационное агентство' },
        {'id': 'interfax', 'name': 'Интерфакс', 'description': 'Российское информационное агентство' },
        {'id': 'washington-post', 'name': 'The Washington Post', 'description': 'American daily newspaper' },
        {'id': 'bloomberg', 'name': 'Bloomberg', 'description': 'Financial news and data' },
        {'id': 'forbes', 'name': 'Forbes', 'description': 'Business magazine' },
        {'id': 'techcrunch', 'name': 'TechCrunch', 'description': 'Technology news' },
        {'id': 'engadget', 'name': 'Engadget', 'description': 'Technology news and reviews' },
        {'id': 'the-verge', 'name': 'The Verge', 'description': 'Technology news' },
        {'id': 'wired', 'name': 'Wired', 'description': 'Technology and culture magazine' },
        {'id': 'national-geographic', 'name': 'National Geographic', 'description': 'Science, exploration, and culture' },
        {'id': 'science-alert', 'name': 'ScienceAlert', 'description': 'Science news' },
        {'id': 'espn', 'name': 'ESPN', 'description': 'Sports news' },
        {'id': 'bleacher-report', 'name': 'Bleacher Report', 'description': 'Sports news and analysis' },
    ]
    return jsonify(sources_list)

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    if not GEMINI_API_KEY:
        print("Error: Gemini API key is not configured.")
        return jsonify({'error': 'Gemini API key is not configured on the backend.'}), 500

    data = request.get_json()
    article_text = data.get('article_text')

    if not article_text:
        return jsonify({'error': 'No article_text provided for summarization.'}), 400

    try:
        chat_history = []
        prompt = f"Summarize the following text for a student audience, focusing on key takeaways and relevance. Keep the summary concise, ideally 3-5 sentences:\n\n{article_text}"
        chat_history.append({ "role": "user", "parts": [{ "text": prompt }] })

        payload = {
            "contents": chat_history
        }

        headers = {
            'Content-Type': 'application/json'
        }

        gemini_response = requests.post(
            f"{GEMINI_API_BASE_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=payload
        )
        gemini_response.raise_for_status()

        gemini_result = gemini_response.json()

        if gemini_result.get('candidates') and gemini_result['candidates'][0].get('content') and gemini_result['candidates'][0]['content'].get('parts'):
            summary = gemini_result['candidates'][0]['content']['parts'][0]['text']
            return jsonify({'summary': summary})
        else:
            print(f"Gemini API returned unexpected structure: {gemini_result}")
            return jsonify({'error': 'Failed to get summary from Gemini API. Unexpected response structure.'}), 500

    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        if hasattr(gemini_response, 'status_code') and gemini_response.status_code == 400:
            print(f"Gemini API 400 error response: {gemini_response.text}")
            return jsonify({'error': f'Gemini API error (400): {gemini_response.text}'}), 400
        elif hasattr(gemini_response, 'status_code') and gemini_response.status_code == 429:
            return jsonify({'error': 'Gemini API rate limit exceeded. Please try again later.'}), 429
        return jsonify({'error': f'Failed to summarize text with AI (network/API issue): {e}'}), 500
    except Exception as e:
        print(f"An unexpected error occurred during summarization: {e}")
        return jsonify({'error': f'An unexpected error occurred during summarization: {e}'}), 500

@app.route('/sitemap.xml')
def sitemap():
    """
    Генерирует базовый sitemap.xml для поисковых систем.
    Поскольку GNews API не предоставляет полного списка всех статей,
    этот sitemap будет включать только основные страницы и категории.
    Для полноценного sitemap с динамическими статьями потребуется база данных.
    """
    base_url = "https://studnews.ru" # Убедитесь, что это ваш домен

    # Список URL, которые вы хотите включить в sitemap
    urls = [
        {'loc': f"{base_url}/", 'lastmod': datetime.now().isoformat(), 'changefreq': 'daily', 'priority': '1.0'},
        # Добавьте URL для каждой категории
        {'loc': f"{base_url}/?category=technology", 'lastmod': datetime.now().isoformat(), 'changefreq': 'weekly', 'priority': '0.7'},
        {'loc': f"{base_url}/?category=science", 'lastmod': datetime.now().isoformat(), 'changefreq': 'weekly', 'priority': '0.7'},
        {'loc': f"{base_url}/?category=sports", 'lastmod': datetime.now().isoformat(), 'changefreq': 'weekly', 'priority': '0.7'},
        {'loc': f"{base_url}/?category=health", 'lastmod': datetime.now().isoformat(), 'changefreq': 'weekly', 'priority': '0.7'},
        {'loc': f"{base_url}/?category=business", 'lastmod': datetime.now().isoformat(), 'changefreq': 'weekly', 'priority': '0.7'},
        {'loc': f"{base_url}/?category=entertainment", 'lastmod': datetime.now().isoformat(), 'changefreq': 'weekly', 'priority': '0.7'},
        # Добавьте другие важные статичные страницы, если они есть (например, /about, /contact)
        # {'loc': f"{base_url}/about", 'lastmod': datetime.now().isoformat(), 'changefreq': 'monthly', 'priority': '0.5'},
    ]

    # Для более полного sitemap, если у вас есть база данных статей,
    # вы могли бы получить их оттуда и добавить в список urls.
    # Пример (закомментировано, так как у вас нет базы данных статей):
    # for article in get_all_articles_from_database():
    #     urls.append({
    #         'loc': article['url'],
    #         'lastmod': article['updated_at'], # или published_at
    #         'changefreq': 'weekly',
    #         'priority': '0.8'
    #     })

    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    for url_data in urls:
        xml_content += f'  <url>\n'
        xml_content += f'    <loc>{url_data["loc"]}</loc>\n'
        xml_content += f'    <lastmod>{url_data["lastmod"]}</lastmod>\n'
        xml_content += f'    <changefreq>{url_data["changefreq"]}</changefreq>\n'
        xml_content += f'    <priority>{url_data["priority"]}</priority>\n'
        xml_content += f'  </url>\n'
    xml_content += '</urlset>'

    response = make_response(xml_content)
    response.headers["Content-Type"] = "application/xml"
    return response