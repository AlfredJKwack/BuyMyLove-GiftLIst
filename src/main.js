import './style.css';

// Cookie management utilities
const COOKIE_ID_KEY = 'gift_buyer_id';
const COOKIE_EXPIRY_DAYS = 365; // 1 year

const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
};

const setCookie = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

const getCookieId = () => {
  let cookieId = getCookie(COOKIE_ID_KEY);
  if (!cookieId) {
    cookieId = crypto.randomUUID();
    setCookie(COOKIE_ID_KEY, cookieId, COOKIE_EXPIRY_DAYS);
  }
  return cookieId;
};

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get or create a cookie ID for the current user
  const cookieId = getCookieId();
  console.log('App initialized with cookie ID:', cookieId);
  
  // Handle navigation
  setupNavigation();
  
  // Handle toggle switches
  setupToggleSwitches();
  
  // Handle image errors
  setupImageErrorHandling();
  
  // Handle login form
  setupLoginForm();
});

// Set up navigation between gift list and login
function setupNavigation() {
  const navList = document.getElementById('nav-list');
  const navLogin = document.getElementById('nav-login');
  const giftListContainer = document.getElementById('gift-list-container');
  const loginContainer = document.getElementById('login-container');
  
  navList.addEventListener('click', (e) => {
    e.preventDefault();
    giftListContainer.classList.remove('hidden');
    loginContainer.classList.add('hidden');
    navList.classList.add('active');
    navLogin.classList.remove('active');
  });
  
  navLogin.addEventListener('click', (e) => {
    e.preventDefault();
    giftListContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    navList.classList.remove('active');
    navLogin.classList.add('active');
  });
}

// Set up toggle switches for bought status
function setupToggleSwitches() {
  document.querySelectorAll('.toggle-input').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const giftCard = e.target.closest('.gift-card');
      const toggleLabel = e.target.closest('.toggle-switch').querySelector('.toggle-label');
      
      if (e.target.checked) {
        giftCard.classList.add('is-bought');
        toggleLabel.textContent = 'Bought';
      } else {
        giftCard.classList.remove('is-bought');
        toggleLabel.textContent = 'Available';
      }
      
      // Here we would also call an API to update the gift status
      const giftId = giftCard.dataset.giftId;
      console.log(`Gift ${giftId} marked as ${e.target.checked ? 'bought' : 'available'}`);
      
      // In a real app, we would make an API call like this:
      // updateGiftStatus(giftId, e.target.checked, cookieId);
    });
  });
}

// Handle image loading errors
function setupImageErrorHandling() {
  document.querySelectorAll('.gift-image').forEach(img => {
    img.addEventListener('error', (e) => {
      e.target.style.display = 'none';
      const placeholder = e.target.nextElementSibling;
      if (placeholder && placeholder.classList.contains('image-placeholder')) {
        placeholder.style.display = 'flex';
      }
    });
  });
}

// Set up login form
function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const messageEl = document.getElementById('login-message');
      
      // Simple validation
      if (!email) {
        showLoginMessage('Please enter your email address.', 'error');
        return;
      }
      
      // In a real app, this would send an OTP to the email
      // For now, just show a success message
      showLoginMessage(`Login link sent to ${email}. Please check your email.`, 'success');
      loginForm.reset();
    });
  }
}

// Show a message in the login form
function showLoginMessage(message, type = 'info') {
  const messageEl = document.getElementById('login-message');
  
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = 'form-message';
    
    if (type === 'success') {
      messageEl.classList.add('success');
    } else if (type === 'error') {
      messageEl.classList.add('error');
    }
    
    messageEl.classList.remove('hidden');
  }
}

// Mock function for updating gift status (would be replaced with real API call)
function updateGiftStatus(giftId, bought, cookieId) {
  console.log(`API call: Update gift ${giftId} to ${bought ? 'bought' : 'available'} by user ${cookieId}`);
  
  // Simulate API response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 300);
  });
}
