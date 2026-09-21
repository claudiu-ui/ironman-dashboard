// ============================================
// Simple Client-Side Router
// ============================================

const routes = {};
let currentRoute = null;

export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
}

export function navigate(path) {
  if (currentRoute === path) return;
  currentRoute = path;
  window.location.hash = path;
  renderCurrentRoute();
  updateActiveNav();
}

export function renderCurrentRoute() {
  const path = (window.location.hash.slice(1) || '/').split('?')[0];
  currentRoute = path;
  const container = document.getElementById('page-content');
  if (!container) return;

  const renderFn = routes[path] || routes['/'];
  if (renderFn) {
    container.innerHTML = '';
    container.appendChild(renderFn());
    // Trigger animations
    requestAnimationFrame(() => {
      container.querySelectorAll('.animate-in').forEach(el => {
        el.style.opacity = '';
      });
    });
  }
  updateActiveNav();
}

function updateActiveNav() {
  const path = currentRoute || '/';
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.dataset.route === path);
  });
}

export function initRouter() {
  window.addEventListener('hashchange', renderCurrentRoute);
  renderCurrentRoute();
}

export function getCurrentRoute() {
  return currentRoute || '/';
}
