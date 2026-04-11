document.addEventListener("DOMContentLoaded", () => {
  const apiBaseUrl = "../backend";

  const initializeNavDropdowns = () => {
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

  const initializeManagementResetLinks = () => {
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

  const setSubmitButtonText = (form, label) => {
    const submitButton = form?.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.textContent = label;
    }
  };

  const createModalController = (modalId) => {
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

  const storageKeys = {
    clients: "ehotels_mock_clients",
    rooms: "ehotels_mock_rooms",
    reservationConfirmation: "ehotels_reservation_confirmation"
  };

  const sampleRooms = [
    {
      id: 101,
      hotelId: 1,
      hotelName: "LuxStay Centre-Ville Ottawa",
      location: "Ottawa",
      address: "120 rue Elgin, Ottawa",
      chain: "luxstay",
      chainLabel: "LuxStay",
      category: 4,
      capacity: "double",
      capacityLabel: "Double",
      area: 35,
      roomCount: 1,
      price: 210
    },
    {
      id: 205,
      hotelId: 2,
      hotelName: "Urban Rest Toronto Centre",
      location: "Toronto",
      address: "18 King Street West, Toronto",
      chain: "urbanrest",
      chainLabel: "Urban Rest",
      category: 3,
      capacity: "simple",
      capacityLabel: "Simple",
      area: 24,
      roomCount: 1,
      price: 140
    },
    {
      id: 310,
      hotelId: 3,
      hotelName: "Northern Suites Vieux-Montreal",
      location: "Montreal",
      address: "55 rue Saint-Paul, Montreal",
      chain: "northernsuites",
      chainLabel: "Northern Suites",
      category: 5,
      capacity: "family",
      capacityLabel: "Familiale",
      area: 50,
      roomCount: 2,
      price: 320
    },
    {
      id: 412,
      hotelId: 1,
      hotelName: "LuxStay Centre-Ville Ottawa",
      location: "Ottawa",
      address: "120 rue Elgin, Ottawa",
      chain: "luxstay",
      chainLabel: "LuxStay",
      category: 5,
      capacity: "family",
      capacityLabel: "Familiale",
      area: 62,
      roomCount: 3,
      price: 410
    },
    {
      id: 118,
      hotelId: 2,
      hotelName: "Urban Rest Toronto Centre",
      location: "Toronto",
      address: "18 King Street West, Toronto",
      chain: "urbanrest",
      chainLabel: "Urban Rest",
      category: 2,
      capacity: "double",
      capacityLabel: "Double",
      area: 28,
      roomCount: 1,
      price: 165
    },
    {
      id: 227,
      hotelId: 4,
      hotelName: "Northern Suites Québec Vieux-Port",
      location: "Québec",
      address: "9 rue du Port, Québec",
      chain: "northernsuites",
      chainLabel: "Northern Suites",
      category: 4,
      capacity: "double",
      capacityLabel: "Double",
      area: 40,
      roomCount: 2,
      price: 255
    }
  ];

  const defaultClients = [
    {
      id: 1001,
      fullName: "Taylor Morgan",
      address: "24 River Street, Ottawa",
      nas: "111-22-3333",
      idType: "passport",
      idTypeLabel: "Passeport",
      idNumber: "P8392014",
      registrationDate: "2026-03-14"
    },
    {
      id: 1002,
      fullName: "Sam Chen",
      address: "8 King Avenue, Toronto",
      nas: "444-55-6666",
      idType: "drivers_license",
      idTypeLabel: "Permis de conduire",
      idNumber: "D01928374",
      registrationDate: "2026-03-29"
    }
  ];

  const defaultManagedRooms = [
    {
      id: 101,
      chain: "luxstay",
      chainLabel: "LuxStay",
      category: 4,
      capacity: "double",
      capacityLabel: "Double",
      area: 35,
      price: 210,
      view: "Ville",
      extendable: "yes",
      extendableLabel: "Oui"
    },
    {
      id: 310,
      chain: "northernsuites",
      chainLabel: "Northern Suites",
      category: 5,
      capacity: "family",
      capacityLabel: "Familiale",
      area: 50,
      price: 320,
      view: "Fleuve",
      extendable: "no",
      extendableLabel: "Non"
    }
  ];

  const defaultReservations = [
    {
      id: 8701,
      clientName: "Taylor Morgan",
      roomId: 101,
      startDate: "2026-04-20",
      endDate: "2026-04-24",
      status: "Confirmée"
    },
    {
      id: 8702,
      clientName: "Sam Chen",
      roomId: 205,
      startDate: "2026-04-18",
      endDate: "2026-04-21",
      status: "Confirmée"
    }
  ];

  const getTodayIso = () => {
    const today = new Date();
    const month = `${today.getMonth() + 1}`.padStart(2, "0");
    const day = `${today.getDate()}`.padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
  };

  const safeJsonParse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const loadCollection = (key, fallback) => {
    return safeJsonParse(window.localStorage.getItem(key), fallback);
  };

  const saveCollection = (key, value) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  const formatDateFr = (value) => {
    if (!value) {
      return "Non définie";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const normalizeEmployeeRole = (role) => {
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

  const setFieldError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}_error`);

    if (field) {
      field.classList.toggle("input-invalid", Boolean(message));
    }

    if (error) {
      error.textContent = message || "";
    }
  };

  const showStatus = (element, message, type) => {
    if (!element) {
      return;
    }

    if (type === "is-success") {
      clearStatus(element);
      return;
    }

    element.textContent = message;
    element.className = `form-status is-visible ${type}`;
  };

  const clearStatus = (element) => {
    if (!element) {
      return;
    }

    element.textContent = "";
    element.className = "form-status";
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

  const showToast = (message, type = "success", duration = 3000) => {
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

  const confirmDangerAction = (message) => window.confirm(message);

  const buildApiUrl = (path, params) => {
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

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(buildApiUrl(path, options.params), {
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

  let referenceDataPromise = null;

  const getReferenceData = async () => {
    if (!referenceDataPromise) {
      referenceDataPromise = apiRequest("reference_data.php").catch((error) => {
        referenceDataPromise = null;
        throw error;
      });
    }

    return referenceDataPromise;
  };

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

  const initializeSearch = () => {
    const searchForm = document.getElementById("searchForm");
    const locationSelect = document.getElementById("localisation");
    const hotelSelect = document.getElementById("hotel");
    const chainSelect = document.getElementById("chaine");
    const resultsGrid = document.getElementById("resultsGrid");
    const resultsSummary = document.getElementById("resultsSummary");

    if (!searchForm || !resultsGrid || !resultsSummary || !locationSelect || !hotelSelect || !chainSelect) {
      return;
    }

    let roomsCache = [];
    let allRoomsCache = [];

    const renderLocationOptions = (rooms) => {
      const previousLocation = locationSelect.value;
      const locations = [...new Set(rooms.map((room) => room.location).filter(Boolean))].sort();

      locationSelect.innerHTML = `
        <option value="">Toutes les localisations</option>
        ${locations.map((location) => `<option value="${location}">${location}</option>`).join("")}
      `;

      if ([...locationSelect.options].some((option) => option.value === previousLocation)) {
        locationSelect.value = previousLocation;
      }
    };

    const renderChainOptions = (rooms) => {
      const chains = [...new Set(rooms.map((room) => room.chainLabel).filter(Boolean))].sort();
      const previousChain = chainSelect.value;

      chainSelect.innerHTML = `
        <option value="">Toutes</option>
        ${chains
          .map((chainLabel) => {
            const normalized = chainLabel.toLowerCase().replaceAll(" ", "").replaceAll("-", "");
            return `<option value="${normalized}">${chainLabel}</option>`;
          })
          .join("")}
      `;

      if ([...chainSelect.options].some((option) => option.value === previousChain)) {
        chainSelect.value = previousChain;
      }
    };

    const updateHotelOptions = () => {
      const selectedLocation = locationSelect.value;
      const selectedChain = searchForm.elements.chaine.value;
      const sourceRooms = allRoomsCache.length > 0 ? allRoomsCache : roomsCache;
      const hotels = sourceRooms
        .filter((room) => {
          if (selectedLocation && room.location !== selectedLocation) {
            return false;
          }

          if (selectedChain && room.chain !== selectedChain) {
            return false;
          }

          return true;
        })
        .reduce((items, room) => {
          if (!items.find((item) => item.hotelId === room.hotelId)) {
            items.push({ hotelId: room.hotelId, hotelName: room.hotelName });
          }
          return items;
        }, [])
        .sort((left, right) => left.hotelName.localeCompare(right.hotelName));

      const previousHotel = hotelSelect.value;
      hotelSelect.innerHTML = `
        <option value="">Tous les hôtels</option>
        ${hotels.map((hotel) => `<option value="${hotel.hotelId}">${hotel.hotelName}</option>`).join("")}
      `;

      if (hotels.some((hotel) => `${hotel.hotelId}` === previousHotel)) {
        hotelSelect.value = previousHotel;
      }
    };

    const renderHotels = (rooms) => {
      if (rooms.length === 0) {
        resultsSummary.textContent = "Aucune chambre ne correspond aux filtres sélectionnés.";
        resultsGrid.innerHTML = `
          <div class="results-empty">
            <p>Essayez d'ajuster les filtres de localisation, d'hôtel, de chaine, de catégorie, de prix ou de superficie.</p>
          </div>
        `;
        return;
      }

      const hotels = rooms.reduce((groups, room) => {
        const match = groups.find((hotel) => hotel.hotelId === room.hotelId);

        if (match) {
          match.rooms.push(room);
          return groups;
        }

        groups.push({
          hotelId: room.hotelId,
          hotelName: room.hotelName,
          chainLabel: room.chainLabel,
          location: room.location,
          address: room.address,
          category: room.category,
          rooms: [room]
        });

        return groups;
      }, []);

      resultsSummary.textContent = `${rooms.length} chambre${rooms.length === 1 ? "" : "s"} trouvee${rooms.length === 1 ? "" : "s"} dans ${hotels.length} hotel${hotels.length === 1 ? "" : "s"}.`;
      resultsGrid.innerHTML = hotels
        .map(
          (hotel) => `
            <details class="hotel-card">
              <summary class="hotel-card-header">
                <div>
                  <h4>${hotel.hotelName}</h4>
                  <p class="hotel-meta"><strong>Chaine :</strong> ${hotel.chainLabel}</p>
                  <p class="hotel-meta"><strong>Localisation :</strong> ${hotel.location}</p>
                  <p class="hotel-meta"><strong>Adresse :</strong> ${hotel.address}</p>
                  <p class="hotel-meta"><strong>Catégorie :</strong> ${hotel.category} étoiles</p>
                </div>
                <div class="hotel-card-actions">
                  <div class="hotel-match-count">
                    ${hotel.rooms.length} chambre${hotel.rooms.length === 1 ? "" : "s"} correspondent aux filtres
                  </div>
                  <span class="hotel-expand-indicator">Voir les chambres</span>
                </div>
              </summary>

              <div class="hotel-room-list">
                ${hotel.rooms
                  .map(
                    (room) => `
                      <article class="room-chip">
                        <h5>${room.name}</h5>
                        <p><strong>Capacité :</strong> ${room.capacityLabel}</p>
                        <p><strong>Superficie :</strong> ${room.area ? `${room.area} m²` : "N/D"}</p>
                        <p><strong>Nombre de chambres :</strong> ${room.roomCount}</p>
                        <p><strong>Prix :</strong> ${room.price} $ / nuit</p>
                        <a class="btn btn-primary" href="reserver.html?room_id=${room.id}">Réserver</a>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </details>
          `
        )
        .join("");

      const hotelCards = [...resultsGrid.querySelectorAll(".hotel-card")];
      hotelCards.forEach((card) => {
        card.addEventListener("toggle", () => {
          if (!card.open) {
            return;
          }

          hotelCards.forEach((otherCard) => {
            if (otherCard !== card) {
              otherCard.open = false;
            }
          });
        });
      });
    };

    const runSearch = () => {
      const formData = new FormData(searchForm);
      const filters = {
        location: formData.get("localisation")?.toString().trim(),
        hotelId: formData.get("hotel")?.toString().trim(),
        capacity: formData.get("capacite")?.toString().trim(),
        chain: formData.get("chaine")?.toString().trim(),
        category: formData.get("categorie")?.toString().trim(),
        maxPrice: formData.get("prix_max")?.toString().trim(),
        minArea: formData.get("superficie_min")?.toString().trim(),
        roomCount: formData.get("nb_chambres")?.toString().trim(),
        startDate: formData.get("date_debut")?.toString().trim(),
        endDate: formData.get("date_fin")?.toString().trim()
      };

      resultsSummary.textContent = "Chargement des chambres...";

      apiRequest("search_rooms.php", {
        params: {
          localisation: filters.location,
          hotel: filters.hotelId,
          capacite: filters.capacity,
          chaine: filters.chain,
          categorie: filters.category,
          prix_max: filters.maxPrice,
          superficie_min: filters.minArea,
          nb_chambres: filters.roomCount,
          date_debut: filters.startDate,
          date_fin: filters.endDate
        }
      })
        .then((payload) => {
          roomsCache = payload.rooms || [];
          if (allRoomsCache.length === 0) {
            allRoomsCache = roomsCache;
          }
          if (!filters.location && !filters.hotelId && !filters.capacity && !filters.chain && !filters.category && !filters.maxPrice && !filters.minArea && !filters.roomCount && !filters.startDate && !filters.endDate) {
            allRoomsCache = roomsCache;
          }
          renderLocationOptions(allRoomsCache.length > 0 ? allRoomsCache : roomsCache);
          renderChainOptions(allRoomsCache.length > 0 ? allRoomsCache : roomsCache);
          updateHotelOptions();
          renderHotels(roomsCache);
        })
        .catch((error) => {
          resultsSummary.textContent = "Impossible de charger les chambres.";
          resultsGrid.innerHTML = `<div class="results-empty"><p>${error.message}</p></div>`;
        });
    };

    locationSelect.addEventListener("change", () => {
      updateHotelOptions();
      runSearch();
    });

    hotelSelect.addEventListener("change", runSearch);
    searchForm.elements.chaine.addEventListener("change", () => {
      updateHotelOptions();
      runSearch();
    });

    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      runSearch();
    });

    searchForm.addEventListener("reset", () => {
      window.setTimeout(() => {
        runSearch();
      }, 0);
    });

    runSearch();
  };

  const autofillReservationRoom = async () => {
    const reservationRoomField = document.getElementById("id_chambre");
    const selectedRoomSummary = document.getElementById("selectedRoomSummary");
    const reservationForm = document.getElementById("reservationForm");
    const reservationStatus = document.getElementById("reservationStatus");
    const formGrid = reservationForm?.querySelector(".form-grid");
    const formActions = reservationForm?.querySelector(".form-actions");

    if (!reservationRoomField) {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room_id");
    reservationRoomField.setAttribute("readonly", "readonly");

    const lockReservationPage = (message) => {
      reservationRoomField.value = "";

      if (formGrid) {
        formGrid.hidden = true;
      }

      if (formActions) {
        formActions.hidden = true;
      }

      if (selectedRoomSummary) {
        selectedRoomSummary.className = "selected-room-card is-empty";
        selectedRoomSummary.innerHTML = `<p>${message}</p>`;
      }

      if (reservationStatus) {
        showStatus(reservationStatus, message, "is-error");
      }
    };

    if (!roomId) {
      lockReservationPage("Veuillez d'abord sélectionner une chambre depuis la page de recherche.");
      return false;
    }

    reservationRoomField.value = roomId;

    if (selectedRoomSummary) {
      selectedRoomSummary.className = "selected-room-card is-loading";
      selectedRoomSummary.innerHTML = "<p>Chargement des détails de la chambre...</p>";
    }

    try {
      const payload = await apiRequest(`rooms.php?id=${roomId}`);
      const room = payload.room;

      if (!room) {
        lockReservationPage("La chambre sélectionnée est introuvable. Retournez à la recherche pour en choisir une autre.");
        return false;
      }

      if (formGrid) {
        formGrid.hidden = false;
      }

      if (formActions) {
        formActions.hidden = false;
      }

      clearStatus(reservationStatus);

      if (selectedRoomSummary) {
        selectedRoomSummary.className = "selected-room-card";
        selectedRoomSummary.innerHTML = `
          <div class="selected-room-header">
            <div>
              <p class="selected-room-eyebrow">Chambre sélectionnée</p>
              <h3>${room.name}</h3>
              <p class="selected-room-subtitle">${room.hotelName} · ${room.location}</p>
            </div>
          </div>
          <div class="selected-room-tags">
            <span class="selected-room-tag">${room.capacityLabel}</span>
            <span class="selected-room-tag">${room.price} $ / nuit</span>
            <span class="selected-room-tag">${room.area ? `${room.area} m²` : "Superficie N/D"}</span>
          </div>
        `;
      }

      return true;
    } catch (error) {
      lockReservationPage(error.message || "Impossible de charger les détails de la chambre sélectionnée.");
      return false;
    }
  };

  const initializeReservationForm = () => {
    const form = document.getElementById("reservationForm");
    const status = document.getElementById("reservationStatus");

    if (!form) {
      return;
    }

    const fields = ["nom_complet", "adresse", "nas", "id_chambre", "date_debut", "date_fin"];
    const calculateNights = (startDate, endDate) => {
      if (!startDate || !endDate) {
        return null;
      }

      const diff = new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`);
      return Math.round(diff / (1000 * 60 * 60 * 24));
    };

    const validate = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const errors = {};
      const today = new Date(getTodayIso());
      const startDate = values.date_debut ? new Date(`${values.date_debut}T00:00:00`) : null;
      const endDate = values.date_fin ? new Date(`${values.date_fin}T00:00:00`) : null;

      if (!values.nom_complet?.trim() || values.nom_complet.trim().length < 3) {
        errors.nom_complet = "Entrez le nom complet du client.";
      }

      if (!values.adresse?.trim() || values.adresse.trim().length < 6) {
        errors.adresse = "Entrez une adresse complete du client.";
      }

      if (!values.nas?.trim() || !/^[0-9 -]{6,20}$/.test(values.nas.trim())) {
        errors.nas = "Utilisez des chiffres, des espaces ou des tirets pour le NAS / SSN.";
      }

      if (!values.id_chambre || Number(values.id_chambre) <= 0) {
        errors.id_chambre = "Entrez un ID de chambre valide.";
      }

      if (!values.date_debut) {
        errors.date_debut = "Choisissez une date de debut de reservation.";
      } else if (startDate < today) {
        errors.date_debut = "La date de debut ne peut pas etre dans le passe.";
      }

      if (!values.date_fin) {
        errors.date_fin = "Choisissez une date de fin de reservation.";
      } else if (startDate && endDate && endDate <= startDate) {
        errors.date_fin = "La date de fin doit etre apres la date de debut.";
      }

      fields.forEach((field) => {
        setFieldError(field, errors[field] || "");
      });

      return Object.keys(errors).length === 0;
    };

    fields.forEach((field) => {
      const element = document.getElementById(field);

      if (element) {
        element.addEventListener("input", () => {
          setFieldError(field, "");
          clearStatus(status);
        });
        element.addEventListener("change", () => {
          setFieldError(field, "");
          clearStatus(status);
        });
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validate()) {
        showStatus(status, "Veuillez corriger les champs de reservation mis en evidence avant de continuer.", "is-error");
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      showStatus(status, "Création de la réservation en cours...", "is-success");

      apiRequest("create_reservation.php", {
        method: "POST",
        body: values
      })
        .then((payload) => {
          const reservation = payload.reservation || {};
          const selectedRoomName = document.querySelector(".selected-room-header h3")?.textContent || "Chambre";
          const selectedRoomHotel = document.querySelector(".selected-room-subtitle")?.textContent || "Hôtel à confirmer";
          const selectedRoomTags = [...document.querySelectorAll(".selected-room-tag")].map((tag) => tag.textContent.trim());
          const nights = calculateNights(values.date_debut, values.date_fin);

          window.sessionStorage.setItem(
            storageKeys.reservationConfirmation,
            JSON.stringify({
              reservationId: reservation.id_reservation || "",
              status: "Confirmée",
              clientName: values.nom_complet?.trim() || "Non fourni",
              address: values.adresse?.trim() || "Non fournie",
              nas: values.nas?.trim() || "Non fourni",
              roomId: reservation.id_chambre || values.id_chambre || "Non selectionnee",
              roomName: selectedRoomName,
              hotelName: selectedRoomHotel,
              roomPrice: selectedRoomTags[1] || "Tarif non disponible",
              roomDetails: selectedRoomTags.filter((_, index) => index !== 1).join(" · "),
              startDate: reservation.date_debut || values.date_debut || "",
              endDate: reservation.date_fin || values.date_fin || "",
              reservationDate: reservation.date_reservation || getTodayIso(),
              stayDuration: nights && nights > 0 ? `${nights} nuit${nights === 1 ? "" : "s"}` : "Dates incompletes"
            })
          );
          showToast("Réservation créée avec succès.");
          window.location.href = "confirmation-reservation.html";
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        fields.forEach((field) => setFieldError(field, ""));
        clearStatus(status);
      }, 0);
    });
  };

  const initializeReservationConfirmation = () => {
    const detailsContainer = document.getElementById("confirmationDetails");
    const title = document.getElementById("confirmationReservationTitle");
    const badge = document.getElementById("confirmationStatusBadge");

    if (!detailsContainer || !title || !badge) {
      return;
    }

    const details = safeJsonParse(window.sessionStorage.getItem(storageKeys.reservationConfirmation), null);

    if (!details) {
      title.textContent = "Aucune réservation à afficher";
      badge.textContent = "Introuvable";
      detailsContainer.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">Message</span>
          <span class="summary-value">Veuillez créer une réservation depuis le formulaire.</span>
        </div>
      `;
      return;
    }

    title.textContent = `Réservation #${details.reservationId || "N/A"}`;
    badge.textContent = details.status || "Confirmée";

    const items = [
      { label: "Client", value: details.clientName || "Non fourni" },
      { label: "Adresse", value: details.address || "Non fournie" },
      { label: "NAS / SSN", value: details.nas || "Non fourni" },
      { label: "ID de la chambre", value: details.roomId || "Non selectionnee" },
      { label: "Chambre", value: details.roomName || "Chambre" },
      { label: "Chambre / hôtel", value: details.hotelName || "Hôtel à confirmer" },
      { label: "Détails", value: details.roomDetails || "Aucun détail disponible" },
      { label: "Tarif", value: details.roomPrice || "Tarif non disponible" },
      { label: "Date de début", value: formatDateFr(details.startDate) },
      { label: "Date de fin", value: formatDateFr(details.endDate) },
      { label: "Durée du séjour", value: details.stayDuration || "Dates incompletes" },
      { label: "Date de réservation", value: formatDateFr(details.reservationDate) }
    ];

    detailsContainer.innerHTML = items
      .map(
        (item) => `
          <div class="summary-item">
            <span class="summary-label">${item.label}</span>
            <span class="summary-value">${item.value}</span>
          </div>
        `
      )
      .join("");
  };

  const initializeRentalForm = () => {
    const form = document.getElementById("rentalForm");
    const status = document.getElementById("rentalStatus");
    const summary = document.getElementById("rentalSummary");

    if (!form || !summary) {
      return;
    }

    const fields = [
      "rental_client_name",
      "rental_client_address",
      "rental_client_nas",
      "rental_room_id",
      "rental_employee_id",
      "rental_checkin_date",
      "rental_start_date",
      "rental_end_date"
    ];

    const renderSummary = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const nights =
        values.start_date && values.end_date
          ? Math.round(
              (new Date(`${values.end_date}T00:00:00`) - new Date(`${values.start_date}T00:00:00`)) / (1000 * 60 * 60 * 24)
            )
          : null;

      const items = [
        { label: "Client", value: values.client_name?.trim() || "Non fourni" },
        { label: "Adresse", value: values.client_address?.trim() || "Non fournie" },
        { label: "NAS / SSN", value: values.client_nas?.trim() || "Non fourni" },
        { label: "ID de la chambre", value: values.room_id || "Non selectionne" },
        { label: "ID de l'employe", value: values.employee_id || "Non assigne" },
        { label: "Date d'arrivee", value: formatDateFr(values.checkin_date) },
        { label: "Date de debut", value: formatDateFr(values.start_date) },
        { label: "Date de fin", value: formatDateFr(values.end_date) },
        { label: "Duree du sejour", value: nights && nights > 0 ? `${nights} nuit${nights === 1 ? "" : "s"}` : "Dates incompletes" }
      ];

      summary.innerHTML = items
        .map(
          (item) => `
            <div class="summary-item">
              <span class="summary-label">${item.label}</span>
              <span class="summary-value">${item.value}</span>
            </div>
          `
        )
        .join("");
    };

    const validate = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const errors = {};
      const today = new Date(getTodayIso());
      const checkInDate = values.checkin_date ? new Date(`${values.checkin_date}T00:00:00`) : null;
      const startDate = values.start_date ? new Date(`${values.start_date}T00:00:00`) : null;
      const endDate = values.end_date ? new Date(`${values.end_date}T00:00:00`) : null;

      if (!values.client_name?.trim() || values.client_name.trim().length < 3) {
        errors.rental_client_name = "Entrez le nom complet du client.";
      }

      if (!values.client_address?.trim() || values.client_address.trim().length < 6) {
        errors.rental_client_address = "Entrez une adresse complete du client.";
      }

      if (!values.client_nas?.trim() || !/^[0-9 -]{6,20}$/.test(values.client_nas.trim())) {
        errors.rental_client_nas = "Utilisez des chiffres, des espaces ou des tirets pour le NAS / SSN.";
      }

      if (!values.room_id || Number(values.room_id) <= 0) {
        errors.rental_room_id = "Entrez un ID de chambre valide.";
      }

      if (!values.employee_id || Number(values.employee_id) <= 0) {
        errors.rental_employee_id = "Entrez un ID d'employe valide.";
      }

      if (!values.checkin_date) {
        errors.rental_checkin_date = "Choisissez une date d'arrivee.";
      } else if (checkInDate < today) {
        errors.rental_checkin_date = "La date d'arrivee ne peut pas etre dans le passe.";
      }

      if (!values.start_date) {
        errors.rental_start_date = "Choisissez une date de debut de location.";
      } else if (startDate < today) {
        errors.rental_start_date = "La date de debut ne peut pas etre dans le passe.";
      }

      if (!values.end_date) {
        errors.rental_end_date = "Choisissez une date de fin de location.";
      } else if (startDate && endDate && endDate <= startDate) {
        errors.rental_end_date = "La date de fin doit etre apres la date de debut.";
      }

      if (checkInDate && startDate && checkInDate.getTime() !== startDate.getTime()) {
        errors.rental_start_date = "Pour une location directe, la date de debut doit correspondre a la date d'arrivee.";
      }

      fields.forEach((field) => {
        setFieldError(field, errors[field] || "");
      });

      return Object.keys(errors).length === 0;
    };

    fields.forEach((field) => {
      const element = document.getElementById(field);

      if (element) {
        element.addEventListener("input", () => {
          setFieldError(field, "");
          clearStatus(status);
          renderSummary();
        });
        element.addEventListener("change", () => {
          setFieldError(field, "");
          clearStatus(status);
          renderSummary();
        });
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      renderSummary();

      if (!validate()) {
        showStatus(status, "Veuillez corriger les champs de location mis en evidence avant de continuer.", "is-error");
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      showStatus(status, "Création de la location en cours...", "is-success");

      apiRequest("create_rental.php", {
        method: "POST",
        body: values
      })
        .then((payload) => {
          form.reset();
          showToast(`Location ${payload.rental?.id_location || ""} créée avec succès.`);
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        fields.forEach((field) => setFieldError(field, ""));
        clearStatus(status);
        renderSummary();
      }, 0);
    });

    renderSummary();
  };



  const initializeClientManagement = () => {
    const form = document.getElementById("clientManagementForm");
    const status = document.getElementById("clientStatus");
    const results = document.getElementById("clientResults");
    const createButton = document.getElementById("openClientCreateModal");
    const createForm = document.getElementById("clientCreateForm");
    const createStatus = document.getElementById("clientCreateStatus");
    const createModal = createModalController("clientCreateModal");
    const editForm = document.getElementById("clientEditForm");
    const editStatus = document.getElementById("clientEditStatus");
    const editModal = createModalController("clientEditModal");

    if (!form || !results) {
      return;
    }

    let clients = [];
    const fields = [
      "client_full_name",
      "client_address",
      "client_nas_number",
      "client_id_search",
      "client_registration_date"
    ];

    const renderClients = (list = clients) => {
      results.innerHTML = list
        .map(
          (client) => `
            <article class="data-card">
              <h4>${client.fullName}</h4>
              <p><strong>ID client :</strong> ${client.id}</p>
              <p><strong>Nom :</strong> ${client.fullName}</p>
              <p><strong>Adresse :</strong> ${client.address}</p>
              <p><strong>Courriel :</strong> ${client.email || "N/D"}</p>
              <p><strong>NAS / SSN :</strong> ${client.nas}</p>
              <p><strong>Inscription :</strong> ${formatDateFr(client.registrationDate)}</p>
              <div class="data-card-actions">
                <button type="button" class="btn btn-secondary" data-client-edit="${client.id}">Modifier</button>
                <button type="button" class="btn btn-danger" data-client-delete="${client.id}">Supprimer</button>
              </div>
            </article>
          `
        )
        .join("");
    };

    const filterClients = (values) =>
      clients.filter((client) => {
        if (values.client_full_name?.trim() && !client.fullName.toLowerCase().includes(values.client_full_name.trim().toLowerCase())) {
          return false;
        }

        if (values.client_address?.trim() && !client.address.toLowerCase().includes(values.client_address.trim().toLowerCase())) {
          return false;
        }

        if (values.client_nas_number?.trim() && !client.nas.toLowerCase().includes(values.client_nas_number.trim().toLowerCase())) {
          return false;
        }

        if (values.client_id_search && `${client.id}` !== `${values.client_id_search}`) {
          return false;
        }

        if (values.client_registration_date && client.registrationDate !== values.client_registration_date) {
          return false;
        }

        return true;
      });

    const validateEdit = () => {
      const values = {
        address: document.getElementById("edit_client_address")?.value.trim() || "",
        email: document.getElementById("edit_client_email")?.value.trim() || ""
      };
      const errors = {};

      if (values.address.length < 6) {
        errors.edit_client_address = "Entrez une adresse complete.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.edit_client_email = "Entrez un courriel valide.";
      }

      [
        "edit_client_full_name",
        "edit_client_id",
        "edit_client_address",
        "edit_client_email",
        "edit_client_nas_number",
        "edit_client_registration_date"
      ].forEach((field) => setFieldError(field, errors[field] || ""));
      return { valid: Object.keys(errors).length === 0, values };
    };

    const createFields = [
      "create_client_full_name",
      "create_client_address",
      "create_client_email",
      "create_client_nas_number",
      "create_client_registration_date"
    ];

    const validateCreate = () => {
      const values = {
        fullName: document.getElementById("create_client_full_name")?.value.trim() || "",
        address: document.getElementById("create_client_address")?.value.trim() || "",
        email: document.getElementById("create_client_email")?.value.trim() || "",
        nas: document.getElementById("create_client_nas_number")?.value.trim() || "",
        registrationDate: document.getElementById("create_client_registration_date")?.value || ""
      };
      const errors = {};

      if (values.fullName.length < 3) errors.create_client_full_name = "Entrez le nom complet du client.";
      if (values.address.length < 6) errors.create_client_address = "Entrez une adresse complète.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.create_client_email = "Entrez un courriel valide.";
      if (!/^[0-9 -]{6,20}$/.test(values.nas)) errors.create_client_nas_number = "Utilisez un format valide pour le NAS / SSN.";
      if (!values.registrationDate) errors.create_client_registration_date = "Choisissez une date d'inscription.";

      createFields.forEach((field) => setFieldError(field, errors[field] || ""));
      return { valid: Object.keys(errors).length === 0, values };
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const values = Object.fromEntries(new FormData(form).entries());
      const filteredClients = filterClients(values);
      renderClients(filteredClients);
      showStatus(status, `${filteredClients.length} client${filteredClients.length === 1 ? "" : "s"} trouvé${filteredClients.length === 1 ? "" : "s"}.`, "is-success");
    });

    createButton?.addEventListener("click", () => {
      if (!createForm || !createModal) {
        return;
      }

      createForm.reset();
      createFields.forEach((field) => setFieldError(field, ""));
      clearStatus(createStatus);
      createModal.open();
    });

    createForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const { valid, values } = validateCreate();

      if (!valid) {
        showStatus(createStatus, "Veuillez corriger les champs clients mis en évidence.", "is-error");
        return;
      }

      apiRequest("clients.php", {
        method: "POST",
        body: values
      })
        .then(async () => {
          createForm.reset();
          createFields.forEach((field) => setFieldError(field, ""));
          clearStatus(createStatus);
          await loadClients();
          createModal?.close();
          showStatus(status, "Le client a été ajouté.", "is-success");
          showToast("Le client a été ajouté.");
        })
        .catch((error) => {
          showStatus(createStatus, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    createForm?.addEventListener("reset", () => {
      window.setTimeout(() => {
        createFields.forEach((field) => setFieldError(field, ""));
        clearStatus(createStatus);
      }, 0);
    });

    editForm?.addEventListener("submit", (event) => {
      event.preventDefault();

      const editingId = editForm.dataset.editingId;
      const { valid, values } = validateEdit();

      if (!editingId || !valid) {
        if (!valid) {
          showStatus(editStatus, "Veuillez corriger les champs clients mis en evidence.", "is-error");
        }
        return;
      }

      apiRequest("clients.php", {
        method: "PUT",
        body: {
          id: editingId,
          fullName: document.getElementById("edit_client_full_name")?.value.trim(),
          address: values.address,
          email: values.email,
          nas: document.getElementById("edit_client_nas_number")?.value.trim(),
          registrationDate: document.getElementById("edit_client_registration_date")?.value
        }
      })
        .then(async () => {
          editForm.reset();
          delete editForm.dataset.editingId;
          await loadClients();
          editModal?.close();
          showStatus(status, "Le client a été mis à jour.", "is-success");
          showToast("Le client a été mis à jour.");
        })
        .catch((error) => {
          showStatus(editStatus, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    if (editForm) {
      editForm.addEventListener("reset", () => {
        window.setTimeout(() => {
          [
            "edit_client_full_name",
            "edit_client_id",
            "edit_client_address",
            "edit_client_email",
            "edit_client_nas_number",
            "edit_client_registration_date"
          ].forEach((field) => setFieldError(field, ""));
          clearStatus(editStatus);
        }, 0);
      });
    }

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-client-edit]");
      const deleteButton = event.target.closest("[data-client-delete]");

      if (editButton) {
        const client = clients.find((entry) => `${entry.id}` === editButton.dataset.clientEdit);

        if (!client || !editForm || !editModal) {
          return;
        }

        editForm.dataset.editingId = `${client.id}`;
        document.getElementById("edit_client_full_name").value = client.fullName;
        document.getElementById("edit_client_id").value = client.id;
        document.getElementById("edit_client_address").value = client.address;
        document.getElementById("edit_client_email").value = client.email || "";
        document.getElementById("edit_client_nas_number").value = client.nas;
        document.getElementById("edit_client_registration_date").value = client.registrationDate;
        clearStatus(editStatus);
        editModal.open();
      }

      if (deleteButton) {
        if (!confirmDangerAction("Supprimer ce client? Cette action est irréversible.")) {
          return;
        }

        apiRequest(`clients.php?id=${deleteButton.dataset.clientDelete}`, {
          method: "DELETE"
        })
          .then(async () => {
            await loadClients();
            showStatus(status, "Le client a été supprimé.", "is-success");
            showToast("Le client a été supprimé.");
          })
          .catch((error) => {
            showStatus(status, error.message, "is-error");
            showToast(error.message, "error");
          });
      }
    });

    const loadClients = async () => {
      const payload = await apiRequest("clients.php");
      clients = payload.clients || [];
        renderClients();
    };

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        fields.forEach((field) => setFieldError(field, ""));
        clearStatus(status);
        loadClients().catch(() => {});
      }, 0);
    });

    loadClients().catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  const initializeRoomManagement = () => {
    const form = document.getElementById("roomManagementForm");
    const status = document.getElementById("roomStatus");
    const results = document.getElementById("roomResults");
    const hotelSelect = document.getElementById("managed_room_hotel_id");
    const createButton = document.getElementById("openRoomCreateModal");
    const createForm = document.getElementById("roomCreateForm");
    const createStatus = document.getElementById("roomCreateStatus");
    const createModal = createModalController("roomCreateModal");
    const createHotelSelect = document.getElementById("create_room_hotel_id");
    const editForm = document.getElementById("roomEditForm");
    const editStatus = document.getElementById("roomEditStatus");
    const editModal = createModalController("roomEditModal");
    const editHotelSelect = document.getElementById("edit_room_hotel_id");

    if (!form || !results || !hotelSelect) {
      return;
    }

    let rooms = [];
    const queryParams = new URLSearchParams(window.location.search);
    const initialHotelId = queryParams.get("hotel_id");
    const roomIdInput = document.getElementById("managed_room_id");
    const roomNameInput = document.getElementById("managed_room_name");
    const roomNumberInput = document.getElementById("managed_room_number");
    const roomHotelInput = document.getElementById("managed_room_hotel_id");

    const fields = [
      "managed_room_name",
      "managed_room_number",
      "managed_room_hotel_id",
      "managed_room_capacity",
      "managed_room_count",
      "managed_room_area",
      "managed_room_price",
      "managed_room_view",
      "managed_room_extension",
      "managed_room_state",
      "managed_room_amenities"
    ];
    const createFields = [
      "create_room_name",
      "create_room_number",
      "create_room_hotel_id",
      "create_room_capacity",
      "create_room_count",
      "create_room_area",
      "create_room_price",
      "create_room_view",
      "create_room_extension",
      "create_room_state",
      "create_room_amenities"
    ];

    const formatCapacity = (value) => {
      if (value === "family") {
        return "Familiale";
      }
      if (value === "double") {
        return "Double";
      }
      return "Simple";
    };

    const formatExtendable = (value) => (value === "yes" ? "Oui" : "Non");

    const setIdentityLocked = (locked) => {
      [roomIdInput, roomNameInput, roomNumberInput].forEach((input) => {
        if (!input) {
          return;
        }

        input.readOnly = locked;
        input.classList.toggle("input-locked", locked);
      });

      if (roomHotelInput) {
        roomHotelInput.disabled = locked;
        roomHotelInput.classList.toggle("input-locked", locked);
      }
    };

    const renderRooms = (list = rooms) => {
      results.innerHTML = list
        .map(
          (room) => `
            <article class="data-card">
              <h4>${room.name}</h4>
              <p><strong>Hôtel :</strong> ${room.hotelName}</p>
              <p><strong>Chaine :</strong> ${room.chainLabel}</p>
              <p><strong>Categorie :</strong> ${room.category} etoiles</p>
              <p><strong>Capacite :</strong> ${room.capacityLabel}</p>
              <p><strong>Nombre de chambres :</strong> ${room.roomCount}</p>
              <p><strong>Superficie :</strong> ${room.area || "N/D"}${room.area ? " m²" : ""}</p>
              <p><strong>Prix :</strong> ${room.price} $ / nuit</p>
              <p><strong>Vue :</strong> ${room.view || "Non specifiee"}</p>
              <p><strong>Extensible :</strong> ${room.extendableLabel}</p>
              <p><strong>État :</strong> ${room.state || "N/D"}</p>
              <p><strong>Commodités :</strong> ${room.amenities || "N/D"}</p>
              <div class="data-card-actions">
                <button type="button" class="btn btn-secondary" data-room-edit="${room.id}">Modifier</button>
                <button type="button" class="btn btn-danger" data-room-delete="${room.id}">Supprimer</button>
              </div>
            </article>
          `
        )
        .join("");
    };

    const filterRooms = (values) =>
      rooms.filter((room) => {
        if (values.managed_room_name?.trim() && !room.name.toLowerCase().includes(values.managed_room_name.trim().toLowerCase())) {
          return false;
        }
        if (values.managed_room_number && `${room.roomNumber || room.id}` !== `${values.managed_room_number}`) {
          return false;
        }
        if (values.managed_room_hotel_id && `${room.hotelId}` !== `${values.managed_room_hotel_id}`) {
          return false;
        }
        if (values.managed_room_capacity && room.capacity !== values.managed_room_capacity) {
          return false;
        }
        if (values.managed_room_count && `${room.roomCount}` !== `${values.managed_room_count}`) {
          return false;
        }
        if (values.managed_room_area && Number(room.area) < Number(values.managed_room_area)) {
          return false;
        }
        if (values.managed_room_price && Number(room.price) > Number(values.managed_room_price)) {
          return false;
        }
        if (values.managed_room_view?.trim() && !(room.view || "").toLowerCase().includes(values.managed_room_view.trim().toLowerCase())) {
          return false;
        }
        if (values.managed_room_extension && room.extendable !== values.managed_room_extension) {
          return false;
        }
        if (values.managed_room_state?.trim() && !(room.state || "").toLowerCase().includes(values.managed_room_state.trim().toLowerCase())) {
          return false;
        }
        if (values.managed_room_amenities?.trim() && !(room.amenities || "").toLowerCase().includes(values.managed_room_amenities.trim().toLowerCase())) {
          return false;
        }

        return true;
      });

    const validate = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const errors = {};

      if (!values.managed_room_name?.trim()) {
        errors.managed_room_name = "Entrez un nom de chambre.";
      }

      if (!values.managed_room_number || Number(values.managed_room_number) <= 0) {
        errors.managed_room_number = "Entrez un numéro de chambre valide.";
      }

      if (!values.managed_room_hotel_id) {
        errors.managed_room_hotel_id = "Sélectionnez un hôtel.";
      }

      if (!values.managed_room_capacity) {
        errors.managed_room_capacity = "Selectionnez une capacite.";
      }

      if (!values.managed_room_count || Number(values.managed_room_count) <= 0) {
        errors.managed_room_count = "Entrez un nombre de chambres valide.";
      }

      if (!values.managed_room_area || Number(values.managed_room_area) <= 0) {
        errors.managed_room_area = "Entrez une superficie valide.";
      }

      if (!values.managed_room_price || Number(values.managed_room_price) <= 0) {
        errors.managed_room_price = "Entrez un prix valide.";
      }

      if (!values.managed_room_extension) {
        errors.managed_room_extension = "Indiquez si la chambre est extensible.";
      }

      fields.forEach((field) => setFieldError(field, errors[field] || ""));
      return Object.keys(errors).length === 0;
    };

    const validateCreate = () => {
      const values = {
        name: document.getElementById("create_room_name")?.value.trim() || "",
        roomNumber: Number(document.getElementById("create_room_number")?.value || 0),
        hotelId: Number(document.getElementById("create_room_hotel_id")?.value || 0),
        capacity: document.getElementById("create_room_capacity")?.value || "",
        roomCount: Number(document.getElementById("create_room_count")?.value || 0),
        area: Number(document.getElementById("create_room_area")?.value || 0),
        price: Number(document.getElementById("create_room_price")?.value || 0),
        view: document.getElementById("create_room_view")?.value.trim() || "",
        extendable: document.getElementById("create_room_extension")?.value || "",
        state: document.getElementById("create_room_state")?.value.trim() || "",
        amenities: document.getElementById("create_room_amenities")?.value.trim() || ""
      };
      const errors = {};

      if (!values.name) errors.create_room_name = "Entrez un nom de chambre.";
      if (!values.roomNumber) errors.create_room_number = "Entrez un numéro de chambre valide.";
      if (!values.hotelId) errors.create_room_hotel_id = "Sélectionnez un hôtel.";
      if (!values.capacity) errors.create_room_capacity = "Sélectionnez une capacité.";
      if (!values.roomCount) errors.create_room_count = "Entrez un nombre de chambres valide.";
      if (!values.area) errors.create_room_area = "Entrez une superficie valide.";
      if (!values.price) errors.create_room_price = "Entrez un prix valide.";
      if (!values.extendable) errors.create_room_extension = "Indiquez si la chambre est extensible.";

      createFields.forEach((field) => setFieldError(field, errors[field] || ""));
      return { valid: Object.keys(errors).length === 0, values };
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const values = Object.fromEntries(new FormData(form).entries());
      const filteredRooms = filterRooms(values);
      renderRooms(filteredRooms);
      showStatus(status, `${filteredRooms.length} chambre${filteredRooms.length === 1 ? "" : "s"} trouvée${filteredRooms.length === 1 ? "" : "s"}.`, "is-success");
    });

    createButton?.addEventListener("click", async () => {
      if (!createForm || !createModal || !createHotelSelect) {
        return;
      }

      try {
        const references = await getReferenceData();
        createHotelSelect.innerHTML = `
          <option value="">Sélectionnez un hôtel</option>
          ${(references.hotels || []).map((hotel) => `<option value="${hotel.id}">${hotel.nom}</option>`).join("")}
        `;
        if (initialHotelId) {
          createHotelSelect.value = initialHotelId;
        }
      } catch (error) {
        showStatus(status, error.message, "is-error");
        return;
      }

      createForm.reset();
      createFields.forEach((field) => setFieldError(field, ""));
      clearStatus(createStatus);
      if (initialHotelId) {
        createHotelSelect.value = initialHotelId;
      }
      createModal.open();
    });

    createForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const { valid, values } = validateCreate();

      if (!valid) {
        showStatus(createStatus, "Veuillez corriger les champs chambre mis en évidence.", "is-error");
        return;
      }

      apiRequest("rooms.php", {
        method: "POST",
        body: values
      })
        .then(async () => {
          createForm.reset();
          createFields.forEach((field) => setFieldError(field, ""));
          clearStatus(createStatus);
          if (initialHotelId && createHotelSelect) {
            createHotelSelect.value = initialHotelId;
          }
          await loadRooms();
          createModal?.close();
          showStatus(status, "La chambre a été ajoutée.", "is-success");
          showToast("La chambre a été ajoutée.");
        })
        .catch((error) => {
          showStatus(createStatus, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    createForm?.addEventListener("reset", () => {
      window.setTimeout(() => {
        createFields.forEach((field) => setFieldError(field, ""));
        clearStatus(createStatus);
        if (initialHotelId && createHotelSelect) {
          createHotelSelect.value = initialHotelId;
        }
      }, 0);
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        fields.forEach((field) => setFieldError(field, ""));
        clearStatus(status);
        loadRooms().catch(() => {});
      }, 0);
    });

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-room-edit]");
      const deleteButton = event.target.closest("[data-room-delete]");

      if (editButton) {
        const room = rooms.find((entry) => `${entry.id}` === editButton.dataset.roomEdit);

        if (!room || !editForm || !editModal) {
          return;
        }

        editForm.dataset.editingId = `${room.id}`;
        document.getElementById("edit_room_id").value = room.id;
        document.getElementById("edit_room_name").value = room.name || "";
        document.getElementById("edit_room_number").value = room.roomNumber || room.id;
        document.getElementById("edit_room_hotel_id").value = room.hotelId;
        document.getElementById("edit_room_capacity").value = room.capacity;
        document.getElementById("edit_room_count").value = room.roomCount || 1;
        document.getElementById("edit_room_area").value = room.area;
        document.getElementById("edit_room_price").value = room.price;
        document.getElementById("edit_room_view").value = room.view;
        document.getElementById("edit_room_extension").value = room.extendable;
        document.getElementById("edit_room_state").value = room.state || "";
        document.getElementById("edit_room_amenities").value = room.amenities || "";
        clearStatus(editStatus);
        editModal.open();
      }

      if (deleteButton) {
        if (!confirmDangerAction("Supprimer cette chambre? Les réservations et locations associées seront aussi supprimées.")) {
          return;
        }

        apiRequest(`rooms.php?id=${deleteButton.dataset.roomDelete}`, {
          method: "DELETE"
        })
          .then(async () => {
            await loadRooms();
            showStatus(status, "La chambre a été supprimée.", "is-success");
            showToast("La chambre a été supprimée.");
          })
          .catch((error) => {
            showStatus(status, error.message, "is-error");
            showToast(error.message, "error");
          });
      }
    });

    const loadHotels = async () => {
      const references = await getReferenceData();
      hotelSelect.innerHTML = `
        <option value="">Sélectionnez un hôtel</option>
        ${(references.hotels || []).map((hotel) => `<option value="${hotel.id}">${hotel.nom}</option>`).join("")}
      `;
      if (editHotelSelect) {
        editHotelSelect.innerHTML = hotelSelect.innerHTML;
      }

      if (initialHotelId && !form.dataset.editingId) {
        hotelSelect.value = initialHotelId;
      }
    };

    const loadRooms = async () => {
      const payload = await apiRequest("rooms.php");
      const allRooms = payload.rooms || [];
      rooms = initialHotelId ? allRooms.filter((room) => `${room.hotelId}` === `${initialHotelId}`) : allRooms;
      renderRooms();
    };

    setIdentityLocked(false);

    const validateEdit = () => {
      const values = {
        capacity: document.getElementById("edit_room_capacity")?.value || "",
        roomCount: Number(document.getElementById("edit_room_count")?.value || 0),
        area: Number(document.getElementById("edit_room_area")?.value || 0),
        price: Number(document.getElementById("edit_room_price")?.value || 0),
        view: document.getElementById("edit_room_view")?.value.trim() || "",
        extendable: document.getElementById("edit_room_extension")?.value || "",
        state: document.getElementById("edit_room_state")?.value.trim() || "",
        amenities: document.getElementById("edit_room_amenities")?.value.trim() || ""
      };
      const errors = {};

      if (!values.capacity) errors.edit_room_capacity = "Selectionnez une capacite.";
      if (!values.roomCount) errors.edit_room_count = "Entrez un nombre de chambres valide.";
      if (!values.area) errors.edit_room_area = "Entrez une superficie valide.";
      if (!values.price) errors.edit_room_price = "Entrez un prix valide.";
      if (!values.extendable) errors.edit_room_extension = "Indiquez si la chambre est extensible.";

      [
        "edit_room_id",
        "edit_room_name",
        "edit_room_number",
        "edit_room_hotel_id",
        "edit_room_capacity",
        "edit_room_count",
        "edit_room_area",
        "edit_room_price",
        "edit_room_view",
        "edit_room_extension",
        "edit_room_state",
        "edit_room_amenities"
      ].forEach((field) => setFieldError(field, errors[field] || ""));
      return { valid: Object.keys(errors).length === 0, values };
    };

    editForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const editingId = editForm.dataset.editingId;
      const { valid, values } = validateEdit();

      if (!editingId || !valid) {
        if (!valid) {
          showStatus(editStatus, "Veuillez corriger les champs chambre mis en evidence.", "is-error");
        }
        return;
      }

      apiRequest("rooms.php", {
        method: "PUT",
        body: {
          id: Number(editingId),
          name: document.getElementById("edit_room_name")?.value.trim(),
          roomNumber: Number(document.getElementById("edit_room_number")?.value || 0),
          hotelId: Number(document.getElementById("edit_room_hotel_id")?.value || 0),
          capacity: values.capacity,
          roomCount: values.roomCount,
          area: values.area,
          price: values.price,
          view: values.view,
          extendable: values.extendable,
          state: values.state,
          amenities: values.amenities
        }
      })
        .then(async () => {
          editForm.reset();
          delete editForm.dataset.editingId;
          await loadRooms();
          editModal?.close();
          showStatus(status, "La chambre a été mise à jour.", "is-success");
          showToast("La chambre a été mise à jour.");
        })
        .catch((error) => {
          showStatus(editStatus, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    editForm?.addEventListener("reset", () => {
      window.setTimeout(() => {
        [
          "edit_room_id",
          "edit_room_name",
          "edit_room_number",
          "edit_room_hotel_id",
          "edit_room_capacity",
          "edit_room_count",
          "edit_room_area",
          "edit_room_price",
          "edit_room_view",
          "edit_room_extension",
          "edit_room_state",
          "edit_room_amenities"
        ].forEach((field) => setFieldError(field, ""));
        clearStatus(editStatus);
      }, 0);
    });

    Promise.all([loadHotels(), loadRooms()]).catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  const initializeEmployeeManagement = () => {
    const form = document.getElementById("employeeManagementForm");
    const status = document.getElementById("employeeStatus");
    const results = document.getElementById("employeeResults");
    const hotelSelect = document.getElementById("employee_hotel_id");
    const createButton = document.getElementById("openEmployeeCreateModal");
    const createForm = document.getElementById("employeeCreateForm");
    const createStatus = document.getElementById("employeeCreateStatus");
    const createModal = createModalController("employeeCreateModal");
    const createHotelSelect = document.getElementById("create_employee_hotel_id");
    const editForm = document.getElementById("employeeEditForm");
    const editStatus = document.getElementById("employeeEditStatus");
    const editModal = createModalController("employeeEditModal");
    const editHotelSelect = document.getElementById("edit_employee_hotel_id");

    if (!form || !status || !results || !hotelSelect) {
      return;
    }

    let employees = [];
    const fields = ["employee_full_name", "employee_address", "employee_nas", "employee_role", "employee_hotel_id"];
    const createFields = [
      "create_employee_full_name",
      "create_employee_address",
      "create_employee_nas",
      "create_employee_role",
      "create_employee_hotel_id"
    ];

    const renderEmployees = (list = employees) => {
      results.innerHTML = list
        .map(
          (employee) => `
            <article class="data-card">
              <h4>${employee.fullName}</h4>
              <p><strong>ID :</strong> ${employee.id}</p>
              <p><strong>Adresse :</strong> ${employee.address || "N/D"}</p>
              <p><strong>NAS :</strong> ${employee.nas}</p>
              <p><strong>Rôle :</strong> ${normalizeEmployeeRole(employee.role)}</p>
              <p><strong>Hôtel :</strong> ${employee.hotelName}</p>
              <div class="data-card-actions">
                <button type="button" class="btn btn-secondary" data-employee-edit="${employee.id}">Modifier</button>
                <button type="button" class="btn btn-danger" data-employee-delete="${employee.id}">Supprimer</button>
              </div>
            </article>
          `
        )
        .join("");
    };

    const filterEmployees = (values) =>
      employees.filter((employee) => {
        if (values.employee_full_name?.trim() && !employee.fullName.toLowerCase().includes(values.employee_full_name.trim().toLowerCase())) {
          return false;
        }

        if (values.employee_address?.trim() && !(employee.address || "").toLowerCase().includes(values.employee_address.trim().toLowerCase())) {
          return false;
        }

        if (values.employee_nas?.trim() && !employee.nas.toLowerCase().includes(values.employee_nas.trim().toLowerCase())) {
          return false;
        }

        if (values.employee_role && normalizeEmployeeRole(employee.role) !== normalizeEmployeeRole(values.employee_role)) {
          return false;
        }

        if (values.employee_hotel_id && `${employee.hotelId}` !== `${values.employee_hotel_id}`) {
          return false;
        }

        return true;
      });

    const validateEdit = () => {
      const values = {
        role: document.getElementById("edit_employee_role")?.value || "",
        hotelId: document.getElementById("edit_employee_hotel_id")?.value || "",
        address: document.getElementById("edit_employee_address")?.value.trim() || ""
      };
      const errors = {};

      if (!values.role) {
        errors.edit_employee_role = "Sélectionnez un rôle.";
      }
      if (!values.hotelId) {
        errors.edit_employee_hotel_id = "Sélectionnez un hôtel.";
      }

      [
        "edit_employee_full_name",
        "edit_employee_address",
        "edit_employee_nas",
        "edit_employee_role",
        "edit_employee_hotel_id"
      ].forEach((field) => setFieldError(field, errors[field] || ""));
      return { valid: Object.keys(errors).length === 0, values };
    };

    const validateCreate = () => {
      const values = {
        fullName: document.getElementById("create_employee_full_name")?.value.trim() || "",
        address: document.getElementById("create_employee_address")?.value.trim() || "",
        nas: document.getElementById("create_employee_nas")?.value.trim() || "",
        role: document.getElementById("create_employee_role")?.value || "",
        hotelId: Number(document.getElementById("create_employee_hotel_id")?.value || 0)
      };
      const errors = {};

      if (!values.fullName) errors.create_employee_full_name = "Entrez le nom complet.";
      if (!values.nas) errors.create_employee_nas = "Entrez le NAS.";
      if (!values.role) errors.create_employee_role = "Sélectionnez un rôle.";
      if (!values.hotelId) errors.create_employee_hotel_id = "Sélectionnez un hôtel.";

      createFields.forEach((field) => setFieldError(field, errors[field] || ""));
      return { valid: Object.keys(errors).length === 0, values };
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const values = Object.fromEntries(new FormData(form).entries());
      const filteredEmployees = filterEmployees(values);
      renderEmployees(filteredEmployees);
      showStatus(status, `${filteredEmployees.length} employé${filteredEmployees.length === 1 ? "" : "s"} trouvé${filteredEmployees.length === 1 ? "" : "s"}.`, "is-success");
    });

    createButton?.addEventListener("click", async () => {
      if (!createForm || !createModal || !createHotelSelect) {
        return;
      }

      try {
        const references = await getReferenceData();
        createHotelSelect.innerHTML = `
          <option value="">Sélectionnez un hôtel</option>
          ${(references.hotels || []).map((hotel) => `<option value="${hotel.id}">${hotel.nom}</option>`).join("")}
        `;
      } catch (error) {
        showStatus(status, error.message, "is-error");
        return;
      }

      createForm.reset();
      createFields.forEach((field) => setFieldError(field, ""));
      clearStatus(createStatus);
      createModal.open();
    });

    createForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const { valid, values } = validateCreate();

      if (!valid) {
        showStatus(createStatus, "Veuillez corriger les champs employés mis en évidence.", "is-error");
        return;
      }

      apiRequest("employees.php", {
        method: "POST",
        body: values
      })
        .then(async () => {
          createForm.reset();
          createFields.forEach((field) => setFieldError(field, ""));
          clearStatus(createStatus);
          referenceDataPromise = null;
          await loadEmployees();
          createModal?.close();
          showStatus(status, "L'employé a été ajouté.", "is-success");
          showToast("L'employé a été ajouté.");
        })
        .catch((error) => {
          showStatus(createStatus, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    createForm?.addEventListener("reset", () => {
      window.setTimeout(() => {
        createFields.forEach((field) => setFieldError(field, ""));
        clearStatus(createStatus);
      }, 0);
    });

    editForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const editingId = editForm.dataset.editingId;
      const { valid, values } = validateEdit();

      if (!editingId || !valid) {
        if (!valid) {
          showStatus(editStatus, "Veuillez corriger les champs employés mis en évidence.", "is-error");
        }
        return;
      }

      apiRequest("employees.php", {
        method: "PUT",
        body: {
          id: editingId,
          fullName: document.getElementById("edit_employee_full_name")?.value.trim(),
          address: values.address,
          nas: document.getElementById("edit_employee_nas")?.value.trim(),
          role: values.role,
          hotelId: Number(values.hotelId)
        }
      })
        .then(async () => {
          editForm.reset();
          delete editForm.dataset.editingId;
          referenceDataPromise = null;
          await loadEmployees();
          editModal?.close();
          showStatus(status, "L'employé a été mis à jour.", "is-success");
          showToast("L'employé a été mis à jour.");
        })
        .catch((error) => {
          showStatus(editStatus, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-employee-edit]");
      const deleteButton = event.target.closest("[data-employee-delete]");

      if (editButton) {
        const employee = employees.find((entry) => `${entry.id}` === editButton.dataset.employeeEdit);

        if (!employee || !editForm || !editModal) {
          return;
        }

        editForm.dataset.editingId = `${employee.id}`;
        document.getElementById("edit_employee_full_name").value = employee.fullName;
        document.getElementById("edit_employee_address").value = employee.address;
        document.getElementById("edit_employee_nas").value = employee.nas;
        document.getElementById("edit_employee_role").value = normalizeEmployeeRole(employee.role);
        document.getElementById("edit_employee_hotel_id").value = employee.hotelId;
        clearStatus(editStatus);
        editModal.open();
      }

      if (deleteButton) {
        if (!confirmDangerAction("Supprimer cet employé? Cette action est irréversible.")) {
          return;
        }

        apiRequest(`employees.php?id=${deleteButton.dataset.employeeDelete}`, {
          method: "DELETE"
        })
          .then(async () => {
            referenceDataPromise = null;
            await loadEmployees();
            showStatus(status, "L'employé a été supprimé.", "is-success");
            showToast("L'employé a été supprimé.");
          })
          .catch((error) => {
            showStatus(status, error.message, "is-error");
            showToast(error.message, "error");
          });
      }
    });

    const loadHotels = async () => {
      const references = await getReferenceData();
      hotelSelect.innerHTML = `
        <option value="">Sélectionnez un hôtel</option>
        ${(references.hotels || []).map((hotel) => `<option value="${hotel.id}">${hotel.nom}</option>`).join("")}
      `;
      if (editHotelSelect) {
        editHotelSelect.innerHTML = hotelSelect.innerHTML;
      }
    };

    const loadEmployees = async () => {
      const payload = await apiRequest("employees.php");
      employees = payload.employees || [];
      renderEmployees();
    };

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        fields.forEach((field) => setFieldError(field, ""));
        clearStatus(status);
        loadEmployees().catch(() => {});
      }, 0);
    });

    editForm?.addEventListener("reset", () => {
      window.setTimeout(() => {
        [
          "edit_employee_full_name",
          "edit_employee_address",
          "edit_employee_nas",
          "edit_employee_role",
          "edit_employee_hotel_id"
        ].forEach((field) => setFieldError(field, ""));
        clearStatus(editStatus);
      }, 0);
    });

    Promise.all([loadHotels(), loadEmployees()]).catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  const initializeReservationBrowser = () => {
    const form = document.getElementById("reservationSearchForm");
    const results = document.getElementById("reservationResults");
    const summary = document.getElementById("reservationResultsSummary");

    if (!form || !results || !summary) {
      return;
    }

    let allReservations = [];
    const editModal = createModalController("reservationEditModal");
    const convertModal = createModalController("reservationConvertModal");
    const editForm = document.getElementById("reservationEditForm");
    const convertForm = document.getElementById("reservationConvertForm");
    const editStatus = document.getElementById("reservationEditStatus");
    const convertStatus = document.getElementById("reservationConvertStatus");

    const renderReservations = (reservations) => {
      summary.textContent = `${reservations.length} réservation${reservations.length === 1 ? "" : "s"} trouvée${reservations.length === 1 ? "" : "s"}.`;

      results.innerHTML = reservations.length
        ? reservations
            .map(
              (reservation) => `
                <article class="data-card">
                  <h4>Réservation #${reservation.id}</h4>
                  <p><strong>Client :</strong> ${reservation.clientName}</p>
                  <p><strong>Chambre :</strong> ${reservation.roomName} (#${reservation.roomId})</p>
                  <p><strong>Hôtel :</strong> ${reservation.hotelName}</p>
                  <p><strong>Date de réservation :</strong> ${formatDateFr(reservation.reservationDate)}</p>
                  <p><strong>Séjour :</strong> ${formatDateFr(reservation.startDate)} au ${formatDateFr(reservation.endDate)}</p>
                  <p><strong>Statut :</strong> ${reservation.status || "N/D"}</p>
                  <div class="data-card-actions">
                    <button type="button" class="btn btn-secondary" data-reservation-edit="${reservation.id}">Modifier</button>
                    ${reservation.status && (reservation.status.toLowerCase() === 'confirmée' || reservation.status.toLowerCase() === 'réservée') ? `<button type="button" class="btn btn-primary" data-reservation-convert="${reservation.id}">Convertir</button>` : ""}
                  </div>
                </article>
              `
            )
            .join("")
        : `<article class="data-card"><p>Aucune réservation ne correspond à la recherche.</p></article>`;
    };

    const loadReservations = async () => {
      const values = Object.fromEntries(new FormData(form).entries());
      summary.textContent = "Chargement des réservations...";

      try {
        const payload = await apiRequest("reservations.php", {
          params: {
            q: values.reservation_query?.trim() || "",
            status: values.reservation_status_filter || ""
          }
        });
        allReservations = payload.reservations || [];
        renderReservations(allReservations);
      } catch (error) {
        summary.textContent = "Impossible de charger les réservations.";
        results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
      }
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      loadReservations();
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        loadReservations();
      }, 0);
    });

    if (editForm) {
      const editFields = [
        "edit_reservation_start_date",
        "edit_reservation_end_date"
      ];

      const validateEdit = () => {
        const values = {
          startDate: document.getElementById("edit_reservation_start_date")?.value || "",
          endDate: document.getElementById("edit_reservation_end_date")?.value || ""
        };
        const errors = {};

        if (!values.startDate) {
          errors.edit_reservation_start_date = "Entrez une date de début.";
        }
        if (!values.endDate) {
          errors.edit_reservation_end_date = "Entrez une date de fin.";
        }

        editFields.forEach((field) => {
          setFieldError(field, errors[field] || "");
        });

        return Object.keys(errors).length === 0;
      };

      editFields.forEach((field) => {
        const element = document.getElementById(field);
        if (element) {
          element.addEventListener("input", () => {
            setFieldError(field, "");
            clearStatus(editStatus);
          });
          element.addEventListener("change", () => {
            setFieldError(field, "");
            clearStatus(editStatus);
          });
        }
      });

      editForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!validateEdit()) {
          showStatus(editStatus, "Veuillez corriger les champs de modification mis en evidence.", "is-error");
          return;
        }

        const reservationId = editForm.dataset.editingId;
        const startDate = document.getElementById("edit_reservation_start_date")?.value;
        const endDate = document.getElementById("edit_reservation_end_date")?.value;

        showStatus(editStatus, "Mise à jour de la réservation en cours...", "is-success");

        apiRequest("reservations.php", {
          method: "PUT",
          body: {
            reservation_id: reservationId,
            start_date: startDate,
            end_date: endDate
          }
        })
          .then(() => {
            editModal.close();
            loadReservations();
            showToast("Réservation mise à jour avec succès.");
          })
          .catch((error) => {
            showStatus(editStatus, error.message, "is-error");
            showToast(error.message, "error");
          });
      });

      editForm.addEventListener("reset", () => {
        window.setTimeout(() => {
          editFields.forEach((field) => setFieldError(field, ""));
          clearStatus(editStatus);
        }, 0);
      });
    }

    if (convertForm) {
      const convertFields = [
        "convert_employee_id",
        "convert_checkin_date"
      ];

      const validateConvert = () => {
        const values = {
          employeeId: document.getElementById("convert_employee_id")?.value || "",
          checkinDate: document.getElementById("convert_checkin_date")?.value || ""
        };
        const errors = {};
        const today = new Date(getTodayIso());
        const checkInDate = values.checkinDate ? new Date(`${values.checkinDate}T00:00:00`) : null;

        if (!values.employeeId || Number(values.employeeId) <= 0) {
          errors.convert_employee_id = "Entrez un ID d'employé valide.";
        }

        if (!values.checkinDate) {
          errors.convert_checkin_date = "Choisissez une date d'arrivée.";
        } else if (checkInDate < today) {
          errors.convert_checkin_date = "La date d'arrivée ne peut pas être dans le passé.";
        }

        convertFields.forEach((field) => {
          setFieldError(field, errors[field] || "");
        });

        return Object.keys(errors).length === 0;
      };

      convertFields.forEach((field) => {
        const element = document.getElementById(field);
        if (element) {
          element.addEventListener("input", () => {
            setFieldError(field, "");
            clearStatus(convertStatus);
          });
          element.addEventListener("change", () => {
            setFieldError(field, "");
            clearStatus(convertStatus);
          });
        }
      });

      convertForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!validateConvert()) {
          showStatus(convertStatus, "Veuillez corriger les champs de conversion mis en evidence.", "is-error");
          return;
        }

        const reservationId = convertForm.dataset.convertingId;
        const values = Object.fromEntries(new FormData(convertForm).entries());

        showStatus(convertStatus, "Conversion de la réservation en cours...", "is-success");

        apiRequest("convert_reservation.php", {
          method: "POST",
          body: {
            reservation_id: reservationId,
            employee_id: values.employee_id,
            checkin_date: values.checkin_date,
            notes: values.notes || ""
          }
        })
          .then(() => {
            convertModal.close();
            loadReservations();
            showToast("Réservation convertie en location avec succès.");
          })
          .catch((error) => {
            showStatus(convertStatus, error.message, "is-error");
            showToast(error.message, "error");
          });
      });

      convertForm.addEventListener("reset", () => {
        window.setTimeout(() => {
          convertFields.forEach((field) => setFieldError(field, ""));
          clearStatus(convertStatus);
        }, 0);
      });
    }

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-reservation-edit]");
      const convertButton = event.target.closest("[data-reservation-convert]");

      if (editButton) {
        const reservation = allReservations.find((r) => `${r.id}` === editButton.dataset.reservationEdit);

        if (!reservation || !editForm || !editModal) {
          return;
        }

        editForm.dataset.editingId = `${reservation.id}`;
        document.getElementById("edit_reservation_id").value = reservation.id;
        document.getElementById("edit_reservation_client").value = reservation.clientName;
        document.getElementById("edit_reservation_room").value = `${reservation.roomName} (#${reservation.roomId})`;
        document.getElementById("edit_reservation_start_date").value = reservation.startDate;
        document.getElementById("edit_reservation_end_date").value = reservation.endDate;
        clearStatus(editStatus);
        editModal.open();
      }

      if (convertButton) {
        const reservation = allReservations.find((r) => `${r.id}` === convertButton.dataset.reservationConvert);

        if (!reservation || !convertForm || !convertModal) {
          return;
        }

        convertForm.dataset.convertingId = `${reservation.id}`;
        document.getElementById("convert_reservation_id").value = reservation.id;
        document.getElementById("convert_reservation_client").value = reservation.clientName;
        document.getElementById("convert_employee_id").value = "";
        document.getElementById("convert_checkin_date").value = "";
        document.getElementById("convert_notes").value = "";
        clearStatus(convertStatus);
        convertModal.open();
      }
    });

    loadReservations();
  };

  const initializeLocationBrowser = () => {
    const form = document.getElementById("locationSearchForm");
    const results = document.getElementById("locationResults");
    const summary = document.getElementById("locationResultsSummary");

    if (!form || !results || !summary) {
      return;
    }

    const renderLocations = (locations) => {
      summary.textContent = `${locations.length} location${locations.length === 1 ? "" : "s"} trouvée${locations.length === 1 ? "" : "s"}.`;

      results.innerHTML = locations.length
        ? locations
            .map(
              (location) => `
                <article class="data-card">
                  <h4>Location #${location.id}</h4>
                  <p><strong>Client :</strong> ${location.clientName}</p>
                  <p><strong>Chambre :</strong> ${location.roomName} (#${location.roomId})</p>
                  <p><strong>Hôtel :</strong> ${location.hotelName}</p>
                  <p><strong>Employé :</strong> ${location.employeeName}${location.employeeId ? ` (#${location.employeeId})` : ""}</p>
                  <p><strong>Check-in :</strong> ${formatDateFr(location.checkinDate)}</p>
                  <p><strong>Séjour :</strong> ${formatDateFr(location.startDate)} au ${formatDateFr(location.endDate)}</p>
                  <p><strong>Réservation source :</strong> ${location.reservationId ? `#${location.reservationId}` : "Aucune"}</p>
                </article>
              `
            )
            .join("")
        : `<article class="data-card"><p>Aucune location ne correspond à la recherche.</p></article>`;
    };

    const loadLocations = async () => {
      const values = Object.fromEntries(new FormData(form).entries());
      summary.textContent = "Chargement des locations...";

      try {
        const payload = await apiRequest("locations.php", {
          params: {
            q: values.location_query?.trim() || ""
          }
        });
        renderLocations(payload.locations || []);
      } catch (error) {
        summary.textContent = "Impossible de charger les locations.";
        results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
      }
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      loadLocations();
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        loadLocations();
      }, 0);
    });

    loadLocations();
  };

  const initializeHotelManagement = () => {
    const form = document.getElementById("hotelManagementForm");
    const status = document.getElementById("hotelStatus");
    const results = document.getElementById("hotelResults");
    const chainSelect = document.getElementById("hotel_chain_id");
    const managerSelect = document.getElementById("hotel_manager_id");
    const createButton = document.getElementById("openHotelCreateModal");
    const createForm = document.getElementById("hotelCreateForm");
    const createStatus = document.getElementById("hotelCreateStatus");
    const createModal = createModalController("hotelCreateModal");
    const createChainSelect = document.getElementById("create_hotel_chain_id");
    const createManagerSelect = document.getElementById("create_hotel_manager_id");
    const editForm = document.getElementById("hotelEditForm");
    const editStatus = document.getElementById("hotelEditStatus");
    const editModal = createModalController("hotelEditModal");
    const editChainSelect = document.getElementById("edit_hotel_chain_id");
    const editManagerSelect = document.getElementById("edit_hotel_manager_id");

    if (!form || !status || !results || !chainSelect || !managerSelect) {
      return;
    }

    let hotels = [];

    const fields = ["hotel_name", "hotel_chain_id", "hotel_category", "hotel_address"];
    const createFields = [
      "create_hotel_name",
      "create_hotel_chain_id",
      "create_hotel_category",
      "create_hotel_address"
    ];

    const renderHotels = (list = hotels) => {
      results.innerHTML = list
        .map(
          (hotel) => `
            <article class="data-card">
              <h4>${hotel.name}</h4>
              <p><strong>Chaîne :</strong> ${hotel.chainName}</p>
              <p><strong>Catégorie :</strong> ${hotel.category} étoiles</p>
              <p><strong>Adresse :</strong> ${hotel.address}</p>
              <p><strong>Email :</strong> ${hotel.email || "N/D"}</p>
              <p><strong>Téléphone :</strong> ${hotel.phone || "N/D"}</p>
              <p><strong>Gestionnaire :</strong> ${hotel.managerName || "Non assigné"}</p>
              <div class="data-card-actions">
                <button type="button" class="btn btn-secondary" data-hotel-edit="${hotel.id}">Modifier</button>
                <a class="btn btn-secondary" href="chambres.html?hotel_id=${hotel.id}&hotel_nom=${encodeURIComponent(hotel.name)}">Modifier chambres</a>
                <button type="button" class="btn btn-danger" data-hotel-delete="${hotel.id}">Supprimer</button>
              </div>
            </article>
          `
        )
        .join("");
    };

    const filterHotels = (values) =>
      hotels.filter((hotel) => {
        if (values.hotel_name?.trim() && !hotel.name.toLowerCase().includes(values.hotel_name.trim().toLowerCase())) {
          return false;
        }

        if (values.hotel_chain_id && `${hotel.chainId}` !== `${values.hotel_chain_id}`) {
          return false;
        }

        if (values.hotel_category && `${hotel.category}` !== `${values.hotel_category}`) {
          return false;
        }

        if (values.hotel_address?.trim() && !hotel.address.toLowerCase().includes(values.hotel_address.trim().toLowerCase())) {
          return false;
        }

        if (values.hotel_email?.trim() && !(hotel.email || "").toLowerCase().includes(values.hotel_email.trim().toLowerCase())) {
          return false;
        }

        if (values.hotel_phone?.trim() && !(hotel.phone || "").toLowerCase().includes(values.hotel_phone.trim().toLowerCase())) {
          return false;
        }

        if (values.hotel_manager_id && `${hotel.managerId || ""}` !== `${values.hotel_manager_id}`) {
          return false;
        }

        return true;
      });

    const validateEdit = () => {
      const values = {
        category: document.getElementById("edit_hotel_category")?.value || "",
        address: document.getElementById("edit_hotel_address")?.value.trim() || "",
        email: document.getElementById("edit_hotel_email")?.value.trim() || "",
        phone: document.getElementById("edit_hotel_phone")?.value.trim() || "",
        managerId: document.getElementById("edit_hotel_manager_id")?.value || ""
      };
      const errors = {};

      if (!values.category) {
        errors.edit_hotel_category = "Sélectionnez une catégorie.";
      }
      if (!values.address) {
        errors.edit_hotel_address = "Entrez l'adresse.";
      }

      [
        "edit_hotel_name",
        "edit_hotel_chain_id",
        "edit_hotel_category",
        "edit_hotel_address",
        "edit_hotel_email",
        "edit_hotel_phone",
        "edit_hotel_manager_id"
      ].forEach((field) => setFieldError(field, errors[field] || ""));
      return { valid: Object.keys(errors).length === 0, values };
    };

    const validateCreate = () => {
      const values = {
        name: document.getElementById("create_hotel_name")?.value.trim() || "",
        chainId: Number(document.getElementById("create_hotel_chain_id")?.value || 0),
        category: Number(document.getElementById("create_hotel_category")?.value || 0),
        address: document.getElementById("create_hotel_address")?.value.trim() || "",
        email: document.getElementById("create_hotel_email")?.value.trim() || "",
        phone: document.getElementById("create_hotel_phone")?.value.trim() || "",
        managerId: Number(document.getElementById("create_hotel_manager_id")?.value || 0) || undefined
      };
      const errors = {};

      if (!values.name) errors.create_hotel_name = "Entrez le nom de l'hôtel.";
      if (!values.chainId) errors.create_hotel_chain_id = "Sélectionnez une chaîne.";
      if (!values.category) errors.create_hotel_category = "Sélectionnez une catégorie.";
      if (!values.address) errors.create_hotel_address = "Entrez l'adresse.";

      createFields.forEach((field) => setFieldError(field, errors[field] || ""));
      return { valid: Object.keys(errors).length === 0, values };
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const values = Object.fromEntries(new FormData(form).entries());
      const filteredHotels = filterHotels(values);
      renderHotels(filteredHotels);
      showStatus(status, `${filteredHotels.length} hôtel${filteredHotels.length === 1 ? "" : "s"} trouvé${filteredHotels.length === 1 ? "" : "s"}.`, "is-success");
    });

    createButton?.addEventListener("click", async () => {
      if (!createForm || !createModal || !createChainSelect || !createManagerSelect) {
        return;
      }

      try {
        const references = await getReferenceData();
        createChainSelect.innerHTML = `
          <option value="">Sélectionnez une chaîne</option>
          ${(references.chains || []).map((chain) => `<option value="${chain.id}">${chain.nom}</option>`).join("")}
        `;
        createManagerSelect.innerHTML = `
          <option value="">Sélectionnez un gestionnaire</option>
          ${(references.employees || [])
            .filter((employee) => normalizeEmployeeRole(employee.role) === "Gestionnaire")
            .map((employee) => `<option value="${employee.id}">${employee.nom}</option>`)
            .join("")}
        `;
      } catch (error) {
        showStatus(status, error.message, "is-error");
        return;
      }

      createForm.reset();
      createFields.forEach((field) => setFieldError(field, ""));
      clearStatus(createStatus);
      createModal.open();
    });

    createForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const { valid, values } = validateCreate();

      if (!valid) {
        showStatus(createStatus, "Veuillez corriger les champs hôtels mis en évidence.", "is-error");
        return;
      }

      apiRequest("hotels.php", {
        method: "POST",
        body: values
      })
        .then(async () => {
          createForm.reset();
          createFields.forEach((field) => setFieldError(field, ""));
          clearStatus(createStatus);
          referenceDataPromise = null;
          await Promise.all([loadReferences(), loadHotels()]);
          createModal?.close();
          showStatus(status, "L'hôtel a été ajouté.", "is-success");
          showToast("L'hôtel a été ajouté.");
        })
        .catch((error) => {
          showStatus(createStatus, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    createForm?.addEventListener("reset", () => {
      window.setTimeout(() => {
        createFields.forEach((field) => setFieldError(field, ""));
        clearStatus(createStatus);
      }, 0);
    });

    editForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const editingId = editForm.dataset.editingId;
      const { valid, values } = validateEdit();

      if (!editingId || !valid) {
        if (!valid) {
          showStatus(editStatus, "Veuillez corriger les champs hôtels mis en évidence.", "is-error");
        }
        return;
      }

      apiRequest("hotels.php", {
        method: "PUT",
        body: {
          id: editingId,
          name: document.getElementById("edit_hotel_name")?.value.trim(),
          chainId: Number(document.getElementById("edit_hotel_chain_id")?.value || 0),
          category: Number(values.category),
          address: values.address,
          email: values.email,
          phone: values.phone,
          managerId: values.managerId ? Number(values.managerId) : undefined
        }
      })
        .then(async () => {
          editForm.reset();
          delete editForm.dataset.editingId;
          referenceDataPromise = null;
          await Promise.all([loadReferences(), loadHotels()]);
          editModal?.close();
          showStatus(status, "L'hôtel a été mis à jour.", "is-success");
          showToast("L'hôtel a été mis à jour.");
        })
        .catch((error) => {
          showStatus(editStatus, error.message, "is-error");
          showToast(error.message, "error");
        });
    });

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-hotel-edit]");
      const deleteButton = event.target.closest("[data-hotel-delete]");

      if (editButton) {
        const hotel = hotels.find((entry) => `${entry.id}` === editButton.dataset.hotelEdit);

        if (!hotel || !editForm || !editModal) {
          return;
        }

        editForm.dataset.editingId = `${hotel.id}`;
        document.getElementById("edit_hotel_name").value = hotel.name;
        document.getElementById("edit_hotel_chain_id").value = hotel.chainId;
        document.getElementById("edit_hotel_category").value = hotel.category;
        document.getElementById("edit_hotel_address").value = hotel.address;
        document.getElementById("edit_hotel_email").value = hotel.email;
        document.getElementById("edit_hotel_phone").value = hotel.phone;
        document.getElementById("edit_hotel_manager_id").value = hotel.managerId || "";
        clearStatus(editStatus);
        editModal.open();
      }

      if (deleteButton) {
        if (!confirmDangerAction("Supprimer cet hôtel? Les chambres, réservations, locations et employés associés seront aussi supprimés.")) {
          return;
        }

        apiRequest(`hotels.php?id=${deleteButton.dataset.hotelDelete}`, {
          method: "DELETE"
        })
          .then(async () => {
            referenceDataPromise = null;
            await Promise.all([loadReferences(), loadHotels()]);
            showStatus(status, "L'hôtel a été supprimé.", "is-success");
            showToast("L'hôtel a été supprimé.");
          })
          .catch((error) => {
            showStatus(status, error.message, "is-error");
            showToast(error.message, "error");
          });
      }
    });

    const loadReferences = async () => {
      const references = await getReferenceData();
      chainSelect.innerHTML = `
        <option value="">Sélectionnez une chaîne</option>
        ${(references.chains || []).map((chain) => `<option value="${chain.id}">${chain.nom}</option>`).join("")}
      `;
      if (editChainSelect) {
        editChainSelect.innerHTML = chainSelect.innerHTML;
      }
      managerSelect.innerHTML = `
        <option value="">Sélectionnez un gestionnaire</option>
        ${(references.employees || [])
          .filter((employee) => normalizeEmployeeRole(employee.role) === "Gestionnaire")
          .map((employee) => `<option value="${employee.id}">${employee.nom}</option>`)
          .join("")}
      `;
      if (editManagerSelect) {
        editManagerSelect.innerHTML = managerSelect.innerHTML;
      }
    };

    const loadHotels = async () => {
      const payload = await apiRequest("hotels.php");
      hotels = payload.hotels || [];
      renderHotels();
    };

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        clearStatus(status);
        loadHotels().catch(() => {});
      }, 0);
    });

    editForm?.addEventListener("reset", () => {
      window.setTimeout(() => {
        [
          "edit_hotel_name",
          "edit_hotel_chain_id",
          "edit_hotel_category",
          "edit_hotel_address",
          "edit_hotel_email",
          "edit_hotel_phone",
          "edit_hotel_manager_id"
        ].forEach((field) => setFieldError(field, ""));
        clearStatus(editStatus);
      }, 0);
    });

    Promise.all([loadReferences(), loadHotels()]).catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  initializeNavDropdowns();
  initializeManagementResetLinks();
  initializeSearch();
  autofillReservationRoom();
  initializeReservationForm();
  initializeReservationConfirmation();
  initializeRentalForm();
  initializeClientManagement();
  initializeRoomManagement();
  initializeEmployeeManagement();
  initializeHotelManagement();
  initializeReservationBrowser();
  initializeLocationBrowser();
});
