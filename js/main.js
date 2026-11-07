document.addEventListener('DOMContentLoaded', () => {
    // --- Precision 60/120 FPS Fluid Cursor Engine ---
    (function initCustomCursor() {
        const dot = document.querySelector('.cursor-dot');
        const outline = document.querySelector('.cursor-outline');
        if (!dot || !outline) return;

        // On touch screens or devices without fine pointer, disable custom cursor entirely
        if (window.matchMedia('(pointer: coarse)').matches || !window.matchMedia('(hover: hover)').matches) {
            dot.style.display = 'none';
            outline.style.display = 'none';
            document.body.style.cursor = 'auto';
            return;
        }

        let mouseX = -100, mouseY = -100;
        let outlineX = -100, outlineY = -100;
        let isVisible = false;
        let isHoveringInteractive = false;
        let isOverTextInput = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!isVisible) {
                isVisible = true;
                dot.style.opacity = '1';
                outline.style.opacity = '1';
            }

            // Direct hardware-accelerated transform for center dot (zero sensory lag)
            dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
            wakeUpCursorLoop();

            // Detect text inputs to show native caret for seamless typing
            const target = e.target;
            const isText = target && (
                target.tagName === 'TEXTAREA' ||
                (target.tagName === 'INPUT' && !['button','submit','checkbox','radio','range','file'].includes(target.type)) ||
                target.isContentEditable
            );

            if (isText !== isOverTextInput) {
                isOverTextInput = isText;
                if (isText) {
                    dot.style.opacity = '0';
                    outline.style.opacity = '0';
                    document.body.style.cursor = 'text';
                } else {
                    dot.style.opacity = '1';
                    outline.style.opacity = '1';
                    document.body.style.cursor = 'none';
                }
            }

            // Detect interactive hover (links, buttons, clickable cards)
            const isInteractive = !!target.closest('a, button, [role="button"], input[type="submit"], .project-item, .web-card, .masonry-item, .nav-segment, .star-btn, .view-mode-pill, .interactive, .btn-submit');
            if (isInteractive !== isHoveringInteractive) {
                isHoveringInteractive = isInteractive;
                if (isInteractive) {
                    outline.classList.add('cursor-hover');
                } else {
                    outline.classList.remove('cursor-hover');
                }
            }
        }, { passive: true });

        // Hide cleanly when cursor exits viewport window
        document.addEventListener('mouseleave', () => {
            isVisible = false;
            dot.style.opacity = '0';
            outline.style.opacity = '0';
        });

        document.addEventListener('mouseenter', () => {
            if (!isOverTextInput) {
                isVisible = true;
                dot.style.opacity = '1';
                outline.style.opacity = '1';
            }
        });

        // Silky 60/120 FPS lerp loop with smart idle sleeping
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
                outlineX += dx * 0.2;
                outlineY += dy * 0.2;
                outline.style.transform = `translate3d(${outlineX.toFixed(1)}px, ${outlineY.toFixed(1)}px, 0) translate(-50%, -50%)`;

                if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
                    isCursorLoopActive = false;
                    cursorRafId = null;
                    return; // Sleep when settled!
                }
            }
            cursorRafId = requestAnimationFrame(renderCursor);
        }
        wakeUpCursorLoop();
    })();

    // --- Hover Reveal Logic ---
    const projects = document.querySelectorAll('.project-item');
    projects.forEach(project => {
        const reveal = project.querySelector('.hover-reveal');
        if (reveal) {
            project.addEventListener('mousemove', (e) => {
                const rect = project.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                reveal.style.transform = `translate(-50%, -50%) translate(${x / 10}px, ${y / 10}px) rotate(-5deg)`;
            });
        }
    });

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetSelector = this.getAttribute('href');
            const target = document.querySelector(targetSelector);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Navbar Hide/Show on Scroll ---
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY && window.scrollY > 50) {
                navbar.classList.add('navbar--hidden');
            } else {
                navbar.classList.remove('navbar--hidden');
            }
            lastScrollY = window.scrollY;
        });
    }

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
});

/**
 * Loads images from JSON and triggers the permanent watermark process
 */
async function loadGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    try {
        let images = [];
        try {
            // Try fetching dynamically from Cloudinary first (using cache-buster to prevent cached 401 errors)
            const cacheBuster = new Date().getTime();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 900);
            const response = await fetch(`https://res.cloudinary.com/dwcsjrhhl/image/list/portfolio.json?cb=${cacheBuster}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                images = data.resources.map(img => ({
                    src: `https://res.cloudinary.com/dwcsjrhhl/image/upload/v${img.version}/${img.public_id}.${img.format}`,
                    alt: img.public_id
                }));
                console.log('Loaded gallery from Cloudinary tag list dynamically');
            } else {
                throw new Error('Cloudinary tag list not enabled or returned error status');
            }
        } catch (cloudinaryError) {
            // Fall back to local images.json if Cloudinary list is restricted or offline
            console.warn('Cloudinary dynamic load failed. Falling back to local images.json:', cloudinaryError);
            const response = await fetch('images.json');
            images = await response.json();
        }

        gallery.innerHTML = '';

        images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'masonry-item';

            item.innerHTML = `
                <div class="watermark-container" id="container-${index}">
                    <div class="overlay">
                        <span class="view-text">VIEW [ + ]</span>
                    </div>
                </div>
            `;
            gallery.appendChild(item);

            // Using your branding
            applyPermanentWatermark(image.src, `container-${index}`, "NETHULA SANVIDU");

            item.addEventListener('click', () => openLightbox(item));
        });
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

/**
 * Uses Canvas to merge text and image into a single downloadable file
 * Centers the watermark horizontally and vertically (no rotation)
 */
function applyPermanentWatermark(source, containerId, text) {
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.src = source;

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Watermark Style
        const fontSize = Math.max(canvas.width * 0.05, 24); 
        ctx.font = `bold ${fontSize}px "Syncopate", sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // Subtle opacity for center placement
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw text exactly in the center
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // Convert canvas to DataURL (permanent watermark)
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
            
            // Build the card HTML mimicking the browser look
            card.innerHTML = `
                <div class="web-preview">
                    <div class="browser-bar">
                        <div class="dot red"></div>
                        <div class="dot yellow"></div>
                        <div class="dot green"></div>
                        <span class="url">${project.display_url || 'project-preview.dev'}</span>
                    </div>
                    <div class="img-container" style="position: relative;">
                        <img src="${project.src}" alt="${project.title}">
                        <div class="watermark-text" style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; opacity: 0.3; font-family: var(--font-display); color: #fff;">
                            © NETHULA SANVIDU
                        </div>
                    </div>
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

    let avatarHtml = `<div class="avatar-placeholder">${review.name.charAt(0).toUpperCase()}</div>`;
    if (review.avatar_url) {
        avatarHtml = `<img src="${review.avatar_url}" alt="${review.name}">`;
    }

    card.innerHTML = `
        <div class="review-card-header">
            ${avatarHtml}
            <div class="review-card-meta">
                <span class="review-card-name">${review.name}</span>
                <span class="review-card-date">${dateStr}</span>
            </div>
            <div class="review-card-stars">
                ${starsHtml}
            </div>
        </div>
        <p class="review-card-comment">${review.comment}</p>
    `;

    return card;
}