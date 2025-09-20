// FormSubmit Configuration
const FORMSUBMIT_EMAIL = 'greensunenergy1622@gmail.com';

// Domain validation for security
function isValidEnvironment() {
    const allowedDomains = [
        'greensunenergyservices.co.in'
    ];
    const currentDomain = window.location.hostname;
    
    // Allow GitHub Pages domains (username.github.io or custom domain)
    const isGitHubPages = currentDomain.includes('.github.io') || 
                         currentDomain === 'greensunenergyservices.co.in';
    
    return allowedDomains.includes(currentDomain) || isGitHubPages;
}

// Rate limiting to prevent spam
function checkRateLimit() {
    const lastSubmission = localStorage.getItem('lastFormSubmission');
    const now = Date.now();
    const cooldownPeriod = 30000; // 30 seconds
    
    if (lastSubmission && (now - parseInt(lastSubmission)) < cooldownPeriod) {
        return false;
    }
    
    localStorage.setItem('lastFormSubmission', now.toString());
    return true;
}

// Theme Management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.setTheme(this.currentTheme);
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        
        // Update header background immediately on theme change
        const navManager = window.navigationManager;
        if (navManager) {
            navManager.handleScroll();
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

// Navigation Management
class NavigationManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.hamburger = document.getElementById('hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.init();
    }

    init() {
        this.handleScroll();
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        window.addEventListener('scroll', () => this.handleScroll());
    }

    handleScroll() {
        const header = document.querySelector('.header');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (window.scrollY > 100) {
            if (isDark) {
                header.style.background = 'rgba(17, 24, 39, 0.98)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
            }
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            if (isDark) {
                header.style.background = 'rgba(17, 24, 39, 0.95)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
            header.style.boxShadow = 'none';
        }
    }

    setupMobileMenu() {
        this.hamburger.addEventListener('click', () => {
            this.navMenu.classList.toggle('active');
            this.hamburger.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.navMenu.classList.remove('active');
                this.hamburger.classList.remove('active');
            });
        });
    }

    setupSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Animation Manager
class AnimationManager {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupCounterAnimations();
        this.setupHoverEffects();
    }

    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, this.observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll(
            '.service-card, .project-card, .team-card, .metric-card, .about-text, .contact-card'
        );
        
        animateElements.forEach(el => {
            observer.observe(el);
        });
    }

    setupCounterAnimations() {
        const counters = document.querySelectorAll('.metric-number');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.textContent.replace(/[^0-9]/g, ''));
        const suffix = element.textContent.replace(/[0-9]/g, '');
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, 40);
    }

    setupHoverEffects() {
        // Add hover effects to cards
        const cards = document.querySelectorAll('.service-card, .project-card, .team-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
}

// Form Manager
class FormManager {
    constructor() {
        this.form = document.querySelector('.form');
        this.setupFormSubmit();
        this.init();
    }

    setupFormSubmit() {
        // Configure form for FormSubmit
        if (this.form && isValidEnvironment()) {
            this.form.action = `https://formsubmit.co/${FORMSUBMIT_EMAIL}`;
            this.form.method = 'POST';
            
            // Add hidden fields for FormSubmit configuration
            this.addHiddenField('_subject', 'New Contact Form Submission - Green Sun Energy Services');
            this.addHiddenField('_captcha', 'false');
            this.addHiddenField('_template', 'table');
        }
    }

    addHiddenField(name, value) {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = name;
        hiddenField.value = value;
        this.form.appendChild(hiddenField);
    }

    isValidEmailDomain(email) {
        // Extract domain from email
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!emailDomain) return false;
        
        // Define allowed email domains
        const allowedEmailDomains = [
            'gmail.com',
            'yahoo.com',
            'outlook.com',
            'hotmail.com',
            'icloud.com',
            'protonmail.com',
            'greensunenergyservices.co.in'
        ];
        
        return allowedEmailDomains.includes(emailDomain);
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.setupFormValidation();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Security checks
        if (!isValidEnvironment()) {
            this.showErrorMessage('Invalid environment detected.');
            return;
        }
        
        if (!checkRateLimit()) {
            this.showErrorMessage('Please wait before submitting another message.');
            return;
        }
        
        // Get form data
        const formData = new FormData(this.form);
        const name = formData.get('name');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const message = formData.get('message');
        
        // Basic validation
        if (!name || !email || !message) {
            this.showErrorMessage('Please fill in all required fields.');
            return;
        }
        
        // Domain validation for email sender
        if (!this.isValidEmailDomain(email)) {
            this.showErrorMessage('Email submissions are restricted to authorized domains only.');
            return;
        }
        
        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Submit form using FormSubmit
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                this.showSuccessMessage('Message sent successfully! We will get back to you soon.');
                this.form.reset();
            } else {
                throw new Error('Form submission failed');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showErrorMessage('Failed to send message. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    setupFormValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error
        this.clearFieldError(field);

        // Validation rules
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (field.type === 'tel' && value && !this.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.style.borderColor = '#ef4444';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.style.borderColor = '';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    showSuccessMessage(text = 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.') {
        this.showMessage(text, '#10b981');
    }

    showErrorMessage(text) {
        this.showMessage(text, '#ef4444');
    }

    showMessage(text, backgroundColor) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'form-message';
        messageDiv.innerHTML = `
            <div style="
                background: ${backgroundColor};
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                margin: 1rem 0;
                text-align: center;
                animation: fadeInUp 0.5s ease-out;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            ">
                ${backgroundColor === '#10b981' ? '✅' : '❌'} ${text}
            </div>
        `;
        
        this.form.parentNode.insertBefore(messageDiv, this.form);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Utility Functions
class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Performance Optimization
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.lazyLoadImages();
        this.optimizeScrollEvents();
    }

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    optimizeScrollEvents() {
        // Throttle scroll events for better performance
        const throttledScroll = Utils.throttle(() => {
            // Handle scroll-based animations or effects here
        }, 16); // ~60fps

        window.addEventListener('scroll', throttledScroll);
    }
}



// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all managers
    new ThemeManager();
    window.navigationManager = new NavigationManager();
    new AnimationManager();
    new FormManager();
    new PerformanceOptimizer();
    
    // Set current year in footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Add loading animation
    document.body.classList.add('loaded');
    
    // Add smooth reveal animation to hero section
    setTimeout(() => {
        const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-buttons');
        heroElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }, 100);
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations or reduce activity when page is hidden
        document.body.classList.add('page-hidden');
    } else {
        // Resume normal activity when page becomes visible
        document.body.classList.remove('page-hidden');
    }
});

// Add CSS for initial hero animation
const style = document.createElement('style');
style.textContent = `
    .hero-title,
    .hero-subtitle,
    .hero-buttons {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .loaded .hero-title,
    .loaded .hero-subtitle,
    .loaded .hero-buttons {
        opacity: 1;
        transform: translateY(0);
    }
    
    .page-hidden * {
        animation-play-state: paused !important;
    }
    
    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;
document.head.appendChild(style);

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThemeManager,
        NavigationManager,
        AnimationManager,
        FormManager,
        Utils,
        PerformanceOptimizer
    };
}