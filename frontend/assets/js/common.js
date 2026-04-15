(function () {
  const app = (window.EHotels = window.EHotels || {});

  app.initializers = app.initializers || [];

  const apiBaseUrl = "../backend";
  let referenceDataPromise = null;

  app.registerInitializer = (initializer) => {
    app.initializers.push(initializer);
  };

  app.initializeNavDropdowns = () => {
    const dropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));

    if (!dropdowns.length) {
      return;
    }

    const closeAllDropdowns = () => {
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("is-open");
      });
    };

    dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector(".nav-dropdown-toggle");
      const links = dropdown.querySelectorAll(".nav-dropdown-menu a");

      if (!toggle) {
        return;
      }

      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const shouldOpen = !dropdown.classList.contains("is-open");
        closeAllDropdowns();

        if (shouldOpen) {
          dropdown.classList.add("is-open");
        }
      });

      links.forEach((link) => {
        link.addEventListener("click", () => {
          closeAllDropdowns();
        });
      });
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".nav-dropdown")) {
        closeAllDropdowns();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAllDropdowns();
      }
    });
  };

  app.initializeManagementResetLinks = () => {
    const resetLinks = document.querySelectorAll("[data-reset-management]");

    resetLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const form = document.getElementById(link.dataset.resetManagement);

        if (!form) {
          return;
        }

        form.reset();
        delete form.dataset.editingId;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  app.createModalController = (modalId) => {
    const modal = document.getElementById(modalId);

    if (!modal) {
      return null;
    }

    const open = () => {
      modal.hidden = false;
      modal.classList.add("is-visible");
      document.body.classList.add("modal-open");
    };

    const close = () => {
      modal.classList.remove("is-visible");
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    };

    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest(`[data-modal-close="${modalId}"]`)) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        close();
      }
    });

    return { modal, open, close };
  };

  app.reservationConfirmationStorageKey = "ehotels_reservation_confirmation";

  app.getTodayIso = () => {
    const today = new Date();
    const month = `${today.getMonth() + 1}`.padStart(2, "0");
    const day = `${today.getDate()}`.padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
  };

  app.safeJsonParse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  app.formatDateFr = (value) => {
    if (!value) {
      return "Non définie";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  app.normalizeEmployeeRole = (role) => {
    const value = `${role || ""}`.trim();
    const normalized = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (normalized === "gestionnaire") {
      return "Gestionnaire";
    }
    if (normalized === "reception") {
      return "Réception";
    }
    if (normalized === "service") {
      return "Service";
    }

    return value;
  };

  app.normalizeReservationStatus = (status) => {
    const value = `${status || ""}`.trim();
    const normalized = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (normalized === "reservee") {
      return "Réservée";
    }
    if (normalized === "confirmee") {
      return "Confirmée";
    }
    if (normalized === "annulee") {
      return "Annulée";
    }
    if (normalized === "convertie") {
      return "Convertie";
    }

    return value;
  };

  app.setFieldError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}_error`);

    if (field) {
      field.classList.toggle("input-invalid", Boolean(message));
    }

    if (error) {
      error.textContent = message || "";
    }
  };

  app.clearStatus = (element) => {
    if (!element) {
      return;
    }

    element.textContent = "";
    element.className = "form-status";
  };

  app.showStatus = (element, message, type) => {
    if (!element) {
      return;
    }

    if (type === "is-success") {
      app.clearStatus(element);
      return;
    }

    element.textContent = message;
    element.className = `form-status is-visible ${type}`;
  };

  const getToastHost = () => {
    let host = document.getElementById("toastHost");

    if (!host) {
      host = document.createElement("div");
      host.id = "toastHost";
      host.className = "toast-host";
      document.body.appendChild(host);
    }

    return host;
  };

  app.showToast = (message, type = "success", duration = 3000) => {
    const host = getToastHost();
    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    host.appendChild(toast);

    window.requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        toast.remove();
      }, 240);
    }, duration);
  };

  app.confirmDangerAction = (message) => window.confirm(message);

  app.buildApiUrl = (path, params) => {
    const url = new URL(`${apiBaseUrl}/${path}`, window.location.href);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      });
    }

    return url.toString();
  };

  app.apiRequest = async (path, options = {}) => {
    const response = await fetch(app.buildApiUrl(path, options.params), {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.details || payload.error || "Erreur serveur.");
    }

    return payload;
  };

  app.getReferenceData = async () => {
    if (!referenceDataPromise) {
      referenceDataPromise = app.apiRequest("reference_data.php").catch((error) => {
        referenceDataPromise = null;
        throw error;
      });
    }

    return referenceDataPromise;
  };

  app.resetReferenceData = () => {
    referenceDataPromise = null;
  };

  app.disableNativeValidation = () => {
    const frontendForms = [
      { id: "reservationForm" },
      { id: "rentalForm" },
      { id: "clientManagementForm" },
      { id: "employeeManagementForm" },
      { id: "hotelManagementForm" },
      { id: "roomManagementForm" },
      { id: "convertForm" }
    ];

    frontendForms.forEach((entry) => {
      const form = document.getElementById(entry.id);

      if (form) {
        form.setAttribute("novalidate", "novalidate");
      }
    });
  };
})();
