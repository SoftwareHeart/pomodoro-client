
// Durumu yöneten sınıf oluşturalım
class PomodoroTimer {
    constructor() {
        this.intervalId = null;
        this.startTime = null;
        this.targetEndTime = null;
        this.pausedTimeRemaining = null;
        this.updateRate = 100; // ms
    }

    // Zamanlayıcıyı başlat
    start(durationInSeconds) {
        // Önceki tüm zamanlayıcıları temizle
        this.stop();

        // Daha önce duraklatılmış ise kalan süreyi kullan
        const remainingMs = this.pausedTimeRemaining !== null
            ? this.pausedTimeRemaining
            : durationInSeconds * 1000;

        this.startTime = Date.now();
        this.targetEndTime = this.startTime + remainingMs;
        this.pausedTimeRemaining = null;

        // Düzenli güncelleme gönder
        this.intervalId = setInterval(() => {
            const now = Date.now();
            const timeLeftMs = Math.max(0, this.targetEndTime - now);
            const timeLeftSeconds = Math.ceil(timeLeftMs / 1000); // Yukarı yuvarlama

            // Güncelleme mesajı gönder
            self.postMessage({
                type: 'tick',
                timeLeft: timeLeftSeconds,
                timeLeftMs,
                progress: 1 - (timeLeftMs / (durationInSeconds * 1000))
            });

            // Süre doldu mu?
            if (timeLeftMs <= 0) {
                this.stop();
                self.postMessage({ type: 'complete' });
            }
        }, this.updateRate);
    }

    // Zamanlayıcıyı duraklat
    pause() {
        if (this.intervalId && this.targetEndTime) {
            clearInterval(this.intervalId);
            this.intervalId = null;

            // Kalan süreyi hesapla ve sakla
            this.pausedTimeRemaining = Math.max(0, this.targetEndTime - Date.now());
            this.targetEndTime = null;
        }
    }

    // Zamanlayıcıyı durdur
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.startTime = null;
        this.targetEndTime = null;
        this.pausedTimeRemaining = null;
    }

    // Zamanlayıcıyı sıfırla
    reset(durationInSeconds) {
        this.stop();
        self.postMessage({
            type: 'tick',
            timeLeft: durationInSeconds,
            timeLeftMs: durationInSeconds * 1000,
            progress: 0
        });
    }
}

// Timer nesnesini oluştur
const timer = new PomodoroTimer();

// Mesajları dinle
self.onmessage = function (e) {
    const { command, duration } = e.data;

    switch (command) {
        case 'start':
            timer.start(duration);
            break;
        case 'pause':
            timer.pause();
            break;
        case 'reset':
            timer.reset(duration);
            break;
        default:
            console.error('Bilinmeyen komut:', command);
    }
};