# news_backend.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# Ваш API-ключ News API
NEWS_API_KEY = 'cb80d44628a242c6a30668812f7d2ffc'

NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything'
NEWS_API_TOP_HEADLINES_URL = 'https://newsapi.org/v2/top-headlines'

@app.route('/api/news', methods=['GET'])
def get_news():
    query = request.args.get('query', '')
    category = request.args.get('category', '').lower()
    # Добавляем новый параметр 'page'
    page = request.args.get('page', 1) # По умолчанию страница 1
    
    print(f"Backend received query: '{query}', category: '{category}', page: {page}")

    if not NEWS_API_KEY:
        return jsonify({"error": "News API key is not configured in the code."}), 500

    articles = []
    
    # Определяем, какой эндпоинт News API использовать
    if category and not query:
        url = NEWS_API_TOP_HEADLINES_URL
        params = {
            'category': category,
            'language': 'ru',
            'pageSize': 20,
            'page': page, # Передаем номер страницы
            'apiKey': NEWS_API_KEY
        }
        supported_categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology']
        if category not in supported_categories:
            return jsonify({"error": f"Category '{category}' is not supported by News API or is not a valid category for top-headlines. Supported categories: {', '.join(supported_categories)}"}), 400

    else:
        url = NEWS_API_BASE_URL
        params = {
            'q': query if query else 'students OR education OR university',
            'language': 'ru',
            'sortBy': 'publishedAt',
            'pageSize': 20,
            'page': page, # Передаем номер страницы
            'apiKey': NEWS_API_KEY
        }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if data.get('status') == 'ok' and data.get('articles'):
            for article in data['articles']:
                articles.append({
                    "source_title": article.get('source', {}).get('name', 'Неизвестный источник'),
                    "snippet": article.get('description', 'Нет описания.'),
                    "url": article.get('url', '#')
                })
        
        # News API также возвращает общее количество результатов, что полезно для пагинации
        return jsonify({"articles": articles, "totalResults": data.get('totalResults', 0)})
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from News API: {e}")
        return jsonify({"error": f"Failed to fetch news from external API: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

