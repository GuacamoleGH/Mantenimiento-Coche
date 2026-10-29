function showAddServiceRecordModal() {
    $.get('/Vehicle/GetAddServiceRecordPartialView', function (data) {
        if (data) {
            $("#serviceRecordModalContent").html(data);
            //initiate datepicker
            initDatePicker($('#serviceRecordDate'));
            initTagSelector($("#serviceRecordTag"));
            $('#serviceRecordModal').modal('show');
        }
    });
}
function showEditServiceRecordModal(serviceRecordId, nocache) {
    if (!nocache) {
        var existingContent = $("#serviceRecordModalContent").html();
        if (existingContent.trim() != '') {
            //check if id is same.
            var existingId = getServiceRecordModelData().id;
            if (existingId == serviceRecordId && $('[data-changed=true]').length > 0) {
                $('#serviceRecordModal').modal('show');
                $('.cached-banner').show();
                return;
            }
        }
    }
    $.get(`/Vehicle/GetServiceRecordForEditById?serviceRecordId=${serviceRecordId}`, function (data) {
        if (data) {
            $("#serviceRecordModalContent").html(data);
            //initiate datepicker
            initDatePicker($('#serviceRecordDate'));
            initTagSelector($("#serviceRecordTag"));
            $('#serviceRecordModal').modal('show');
            bindModalInputChanges('serviceRecordModal');
            $('#serviceRecordModal').off('shown.bs.modal').on('shown.bs.modal', function () {
                if (getGlobalConfig().useMarkDown) {
                    toggleMarkDownOverlay("serviceRecordNotes");
                }
            });
        }
    });
}
function hideAddServiceRecordModal() {
    closeServiceTypeDropdown();
    $(document).off('click.serviceTypeDropdown');
    $('#serviceRecordModal').modal('hide');
}
function deleteServiceRecord(serviceRecordId) {
    $("#workAroundInput").show();
    confirmDelete("Deleted Service Records cannot be restored.", (result) => {
        if (result.isConfirmed) {
            $.post(`/Vehicle/DeleteServiceRecordById?serviceRecordId=${serviceRecordId}`, function (data) {
                if (data.success) {
                    hideAddServiceRecordModal();
                    successToast("Service Record Deleted");
                    var vehicleId = GetVehicleId().vehicleId;
                    getVehicleServiceRecords(vehicleId);
                } else {
                    errorToast(data.message);
                    $("#workAroundInput").hide();
                }
            });
        } else {
            $("#workAroundInput").hide();
        }
    });
}
function saveServiceRecordToVehicle(isEdit) {
    //get values
    var formValues = getAndValidateServiceRecordValues();
    //validate
    if (formValues.hasError) {
        errorToast("Please check the form data");
        return;
    }
    //save to db.
    $.post('/Vehicle/SaveServiceRecordToVehicleId', { serviceRecord: formValues }, function (data) {
        if (data.success) {
            successToast(isEdit ? "Service Record Updated" : "Service Record Added.");
            hideAddServiceRecordModal();
            saveScrollPosition();
            getVehicleServiceRecords(formValues.vehicleId);
            if (formValues.addReminderRecord) {
                setTimeout(function () { showAddReminderModal(formValues); }, 500);
            }
        } else {
            errorToast(data.message);
        }
    })
}
function getAndValidateServiceRecordValues() {
    var serviceDate = $("#serviceRecordDate").val();
    var serviceMileage = parseInt(globalParseFloat($("#serviceRecordMileage").val())).toString();
    var serviceDescription = $("#serviceRecordDescription").val();
    var serviceCost = $("#serviceRecordCost").val();
    var serviceNotes = $("#serviceRecordNotes").val();
    var serviceTags = $("#serviceRecordTag").val();
    var vehicleId = GetVehicleId().vehicleId;
    var serviceRecordId = getServiceRecordModelData().id;
    var addReminderRecord = $("#addReminderCheck").is(":checked");
    //Odometer Adjustments
    if (isNaN(serviceMileage) && GetVehicleId().odometerOptional) {
        serviceMileage = '0';
    }
    serviceMileage = GetAdjustedOdometer(serviceRecordId, serviceMileage);
    //validation
    var hasError = false;
    var extraFields = getAndValidateExtraFields();
    if (extraFields.hasError) {
        hasError = true;
    }
    if (serviceDate.trim() == '') { //eliminates whitespace.
        hasError = true;
        $("#serviceRecordDate").addClass("is-invalid");
    } else {
        $("#serviceRecordDate").removeClass("is-invalid");
    }
    if (serviceMileage.trim() == '' || isNaN(serviceMileage) || parseInt(serviceMileage) < 0) {
        hasError = true;
        $("#serviceRecordMileage").addClass("is-invalid");
    } else {
        $("#serviceRecordMileage").removeClass("is-invalid");
    }
    if (serviceDescription.trim() == '') {
        hasError = true;
        $("#serviceRecordDescription").addClass("is-invalid");
    } else {
        $("#serviceRecordDescription").removeClass("is-invalid");
    }
    if (serviceCost.trim() == '' || !isValidMoney(serviceCost)) {
        hasError = true;
        $("#serviceRecordCost").addClass("is-invalid");
    } else {
        $("#serviceRecordCost").removeClass("is-invalid");
    }
    return {
        id: serviceRecordId,
        hasError: hasError,
        vehicleId: vehicleId,
        date: serviceDate,
        mileage: serviceMileage,
        description: serviceDescription,
        cost: serviceCost,
        notes: serviceNotes,
        files: uploadedFiles,
        supplies: typeof selectedSupplies !== 'undefined' ? selectedSupplies : [],
        tags: serviceTags,
        serviceTypes: getSelectedServiceTypes(),
        addReminderRecord: addReminderRecord,
        extraFields: extraFields.extraFields,
        requisitionHistory: typeof supplyUsageHistory !== 'undefined' ? supplyUsageHistory : [],
        deletedRequisitionHistory: typeof deletedSupplyUsageHistory !== 'undefined' ? deletedSupplyUsageHistory : [],
        reminderRecordId: recurringReminderRecordId,
        copySuppliesAttachment: typeof copySuppliesAttachments !== 'undefined' ? copySuppliesAttachments : false
    }
}

// --- GESTIÓN DE TIPO DE SERVICIO MULTI-SELECT ---
const serviceCategoriesData = [
    {
        name: "1. Mantenimiento periódico",
        icon: "bi-wrench-adjustable",
        items: [
            "Revisión periódica",
            "Cambio de aceite y filtro del motor",
            "Cambio de filtros (aire, habitáculo y combustible)",
            "Cambio de bujías",
            "Cambio de refrigerante",
            "Cambio de líquido de frenos",
            "Cambio de aceite de la caja de cambios",
            "Cambio de aceite del diferencial",
            "Cambio de líquido de dirección asistida",
            "Cambio de correa de distribución y componentes asociados",
            "Cambio de correa de accesorios"
        ]
    },
    {
        name: "2. Motor y admisión",
        icon: "bi-cpu",
        items: [
            "Reparación de motor",
            "Cambio de soportes de motor",
            "Cambio de tacos de motor",
            "Cambio de radiador",
            "Cambio de manguitos",
            "Limpieza del sistema de admisión",
            "Limpieza de válvula EGR",
            "Reparación de turbo",
            "Cambio de turbo",
            "Reparación de inyectores",
            "Cambio de inyectores",
            "Limpieza del sistema de combustible",
            "Reparación de fugas de aceite",
            "Reparación de fugas de refrigerante"
        ]
    },
    {
        name: "3. Frenos",
        icon: "bi-disc",
        items: [
            "Revisión del sistema de frenos",
            "Cambio de pastillas y discos de freno",
            "Cambio de pastillas de freno",
            "Cambio de discos de freno",
            "Cambio de líquido de frenos",
            "Purgado del circuito de frenos",
            "Cambio de pinzas de freno",
            "Reparación de pinzas de freno",
            "Cambio de latiguillos de freno",
            "Reparación del freno de estacionamiento",
            "Reparación del freno de mano eléctrico",
            "Cambio de bomba de freno",
            "Reparación del sistema ABS",
            "Reparación del sistema ESP",
            "Reparación del sistema de frenos"
        ]
    },
    {
        name: "4. Neumáticos, ruedas, suspensión y dirección",
        icon: "bi-record-circle",
        items: [
            "Cambio de neumáticos",
            "Reparación de pinchazo",
            "Rotación de neumáticos",
            "Equilibrado de ruedas",
            "Alineación de dirección",
            "Alineación y equilibrado de ruedas",
            "Cambio de llantas",
            "Cambio de válvulas de neumáticos",
            "Revisión de presión",
            "Cambio de rodamientos de rueda",
            "Cambio de bujes",
            "Cambio de amortiguadores",
            "Cambio de muelles de suspensión",
            "Cambio de brazos de suspensión",
            "Cambio de rótulas",
            "Cambio de bieletas estabilizadoras",
            "Cambio de silentblocks",
            "Reparación de dirección asistida",
            "Cambio de cremallera de dirección",
            "Cambio de terminales de dirección",
            "Reparación de vibraciones",
            "Reparación de suspensión",
            "Reparación de dirección"
        ]
    },
    {
        name: "5. Transmisión y embrague",
        icon: "bi-gear-wide-connected",
        items: [
            "Cambio de embrague",
            "Cambio de volante bimasa",
            "Cambio de embrague y volante bimasa",
            "Reparación de caja de cambios",
            "Cambio de caja de cambios",
            "Reparación o sustitución de caja de cambios",
            "Cambio de aceite de transmisión",
            "Reparación de transmisión",
            "Cambio de palier",
            "Cambio de junta homocinética",
            "Cambio de guardapolvos de transmisión",
            "Cambio de palier, junta homocinética o guardapolvos",
            "Cambio de diferencial",
            "Reparación de eje de transmisión",
            "Cambio de retenes de transmisión",
            "Reparación de convertidor de par",
            "Reparación de caja automática"
        ]
    },
    {
        name: "6. Electricidad y electrónica",
        icon: "bi-lightning-charge",
        items: [
            "Cambio de batería",
            "Cambio de batería de 12 V",
            "Cambio de alternador",
            "Cambio de motor de arranque",
            "Reparación del sistema eléctrico",
            "Reparación eléctrica o electrónica",
            "Reparación del cableado",
            "Cambio de fusibles o relés",
            "Cambio de bombillas",
            "Reparación de faros",
            "Cambio de sensores",
            "Diagnóstico electrónico",
            "Diagnóstico electrónico OBD",
            "Actualización de software del vehículo",
            "Reparación de centralita",
            "Reparación de elevalunas eléctricos",
            "Reparación del cierre centralizado",
            "Reparación de cámara o sensores de aparcamiento",
            "Reparación del sistema de iluminación",
            "Cambio de batería de alta tensión",
            "Reparación del sistema de carga de vehículo eléctrico"
        ]
    },
    {
        name: "7. Climatización y escape",
        icon: "bi-snow",
        items: [
            "Recarga de aire acondicionado",
            "Reparación de aire acondicionado",
            "Reparación o mantenimiento del aire acondicionado",
            "Cambio de compresor de aire acondicionado",
            "Cambio de condensador",
            "Reparación de calefacción",
            "Cambio de filtro deshidratador",
            "Reparación o cambio de escape / silencioso",
            "Cambio de catalizador / FAP / DPF",
            "Reparación de fugas de escape"
        ]
    },
    {
        name: "8. Inspecciones y otros",
        icon: "bi-clipboard-check",
        items: [
            "ITV / Pre-ITV",
            "Diagnóstico de avería",
            "Reparación de carrocería y pintura",
            "Reparación o sustitución de lunas",
            "Limpieza del vehículo",
            "Otro servicio"
        ]
    }
];

var selectedServiceTypesState = [];

function initServiceTypeSelector(preselected) {
    selectedServiceTypesState = Array.isArray(preselected) ? [...preselected] : [];
    renderServiceTypeCategories();
    renderSelectedServiceTypeBadges();

    $(document).off('click.serviceTypeDropdown').on('click.serviceTypeDropdown', function(e) {
        if (!$(e.target).closest('#serviceTypeDropdownTrigger, #serviceTypeDropdownMenu').length) {
            closeServiceTypeDropdown();
        }
    });
}

function renderServiceTypeCategories() {
    var container = $("#serviceTypeCategoryList");
    if (container.length == 0) return;
    container.empty();

    serviceCategoriesData.forEach((cat, catIdx) => {
        var catId = `st_cat_${catIdx}`;
        var catSearch = normalizeSearchText(cat.name);
        var catHtml = `
            <div class="service-type-category mb-1 border-bottom border-secondary-subtle pb-1" data-category-id="${catId}" data-search-category="${catSearch}">
                <div class="category-header d-flex justify-content-between align-items-center py-1 px-2 rounded cursor-pointer user-select-none" onclick="toggleServiceCategory('${catId}')">
                    <span class="fw-semibold small d-flex align-items-center gap-2">
                        <i class="bi bi-chevron-right category-chevron" id="${catId}_chevron" style="transition: transform 0.2s;"></i>
                        <i class="bi ${cat.icon} text-info"></i>
                        <span>${cat.name}</span>
                    </span>
                    <span class="badge rounded-pill bg-secondary-subtle text-light small px-2 py-0" style="font-size:0.7rem;">${cat.items.length}</span>
                </div>
                <div class="category-items ps-3 pt-1" id="${catId}_items" style="display: none;">
                    ${cat.items.map((item, itemIdx) => {
                        var itemId = `st_item_${catIdx}_${itemIdx}`;
                        var isChecked = selectedServiceTypesState.includes(item);
                        return `
                            <div class="service-type-item" data-search-name="${normalizeSearchText(item)}">
                                <input class="form-check-input service-type-checkbox" type="checkbox" value="${item.replace(/"/g, '&quot;')}" id="${itemId}" ${isChecked ? 'checked' : ''} onchange="handleServiceTypeCheck(this)">
                                <label class="form-check-label small cursor-pointer user-select-none w-100" for="${itemId}">
                                    ${item}
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        container.append(catHtml);
    });
}

function toggleServiceTypeDropdown(e) {
    if (e) e.stopPropagation();
    var menu = $("#serviceTypeDropdownMenu");
    var chevron = $("#serviceTypeChevron");
    if (menu.is(":visible")) {
        closeServiceTypeDropdown();
    } else {
        menu.show();
        chevron.removeClass('bi-chevron-down').addClass('bi-chevron-up');
        setTimeout(() => { $("#serviceTypeSearch").focus(); }, 50);
    }
}

function closeServiceTypeDropdown() {
    $("#serviceTypeDropdownMenu").hide();
    $("#serviceTypeChevron").removeClass('bi-chevron-up').addClass('bi-chevron-down');
}

function toggleServiceCategory(catId) {
    var items = $(`#${catId}_items`);
    var chevron = $(`#${catId}_chevron`);
    if (items.is(":visible")) {
        items.slideUp(150);
        chevron.css('transform', 'rotate(0deg)');
    } else {
        items.slideDown(150);
        chevron.css('transform', 'rotate(90deg)');
    }
}

function toggleAllServiceCategories(expand) {
    if (expand) {
        $(".category-items").slideDown(150);
        $(".category-chevron").css('transform', 'rotate(90deg)');
    } else {
        $(".category-items").slideUp(150);
        $(".category-chevron").css('transform', 'rotate(0deg)');
    }
}

function normalizeSearchText(str) {
    if (!str) return '';
    return str.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function filterServiceTypes(query) {
    var queryNorm = normalizeSearchText(query);
    if (queryNorm === '') {
        $(".service-type-category").show();
        $(".service-type-item").show();
        toggleAllServiceCategories(false);
        return;
    }

    $(".service-type-category").each(function() {
        var cat = $(this);
        var catId = cat.attr("data-category-id");
        var catSearch = cat.attr("data-search-category") || '';
        var items = cat.find(".service-type-item");
        var matchCount = 0;
        var catMatches = catSearch.includes(queryNorm);

        items.each(function() {
            var item = $(this);
            var itemName = item.attr("data-search-name") || normalizeSearchText(item.text());
            if (catMatches || itemName.includes(queryNorm)) {
                item.show();
                matchCount++;
            } else {
                item.hide();
            }
        });

        if (matchCount > 0) {
            cat.show();
            $(`#${catId}_items`).slideDown(100);
            $(`#${catId}_chevron`).css('transform', 'rotate(90deg)');
        } else {
            cat.hide();
        }
    });
}

function clearServiceTypeSearch() {
    $("#serviceTypeSearch").val('');
    filterServiceTypes('');
}

function handleServiceTypeCheck(input) {
    var val = $(input).val();
    if ($(input).is(":checked")) {
        if (!selectedServiceTypesState.includes(val)) {
            selectedServiceTypesState.push(val);
        }
    } else {
        selectedServiceTypesState = selectedServiceTypesState.filter(x => x !== val);
    }
    renderSelectedServiceTypeBadges();
}

function removeServiceType(val) {
    selectedServiceTypesState = selectedServiceTypesState.filter(x => x !== val);
    $(`.service-type-checkbox[value="${val}"]`).prop('checked', false);
    renderSelectedServiceTypeBadges();
}

function clearAllServiceTypes() {
    selectedServiceTypesState = [];
    $(".service-type-checkbox").prop('checked', false);
    renderSelectedServiceTypeBadges();
}

function renderSelectedServiceTypeBadges() {
    var badgesContainer = $("#serviceTypeSelectedBadges");
    var counterBadge = $("#serviceTypeCounterBadge");
    var quickCount = $("#serviceTypeQuickCount");
    var placeholder = $("#serviceTypePlaceholder");

    badgesContainer.empty();
    var count = selectedServiceTypesState.length;

    if (count > 0) {
        counterBadge.text(`${count} seleccionados`).show();
        quickCount.text(`${count} seleccionados`);
        placeholder.text(`${count} tipo(s) de servicio seleccionado(s)`).removeClass('text-secondary').addClass('text-light fw-semibold');

        selectedServiceTypesState.forEach(val => {
            var escapedVal = val.replace(/'/g, "\'");
            var badge = $(`
                <span class="service-type-badge user-select-none">
                    <span>${val}</span>
                    <i class="bi bi-x ms-1 cursor-pointer fs-6" title="Eliminar" style="cursor:pointer;" onclick="removeServiceType('${escapedVal}')"></i>
                </span>
            `);
            badgesContainer.append(badge);
        });
    } else {
        counterBadge.hide();
        quickCount.text('0 seleccionados');
        placeholder.text('Seleccionar tipos de servicio...').removeClass('text-light fw-semibold').addClass('text-secondary');
    }
}

function getSelectedServiceTypes() {
    return selectedServiceTypesState;
}
