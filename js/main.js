/* main.js: buttons, section unlocking, scrolling, letter rendering, progress bar */
'use strict';
(() => {
    const $ = s => document.querySelector(s);
    const player = $('#player'), flowers = $('#flowers'), letter = $('#letter');
    const burst = (x, y, n) => {
        if (window.Hearts) window.Hearts.burst(x, y, n);
    };
    const centre = el => {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
    };

    /* GIF slot (path comes from config.js; the slot stays visible if the file is missing) */
    if (LOVE.gif) {
        const img = $('#gif');
        img.addEventListener('load', () => {
            img.hidden = false;
            $('#gifHint').hidden = true;
            $('#gifSlot').classList.add('filled');
        });
        img.src = LOVE.gif;
    }

    /* Build the letter from config.js (textContent keeps it safe from injected HTML) */
    function renderLetter() {
        const L = LOVE.letter, box = $('#paper');
        const add = (tag, cls, text) => {
            const el = document.createElement(tag);
            el.className = (cls + ' reveal').trim();
            el.textContent = text;
            box.appendChild(el);
            return el;
        };
        add('h2', 'script', L.greeting);
        L.paragraphs.forEach(t => {
            if (t === '---') box.insertAdjacentHTML('beforeend', '<div class="divider reveal"><svg viewBox="0 0 24 24"><use href="#heart"/></svg></div>');
            else add('p', '', t);
        });
        add('p', '', L.closing).style.marginBottom = '0';
        add('p', 'script sign', L.signature);
        box.insertAdjacentHTML('beforeend', '<div class="final reveal"><svg viewBox="0 0 24 24"><use href="#heart"/></svg><span class="script"></span></div>');
        box.querySelector('.final span').textContent = L.finale;
    }
    renderLetter();

    /* Sections stay hidden until the person earns the next one */
    const unlock = el => {
        el.classList.remove('locked');
        requestAnimationFrame(() => el.classList.add('show'));
    };
    const go = el => el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* "No" gets shy, "Yes" grows */
    const msgs = ['Are you sure, langga? 🥺', 'Just one little peek? 💗', 'Pretty please? 🌹', 'The check looks lonely…'];
    let n = 0;
    $('#no').addEventListener('click', e => {
        const no = e.currentTarget;
        n++;
        $('#hint').textContent = n >= 5 ? 'Okay, there’s only one answer left 💞' : msgs[n - 1];
        $('#yes').style.setProperty('--s', 1 + n * .14);
        no.style.setProperty('--s', Math.max(.35, 1 - n * .17));
        no.classList.remove('shake');
        void no.offsetWidth; // restart the shake animation
        no.classList.add('shake');
        if (n >= 5) no.style.visibility = 'hidden';
    });
    $('#yes').addEventListener('click', e => {
        burst(...centre(e.currentTarget), 46);
        unlock(player);
        setTimeout(() => go(player), 200);
    });
    $('#env').addEventListener('click', e => {
        const b = e.currentTarget;
        b.classList.add('open');
        burst(...centre(b), 40);
        unlock(letter);
        setTimeout(() => go(letter), 650);
    });

    /* Mini music player: the first press starts the song and moves on to the flowers */
    const song = $('#song');
    const playBtn = $('#play');
    const mini = $('#mini');
    const hasSong = Boolean(LOVE.music.src);
    let started = false;

    $('#songTitle').textContent = LOVE.music.title;
    $('#songArtist').textContent = LOVE.music.artist;
    if (hasSong) song.src = LOVE.music.src;

    const formatTime = s => {
        if (!isFinite(s)) return '0:00';
        return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    };

    const setPlaying = on => {
        player.classList.toggle('playing', on);
        mini.classList.toggle('paused', !on);
        $('#iconPlay').hidden = on;
        $('#iconPause').hidden = !on;
        playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
        mini.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
    };

    const toggleSong = () => {
        if (song.paused) song.play().catch(() => {});
        else song.pause();
    };

    song.addEventListener('play', () => setPlaying(true));
    song.addEventListener('pause', () => setPlaying(false));
    song.addEventListener('loadedmetadata', () => {
        $('#tLen').textContent = formatTime(song.duration);
    });
    song.addEventListener('timeupdate', () => {
        $('#tNow').textContent = formatTime(song.currentTime);
        $('#fill').style.width = (song.duration ? song.currentTime / song.duration * 100 : 0) + '%';
    });
    song.addEventListener('error', () => {
        if (hasSong) $('#playerTag').textContent = 'Song file not found. Check js/config.js';
    });

    $('#track').addEventListener('click', e => {
        const r = e.currentTarget.getBoundingClientRect();
        if (song.duration) song.currentTime = (e.clientX - r.left) / r.width * song.duration;
    });

    playBtn.addEventListener('click', () => {
        if (started) {
            toggleSong();
            return;
        }
        started = true;
        playBtn.classList.remove('pulse');
        burst(...centre(playBtn), 46);
        if (hasSong) {
            song.play().catch(() => {});   // must be called straight from the tap
            mini.classList.add('on');
        }
        unlock(flowers);
        setTimeout(() => go(flowers), 500);
    });

    mini.addEventListener('click', toggleSong);

    /* Letter lines fade in as they scroll into view */
    const io = new IntersectionObserver(es => es.forEach(x => {
        if (x.isIntersecting) {
            x.target.classList.add('in');
            io.unobserve(x.target);
        }
    }), { threshold: .25 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    /* Scroll progress bar */
    addEventListener('scroll', () => {
        const h = document.documentElement.scrollHeight - innerHeight;
        $('#bar').style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
    }, { passive: true });

    /* Touch feel: hearts wherever you tap, a tiny buzz on buttons (Android) */
    addEventListener('pointerdown', e => { if (!e.target.closest('button')) burst(e.clientX, e.clientY, 7); });
    document.querySelectorAll('button').forEach(b =>
        b.addEventListener('click', () => navigator.vibrate && navigator.vibrate(30)));
})();
