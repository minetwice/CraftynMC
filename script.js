// ========================================
// Custom Cursor
// ========================================
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

if (cursor && cursorFollower) {
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        setTimeout(() => {
            cursorFollower.style.left = e.clientX + 'px';
            cursorFollower.style.top = e.clientY + 'px';
        }, 50);
    });

    // Add hover effect to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .nav-item, .service-card, .portfolio-item, .feature-card');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

// ========================================
// Preloader
// ========================================
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 3000);
});

// ========================================
// Slide Sidebar
// ========================================
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.querySelector('.sidebar-overlay');
const closeSidebar = document.querySelector('.close-sidebar');
const navLinks = document.querySelectorAll('.nav-link, .sidebar-nav a');

function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    menuToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebarFunc() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    menuToggle.classList.remove('active');
    document.body.style.overflow = '';
}

if (menuToggle) {
    menuToggle.addEventListener('click', openSidebar);
}

if (closeSidebar) {
    closeSidebar.addEventListener('click', closeSidebarFunc);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebarFunc);
}

// Close sidebar when clicking on nav links
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 992) {
            closeSidebarFunc();
        }
    });
});

// ========================================
// Header Scroll Effect
// ========================================
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ========================================
// Smooth Scroll for Navigation
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// Active Navigation Link on Scroll
// ========================================
const sections = document.querySelectorAll('section[id]');

function highlightNavLink() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        const sidebarLink = document.querySelector(`.sidebar-nav a[href="#${sectionId}"]`);
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (navLink) navLink.classList.add('active');
            if (sidebarLink) {
                sidebarLink.parentElement.classList.add('active');
            }
        }
    });
}

window.addEventListener('scroll', highlightNavLink);

// ========================================
// Counter Animation for Stats
// ========================================
const statNumbers = document.querySelectorAll('.stat-number');
let counterAnimated = false;

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function checkCounterVisibility() {
    if (counterAnimated) return;
    
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        
        if (isVisible) {
            counterAnimated = true;
            statNumbers.forEach(stat => animateCounter(stat));
        }
    }
}

window.addEventListener('scroll', checkCounterVisibility);
checkCounterVisibility();

// ========================================
// Portfolio Filter
// ========================================
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        const filterValue = btn.getAttribute('data-filter');
        
        portfolioItems.forEach(item => {
            const category = item.getAttribute('data-category');
            
            if (filterValue === 'all' || category === filterValue) {
                item.classList.remove('hidden');
                item.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                item.classList.add('hidden');
            }
        });
    });
});

// Add fadeIn animation dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

// ========================================
// Form Submission
// ========================================
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;
        
        // Simulate form submission
        setTimeout(() => {
            submitBtn.innerHTML = '<span>Message Sent!</span>';
            submitBtn.style.background = 'linear-gradient(135deg, #43e97b, #38f9d7)';
            
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
                contactForm.reset();
            }, 2000);
        }, 1500);
    });
}

// ========================================
// Parallax Effect for Hero Background
// ========================================
const heroBg = document.querySelector('.hero-bg');
const orbs = document.querySelectorAll('.gradient-orb');

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    if (heroBg) {
        heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
    
    orbs.forEach((orb, index) => {
        const speed = 0.2 + (index * 0.1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ========================================
// Intersection Observer for Animations
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            
            // Add specific animations based on element type
            if (entry.target.classList.contains('service-card')) {
                entry.target.style.animation = 'slideUp 0.6s ease forwards';
            } else if (entry.target.classList.contains('feature-card')) {
                entry.target.style.animation = 'slideInLeft 0.6s ease forwards';
            } else if (entry.target.classList.contains('portfolio-item')) {
                entry.target.style.animation = 'zoomIn 0.6s ease forwards';
            }
            
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements
document.querySelectorAll('.service-card, .feature-card, .portfolio-item, .info-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    observer.observe(el);
});

// Add additional animations
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-50px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes zoomIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(additionalStyles);

// ========================================
// Typing Effect for Hero Title (Optional Enhancement)
// ========================================
const heroTitleHighlight = document.querySelector('.title-line.highlight');

if (heroTitleHighlight) {
    const text = heroTitleHighlight.textContent;
    heroTitleHighlight.textContent = '';
    heroTitleHighlight.style.borderRight = '3px solid var(--primary-color)';
    
    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            heroTitleHighlight.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        } else {
            // Remove cursor after typing
            setTimeout(() => {
                heroTitleHighlight.style.borderRight = 'none';
            }, 500);
        }
    }
    
    // Start typing after initial animation
    setTimeout(typeWriter, 2200);
}

// ========================================
// Button Ripple Effect
// ========================================
document.querySelectorAll('.btn, .cta-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            left: ${x}px;
            top: ${y}px;
            width: 100px;
            height: 100px;
            margin-left: -50px;
            margin-top: -50px;
            pointer-events: none;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple keyframes
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyles);

// ========================================
// Magnetic Effect for CTA Button
// ========================================
const ctaBtn = document.querySelector('.header-cta');

if (ctaBtn) {
    ctaBtn.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        this.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    
    ctaBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translate(0, 0)';
    });
}

// ========================================
// Console Message
// ========================================
console.log('%c🚀 NEXGEN - Future of Design', 'font-size: 24px; font-weight: bold; color: #00f2ff;');
console.log('%cBuilt with ❤️ and cutting-edge technology', 'font-size: 14px; color: #7b2fff;');
