// Service Worker для поддержки PWA (Progressive Web App)
const CACHE_NAME = 'student-news-cache-v1'; // Увеличивайте версию кэша при каждом значительном изменении статики
// Файлы, которые будут кэшироваться при установке Service Worker
const urlsToCache = [
    '/', // Главная страница
    '/index.html',
    '/style.css',
    '/script.js',
    '/NSA.jpg', // Логотип (убедитесь, что этот файл существует!)
    '/NSA.webp', // WebP версия логотипа (убедитесь, что этот файл существует!)
    'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    // webp-polyfill.min.js и cdn.tailwindcss.com были удалены из urlsToCache в предыдущих версиях
    // так как они вызывали 404 или CORS ошибки при кэшировании SW
];

// Установка Service Worker и кэширование статических ресурсов
self.addEventListener('install', event => {
    console.log('Service Worker: Установка и кэширование');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Кэширование оболочки приложения');
                // Используем Promise.allSettled для обработки случаев,
                // когда некоторые ресурсы могут не загрузиться (например, если нет интернета)
                return Promise.allSettled(urlsToCache.map(url => cache.add(url)));
            })
            .then(results => {
                results.forEach(result => {
                    if (result.status === 'rejected') {
                        console.warn(`Service Worker: Не удалось кэшировать ${result.reason.url || 'ресурс'}:`, result.reason);
                    }
                });
                console.log('Service Worker: Кэширование оболочки приложения завершено (с возможными предупреждениями).');
            })
            .catch(error => {
                console.error('Service Worker: Критическая ошибка при открытии кэша или добавлении ресурсов:', error);
            })
    );
    // Принудительная активация нового Service Worker сразу после установки,
    // чтобы он не ждал закрытия всех вкладок со старой версией.
    self.skipWaiting();
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
        }).then(() => {
            // Утверждаем контроль над всеми клиентами (вкладками) сразу после активации
            return self.clients.claim();
        })
    );
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
    // 1. Исключаем все POST-запросы из кэширования
    // 2. Исключаем запросы к API и аналитике
    const isAnalyticsOrApi = 
        event.request.url.startsWith('https://shoxbro2007.pythonanywhere.com/api') || 
        event.request.url.includes('gnews.io') ||
        event.request.url.includes('disqus.com') ||
        event.request.url.includes('mc.yandex.ru') || // Яндекс.Метрика
        event.request.url.includes('googletagmanager.com') || // Google Tag Manager (который грузит GA4)
        event.request.url.includes('google-analytics.com') || // Google Analytics напрямую
        event.request.url.includes('yandex.ru/ads'); // Яндекс.Директ/РСЯ

    if (event.request.method !== 'GET' || isAnalyticsOrApi) {
        // Для не-GET запросов, или запросов к API/аналитике:
        // Просто отправляем запрос в сеть, не пытаясь кэшировать.
        // Ошибки CORS/Network для этих запросов будут обрабатываться на уровне фронтенда.
        event.respondWith(fetch(event.request).catch(error => {
            console.error('Service Worker: Ошибка при запросе (не кэшируется):', event.request.url, error);
            throw error; // Передаем ошибку дальше, чтобы фронтенд мог ее обработать
        }));
        return;
    }

    // Для остальных GET-запросов (статические ресурсы): используем стратегию "Cache First"
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
                        // Кэшируем новый ресурс для будущего использования,
                        // только если ответ успешный (2xx) или непрозрачный ('opaque')
                        // и относится к статическому контенту.
                        if (networkResponse.ok || networkResponse.type === 'opaque') {
                            return caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse.clone()); // Клонируем ответ, т.к. он потоковый
                                return networkResponse;
                            });
                        }
                        return networkResponse; // Для неуспешных ответов просто возвращаем ответ без кэширования
                    })
                    .catch(error => {
                        console.error('Service Worker: Ошибка при запросе из сети (статический ресурс):', event.request.url, error);
                        // Если очень нужно, можно отдать офлайн-страницу, если запрос не удался
                        // return caches.match('/offline.html');
                        throw error;
                    });
            })
    );
});
