/**
 * Simple screen router
 */
const Router = (() => {
  const screens = {
    'login': LoginScreen,
    'main-menu': MainMenuScreen,
    'shift': ShiftScreen,
    'cashier': CashierScreen,
    'products': ProductsScreen,
    'receiving': ReceivingScreen,
    'reports': ReportsScreen,
    'admin': AdminScreen,
  };

  let currentScreen = null;
  let history = [];

  function navigate(screenName) {
    if (currentScreen) history.push(currentScreen);
    currentScreen = screenName;

    const screen = screens[screenName];
    if (screen && screen.render) {
      screen.render();
    } else {
      Helpers.render('app-content', `<div class="text-center text-red p-lg">Screen "${screenName}" not found</div>`);
    }
  }

  function back() {
    if (history.length > 0) {
      const prev = history.pop();
      currentScreen = prev;
      const screen = screens[prev];
      if (screen && screen.render) screen.render();
    }
  }

  function getCurrent() { return currentScreen; }

  return { navigate, back, getCurrent };
})();
