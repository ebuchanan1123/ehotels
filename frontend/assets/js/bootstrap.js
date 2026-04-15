(function () {
  const app = window.EHotels;

  const run = () => {
    app.disableNativeValidation();
    app.initializeNavDropdowns();
    app.initializeManagementResetLinks();
    (app.initializers || []).forEach((initializer) => {
      initializer();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
