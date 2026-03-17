document.addEventListener('DOMContentLoaded', () => {
    // 1. Custom Cursor Logic
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate(
                {
                    left: `${posX}px`,
                    top: `${posY}px`
                },
                {
                    duration: 500,
                    fill: 'forwards'
                }
            );
        });
    }

    // 2. Project Hover Image Reveal
    const projects = document.querySelectorAll('.project-item');

    projects.forEach(project => {
        const reveal = project.querySelector('.hover-reveal');

        // Only run this effect if .hover-reveal exists
        if (reveal) {
            project.addEventListener('mousemove', (e) => {
                const rect = project.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                reveal.style.transform = `translate(-50%, -50%) translate(${x / 10}px, ${y / 10}px) rotate(-5deg)`;
            });
        }
    });

    // 3. Smooth Scroll for same-page anchors only
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetSelector = this.getAttribute('href');
            const target = document.querySelector(targetSelector);

            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. Hero Image Scroll Effect
    const heroImage = document.querySelector('.hero-image-wrapper');

    if (heroImage) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;

            if (scrollPosition < window.innerHeight) {
                const opacity = 1 - (scrollPosition / 700);

                heroImage.style.transform = `translateY(${scrollPosition * -0.4}px)`;
                heroImage.style.opacity = opacity > 0 ? opacity : 0;
            }
        });
    }
});