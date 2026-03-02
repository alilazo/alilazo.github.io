window.onload = function () {
    // Cursor
    const bigBall = document.querySelector('.cursor__ball--big');
    const smallBall = document.querySelector('.cursor__ball--small');
    const hoverables = document.querySelectorAll('.hoverable');

    let isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (!isMobile) {
        const cursorEl = document.querySelector(".cursor");
        if (cursorEl) cursorEl.style.opacity = 1;

        // Move cursor
        document.body.addEventListener('mousemove', (e) => {
            gsap.to(bigBall, {
                duration: 0.5,
                x: e.clientX - 20,
                y: e.clientY - 20
            });
            gsap.to(smallBall, {
                duration: 0.1,
                x: e.clientX - 5,
                y: e.clientY - 5
            });
        });

        // Hover effects
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(bigBall, { duration: 0.3, scale: 2, backgroundColor: 'rgba(230, 57, 70, 0.2)' });
                gsap.to(smallBall, { duration: 0.3, opacity: 0 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(bigBall, { duration: 0.3, scale: 1, backgroundColor: 'transparent' });
                gsap.to(smallBall, { duration: 0.3, opacity: 1 });
            });
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
            // Close mobile menu if resized to desktop
            if (!isMobile && mobileOverlay.classList.contains('active')) {
                mobileToggle.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            // Handle cursor visibility
            if (!isMobile) {
                document.querySelector(".cursor").style.opacity = 1;
            } else {
                document.querySelector(".cursor").style.opacity = 0;
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