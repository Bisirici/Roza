// Game State
const ROUND_SIZE = 10; // Number of questions per round/session
const MIXED_ID = 'karisik'; // Pseudo-category id for the mixed-mode round
let currentCategory = null;
let currentRoundQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let streak = 0;
let maxStreak = 0;
let jokerAvailable = true;
let timer = null;
let timeLeft = 20;
const TOTAL_TIME = 20;
let isMuted = false;

// Guards against stale setTimeout callbacks firing after the user has
// already left the game screen (e.g. pressed Home mid-question).
let gameToken = 0;

// DOM Elements
const screens = {
    mainMenu: document.getElementById('main-menu'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen'),
    badges: document.getElementById('badges-screen')
};

const controls = {
    homeBtn: document.getElementById('home-btn'),
    badgesBtn: document.getElementById('badges-btn'),
    muteBtn: document.getElementById('mute-btn'),
    iconMute: document.getElementById('icon-mute'),
    iconUnmute: document.getElementById('icon-unmute'),
    volumeSlider: document.getElementById('volume-slider')
};

const gameUI = {
    categoriesContainer: document.getElementById('categories-container'),
    categoryBadge: document.getElementById('current-category-badge'),
    score: document.getElementById('current-score'),
    timerText: document.getElementById('timer-text'),
    timerPath: document.getElementById('timer-path'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    feedbackOverlay: document.getElementById('feedback-overlay'),
    feedbackMessage: document.getElementById('feedback-message'),
    progressFill: document.getElementById('progress-bar-fill'),
    progressLabel: document.getElementById('progress-label'),
    streakBadge: document.getElementById('streak-badge'),
    streakCount: document.getElementById('streak-count'),
    jokerBtn: document.getElementById('joker-btn')
};

const resultUI = {
    icon: document.getElementById('result-icon'),
    title: document.getElementById('result-title'),
    stars: [
        document.getElementById('star-1'),
        document.getElementById('star-2'),
        document.getElementById('star-3')
    ],
    message: document.getElementById('result-message'),
    scoreValue: document.getElementById('result-score-value'),
    newRecordBadge: document.getElementById('new-record-badge'),
    newBadgesRow: document.getElementById('new-badges-row'),
    playAgainBtn: document.getElementById('play-again-btn'),
    homeBtn: document.getElementById('result-home-btn')
};

const badgesUI = {
    container: document.getElementById('badges-container'),
    backBtn: document.getElementById('badges-back-btn')
};

// Initialize App
function initApp() {
    renderCategories();
    setupEventListeners();

    // Resume audio context on first user interaction if not initialized
    document.body.addEventListener('click', () => {
        AudioEngine.init();
        AudioEngine.startBGM(); // Start music on first click!
    }, { once: true });
}

// Setup Event Listeners
function setupEventListeners() {
    controls.homeBtn.addEventListener('click', goToMainMenu);
    controls.muteBtn.addEventListener('click', toggleMute);

    if (controls.volumeSlider) {
        controls.volumeSlider.addEventListener('input', (e) => {
            const vol = e.target.value;
            AudioEngine.setVolume(vol);

            // Eğer sessizdeyken ses açılırsa, mute'u kaldır
            if (isMuted && vol > 0) {
                toggleMute();
            }
        });
    }

    resultUI.playAgainBtn.addEventListener('click', () => {
        startGame(currentCategory.id);
    });
    resultUI.homeBtn.addEventListener('click', goToMainMenu);

    gameUI.jokerBtn.addEventListener('click', useJoker);

    controls.badgesBtn.addEventListener('click', () => {
        renderBadges();
        switchScreen('badges');
    });
    badgesUI.backBtn.addEventListener('click', goToMainMenu);
}

// Badges Screen
function renderBadges() {
    const earned = getEarnedAchievements();
    badgesUI.container.innerHTML = '';

    ACHIEVEMENTS.forEach((ach) => {
        const unlocked = earned.includes(ach.id);
        const card = document.createElement('div');
        card.className = `badge-card ${unlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="badge-icon">${unlocked ? ach.icon : '🔒'}</div>
            <div class="badge-info">
                <h3>${ach.title}</h3>
                <p>${ach.description}</p>
            </div>
        `;
        badgesUI.container.appendChild(card);
    });
}

// Builds a virtual "category" that pools questions from every real category,
// so a round mixes topics (and difficulties) together.
function buildMixedCategory() {
    return {
        id: MIXED_ID,
        title: 'Karışık Mod',
        icon: '🎲',
        questions: Object.values(quizData).flatMap((c) => c.questions)
    };
}

// Render Main Menu Categories
function renderCategories() {
    gameUI.categoriesContainer.innerHTML = '';

    const mixedBest = localStorage.getItem(`roza_best_${MIXED_ID}`) || 0;
    const mixedCard = document.createElement('div');
    mixedCard.className = 'category-card mixed-card';
    mixedCard.onclick = () => startGame(MIXED_ID);
    mixedCard.innerHTML = `
        <div class="category-info">
            <span class="category-icon">🎲</span>
            <div class="category-details">
                <h3>Karışık Mod</h3>
                <span class="best-score">Rekor: ${mixedBest}</span>
            </div>
        </div>
        <div class="play-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
    `;
    gameUI.categoriesContainer.appendChild(mixedCard);

    for (const key in quizData) {
        const category = quizData[key];
        const bestScore = localStorage.getItem(`roza_best_${key}`) || 0;

        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => startGame(key);

        card.innerHTML = `
            <div class="category-info">
                <span class="category-icon">${category.icon}</span>
                <div class="category-details">
                    <h3>${category.title}</h3>
                    <span class="best-score">Rekor: ${bestScore}</span>
                </div>
            </div>
            <div class="play-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
        `;

        gameUI.categoriesContainer.appendChild(card);
    }
}

// Screen Transitions
function switchScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    setTimeout(() => {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
        // Trigger reflow
        void screens[screenName].offsetWidth;
        screens[screenName].classList.add('active');
    }, 500); // Wait for fade out
}

function goToMainMenu() {
    gameToken++; // invalidate any pending timeouts from the previous round
    clearInterval(timer);
    // Removed stopBGM so music continues playing in the menu
    switchScreen('mainMenu');
    controls.homeBtn.classList.add('hidden');
    controls.badgesBtn.classList.remove('hidden');
    renderCategories(); // Update best scores
}

// Fisher-Yates shuffle (doesn't bias like sort(() => Math.random() - 0.5))
function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Game Logic
function startGame(categoryId) {
    gameToken++; // new round session, invalidate old timeouts
    AudioEngine.startBGM();
    currentCategory = categoryId === MIXED_ID ? buildMixedCategory() : quizData[categoryId];
    currentQuestionIndex = 0;
    score = 0;
    correctCount = 0;
    streak = 0;
    maxStreak = 0;
    jokerAvailable = true;

    // Pick a random subset of questions for this round
    const questionCount = Math.min(ROUND_SIZE, currentCategory.questions.length);
    currentRoundQuestions = shuffleArray(currentCategory.questions).slice(0, questionCount);

    gameUI.categoryBadge.textContent = currentCategory.title;
    gameUI.score.textContent = score;
    gameUI.streakBadge.classList.add('hidden');

    switchScreen('game');
    controls.homeBtn.classList.remove('hidden');
    controls.badgesBtn.classList.add('hidden');

    const myToken = gameToken;
    setTimeout(() => {
        if (myToken !== gameToken) return;
        loadQuestion();
    }, 500);
}

function loadQuestion() {
    if (currentQuestionIndex >= currentRoundQuestions.length) {
        finishRound();
        return;
    }

    updateProgressUI();

    const currentQ = currentRoundQuestions[currentQuestionIndex];
    gameUI.questionText.textContent = currentQ.question;

    gameUI.optionsContainer.innerHTML = '';
    currentQ.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => checkAnswer(index, btn);
        gameUI.optionsContainer.appendChild(btn);
    });

    updateJokerUI();
    startTimer();
}

function disableOptions() {
    Array.from(gameUI.optionsContainer.children).forEach(child => {
        child.disabled = true;
        child.style.pointerEvents = 'none';
    });
    gameUI.jokerBtn.disabled = true;
}

// Joker (50/50): eliminates two wrong options, once per round
function useJoker() {
    if (!jokerAvailable) return;

    const currentQ = currentRoundQuestions[currentQuestionIndex];
    const wrongIndexes = currentQ.options
        .map((_, i) => i)
        .filter(i => i !== currentQ.answer);
    const toEliminate = shuffleArray(wrongIndexes).slice(0, 2);

    toEliminate.forEach(i => {
        const btn = gameUI.optionsContainer.children[i];
        if (btn) {
            btn.classList.add('eliminated');
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
        }
    });

    jokerAvailable = false;
    updateJokerUI();
}

function updateJokerUI() {
    gameUI.jokerBtn.disabled = !jokerAvailable;
}

function checkAnswer(selectedIndex, btnElement) {
    clearInterval(timer);
    const myToken = gameToken;
    const currentQ = currentRoundQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQ.answer;

    disableOptions();

    // Ses/konfeti/animasyon gibi yan etkiler try/finally içinde: biri hata verse
    // bile (örn. bazı telefonlarda Web Audio tuhaflıkları) oyun asla ekranda
    // takılı kalmaz, bir sonraki soruya geçiş her zaman planlanır.
    try {
        if (isCorrect) {
            btnElement.classList.add('correct');
            streak++;
            maxStreak = Math.max(maxStreak, streak);
            correctCount++;
            const streakBonus = Math.min((streak - 1) * 2, 10);
            score += 10 + streakBonus;
            gameUI.score.textContent = score;
            updateStreakUI();

            if (streak >= 2) {
                AudioEngine.playStreakSound();
                showFeedback(getRandomStreakMessage());
            } else {
                AudioEngine.playCorrectSound();
                showFeedback(getRandomMessage());
            }
            triggerConfetti();
        } else {
            btnElement.classList.add('incorrect');
            // Highlight correct answer
            const correctBtn = gameUI.optionsContainer.children[currentQ.answer];
            if (correctBtn) correctBtn.classList.add('correct');
            streak = 0;
            updateStreakUI();
            AudioEngine.playIncorrectSound();
            screens.game.classList.add('shake');
            setTimeout(() => screens.game.classList.remove('shake'), 500);
        }
    } catch (e) {
        console.warn('checkAnswer yan etki hatası (yoksayıldı):', e);
    } finally {
        setTimeout(() => {
            if (myToken !== gameToken) return; // user left the game screen, abort
            currentQuestionIndex++;
            loadQuestion();
        }, 2000); // 2 second delay before next question
    }
}

function showFeedback(message) {
    gameUI.feedbackMessage.textContent = message;
    gameUI.feedbackOverlay.classList.remove('hidden');
    setTimeout(() => gameUI.feedbackOverlay.classList.add('show'), 10);

    setTimeout(() => {
        gameUI.feedbackOverlay.classList.remove('show');
        setTimeout(() => gameUI.feedbackOverlay.classList.add('hidden'), 300);
    }, 1500);
}

// Progress Bar
function updateProgressUI() {
    const total = currentRoundQuestions.length;
    const current = currentQuestionIndex + 1;
    const pct = (currentQuestionIndex / total) * 100;
    gameUI.progressFill.style.width = `${pct}%`;
    gameUI.progressLabel.textContent = `Soru ${current}/${total}`;
}

// Streak Badge
function updateStreakUI() {
    if (streak >= 2) {
        gameUI.streakCount.textContent = streak;
        gameUI.streakBadge.classList.remove('hidden');
        gameUI.streakBadge.classList.remove('pop');
        void gameUI.streakBadge.offsetWidth; // force reflow to replay animation
        gameUI.streakBadge.classList.add('pop');
    } else {
        gameUI.streakBadge.classList.add('hidden');
    }
}

// Timer Logic
function startTimer() {
    clearInterval(timer);
    timeLeft = TOTAL_TIME;
    updateTimerUI();

    timer = setInterval(() => {
        timeLeft--;
        updateTimerUI();

        if (timeLeft > 0 && timeLeft <= 5) {
            AudioEngine.playTickSound();
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeOut();
        }
    }, 1000);
}

function updateTimerUI() {
    gameUI.timerText.textContent = timeLeft;

    // Calculate SVG circle dashoffset
    const strokeDasharray = 283; // 2 * PI * 45
    const dashoffset = strokeDasharray - (timeLeft / TOTAL_TIME) * strokeDasharray;
    gameUI.timerPath.style.strokeDashoffset = dashoffset;

    // Change color when time is low
    if (timeLeft <= 5) {
        gameUI.timerPath.style.stroke = 'var(--danger-color)';
        gameUI.timerText.style.color = 'var(--danger-color)';
    } else {
        gameUI.timerPath.style.stroke = 'var(--accent-color)';
        gameUI.timerText.style.color = 'var(--text-primary)';
    }
}

function handleTimeOut() {
    const myToken = gameToken;
    disableOptions(); // prevent a late click racing with the next-question timer

    try {
        AudioEngine.playIncorrectSound();
        screens.game.classList.add('shake');
        setTimeout(() => screens.game.classList.remove('shake'), 500);

        streak = 0;
        updateStreakUI();

        // Show correct answer
        const currentQ = currentRoundQuestions[currentQuestionIndex];
        const correctBtn = gameUI.optionsContainer.children[currentQ.answer];
        if (correctBtn) correctBtn.classList.add('correct');
    } catch (e) {
        console.warn('handleTimeOut yan etki hatası (yoksayıldı):', e);
    } finally {
        setTimeout(() => {
            if (myToken !== gameToken) return; // user left the game screen, abort
            currentQuestionIndex++;
            loadQuestion();
        }, 2000);
    }
}

// Round Results
function finishRound() {
    clearInterval(timer);
    const total = currentRoundQuestions.length;
    const pct = total > 0 ? correctCount / total : 0;

    let stars = 0;
    if (pct >= 0.9) stars = 3;
    else if (pct >= 0.6) stars = 2;
    else if (pct >= 0.3) stars = 1;

    const isNewRecord = saveBestScore();
    const newlyEarned = checkRoundAchievements({
        categoryId: currentCategory.id,
        stars,
        correctCount,
        total,
        maxStreak
    });
    showResultScreen(stars, isNewRecord, newlyEarned);
}

function showResultScreen(stars, isNewRecord, newlyEarned) {
    resultUI.stars.forEach((el, i) => {
        el.classList.toggle('earned', i < stars);
    });

    resultUI.scoreValue.textContent = score;
    resultUI.message.textContent = getRandomResultMessage(stars);
    resultUI.icon.textContent = stars === 3 ? '👑' : stars >= 1 ? '🌟' : '🌈';
    resultUI.title.textContent = stars >= 2 ? 'Tebrikler Roza!' : 'Güzel Denemeydi Roza!';
    resultUI.newRecordBadge.classList.toggle('hidden', !isNewRecord);
    renderNewBadges(newlyEarned);
    controls.badgesBtn.classList.remove('hidden');

    switchScreen('result');

    if (stars === 3) {
        setTimeout(triggerConfetti, 550);
    }
}

function renderNewBadges(newlyEarned) {
    resultUI.newBadgesRow.innerHTML = '';

    if (!newlyEarned || newlyEarned.length === 0) {
        resultUI.newBadgesRow.classList.add('hidden');
        return;
    }

    newlyEarned.forEach((ach) => {
        const chip = document.createElement('div');
        chip.className = 'new-badge-chip';
        chip.innerHTML = `<span class="chip-icon">${ach.icon}</span> Yeni Rozet: ${ach.title}`;
        resultUI.newBadgesRow.appendChild(chip);
    });

    resultUI.newBadgesRow.classList.remove('hidden');
    AudioEngine.playStreakSound();
}

// Score and Mute Management
function saveBestScore() {
    const key = `roza_best_${currentCategory.id}`;
    const currentBest = parseInt(localStorage.getItem(key)) || 0;
    if (score > currentBest) {
        localStorage.setItem(key, score);
        return true;
    }
    return false;
}

function toggleMute() {
    isMuted = !isMuted;
    AudioEngine.toggleMute(isMuted);

    if (isMuted) {
        controls.iconUnmute.classList.add('hidden');
        controls.iconMute.classList.remove('hidden');
        controls.muteBtn.style.background = 'rgba(239, 68, 68, 0.2)';
    } else {
        controls.iconMute.classList.add('hidden');
        controls.iconUnmute.classList.remove('hidden');
        controls.muteBtn.style.background = 'var(--glass-bg)';
    }
}

// Confetti Effect
function triggerConfetti() {
    // CDN'den gelen confetti kütüphanesi engellenmiş/bozuksa bile oyun asla
    // burada takılıp kalmasın diye tamamı try/catch ile korunuyor.
    try {
        if (typeof confetti !== 'function') return;

        const duration = 1500;
        const end = Date.now() + duration;

        (function frame() {
            try {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#ff2a85', '#8b5cf6', '#10b981', '#fcd34d']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#ff2a85', '#8b5cf6', '#10b981', '#fcd34d']
                });
            } catch (e) {
                console.warn('Konfeti hatası (yoksayıldı):', e);
                return;
            }

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    } catch (e) {
        console.warn('Konfeti hatası (yoksayıldı):', e);
    }
}

// Register service worker for offline/installable PWA support (no-op if unsupported, e.g. file://)
if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Sessizce yoksay: sunucu olmadan (file://) veya HTTPS dışında çalışmaz
        });
    });
}

// Start App
initApp();
