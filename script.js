// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function () {
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
    window.addEventListener('scroll', function () {
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

    waitlistForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const role = document.getElementById('role').value;
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const phone = document.getElementById('phone').value.trim();
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
            const requestBody = {
                email: email,
                role: role
            };

            // Add optional fields if provided
            if (firstName) requestBody.first_name = firstName;
            if (lastName) requestBody.last_name = lastName;
            if (phone) requestBody.phone = phone;

            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const result = await response.json();

                // Personalize the success message
                const successTitle = document.querySelector('#successMessage h3');
                const successSubtitle = document.querySelector('#successMessage p');

                if (firstName && lastName) {
                    successTitle.textContent = `Welcome to Hanti, ${firstName} ${lastName}!`;
                    successSubtitle.textContent = `Your information was saved! Thank you for joining our waitlist! 🎉`;
                } else if (firstName) {
                    successTitle.textContent = `Welcome to Hanti, ${firstName}!`;
                    successSubtitle.textContent = `Your information was saved! Thank you for joining our waitlist! 🎉`;
                } else {
                    successTitle.textContent = `Your information was saved!`;
                    successSubtitle.textContent = `Thank you for joining the Hanti waitlist! 🎉`;
                }

                // Hide form and show success message
                waitlistForm.style.display = 'none';
                successMessage.style.display = 'block';

                // Add smooth animation to success message
                successMessage.style.opacity = '0';
                successMessage.style.transform = 'translateY(30px) scale(0.95)';

                setTimeout(() => {
                    successMessage.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    successMessage.style.opacity = '1';
                    successMessage.style.transform = 'translateY(0) scale(1)';
                }, 100);

                // Optional: Add confetti or celebration effect
                setTimeout(() => {
                    // Add a subtle pulse effect to the success message
                    successMessage.style.transform = 'translateY(0) scale(1.02)';
                    setTimeout(() => {
                        successMessage.style.transform = 'translateY(0) scale(1)';
                    }, 200);
                }, 800);

            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to join waitlist');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Sorry, there was an error joining the waitlist: ${error.message}`);
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

    const observer = new IntersectionObserver(function (entries) {
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
document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.getElementById('email');

    emailInput.addEventListener('input', function () {
        const email = this.value;
        if (email && !validateEmail(email)) {
            this.style.borderColor = '#ef4444';
        } else {
            this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    });
});
