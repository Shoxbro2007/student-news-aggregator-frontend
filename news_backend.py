 # news_backend.py
    import os
    import requests
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    from datetime import datetime, timedelta

    app = Flask(__name__)
    CORS(app) # Enable CORS for all routes

    # Replace with your actual News API key
    NEWS_API_KEY = os.environ.get('NEWS_API_KEY', 'cb80d44628a242c6a30668812f7d2ffc') 
    # Replace with your actual Gemini API key (or leave empty if using Canvas default)
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyCkXhzHaPgkTRsiNkNbqTvEMMEve0P7LXM') 

    # Base URL for News API
    NEWS_API_BASE_URL = "https://newsapi.org/v2"

    # Base URL for Gemini API
    GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    @app.route('/')
    def home():
        return "Welcome to the Student News Aggregator Backend!"

    @app.route('/api/news')
    def get_news():
        query = request.args.get('query', '')
        category = request.args.get('category', '')
        author = request.args.get('author', '')
        language = request.args.get('language', 'ru') # Default to Russian
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('pageSize', 9, type=int) # Default page size for display
        from_date_str = request.args.get('from_date')
        to_date_str = request.args.get('to_date')
        sources = request.args.get('sources', '') # Comma-separated source IDs

        params = {
            'apiKey': NEWS_API_KEY,
            'language': language,
            'page': page,
            'pageSize': page_size,
        }

        endpoint = '/top-headlines' # Default endpoint

        if query:
            params['q'] = query
            endpoint = '/everything' # Use /everything for specific queries
        if category:
            params['category'] = category
            endpoint = '/top-headlines' # Categories only work with top-headlines
        if author:
            if not query:
                params['q'] = author
            pass
        if from_date_str:
            params['from'] = from_date_str
            endpoint = '/everything'
        if to_date_str:
            params['to'] = to_date_str
            endpoint = '/everything'
        if sources:
            params['sources'] = sources
            endpoint = '/top-headlines'

        if query or from_date_str or to_date_str:
            endpoint = '/everything'
            params.pop('category', None) 
        
        if endpoint == '/top-headlines':
            params.pop('q', None)

        try:
            response = requests.get(f"{NEWS_API_BASE_URL}{endpoint}", params=params)
            response.raise_for_status()
            data = response.json()

            articles = data.get('articles', [])
            
            if author and 'q' not in params:
                articles = [
                    article for article in articles 
                    if article.get('author') and author.lower() in article['author'].lower()
                ]

            formatted_articles = [
                {
                    'source_id': article.get('source', {}).get('id'),
                    'source_title': article.get('source', {}).get('name'),
                    'author': article.get('author'),
                    'title': article.get('title'),
                    'snippet': article.get('description'),
                    'url': article.get('url'),
                    'image_url': article.get('urlToImage'),
                    'published_at': article.get('publishedAt')
                }
                for article in articles if article.get('title') and article.get('url')
            ]

            return jsonify({
                'articles': formatted_articles,
                'totalResults': data.get('totalResults', 0)
            })
        except requests.exceptions.RequestException as e:
            print(f"Error fetching news: {e}")
            return jsonify({'error': f'Failed to fetch news: {e}'}), 500
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return jsonify({'error': f'An unexpected error occurred: {e}'}), 500

    @app.route('/api/sources')
    def get_sources():
        language = request.args.get('language', 'ru')
        params = {
            'apiKey': NEWS_API_KEY,
            'language': language
        }
        try:
            response = requests.get(f"{NEWS_API_BASE_URL}/sources", params=params)
            response.raise_for_status()
            data = response.json()
            sources = data.get('sources', [])
            formatted_sources = [
                {'id': source.get('id'), 'name': source.get('name'), 'description': source.get('description')}
                for source in sources
            ]
            return jsonify(formatted_sources)
        except requests.exceptions.RequestException as e:
            print(f"Error fetching sources: {e}")
            return jsonify({'error': f'Failed to fetch sources: {e}'}), 500
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return jsonify({'error': f'An unexpected error occurred: {e}'}), 500

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
                return jsonify({'error': f'Gemini API error (400): {gemini_response.text}'}), 500
            elif hasattr(gemini_response, 'status_code') and gemini_response.status_code == 429:
                return jsonify({'error': 'Gemini API rate limit exceeded. Please try again later.'}), 500
            return jsonify({'error': f'Failed to summarize text with AI (network/API issue): {e}'}), 500
        except Exception as e:
            print(f"An unexpected error occurred during summarization: {e}")
            return jsonify({'error': f'An unexpected error occurred during summarization: {e}'}), 500
    