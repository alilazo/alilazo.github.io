(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preview = new URLSearchParams(window.location.search).get('intro') === 'preview';
    const storageKey = 'amado-intro-seen';
    if (motion.matches || (window.location.hash && !preview)) return;

    // Storage is optional: if it is unavailable, go straight to the portfolio.
    try {
        if (!preview && sessionStorage.getItem(storageKey)) return;
        if (!preview) sessionStorage.setItem(storageKey, '1');
    } catch (_) { return; }

    const root = document.documentElement;
    let active = true;
    let intro = null;
    let background = [];
    let failSafe;

    const finish = (restoreFocus = false) => {
        if (!active) return;
        active = false;
        window.clearTimeout(failSafe);
        root.classList.remove('intro-pending');
        background.forEach(([element, wasInert]) => { element.inert = wasInert; });
        intro = intro || document.getElementById('siteIntro');
        if (intro) {
            if (intro.contains(document.activeElement)) document.activeElement.blur();
            intro.hidden = true;
            intro.setAttribute('aria-hidden', 'true');
        }
        if (restoreFocus) document.querySelector('.nav-brand')?.focus({ preventScroll: true });
        motion.removeEventListener('change', onMotionChange);
        document.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('animationend', onAnimationEnd);
    };
    const onMotionChange = () => { if (motion.matches) finish(); };
    const onClick = event => {
        if (event.target.closest('#introSkip')) finish(true);
    };
    const onKeyDown = event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            finish(true);
        } else if (event.key === 'Tab') {
            event.preventDefault();
            document.getElementById('introSkip')?.focus({ preventScroll: true });
        }
    };
    const onAnimationEnd = event => {
        if (event.animationName === 'intro-curtain-up' && event.target.closest('#siteIntro')) finish();
    };

    // The independent timeout also releases the page if another script fails.
    root.classList.add('intro-pending');
    failSafe = window.setTimeout(() => finish(), 2600);
    motion.addEventListener('change', onMotionChange);
    // Delegated controls work even while unrelated deferred scripts are loading.
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('animationend', onAnimationEnd);
    window.addEventListener('pagehide', () => finish(), { once: true });

    document.addEventListener('DOMContentLoaded', () => {
        if (!active) return;
        intro = document.getElementById('siteIntro');
        const skip = document.getElementById('introSkip');
        if (!intro || !skip || getComputedStyle(intro).position !== 'fixed') {
            finish();
            return;
        }
        background = [...document.body.children]
            .filter(element => element !== intro && element.tagName !== 'SCRIPT')
            .map(element => [element, element.inert]);
        background.forEach(([element]) => { element.inert = true; });
        intro.hidden = false;
        intro.setAttribute('aria-hidden', 'false');
        skip.focus({ preventScroll: true });
    }, { once: true });
})();
