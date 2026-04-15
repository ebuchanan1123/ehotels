(function () {
  const app = window.EHotels;
  const {
    apiRequest,
    clearStatus,
    formatDateFr,
    getTodayIso,
    reservationConfirmationStorageKey,
    safeJsonParse,
    setFieldError,
    showStatus,
    showToast
  } = app;

  app.initializeSearch = () => {
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

  app.autofillReservationRoom = async () => {
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

  app.initializeReservationForm = () => {
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
            reservationConfirmationStorageKey,
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

  app.initializeReservationConfirmation = () => {
    const detailsContainer = document.getElementById("confirmationDetails");
    const title = document.getElementById("confirmationReservationTitle");
    const badge = document.getElementById("confirmationStatusBadge");

    if (!detailsContainer || !title || !badge) {
      return;
    }

    const details = safeJsonParse(window.sessionStorage.getItem(reservationConfirmationStorageKey), null);

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

  app.initializeRentalForm = () => {
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

  app.registerInitializer(app.initializeSearch);
  app.registerInitializer(() => {
    app.autofillReservationRoom();
  });
  app.registerInitializer(app.initializeReservationForm);
  app.registerInitializer(app.initializeReservationConfirmation);
  app.registerInitializer(app.initializeRentalForm);
})();
