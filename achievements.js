// Rozet (başarım) tanımları ve localStorage ile ilerleme takibi

const ACHIEVEMENTS = [
    {
        id: 'ilk-adim',
        icon: '🎉',
        title: 'İlk Adım',
        description: 'İlk turunu tamamladın!',
        check: () => true
    },
    {
        id: 'yildiz-avcisi',
        icon: '🌟',
        title: 'Yıldız Avcısı',
        description: 'Bir kategoride 3 yıldız kazandın!',
        check: (stats) => stats.stars === 3
    },
    {
        id: 'ates-topu',
        icon: '🔥',
        title: 'Ateş Topu',
        description: 'Bir turda 5 soruyu art arda doğru bildin!',
        check: (stats) => stats.maxStreak >= 5
    },
    {
        id: 'kusursuz',
        icon: '💯',
        title: 'Kusursuz',
        description: 'Bir turda tüm soruları doğru bildin!',
        check: (stats) => stats.total > 0 && stats.correctCount === stats.total
    },
    {
        id: 'kasif',
        icon: '🗺️',
        title: 'Kaşif',
        description: 'Tüm kategorileri en az bir kez oynadın!',
        check: (stats) => stats.playedAllCategories
    },
    {
        id: 'roza-sampiyonu',
        icon: '👑',
        title: 'Roza Şampiyonu',
        description: 'Tüm kategorilerde 3 yıldız kazandın!',
        check: (stats) => stats.masteredAllCategories
    }
];

function getEarnedAchievements() {
    try {
        return JSON.parse(localStorage.getItem('roza_achievements')) || [];
    } catch (e) {
        return [];
    }
}

function saveEarnedAchievements(list) {
    localStorage.setItem('roza_achievements', JSON.stringify(list));
}

function getPlayedCategories() {
    try {
        return JSON.parse(localStorage.getItem('roza_played_categories')) || [];
    } catch (e) {
        return [];
    }
}

function markCategoryPlayed(categoryId) {
    const played = getPlayedCategories();
    if (!played.includes(categoryId)) {
        played.push(categoryId);
        localStorage.setItem('roza_played_categories', JSON.stringify(played));
    }
    return played;
}

function getBestStars(categoryId) {
    return parseInt(localStorage.getItem(`roza_best_stars_${categoryId}`)) || 0;
}

function updateBestStars(categoryId, stars) {
    const current = getBestStars(categoryId);
    if (stars > current) {
        localStorage.setItem(`roza_best_stars_${categoryId}`, stars);
        return stars;
    }
    return current;
}

// Bir tur bittiğinde çağrılır; yeni kazanılan rozetlerin listesini döndürür.
function checkRoundAchievements({ categoryId, stars, correctCount, total, maxStreak }) {
    const played = markCategoryPlayed(categoryId);
    updateBestStars(categoryId, stars);

    const allCategoryIds = Object.keys(quizData);
    const playedAllCategories = allCategoryIds.every(id => played.includes(id));
    const masteredAllCategories = allCategoryIds.every(id => getBestStars(id) >= 3);

    const stats = {
        stars,
        correctCount,
        total,
        maxStreak,
        playedAllCategories,
        masteredAllCategories
    };

    const earned = getEarnedAchievements();
    const newlyEarned = [];

    ACHIEVEMENTS.forEach((ach) => {
        if (!earned.includes(ach.id) && ach.check(stats)) {
            earned.push(ach.id);
            newlyEarned.push(ach);
        }
    });

    if (newlyEarned.length > 0) {
        saveEarnedAchievements(earned);
    }

    return newlyEarned;
}
