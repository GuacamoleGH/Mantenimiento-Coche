function showAddVehicleModal() {
    uploadedFile = "";
    $.get('/Vehicle/AddVehiclePartialView', function (data) {
        if (data) {
            $("#addVehicleModalContent").html(data);
            initTagSelector($("#inputTag"));
            initDatePicker($('#inputPurchaseDate'));
            initDatePicker($('#inputSoldDate'));
            $('#addVehicleModal').modal('show');
        }
    })
}
function hideAddVehicleModal() {
    $('#addVehicleModal').modal('hide');
}
//refreshable function to reload Garage PartialView
function loadGarage() {
    $.get('/Home/Garage', function (data) {
        $("#garage-tab-pane").html(data);
    });
}
function loadSettings() {
    $.get('/Home/Settings', function (data) {
        $("#settings-tab-pane").html(data);
    });
}
function getVehicleSupplyRecords() {
    $.get(`/Vehicle/GetSupplyRecordsByVehicleId?vehicleId=0`, function (data) {
        if (data) {
            $("#supply-tab-pane").html(data);
            restoreScrollPosition();
        }
    });
}
function GetVehicleId() {
    return { vehicleId: 0, hasOdometerAdjustment: false };
}
function bindTabEvent() {
    $('button[data-bs-toggle="tab"]').on('show.bs.tab', function (e) {
        switch (e.target.id) {
            case "garage-tab":
                loadGarage();
                break;
            case "settings-tab":
                loadSettings();
                break;
            case "supply-tab":
                getVehicleSupplyRecords();
                break;
            case "calendar-tab":
                getVehicleCalendarEvents();
                break;
        }
        $(`.lubelogger-tab #${e.target.id}`).addClass('active');
        $(`.lubelogger-mobile-nav #${e.target.id}`).addClass('active');
        if (e.relatedTarget != null) {
            switch (e.relatedTarget.id) { //clear out previous tabs with grids in them to help with performance
                case "garage-tab":
                    $("#garage-tab-pane").html("");
                    break;
                case "settings-tab":
                    $("#settings-tab-pane").html("");
                    break;
                case "supply-tab":
                    $("#supply-tab-pane").html("");
                    break;
                case "calendar-tab":
                    $("#calendar-tab-pane").html("");
                    break;
            }
            $(`.lubelogger-tab #${e.relatedTarget.id}`).removeClass('active');
            $(`.lubelogger-mobile-nav #${e.relatedTarget.id}`).removeClass('active');
        }
        setBrowserHistory('tab', getTabNameForURL(e.target.id));
        bindTabEvents(e.target.id);
    });
}
function getVehicleCalendarEvents() {
    $.get('/Home/Calendar', function (data) {
        if (data) {
            $("#calendar-tab-pane").html(data);
        }
    });
}
// Configuración de idioma español para DatePicker
if (typeof $ !== 'undefined' && $.fn && $.fn.datepicker) {
    $.fn.datepicker.dates['es'] = {
        days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
        daysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        daysMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
        months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        today: "Hoy",
        monthsTitle: "Meses",
        clear: "Borrar",
        weekStart: 1,
        format: "yyyy-mm-dd"
    };
}

var currentSelectedCalendarDate = new Date();
var calendarEventsByDate = {};

function formatDateToISO(d) {
    if (!d) return '';
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function prepareCalendarEvents() {
    calendarEventsByDate = {};
    if (typeof calendarEventsList !== 'undefined' && Array.isArray(calendarEventsList)) {
        calendarEventsList.forEach(function (item) {
            var dateStr = '';
            if (item.DateString) {
                dateStr = item.DateString;
            } else if (item.Date) {
                dateStr = String(item.Date).substring(0, 10);
            } else if (item.dateString) {
                dateStr = item.dateString;
            } else if (item.date) {
                dateStr = String(item.date).substring(0, 10);
            }
            if (dateStr) {
                if (!calendarEventsByDate[dateStr]) {
                    calendarEventsByDate[dateStr] = [];
                }
                calendarEventsByDate[dateStr].push(item);
            }
        });
    }
}

function showCalendarReminderModal(id) {
    if (typeof event !== 'undefined' && event) {
        event.stopPropagation();
    }
    $.get(`/Home/ViewCalendarReminder?reminderId=${id}`, function (data) {
        if (data) {
            $("#reminderRecordCalendarModalContent").html(data);
            $("#reminderRecordCalendarModal").modal('show');
            $('#reminderRecordCalendarModal').off('shown.bs.modal').on('shown.bs.modal', function () {
                if (getGlobalConfig().useMarkDown) {
                    toggleMarkDownOverlay("reminderNotes");
                }
            });
        }
    });
}

function hideCalendarReminderModal() {
    $("#reminderRecordCalendarModal").modal('hide');
}

function markDoneCalendarReminderRecord(reminderRecordId, e) {
    if (typeof event !== 'undefined' && event) {
        event.stopPropagation();
    }
    $.post(`/Vehicle/PushbackRecurringReminderRecord?reminderRecordId=${reminderRecordId}`, function (data) {
        if (data.success) {
            hideCalendarReminderModal();
            successToast("Recordatorio actualizado");
            getVehicleCalendarEvents();
        } else {
            errorToast(data.message);
        }
    });
}

function deleteCalendarReminderRecord(reminderRecordId, e) {
    if (typeof event !== 'undefined' && event) {
        event.stopPropagation();
    }
    $("#workAroundInput").show();
    confirmDelete("Los recordatorios eliminados no se pueden recuperar.", (result) => {
        if (result.isConfirmed) {
            $.post(`/Vehicle/DeleteReminderRecordById?reminderRecordId=${reminderRecordId}`, function (data) {
                if (data.success) {
                    hideCalendarReminderModal();
                    successToast("Recordatorio eliminado");
                    getVehicleCalendarEvents();
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

function initCalendar() {
    // Asegurar registro del idioma español
    if ($.fn.datepicker && !$.fn.datepicker.dates['es']) {
        $.fn.datepicker.dates['es'] = {
            days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
            daysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
            daysMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
            months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            today: "Hoy",
            monthsTitle: "Meses",
            clear: "Borrar",
            weekStart: 1,
            format: "yyyy-mm-dd"
        };
    }

    prepareCalendarEvents();

    var $container = $(".reminderCalendarViewContent");
    $container.datepicker('destroy');
    $container.datepicker({
        language: "es",
        weekStart: 1,
        todayHighlight: true,
        todayBtn: false,
        beforeShowDay: function (date) {
            var dateStr = formatDateToISO(date);
            var events = calendarEventsByDate[dateStr];
            if (events && events.length > 0) {
                var hasVeryUrgent = events.some(x => (x.Urgency === 2 || x.Urgency === 3 || x.urgency === 'VeryUrgent' || x.urgency === 'PastDue'));
                var hasUrgent = events.some(x => (x.Urgency === 1 || x.urgency === 'Urgent'));
                var hasPastRecord = events.some(x => (x.Type === 'Service' || x.Type === 'Repair' || x.Type === 'Upgrade' || x.type === 'Service' || x.type === 'Repair' || x.type === 'Upgrade'));

                var dotClass = hasVeryUrgent ? 'bg-danger' : (hasUrgent ? 'bg-warning' : (hasPastRecord ? 'bg-success' : 'bg-info'));
                return {
                    enabled: true,
                    classes: 'calendar-has-event-day',
                    content: `<div class="calendar-day-cell">
                                <span class="day-num">${date.getDate()}</span>
                                <span class="day-dot ${dotClass}" title="${events.length} evento(s)"></span>
                              </div>`
                };
            }
            return {
                enabled: true,
                content: `<div class="calendar-day-cell"><span class="day-num">${date.getDate()}</span></div>`
            };
        }
    }).on('changeDate', function (e) {
        if (e && e.date) {
            renderSelectedDayEvents(e.date);
        }
    });

    // Renderizar hoy por defecto al cargar
    renderSelectedDayEvents(new Date());
}

function renderSelectedDayEvents(date) {
    currentSelectedCalendarDate = date;
    var dateStr = formatDateToISO(date);
    var todayStr = formatDateToISO(new Date());
    var isToday = (dateStr === todayStr);

    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var formattedText = date.toLocaleDateString('es-ES', options);
    if (formattedText) {
        formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);
    }

    $("#calendarSelectedDayLabel").text(isToday ? "Hoy" : "Día Seleccionado");
    $("#calendarSelectedDateText").text(formattedText);

    var events = calendarEventsByDate[dateStr] || [];
    var $list = $("#calendarDayEventsList");
    $list.empty();

    if (events.length === 0) {
        $list.html(`
            <div class="text-center py-5 text-secondary">
                <i class="bi bi-calendar-check fs-1 opacity-50 d-block mb-2"></i>
                <p class="small mb-2 text-light">No hay actividades ni recordatorios para esta fecha.</p>
                <button class="btn btn-outline-warning btn-sm" onclick="openAddEventModal()">
                    <i class="bi bi-plus-lg me-1"></i>Añadir tarea para este día
                </button>
            </div>
        `);
        return;
    }

    events.forEach(function (ev) {
        var evType = ev.Type || ev.type || 'Reminder';
        var evDesc = ev.Description || ev.description || '';
        var evNotes = ev.Notes || ev.notes || '';
        var evVehicle = ev.VehicleName || ev.vehicleName || '';
        var evUrgency = ev.Urgency !== undefined ? ev.Urgency : ev.urgency;
        var evId = ev.Id || ev.id || 0;

        var html = '';
        if (evType === 'Reminder') {
            var isUrgent = (evUrgency === 1 || evUrgency === 'Urgent');
            var isVeryUrgent = (evUrgency === 2 || evUrgency === 3 || evUrgency === 'VeryUrgent' || evUrgency === 'PastDue');
            var badgeClass = isVeryUrgent ? 'bg-danger' : (isUrgent ? 'bg-warning text-dark' : 'bg-secondary');
            var urgencyLabel = isVeryUrgent ? 'Muy Urgente' : (isUrgent ? 'Urgente' : 'Programado');

            html = `
                <div class="calendar-task-card cursor-pointer mb-2" onclick="showCalendarReminderModal(${evId})" title="Ver detalles">
                    <div class="d-flex align-items-start justify-content-between gap-2">
                        <div class="fw-semibold text-light small">
                            <i class="bi bi-bell-fill text-warning me-1"></i>
                            ${escapeHtml(evDesc)}
                        </div>
                        <span class="badge ${badgeClass} font-monospace" style="font-size: 0.7rem;">${urgencyLabel}</span>
                    </div>
                    ${evVehicle ? `<div class="small text-secondary mt-1"><i class="bi bi-car-front me-1"></i>${escapeHtml(evVehicle)}</div>` : ''}
                    ${evNotes ? `<div class="small text-muted text-truncate mt-1">${escapeHtml(evNotes)}</div>` : ''}
                </div>
            `;
        } else {
            var typeBadge = evType === 'Service' ? 'bg-success' : (evType === 'Repair' ? 'bg-info text-dark' : 'bg-primary');
            var typeLabel = evType === 'Service' ? 'Mantenimiento' : (evType === 'Repair' ? 'Reparación' : 'Mejora');
            var typeIcon = evType === 'Service' ? 'bi-wrench-adjustable' : (evType === 'Repair' ? 'bi-shield-shaded' : 'bi-stars');

            html = `
                <div class="calendar-task-card mb-2" style="border-left: 3px solid #10B981;">
                    <div class="d-flex align-items-start justify-content-between gap-2">
                        <div class="fw-semibold text-light small">
                            <i class="bi ${typeIcon} text-success me-1"></i>
                            ${escapeHtml(evDesc)}
                        </div>
                        <span class="badge ${typeBadge} font-monospace" style="font-size: 0.7rem;">${typeLabel}</span>
                    </div>
                    ${evVehicle ? `<div class="small text-secondary mt-1"><i class="bi bi-car-front me-1"></i>${escapeHtml(evVehicle)}</div>` : ''}
                    ${evNotes ? `<div class="small text-muted text-truncate mt-1">${escapeHtml(evNotes)}</div>` : ''}
                </div>
            `;
        }
        $list.append(html);
    });
}

function goToCalendarToday() {
    var today = new Date();
    $(".reminderCalendarViewContent").datepicker('setDate', today);
    renderSelectedDayEvents(today);
}

function openAddEventModal() {
    var dateToUse = currentSelectedCalendarDate || new Date();
    var isoDate = formatDateToISO(dateToUse);
    $("#newReminderDate").val(isoDate);
    $("#newReminderDescription").val("");
    $("#newReminderNotes").val("");
    $("#newReminderUrgency").val("NotUrgent");
    $("#addCalendarReminderModal").modal('show');
}

function saveCalendarNewReminder() {
    var vehicleId = $("#newReminderVehicle").val();
    var date = $("#newReminderDate").val();
    var description = $("#newReminderDescription").val();
    var urgency = $("#newReminderUrgency").val();
    var notes = $("#newReminderNotes").val();

    if (!vehicleId) {
        errorToast("Por favor, selecciona un vehículo");
        return;
    }
    if (!description || !description.trim()) {
        errorToast("Por favor, introduce una descripción");
        return;
    }

    $.post('/Home/AddCalendarReminder', {
        vehicleId: vehicleId,
        date: date,
        description: description,
        urgency: urgency,
        notes: notes
    }, function (data) {
        if (data.success) {
            $("#addCalendarReminderModal").modal('hide');
            successToast(data.message || "Recordatorio guardado correctamente");
            getVehicleCalendarEvents();
        } else {
            errorToast(data.message || "Error al guardar el recordatorio");
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function performLogOut() {
    $.post('/Login/LogOut', function (data) {
        if (data) {
            resetEventHub();
            window.location.href = data;
        }
    })
}

function filterGarage(sender) {
    let searchQuery = $('#garageSearchInput').val();
    if (sender == undefined) {
        searchAndFilterGarage(undefined, searchQuery);
        return;
    }
    var tagName = sender.textContent;
    if ($(sender).hasClass("bg-primary")) {
        searchAndFilterGarage(undefined, searchQuery);
        $(sender).removeClass('bg-primary');
        $(sender).addClass('bg-secondary');
    } else {
        searchAndFilterGarage(tagName, searchQuery);
        if ($(".tagfilter.bg-primary").length > 0) {
            //disabling other filters
            $(".tagfilter.bg-primary").addClass('bg-secondary');
            $(".tagfilter.bg-primary").removeClass('bg-primary');
        }
        $(sender).addClass('bg-primary');
        $(sender).removeClass('bg-secondary');
    }
}
function handleGarageSearchKeyPress(event) {
    if (event.keyCode == 13) {
        searchGarage();
    } else {
        setDebounce(searchGarage);
    }
}
function searchGarage() {
    let searchTerm = $('#garageSearchInput').val();
    let activeTag = $(".tagfilter.bg-primary").length > 0 ? $(".tagfilter.bg-primary")[0].textContent : undefined;
    searchAndFilterGarage(activeTag, searchTerm);
}
function searchAndFilterGarage(searchTag, searchTerm) {
    let rowData = $(".garage-item");
    let searchTagEmpty = searchTag == undefined || searchTag.trim() == '';
    let searchQueryEmpty = searchTerm == undefined || searchTerm.trim() == '';
    if (searchTagEmpty && searchQueryEmpty) {
        //show all garage items
        rowData.removeClass('override-hide');
        return;
    }
    //hide all garage items
    rowData.addClass('override-hide');
    if (!searchQueryEmpty && !searchTagEmpty) {
        $(`.garage-item .card-body .garage-item-attribute:containsNC('${searchTerm}')`).closest(`.garage-item[data-tags~='${searchTag}']`).removeClass('override-hide');
    } else {
        if (!searchTagEmpty) {
            //show all garage items with matching tags
            $(`[data-tags~='${searchTag}']`).removeClass('override-hide');
        }
        if (!searchQueryEmpty) {
            //show all garage items with matching search terms
            $(`.garage-item .card-body .garage-item-attribute:containsNC('${searchTerm}')`).closest('.garage-item').removeClass('override-hide');
        }
    }
}
// begin context menu
var selectedVehicles = [];
function addToSelectedVehicles(vehicleId) {
    if (selectedVehicles.findIndex(x => x == vehicleId) == -1) {
        selectedVehicles.push(vehicleId);
    }
}
function showGarageContextMenu(e) {
    if (event != undefined) {
        event.preventDefault();
    }
    if (getDeviceIsTouchOnly()) {
        return;
    }
    if (!$(e).hasClass('garage-active')) {
        clearSelectedVehicles();
        addToSelectedVehicles($(e).attr('data-rowId'));
        $(e).addClass('garage-active');
    }
    $(".garage-context-menu").fadeIn("fast");
    determineGarageContextMenu();
    $(".garage-context-menu").css({
        left: getGarageMenuPosition(event.clientX, 'width', 'scrollLeft'),
        top: getGarageMenuPosition(event.clientY, 'height', 'scrollTop')
    });
}
function showGarageContextMenuForMobile(e, xPosition, yPosition) {
    if (!$(e).hasClass('garage-active')) {
        addToSelectedVehicles($(e).attr('data-rowId'));
        $(e).addClass('garage-active');
    } else {
        $(".garage-context-menu").fadeIn("fast");
        determineGarageContextMenu();
        $(".garage-context-menu").css({
            left: getGarageMenuPosition(xPosition, 'width', 'scrollLeft'),
            top: getGarageMenuPosition(yPosition, 'height', 'scrollTop')
        });
    }
}
function determineGarageContextMenu() {
    let garageItems = $('.garage-item:visible');
    let garageItemsActive = $('.garage-item.garage-active:visible');
    if (garageItemsActive.length == 1) {
        $(".context-menu-active-single").show();
        $(".context-menu-active-multiple").hide();
    } else if (garageItemsActive.length > 1) {
        $(".context-menu-active-single").hide();
        $(".context-menu-active-multiple").show();
    } else {
        $(".context-menu-active-single").hide();
        $(".context-menu-active-multiple").hide();
    }
    if (garageItemsActive.length == 1 && garageItemsActive.attr('data-extra-fields') != '') {
        $(".context-menu-extra-field").show();
    } else {
        $(".context-menu-extra-field").hide();
    }
    if (garageItems.length > 1) {
        $(".context-menu-multiple").show();
        if (garageItems.length == garageItemsActive.length) {
            //all rows are selected, show deselect all button.
            $(".context-menu-deselect-all").show();
            $(".context-menu-select-all").hide();
        } else if (garageItems.length != garageItemsActive.length) {
            //not all rows are selected, show select all button.
            $(".context-menu-select-all").show();
            $(".context-menu-deselect-all").hide();
        }
    } else {
        $(".context-menu-multiple").hide();
    }
}
function garageRangeMouseMove(e) {
    if (isDragging) {
        if (!$(e).hasClass('garage-active')) {
            addToSelectedVehicles($(e).attr('data-rowId'));
            $(e).addClass('garage-active');
        }
    }
}
function removeFromSelectedVehicles(id) {
    var rowIndex = selectedVehicles.findIndex(x => x == id)
    if (rowIndex != -1) {
        selectedVehicles.splice(rowIndex, 1);
    }
}
function viewVehicleWithTab(vehicleIds, tab) {
    if (vehicleIds.length != 1) {
        return;
    }
    let vehicleId = vehicleIds[0];
    viewVehicle(vehicleId, tab);
}
function selectEveryVehicleInBetween(rowId) {
    if (selectedVehicles.length == 0) {
        let startVehicle = $(`[data-rowId='${rowId}'`);
        startVehicle.addClass('garage-active');
        addToSelectedVehicles(rowId);
    }
    else {
        let lastSelectedVehicleId = selectedVehicles[0];
        if (lastSelectedVehicleId == rowId) {
            clearSelectedVehicles();
            let startVehicle = $(`[data-rowId='${lastSelectedVehicleId}'`);
            startVehicle.addClass('garage-active');
            addToSelectedVehicles(lastSelectedVehicleId);
            return;
        }
        clearSelectedVehicles();
        let startVehicle = $(`[data-rowId='${lastSelectedVehicleId}'`);
        startVehicle.addClass('garage-active');
        addToSelectedVehicles(lastSelectedVehicleId);
        let startIndex = startVehicle.index();
        let endIndex = $(`[data-rowId='${rowId}'`).index();
        if (startIndex > endIndex) {
            for (let i = endIndex; i < startIndex; i++) {
                $('.vehiclesContainer .garage-item').eq(i).map((index, elem) => {
                    if ($(elem).is(':visible')) {
                        $(elem).addClass('garage-active');
                        addToSelectedVehicles($(elem).attr('data-rowId'));
                    }
                });
            }
        } else {
            for (let i = endIndex; i > startIndex; i--) {
                $('.vehiclesContainer .garage-item').eq(i).map((index, elem) => {
                    if ($(elem).is(':visible')) {
                        $(elem).addClass('garage-active');
                        addToSelectedVehicles($(elem).attr('data-rowId'));
                    }
                });
            }
        }
    }
}
function handleGarageItemClick(e, vehicleId) {
    if (!(event.ctrlKey || event.metaKey || event.shiftKey)) {
        viewVehicle(vehicleId);
    }
    else if (event.shiftKey) {
        selectEveryVehicleInBetween($(e).attr('data-rowId'));
    }
    else if (!$(e).hasClass('garage-active')) {
        addToSelectedVehicles($(e).attr('data-rowId'));
        $(e).addClass('garage-active');
    } else if ($(e).hasClass('garage-active')) {
        removeFromSelectedVehicles($(e).attr('data-rowId'));
        $(e).removeClass('garage-active');
    }
}
function deleteVehicles(vehicleIds) {
    if (vehicleIds.length == 0) {
        return;
    }
    let messageWording = vehicleIds.length > 1 ? `these ${vehicleIds.length} vehicles` : 'this vehicle';
    confirmDelete(`This will also delete all data tied to ${messageWording}. Deleted Vehicles and their associated data cannot be restored.`, (result) => {
        if (result.isConfirmed) {
            $.post('/Vehicle/DeleteVehicles', { vehicleIds: vehicleIds }, function (data) {
                if (data.success) {
                    loadGarage();
                }
                else {
                    errorToast(data.message);
                }
            })
        }
    });
}
function manageCollaborators(vehicleIds) {
    if (vehicleIds.length == 0) {
        return;
    }
    $.post('/Vehicle/GetVehiclesCollaborators', { vehicleIds: vehicleIds }, function (data) {
        if (isOperationResponse(data)) {
            return;
        } else if (data) {
            $("#userCollaboratorsModalContent").html(data);
            $("#userCollaboratorsModal").modal('show');
        }
    })
}
function showVehicleExtraFields(vehicleIds) {
    if (vehicleIds.length != 1) {
        return;
    }
    let extraFieldsHtml = $(`[data-rowId="${vehicleIds[0]}"]`).attr('data-extra-fields');
    Swal.fire({
        title: 'Vehicle Extra Fields',
        html: extraFieldsHtml,
        confirmButtonText: 'Close',
        focusConfirm: false
    });
}
function detectGarageLongTouch(sender) {
    var touchX = event.touches[0].clientX;
    var touchY = event.touches[0].clientY;
    if (!rowTouchTimer) {
        rowTouchTimer = setTimeout(function () { showGarageContextMenuForMobile(sender, touchX, touchY); detectGarageTouchEndPremature(sender); }, rowTouchDuration);
    }
}
function detectGarageTouchEndPremature(sender) {
    if (rowTouchTimer) {
        clearTimeout(rowTouchTimer);
        rowTouchTimer = null;
    }
}
// end context menu
function hideCollaboratorsModal() {
    $("#userCollaboratorsModal").modal('hide');
}
function selectAllPartialCollaborators() {
    let checkedCollaborators = $('.list-group.partial-collaborators input[type="checkbox"]:checked');
    let partialCollaborators = $('.list-group.partial-collaborators input[type="checkbox"]');
    if (checkedCollaborators.length == partialCollaborators.length) {
        partialCollaborators.prop('checked', false);
    } else {
        partialCollaborators.prop('checked', true);
    }
}
function selectAllCommonCollaborators() {
    let checkedCollaborators = $('.list-group.common-collaborators input[type="checkbox"]:checked');
    let commonCollaborators = $('.list-group.common-collaborators input[type="checkbox"]');
    if (checkedCollaborators.length == commonCollaborators.length) {
        commonCollaborators.prop('checked', false);
    } else {
        commonCollaborators.prop('checked', true);
    }
}
function copySelectedPartialCollaborators() {
    let checkedCollaborators = $('.list-group.partial-collaborators input[type="checkbox"]:checked');
    let collaboratorsToAdd = [];
    checkedCollaborators.map((index, elem) => {
        collaboratorsToAdd.push($(elem).parent().find('.form-check-label').text());
    });
    if (collaboratorsToAdd.length == 0) {
        errorToast('No collaborators selected');
        return;
    }
    $.post('/Vehicle/AddCollaboratorsToVehicles', { usernames: collaboratorsToAdd, vehicleIds: vehiclesToEdit }, function (data) {
        if (data.success) {
            manageCollaborators(vehiclesToEdit);
        } else {
            errorToast(data.message);
        }
    });
}
function removeSelectedCollaborators() {
    let checkedPartialCollaborators = $('.list-group.partial-collaborators input[type="checkbox"]:checked');
    let checkedCommonCollaborators = $('.list-group.common-collaborators input[type="checkbox"]:checked');
    let collaboratorsToRemove = [];
    checkedPartialCollaborators.map((index, elem) => {
        collaboratorsToRemove.push($(elem).parent().find('.form-check-label').text());
    });
    checkedCommonCollaborators.map((index, elem) => {
        collaboratorsToRemove.push($(elem).parent().find('.form-check-label').text());
    });
    if (collaboratorsToRemove.length == 0) {
        errorToast('No collaborators selected');
        return;
    }
    $.post('/Vehicle/RemoveCollaboratorsFromVehicles', { usernames: collaboratorsToRemove, vehicleIds: vehiclesToEdit }, function (data) {
        if (data.success) {
            manageCollaborators(vehiclesToEdit);
        } else {
            errorToast(data.message);
        }
    });
}
function removeCollaborators(e) {
    let collaboratorsToRemove = [];
    collaboratorsToRemove.push($(e).parent().find('.form-check-label').text());
    $.post('/Vehicle/RemoveCollaboratorsFromVehicles', { usernames: collaboratorsToRemove, vehicleIds: vehiclesToEdit }, function (data) {
        if (data.success) {
            manageCollaborators(vehiclesToEdit);
        } else {
            errorToast(data.message);
        }
    });
}
function addCollaboratorToVehicles() {
    Swal.fire({
        title: 'Add Collaborator',
        html: `
                            <input type="text" id="inputUserName" class="swal2-input" placeholder="Username" onkeydown="handleSwalEnter(event)">
                            `,
        confirmButtonText: 'Add',
        focusConfirm: false,
        preConfirm: () => {
            const userName = $("#inputUserName").val();
            if (!userName) {
                Swal.showValidationMessage(`Please enter a username`);
            }
            return { userName }
        },
    }).then(function (result) {
        if (result.isConfirmed) {
            let usernames = [];
            usernames.push(result.value.userName);
            $.post('/Vehicle/AddCollaboratorsToVehicles', { usernames: usernames, vehicleIds: vehiclesToEdit }, function (data) {
                if (data.success) {
                    manageCollaborators(vehiclesToEdit);
                } else {
                    errorToast(data.message);
                }
            });
        }
    });
}
function adjustCollaboratorsModalSize(expand) {
    if (expand) {
        $("#userCollaboratorsModal .modal-dialog").addClass('modal-lg');
    } else {
        $("#userCollaboratorsModal .modal-dialog").removeClass('modal-lg');
    }
}
function sortGarage() {
    //check current sort state
    let sortState = $('.garage-sort-icon');
    if (sortState.hasClass('bi-arrow-down-up')) {
        //no sort
        if ($("[default-sort]").length == 0) {
            $(`.garage-item`).map((index, elem) => {
                $(elem).attr("default-sort", index);
            });
        }
        sortState.removeClass('bi-arrow-down-up');
        sortState.addClass('bi-sort-numeric-down');
        sortVehicles(false);
    } else if (sortState.hasClass('bi-sort-numeric-down')) {
        //sorted asc
        sortState.removeClass('bi-sort-numeric-down');
        sortState.addClass('bi-sort-numeric-up');
        sortVehicles(true);
    } else if (sortState.hasClass('bi-sort-numeric-up')){
        //sorted desc, reset sort state
        resetGarageSort();
    }
}
function resetGarageSort() {
    let sortState = $('.garage-sort-icon');
    sortState.removeClass('bi-sort-numeric-up');
    sortState.removeClass('bi-sort-numeric-down');
    sortState.addClass('bi-arrow-down-up');
    if ($('[default-sort]').length == 0) {
        //if never sorted before, return prematurely
        return;
    }
    //reset sort
    let rowData = $(`.garage-item`);
    let sortedRow = rowData.toArray().sort((a, b) => {
        let currentVal = $(a).attr('default-sort');
        let nextVal = $(b).attr('default-sort');
        return currentVal - nextVal;
    });
    $(".garage-item-add").map((index, elem) => {
        sortedRow.push(elem);
    })
    $(`.vehiclesContainer`).html(sortedRow);
}
function sortVehicles(desc) {
    //get row data
    var rowData = $('.garage-item');
    var sortedRow = rowData.toArray().sort((a, b) => {
        var currentVal = globalParseFloat($(a).find(".garage-item-year").attr('data-unit'));
        var nextVal = globalParseFloat($(b).find(".garage-item-year").attr('data-unit'));
        if (desc) {
            return nextVal - currentVal;
        } else {
            return currentVal - nextVal;
        }
    });
    sortedRow.push($('.garage-item-add'))
    $('.vehiclesContainer').html(sortedRow);
}
function showHouseholdModal() {
    $.get('/Home/GetHouseholdModal', function (data) {
        $("#householdModalContent").html(data);
        $("#householdModal").modal('show');
    })
}
function hideHouseholdModal() {
    $("#householdModal").modal('hide');
}
function removeUserFromHousehold(userId) {
    $.post('/Home/RemoveUserFromHousehold', { userId: userId }, function (data) {
        if (data) {
            successToast('User Removed');
            showHouseholdModal();
        } else {
            errorToast(genericErrorMessage())
        }
    })
}
function leaveHousehold(userId) {
    $.post('/Home/LeaveHousehold', { userId: userId }, function (data) {
        if (data) {
            successToast('Household Exited');
            showHouseholdModal();
        } else {
            errorToast(genericErrorMessage())
        }
    });
}
function modifyUserHousehold(userId, e) {
    let selectedRole = $(e).val();
    let permissions = [];
    switch (selectedRole) {
        case 'editor':
            permissions.push('Edit');
            break;
        case 'manager':
            permissions.push('Edit');
            permissions.push('Delete');
            break;
    }
    $.post('/Home/ModifyUserHouseholdPermissions', { userId: userId, permissions: permissions }, function (data) {
        if (data) {
            successToast('Household Updated');
            showHouseholdModal();
        } else {
            errorToast(genericErrorMessage())
        }
    })
}
function addUserToHousehold() {
    Swal.fire({
        title: 'Add User',
        html: `
                            <input type="text" id="inputUserName" class="swal2-input" placeholder="Username" onkeydown="handleSwalEnter(event)">
                            `,
        confirmButtonText: 'Add',
        focusConfirm: false,
        preConfirm: () => {
            const userName = $("#inputUserName").val();
            if (!userName) {
                Swal.showValidationMessage(`Please enter a username`);
            }
            return { userName }
        },
    }).then(function (result) {
        if (result.isConfirmed) {
            $.post('/Home/AddUserToHousehold', { username: result.value.userName }, function (data) {
                if (data.success) {
                    showHouseholdModal();
                    successToast('User Added');
                } else {
                    errorToast(data.message);
                }
            });
        }
    });
}

function showUserApiKeyModalFromUserModal() {
    $('#accountInformationModal').modal('hide');
    showUserApiKeyModal();
}

function showUserApiKeyModal() {
    $.get('/Home/GetUserAPIKeys', function (data) {
        $('#userApiKeyModalContent').html(data);
        $("#userApiKeyModal").modal('show');
    });
}

function hideUserApiKeyModal() {
    $('#userApiKeyModal').modal('hide');
}

function showCreateApiKeyModal() {
    $.get('/Home/GetCreateApiKeyModal', function (data) {
        $('#createApiKeyModalContent').html(data);
        hideUserApiKeyModal();
        $("#createApiKeyModal").modal('show');
    });
}

function hideCreateApiKeyModal() {
    $("#createApiKeyModal").modal('hide');
    showUserApiKeyModal();
}

function createApiKey() {
    let apiKeyName = $("#inputApiKeyName").val();
    let apiKeyRole = $("#inputApiKeyRole").val();
    //validate
    if (apiKeyName.trim() == '') {
        $("#inputApiKeyName").addClass('is-invalid');
        return;
    }
    else {
        $("#inputApiKeyName").removeClass('is-invalid');
    }
    let permissions = [];
    switch (apiKeyRole) {
        case 'editor':
            permissions.push('Edit');
            break;
        case 'manager':
            permissions.push('Edit');
            permissions.push('Delete');
            break;
    }
    $.post('/Home/CreateAPIKeyForUser', { keyName: apiKeyName, permissions: permissions }, function (data) {
        if (data.success) {
            $("#createApiKeyModal").modal('hide');
            showUserApiKeyModal();
            Swal.fire({
                title: data.message,
                icon: 'success',
                html: `<div class="input-group"><input type="text" class="form-control" readonly value="${data.additionalData.apiKey}"><div class="input-group-text"><button type="button" class="btn btn-sm text-secondary password-visible-button" onclick="copyApiKey(this)"><i class="bi bi-copy"></i></button></div></div>`
            })
        } else {
            errorToast(data.message);
        }
    });
}
function copyApiKey(elem) {
    let textToCopy = $(elem).parent().siblings("input").val();
    navigator.clipboard.writeText(textToCopy);
    Swal.showValidationMessage(`API Key Copied to Clipboard`);
}

function deleteApiKey(keyId) {
    $.post('/Home/DeleteAPIKeyForUser', { keyId: keyId }, function (data) {
        if (data.success) {
            successToast(data.message);
            showUserApiKeyModal();
        } else {
            errorToast(data.message);
        }
    });
}

function showAccountInformationModal() {
    $.get('/Home/GetUserAccountInformationModal', function (data) {
        $('#accountInformationModalContent').html(data);
        $('#accountInformationModal').modal('show');
    })
}

function showRootAccountInformationModal() {
    $.get('/Home/GetRootAccountInformationModal', function (data) {
        $('#accountInformationModalContent').html(data);
        $('#accountInformationModal').modal('show');
    })
}
function validateAndSaveRootUserAccount() {
    var hasError = false;
    if ($('#inputUsername').val().trim() == '') {
        $('#inputUsername').addClass("is-invalid");
        hasError = true;
    } else {
        $('#inputUsername').removeClass("is-invalid");
    }
    if ($('#inputPassword').val().trim() == '') {
        $('#inputPassword').addClass("is-invalid");
        hasError = true;
    } else {
        $('#inputPassword').removeClass("is-invalid");
    }
    if (hasError) {
        errorToast("Please check the form data");
        return;
    }
    var userAccountInfo = {
        userName: $('#inputUsername').val(),
        password: $('#inputPassword').val()
    }
    $.post('/Login/CreateLoginCreds', { credentials: userAccountInfo }, function (data) {
        if (data) {
            //hide modal
            hideAccountInformationModal();
            successToast('Root Account Updated');
            performLogOut();
        } else {
            errorToast(data.message);
        }
    });
}

function hideAccountInformationModal() {
    $('#accountInformationModal').modal('hide');
}
function validateAndSaveUserAccount() {
    var hasError = false;
    if ($('#inputUsername').val().trim() == '') {
        $('#inputUsername').addClass("is-invalid");
        hasError = true;
    } else {
        $('#inputUsername').removeClass("is-invalid");
    }
    if ($('#inputEmail').val().trim() == '') {
        $('#inputEmail').addClass("is-invalid");
        hasError = true;
    } else {
        $('#inputEmail').removeClass("is-invalid");
    }
    if (hasError) {
        errorToast("Por favor, revisa los datos del formulario.");
        return;
    }
    var userAccountInfo = {
        userName: $('#inputUsername').val(),
        password: $('#inputPassword').val(),
        emailAddress: $('#inputEmail').val(),
        token: ''
    };
    $.post('/Home/UpdateUserAccount', { userAccount: userAccountInfo }, function (data) {
        if (data.success) {
            hideAccountInformationModal();
            successToast(data.message || 'Perfil actualizado con éxito');
            if ($('#inputPassword').val().trim() != '') {
                setTimeout(performLogOut, 1500);
            }
        } else {
            errorToast(data.message || 'Error al actualizar');
        }
    });
}
function generateTokenForUser() {
    $.post('/Home/GenerateTokenForUser', function (data) {
        if (data) {
            successToast('Token sent');
        } else {
            errorToast(genericErrorMessage())
        }
    });
}
function loadTabFromURL() {
    let tabFromURL = getTabNameFromURL('garage');
    waitForElement(`#${tabFromURL}`, () => { $(`#${tabFromURL}`).tab('show'); }, '');
}
$(function () {
    bindTabEvent();
    loadTabFromURL();
    //bind to browser pop state
    window.addEventListener('popstate', function (event) {
        hideActiveModal();
        loadTabFromURL();
    });
})
function goToAdminPanel() {
    window.location.href = '/Admin';
}