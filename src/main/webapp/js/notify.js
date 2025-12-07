// Simple toast / popup helper. Include this file in pages and call showToast(message, type, ms).
// type can be 'success' | 'error' | 'info'
// Example: showToast('Logged in!', 'success', 3000);

(function(window){
  function createToastContainer(){
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type, timeout){
    timeout = timeout || 3000;
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.innerText = message;
    container.appendChild(toast);

    // force reflow then add visible class for animation
    window.getComputedStyle(toast).opacity;
    toast.classList.add('visible');

    // remove after timeout
    setTimeout(() => {
      toast.classList.remove('visible');
      // remove from DOM after transition
      toast.addEventListener('transitionend', () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      });
    }, timeout);
  }

  // expose globally
  window.showToast = showToast;

})(window); 