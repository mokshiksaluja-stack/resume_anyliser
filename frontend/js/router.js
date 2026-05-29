/**
 * Client-Side Application Router
 * 
 * Manages SPA state transformations, registers navigation links, 
 * handles hash changes, and implements redirection policies for pages.
 */

class Router {
  constructor() {
    this.routes = ['home', 'auth', 'dashboard', 'report', 'admin', 'about'];
    this.currentView = null;
    
    // Bind listeners
    window.addEventListener('hashchange', () => this.handleHashChange());
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  init() {
    // 1. Intercept navigation items
    document.querySelectorAll('[data-view]').forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = element.getAttribute('data-view');
        this.navigateTo(targetView);
      });
    });

    // 2. Intercept logo clicks to return home
    const logo = document.getElementById('logo-btn');
    if (logo) {
      logo.addEventListener('click', () => this.navigateTo('home'));
    }

    // 3. Process primary entry route
    this.handleHashChange();
  }

  /**
   * Toggles the visible section inside the DOM
   * @param {string} viewName - Target route name
   */
  navigateTo(viewName) {
    window.location.hash = `#${viewName}`;
  }

  handleHashChange() {
    let hash = window.location.hash.replace('#', '') || 'home';
    
    // Support sub-parameters (e.g., report/12345)
    let params = [];
    if (hash.includes('/')) {
      const parts = hash.split('/');
      hash = parts[0];
      params = parts.slice(1);
    }

    if (!this.routes.includes(hash)) {
      hash = 'home';
    }

    // Security Gate: Redirect users to Auth if attempting to access protected dashboards
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if ((hash === 'dashboard' || hash === 'report' || hash === 'admin') && !token) {
      window.api.showToast('Please sign in to access this area.', 'error');
      window.location.hash = '#auth';
      return;
    }

    if (hash === 'admin' && userRole !== 'admin') {
      window.api.showToast('Access Denied: Requires Administrator role privileges.', 'error');
      window.location.hash = '#dashboard';
      return;
    }

    // Toggle nav active classes
    document.querySelectorAll('[data-view]').forEach(item => {
      if (item.getAttribute('data-view') === hash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Fade out previous view, fade in new view
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.remove('active'));

    const activeSection = document.getElementById(`view-${hash}`);
    if (activeSection) {
      activeSection.classList.add('active');
    }

    this.currentView = hash;

    // Trigger router view load callbacks
    this.onViewLoaded(hash, params);
  }

  /**
   * Controller lifecycle method run after switching pages
   */
  onViewLoaded(view, params) {
    // Dispatch custom browser events for individual controllers to subscribe to
    const eventName = `view-${view}`;
    const customEvent = new CustomEvent(eventName, { detail: { params } });
    window.dispatchEvent(customEvent);
  }
}

// Global Router instance
window.appRouter = new Router();
