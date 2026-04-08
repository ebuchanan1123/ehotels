document.addEventListener("DOMContentLoaded", () => {
  const apiBaseUrl = "../backend";

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
        <option value="">Peu importe</option>
        ${chains
          .map((chainLabel) => {
            const normalized = chainLabel.toLowerCase().replaceAll(" ", "");
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
      const hotels = roomsCache
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
                        <a class="btn btn-primary" href="reserve.html?room_id=${room.id}">Réserver</a>
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
          if (!filters.location && !filters.hotelId && !filters.capacity && !filters.chain && !filters.category && !filters.maxPrice && !filters.minArea && !filters.roomCount && !filters.startDate && !filters.endDate) {
            allRoomsCache = roomsCache;
          }
          renderLocationOptions(allRoomsCache.length > 0 ? allRoomsCache : roomsCache);
          renderChainOptions(roomsCache);
          updateHotelOptions();
          renderHotels(roomsCache);
        })
        .catch((error) => {
          resultsSummary.textContent = "Impossible de charger les chambres depuis PostgreSQL.";
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

    if (!reservationRoomField) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room_id");

    if (roomId) {
      reservationRoomField.value = roomId;

      if (selectedRoomSummary) {
        selectedRoomSummary.className = "selected-room-card is-loading";
        selectedRoomSummary.innerHTML = "<p>Chargement des détails de la chambre...</p>";
      }

      try {
        const payload = await apiRequest(`rooms.php?id=${roomId}`);
        const room = payload.room;

        if (selectedRoomSummary && room) {
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
      } catch (error) {
        if (selectedRoomSummary) {
          selectedRoomSummary.className = "selected-room-card is-empty";
          selectedRoomSummary.innerHTML = `<p>${error.message}</p>`;
        }
      }
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

          window.location.href = "reservation-confirmation.html";
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
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
          showStatus(
            status,
            `Location ${payload.rental?.id_location || ""} créée avec succès dans PostgreSQL.`,
            "is-success"
          );
          form.reset();
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
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

  const initializeConvertForm = () => {
    const form = document.getElementById("convertForm");
    const status = document.getElementById("convertStatus");
    const summary = document.getElementById("convertSummary");

    if (!form || !summary) {
      return;
    }

    const fields = [
      "reservation_id",
      "convert_employee_id",
      "convert_checkin_date",
      "convert_start_date",
      "convert_end_date",
      "conversion_notes"
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
        { label: "Reservation", value: values.reservation_id || "Non selectionnee" },
        { label: "Client associe", value: "Récupéré depuis PostgreSQL lors de la conversion" },
        { label: "Chambre associee", value: "Récupérée depuis PostgreSQL lors de la conversion" },
        { label: "ID de l'employe", value: values.employee_id || "Non assigne" },
        { label: "Date d'arrivee", value: formatDateFr(values.checkin_date) },
        { label: "Date de debut", value: formatDateFr(values.start_date) },
        { label: "Date de fin", value: formatDateFr(values.end_date) },
        { label: "Duree du sejour", value: nights && nights > 0 ? `${nights} nuit${nights === 1 ? "" : "s"}` : "Dates incompletes" },
        { label: "Notes", value: values.notes?.trim() || "Aucune note" }
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

      if (!values.reservation_id || Number(values.reservation_id) <= 0) {
        errors.reservation_id = "Entrez un ID de reservation valide.";
      }

      if (!values.employee_id || Number(values.employee_id) <= 0) {
        errors.convert_employee_id = "Entrez un ID d'employe valide.";
      }

      if (!values.checkin_date) {
        errors.convert_checkin_date = "Choisissez une date d'arrivee.";
      } else if (checkInDate < today) {
        errors.convert_checkin_date = "La date d'arrivee ne peut pas etre dans le passe.";
      }

      if (!values.start_date) {
        errors.convert_start_date = "Choisissez une date de debut de location.";
      } else if (startDate < today) {
        errors.convert_start_date = "La date de debut ne peut pas etre dans le passe.";
      }

      if (!values.end_date) {
        errors.convert_end_date = "Choisissez une date de fin de location.";
      } else if (startDate && endDate && endDate <= startDate) {
        errors.convert_end_date = "La date de fin doit etre apres la date de debut.";
      }

      if (checkInDate && startDate && checkInDate.getTime() !== startDate.getTime()) {
        errors.convert_start_date = "La date de debut doit correspondre a la date d'arrivee.";
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
        showStatus(status, "Veuillez corriger les champs de conversion mis en evidence avant de continuer.", "is-error");
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      showStatus(status, "Conversion de la réservation en cours...", "is-success");

      apiRequest("convert_reservation.php", {
        method: "POST",
        body: values
      })
        .then((payload) => {
          showStatus(
            status,
            `Réservation ${payload.reservation?.id_reservation || values.reservation_id} convertie avec succès.`,
            "is-success"
          );
          form.reset();
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
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

    if (!form || !results) {
      return;
    }

    let clients = [];

    const fields = [
      "client_full_name",
      "client_address",
      "client_nas_number",
      "client_id_type",
      "client_id_number",
      "client_registration_date"
    ];

    const formatIdType = (value) => {
      if (value === "passport") {
        return "Passeport";
      }
      if (value === "drivers_license") {
        return "Permis de conduire";
      }
      return "Carte d'identite nationale";
    };

    const renderClients = () => {
      results.innerHTML = clients
        .map(
          (client) => `
            <article class="data-card">
              <h4>Client ${client.id}</h4>
              <p><strong>Nom :</strong> ${client.fullName}</p>
              <p><strong>Adresse :</strong> ${client.address}</p>
              <p><strong>NAS / SSN :</strong> ${client.nas}</p>
              <p><strong>Type de piece :</strong> ${client.idTypeLabel}</p>
              <p><strong>Numero :</strong> ${client.idNumber}</p>
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

    const validate = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const errors = {};

      if (!values.client_full_name?.trim() || values.client_full_name.trim().length < 3) {
        errors.client_full_name = "Entrez le nom complet du client.";
      }

      if (!values.client_address?.trim() || values.client_address.trim().length < 6) {
        errors.client_address = "Entrez une adresse complete.";
      }

      if (!values.client_nas_number?.trim() || !/^[0-9 -]{6,20}$/.test(values.client_nas_number.trim())) {
        errors.client_nas_number = "Utilisez un format valide pour le NAS / SSN.";
      }

      if (!values.client_id_type) {
        errors.client_id_type = "Selectionnez un type de piece.";
      }

      if (!values.client_id_number?.trim() || values.client_id_number.trim().length < 4) {
        errors.client_id_number = "Entrez un numero de piece valide.";
      }

      if (!values.client_registration_date) {
        errors.client_registration_date = "Choisissez une date d'inscription.";
      }

      fields.forEach((field) => setFieldError(field, errors[field] || ""));
      return Object.keys(errors).length === 0;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validate()) {
        showStatus(status, "Veuillez corriger les champs clients mis en evidence.", "is-error");
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      const editingId = form.dataset.editingId;

      apiRequest("clients.php", {
        method: editingId ? "PUT" : "POST",
        body: {
          id: editingId || undefined,
          fullName: values.client_full_name.trim(),
          address: values.client_address.trim(),
          nas: values.client_nas_number.trim(),
          idType: values.client_id_type,
          idNumber: values.client_id_number.trim(),
          registrationDate: values.client_registration_date
        }
      })
        .then(async () => {
          delete form.dataset.editingId;
          form.reset();
          fields.forEach((field) => setFieldError(field, ""));
          clearStatus(status);
          await loadClients();
          showStatus(status, editingId ? "Le client a été mis à jour dans PostgreSQL." : "Le client a été ajouté dans PostgreSQL.", "is-success");
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
        });
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        delete form.dataset.editingId;
        fields.forEach((field) => setFieldError(field, ""));
        clearStatus(status);
      }, 0);
    });

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-client-edit]");
      const deleteButton = event.target.closest("[data-client-delete]");

      if (editButton) {
        const client = clients.find((entry) => `${entry.id}` === editButton.dataset.clientEdit);

        if (!client) {
          return;
        }

        form.dataset.editingId = `${client.id}`;
        document.getElementById("client_full_name").value = client.fullName;
        document.getElementById("client_address").value = client.address;
        document.getElementById("client_nas_number").value = client.nas;
        document.getElementById("client_id_type").value = client.idType;
        document.getElementById("client_id_number").value = client.idNumber;
        document.getElementById("client_registration_date").value = client.registrationDate;
        showStatus(status, `Modification du client ${client.id}.`, "is-success");
      }

      if (deleteButton) {
        apiRequest(`clients.php?id=${deleteButton.dataset.clientDelete}`, {
          method: "DELETE"
        })
          .then(async () => {
            await loadClients();
            showStatus(status, "Le client a été supprimé de PostgreSQL.", "is-success");
          })
          .catch((error) => {
            showStatus(status, error.message, "is-error");
          });
      }
    });

    const loadClients = async () => {
      const payload = await apiRequest("clients.php");
      clients = payload.clients || [];
      renderClients();
    };

    loadClients().catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  const initializeRoomManagement = () => {
    const form = document.getElementById("roomManagementForm");
    const status = document.getElementById("roomStatus");
    const results = document.getElementById("roomResults");
    const hotelSelect = document.getElementById("managed_room_hotel_id");

    if (!form || !results || !hotelSelect) {
      return;
    }

    let rooms = [];

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

    const renderRooms = () => {
      results.innerHTML = rooms
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

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validate()) {
        showStatus(status, "Veuillez corriger les champs chambre mis en evidence.", "is-error");
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      const editingId = form.dataset.editingId;
      const payload = {
        id: editingId ? Number(editingId) : undefined,
        name: values.managed_room_name.trim(),
        roomNumber: Number(values.managed_room_number),
        hotelId: Number(values.managed_room_hotel_id),
        capacity: values.managed_room_capacity,
        capacityLabel: formatCapacity(values.managed_room_capacity),
        roomCount: Number(values.managed_room_count),
        area: Number(values.managed_room_area),
        price: Number(values.managed_room_price),
        view: values.managed_room_view.trim(),
        extendable: values.managed_room_extension,
        extendableLabel: formatExtendable(values.managed_room_extension),
        state: values.managed_room_state.trim(),
        amenities: values.managed_room_amenities.trim()
      };

      apiRequest("rooms.php", {
        method: editingId ? "PUT" : "POST",
        body: payload
      })
        .then(async () => {
          delete form.dataset.editingId;
          form.reset();
          fields.forEach((field) => setFieldError(field, ""));
          await loadRooms();
          showStatus(status, editingId ? "La chambre a été mise à jour dans PostgreSQL." : "La chambre a été ajoutée dans PostgreSQL.", "is-success");
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
        });
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        delete form.dataset.editingId;
        fields.forEach((field) => setFieldError(field, ""));
        clearStatus(status);
      }, 0);
    });

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-room-edit]");
      const deleteButton = event.target.closest("[data-room-delete]");

      if (editButton) {
        const room = rooms.find((entry) => `${entry.id}` === editButton.dataset.roomEdit);

        if (!room) {
          return;
        }

        form.dataset.editingId = `${room.id}`;
        document.getElementById("managed_room_id").value = room.id;
        document.getElementById("managed_room_name").value = room.name || "";
        document.getElementById("managed_room_number").value = room.roomNumber || room.id;
        document.getElementById("managed_room_hotel_id").value = room.hotelId;
        document.getElementById("managed_room_capacity").value = room.capacity;
        document.getElementById("managed_room_count").value = room.roomCount || 1;
        document.getElementById("managed_room_area").value = room.area;
        document.getElementById("managed_room_price").value = room.price;
        document.getElementById("managed_room_view").value = room.view;
        document.getElementById("managed_room_extension").value = room.extendable;
        document.getElementById("managed_room_state").value = room.state || "";
        document.getElementById("managed_room_amenities").value = room.amenities || "";
        showStatus(status, `Modification de la chambre ${room.id}.`, "is-success");
      }

      if (deleteButton) {
        apiRequest(`rooms.php?id=${deleteButton.dataset.roomDelete}`, {
          method: "DELETE"
        })
          .then(async () => {
            await loadRooms();
            showStatus(status, "La chambre a été supprimée de PostgreSQL.", "is-success");
          })
          .catch((error) => {
            showStatus(status, error.message, "is-error");
          });
      }
    });

    const loadHotels = async () => {
      const references = await getReferenceData();
      hotelSelect.innerHTML = `
        <option value="">Sélectionnez un hôtel</option>
        ${(references.hotels || []).map((hotel) => `<option value="${hotel.id}">${hotel.nom}</option>`).join("")}
      `;
    };

    const loadRooms = async () => {
      const payload = await apiRequest("rooms.php");
      rooms = payload.rooms || [];
      renderRooms();
    };

    Promise.all([loadHotels(), loadRooms()]).catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  const initializeEmployeeManagement = () => {
    const form = document.getElementById("employeeManagementForm");
    const status = document.getElementById("employeeStatus");
    const results = document.getElementById("employeeResults");
    const hotelSelect = document.getElementById("employee_hotel_id");

    if (!form || !status || !results || !hotelSelect) {
      return;
    }

    let employees = [];

    const fields = ["employee_full_name", "employee_address", "employee_nas", "employee_role", "employee_hotel_id"];

    const renderEmployees = () => {
      results.innerHTML = employees
        .map(
          (employee) => `
            <article class="data-card">
              <h4>Employé ${employee.id}</h4>
              <p><strong>Nom :</strong> ${employee.fullName}</p>
              <p><strong>Adresse :</strong> ${employee.address || "N/D"}</p>
              <p><strong>NAS :</strong> ${employee.nas}</p>
              <p><strong>Rôle :</strong> ${employee.role}</p>
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

    const validate = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const errors = {};

      if (!values.employee_full_name?.trim()) {
        errors.employee_full_name = "Entrez le nom complet.";
      }
      if (!values.employee_nas?.trim()) {
        errors.employee_nas = "Entrez le NAS.";
      }
      if (!values.employee_role) {
        errors.employee_role = "Sélectionnez un rôle.";
      }
      if (!values.employee_hotel_id) {
        errors.employee_hotel_id = "Sélectionnez un hôtel.";
      }

      fields.forEach((field) => setFieldError(field, errors[field] || ""));
      return Object.keys(errors).length === 0;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validate()) {
        showStatus(status, "Veuillez corriger les champs employés mis en évidence.", "is-error");
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      const editingId = form.dataset.editingId;

      apiRequest("employees.php", {
        method: editingId ? "PUT" : "POST",
        body: {
          id: editingId || undefined,
          fullName: values.employee_full_name.trim(),
          address: values.employee_address.trim(),
          nas: values.employee_nas.trim(),
          role: values.employee_role,
          hotelId: Number(values.employee_hotel_id)
        }
      })
        .then(async () => {
          delete form.dataset.editingId;
          form.reset();
          fields.forEach((field) => setFieldError(field, ""));
          referenceDataPromise = null;
          await loadEmployees();
          showStatus(status, editingId ? "L'employé a été mis à jour." : "L'employé a été ajouté.", "is-success");
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
        });
    });

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-employee-edit]");
      const deleteButton = event.target.closest("[data-employee-delete]");

      if (editButton) {
        const employee = employees.find((entry) => `${entry.id}` === editButton.dataset.employeeEdit);

        if (!employee) {
          return;
        }

        form.dataset.editingId = `${employee.id}`;
        document.getElementById("employee_full_name").value = employee.fullName;
        document.getElementById("employee_address").value = employee.address;
        document.getElementById("employee_nas").value = employee.nas;
        document.getElementById("employee_role").value = employee.role;
        document.getElementById("employee_hotel_id").value = employee.hotelId;
      }

      if (deleteButton) {
        apiRequest(`employees.php?id=${deleteButton.dataset.employeeDelete}`, {
          method: "DELETE"
        })
          .then(async () => {
            referenceDataPromise = null;
            await loadEmployees();
            showStatus(status, "L'employé a été supprimé.", "is-success");
          })
          .catch((error) => {
            showStatus(status, error.message, "is-error");
          });
      }
    });

    const loadHotels = async () => {
      const references = await getReferenceData();
      hotelSelect.innerHTML = `
        <option value="">Sélectionnez un hôtel</option>
        ${(references.hotels || []).map((hotel) => `<option value="${hotel.id}">${hotel.nom}</option>`).join("")}
      `;
    };

    const loadEmployees = async () => {
      const payload = await apiRequest("employees.php");
      employees = payload.employees || [];
      renderEmployees();
    };

    Promise.all([loadHotels(), loadEmployees()]).catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  const initializeHotelManagement = () => {
    const form = document.getElementById("hotelManagementForm");
    const status = document.getElementById("hotelStatus");
    const results = document.getElementById("hotelResults");
    const chainSelect = document.getElementById("hotel_chain_id");
    const managerSelect = document.getElementById("hotel_manager_id");

    if (!form || !status || !results || !chainSelect || !managerSelect) {
      return;
    }

    let hotels = [];

    const fields = ["hotel_name", "hotel_chain_id", "hotel_category", "hotel_address"];

    const renderHotels = () => {
      results.innerHTML = hotels
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
                <button type="button" class="btn btn-danger" data-hotel-delete="${hotel.id}">Supprimer</button>
              </div>
            </article>
          `
        )
        .join("");
    };

    const validate = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const errors = {};

      if (!values.hotel_name?.trim()) {
        errors.hotel_name = "Entrez le nom de l'hôtel.";
      }
      if (!values.hotel_chain_id) {
        errors.hotel_chain_id = "Sélectionnez une chaîne.";
      }
      if (!values.hotel_category) {
        errors.hotel_category = "Sélectionnez une catégorie.";
      }
      if (!values.hotel_address?.trim()) {
        errors.hotel_address = "Entrez l'adresse.";
      }

      fields.forEach((field) => setFieldError(field, errors[field] || ""));
      return Object.keys(errors).length === 0;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validate()) {
        showStatus(status, "Veuillez corriger les champs hôtels mis en évidence.", "is-error");
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      const editingId = form.dataset.editingId;

      apiRequest("hotels.php", {
        method: editingId ? "PUT" : "POST",
        body: {
          id: editingId || undefined,
          name: values.hotel_name.trim(),
          chainId: Number(values.hotel_chain_id),
          category: Number(values.hotel_category),
          address: values.hotel_address.trim(),
          email: values.hotel_email.trim(),
          phone: values.hotel_phone.trim(),
          managerId: values.hotel_manager_id ? Number(values.hotel_manager_id) : undefined
        }
      })
        .then(async () => {
          delete form.dataset.editingId;
          form.reset();
          fields.forEach((field) => setFieldError(field, ""));
          referenceDataPromise = null;
          await Promise.all([loadReferences(), loadHotels()]);
          showStatus(status, editingId ? "L'hôtel a été mis à jour." : "L'hôtel a été ajouté.", "is-success");
        })
        .catch((error) => {
          showStatus(status, error.message, "is-error");
        });
    });

    results.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-hotel-edit]");
      const deleteButton = event.target.closest("[data-hotel-delete]");

      if (editButton) {
        const hotel = hotels.find((entry) => `${entry.id}` === editButton.dataset.hotelEdit);

        if (!hotel) {
          return;
        }

        form.dataset.editingId = `${hotel.id}`;
        document.getElementById("hotel_name").value = hotel.name;
        document.getElementById("hotel_chain_id").value = hotel.chainId;
        document.getElementById("hotel_category").value = hotel.category;
        document.getElementById("hotel_address").value = hotel.address;
        document.getElementById("hotel_email").value = hotel.email;
        document.getElementById("hotel_phone").value = hotel.phone;
        document.getElementById("hotel_manager_id").value = hotel.managerId || "";
      }

      if (deleteButton) {
        apiRequest(`hotels.php?id=${deleteButton.dataset.hotelDelete}`, {
          method: "DELETE"
        })
          .then(async () => {
            referenceDataPromise = null;
            await Promise.all([loadReferences(), loadHotels()]);
            showStatus(status, "L'hôtel a été supprimé.", "is-success");
          })
          .catch((error) => {
            showStatus(status, error.message, "is-error");
          });
      }
    });

    const loadReferences = async () => {
      const references = await getReferenceData();
      chainSelect.innerHTML = `
        <option value="">Sélectionnez une chaîne</option>
        ${(references.chains || []).map((chain) => `<option value="${chain.id}">${chain.nom}</option>`).join("")}
      `;
      managerSelect.innerHTML = `
        <option value="">Sélectionnez un gestionnaire</option>
        ${(references.employees || [])
          .filter((employee) => employee.role === "gestionnaire")
          .map((employee) => `<option value="${employee.id}">${employee.nom}</option>`)
          .join("")}
      `;
    };

    const loadHotels = async () => {
      const payload = await apiRequest("hotels.php");
      hotels = payload.hotels || [];
      renderHotels();
    };

    Promise.all([loadReferences(), loadHotels()]).catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  initializeSearch();
  autofillReservationRoom();
  initializeReservationForm();
  initializeReservationConfirmation();
  initializeRentalForm();
  initializeConvertForm();
  initializeClientManagement();
  initializeRoomManagement();
  initializeEmployeeManagement();
  initializeHotelManagement();
});
