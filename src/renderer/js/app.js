/**
 * App — main entry point
 */
const App = (() => {
  let user = null;
  let shift = null;

  function init() {
    Helpers.startClock();

    // Set app name in status bar
    const appNameEl = document.getElementById('status-app-name');
    if (appNameEl) {
      appNameEl.textContent = ((window.posConfig && window.posConfig.companyName) || 'TOKO DEMO') + ' — POS TERMINAL';
    }

    // Start at login
    Router.navigate('login');
  }

  function getUser() { return user; }
  function setUser(u) { user = u; }
  function getShift() { return shift; }
  function setShift(s) {
    shift = s;
    Helpers.setStatusShift(s);
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);

  return { init, getUser, setUser, getShift, setShift };
})();
