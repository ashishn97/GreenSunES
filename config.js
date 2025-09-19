// Simplified Configuration for Environment Variables
// This configuration works with GitHub Actions environment variables

class SecurityConfig {
    constructor() {
        // Initialize security context
        this.securityContext = this.initializeSecurityContext();
    }
    
    // Initialize security context with validation
    initializeSecurityContext() {
        return {
            initialized: Date.now(),
            domain: window.location.hostname,
            protocol: window.location.protocol
        };
    }
    
    // Get credentials (injected during build by GitHub Actions)
    getPublicKey() {
        if (!this.isValidEnvironment()) return null;
        // This placeholder will be replaced by GitHub Actions with actual value
        return 'EMAILJS_PUBLIC_KEY_PLACEHOLDER';
    }
    
    getServiceId() {
        if (!this.isValidEnvironment()) return null;
        // This placeholder will be replaced by GitHub Actions with actual value
        return 'EMAILJS_SERVICE_ID_PLACEHOLDER';
    }
    
    getTemplateId() {
        if (!this.isValidEnvironment()) return null;
        // This placeholder will be replaced by GitHub Actions with actual value
        return 'EMAILJS_TEMPLATE_ID_PLACEHOLDER';
    }
    
    // Validate environment (basic security check)
    isValidEnvironment() {
        // Check if running in expected domain (add your domain here)
        const allowedDomains = [
            'greensunenergyservices.co.in',
            'localhost',
            '127.0.0.1'
        ];
        const currentDomain = window.location.hostname;
        
        // Allow GitHub Pages domains (username.github.io or custom domain)
        const isGitHubPages = currentDomain.includes('.github.io') || 
                             currentDomain === 'greensunenergyservices.co.in';
        
        return allowedDomains.includes(currentDomain) || isGitHubPages;
    }
    
    // Rate limiting helper
    checkRateLimit() {
        const now = Date.now();
        const lastSubmission = localStorage.getItem('lastFormSubmission');
        const minInterval = 30000; // 30 seconds minimum between submissions
        
        if (lastSubmission && (now - parseInt(lastSubmission)) < minInterval) {
            return false;
        }
        
        localStorage.setItem('lastFormSubmission', now.toString());
        return true;
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.SecurityConfig = SecurityConfig;
}