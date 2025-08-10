// Service Worker для поддержки PWA (Progressive Web App)
const CACHE_NAME = 'student-news-cache-v1';
// Файлы, которые будут кэшироваться при установке Service Worker
const urlsToCache = [
    '/', // Главная страница
    '/index.html',
    '/style.css',
    '/script.js',
    '/NSA.jpg', // Логотип
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/webp-polyfill@1.0.1/webp-polyfill.min.js',
    // Добавьте сюда другие важные статические ресурсы, если они есть
];

// Установка Service Worker и кэширование статических ресурсов
self.addEventListener('install', event => {
    console.log('Service Worker: Установка и кэширование');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Кэширование оболочки приложения');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Ошибка при добавлении в кэш:', error);
            })
    );
});

// Активация Service Worker и удаление старых кэшей
self.addEventListener('activate', event => {
    console.log('Service Worker: Активация');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Удаление старого кэша', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
    // Пропускаем запросы к API, если они не должны кэшироваться Service Worker'ом
    if (event.request.url.startsWith('https://shoxbro2007.pythonanywhere.com/api')) {
        // Для API запросов можно использовать стратегию "Network First" или "Stale-While-Revalidate"
        // Здесь используется "Network First" для свежих данных, но без кэширования ответов API.
        // Кэширование ответов API управляется на бэкенде (news_backend.py).
        event.respondWith(fetch(event.request).catch(error => {
            console.error('Service Worker: Ошибка при запросе API:', error);
            // Если сеть недоступна, можно отдать заглушку или кэшированные данные, если они есть.
            // Для новостей это сложнее, т.к. они динамические.
            // В данном случае, если API не доступно, фронтенд покажет ошибку,
            // а Service Worker не будет пытаться кэшировать API ответы.
            throw error; // Передаем ошибку дальше, чтобы фронтенд мог ее обработать
        }));
        return;
    }

    // Для остальных запросов (статические ресурсы) используем стратегию "Cache First"
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэшированный ресурс, если найден
                if (response) {
                    console.log('Service Worker: Обслуживание из кэша:', event.request.url);
                    return response;
                }
                // Если ресурс не найден в кэше, запрашиваем его из сети
                console.log('Service Worker: Запрос из сети:', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // Кэшируем новый ресурс для будущего использования
                        return caches.open(CACHE_NAME).then(cache => {
                            // Не кэшируем ответы, которые не являются успешными (например, 404, 500)
                            if (networkResponse.ok || networkResponse.type === 'opaque') { // 'opaque' для сторонних ресурсов без CORS
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                    })
                    .catch(error => {
                        console.error('Service Worker: Ошибка при запросе из сети:', error);
                        // Можно показать офлайн-страницу, если запрос не удался
                        // return caches.match('/offline.html');
                        throw error;
                    });
            })
    );
});
