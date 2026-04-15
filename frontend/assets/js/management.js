(function () {
  const app = window.EHotels;
  const {
    apiRequest,
    clearStatus,
    confirmDangerAction,
    createModalController,
    formatDateFr,
    getReferenceData,
    normalizeEmployeeRole,
    resetReferenceData,
    setFieldError,
    showStatus,
    showToast
  } = app;

  app.initializeClientManagement = () => {
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

  app.initializeRoomManagement = () => {
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

    setIdentityLocked(false);

    Promise.all([loadHotels(), loadRooms()]).catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
    });
  };

  app.initializeEmployeeManagement = () => {
    const form = document.getElementById("employeeManagementForm");
    const status = document.getElementById("employeeStatus");
    const results = document.getElementById("employeeResults");
    const chainSelect = document.getElementById("employee_chain_id");
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

    if (!form || !status || !results || !hotelSelect || !chainSelect) {
      return;
    }

    let employees = [];
    let hotelsByChain = [];
    const fields = ["employee_full_name", "employee_address", "employee_nas", "employee_id_search", "employee_role", "employee_chain_id", "employee_hotel_id"];
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
        if (values.employee_id_search && `${employee.id}` !== `${values.employee_id_search}`) {
          return false;
        }
        if (values.employee_role && normalizeEmployeeRole(employee.role) !== normalizeEmployeeRole(values.employee_role)) {
          return false;
        }
        if (values.employee_chain_id) {
          const matchingHotel = hotelsByChain.find((hotel) => `${hotel.id}` === `${employee.hotelId}`);

          if (!matchingHotel || `${matchingHotel.id_chaine}` !== `${values.employee_chain_id}`) {
            return false;
          }
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
          resetReferenceData();
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
          resetReferenceData();
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
            resetReferenceData();
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

    const updateHotelOptions = () => {
      const selectedChainId = chainSelect.value;
      const previousHotel = hotelSelect.value;
      const availableHotels = selectedChainId
        ? hotelsByChain.filter((hotel) => `${hotel.id_chaine}` === `${selectedChainId}`)
        : hotelsByChain;

      hotelSelect.innerHTML = `
        <option value="">Sélectionnez un hôtel</option>
        ${availableHotels.map((hotel) => `<option value="${hotel.id}">${hotel.nom}</option>`).join("")}
      `;

      if (availableHotels.some((hotel) => `${hotel.id}` === previousHotel)) {
        hotelSelect.value = previousHotel;
      }
    };

    const loadHotels = async () => {
      const references = await getReferenceData();
      hotelsByChain = references.hotels || [];
      chainSelect.innerHTML = `
        <option value="">Sélectionnez une chaîne</option>
        ${(references.chains || []).map((chain) => `<option value="${chain.id}">${chain.nom}</option>`).join("")}
      `;
      updateHotelOptions();
      if (editHotelSelect) {
        editHotelSelect.innerHTML = `
          <option value="">Sélectionnez un hôtel</option>
          ${hotelsByChain.map((hotel) => `<option value="${hotel.id}">${hotel.nom}</option>`).join("")}
        `;
      }
    };

    chainSelect.addEventListener("change", () => {
      updateHotelOptions();
    });

    const loadEmployees = async () => {
      const payload = await apiRequest("employees.php");
      employees = payload.employees || [];
      renderEmployees();
    };

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        fields.forEach((field) => setFieldError(field, ""));
        clearStatus(status);
        loadHotels()
          .then(() => loadEmployees())
          .catch(() => {});
      }, 0);
    });

    Promise.all([loadHotels(), loadEmployees()]).catch((error) => {
      results.innerHTML = `<article class="data-card"><p>${error.message}</p></article>`;
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
  };

  app.initializeHotelManagement = () => {
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
          resetReferenceData();
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
          resetReferenceData();
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
            resetReferenceData();
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

  app.registerInitializer(app.initializeClientManagement);
  app.registerInitializer(app.initializeRoomManagement);
  app.registerInitializer(app.initializeEmployeeManagement);
  app.registerInitializer(app.initializeHotelManagement);
})();
