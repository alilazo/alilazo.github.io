document.addEventListener('DOMContentLoaded', () => {
    const cursorWrapper = document.querySelector('.cursor-wrapper');
    const cursorFollower = cursorWrapper?.querySelector('.cursor-follower');
    const cursorLabel = cursorWrapper?.querySelector('.cursor-label');
    const gravityPlayground = document.querySelector('.gravity-playground');
    const gravityToggle = document.getElementById('gravityToggle');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let customCursorEnabled = finePointer.matches && !reducedMotion.matches;
    let zeroGravityEnabled = customCursorEnabled;
    let zeroGravityActive = false;
    let zeroGravityFrame = null;
    let zeroGravityToastTimer = null;
    let zeroGravityKeyBuffer = [];

    const syncCustomCursorState = () => {
        customCursorEnabled = finePointer.matches && !reducedMotion.matches;
        if (!cursorWrapper) return;
        cursorWrapper.hidden = !customCursorEnabled;
        cursorWrapper.style.opacity = 0;
    };

    const syncZeroGravityState = () => {
        zeroGravityEnabled = finePointer.matches && !reducedMotion.matches && window.innerWidth > 768;
        if (gravityPlayground) gravityPlayground.hidden = !zeroGravityEnabled;

        if (!zeroGravityEnabled && zeroGravityActive) {
            disableZeroGravity();
        }
    };

    syncCustomCursorState();
    syncZeroGravityState();

    // Coalesce pointer updates; no idle animation loop or external dependency.
    let cursorFrame = null;
    let pointerX = 0;
    let pointerY = 0;
    document.addEventListener('pointermove', (event) => {
        if (!customCursorEnabled || !cursorWrapper || event.pointerType === 'touch') return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        cursorWrapper.style.opacity = 1;
        cursorWrapper.classList.toggle('is-interactive', !!event.target.closest('a, button'));
        const label = zeroGravityActive && event.target.closest('.zero-gravity-item') ? 'Drag'
            : event.target.closest('.portrait-toggle') ? 'Color'
            : event.target.closest('.project-card-trigger') ? 'View' : '';
        cursorWrapper.classList.toggle('has-label', !!label);
        if (cursorLabel && cursorLabel.textContent !== label) cursorLabel.textContent = label;
        if (cursorFrame) return;
        cursorFrame = requestAnimationFrame(() => {
            if (cursorFollower) cursorFollower.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
            cursorFrame = null;
        });
    }, { passive: true });
    const hideCursor = () => { if (cursorWrapper) cursorWrapper.style.opacity = 0; };
    document.documentElement.addEventListener('pointerleave', hideCursor);
    document.querySelectorAll('iframe').forEach(frame => frame.addEventListener('pointerenter', hideCursor));
    window.addEventListener('blur', hideCursor);
    document.addEventListener('keydown', hideCursor);
    [finePointer, reducedMotion].forEach(media => media.addEventListener('change', () => {
        syncCustomCursorState();
        syncZeroGravityState();
    }));

    const portrait = document.querySelector('.portrait-toggle');
    let portraitFrame = null;
    let portraitX = 0.5;
    let portraitY = 0.5;
    const positionPortraitReveal = (event) => {
        const rect = portrait.getBoundingClientRect();
        portraitX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        portraitY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        portrait.style.setProperty('--portrait-x', `${portraitX * 100}%`);
        portrait.style.setProperty('--portrait-y', `${portraitY * 100}%`);
    };
    portrait?.addEventListener('pointermove', event => {
        if (!customCursorEnabled || zeroGravityActive || event.pointerType === 'touch') return;
        positionPortraitReveal(event);
        if (portraitFrame) return;
        portraitFrame = requestAnimationFrame(() => {
            portrait.style.setProperty('--portrait-tilt-x', `${(0.5 - portraitY) * 7}deg`);
            portrait.style.setProperty('--portrait-tilt-y', `${(portraitX - 0.5) * 7}deg`);
            portraitFrame = null;
        });
    }, { passive: true });
    const resetPortraitTilt = () => {
        if (portraitFrame) cancelAnimationFrame(portraitFrame);
        portraitFrame = null;
        portrait?.style.removeProperty('--portrait-tilt-x');
        portrait?.style.removeProperty('--portrait-tilt-y');
    };
    portrait?.addEventListener('pointerleave', resetPortraitTilt);
    reducedMotion.addEventListener('change', resetPortraitTilt);
    portrait?.addEventListener('click', event => {
        if (event.detail) positionPortraitReveal(event);
        else {
            portrait.style.setProperty('--portrait-x', '50%');
            portrait.style.setProperty('--portrait-y', '50%');
        }
        const showColor = portrait.getAttribute('aria-pressed') !== 'true';
        portrait.setAttribute('aria-pressed', String(showColor));
        portrait.setAttribute('aria-label', showColor ? 'Show portrait in black and white' : 'Show portrait in color');
    });
    document.querySelector('.hero-img')?.classList.add('portrait-ready');

    // Lazy-load below-the-fold photography without hiding content behind JS.
    document.querySelectorAll('main img').forEach(image => {
        image.loading = 'lazy';
        image.decoding = 'async';
    });

    // Zero Gravity Easter Egg
    const zeroGravityCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    const zeroGravityTargets = new Map();
    const zeroGravityToast = document.createElement('div');
    zeroGravityToast.className = 'zero-gravity-toast';
    zeroGravityToast.setAttribute('role', 'status');
    document.body.appendChild(zeroGravityToast);

    const zeroGravitySelector = [
        '.hero-text h1',
        '.hero-roles',
        '.hero-image-container',
        '.section-title',
        '.impact-card',
        '.built-for',
        '.project-category-title',
        '.featured-tool-cta',
        '.award-card',
        '.tip-card',
        '.status-card',
        '.skill-item',
        '.project-card',
        '.life-image-wrapper',
        '.contact-container'
    ].join(', ');

    const showZeroGravityToast = (message) => {
        if (!zeroGravityEnabled) return;
        zeroGravityToast.textContent = message;
        zeroGravityToast.classList.add('visible');
        window.clearTimeout(zeroGravityToastTimer);
        zeroGravityToastTimer = window.setTimeout(() => {
            zeroGravityToast.classList.remove('visible');
        }, 2600);
    };

    const renderZeroGravityItem = (item) => {
        item.element.style.transform = `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rotation}deg)`;
    };

    const setupZeroGravityTargets = () => {
        zeroGravityTargets.clear();

        document.querySelectorAll(zeroGravitySelector).forEach((element, index) => {
            zeroGravityTargets.set(element, {
                id: index,
                element,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                rotation: 0,
                vr: 0,
                dragging: false,
                moved: false,
                pointerId: null,
                lastClientX: 0,
                lastClientY: 0,
                lastTimestamp: 0
            });
        });
    };

    const stopZeroGravityLoop = () => {
        if (zeroGravityFrame) {
            window.cancelAnimationFrame(zeroGravityFrame);
            zeroGravityFrame = null;
        }
    };

    const zeroGravityLoop = () => {
        if (!zeroGravityActive) {
            stopZeroGravityLoop();
            return;
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let hasMotion = false;

        zeroGravityTargets.forEach((item) => {
            if (item.dragging || (!item.vx && !item.vy && !item.vr)) return;

            item.vx *= 0.985;
            item.vy *= 0.985;
            item.vr *= 0.985;

            if (Math.abs(item.vx) < 0.02) item.vx = 0;
            if (Math.abs(item.vy) < 0.02) item.vy = 0;
            if (Math.abs(item.vr) < 0.02) item.vr = 0;
            if (item.vx || item.vy || item.vr) hasMotion = true;

            item.x += item.vx;
            item.y += item.vy;
            item.rotation += item.vr;
            renderZeroGravityItem(item);

            const rect = item.element.getBoundingClientRect();
            const isNearViewport = rect.bottom > -150 && rect.top < viewportHeight + 150;

            if (!isNearViewport) return;

            if (rect.left < 0) {
                item.x += -rect.left;
                item.vx = Math.abs(item.vx) * 0.9;
            }

            if (rect.right > viewportWidth) {
                item.x -= rect.right - viewportWidth;
                item.vx = -Math.abs(item.vx) * 0.9;
            }

            if (rect.top < 0) {
                item.y += -rect.top;
                item.vy = Math.abs(item.vy) * 0.9;
            }

            if (rect.bottom > viewportHeight) {
                item.y -= rect.bottom - viewportHeight;
                item.vy = -Math.abs(item.vy) * 0.9;
            }

            renderZeroGravityItem(item);
        });

        zeroGravityFrame = hasMotion ? window.requestAnimationFrame(zeroGravityLoop) : null;
    };

    const enableZeroGravity = () => {
        setupZeroGravityTargets();
        zeroGravityActive = true;
        document.body.classList.add('zero-gravity-active');
        gravityToggle?.setAttribute('aria-pressed', 'true');
        if (gravityToggle) gravityToggle.querySelector('span').textContent = 'Reset gravity';
        resetPortraitTilt();

        zeroGravityTargets.forEach((item) => {
            item.element.classList.add('zero-gravity-item');
            item.element.style.touchAction = 'none';
            item.element.style.zIndex = '2';
        });

        stopZeroGravityLoop();
        zeroGravityFrame = window.requestAnimationFrame(zeroGravityLoop);
        showZeroGravityToast('Gravity is off. Drag and toss the work. Press Escape to reset.');
    };

    const disableZeroGravity = () => {
        zeroGravityActive = false;
        document.body.classList.remove('zero-gravity-active');
        gravityToggle?.setAttribute('aria-pressed', 'false');
        if (gravityToggle) gravityToggle.querySelector('span').textContent = 'Play with gravity';

        zeroGravityTargets.forEach((item) => {
            item.element.classList.remove('zero-gravity-item', 'zero-gravity-dragging');
            item.element.style.transform = '';
            item.element.style.willChange = '';
            item.element.style.touchAction = '';
            item.element.style.zIndex = '';
            item.x = 0;
            item.y = 0;
            item.vx = 0;
            item.vy = 0;
            item.rotation = 0;
            item.vr = 0;
            item.dragging = false;
            item.moved = false;
            item.pointerId = null;
        });

        stopZeroGravityLoop();
        showZeroGravityToast('Zero gravity disabled.');
    };

    const toggleZeroGravity = () => {
        if (!zeroGravityEnabled || document.body.classList.contains('project-modal-open') || document.body.classList.contains('menu-open')) return;

        if (zeroGravityActive) {
            disableZeroGravity();
        } else {
            enableZeroGravity();
        }
    };

    gravityToggle?.addEventListener('click', toggleZeroGravity);

    document.addEventListener('visibilitychange', () => {
        hideCursor();
        if (document.hidden) stopZeroGravityLoop();
        else if (zeroGravityActive && !zeroGravityFrame) zeroGravityFrame = requestAnimationFrame(zeroGravityLoop);
    });

    const handleZeroGravityPointerDown = (event) => {
        if (!zeroGravityEnabled || !zeroGravityActive) return;

        const target = event.target.closest('.zero-gravity-item');
        if (!target) return;

        const item = zeroGravityTargets.get(target);
        if (!item) return;

        item.dragging = true;
        item.moved = false;
        item.pointerId = event.pointerId;
        item.lastClientX = event.clientX;
        item.lastClientY = event.clientY;
        item.lastTimestamp = performance.now();
        item.vx = 0;
        item.vy = 0;
        item.vr = 0;
        item.element.classList.add('zero-gravity-dragging');
        item.element.setPointerCapture?.(event.pointerId);
        event.preventDefault();
    };

    const handleZeroGravityPointerMove = (event) => {
        if (!zeroGravityEnabled || !zeroGravityActive) return;

        zeroGravityTargets.forEach((item) => {
            if (!item.dragging || item.pointerId !== event.pointerId) return;

            const now = performance.now();
            const deltaTime = Math.max(now - item.lastTimestamp, 16);
            const deltaX = event.clientX - item.lastClientX;
            const deltaY = event.clientY - item.lastClientY;

            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                item.moved = true;
            }

            item.x += deltaX;
            item.y += deltaY;
            item.vx = deltaX / (deltaTime / 16.67);
            item.vy = deltaY / (deltaTime / 16.67);
            item.rotation += deltaX * 0.08;
            item.vr = deltaX * 0.02;
            item.lastClientX = event.clientX;
            item.lastClientY = event.clientY;
            item.lastTimestamp = now;
            renderZeroGravityItem(item);
            event.preventDefault();
        });
    };

    const handleZeroGravityPointerEnd = (event) => {
        if (!zeroGravityEnabled) return;

        zeroGravityTargets.forEach((item) => {
            if (!item.dragging || item.pointerId !== event.pointerId) return;

            item.dragging = false;
            item.pointerId = null;
            item.element.classList.remove('zero-gravity-dragging');
            item.element.releasePointerCapture?.(event.pointerId);
        });
        if (zeroGravityActive && !zeroGravityFrame) zeroGravityFrame = requestAnimationFrame(zeroGravityLoop);
    };

    document.addEventListener('pointerdown', handleZeroGravityPointerDown, { passive: false });
    document.addEventListener('pointermove', handleZeroGravityPointerMove, { passive: false });
    document.addEventListener('pointerup', handleZeroGravityPointerEnd);
    document.addEventListener('pointercancel', handleZeroGravityPointerEnd);

    document.addEventListener('click', (event) => {
        if (!zeroGravityEnabled || !zeroGravityActive) return;

        const target = event.target.closest('.zero-gravity-item');
        if (!target) return;

        const item = zeroGravityTargets.get(target);
        if (item?.moved) {
            event.preventDefault();
            event.stopPropagation();
            item.moved = false;
        }
    }, true);

    document.addEventListener('keydown', (event) => {
        if (!zeroGravityEnabled) return;
        if (event.key === 'Escape' && zeroGravityActive) {
            disableZeroGravity();
            return;
        }

        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
            return;
        }

        zeroGravityKeyBuffer.push(event.key);
        if (zeroGravityKeyBuffer.length > zeroGravityCode.length) {
            zeroGravityKeyBuffer.shift();
        }

        if (zeroGravityCode.every((key, index) => zeroGravityKeyBuffer[index] === key)) {
            zeroGravityKeyBuffer = [];
            toggleZeroGravity();
        }
    });

    // Dark Mode Logic
    const initTheme = () => {
        updateThemeButtons(document.documentElement.getAttribute('data-theme'));
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        try { localStorage.setItem('theme', newTheme); } catch (_) { /* Theme still works without storage. */ }
        updateThemeButtons(newTheme);
    };

    const updateThemeButtons = (theme) => {
        const btns = document.querySelectorAll('.theme-switch');
        btns.forEach(btn => {
            btn.innerText = theme === 'light' ? 'DARK MODE' : 'LIGHT MODE';
            btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        });
    };

    document.querySelectorAll('.theme-switch').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
    initTheme();

    // Reading progress updates once per frame, without layout-changing width animation.
    const progress = document.getElementById('scrollProgress');
    let progressFrame = null;
    const updateProgress = () => {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.transform = `scaleX(${height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0})`;
        progressFrame = null;
    };
    window.addEventListener('scroll', () => {
        if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
    }, { passive: true });
    updateProgress();

    // Mobile navigation supports Escape, focus containment, and focus return.
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileToggle && mobileOverlay) {
        const backgroundElements = [document.querySelector('header.headerClass'), document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
        const setMenu = (open, restoreFocus = true) => {
            mobileToggle.classList.toggle('active', open);
            mobileToggle.setAttribute('aria-expanded', String(open));
            mobileToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
            mobileOverlay.hidden = !open;
            mobileOverlay.inert = !open;
            mobileOverlay.classList.toggle('active', open);
            document.body.classList.toggle('menu-open', open);
            backgroundElements.forEach(element => { element.inert = open; });
            if (open) mobileLinks[0]?.focus({ preventScroll: true });
            else if (restoreFocus) mobileToggle.focus({ preventScroll: true });
        };
        mobileToggle.addEventListener('click', () => setMenu(mobileOverlay.hidden));
        document.querySelector('.nav-brand')?.addEventListener('click', () => {
            if (!mobileOverlay.hidden) setMenu(false, false);
        });
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                setMenu(false, false);
                const destination = document.querySelector(link.getAttribute('href'));
                if (destination) {
                    destination.setAttribute('tabindex', '-1');
                    destination.focus({ preventScroll: true });
                }
            });
        });
        document.addEventListener('keydown', event => {
            if (mobileOverlay.hidden) return;
            if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
            if (event.key !== 'Tab') return;
            const focusables = [mobileToggle, ...mobileOverlay.querySelectorAll('a[href], button')];
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
        window.addEventListener('resize', () => {
            syncZeroGravityState();
            if (window.innerWidth >= 1200 && !mobileOverlay.hidden) {
                setMenu(false, false);
                document.querySelector('.nav-brand')?.focus({ preventScroll: true });
            }
        });
    }

    // Filters progressively enhance the complete, always-readable project list.
    const filterBar = document.querySelector('.project-filters');
    const categories = [...document.querySelectorAll('.project-category')];
    const filterAnimations = new Set();
    const cancelFilterAnimations = () => {
        filterAnimations.forEach(animation => animation.cancel());
        filterAnimations.clear();
    };
    reducedMotion.addEventListener('change', cancelFilterAnimations);
    categories.forEach(category => {
        const heading = category.querySelector('.project-category-title');
        category.dataset.category = heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const count = document.createElement('span');
        count.className = 'project-count';
        count.setAttribute('aria-hidden', 'true');
        count.textContent = String(category.querySelectorAll('.project-card').length).padStart(2, '0');
        heading.appendChild(count);
    });
    if (filterBar) {
        filterBar.hidden = false;
        filterBar.addEventListener('click', event => {
            const selected = event.target.closest('[data-filter]');
            if (!selected) return;
            if (selected.getAttribute('aria-pressed') === 'true') return;
            cancelFilterAnimations();
            const filter = selected.dataset.filter;
            filterBar.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
            let count = 0;
            categories.forEach(category => {
                category.hidden = filter !== 'all' && category.dataset.category !== filter;
                if (!category.hidden) count += category.querySelectorAll('.project-card').length;
            });
            if (!reducedMotion.matches) {
                const visibleCards = categories.filter(category => !category.hidden)
                    .flatMap(category => [...category.querySelectorAll('.project-card')]).slice(0, 4);
                visibleCards.forEach((card, index) => {
                    const animation = card.animate([
                        { clipPath: 'inset(0 0 8% 0)', opacity: 0.45 },
                        { clipPath: 'inset(0)', opacity: 1 }
                    ], { duration: 320, delay: index * 35, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
                    filterAnimations.add(animation);
                    animation.finished.then(() => filterAnimations.delete(animation), () => filterAnimations.delete(animation));
                });
            }
            document.getElementById('projectFilterStatus').textContent = `${count} projects shown. ${selected.textContent.trim()}.`;
            updateProgress();
        });
    }

    const navigationLinks = [...document.querySelectorAll('.nav-link-custom[href^="#"]')];
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navigationLinks.forEach(link => {
                if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));

    // Project detail modal
    const projectModal = document.getElementById('projectModal');
    const projectModalPanel = projectModal?.querySelector('.project-modal-panel');
    const projectModalClose = projectModal?.querySelector('.project-modal-close');
    const projectModalImage = projectModal?.querySelector('.project-modal-image');
    const projectModalTitle = projectModal?.querySelector('.project-modal-title');
    const projectModalDescription = projectModal?.querySelector('.project-modal-description');
    const projectModalLink = projectModal?.querySelector('.project-modal-link');
    let activeProjectCard = null;
    let lastProjectTrigger = null;
    let projectModalCloseTimer = null;
    const modalBackground = [...document.querySelectorAll('body > nav, body > header, body > main, body > footer')];

    const setProjectModalOrigin = (card) => {
        if (!projectModalPanel || !card) return;

        const cardRect = card.getBoundingClientRect();
        const panelRect = projectModalPanel.getBoundingClientRect();
        const startX = cardRect.left + (cardRect.width / 2) - (panelRect.left + (panelRect.width / 2));
        const startY = cardRect.top + (cardRect.height / 2) - (panelRect.top + (panelRect.height / 2));
        const scaleX = Math.max(0.2, Math.min(1, cardRect.width / panelRect.width));
        const scaleY = Math.max(0.2, Math.min(1, cardRect.height / panelRect.height));
        const rotate = cardRect.left + (cardRect.width / 2) < (window.innerWidth / 2) ? '-2.5deg' : '2.5deg';

        projectModalPanel.style.setProperty('--project-modal-start-x', `${startX}px`);
        projectModalPanel.style.setProperty('--project-modal-start-y', `${startY}px`);
        projectModalPanel.style.setProperty('--project-modal-start-scale-x', scaleX);
        projectModalPanel.style.setProperty('--project-modal-start-scale-y', scaleY);
        projectModalPanel.style.setProperty('--project-modal-start-rotate', rotate);
    };

    const getProjectModalFocusables = () => Array.from(projectModalPanel?.querySelectorAll(
        'button:not([disabled]), a[href]:not([hidden]), [tabindex]:not([tabindex="-1"])'
    ) || []);

    const openProjectModal = (card, trigger) => {
        if (!projectModal || !projectModalPanel || zeroGravityActive) return;

        const image = card.querySelector('.project-img-wrapper img');
        const title = card.querySelector('.project-title');
        const descriptions = card.querySelectorAll('.project-desc');
        const link = card.querySelector('.project-content .btn-custom');
        if (!image || !title) return;

        window.clearTimeout(projectModalCloseTimer);
        activeProjectCard = card;
        lastProjectTrigger = trigger;
        projectModalImage.src = image.currentSrc || image.src;
        projectModalImage.alt = image.alt;
        projectModalTitle.textContent = title.textContent.trim();
        projectModalDescription.replaceChildren(...Array.from(descriptions, (description) => description.cloneNode(true)));

        if (link) {
            projectModalLink.href = link.href;
            projectModalLink.textContent = link.textContent.trim();
            projectModalLink.target = link.target;
            projectModalLink.rel = link.target === '_blank' ? 'noopener' : '';
            projectModalLink.hidden = false;
        } else {
            projectModalLink.hidden = true;
            projectModalLink.removeAttribute('href');
            projectModalLink.removeAttribute('target');
            projectModalLink.removeAttribute('rel');
        }

        projectModal.hidden = false;
        projectModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('project-modal-open');
        modalBackground.forEach(element => { element.inert = true; });
        setProjectModalOrigin(card);
        projectModal.classList.add('is-visible');

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                projectModal.classList.add('is-open');
                projectModalClose.focus({ preventScroll: true });
            });
        });
    };

    const closeProjectModal = () => {
        if (!projectModal?.classList.contains('is-visible')) return;

        setProjectModalOrigin(activeProjectCard);
        projectModal.classList.remove('is-open');
        modalBackground.forEach(element => { element.inert = false; });
        lastProjectTrigger?.focus({ preventScroll: true });
        projectModal.setAttribute('aria-hidden', 'true');

        projectModalCloseTimer = window.setTimeout(() => {
            projectModal.classList.remove('is-visible');
            projectModal.hidden = true;
            projectModalImage.removeAttribute('src');
            document.body.classList.remove('project-modal-open');
            activeProjectCard = null;
            lastProjectTrigger = null;
        }, reducedMotion.matches ? 0 : 500);
    };

    if (projectModal) {
        document.querySelectorAll('.project-card').forEach((card) => {
            const title = card.querySelector('.project-title')?.textContent.trim() || 'project';
            const trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'project-card-trigger';
            trigger.setAttribute('aria-label', `View ${title} details`);
            trigger.setAttribute('aria-haspopup', 'dialog');
            trigger.addEventListener('click', () => openProjectModal(card, trigger));
            card.appendChild(trigger);
        });

        projectModalClose.addEventListener('click', closeProjectModal);
        projectModal.addEventListener('click', (event) => {
            if (event.target === projectModal) closeProjectModal();
        });

        document.addEventListener('keydown', (event) => {
            if (!projectModal.classList.contains('is-open')) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closeProjectModal();
                return;
            }

            if (event.key === 'Tab') {
                const focusables = getProjectModalFocusables();
                if (!focusables.length) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    // --- Analytics Tracking: Section Views ---
    const trackSectionView = () => {
        const sections = document.querySelectorAll('section[id], header.headerClass');
        const trackedSections = new Set();

        const observerOptions = {
            root: null,
            threshold: 0.5 // Trigger when 50% of the section is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id || 'Hero';
                    if (!trackedSections.has(sectionId)) {
                        // Umami track event
                        if (window.umami && typeof window.umami.track === 'function') {
                            window.umami.track('Section Viewed', {
                                section: sectionId
                            });
                            trackedSections.add(sectionId);
                        }
                    }
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    };

    trackSectionView();
});
