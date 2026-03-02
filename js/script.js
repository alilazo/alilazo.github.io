window.onload = function () {
    // Blob Cursor logic
    const mainBlob = document.querySelector('.main-blob');
    const secondaryBlobs = document.querySelectorAll('.secondary-blob');
    const hoverables = document.querySelectorAll('.hoverable');

    let isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (!isMobile && mainBlob) {
        const cursorWrapper = document.querySelector(".cursor-wrapper");
        if (cursorWrapper) cursorWrapper.style.opacity = 1;

        // Move blobs with different delays for a liquid effect
        document.body.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;

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
            if (e.target.closest(hoverSelector)) {
                gsap.to('.cursor-wrapper', { duration: 0.2, opacity: 0 });
            }
        });

        document.body.addEventListener('mouseout', (e) => {
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