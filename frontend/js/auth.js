/**
 * Session Authentication Controller
 * 
 * Manages user logins, account signups, UI auth states,
 * and handles user context updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const loginNavBtn = document.getElementById('login-nav-btn');
  const authNavContainer = document.getElementById('auth-nav-container');
  
  const navDashboard = document.getElementById('nav-dashboard');
  const navAdmin = document.getElementById('nav-admin');

  // 1. Initialize UI on startup
  syncAuthState();

  // 2. Tab switching inside auth panel
  if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    });
  }

  // Header login button redirect
  if (loginNavBtn) {
    loginNavBtn.addEventListener('click', () => {
      window.appRouter.navigateTo('auth');
    });
  }

  // 3. Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const data = await window.api.auth.login({ email, password });
        
        // Save Session
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('userName', data.user.name);

        window.api.showToast(data.message, 'success');
        loginForm.reset();
        
        // Update layout and redirect
        syncAuthState();
        window.appRouter.navigateTo('dashboard');
      } catch (err) {
        window.api.showToast(err.message || 'Authenticating failed.', 'error');
      }
    });
  }

  // 4. Handle Registration Form Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;

      try {
        const data = await window.api.auth.register({ name, email, password, role });
        
        // Save Session
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('userName', data.user.name);

        window.api.showToast(data.message, 'success');
        registerForm.reset();

        // Update layout and redirect
        syncAuthState();
        window.appRouter.navigateTo('dashboard');
      } catch (err) {
        window.api.showToast(err.message || 'Registration failed.', 'error');
      }
    });
  }

  // 5. Hero Action Click Events redirect
  const getStartedBtn = document.getElementById('hero-get-started');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      const token = localStorage.getItem('token');
      if (token) {
        window.appRouter.navigateTo('dashboard');
      } else {
        window.appRouter.navigateTo('auth');
      }
    });
  }

  const learnMoreBtn = document.getElementById('hero-learn-more');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
      window.appRouter.navigateTo('about');
    });
  }

  /**
   * Refreshes Navbars and buttons depending on User Session States
   */
  async function syncAuthState() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('userName');

    if (token) {
      // User is authenticated
      if (navDashboard) navDashboard.style.display = 'block';
      if (navAdmin) {
        navAdmin.style.display = role === 'admin' ? 'block' : 'none';
      }

      // Generate user avatar card badge in header
      const userInitial = name ? name.charAt(0).toUpperCase() : 'U';
      if (authNavContainer) {
        authNavContainer.innerHTML = `
          <div class="user-avatar" title="${name || 'User'}">${userInitial}</div>
          <button class="btn btn-secondary" id="logout-btn" style="padding: 0.4rem 0.85rem; font-size: 0.85rem;">Logout</button>
        `;

        // Bind logout click actions
        document.getElementById('logout-btn').addEventListener('click', () => {
          localStorage.clear();
          window.api.showToast('Logged out successfully.', 'success');
          syncAuthState();
          window.appRouter.navigateTo('home');
        });
      }
    } else {
      // User is not authenticated
      if (navDashboard) navDashboard.style.display = 'none';
      if (navAdmin) navAdmin.style.display = 'none';

      if (authNavContainer) {
        authNavContainer.innerHTML = `<button class="btn btn-secondary" id="login-nav-btn">Sign In</button>`;
        // Re-bind click redirect
        document.getElementById('login-nav-btn').addEventListener('click', () => {
          window.appRouter.navigateTo('auth');
        });
      }
    }
  }

  // Hook global reload triggers to update profiles
  window.addEventListener('sync-auth', syncAuthState);
});
