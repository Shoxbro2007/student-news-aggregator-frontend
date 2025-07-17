# news_backend.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests # Import the requests library for making HTTP requests
import os # To potentially get API key from environment variables (good practice)

app = Flask(__name__)
# Enable CORS for all routes, allowing frontend to access this backend
CORS(app)

# --- ВАШ API-КЛЮЧ NEWS API ---
# Замените 'YOUR_NEWS_API_KEY' на ваш реальный API-ключ, полученный с newsapi.org
# Хорошей практикой является хранение ключей в переменных окружения, но для начала
# можно вставить его прямо сюда.
NEWS_API_KEY = 'cb80d44628a242c6a30668812f7d2ffc'
# Или, если вы хотите использовать переменную окружения:
# NEWS_API_KEY = os.getenv('NEWS_API_KEY', 'YOUR_NEWS_API_KEY_IF_NOT_SET_IN_ENV')

# Базовый URL для News API (для поиска по всем статьям)
NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything'

@app.route('/api/news', methods=['GET'])
def get_news():
    # Получаем поисковый запрос из аргументов запроса
    query = request.args.get('query', '')
    print(f"Backend received query: '{query}'") # Для отладки

    if not NEWS_API_KEY or NEWS_API_KEY == 'YOUR_NEWS_API_KEY':
        return jsonify({"error": "News API key is not configured. Please get a key from newsapi.org and update news_backend.py"}), 500

    params = {
        'q': query if query else 'students OR education OR university', # Если запрос пуст, ищем общие новости для студентов
        'language': 'ru', # Ищем новости на русском языке
        'sortBy': 'publishedAt', # Сортируем по дате публикации (самые свежие)
        'pageSize': 20, # Количество статей на страницу
        'apiKey': NEWS_API_KEY
    }

    try:
        # Выполняем HTTP GET запрос к News API
        response = requests.get(NEWS_API_BASE_URL, params=params)
        response.raise_for_status() # Вызывает исключение для ошибок HTTP (4xx или 5xx)
        data = response.json()

        articles = []
        if data.get('status') == 'ok' and data.get('articles'):
            for article in data['articles']:
                # Форматируем статьи в нужный нам вид
                articles.append({
                    "source_title": article.get('source', {}).get('name', 'Неизвестный источник'),
                    "snippet": article.get('description', 'Нет описания.'),
                    "url": article.get('url', '#')
                })
        
        return jsonify(articles)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from News API: {e}")
        return jsonify({"error": f"Failed to fetch news from external API: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

if __name__ == '__main__':
    # Запускаем Flask-приложение
    # В производственной среде используйте более надежный WSGI-сервер, такой как Gunicorn
    app.run(debug=True, port=5000)