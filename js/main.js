document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. ARCHITECTURAL ASSET PRELOADER (CINEMATIC ENTRY & ZERO-JANK CACHE)
    // ==========================================================================
    (function initPreloader() {
        const preloader = document.getElementById('site-preloader');
        if (!preloader) return;

        const progressBar = document.getElementById('preloader-progress-bar');
        const percentEl = document.getElementById('preloader-percent');
        const statusEl = document.getElementById('preloader-status');

        let progress = 0;
        let isDone = false;

        function updateProgress(val, statusText) {
            progress = Math.min(100, Math.max(progress, val));
            if (progressBar) progressBar.style.width = progress + '%';
            if (percentEl) percentEl.textContent = String(Math.floor(progress)).padStart(2, '0') + '%';
            if (statusEl && statusText) statusEl.textContent = statusText;
        }

        const assetsToPreload = [
            'bannertop.png',
            'assets/lumelabslogo.webp',
            'assets/lume-branding.webp',
            'assets/apex-logo.webp',
            'assets/apex-branding.webp'
        ];

        let loadedCount = 0;
        const totalCount = assetsToPreload.length + 1; // +1 for fonts

        function finishPreloader() {
            if (isDone) return;
            isDone = true;
            updateProgress(100, 'SYSTEMS ARMED // STUDIO READY');
            setTimeout(() => {
                preloader.classList.add('loaded');
                document.body.classList.add('page-ready');
            }, 220);
        }

        // Preload fonts
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                loadedCount++;
                updateProgress(Math.floor((loadedCount / totalCount) * 90), 'FONTS CACHED');
            }).catch(() => {});
        } else {
            loadedCount++;
        }

        // Preload core images in parallel
        assetsToPreload.forEach(src => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loadedCount++;
                const pct = Math.floor((loadedCount / totalCount) * 90);
                updateProgress(pct, `PRE-CACHING ${src.split('/').pop().toUpperCase()}`);
                if (loadedCount >= totalCount) {
                    finishPreloader();
                }
            };
            img.src = src;
        });

        // Fast safety cap: User is never blocked more than 950ms
        setTimeout(() => {
            finishPreloader();
        }, 950);
    })();

    // ==========================================================================
    // 2. LENIS HARDWARE-ACCELERATED SMOOTH SCROLLING (120 FPS FLUIDITY)
    // ==========================================================================
    let lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.25,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.05,
            touchMultiplier: 1.6,
            infinite: false
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Bind smooth anchor navigation (with -70px offset for the fixed header)
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetSelector = this.getAttribute('href');
                if (!targetSelector || targetSelector === '#') return;
                const target = document.querySelector(targetSelector);
                if (target) {
                    e.preventDefault();
                    lenis.scrollTo(target, { offset: -70, duration: 1.15 });
                }
            });
        });
    }

    // ==========================================================================
    // 3. ZERO-LAG MOUSE & AMBIENT FOLLOWER RING
    // ==========================================================================
    (function initCustomCursor() {
        const outline = document.querySelector('.cursor-outline');
        if (!outline) return;

        // Disable on touch screens
        if (window.matchMedia('(pointer: coarse)').matches || !window.matchMedia('(hover: hover)').matches) {
            outline.style.display = 'none';
            return;
        }

        let mouseX = -100, mouseY = -100;
        let outlineX = -100, outlineY = -100;
        let isVisible = false;
        let isHoveringInteractive = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!isVisible) {
                isVisible = true;
                outline.style.opacity = '1';
            }
            wakeUpCursorLoop();
        }, { passive: true });

        // Event-delegated hover ring expansion (0 overhead during mouse movement)
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            if (!target) return;
            const isInteractive = !!target.closest('a, button, [role="button"], input[type="submit"], .project-item, .web-card, .masonry-item, .nav-segment, .star-btn, .view-mode-pill, .interactive, .btn-submit, .btn-download-primary, .btn-download-secondary');
            if (isInteractive !== isHoveringInteractive) {
                isHoveringInteractive = isInteractive;
                if (isInteractive) {
                    outline.classList.add('cursor-hover');
                } else {
                    outline.classList.remove('cursor-hover');
                }
            }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            isVisible = false;
            outline.style.opacity = '0';
        });

        document.addEventListener('mouseenter', () => {
            isVisible = true;
            outline.style.opacity = '1';
        });

        let isCursorLoopActive = false;
        let cursorRafId = null;

        function wakeUpCursorLoop() {
            if (isCursorLoopActive) return;
            isCursorLoopActive = true;
            cursorRafId = requestAnimationFrame(renderCursor);
        }

        function renderCursor() {
            if (isVisible) {
                const dx = mouseX - outlineX;
                const dy = mouseY - outlineY;
                outlineX += dx * 0.35;
                outlineY += dy * 0.35;
                outline.style.transform = `translate3d(${outlineX.toFixed(1)}px, ${outlineY.toFixed(1)}px, 0) translate(-50%, -50%)`;

                if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
                    isCursorLoopActive = false;
                    cursorRafId = null;
                    return;
                }
            }
            cursorRafId = requestAnimationFrame(renderCursor);
        }
        wakeUpCursorLoop();
    })();

    // ==========================================================================
    // 4. HOVER REVEAL LOGIC (CACHED BOUNDS, ZERO FORCED REFLOWS)
    // ==========================================================================
    const projects = document.querySelectorAll('.project-item');
    projects.forEach(project => {
        const reveal = project.querySelector('.hover-reveal');
        if (reveal) {
            let rect = null;
            project.addEventListener('mouseenter', () => {
                rect = project.getBoundingClientRect();
            }, { passive: true });

            project.addEventListener('mouseleave', () => {
                rect = null;
            }, { passive: true });

            project.addEventListener('mousemove', (e) => {
                if (!rect) rect = project.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                reveal.style.transform = `translate3d(${x / 10}px, ${y / 10}px, 0) translate(-50%, -50%) rotate(-5deg)`;
            }, { passive: true });
        }
    });

    // ==========================================================================
    // BUTTER-SMOOTH EDITORIAL HEADER & CRAZY SCROLL MOTION CONTROLLER
    // ==========================================================================
    const navbar = document.querySelector('.navbar');
    const navProgressBar = document.getElementById('navbar-progress-bar');
    const heroBg = document.querySelector('.hero-bg');
    const heroTitle = document.querySelector('.hero-title');
    const heroScrollRight = document.querySelector('.hero-scroll-right');
    const marquees = document.querySelectorAll('.marquee-content');
    const navLinks = document.querySelectorAll('.navbar .nav-link');

    // Sections for live scrollspy
    const spySections = [
        { id: 'hero', el: document.querySelector('.hero-section'), navId: 'nav-item-home' },
        { id: 'ventures', el: document.getElementById('ventures'), navId: 'nav-item-services' },
        { id: 'work', el: document.getElementById('work'), navId: 'nav-item-projects' },
        { id: 'about', el: document.getElementById('about'), navId: 'nav-item-about' },
        { id: 'contact', el: document.getElementById('contact'), navId: 'nav-item-contact' }
    ].filter(s => s.el);

    let lastScrollY = window.scrollY || 0;
    let scrollDeltaAccum = 0;
    const SCROLL_THRESHOLD = 18; // Hysteresis threshold to prevent jitter

    function onScrollUpdate(currentY, velocity = 0) {
        if (currentY < 0) currentY = 0;

        // 1. Navbar scrolled visual state (translucent -> frosted glass elevation)
        if (navbar) {
            if (currentY > 25) {
                navbar.classList.add('navbar--scrolled');
            } else {
                navbar.classList.remove('navbar--scrolled');
            }

            // Directional hysteresis hide/show
            const diff = currentY - lastScrollY;
            if (Math.sign(diff) !== Math.sign(scrollDeltaAccum)) {
                scrollDeltaAccum = 0;
            }
            scrollDeltaAccum += diff;

            if (currentY <= 80) {
                navbar.classList.remove('navbar--hidden');
            } else if (scrollDeltaAccum > SCROLL_THRESHOLD && currentY > 120) {
                navbar.classList.add('navbar--hidden');
            } else if (scrollDeltaAccum < -SCROLL_THRESHOLD) {
                navbar.classList.remove('navbar--hidden');
            }

            // 2. Reading progress line
            if (navProgressBar) {
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                if (maxScroll > 0) {
                    const pct = Math.min(100, Math.max(0, (currentY / maxScroll) * 100));
                    navProgressBar.style.width = pct.toFixed(2) + '%';
                }
            }
        }

        lastScrollY = currentY;

        // 3. Hero Parallax & Camera Zoom Depth
        if (currentY <= 1000) {
            if (heroBg) {
                const bgY = (currentY * 0.32).toFixed(1);
                const bgScale = (1 + currentY * 0.00035).toFixed(4);
                heroBg.style.transform = `translate3d(0, ${bgY}px, 0) scale(${bgScale})`;
            }
            if (heroTitle) {
                const titleY = (currentY * -0.16).toFixed(1);
                const titleOpacity = Math.max(0, 1 - currentY / 620).toFixed(3);
                heroTitle.style.transform = `translate3d(0, ${titleY}px, 0)`;
                heroTitle.style.opacity = titleOpacity;
            }
            if (heroScrollRight) {
                const scrollIndicatorOpacity = Math.max(0, 1 - currentY / 180).toFixed(3);
                heroScrollRight.style.opacity = scrollIndicatorOpacity;
            }
        }

        // 4. Kinetic Scroll-Velocity Marquee Reactivity
        if (marquees.length && Math.abs(velocity) > 0.05) {
            const skewVal = Math.max(-2.5, Math.min(2.5, velocity * 0.12)).toFixed(2);
            marquees.forEach(m => {
                m.style.transform = `skewX(${skewVal}deg) translateZ(0)`;
            });
        }

        // 5. Active Section Scrollspy
        if (spySections.length && navLinks.length) {
            const viewportMiddle = currentY + window.innerHeight * 0.35;
            let currentActiveNavId = null;

            for (let i = spySections.length - 1; i >= 0; i--) {
                const sec = spySections[i];
                const top = sec.el.offsetTop;
                if (viewportMiddle >= top) {
                    currentActiveNavId = sec.navId;
                    break;
                }
            }

            if (currentActiveNavId) {
                navLinks.forEach(link => {
                    if (link.id === currentActiveNavId) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        }
    }

    // Connect to Lenis if available, otherwise throttled native scroll
    if (lenis) {
        lenis.on('scroll', (e) => {
            onScrollUpdate(e.scroll, e.velocity || 0);
        });
    } else {
        let isTicking = false;
        window.addEventListener('scroll', () => {
            if (!isTicking) {
                requestAnimationFrame(() => {
                    onScrollUpdate(window.scrollY, 0);
                    isTicking = false;
                });
                isTicking = true;
            }
        }, { passive: true });
    }

    // ==========================================================================
    // KINETIC INTERSECTION OBSERVER SCROLL REVEALS
    // ==========================================================================
    (function initScrollReveals() {
        const revealElements = [
            ...document.querySelectorAll('.section-header'),
            ...document.querySelectorAll('.venture-card'),
            ...document.querySelectorAll('.project-item'),
            ...document.querySelectorAll('.manifesto'),
            ...document.querySelectorAll('.tech-list li'),
            ...document.querySelectorAll('.download-row')
        ];

        revealElements.forEach((el, index) => {
            el.classList.add('scroll-reveal');
            if (el.classList.contains('venture-card')) {
                el.classList.add(index % 2 === 0 ? 'delay-1' : 'delay-2');
            } else if (el.tagName === 'LI') {
                el.classList.add(`delay-${Math.min(4, (index % 5) + 1)}`);
            }
        });

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                    }
                });
            }, {
                threshold: 0.12,
                rootMargin: '0px 0px -50px 0px'
            });

            revealElements.forEach(el => observer.observe(el));
        } else {
            revealElements.forEach(el => el.classList.add('is-revealed'));
        }
    })();

    // ==========================================================================
    // 3D PERSPECTIVE TILT & DYNAMIC GLARE ON VENTURE CARDS
    // ==========================================================================
    (function init3DCardTilt() {
        const ventureCards = document.querySelectorAll('.venture-card');
        if (!ventureCards.length) return;
        if (window.matchMedia('(pointer: coarse)').matches) return; // Skip on touch devices

        ventureCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY * -6).toFixed(2);
                const rotateY = ((x - centerX) / centerX * 6).toFixed(2);
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
                card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease';
            });

            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.1s ease-out, border-color 0.4s ease, box-shadow 0.4s ease';
            });
        });
    })();

    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }

    // --- Initialize Gallery ---
    loadGallery();
    loadWebProjects();
    loadVideoProjects();
    initSupabaseAuth();
    loadReviews();

    const seeMoreBtn = document.getElementById("btn-see-more-reviews");
    if (seeMoreBtn) {
        seeMoreBtn.addEventListener("click", () => {
            reviewsLimit = allLoadedReviews.length;
            renderReviewsFeed();
            seeMoreBtn.style.display = "none";
        });
    }

    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });
    }

    // --- Conditional Secret Vault Link (Completely hidden for normal users; only visible via secret link) ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('access') || urlParams.get('key') || urlParams.get('vault') || sessionStorage.getItem('vault_passcode');
        if (token && token.trim().length > 0) {
            sessionStorage.setItem('vault_passcode', token.trim());
            const navMenu = document.querySelector('.navbar .nav-menu');
            if (navMenu && !document.getElementById('secret-vault-nav-link')) {
                const vaultLink = document.createElement('a');
                vaultLink.id = 'secret-vault-nav-link';
                vaultLink.href = 'vault.html?access=' + encodeURIComponent(token.trim());
                vaultLink.className = 'nav-link';
                vaultLink.style.color = '#ff6b81';
                vaultLink.style.border = '1px solid rgba(255, 107, 129, 0.3)';
                vaultLink.style.padding = '4px 12px';
                vaultLink.style.borderRadius = '20px';
                vaultLink.style.background = 'rgba(255, 71, 87, 0.08)';
                vaultLink.title = 'Restricted Client Access';
                vaultLink.innerHTML = '[ VAULT &#x1F512; ]';
                navMenu.insertBefore(vaultLink, navMenu.firstChild);
            }
        }
    } catch (e) {}

    // --- Dynamic Active CV Sync Engine ---
    (async function syncActiveCv() {
        try {
            const res = await fetch('/api/get-cv?cb=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    const downloadBtn = document.getElementById('btn-download-portfolio');
                    const viewBtn = document.getElementById('btn-view-portfolio');
                    const downloadUrl = data.downloadUrl || data.url || '/api/download-cv?action=download';
                    const viewUrl = data.viewUrl || '/api/download-cv?action=view';
                    if (downloadBtn) {
                        downloadBtn.href = downloadUrl;
                        if (data.filename) downloadBtn.download = data.filename;
                    }
                    if (viewBtn) {
                        viewBtn.href = viewUrl;
                    }
                }
            }
        } catch (e) {
            // Silently fallback to static assets
        }
    })();
});

/**
 * High-performance gallery loader with native lazy loading & batch DOM fragment insertion
 */
async function loadGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    try {
        let images = [];
        try {
            const response = await fetch('images.json');
            if (response.ok) {
                images = await response.json();
            }
        } catch (e) {
            console.warn('Fallback loading images.json:', e);
        }

        if (!images || images.length === 0) return;

        const fragment = document.createDocumentFragment();

        images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'masonry-item';

            item.innerHTML = `
                <div class="watermark-container" id="container-${index}">
                    <img src="${image.src}" alt="${image.alt || 'Portfolio Work'}" loading="lazy" decoding="async">
                    <div class="watermark-text">© NETHULA SANVIDU</div>
                    <div class="overlay">
                        <span class="view-text">VIEW [ + ]</span>
                    </div>
                </div>
            `;
            item.addEventListener('click', () => openLightbox(item));
            fragment.appendChild(item);
        });

        gallery.innerHTML = '';
        gallery.appendChild(fragment);
        console.log(`Rendered ${images.length} gallery items instantaneously with native lazy loading.`);
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

/**
 * On-demand Canvas watermark generator (only called if explicitly needed for export)
 */
function applyPermanentWatermark(source, containerId, text = "NETHULA SANVIDU") {
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.src = source;

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const fontSize = Math.max(canvas.width * 0.05, 24); 
        ctx.font = `bold ${fontSize}px "Syncopate", sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const watermarkedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const finalImg = document.createElement('img');
        finalImg.src = watermarkedDataUrl;
        
        const container = document.getElementById(containerId);
        if (container) container.prepend(finalImg);
    };
}

function openLightbox(element) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const img = element.querySelector('img');

    if (img && lightbox && lightboxImg) {
        lightbox.style.display = 'flex';
        lightboxImg.src = img.src; 
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Fetches and displays web projects dynamically from Vercel Serverless API
 */
async function loadWebProjects() {
    const container = document.getElementById('web-projects-container');
    if (!container) return;

    try {
        const response = await fetch('/api/get-web-projects');
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const projects = await response.json();
        
        // If there are no projects in Cloudinary, show clean empty state
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-gallery" style="grid-column: 1 / -1; padding: 50px 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.12); border-radius: 12px; background: rgba(255,255,255,0.02); font-family: var(--font-main); color: #888;">
                    <i class="ri-code-box-line" style="font-size: 2.2rem; color: #555; display: block; margin-bottom: 12px;"></i>
                    <span style="color: #f4f4f5; letter-spacing: 2px; font-family: var(--font-display); font-size: 0.85rem; font-weight: 600;">NO WEB EXPERIENCES PUBLISHED YET</span><br>
                    <span style="font-size: 0.75rem; color: #71717a; display: block; margin-top: 6px;">Web projects published through the Admin Terminal will appear here automatically.</span>
                </div>
            `;
            return;
        }

        // Clear container and render projects dynamically
        container.innerHTML = '';

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'web-card';
            
            const hasMockup = project.has_mockup !== false && project.src;
            const previewMediaHtml = hasMockup
                ? `<div class="img-container" style="position: relative;">
                    <img src="${project.src}" alt="${project.title}">
                    <div class="watermark-text" style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; opacity: 0.3; font-family: var(--font-display); color: #fff;">
                        © NETHULA SANVIDU
                    </div>
                </div>`
                : `<div class="img-container no-mockup-frame" style="position: relative; min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 35%, rgba(255,255,255,0.06) 0%, rgba(10,10,12,0.96) 80%); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 35px 20px; overflow: hidden;">
                    <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; opacity: 0.45;"></div>
                    <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; position: relative; z-index: 1;">
                        <i class="ri-global-line" style="font-size: 1.6rem; color: #ffffff;"></i>
                    </div>
                    <div style="font-family: var(--font-display); font-size: 0.72rem; letter-spacing: 3px; color: rgba(255,255,255,0.5); text-transform: uppercase; position: relative; z-index: 1;">
                        LIVE DIGITAL PLATFORM
                    </div>
                    <div style="font-family: var(--font-main); font-size: 0.95rem; color: #f4f4f5; font-weight: 500; margin-top: 6px; letter-spacing: 0.5px; position: relative; z-index: 1;">
                        ${project.display_url || 'Active Web System'}
                    </div>
                    <div class="watermark-text" style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; opacity: 0.25; font-family: var(--font-display); color: #fff;">
                        © NETHULA SANVIDU
                    </div>
                </div>`;

            // Build the card HTML mimicking the browser look
            card.innerHTML = `
                <div class="web-preview">
                    <div class="browser-bar">
                        <div class="dot red"></div>
                        <div class="dot yellow"></div>
                        <div class="dot green"></div>
                        <span class="url">${project.display_url || 'project-preview.dev'}</span>
                    </div>
                    ${previewMediaHtml}
                </div>
                <div class="web-info">
                    <div class="card-meta-tags">
                        <span class="card-tag">WEB PLATFORM</span>
                        <span class="card-tag">INTERACTIVE</span>
                    </div>
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <a href="${project.url || '#'}" target="_blank" class="btn-visit" ${!project.url || project.url === '#' ? 'style="pointer-events:none; opacity:0.5;"' : ''}>
                        ${!project.url || project.url === '#' ? 'COMING SOON' : 'EXPLORE PLATFORM <i class="ri-arrow-right-up-line"></i>'}
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
        console.log('Loaded web projects from Vercel API successfully.');
    } catch (error) {
        console.warn('Failed to load dynamic web projects. Showing static fallbacks:', error);
    }
}

/**
 * Fetches and displays video projects dynamically from Vercel Serverless API
 */
async function loadVideoProjects() {
    const container = document.getElementById('video-projects-container');
    if (!container) return;

    try {
        const response = await fetch('/api/get-video-projects');
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const videos = await response.json();
        
        // If there are no videos in Cloudinary, show clean empty state
        if (videos.length === 0) {
            container.innerHTML = `
                <div class="empty-gallery" style="grid-column: 1 / -1; padding: 50px 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.12); border-radius: 12px; background: rgba(255,255,255,0.02); font-family: var(--font-main); color: #888;">
                    <i class="ri-film-line" style="font-size: 2.2rem; color: #555; display: block; margin-bottom: 12px;"></i>
                    <span style="color: #f4f4f5; letter-spacing: 2px; font-family: var(--font-display); font-size: 0.85rem; font-weight: 600;">NO VIDEO EDITS PUBLISHED YET</span><br>
                    <span style="font-size: 0.75rem; color: #71717a; display: block; margin-top: 6px;">Motion and video reels published through the Admin Terminal will appear here automatically.</span>
                </div>
            `;
            return;
        }

        // Clear container and render video cards dynamically
        container.innerHTML = '';

        videos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'web-card';
            
            // Build the card HTML mimicking the web card or a video card look
            card.innerHTML = `
                <div class="web-preview">
                    <div class="browser-bar">
                        <div class="dot red"></div>
                        <div class="dot yellow"></div>
                        <div class="dot green"></div>
                        <span class="url">transmission-reel.mp4</span>
                    </div>
                    <div class="img-container" style="position: relative; aspect-ratio: 16/9; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center;">
                        <img src="${video.src}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;">
                        <a href="${video.url || '#'}" target="_blank" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); text-decoration: none;">
                            <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 2rem; transition: all 0.3s ease; box-shadow: 0 4px 30px rgba(0,0,0,0.1); cursor: pointer;" onmouseover="this.style.transform='scale(1.1)'; this.style.backgroundColor='rgba(255,255,255,0.25)';" onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='rgba(255,255,255,0.15)';">
                                <i class="ri-play-fill" style="margin-left: 4px;"></i>
                            </div>
                        </a>
                        <div class="watermark-text" style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; opacity: 0.3; font-family: var(--font-main); color: #fff;">
                            © NETHULA SANVIDU
                        </div>
                    </div>
                </div>
                <div class="web-info">
                    <div class="card-meta-tags">
                        <span class="card-tag">VISUAL REEL</span>
                        <span class="card-tag">PREMIERE PRO</span>
                        <span class="card-tag">CREATIVE EDIT</span>
                    </div>
                    <h3>${video.title}</h3>
                    <p>${video.description}</p>
                    <a href="${video.url || '#'}" target="_blank" class="btn-visit" ${!video.url || video.url === '#' ? 'style="pointer-events:none; opacity:0.5;"' : ''}>
                        ${!video.url || video.url === '#' ? 'COMING SOON' : 'WATCH REEL <i class="ri-play-mini-line"></i>'}
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
        console.log('Loaded video projects from Vercel API successfully.');
    } catch (error) {
        console.warn('Failed to load dynamic video projects. Showing static fallbacks:', error);
    }
}

// --- Supabase & Reviews Integration ---
const SUPABASE_URL = "https://nzdnarjczuwyyojopiiv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZG5hcmpjenV3eXlvam9waWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM0ODEsImV4cCI6MjA5Nzk2OTQ4MX0.xqjKimgW8UwK2kSO4OMRZfRft0eJUMx7cIKza9jyzWY";

let supabaseClient = null;
let currentSession = null;
let selectedStarRating = 0;
let allLoadedReviews = [];
let reviewsLimit = 3;

function initSupabaseAuth() {
    if (typeof supabase === 'undefined') {
        console.warn("Supabase SDK not loaded yet.");
        return;
    }
    
    // Initialize Supabase Client
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check current session state
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        handleAuthSession(session);
    });

    // Listen to auth state changes
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        handleAuthSession(session);
    });
}

function handleAuthSession(session) {
    currentSession = session;
    const loggedOutBlock = document.getElementById("auth-logged-out");
    const reviewForm = document.getElementById("review-form");
    
    if (!loggedOutBlock || !reviewForm) return;

    if (session) {
        // User logged in!
        loggedOutBlock.style.display = "none";
        reviewForm.style.display = "flex";

        const user = session.user;
        const nameText = document.getElementById("user-name");
        const userAvatar = document.getElementById("user-avatar");
        const placeholderAvatar = document.getElementById("user-avatar-placeholder");

        if (nameText) {
            nameText.textContent = user.user_metadata?.full_name || user.email || "Anonymous";
        }

        const avatarUrl = user.user_metadata?.avatar_url;
        if (avatarUrl && userAvatar && placeholderAvatar) {
            userAvatar.src = avatarUrl;
            userAvatar.style.display = "block";
            placeholderAvatar.style.display = "none";
        } else if (userAvatar && placeholderAvatar) {
            userAvatar.style.display = "none";
            placeholderAvatar.style.display = "flex";
            const firstLetter = (user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase();
            placeholderAvatar.textContent = firstLetter;
        }
    } else {
        // User logged out!
        loggedOutBlock.style.display = "block";
        reviewForm.style.display = "none";
    }
}

async function loginWithSupabase(provider) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error("Login failed:", err);
        alert(`Authentication failed: ${err.message}`);
    }
}

async function logoutSupabase() {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    } catch (err) {
        console.error("Sign out failed:", err);
    }
}

// Star Rating UI Handlers
function setStarRating(rating) {
    selectedStarRating = rating;
    document.getElementById("review-rating-value").value = rating;
    
    const stars = document.querySelectorAll(".star-rating-selector .star-btn");
    stars.forEach((star, idx) => {
        if (idx < rating) {
            star.classList.add("active");
            star.classList.replace("ri-star-line", "ri-star-fill");
        } else {
            star.classList.remove("active");
            star.classList.replace("ri-star-fill", "ri-star-line");
        }
    });
}

function hoverStarRating(rating) {
    const stars = document.querySelectorAll(".star-rating-selector .star-btn");
    stars.forEach((star, idx) => {
        if (idx < rating) {
            star.classList.add("hovered");
        } else {
            star.classList.remove("hovered");
        }
    });
}

function resetStarRatingHover() {
    const stars = document.querySelectorAll(".star-rating-selector .star-btn");
    stars.forEach(star => {
        star.classList.remove("hovered");
    });
}

async function submitReview(event) {
    event.preventDefault();

    const nameInput = document.getElementById("review-author-name");
    const roleInput = document.getElementById("review-author-role");
    const ratingVal = parseInt(document.getElementById("review-rating-value").value, 10);
    const commentVal = (document.getElementById("review-comment").value || "").trim();
    const submitBtn = document.getElementById("btn-submit-review");

    const authorName = (currentSession?.user?.user_metadata?.full_name || currentSession?.user?.email || nameInput?.value || "").trim();
    const authorRole = (roleInput?.value || "Client Transmission").trim();

    if (!authorName) {
        alert("Please enter your name or studio identity.");
        if (nameInput) nameInput.focus();
        return;
    }

    if (!ratingVal || ratingVal < 1) {
        alert("Please select a star rating (1 to 5 stars).");
        return;
    }
    if (!commentVal) {
        alert("Review comment cannot be empty.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> TRANSMITTING...';

    const headers = { 'Content-Type': 'application/json' };
    if (currentSession?.access_token) {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`;
    }

    try {
        const response = await fetch('/api/add-review', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                name: authorName,
                role: authorRole,
                rating: ratingVal,
                comment: commentVal
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Server returned ${response.status}`);
        }

        const data = await response.json();
        if (data.result === 'ok') {
            const successBox = document.getElementById("review-status-success");
            if (successBox) successBox.style.display = "block";

            document.getElementById("review-comment").value = "";
            if (nameInput && !currentSession) nameInput.value = "";
            if (roleInput) roleInput.value = "";
            setStarRating(0);

            // Add the new review to the global state and re-render
            allLoadedReviews.unshift(data.review);
            renderReviewsFeed();

            setTimeout(() => {
                if (successBox) successBox.style.display = "none";
            }, 5000);
        } else {
            throw new Error(data.error || 'Failed to submit review');
        }
    } catch (err) {
        console.error("Error submitting review:", err);
        alert(`TRANSMISSION FAILED: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'SUBMIT REVIEW <i class="ri-send-plane-line"></i>';
    }
}

async function loadReviews() {
    try {
        const response = await fetch('/api/get-reviews');
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        // Filter out any mock/placeholder reviews
        allLoadedReviews = (Array.isArray(data) ? data : []).filter(
            r => r && !r.id?.toString().startsWith('placeholder-') && r.name !== 'Sarah Jenkins' && r.name !== 'Michael Chen'
        );
        renderReviewsFeed();
    } catch (err) {
        console.error("Failed to load reviews:", err);
        allLoadedReviews = [];
        renderReviewsFeed();
    }
}

function renderReviewsFeed() {
    const feed = document.getElementById("reviews-feed");
    const seeMoreBtn = document.getElementById("btn-see-more-reviews");
    if (!feed) return;

    feed.innerHTML = '';

    if (allLoadedReviews.length === 0) {
        feed.innerHTML = '<div class="empty-gallery">No transmissions received yet. Be the first to leave a review!</div>';
        if (seeMoreBtn) seeMoreBtn.style.display = "none";
        return;
    }

    // Render up to reviewsLimit
    const reviewsToRender = allLoadedReviews.slice(0, reviewsLimit);
    reviewsToRender.forEach((review, index) => {
        const card = createReviewCardElement(review, false, index);
        feed.appendChild(card);
    });

    // Control visibility of "See More Reviews" button
    if (seeMoreBtn) {
        if (allLoadedReviews.length > reviewsLimit) {
            seeMoreBtn.style.display = "block";
        } else {
            seeMoreBtn.style.display = "none";
        }
    }
}

function createReviewCardElement(review, isNew = false, index = 0) {
    const card = document.createElement("div");
    card.className = "review-card" + (isNew ? " new-review-animate" : "");
    
    const safeName = escapeHtml(review.name || 'Verified Client');
    const safeComment = escapeHtml(review.comment || '');

    let dateStr = "Just now";
    if (review.created_at) {
        const dateObj = new Date(review.created_at);
        dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= review.rating) {
            starsHtml += '<i class="ri-star-fill"></i>';
        } else {
            starsHtml += '<i class="ri-star-line"></i>';
        }
    }

    let avatarHtml = `<div class="avatar-placeholder">${safeName.charAt(0).toUpperCase()}</div>`;
    if (review.avatar_url && (review.avatar_url.startsWith('https://') || review.avatar_url.startsWith('http://'))) {
        avatarHtml = `<img src="${encodeURI(review.avatar_url)}" alt="${safeName}">`;
    }

    card.innerHTML = `
        <div class="review-card-header">
            ${avatarHtml}
            <div class="review-card-meta">
                <span class="review-card-name">${safeName}</span>
                <span class="review-card-date">${dateStr}</span>
            </div>
            <div class="review-card-stars">
                ${starsHtml}
            </div>
        </div>
        <p class="review-card-comment">${safeComment}</p>
    `;

    return card;
}

/**
 * XSS Sanitization Defense Helper
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
