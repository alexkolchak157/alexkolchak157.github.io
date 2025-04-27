export function initRouter(routes) {
  // The container where we render each section
  const container = document.getElementById('app-content');
  if (!container) {
    console.error('Container #app-content not found for router');
    return;
  }

  // Highlight navigation link
  function highlightNav(hash) {
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Render the section corresponding to the current hash
  function render() {
    const hash = window.location.hash || Object.keys(routes)[0];
    const renderFn = routes[hash];
    if (typeof renderFn === 'function') {
      container.innerHTML = '';
      renderFn(container);
      highlightNav(hash);
    } else {
      console.warn(`No route handler for ${hash}, navigating to default`);
      window.location.hash = Object.keys(routes)[0];
    }
  }

  // Listen for hash changes
  window.addEventListener('hashchange', render);

  // Initial render
  render();
}