(function () {
  const currentScript = document.currentScript;
  const baseUrl = new URL("./js/", currentScript.src);
  const scriptNames = [
    "common.js",
    "operations.js",
    "management.js",
    "browser.js",
    "bootstrap.js"
  ];

  const loadScript = (name) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(name, baseUrl).toString();
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Impossible de charger ${name}.`));
      document.head.appendChild(script);
    });

  scriptNames
    .reduce((chain, name) => chain.then(() => loadScript(name)), Promise.resolve())
    .catch((error) => {
      console.error(error);
    });
})();
