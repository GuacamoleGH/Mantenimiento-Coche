// Web Audio API Sound System for LubeLogger / Mantenimiento-Coche
// Provides subtle, crisp UI haptic-like clicks and feedback sounds without external audio files.

var soundEnabled = localStorage.getItem('ui_sound_enabled') !== 'false';
var audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Crisp, pleasant mechanical UI tap
function playClickSound() {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.035);
    } catch (e) {
        // Silently catch audio errors (e.g. before user gesture)
    }
}

// Dual harmonic chime for success/enabling
function playSuccessSound() {
    if (!soundEnabled) return;
    try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var now = ctx.currentTime;
        [523.25, 659.25].forEach(function(freq, i) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            var start = now + (i * 0.08);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.06, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.16);
        });
    } catch (e) {}
}

function toggleSoundPreference() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('ui_sound_enabled', soundEnabled);
    updateSoundIcons();
    if (soundEnabled) {
        playSuccessSound();
    }
}

function updateSoundIcons() {
    var icons = document.querySelectorAll('#soundToggleIcon, #soundToggleIconNav, .sound-toggle-icon');
    icons.forEach(function(icon) {
        if (soundEnabled) {
            icon.className = 'bi bi-volume-up-fill fs-6';
            if (icon.parentElement) {
                icon.parentElement.title = 'Sonido activado (clic para silenciar)';
                icon.parentElement.classList.remove('text-secondary');
            }
        } else {
            icon.className = 'bi bi-volume-mute-fill fs-6 text-secondary';
            if (icon.parentElement) {
                icon.parentElement.title = 'Sonido silenciado (clic para activar)';
                icon.parentElement.classList.add('text-secondary');
            }
        }
    });
}

// Intercept user clicks on interactive elements
document.addEventListener('click', function(e) {
    var target = e.target.closest('button, .btn, a, .form-check-input, .nav-link, .dropdown-item, .login-field-toggle');
    if (target) {
        if (target.id === 'soundToggleBtn' || target.closest('#soundToggleBtn') || target.id === 'soundToggleBtnNav' || target.closest('#soundToggleBtnNav')) {
            return;
        }
        playClickSound();
    }
}, true);

document.addEventListener('DOMContentLoaded', function() {
    updateSoundIcons();
});
