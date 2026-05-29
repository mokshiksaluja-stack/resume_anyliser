/**
 * Color Theme Preference Controller
 * 
 * Configures light/dark mode triggers and persists selections
 * inside browser LocalStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  // 1. Read persistent theme choice or query matchMedia system default
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

  if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    body.classList.add('light-theme');
  }

  // 2. Add dynamic transition helper class
  // We apply this with a tiny delay to prevent initial flash animations on reload
  setTimeout(() => {
    body.style.transition = 'background-color 0.35s ease, color 0.35s ease';
  }, 100);

  // 3. Bind click events
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      body.classList.toggle('light-theme');
      
      // Save choice
      if (body.classList.contains('light-theme')) {
        localStorage.setItem('theme', 'light');
      } else {
        localStorage.setItem('theme', 'dark');
      }
    });
  }
});
