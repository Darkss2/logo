document.addEventListener('DOMContentLoaded', () => {
    // ===== Cache DOM =====
    const body = document.body;
    const themeSwitcher = document.querySelector('.theme-switcher');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.main-nav a');
    const copyMessage = document.getElementById('copyMessage');
    const statNumbers = document.querySelectorAll('.stat-number');
    const skillTicker = document.querySelector('.skill-ticker');
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const mainNav = document.querySelector('.main-nav');
    const logoImg = document.getElementById('site-logo');

    // ===== Mobile Navigation =====
    if (hamburgerBtn && mainNav) {
        hamburgerBtn.addEventListener('click', () => {
            body.classList.toggle('nav-open');
            mainNav.classList.toggle('is-open');
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (body.classList.contains('nav-open')) {
                    body.classList.remove('nav-open');
                    mainNav.classList.remove('is-open');
                }
            });
        });
    }

    // ===== Theme Switcher + Logo Swap =====
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-theme');
            if (isDark) {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
                if (logoImg) logoImg.src = 'logo montage dz black.svg';
            } else {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
                if (logoImg) logoImg.src = 'logo montage dz white.svg';
            }
        });
    }

    // Load saved theme (default dark)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        if (logoImg) logoImg.src = 'logo montage dz black.svg';
    } else {
        body.classList.add('dark-theme');
        if (logoImg) logoImg.src = 'logo montage dz white.svg';
    }

    // ===== Small utils =====
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // ===== Scroll nav active link =====
    const updateNavAndSections = debounce(() => {
        let current = '';
        const scrollY = window.pageYOffset;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (scrollY >= sectionTop) current = section.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
        });
    }, 10);
    window.addEventListener('scroll', updateNavAndSections);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                window.scrollTo({
                    top: targetId === '#home' ? 0 : targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== Video Slider arrows =====
    document.querySelectorAll('.video-section').forEach(section => {
        const slider = section.querySelector('.video-slider');
        const leftArrow = section.querySelector('.left-arrow');
        const rightArrow = section.querySelector('.right-arrow');
        if (!slider || !leftArrow || !rightArrow) return;

        const firstVideo = slider.querySelector('.video-wrapper');
        const scrollAmount = firstVideo ? firstVideo.offsetWidth * 1.5 : slider.clientWidth * 0.8;

        leftArrow.addEventListener('click', () => {
            slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        rightArrow.addEventListener('click', () => {
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        const updateArrowState = () => {
            const isAtEnd = (slider.scrollLeft + slider.clientWidth) >= (slider.scrollWidth - 5);
            leftArrow.style.opacity = slider.scrollLeft > 1 ? '1' : '0.3';
            rightArrow.style.opacity = isAtEnd ? '0.3' : '1';
        };
        slider.addEventListener('scroll', debounce(updateArrowState, 50), { passive: true });
        setTimeout(updateArrowState, 100);
        window.addEventListener('resize', debounce(updateArrowState, 200));
    });

    // ===== Copy contact info =====
    if (copyMessage) {
        document.querySelectorAll('.contact-item[data-copy]').forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.tagName.toLowerCase() === 'a' && (item.href.startsWith('mailto:') || item.href.startsWith('tel:'))) {
                    // allow default
                } else {
                    e.preventDefault();
                }
                const text = item.getAttribute('data-copy');
                if (text) {
                    navigator.clipboard.writeText(text).then(() => {
                        copyMessage.style.opacity = '1';
                        copyMessage.style.transform = 'translateX(-50%) translateY(0)';
                        setTimeout(() => {
                            copyMessage.style.opacity = '0';
                            copyMessage.style.transform = 'translateX(-50%) translateY(10px)';
                        }, 2000);
                    }).catch(err => console.error('Failed to copy text: ', err));
                }
            });
        });
    }

    // ===== Stat counters (on appear) =====
    const startStatCounters = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const stat = entry.target;
                const target = parseInt(stat.dataset.target);
                let current = 0;
                const duration = 2000;
                const stepTime = 10;
                const totalSteps = duration / stepTime;
                const increment = target / totalSteps;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        clearInterval(timer);
                        stat.innerText = target;
                    } else {
                        stat.innerText = Math.ceil(current);
                    }
                }, stepTime);
                observer.unobserve(stat);
            });
        }, { threshold: 0.5 });
        statNumbers.forEach(stat => observer.observe(stat));
    };

    // =====================================================================
    //            BULLETPROOF VIDEO LOGIC (single source of truth)
    // =====================================================================
    let currentPlaying = null;   // .video-container currently playing
    let clickLock = false;       // prevents race conditions on rapid clicks

    // Cleanly stop & reset a container
    const stopContainer = (container) => {
        if (!container) return;
        const iframe = container.querySelector('iframe');
        if (iframe) {
            try { iframe.src = ''; } catch (e) {} // stop audio safely
            iframe.remove();
        }
        container.classList.remove('playing');
        const thumb = container.querySelector('.video-thumbnail');
        if (thumb) thumb.style.opacity = '1';
        if (currentPlaying === container) currentPlaying = null;
    };

    // Start playing in a given container (assumes it’s not already playing)
    const playInContainer = (container, videoUrl) => {
        // Remove any existing iframe first (safety)
        stopContainer(container);

        const iframe = document.createElement('iframe');
        iframe.allow = 'autoplay';
        iframe.className = 'video-iframe';
        iframe.src = videoUrl + (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1';

        // Add iframe and mark playing
        container.appendChild(iframe);
        container.classList.add('playing');
        const thumb = container.querySelector('.video-thumbnail');
        if (thumb) thumb.style.opacity = '0';

        currentPlaying = container;
    };

    // Init thumbnails: lazy-load + click handlers
    const initializeVideoPlayback = () => {
        document.querySelectorAll('.video-thumbnail').forEach(thumbnail => {
            if (thumbnail.dataset.listenerAttached) return;
            thumbnail.dataset.listenerAttached = 'true';

            const videoUrl = thumbnail.getAttribute('data-video-url');

            // Lazy-load image itself
            const realSrc = thumbnail.src;
            thumbnail.src = '';
            const imgObserver = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    thumbnail.src = realSrc;
                    imgObserver.disconnect();
                }
            });
            imgObserver.observe(thumbnail);

            const activate = (event) => {
                event.preventDefault();
                if (clickLock) return;
                clickLock = true;

                const container = thumbnail.closest('.video-container');
                if (!container) { clickLock = false; return; }

                // On phones: open new tab to keep it simple/fast
                if (window.innerWidth <= 768) {
                    window.open(videoUrl, '_blank');
                    // no playing state in-page for mobile; just release lock
                    clickLock = false;
                    return;
                }

                // If clicking the same container that is already playing -> toggle off
                if (container.classList.contains('playing')) {
                    stopContainer(container);
                    clickLock = false;
                    return;
                }

                // If another container is playing, stop it first (anywhere on the page)
                if (currentPlaying && currentPlaying !== container) {
                    stopContainer(currentPlaying);
                }

                // Now play in the chosen container
                playInContainer(container, videoUrl);

                // Release the lock shortly after DOM updates
                setTimeout(() => { clickLock = false; }, 120);
            };

            thumbnail.addEventListener('click', activate);
            thumbnail.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') activate(e);
            });
        });
    };

    // Optional: stop current video if user scrolls it far off-screen (stability + perf)
    const enableAutoStopOffscreen = () => {
        if (!('IntersectionObserver' in window)) return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && entry.target.classList.contains('playing')) {
                    // If the currently playing one goes off-screen, stop it
                    stopContainer(entry.target);
                }
            });
        }, { threshold: 0.05 });
        document.querySelectorAll('.video-container').forEach(vc => observer.observe(vc));
    };

    // ===== Pause animations when off-screen =====
    if (skillTicker) {
        const tickerObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                skillTicker.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
            });
        }, { threshold: 0 });
        tickerObserver.observe(skillTicker);
    }

    document.querySelectorAll('.float-icon').forEach(icon => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                icon.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
            });
        });
        observer.observe(icon);
    });

    // ===== Init =====
    startStatCounters();
    initializeVideoPlayback();
    enableAutoStopOffscreen();
    updateNavAndSections();

    // (Optional helper) Stop video when user clicks outside any playing container
    document.addEventListener('click', (e) => {
        if (!currentPlaying) return;
        const isInside = e.target.closest('.video-container') === currentPlaying;
        if (!isInside) stopContainer(currentPlaying);
    });
});
