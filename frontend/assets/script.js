document.addEventListener("DOMContentLoaded", () => {
  const storageKeys = {
    clients: "ehotels_mock_clients",
    rooms: "ehotels_mock_rooms"
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

  const frontendForms = [
    { id: "reservationForm" },
    { id: "rentalForm" },
    { id: "clientManagementForm" },
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
    const resultsGrid = document.getElementById("resultsGrid");
    const resultsSummary = document.getElementById("resultsSummary");

    if (!searchForm || !resultsGrid || !resultsSummary || !locationSelect || !hotelSelect) {
      return;
    }

    const locations = [...new Set(sampleRooms.map((room) => room.location))].sort();

    locationSelect.innerHTML = `
      <option value="">Toutes les localisations</option>
      ${locations.map((location) => `<option value="${location}">${location}</option>`).join("")}
    `;

    const updateHotelOptions = () => {
      const selectedLocation = locationSelect.value;
      const selectedChain = searchForm.elements.chaine.value;
      const hotels = sampleRooms
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
            <article class="hotel-card">
              <div class="hotel-card-header">
                <div>
                  <h4>${hotel.hotelName}</h4>
                  <p class="hotel-meta"><strong>Chaine :</strong> ${hotel.chainLabel}</p>
                  <p class="hotel-meta"><strong>Localisation :</strong> ${hotel.location}</p>
                  <p class="hotel-meta"><strong>Adresse :</strong> ${hotel.address}</p>
                  <p class="hotel-meta"><strong>Catégorie :</strong> ${hotel.category} étoiles</p>
                </div>
                <div class="hotel-match-count">
                  ${hotel.rooms.length} chambre${hotel.rooms.length === 1 ? "" : "s"} correspondent aux filtres
                </div>
              </div>

              <div class="hotel-room-list">
                ${hotel.rooms
                  .map(
                    (room) => `
                      <article class="room-chip">
                        <h5>Chambre ${room.id}</h5>
                        <p><strong>Capacité :</strong> ${room.capacityLabel}</p>
                        <p><strong>Superficie :</strong> ${room.area} m²</p>
                        <p><strong>Nombre de chambres :</strong> ${room.roomCount}</p>
                        <p><strong>Prix :</strong> ${room.price} $ / nuit</p>
                        <a class="btn btn-primary" href="reserve.html?room_id=${room.id}">Réserver</a>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </article>
          `
        )
        .join("");
    };

    const runSearch = () => {
      const formData = new FormData(searchForm);
      const filters = {
        location: formData.get("localisation")?.toString().trim(),
        hotelId: formData.get("hotel")?.toString().trim(),
        capacity: formData.get("capacité")?.toString().trim(),
        chain: formData.get("chaine")?.toString().trim(),
        category: formData.get("catégorie")?.toString().trim(),
        maxPrice: formData.get("prix_max")?.toString().trim(),
        minArea: formData.get("superficie_min")?.toString().trim(),
        roomCount: formData.get("nb_chambres")?.toString().trim()
      };

      const filteredRooms = sampleRooms.filter((room) => {
        if (filters.location && room.location !== filters.location) {
          return false;
        }

        if (filters.hotelId && `${room.hotelId}` !== filters.hotelId) {
          return false;
        }

        if (filters.capacity && room.capacity !== filters.capacity) {
          return false;
        }

        if (filters.chain && room.chain !== filters.chain) {
          return false;
        }

        if (filters.category && room.category !== Number(filters.category)) {
          return false;
        }

        if (filters.maxPrice && room.price > Number(filters.maxPrice)) {
          return false;
        }

        if (filters.minArea && room.area < Number(filters.minArea)) {
          return false;
        }

        if (filters.roomCount && room.roomCount < Number(filters.roomCount)) {
          return false;
        }

        return true;
      });

      renderHotels(filteredRooms);
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
      updateHotelOptions();
      runSearch();
    });

    searchForm.addEventListener("reset", () => {
      window.setTimeout(() => {
        updateHotelOptions();
        runSearch();
      }, 0);
    });

    updateHotelOptions();
    renderHotels(sampleRooms);
  };

  const autofillReservationRoom = () => {
    const reservationRoomField = document.getElementById("id_chambre");

    if (!reservationRoomField) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room_id");

    if (roomId) {
      reservationRoomField.value = roomId;
    }
  };

  const initializeReservationForm = () => {
    const form = document.getElementById("reservationForm");
    const status = document.getElementById("reservationStatus");
    const summary = document.getElementById("reservationSummary");

    if (!form || !summary) {
      return;
    }

    const fields = ["nom_complet", "adresse", "nas", "id_chambre", "date_debut", "date_fin"];

    const renderSummary = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const nights =
        values.date_debut && values.date_fin
          ? Math.round(
              (new Date(`${values.date_fin}T00:00:00`) - new Date(`${values.date_debut}T00:00:00`)) / (1000 * 60 * 60 * 24)
            )
          : null;

      const items = [
        { label: "Client", value: values.nom_complet?.trim() || "Non fourni" },
        { label: "Adresse", value: values.adresse?.trim() || "Non fournie" },
        { label: "NAS / SSN", value: values.nas?.trim() || "Non fourni" },
        { label: "ID de la chambre", value: values.id_chambre || "Non selectionne" },
        { label: "Date de debut", value: formatDateFr(values.date_debut) },
        { label: "Date de fin", value: formatDateFr(values.date_fin) },
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
        showStatus(status, "Veuillez corriger les champs de reservation mis en evidence avant de continuer.", "is-error");
        return;
      }

      showStatus(status, "Les details de la reservation sont valides. L'envoi vers le backend sera connecte ensuite.", "is-success");
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

      showStatus(status, "Les details de la location sont valides. L'envoi vers le backend sera connecte ensuite.", "is-success");
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

    const reservationById = (reservationId) => defaultReservations.find((entry) => `${entry.id}` === `${reservationId}`);

    const renderSummary = () => {
      const values = Object.fromEntries(new FormData(form).entries());
      const reservation = reservationById(values.reservation_id);
      const nights =
        values.start_date && values.end_date
          ? Math.round(
              (new Date(`${values.end_date}T00:00:00`) - new Date(`${values.start_date}T00:00:00`)) / (1000 * 60 * 60 * 24)
            )
          : null;

      const items = [
        { label: "Reservation", value: values.reservation_id || "Non selectionnee" },
        { label: "Client associe", value: reservation ? reservation.clientName : "A verifier" },
        { label: "Chambre associee", value: reservation ? `Chambre ${reservation.roomId}` : "A verifier" },
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
      const reservation = reservationById(values.reservation_id);

      if (!values.reservation_id || Number(values.reservation_id) <= 0) {
        errors.reservation_id = "Entrez un ID de reservation valide.";
      } else if (!reservation) {
        errors.reservation_id = "Cette reservation mock n'existe pas encore dans le frontend.";
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

      showStatus(status, "La conversion reservation vers location est prete. Le branchement backend sera ajoute ensuite.", "is-success");
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

    let clients = loadCollection(storageKeys.clients, defaultClients);

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

      if (editingId) {
        clients = clients.map((client) =>
          `${client.id}` === editingId
            ? {
                ...client,
                fullName: values.client_full_name.trim(),
                address: values.client_address.trim(),
                nas: values.client_nas_number.trim(),
                idType: values.client_id_type,
                idTypeLabel: formatIdType(values.client_id_type),
                idNumber: values.client_id_number.trim(),
                registrationDate: values.client_registration_date
              }
            : client
        );
        showStatus(status, "Le dossier client a ete mis a jour dans la maquette frontend.", "is-success");
      } else {
        const newId = Math.max(...clients.map((client) => client.id), 1000) + 1;
        clients.unshift({
          id: newId,
          fullName: values.client_full_name.trim(),
          address: values.client_address.trim(),
          nas: values.client_nas_number.trim(),
          idType: values.client_id_type,
          idTypeLabel: formatIdType(values.client_id_type),
          idNumber: values.client_id_number.trim(),
          registrationDate: values.client_registration_date
        });
        showStatus(status, "Le client a ete ajoute a la maquette frontend.", "is-success");
      }

      delete form.dataset.editingId;
      form.reset();
      fields.forEach((field) => setFieldError(field, ""));
      saveCollection(storageKeys.clients, clients);
      renderClients();
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
        clients = clients.filter((entry) => `${entry.id}` !== deleteButton.dataset.clientDelete);
        saveCollection(storageKeys.clients, clients);
        renderClients();
        showStatus(status, "Le client a ete retire de la maquette frontend.", "is-success");
      }
    });

    renderClients();
  };

  const initializeRoomManagement = () => {
    const form = document.getElementById("roomManagementForm");
    const status = document.getElementById("roomStatus");
    const results = document.getElementById("roomResults");

    if (!form || !results) {
      return;
    }

    let rooms = loadCollection(storageKeys.rooms, defaultManagedRooms);

    const fields = [
      "managed_room_id",
      "managed_hotel_chain",
      "managed_room_category",
      "managed_room_capacity",
      "managed_room_area",
      "managed_room_price",
      "managed_room_view",
      "managed_room_extension"
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

    const formatChain = (value) => {
      if (value === "luxstay") {
        return "LuxStay";
      }
      if (value === "urbanrest") {
        return "Urban Rest";
      }
      return "Northern Suites";
    };

    const formatExtendable = (value) => (value === "yes" ? "Oui" : "Non");

    const renderRooms = () => {
      results.innerHTML = rooms
        .map(
          (room) => `
            <article class="data-card">
              <h4>Chambre ${room.id}</h4>
              <p><strong>Chaine :</strong> ${room.chainLabel}</p>
              <p><strong>Categorie :</strong> ${room.category} etoiles</p>
              <p><strong>Capacite :</strong> ${room.capacityLabel}</p>
              <p><strong>Superficie :</strong> ${room.area} m²</p>
              <p><strong>Prix :</strong> ${room.price} $ / nuit</p>
              <p><strong>Vue :</strong> ${room.view || "Non specifiee"}</p>
              <p><strong>Extensible :</strong> ${room.extendableLabel}</p>
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

      if (!values.managed_room_id || Number(values.managed_room_id) <= 0) {
        errors.managed_room_id = "Entrez un ID de chambre valide.";
      }

      if (!values.managed_hotel_chain) {
        errors.managed_hotel_chain = "Selectionnez une chaine hoteliere.";
      }

      if (!values.managed_room_category) {
        errors.managed_room_category = "Selectionnez une categorie.";
      }

      if (!values.managed_room_capacity) {
        errors.managed_room_capacity = "Selectionnez une capacite.";
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
        id: Number(values.managed_room_id),
        chain: values.managed_hotel_chain,
        chainLabel: formatChain(values.managed_hotel_chain),
        category: Number(values.managed_room_category),
        capacity: values.managed_room_capacity,
        capacityLabel: formatCapacity(values.managed_room_capacity),
        area: Number(values.managed_room_area),
        price: Number(values.managed_room_price),
        view: values.managed_room_view.trim(),
        extendable: values.managed_room_extension,
        extendableLabel: formatExtendable(values.managed_room_extension)
      };

      if (editingId) {
        rooms = rooms.map((room) => (`${room.id}` === editingId ? payload : room));
        showStatus(status, "La chambre a ete mise a jour dans la maquette frontend.", "is-success");
      } else {
        rooms.unshift(payload);
        showStatus(status, "La chambre a ete ajoutee a la maquette frontend.", "is-success");
      }

      delete form.dataset.editingId;
      form.reset();
      fields.forEach((field) => setFieldError(field, ""));
      saveCollection(storageKeys.rooms, rooms);
      renderRooms();
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
        document.getElementById("managed_hotel_chain").value = room.chain;
        document.getElementById("managed_room_category").value = room.category;
        document.getElementById("managed_room_capacity").value = room.capacity;
        document.getElementById("managed_room_area").value = room.area;
        document.getElementById("managed_room_price").value = room.price;
        document.getElementById("managed_room_view").value = room.view;
        document.getElementById("managed_room_extension").value = room.extendable;
        showStatus(status, `Modification de la chambre ${room.id}.`, "is-success");
      }

      if (deleteButton) {
        rooms = rooms.filter((entry) => `${entry.id}` !== deleteButton.dataset.roomDelete);
        saveCollection(storageKeys.rooms, rooms);
        renderRooms();
        showStatus(status, "La chambre a ete retiree de la maquette frontend.", "is-success");
      }
    });

    renderRooms();
  };

  initializeSearch();
  autofillReservationRoom();
  initializeReservationForm();
  initializeRentalForm();
  initializeConvertForm();
  initializeClientManagement();
  initializeRoomManagement();
});
