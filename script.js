// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Waitlist form handling
    const waitlistForm = document.getElementById('waitlistForm');
    const successMessage = document.getElementById('successMessage');

    waitlistForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const role = document.getElementById('role').value;
        const submitBtn = document.querySelector('.submit-btn');
        const btnText = document.querySelector('.btn-text');
        
        // Validate role selection
        if (!role) {
            alert('Please select your interest (Buyer, Seller, or Investor)');
            return;
        }
        
        // Disable button and show loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Joining...';
        
        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email,
                    role: role 
                })
            });

            if (response.ok) {
                // Hide form and show success message
                waitlistForm.style.display = 'none';
                successMessage.style.display = 'flex';
                
                // Add animation to success message
                successMessage.style.opacity = '0';
                successMessage.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    successMessage.style.transition = 'all 0.5s ease';
                    successMessage.style.opacity = '1';
                    successMessage.style.transform = 'translateY(0)';
                }, 100);
                
            } else {
                throw new Error('Failed to join waitlist');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Sorry, there was an error joining the waitlist. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            btnText.textContent = 'Join Waitlist';
        }
    });

    // Add animation on scroll for cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards for animation
    document.querySelectorAll('.mission-card, .feature-card, .team-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });

    // Load signup count for social proof
    async function loadSignupCount() {
        try {
            const response = await fetch('/api/admin/waitlist-count');
            const data = await response.json();
            const count = data.count || 0;
            const displayCount = count > 0 ? `${count}+` : '250+';
            document.getElementById('signupCount').textContent = displayCount;
        } catch (error) {
            console.log('Could not load signup count, using default');
        }
    }

    // Load signup count on page load
    loadSignupCount();
});

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Add real-time email validation
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    
    emailInput.addEventListener('input', function() {
        const email = this.value;
        if (email && !validateEmail(email)) {
            this.style.borderColor = '#ef4444';
        } else {
            this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    });
});
