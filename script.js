// Get references to DOM elements
const mainPageView = document.getElementById('mainPageView');
const bookmarksPageView = document.getElementById('bookmarksPageView');
const historyPageView = document.getElementById('historyPageView');
const newsContainer = document.getElementById('newsContainer');
const bookmarksContainer = document.getElementById('bookmarksContainer');
const historyContainer = document.getElementById('historyContainer');
const noBookmarksMessage = document.getElementById('noBookmarksMessage');
const noHistoryMessage = document.getElementById('noHistoryMessage');

const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const authorSearchInput = document.getElementById('authorSearchInput');
const authorSearchButton = document.getElementById('authorSearchButton');
const fromDateInput = document.getElementById('fromDate');
const toDateInput = document.getElementById('toDate');
const dateQuickButtons = document.querySelectorAll('.date-quick-button');
const languageSelect = document.getElementById('languageSelect');
const categoryButtonsContainer = document.getElementById('categoryButtons');
const loadMoreButton = document.getElementById('loadMoreButton');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const htmlElement = document.documentElement;

// Navigation elements
const mainNewsNavButton = document.getElementById('mainNewsNavButton');
const bookmarksNavButton = document.getElementById('bookmarksNavButton');
const historyNavButton = document.getElementById('historyNavButton');
const navButtons = document.querySelectorAll('.nav-button');

// Source selection elements
const selectSourcesButton = document.getElementById('selectSourcesButton');
const sourcesModal = document.getElementById('sourcesModal');
const closeModalButton = document.getElementById('closeModalButton');
const sourcesListContainer = document.getElementById('sourcesList');
const applySourcesButton = document.getElementById('applySourcesButton');

// Favorite Categories/Sources elements
const manageFavoriteCategoriesButton = document.getElementById('manageFavoriteCategoriesButton');
const manageFavoriteSourcesButton = document.getElementById('manageFavoriteSourcesButton');
const favoriteCategoriesModal = document.getElementById('favoriteCategoriesModal');
const closeFavCategoriesModalButton = document.getElementById('closeFavCategoriesModalButton');
const favoriteCategoriesList = document.getElementById('favoriteCategoriesList');
const applyFavoriteCategoriesButton = document.getElementById('applyFavoriteCategoriesButton');
const favoriteSourcesModal = document.getElementById('favoriteSourcesModal');
const closeFavSourcesModalButton = document.getElementById('closeFavSourcesModalButton');
const favoriteSourcesList = document.getElementById('favoriteSourcesList');
const applyFavoriteSourcesButton = document.getElementById('applyFavoriteSourcesButton');
const favoriteCategoriesDisplay = document.getElementById('favoriteCategoriesDisplay');
const favoriteSourcesDisplay = document.getElementById('favoriteSourcesDisplay');

// Full Article Detail Modal elements
const articleDetailModal = document.getElementById('articleDetailModal');
const closeArticleDetailModalButton = document.getElementById('closeArticleDetailModalButton');
const articleDetailImageContainer = document.getElementById('articleDetailImageContainer'); 
const articleDetailTitle = document.getElementById('articleDetailTitle');
const articleDetailSnippet = document.getElementById('articleDetailSnippet');
const articleDetailSource = document.getElementById('articleDetailSource');
const articleDetailAuthor = document.getElementById('articleDetailAuthor');
const articleDetailDate = document.getElementById('articleDetailDate');
const articleDetailOriginalLink = document.getElementById('articleDetailOriginalLink');


// Scroll to Top Button
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// Toast Notification
const toastContainer = document.getElementById('toastContainer');

let currentQuery = '';
let currentCategory = '';
let currentAuthor = '';
let currentLanguage = localStorage.getItem('selectedLanguage') || 'ru';
let currentPage = 1;
let totalResults = 0;

// Hardcoded list of popular sources for GNews API
let allSources = [
    { id: 'lenta.ru', name: 'Lenta.ru', description: 'Российское интернет-издание' },
    { id: 'rt', name: 'RT', description: 'Российский международный новостной телеканал' },
    { id: 'ria-novosti', name: 'РИА Новости', description: 'Российское информационное агентство' },
    { id: 'bbc-news', name: 'BBC News', description: 'British Broadcasting Corporation' },
    { id: 'cnn', name: 'CNN', description: 'Cable News Network' },
    { id: 'the-new-york-times', name: 'The New York Times', description: 'American daily newspaper' },
    { id: 'the-guardian', name: 'The Guardian', description: 'British daily newspaper' },
    { id: 'reuters', name: 'Reuters', description: 'International news agency' },
    { id: 'kommersant', name: 'Коммерсантъ', description: 'Российская ежедневная газета' },
    { id: 'izvestia', name: 'Известия', description: 'Российская общественно-политическая газета' },
    { id: 'gazeta.ru', name: 'Газета.Ru', description: 'Российское интернет-издание' },
    { id: 'rbc', name: 'РБК', description: 'Российский медиахолдинг' },
    { id: 'vesti.ru', name: 'Вести.Ru', description: 'Российский новостной портал' },
    { id: 'tass', name: 'ТАСС', description: 'Российское государственное информационное агентство' },
    { id: 'interfax', name: 'Интерфакс', description: 'Российское информационное агентство' },
    { id: 'washington-post', name: 'The Washington Post', description: 'American daily newspaper' },
    { id: 'bloomberg', name: 'Bloomberg', description: 'Financial news and data' },
    { id: 'forbes', name: 'Forbes', description: 'Business magazine' },
    { id: 'techcrunch', name: 'TechCrunch', description: 'Technology news' },
    { id: 'engadget', name: 'Engadget', description: 'Technology news and reviews' },
    { id: 'the-verge', name: 'The Verge', description: 'Technology news' },
    { id: 'wired', name: 'Wired', description: 'Technology and culture magazine' },
    { id: 'national-geographic', name: 'National Geographic', description: 'Science, exploration, and culture' },
    { id: 'science-alert', name: 'ScienceAlert', description: 'Science news' },
    { id: 'espn', name: 'ESPN', 'description': 'Sports news' },
    { id: 'bleacher-report', name: 'Bleacher Report', description: 'Sports news and analysis' },
];

let selectedSourceIds = JSON.parse(localStorage.getItem('selectedSourceIds')) || [];
let favoriteCategories = JSON.parse(localStorage.getItem('favoriteCategories')) || [];
let favoriteSourceIds = JSON.parse(localStorage.getItem('favoriteSourceIds')) || [];

// State for bookmarked and history articles
let bookmarkedArticles = JSON.parse(localStorage.getItem('bookmarkedArticles')) || [];
let viewedArticlesHistory = JSON.parse(localStorage.getItem('viewedArticlesHistory')) || [];

const BACKEND_API_URL = 'https://shoxbro2007.pythonanywhere.com/api';
const BASE_SITE_URL = 'https://studnews.ru/'; 

// All possible categories (must match backend logic)
const allCategories = [
    { id: '', name: 'Все', icon: 'fas fa-globe' },
    { id: 'technology', name: 'Технологии', icon: 'fas fa-microchip' },
    { id: 'science', name: 'Наука', icon: 'fas fa-flask' },
    { id: 'sports', name: 'Спорт', icon: 'fas fa-futbol' },
    { id: 'health', name: 'Здоровье', icon: 'fas fa-heartbeat' },
    { id: 'business', name: 'Бизнес', icon: 'fas fa-chart-line' },
    { id: 'entertainment', name: 'Развлечения', icon: 'fas fa-film' }
];

// --- Utility Functions ---

/**
 * Debounce function to limit how often a function is called.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};

// --- Theme Toggling ---
/**
 * Toggles between light and dark themes.
 */
function toggleTheme() {
    if (htmlElement.classList.contains('light')) {
        htmlElement.classList.remove('light');
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        htmlElement.classList.remove('dark');
        htmlElement.classList.add('light');
        localStorage.setItem('theme', 'light');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
    updateActiveCategoryButton(currentCategory);
    updateActiveNavButton(currentPageView); 
}

/**
 * Applies the saved theme preference on page load.
 */
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        htmlElement.classList.add('light');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

// --- Sharing Functionality ---
/**
 * Handles sharing an article.
 * @param {string} platform - 'twitter', 'facebook', 'copy', 'whatsapp', 'viber', 'telegram', 'vk'.
 * @param {string} url - The URL of the article (original source).
 * @param {string} title - The title/snippet of the article.
 * @param {string} sourceId - The ID of the news source.
 */
function shareArticle(platform, url, title, sourceId) {
    const sharedSiteUrl = `${BASE_SITE_URL}?q=${encodeURIComponent(title || '')}&s=${encodeURIComponent(sourceId || '')}`;
    const text = encodeURIComponent(`Читайте: "${title}" на Student News Aggregator: ${sharedSiteUrl}`);

    let shareUrl = '';
    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(sharedSiteUrl)}&text=${encodeURIComponent(title)}`;
            window.open(shareUrl, '_blank');
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharedSiteUrl)}`;
            window.open(shareUrl, '_blank');
            break;
        case 'copy':
            const tempInput = document.createElement('textarea');
            tempInput.value = sharedSiteUrl; 
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                document.execCommand('copy');
                showToast('Ссылка на статью скопирована!');
            } catch (err) {
                console.error('Не удалось скопировать текст: ', err);
                showToast('Не удалось скопировать ссылку.', 'error');
            } finally {
                document.body.removeChild(tempInput);
            }
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${text}`;
            window.open(shareUrl, '_blank');
            break;
        case 'viber':
            shareUrl = `viber://forward?text=${text}`;
            window.open(shareUrl, '_blank');
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(sharedSiteUrl)}&text=${encodeURIComponent(title)}`;
            window.open(shareUrl, '_blank');
            break;
        case 'vk':
            shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(sharedSiteUrl)}&title=${encodeURIComponent(title)}&noparse=true`;
            window.open(shareUrl, '_blank');
            break;
    }
}

// --- Bookmark and History Management ---
/**
 * Toggles an article's bookmark status.
 * @param {Object} article - The article to bookmark/unbookmark.
 */
function toggleBookmark(article) {
    const index = bookmarkedArticles.findIndex(a => a.url === article.url);
    let message = '';

    if (index > -1) {
        bookmarkedArticles.splice(index, 1); 
        message = 'Статья удалена из закладок!';
    } else {
        bookmarkedArticles.unshift(article); 
        message = 'Статья добавлена в закладки!';
    }
    localStorage.setItem('bookmarkedArticles', JSON.stringify(bookmarkedArticles));
    showToast(message);

    if (currentPageView === 'bookmarks') {
        renderBookmarksPage();
    }
}

/**
 * Adds an article to the history.
 * @param {Object} article - The article to add to history.
 */
function addArticleToHistory(article) {
    const index = viewedArticlesHistory.findIndex(a => a.url === article.url);
    if (index > -1) {
        viewedArticlesHistory.splice(index, 1);
    }
    viewedArticlesHistory.unshift(article); 
    if (viewedArticlesHistory.length > 50) {
        viewedArticlesHistory = viewedArticlesHistory.slice(0, 50);
    }
    localStorage.setItem('viewedArticlesHistory', JSON.stringify(viewedArticlesHistory));
}

// --- AI Summarization ---
/**
 * Fetches an AI summary for a given article text.
 * @param {string} articleText - The text of the article to summarize.
 * @param {HTMLElement} summaryContainer - The DOM element to display the summary in.
 * @param {HTMLElement} summarizeButton - The button that triggered the summarization.
 */
async function fetchAISummary(articleText, summaryContainer, summarizeButton) {
    summaryContainer.innerHTML = '<div class="summary-loading-spinner"></div> Загрузка резюме...';
    summaryContainer.classList.remove('hidden');
    summarizeButton.disabled = true; 

    try {
        const response = await fetch(`${BACKEND_API_URL}/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ article_text: articleText })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при получении резюме от AI.');
        }

        const data = await response.json();
        summaryContainer.innerHTML = `<p>${data.summary}</p>`;
    } catch (error) {
        console.error("Error fetching AI summary:", error);
        summaryContainer.innerHTML = `<p class="text-red-500 dark:text-red-300">Ошибка: ${error.message}</p>`;
        showToast(`Ошибка суммаризации: ${error.message}`, 'error');
    } finally {
        summarizeButton.disabled = false; 
    }
}


// --- News Card Creation Helpers ---
/**
 * Generates the HTML for the article image or a placeholder.
 * @param {Object} article - The article data.
 * @param {number} index - The index of the article.
 * @param {boolean} isBookmarkOrHistory - True if rendering for bookmarks/history page.
 * @returns {string} HTML string for the image or placeholder.
 */
function createImageHtml(article, index, isBookmarkOrHistory) {
    const placeholderText = 'Нет изображения';
    let placeholderHeight = '200px'; 

    if (!isBookmarkOrHistory && currentPage === 1 && index === 0) {
        placeholderHeight = '280px';
    } else if (!isBookmarkOrHistory && currentPage === 1 && (index === 1 || index === 2)) {
        placeholderHeight = '220px';
    }

    // WebP Implementation: Provide .webp source if available, otherwise fallback to original image.
    // The image_url from the backend is assumed to be the original (e.g., .jpg, .png).
    // We assume there's a corresponding .webp version available at the same path/name.
    const webpImageUrl = article.image_url ? article.image_url.replace(/\.(jpg|jpeg|png)$/i, '.webp') : null;
    const originalImageUrl = article.image_url;

    if (originalImageUrl) {
        return `
            <picture>
                ${webpImageUrl ? `<source srcset="${webpImageUrl}" type="image/webp">` : ''}
                <img src="${originalImageUrl}" 
                     alt="${article.title || 'Изображение новости'}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.outerHTML='<div class=&quot;placeholder-image&quot; style=&quot;height: ${placeholderHeight};&quot;>${placeholderText}</div>'; console.log('Image failed to load, replaced with placeholder for:', '${article.title || 'Без заголовка'}');" />
            </picture>
        `;
    } else {
        console.log('No image URL provided for article:', article.title || 'Без заголовка');
        return `<div class="placeholder-image" style="height: ${placeholderHeight};">${placeholderText}</div>`;
    }
}

/**
 * Generates the HTML for social share buttons.
 * @param {Object} article - The article data.
 * @returns {string} HTML string for share buttons.
 */
function createShareButtonsHtml(article) {
    const encodedTitle = encodeURIComponent(article.snippet || article.source_title || 'Новость');
    const encodedUrl = encodeURIComponent(article.url || BASE_SITE_URL);
    const sourceId = article.source_id || '';

    return `
        <button class="share-button twitter" data-platform="twitter" data-url="${article.url}" data-title="${encodedTitle}" data-source-id="${sourceId}" aria-label="Поделиться в Twitter">
            <i class="fab fa-twitter"></i>
        </button>
        <button class="share-button facebook" data-platform="facebook" data-url="${article.url}" data-title="${encodedTitle}" data-source-id="${sourceId}" aria-label="Поделиться в Facebook">
            <i class="fab fa-facebook-f"></i>
        </button>
        <button class="share-button whatsapp" data-platform="whatsapp" data-url="${article.url}" data-title="${encodedTitle}" data-source-id="${sourceId}" aria-label="Поделиться в WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </button>
        <button class="share-button viber" data-platform="viber" data-url="${article.url}" data-title="${encodedTitle}" data-source-id="${sourceId}" aria-label="Поделиться в Viber">
            <i class="fab fa-viber"></i>
        </button>
        <button class="share-button telegram" data-platform="telegram" data-url="${article.url}" data-title="${encodedTitle}" data-source-id="${sourceId}" aria-label="Поделиться в Telegram">
            <i class="fab fa-telegram-plane"></i>
        </button>
        <button class="share-button vk" data-platform="vk" data-url="${article.url}" data-title="${encodedTitle}" data-source-id="${sourceId}" aria-label="Поделиться ВКонтакте">
            <i class="fab fa-vk"></i>
        </button>
        <button class="share-button copy" data-platform="copy" data-url="${article.url}" data-title="${encodedTitle}" data-source-id="${sourceId}" aria-label="Скопировать ссылку">
            <i class="fas fa-copy"></i>
        </button>
    `;
}

/**
 * Creates a news card element.
 * @param {Object} article - The article data.
 * @param {number} index - The index of the article (for layout and animation delay).
 * @param {boolean} isBookmarkOrHistory - True if rendering for bookmarks/history page (no bookmark button, different styling for 'read more').
 * @returns {HTMLElement} The created news card element.
 */
function createNewsCard(article, index, isBookmarkOrHistory = false) {
    const newsCard = document.createElement('div');
    let cardClasses = `news-card p-6 flex flex-col justify-between shadow-md dark:shadow-lg`;
    
    if (!isBookmarkOrHistory && currentPage === 1 && index === 0) {
        cardClasses += ` w-full md:w-full lg:w-full large-card`;
    } else if (!isBookmarkOrHistory && currentPage === 1 && (index === 1 || index === 2)) {
        cardClasses += ` w-full md:w-1/2 lg:w-1/2 medium-card`;
    } else {
        cardClasses += ` w-full md:w-1/2 lg:w-1/3`;
    }
    newsCard.className = cardClasses;
    newsCard.style.setProperty('--animation-delay', `${index * 0.05}s`); 

    const imageHtml = createImageHtml(article, index, isBookmarkOrHistory);
    const isBookmarked = bookmarkedArticles.some(a => a.url === article.url);
    const bookmarkIconClass = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
    const shareButtonsHtml = createShareButtonsHtml(article);

    newsCard.innerHTML = `
        ${imageHtml}
        <div>
            <h2 class="text-xl font-semibold mb-2">${article.source_title || 'Неизвестный источник'}</h2>
            <p class="mb-4">${article.snippet || 'Нет описания.'}</p>
            <div class="summary-area">
                <button class="summarize-button px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition duration-150 ease-in-out mt-2" aria-label="Суммировать статью с помощью AI">
                    Суммировать с AI
                </button>
                <div class="summary-content hidden text-sm"></div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Автор: ${article.author || 'Неизвестно'}</p>
        </div>
        <div class="flex items-center justify-between mt-4">
            <button class="read-more-button inline-block font-medium transition duration-150 ease-in-out" data-article-index="${index}" aria-label="Читать далее о статье">
                Читать далее &rarr;
            </button>
            <div class="flex space-x-2">
                ${!isBookmarkOrHistory ? `
                    <button class="bookmark-button p-2 rounded-full transition duration-150 ease-in-out shadow-sm" data-url="${article.url}" aria-label="${isBookmarked ? 'Удалить из закладок' : 'Добавить в закладки'}">
                        <i class="${bookmarkIconClass}"></i>
                    </button>
                ` : ''}
                <a href="${article.url || '#'}#disqus_thread" data-disqus-url="${article.url}" class="text-sm text-gray-500 dark:text-gray-400 flex items-center hover:text-primary-color dark:hover:text-accent-color transition-colors duration-200" aria-label="Посмотреть комментарии">
                    <i class="fas fa-comments mr-1"></i> <span class="disqus-comment-count">0</span>
                </a>
                
                ${shareButtonsHtml}
            </div>
        </div>
    `;

    newsCard.querySelectorAll('.share-button').forEach(button => {
        button.addEventListener('click', () => {
            const platform = button.dataset.platform;
            const url = button.dataset.url; 
            const title = button.dataset.title;
            const sourceId = button.dataset.sourceId; 
            shareArticle(platform, url, title, sourceId);
        });
    });

    if (!isBookmarkOrHistory) {
        const bookmarkButton = newsCard.querySelector('.bookmark-button');
        if (bookmarkButton) {
            bookmarkButton.addEventListener('click', () => {
                toggleBookmark(article);
                const icon = bookmarkButton.querySelector('i');
                if (bookmarkedArticles.some(a => a.url === article.url)) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    bookmarkButton.setAttribute('aria-label', 'Удалить из закладок');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    bookmarkButton.setAttribute('aria-label', 'Добавить в закладки');
                }
            });
        }
    }

    const readMoreButton = newsCard.querySelector('.read-more-button');
    if (readMoreButton) {
        readMoreButton.addEventListener('click', () => {
            openArticleDetail(article);
        });
    }

    const summarizeButton = newsCard.querySelector('.summarize-button');
    const summaryContentDiv = newsCard.querySelector('.summary-content');
    if (summarizeButton && summaryContentDiv) {
        summarizeButton.addEventListener('click', () => {
            const textToSummarize = article.snippet || article.title || '';
            if (textToSummarize) {
                fetchAISummary(textToSummarize, summaryContentDiv, summarizeButton);
            } else {
                summaryContentDiv.innerHTML = '<p class="text-red-500 dark:text-red-300">Нет текста для суммаризации.</p>';
                summaryContentDiv.classList.remove('hidden');
            }
        });
    }

    return newsCard;
}

// --- Full Article Detail Modal Logic (New) ---
/**
 * Opens the modal to display full article details and initializes Disqus.
 * @param {Object} article - The article object to display.
 */
function openArticleDetail(article) {
    if (!article) {
        console.error("Не удалось открыть детали статьи: объект статьи отсутствует.");
        showToast("Не удалось загрузить детали статьи.", "error");
        return;
    }

    addArticleToHistory(article);

    articleDetailImageContainer.innerHTML = ''; 

    const modalPlaceholderText = 'Изображение недоступно';
    const modalPlaceholderHeight = '300px'; 
    if (article.image_url) {
        const imgElement = document.createElement('img');
        imgElement.src = article.image_url;
        imgElement.alt = article.title || 'Изображение статьи';
        imgElement.className = 'w-full h-auto rounded-lg mb-6';
        imgElement.onerror = function() {
            this.onerror = null; 
            console.log('Modal image failed to load for:', article.title || 'Без заголовка', 'URL:', article.image_url);
            const placeholderDiv = document.createElement('div');
            placeholderDiv.className = 'placeholder-image w-full h-64 rounded-lg mb-6'; 
            placeholderDiv.textContent = modalPlaceholderText;
            articleDetailImageContainer.innerHTML = ''; 
            articleDetailImageContainer.appendChild(placeholderDiv);
        };
        articleDetailImageContainer.appendChild(imgElement);
    } else {
        console.log('No image URL provided for modal article:', article.title || 'Без заголовка');
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'placeholder-image w-full h-64 rounded-lg mb-6'; 
        placeholderDiv.textContent = modalPlaceholderText;
        articleDetailImageContainer.appendChild(placeholderDiv);
    }

    articleDetailTitle.textContent = article.title || 'Заголовок статьи';
    articleDetailSnippet.textContent = article.snippet || 'Описание статьи отсутствует.';
    articleDetailSource.textContent = article.source_title || 'Неизвестно';
    articleDetailAuthor.textContent = article.author || 'Неизвестно';
    articleDetailDate.textContent = article.published_at ? new Date(article.published_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Неизвестно';
    articleDetailOriginalLink.href = article.url || '#';

    articleDetailModal.classList.add('show');

    loadDisqusComments(article);

    updateMetaTags(article, article.url || window.location.href);
    updateJsonLd(article);
}

/**
 * Closes the full article detail modal.
 */
function closeArticleDetailModal() {
    articleDetailModal.classList.remove('show');
    updateMetaTags(null, window.location.href);
    updateJsonLd(null);
}

// --- Disqus Integration Logic ---
/**
 * Initializes or reloads Disqus for a new article.
 * @param {Object} article - Object with article data (minimum article.url and article.title).
 */
function loadDisqusComments(article) {
    if (!article || !article.url || !article.title) {
        console.warn("Disqus: Недостаточно данных статьи для загрузки комментариев.");
        const disqusThread = document.getElementById('disqus_thread');
        if (disqusThread) {
            disqusThread.innerHTML = '<p class="text-gray-600 dark:text-gray-300">Комментарии недоступны для этой статьи.</p>';
        }
        return;
    }

    const disqusThread = document.getElementById('disqus_thread');
    if (!disqusThread) {
        console.error("Disqus: Элемент #disqus_thread не найден в DOM. Убедитесь, что он добавлен в HTML.");
        return;
    }

    window.disqus_config = function () {
        this.page.url = article.url; 
        this.page.identifier = article.url; 
        this.page.title = article.title; 
    };

    if (typeof DISQUS === 'object') {
        DISQUS.reset({
            reload: true,
            config: function () {
                this.page.url = article.url;
                this.page.identifier = article.url;
                this.page.title = article.title;
            }
        });
    } else {
        const s = document.createElement('script');
        s.src = 'https://studnews-ru.disqus.com/embed.js'; 
        s.setAttribute('data-timestamp', +new Date()); 
        (document.head || document.body).appendChild(s);
    }
}


// --- Fetching and Displaying News ---
/**
 * Fetches news articles from the backend API and displays them.
 * @param {boolean} reset - If true, clears existing news and resets page to 1.
 */
async function fetchAndDisplayNews(reset = true) {
    if (reset) {
        currentPage = 1;
        newsContainer.innerHTML = '';
        newsContainer.classList.add('hidden');
        loadMoreButton.classList.add('hidden');
    }

    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    errorText.textContent = '';

    try {
        const urlParams = new URLSearchParams();
        if (currentQuery) {
            urlParams.append('query', currentQuery.substring(0, 200)); 
        }
        if (currentCategory) {
            urlParams.append('category', currentCategory);
        }
        if (currentAuthor) {
            urlParams.append('author', currentAuthor.substring(0, 200)); 
        }
        urlParams.append('language', currentLanguage);
        urlParams.append('page', currentPage);
        
        if (fromDateInput.value) {
            urlParams.append('from_date', fromDateInput.value);
        }
        if (toDateInput.value) {
            urlParams.append('to_date', toDateInput.value);
        }
        if (selectedSourceIds.length > 0) {
            urlParams.append('sources', selectedSourceIds.join(','));
        }

        localStorage.setItem('savedFilters', JSON.stringify({
            query: currentQuery,
            category: currentCategory,
            author: currentAuthor,
            language: currentLanguage,
            fromDate: fromDateInput.value,
            toDate: toDateInput.value,
            selectedSourceIds: selectedSourceIds
        }));

        const url = `${BACKEND_API_URL}/news?${urlParams.toString()}`;
        console.log(`Fetching news from: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            const errorJson = await response.json();
            const apiError = errorJson.error || `HTTP error! Status: ${response.status}`;
            throw new Error(apiError);
        }

        const data = await response.json();
        let articles = data.articles;
        totalResults = data.totalResults; 

        if (favoriteCategories.length > 0 || favoriteSourceIds.length > 0) {
            let prioritizedArticles = [];
            let otherArticles = [];

            articles.forEach(article => {
                const articleCategory = article.category || ''; 
                const isFavoriteCategory = favoriteCategories.includes(articleCategory); 
                const isFavoriteSource = favoriteSourceIds.includes(article.source_id);

                if (isFavoriteCategory || isFavoriteSource) {
                    prioritizedArticles.push(article);
                } else {
                    otherArticles.push(article);
                }
            });
            articles = prioritizedArticles.concat(otherArticles);
        }


        if (articles && articles.length > 0) {
            articles.forEach((article, index) => {
                const newsCard = createNewsCard(article, index);
                newsContainer.appendChild(newsCard);
            });
            newsContainer.classList.remove('hidden');

            if (newsContainer.children.length < totalResults) {
                loadMoreButton.classList.remove('hidden');
            } else {
                loadMoreButton.classList.add('hidden');
            }
            if (reset) { 
                showToast('Новости успешно загружены!');
            } else {
                showToast('Загружены новые статьи!');
            }

        } else if (reset) {
            errorMessage.classList.remove('hidden');
            errorText.textContent = `По вашему запросу или выбранным фильтрам новости не найдены. Попробуйте изменить критерии поиска или фильтрации.`;
            loadMoreButton.classList.add('hidden');
            showToast('Новости не найдены.', 'warning');
        } else {
            loadMoreButton.classList.add('hidden');
            showToast('Больше статей не найдено.', 'info');
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        errorMessage.classList.remove('hidden');
        errorText.textContent = `Произошла ошибка при загрузке новостей: ${error.message}. Пожалуйста, попробуйте еще раз.`;
        loadMoreButton.classList.add('hidden');
        showToast(`Ошибка загрузки новостей: ${error.message}`, 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// --- Source Selection Modal ---
/**
 * Displays sources as checkboxes in the modal.
 */
function displaySourcesInModal(container, currentSelection) {
    container.innerHTML = ''; 
    if (allSources.length === 0) {
        container.innerHTML = `<p class="text-gray-600 dark:text-gray-300">Источники не найдены.</p>`;
        return;
    }

    allSources.forEach(source => {
        const isChecked = currentSelection.includes(source.id);
        const label = document.createElement('label');
        label.className = 'flex items-center mb-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700';
        label.innerHTML = `
            <input type="checkbox" value="${source.id}" ${isChecked ? 'checked' : ''} class="mr-3 h-5 w-5 rounded focus:ring-primary-color" aria-label="Выбрать источник ${source.name}">
            <span class="text-gray-900 dark:text-gray-100 font-medium">${source.name}</span>
            <span class="text-gray-500 dark:text-gray-400 text-sm ml-2">- ${source.description || 'Нет описания.'}</span>
        `;
        container.appendChild(label);
    });
}

/**
 * Shows the sources modal.
 */
function showSourcesModal() {
    displaySourcesInModal(sourcesListContainer, selectedSourceIds);
    sourcesModal.classList.add('show');
}

/**
 * Hides the sources modal.
 */
function hideSourcesModal() {
    sourcesModal.classList.remove('show');
}

/**
 * Handles applying selected sources.
 */
function applySelectedSources() {
    selectedSourceIds = [];
    const checkboxes = sourcesListContainer.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedSourceIds.push(checkbox.value);
    });
    localStorage.setItem('selectedSourceIds', JSON.stringify(selectedSourceIds)); 
    hideSourcesModal();
    resetAllFiltersExceptLanguageAndFavorites();
    renderPage('main'); 
    showToast('Фильтр по источникам применен!');
}

// --- Favorite Categories/Sources Modals ---
function displayFavoriteCategoriesInModal() {
    favoriteCategoriesList.innerHTML = '';
    allCategories.forEach(category => {
        if (category.id === '') return; 
        const isChecked = favoriteCategories.includes(category.id);
        const label = document.createElement('label');
        label.className = 'flex items-center mb-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700';
        label.innerHTML = `
            <input type="checkbox" value="${category.id}" ${isChecked ? 'checked' : ''} class="mr-3 h-5 w-5 rounded focus:ring-primary-color" aria-label="Выбрать категорию ${category.name}">
            <span class="text-gray-900 dark:text-gray-100 font-medium"><i class="${category.icon} mr-2"></i>${category.name}</span>
        `;
        favoriteCategoriesList.appendChild(label);
    });
    favoriteCategoriesModal.classList.add('show');
}

function applyFavoriteCategories() {
    favoriteCategories = [];
    const checkboxes = favoriteCategoriesList.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        favoriteCategories.push(checkbox.value);
    });
    localStorage.setItem('favoriteCategories', JSON.stringify(favoriteCategories));
    updateFavoriteDisplays();
    favoriteCategoriesModal.classList.remove('show');
    showToast('Любимые категории обновлены!');
    renderPage('main'); 
}

function displayFavoriteSourcesInModal() {
    favoriteSourcesList.innerHTML = '';
    if (allSources.length === 0) {
        favoriteSourcesList.innerHTML = `<p class="text-gray-600 dark:text-gray-300">Источники не найдены.</p>`;
        showToast('Не удалось загрузить источники для избранного.', 'warning');
        return;
    }
    allSources.forEach(source => {
        const isChecked = favoriteSourceIds.includes(source.id);
        const label = document.createElement('label');
        label.className = 'flex items-center mb-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700';
        label.innerHTML = `
            <input type="checkbox" value="${source.id}" ${isChecked ? 'checked' : ''} class="mr-3 h-5 w-5 rounded focus:ring-primary-color" aria-label="Выбрать источник ${source.name}">
            <span class="text-gray-900 dark:text-gray-100 font-medium">${source.name}</span>
        `;
        favoriteSourcesList.appendChild(label);
    });
    favoriteSourcesModal.classList.add('show');
}

function applyFavoriteSources() {
    favoriteSourceIds = [];
    const checkboxes = favoriteSourcesList.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        favoriteSourceIds.push(checkbox.value);
    });
    localStorage.setItem('favoriteSourceIds', JSON.stringify(favoriteSourceIds));
    updateFavoriteDisplays();
    favoriteSourcesModal.classList.remove('show');
    showToast('Любимые источники обновлены!');
    renderPage('main'); 
}

function updateFavoriteDisplays() {
    favoriteCategoriesDisplay.textContent = `Любимые категории: ${favoriteCategories.length > 0 ? favoriteCategories.map(id => allCategories.find(c => c.id === id)?.name || id).filter(name => name !== 'Все').join(', ') : 'Нет'}`;
    favoriteSourcesDisplay.textContent = `Любимые источники: ${favoriteSourceIds.length > 0 ? favoriteSourceIds.map(id => allSources.find(s => s.id === id)?.name || id).join(', ') : 'Нет'}`;
}

// --- UI Updates ---
function updateActiveCategoryButton(selectedCategory) {
    const buttons = categoryButtonsContainer.querySelectorAll('.category-button');
    const isDark = htmlElement.classList.contains('dark');

    buttons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.category === selectedCategory) {
            button.classList.add('active');
        }
    });
}

let currentPageView = 'main'; 
function updateActiveNavButton(activeView) {
    navButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.view === activeView) {
            button.classList.add('active');
        }
    });
}

/**
 * Shows a toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', 'warning', 'info'.
 */
function showToast(message, type = 'success') {
    toastContainer.textContent = message;
    toastContainer.className = 'toast-notification show'; 
    
    switch (type) {
        case 'success':
            toastContainer.style.backgroundColor = 'var(--toast-bg-success)';
            break;
        case 'error':
            toastContainer.style.backgroundColor = 'var(--toast-bg-error)';
            break;
        case 'warning':
            toastContainer.style.backgroundColor = 'var(--toast-bg-warning)';
            break;
        case 'info':
            toastContainer.style.backgroundColor = 'var(--toast-bg-info)';
            break;
        default:
            toastContainer.style.backgroundColor = '#333'; 
    }

    setTimeout(() => {
        toastContainer.classList.remove('show');
    }, 3000); 
}

// --- Page Rendering Logic ---
/**
 * Renders the specified page view.
 * @param {string} view - 'main', 'bookmarks', or 'history'.
 */
function renderPage(view) {
    mainPageView.classList.add('hidden');
    bookmarksPageView.classList.add('hidden');
    historyPageView.classList.add('hidden');

    switch (view) {
        case 'main':
            mainPageView.classList.remove('hidden');
            fetchAndDisplayNews(true); 
            break;
        case 'bookmarks':
            bookmarksPageView.classList.remove('hidden');
            renderBookmarksPage();
            break;
        case 'history':
            historyPageView.classList.remove('hidden');
            renderHistoryPage();
            break;
    }
    currentPageView = view;
    updateActiveNavButton(view);
    if (view !== 'articleDetail') { 
        updateMetaTags(null, window.location.href);
        updateJsonLd(null);
    }
}

/**
 * Renders the bookmarked articles page.
 */
function renderBookmarksPage() {
    bookmarksContainer.innerHTML = '';
    if (bookmarkedArticles.length === 0) {
        noBookmarksMessage.classList.remove('hidden');
    } else {
        noBookmarksMessage.classList.add('hidden');
        bookmarkedArticles.forEach((article, index) => {
            const newsCard = createNewsCard(article, index, true); 
            bookmarksContainer.appendChild(newsCard);
        });
    }
}

/**
 * Renders the history articles page.
 */
function renderHistoryPage() {
    historyContainer.innerHTML = '';
    if (viewedArticlesHistory.length === 0) {
        noHistoryMessage.classList.remove('hidden');
    } else {
        noHistoryMessage.classList.add('hidden');
        viewedArticlesHistory.forEach((article, index) => {
            const newsCard = createNewsCard(article, index, true); 
            historyContainer.appendChild(newsCard);
        });
    }
}

/**
 * Resets all filter inputs and current filter states, except language and favorites.
 */
function resetAllFiltersExceptLanguageAndFavorites() {
    currentQuery = '';
    searchInput.value = '';
    currentAuthor = '';
    authorSearchInput.value = '';
    fromDateInput.value = '';
    toDateInput.value = '';
    selectedSourceIds = JSON.parse(localStorage.getItem('selectedSourceIds')) || []; 
    updateActiveCategoryButton(currentCategory);
}

// --- SEO: Dynamic Meta Tags and JSON-LD ---
/**
 * Dynamically updates meta tags and Open Graph for SEO.
 * @param {Object} article - The article object with data for meta tags. Can be null for default.
 * @param {string} currentUrl - The current canonical URL of the page.
 */
function updateMetaTags(article, currentUrl) {
    const defaultTitle = "Student News Aggregator | Актуальные новости для студентов";
    const defaultDescription = "Будьте в курсе последних новостей для студентов: образование, стипендии, карьера, университет, технологии, наука, спорт и многое другое. Ваш агрегатор студенческих новостей.";
    const defaultKeywords = "новости для студентов, студенческие новости, образование, стипендии, карьера, университет, технологии, наука, спорт, здоровье, бизнес, развлечения, агрегатор новостей";
    const defaultImage = `${BASE_SITE_URL}NSA.jpg`; 

    const pageTitle = article ? article.title || defaultTitle : defaultTitle;
    const pageDescription = article ? article.snippet || defaultDescription : defaultDescription;
    const pageKeywords = article ? (article.category ? `${article.category}, ${defaultKeywords}` : defaultKeywords) : defaultKeywords;
    const pageImage = article ? article.image_url || defaultImage : defaultImage;

    document.title = pageTitle;

    const setMetaTag = (name, content, attribute = 'name') => {
        let tag = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attribute, name);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    };

    setMetaTag('description', pageDescription);
    setMetaTag('keywords', pageKeywords);

    setMetaTag('og:title', pageTitle, 'property');
    setMetaTag('og:description', pageDescription, 'property');
    setMetaTag('og:type', article ? 'article' : 'website', 'property');
    setMetaTag('og:url', currentUrl, 'property');
    setMetaTag('og:image', pageImage, 'property');
    setMetaTag('og:site_name', 'Student News Aggregator', 'property');

    setMetaTag('twitter:card', 'summary_large_image', 'name');
    setMetaTag('twitter:title', pageTitle, 'name');
    setMetaTag('twitter:description', pageDescription, 'name');
    setMetaTag('twitter:image', pageImage, 'name');
}

/**
 * Dynamically generates and injects JSON-LD microdata for an article.
 * @param {Object} article - The article object with data. Can be null to remove existing.
 */
function updateJsonLd(article) {
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
        existingScript.remove();
    }

    if (!article || !article.title || !article.url) {
        return; 
    }

    const authorName = article.author || article.source_title || "Неизвестный автор";
    const publishedAt = article.published_at || new Date().toISOString();
    const updatedAt = publishedAt; 
    const imageUrl = article.image_url || `${BASE_SITE_URL}NSA.jpg`; 

    const jsonLdData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.snippet || "",
        "image": [imageUrl],
        "author": {
            "@type": "Person",
            "name": authorName
        },
        "datePublished": publishedAt,
        "dateModified": updatedAt,
        "publisher": {
            "@type": "Organization",
            "name": "StudNews",
            "logo": {
                "@type": "ImageObject",
                "url": `${BASE_SITE_URL}NSA.jpg` 
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": article.url
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLdData);
    document.head.appendChild(script);
}

// --- Event Listeners ---
searchInput.addEventListener('input', debounce(() => {
    currentQuery = searchInput.value.trim();
    currentCategory = ''; 
    currentAuthor = ''; 
    fromDateInput.value = ''; 
    toDateInput.value = '';
    selectedSourceIds = JSON.parse(localStorage.getItem('selectedSourceIds')) || []; 
    updateActiveCategoryButton(currentCategory);
    renderPage('main');
}, 500)); 

searchButton.addEventListener('click', () => {
    searchInput.dispatchEvent(new Event('input')); 
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

authorSearchInput.addEventListener('input', debounce(() => {
    currentAuthor = authorSearchInput.value.trim();
    currentQuery = ''; 
    currentCategory = ''; 
    fromDateInput.value = ''; 
    toDateInput.value = '';
    selectedSourceIds = JSON.parse(localStorage.getItem('selectedSourceIds')) || []; 
    updateActiveCategoryButton(currentCategory);
    renderPage('main');
}, 500)); 

authorSearchButton.addEventListener('click', () => {
    authorSearchInput.dispatchEvent(new Event('input'));
});

authorSearchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        authorSearchButton.click();
    }
});

fromDateInput.addEventListener('change', () => {
    currentQuery = ''; 
    currentAuthor = ''; 
    currentCategory = ''; 
    updateActiveCategoryButton(currentCategory);
    renderPage('main');
});

toDateInput.addEventListener('change', () => {
    currentQuery = ''; 
    currentAuthor = ''; 
    currentCategory = ''; 
    updateActiveCategoryButton(currentCategory);
    renderPage('main');
});

dateQuickButtons.forEach(button => {
    button.addEventListener('click', () => {
        const days = parseInt(button.dataset.days);
        const today = new Date();
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - days);

        fromDateInput.value = fromDate.toISOString().split('T')[0];
        toDateInput.value = today.toISOString().split('T')[0];

        currentQuery = ''; 
        currentAuthor = ''; 
        currentCategory = ''; 
        updateActiveCategoryButton(currentCategory);
        renderPage('main');
    });
});

languageSelect.addEventListener('change', () => {
    currentLanguage = languageSelect.value;
    localStorage.setItem('selectedLanguage', currentLanguage); 
    renderPage('main');
});

categoryButtonsContainer.addEventListener('click', (event) => {
    if (event.target.closest('.category-button')) {
        const button = event.target.closest('.category-button');
        currentCategory = button.dataset.category;
        currentQuery = ''; 
        currentAuthor = ''; 
        fromDateInput.value = ''; 
        toDateInput.value = '';
        selectedSourceIds = JSON.parse(localStorage.getItem('selectedSourceIds')) || []; 
        updateActiveCategoryButton(currentCategory);
        renderPage('main');
    }
});

loadMoreButton.addEventListener('click', () => {
    currentPage++;
    fetchAndDisplayNews(false);
});

themeToggle.addEventListener('click', toggleTheme);

selectSourcesButton.addEventListener('click', showSourcesModal);
closeModalButton.addEventListener('click', hideSourcesModal);
sourcesModal.addEventListener('click', (event) => {
    if (event.target === sourcesModal) {
        hideSourcesModal();
    }
});
applySourcesButton.addEventListener('click', applySelectedSources);

manageFavoriteCategoriesButton.addEventListener('click', displayFavoriteCategoriesInModal);
closeFavCategoriesModalButton.addEventListener('click', () => favoriteCategoriesModal.classList.remove('show'));
favoriteCategoriesModal.addEventListener('click', (event) => {
    if (event.target === favoriteCategoriesModal) {
        favoriteCategoriesModal.classList.remove('show');
    }
});
applyFavoriteCategoriesButton.addEventListener('click', applyFavoriteCategories);

manageFavoriteSourcesButton.addEventListener('click', displayFavoriteSourcesInModal);
closeFavSourcesModalButton.addEventListener('click', () => favoriteSourcesModal.classList.remove('show'));
favoriteSourcesModal.addEventListener('click', (event) => {
    if (event.target === favoriteSourcesModal) {
        favoriteSourcesModal.classList.remove('show');
    }
});
applyFavoriteSourcesButton.addEventListener('click', applyFavoriteSources);

closeArticleDetailModalButton.addEventListener('click', closeArticleDetailModal);
articleDetailModal.addEventListener('click', (event) => {
    if (event.target === articleDetailModal) {
        closeArticleDetailModal();
    }
});

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        renderPage(button.dataset.view);
    });
});

window.onscroll = function() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollToTopBtn.style.display = "block";
    } else {
        scrollToTopBtn.style.display = "none";
    }
};

scrollToTopBtn.addEventListener('click', () => {
    document.body.scrollTop = 0; 
    document.documentElement.scrollTop = 0; 
});

// --- PWA: Service Worker Registration ---
// Проверяем поддержку Service Workers браузером
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker зарегистрирован успешно:', registration);
                showToast('Приложение готово к работе в офлайн режиме!');
            })
            .catch(error => {
                console.error('Ошибка регистрации Service Worker:', error);
                showToast('Не удалось зарегистрировать Service Worker. Офлайн режим может быть недоступен.', 'error');
            });
    });
}


// --- Initial Load and Saved Filters ---
window.onload = () => {
    applySavedTheme();
    languageSelect.value = currentLanguage; 
    
    const savedFilters = JSON.parse(localStorage.getItem('savedFilters'));
    if (savedFilters) {
        searchInput.value = savedFilters.query || '';
        currentQuery = savedFilters.query || '';
        authorSearchInput.value = savedFilters.author || '';
        currentAuthor = savedFilters.author || '';
        fromDateInput.value = savedFilters.fromDate || '';
        toDateInput.value = savedFilters.toDate || '';
        currentCategory = savedFilters.category || '';
        selectedSourceIds = savedFilters.selectedSourceIds || [];
        languageSelect.value = savedFilters.language || 'ru';
        currentLanguage = savedFilters.language || 'ru';
    }

    favoriteCategories = JSON.parse(localStorage.getItem('favoriteCategories')) || [];
    favoriteSourceIds = JSON.parse(localStorage.getItem('favoriteSourceIds')) || [];
    updateFavoriteDisplays(); 

    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    const sourceParam = urlParams.get('s');

    if (queryParam || sourceParam) {
        currentQuery = queryParam || '';
        searchInput.value = queryParam || '';
        selectedSourceIds = sourceParam ? [sourceParam] : [];
        currentCategory = '';
        currentAuthor = '';
        authorSearchInput.value = '';
        fromDateInput.value = '';
        toDateInput.value = '';
    }

    updateActiveCategoryButton(currentCategory);
    renderPage('main'); 
    updateMetaTags(null, window.location.href); 
    updateJsonLd(null); 
};
