const rozaMessages = [
    "Aferin benim güzel kızım Roza! 🌟",
    "Harikasın Roza, aynen böyle devam! 💖",
    "Roza harika bir iş çıkardın! 👑",
    "Sen bir dehasın prenses Roza! 🧠✨",
    "Süper gidiyorsun canım Roza'm! 🚀",
    "İşte benim akıllı kızım Roza! 🏆",
    "Mükemmel cevap Roza, tebrikler! 🎉",
    "Biliyordum Roza, sen yaparsın! 💪",
    "Çok başarılısın tatlım, aferin! 🌸",
    "Roza'nın zekası parlıyor! ✨"
];

// Ard arda doğru cevaplarda (streak) gösterilen kısa kutlama mesajları
const streakMessages = [
    "Seri devam ediyor! 🔥",
    "Durdurulamıyorsun! 🔥",
    "Roza ateşlendi! 🔥",
    "Bir tane daha! Harikasın! 🔥"
];

// Round sonunda yıldız sayısına göre gösterilen sonuç mesajları
const resultMessages = {
    3: [
        "Muhteşemsin Roza! Tam bir şampiyon! 👑🌟",
        "İnanılmazsın! Roza bir dahi! 🏆✨",
        "Süper skor Roza! Gurur duyduk! 💖🎉"
    ],
    2: [
        "Çok iyisin Roza, harika gidiyorsun! 🌟",
        "Aferin Roza, güzel bir sonuç! 💪",
        "Böyle devam edersen rekor senin olacak! 🚀"
    ],
    1: [
        "Güzel bir başlangıç Roza! 🌸",
        "Denemeye devam, gittikçe iyileşiyorsun! 💖",
        "Az daha çalışınca 3 yıldız senin olacak! ⭐"
    ],
    0: [
        "Hiç sorun değil Roza, tekrar deneyelim! 🌈",
        "Herkes böyle öğrenir, pes etme! 💪",
        "Bir dahakine kesin daha iyi olacak! 🌟"
    ]
};

function getRandomMessage() {
    const randomIndex = Math.floor(Math.random() * rozaMessages.length);
    return rozaMessages[randomIndex];
}

function getRandomStreakMessage() {
    const randomIndex = Math.floor(Math.random() * streakMessages.length);
    return streakMessages[randomIndex];
}

function getRandomResultMessage(stars) {
    const pool = resultMessages[stars] || resultMessages[0];
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}
