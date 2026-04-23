window.onload = function () {
    // Blob Cursor logic
    const mainBlob = document.querySelector('.main-blob');
    const secondaryBlobs = document.querySelectorAll('.secondary-blob');
    const hoverables = document.querySelectorAll('.hoverable');
    const cursorWrapper = document.querySelector(".cursor-wrapper");
    const cursor = document.querySelector(".cursor");

    let isMobile = window.matchMedia("(max-width: 768px)").matches;
    let customCursorEnabled = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let zeroGravityEnabled = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const syncCustomCursorState = () => {
        customCursorEnabled = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

        if (!cursorWrapper || !cursor) return;

        cursorWrapper.style.display = customCursorEnabled ? 'block' : 'none';
        cursorWrapper.style.opacity = 0;
        cursor.style.opacity = 0;
    };

    const syncZeroGravityState = () => {
        zeroGravityEnabled = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

        if (!zeroGravityEnabled && zeroGravityActive) {
            disableZeroGravity();
        }
    };

    syncCustomCursorState();
    syncZeroGravityState();

    if (mainBlob) {
        // Move blobs with different delays for a liquid effect
        document.body.addEventListener('mousemove', (e) => {
            if (!customCursorEnabled) return;

            const { clientX, clientY } = e;

            if (cursorWrapper) cursorWrapper.style.opacity = 1;
            if (cursor) cursor.style.opacity = 1;

            gsap.to(mainBlob, {
                duration: 0.2,
                x: clientX - 20,
                y: clientY - 20,
                ease: "power2.out"
            });

            secondaryBlobs.forEach((blob, index) => {
                gsap.to(blob, {
                    duration: 0.4 + (index * 0.15),
                    x: clientX - 12,
                    y: clientY - 12,
                    ease: "power3.out"
                });
            });
        });

        // Hide cursor when hovering over text and interactive elements
        const hoverSelector = 'a, button, input, textarea, p, h1, h2, h3, h4, h5, h6, span, li, .card, .project-card, .hoverable, img';

        document.body.addEventListener('mouseover', (e) => {
            if (!customCursorEnabled) return;
            if (e.target.closest(hoverSelector)) {
                gsap.to('.cursor-wrapper', { duration: 0.2, opacity: 0 });
            }
        });

        document.body.addEventListener('mouseout', (e) => {
            if (!customCursorEnabled) return;
            // Only restore if we are leaving a hoverable element to go to a non-hoverable one
            if (e.target.closest(hoverSelector)) {
                // Determine if the new target is also hoverable
                if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(hoverSelector)) {
                    gsap.to('.cursor-wrapper', { duration: 0.2, opacity: 1 });
                }
            }
        });
    }

    // Typed.js
    const typedEl = document.querySelector('.typewriter');
    if (typedEl) {
        new Typed('.typewriter', {
            strings: [
                'I build scalable, modern web applications.',
                'I specialize in AI & Full-Stack Development.',
                'I love minimalist, functional design.'
            ],
            typeSpeed: 40,
            backSpeed: 20,
            loop: true,
            cursorChar: '_',
        });
    }

    // Zero Gravity Easter Egg
    const zeroGravityCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    const zeroGravityTargets = new Map();
    let zeroGravityActive = false;
    let zeroGravityFrame = null;
    let zeroGravityToastTimer = null;
    let zeroGravityKeyBuffer = [];
    const zeroGravityToast = document.createElement('div');
    zeroGravityToast.className = 'zero-gravity-toast';
    document.body.appendChild(zeroGravityToast);

    const zeroGravitySelector = [
        '.hero-text h1',
        '.hero-roles',
        '.hero-typewriter',
        '.hero-image-container',
        '.section-title',
        '.award-card',
        '.tip-card',
        '.skill-item',
        '.project-card',
        '.btn-custom',
        '.life-image-wrapper',
        '.contact-container',
        '.nav-brand',
        '.nav-link-custom',
        '.theme-switch',
        '.menu-toggle',
        '.social-links a'
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

        zeroGravityTargets.forEach((item) => {
            if (item.dragging) return;

            item.vx *= 0.985;
            item.vy *= 0.985;
            item.vr *= 0.985;

            if (Math.abs(item.vx) < 0.02) item.vx = 0;
            if (Math.abs(item.vy) < 0.02) item.vy = 0;
            if (Math.abs(item.vr) < 0.02) item.vr = 0;

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

        zeroGravityFrame = window.requestAnimationFrame(zeroGravityLoop);
    };

    const enableZeroGravity = () => {
        setupZeroGravityTargets();
        zeroGravityActive = true;
        document.body.classList.add('zero-gravity-active');

        zeroGravityTargets.forEach((item) => {
            item.element.classList.add('zero-gravity-item');
            item.element.style.willChange = 'transform';
            item.element.style.touchAction = 'none';
            item.element.style.zIndex = '2';
        });

        stopZeroGravityLoop();
        zeroGravityFrame = window.requestAnimationFrame(zeroGravityLoop);
        showZeroGravityToast('Zero gravity enabled. Drag and throw anything you see.');
    };

    const disableZeroGravity = () => {
        zeroGravityActive = false;
        document.body.classList.remove('zero-gravity-active');

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
        if (!zeroGravityEnabled) return;

        if (zeroGravityActive) {
            disableZeroGravity();
        } else {
            enableZeroGravity();
        }
    };

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
        const storedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', storedTheme);
        updateThemeButtons(storedTheme);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButtons(newTheme);
    };

    const updateThemeButtons = (theme) => {
        const btns = document.querySelectorAll('.theme-switch');
        btns.forEach(btn => {
            btn.innerText = theme === 'light' ? 'DARK MODE' : 'LIGHT MODE';
        });
    };

    document.querySelectorAll('.theme-switch').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
    initTheme();

    // Navigation hide/show on scroll (Desktop)
    let lastScrollTop = 0;
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        let scrollTop = window.scrollY || document.documentElement.scrollTop;

        // Update Scroll Progress bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.getElementById("scrollProgress").style.width = scrolled + "%";

        if (!isMobile) {
            if (scrollTop > window.innerHeight * 0.5) {
                navbar.classList.add('visible');
            } else {
                navbar.classList.remove('visible');
            }
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    });

    // Mobile Sandwich Menu
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileToggle && mobileOverlay) {
        const toggleMenu = () => {
            mobileToggle.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : '';
        };

        mobileToggle.addEventListener('click', toggleMenu);

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileOverlay.classList.contains('active')) toggleMenu();
            });
        });

        // Handle Resize Bug
        window.addEventListener('resize', () => {
            isMobile = window.matchMedia("(max-width: 768px)").matches;
            syncCustomCursorState();
            syncZeroGravityState();
            // Close mobile menu if resized to desktop
            if (!isMobile && mobileOverlay.classList.contains('active')) {
                mobileToggle.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Reveal Animations
    const revealElements = () => {
        const reveals = document.querySelectorAll(".reveal, .revealLR");
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        reveals.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                el.classList.add("active");
            }
        });
    };

    window.addEventListener("scroll", revealElements);
    revealElements(); // Trigger on load

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
};