(function () {
  const app = window.EHotels;
  const {
    apiRequest,
    clearStatus,
    confirmDangerAction,
    createModalController,
    formatDateFr,
    getTodayIso,
    normalizeReservationStatus,
    setFieldError,
    showStatus,
    showToast
  } = app;

  app.initializeReservationBrowser = () => {
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
    const cancelReservationButton = document.getElementById("cancelReservationButton");
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
                  <p><strong>Statut :</strong> ${normalizeReservationStatus(reservation.status) || "N/D"}</p>
                  <div class="data-card-actions">
                    <button type="button" class="btn btn-secondary" data-reservation-edit="${reservation.id}">Modifier</button>
                    ${reservation.status && ["Confirmée", "Réservée"].includes(normalizeReservationStatus(reservation.status)) ? `<button type="button" class="btn btn-primary" data-reservation-convert="${reservation.id}">Convertir</button>` : ""}
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

      cancelReservationButton?.addEventListener("click", () => {
        const reservationId = editForm.dataset.editingId;

        if (!reservationId) {
          return;
        }

        if (!confirmDangerAction("Annuler cette réservation? Elle restera dans le système avec le statut Annulée.")) {
          return;
        }

        apiRequest("reservations.php", {
          method: "PUT",
          body: {
            reservation_id: reservationId,
            status: "Annulée"
          }
        })
          .then(() => {
            editModal.close();
            loadReservations();
            showToast("Réservation annulée avec succès.");
          })
          .catch((error) => {
            showStatus(editStatus, error.message, "is-error");
            showToast(error.message, "error");
          });
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
            checkin_date: values.checkin_date
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
        clearStatus(convertStatus);
        convertModal.open();
      }
    });

    loadReservations();
  };

  app.initializeLocationBrowser = () => {
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

  app.registerInitializer(app.initializeReservationBrowser);
  app.registerInitializer(app.initializeLocationBrowser);
})();
