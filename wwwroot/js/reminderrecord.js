function showEditReminderRecordModal(reminderId) {
    $.get(`/Vehicle/GetReminderRecordForEditById?reminderRecordId=${reminderId}`, function (data) {
        if (data) {
            $("#reminderRecordModalContent").html(data); 
            initDatePicker($('#reminderDate'), true);
            initTagSelector($("#reminderRecordTag"));
            $("#reminderRecordModal").modal("show");
            $('#reminderRecordModal').off('shown.bs.modal').on('shown.bs.modal', function () {
                if (getGlobalConfig().useMarkDown) {
                    toggleMarkDownOverlay("reminderNotes");
                }
            });
        }
    });
}
function hideAddReminderRecordModal() {
    $('#reminderRecordModal').modal('hide');
}
function checkCustomMonthInterval() {
    var selectedValue = $("#reminderRecurringMonth").val();
    if (selectedValue == "Other") {
        $("#workAroundInput").show();
        Swal.fire({
            title: 'Specify Custom Time Interval',
            html: `
                            <input type="text" inputmode="numeric" id="inputCustomMonth" class="swal2-input" placeholder="Time" onkeydown="handleSwalEnter(event)">
                            <select class="swal2-select" id="inputCustomMonthUnit">
                                <option value="Months">Months</option>
                                <option value="Days">Days</option>
                            </select>
                            `,
            confirmButtonText: 'Set',
            focusConfirm: false,
            preConfirm: () => {
                const customMonth = $("#inputCustomMonth").val();
                if (!customMonth || isNaN(parseInt(customMonth)) || parseInt(customMonth) <= 0) {
                    Swal.showValidationMessage(`Please enter a valid number`);
                }
                const customMonthUnit = $("#inputCustomMonthUnit").val();
                return { customMonth, customMonthUnit }
            },
        }).then(function (result) {
            if (result.isConfirmed) {
                customMonthInterval = result.value.customMonth;
                customMonthIntervalUnit = result.value.customMonthUnit;
                $("#reminderRecurringMonth > option[value='Other']").text(`Other: ${result.value.customMonth} ${result.value.customMonthUnit}`);
            } else {
                $("#reminderRecurringMonth").val(getReminderRecordModelData().monthInterval);
            }
            $("#workAroundInput").hide();
        });
    }
}
function checkCustomMileageInterval() {
    var selectedValue = $("#reminderRecurringMileage").val();
    if (selectedValue == "Other") {
        $("#workAroundInput").show();
        Swal.fire({
            title: 'Specify Custom Mileage Interval',
            html: `
                            <input type="text" inputmode="numeric" id="inputCustomMileage" class="swal2-input" placeholder="Mileage" onkeydown="handleSwalEnter(event)">
                            `,
            confirmButtonText: 'Set',
            focusConfirm: false,
            preConfirm: () => {
                const customMileage = $("#inputCustomMileage").val();
                if (!customMileage || isNaN(parseInt(customMileage)) || parseInt(customMileage) <= 0) {
                    Swal.showValidationMessage(`Please enter a valid number`);
                }
                return { customMileage }
            },
        }).then(function (result) {
            if (result.isConfirmed) {
                customMileageInterval = result.value.customMileage;
                $("#reminderRecurringMileage > option[value='Other']").text(`Other: ${result.value.customMileage} ${getReminderRecordModelData().distanceUnit}`);
            } else {
                $("#reminderRecurringMileage").val(getReminderRecordModelData().mileageInterval);
            }
            $("#workAroundInput").hide();
        });
    }
}
function deleteReminderRecord(reminderRecordId, e) {
    if (e != undefined) {
        event.stopPropagation();
    }
    $("#workAroundInput").show();
    confirmDelete("Deleted Reminders cannot be restored.", (result) => {
        if (result.isConfirmed) {
            $.post(`/Vehicle/DeleteReminderRecordById?reminderRecordId=${reminderRecordId}`, function (data) {
                if (data.success) {
                    hideAddReminderRecordModal();
                    successToast("Reminder Deleted");
                    var vehicleId = GetVehicleId().vehicleId;
                    getVehicleReminders(vehicleId);
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
function toggleCustomThresholds() {
    var isChecked = $("#reminderUseCustomThresholds").is(':checked');
    if (isChecked) {
        $("#reminderCustomThresholds").collapse('show');
    } else {
        $("#reminderCustomThresholds").collapse('hide');
    }
}
function saveReminderRecordToVehicle(isEdit) {
    //get values
    var formValues = getAndValidateReminderRecordValues();
    //validate
    if (formValues.hasError) {
        errorToast("Please check the form data");
        return;
    }
    //save to db.
    $.post('/Vehicle/SaveReminderRecordToVehicleId', { reminderRecord: formValues }, function (data) {
        if (data.success) {
            successToast(isEdit ? "Reminder Updated" : "Reminder Added.");
            hideAddReminderRecordModal();
            if (!getReminderRecordModelData().createdFromRecord) {
                saveScrollPosition();
                getVehicleReminders(formValues.vehicleId);
            } else {
                getVehicleHaveImportantReminders(formValues.vehicleId);
            }
        } else {
            errorToast(data.message);
        }
    })
}
function appendMileageToOdometer(increment) {
    var reminderMileage = $("#reminderMileage").val();
    var reminderMileageIsInvalid = reminderMileage.trim() == '' || parseInt(reminderMileage) < 0;
    if (reminderMileageIsInvalid) {
        reminderMileage = 0;
    } else {
        reminderMileage = parseInt(reminderMileage);
    }
    reminderMileage += increment;
    $("#reminderMileage").val(reminderMileage);
}

function enableRecurring() {
    var reminderIsRecurring = $("#reminderIsRecurring").is(":checked");
    if (reminderIsRecurring) {
        $("#recurringIntervalsSection").removeClass("opacity-50");
        $("#reminderFixedIntervals").prop('disabled', false);
        $("#reminderRecurringMileage").prop('disabled', false).removeClass('disabled opacity-50');
        $("#reminderRecurringMonth").prop('disabled', false).removeClass('disabled opacity-50');

        var reminderMetric = $('#reminderOptions input:radio:checked').val();
        if (reminderMetric == "Date") {
            $("#recurringHelpText").html('<i class="bi bi-info-circle me-1 text-primary"></i>Repetición por fecha activada. (Si indicas kilómetros de repetición, se seleccionará automáticamente "Lo que ocurra antes").');
        } else if (reminderMetric == "Odometer") {
            $("#recurringHelpText").html('<i class="bi bi-info-circle me-1 text-info"></i>Repetición por kilometraje activada.');
        } else {
            $("#recurringHelpText").html('<i class="bi bi-check-circle-fill me-1 text-success"></i>Repetición periódica por km y tiempo activada (lo que ocurra antes).');
        }
    } else {
        $("#recurringIntervalsSection").addClass("opacity-50");
        $("#reminderRecurringMileage").prop('disabled', true);
        $("#reminderRecurringMonth").prop('disabled', true);
        $("#reminderFixedIntervals").prop('disabled', true);
        $("#recurringHelpText").html('<i class="bi bi-info-circle me-1"></i>Activa el interruptor <strong>Recurrente</strong> para configurar estos intervalos.');
    }
}

// Auto-activación intuitiva
$(document).off("click.reminderRecur", "#recurringCardWrapper").on("click.reminderRecur", "#recurringCardWrapper", function (e) {
    if (!$("#reminderIsRecurring").is(":checked")) {
        $("#reminderIsRecurring").prop("checked", true);
        enableRecurring();
    }
});

$(document).off("focus.reminderRecurMileage input.reminderRecurMileage", "#reminderRecurringMileage").on("focus.reminderRecurMileage input.reminderRecurMileage", "#reminderRecurringMileage", function () {
    if (!$("#reminderIsRecurring").is(":checked")) {
        $("#reminderIsRecurring").prop("checked", true);
        enableRecurring();
    }
    var currentMetric = $('#reminderOptions input:radio:checked').val();
    if (currentMetric === "Date") {
        $("#reminderMetricBoth").prop("checked", true);
    }
});

$(document).off("click.reminderRecurMonth", "#recurringIntervalsSection label[for='reminderRecurringMonth'], #reminderRecurringMonth").on("click.reminderRecurMonth", "#recurringIntervalsSection label[for='reminderRecurringMonth'], #reminderRecurringMonth", function () {
    if (!$("#reminderIsRecurring").is(":checked")) {
        $("#reminderIsRecurring").prop("checked", true);
        enableRecurring();
    }
});

function markDoneReminderRecord(reminderRecordId, e) {
    event.stopPropagation();
    var vehicleId = GetVehicleId().vehicleId;
    $.post(`/Vehicle/PushbackRecurringReminderRecord?reminderRecordId=${reminderRecordId}`, function (data) {
        if (data.success) {
            successToast("Reminder Updated");
            getVehicleReminders(vehicleId);
        } else {
            errorToast(data.message);
        }
    });
}

function getAndValidateReminderRecordValues() {
    var reminderDate = $("#reminderDate").val();
    var reminderMileage = parseInt(globalParseFloat($("#reminderMileage").val())).toString();
    var reminderDescription = $("#reminderDescription").val();
    var reminderNotes = $("#reminderNotes").val();
    var reminderOption = $('#reminderOptions input:radio:checked').val();
    var reminderIsRecurring = $("#reminderIsRecurring").is(":checked");
    var reminderRecurringMonth = $("#reminderRecurringMonth").val();
    var recurringMileageVal = $("#reminderRecurringMileage").val();
    var recurringMileageNum = parseInt(globalParseFloat(recurringMileageVal)) || 0;
    var mappedMileageInterval = "Other";
    var mileageEnumMap = {
        50: "FiftyMiles",
        100: "OneHundredMiles",
        500: "FiveHundredMiles",
        1000: "OneThousandMiles",
        3000: "ThreeThousandMiles",
        4000: "FourThousandMiles",
        5000: "FiveThousandMiles",
        7500: "SevenThousandFiveHundredMiles",
        10000: "TenThousandMiles",
        15000: "FifteenThousandMiles",
        20000: "TwentyThousandMiles",
        30000: "ThirtyThousandMiles",
        40000: "FortyThousandMiles",
        50000: "FiftyThousandMiles",
        60000: "SixtyThousandMiles",
        100000: "OneHundredThousandMiles",
        150000: "OneHundredFiftyThousandMiles"
    };
    if (mileageEnumMap[recurringMileageNum]) {
        mappedMileageInterval = mileageEnumMap[recurringMileageNum];
    } else {
        mappedMileageInterval = "Other";
    }
    var reminderTags = $("#reminderRecordTag").val();
    var vehicleId = GetVehicleId().vehicleId;
    var reminderId = getReminderRecordModelData().id;
    var reminderUseCustomThresholds = $("#reminderUseCustomThresholds").is(":checked");
    var reminderUrgentDays = $("#reminderUrgentDays").val();
    var reminderVeryUrgentDays = $("#reminderVeryUrgentDays").val();
    var reminderUrgentDistance = $("#reminderUrgentDistance").val();
    var reminderVeryUrgentDistance = $("#reminderVeryUrgentDistance").val();
    var reminderFixedIntervals = $("#reminderFixedIntervals").is(":checked");
    //validation
    var hasError = false;
    var reminderDateIsInvalid = reminderDate.trim() == ''; //eliminates whitespace.
    var reminderMileageIsInvalid = reminderMileage.trim() == '' || isNaN(reminderMileage) || parseInt(reminderMileage) < 0;
    if ((reminderOption == "Both" || reminderOption == "Date") && reminderDateIsInvalid) { 
        hasError = true;
        $("#reminderDate").addClass("is-invalid");
    } else if (reminderOption == "Date") {
        $("#reminderDate").removeClass("is-invalid");
    }
    if ((reminderOption == "Both" || reminderOption == "Odometer") && reminderMileageIsInvalid) {
        hasError = true;
        $("#reminderMileage").addClass("is-invalid");
    } else if (reminderOption == "Odometer") {
        $("#reminderMileage").removeClass("is-invalid");
    }
    if (reminderDescription.trim() == '') {
        hasError = true;
        $("#reminderDescription").addClass("is-invalid");
    } else {
        $("#reminderDescription").removeClass("is-invalid");
    }
    if (reminderIsRecurring && (reminderOption == "Both" || reminderOption == "Odometer") && recurringMileageNum <= 0) {
        hasError = true;
        $("#reminderRecurringMileage").addClass("is-invalid");
    } else {
        $("#reminderRecurringMileage").removeClass("is-invalid");
    }
    if (reminderUseCustomThresholds) {
        //validate custom threshold values
        if (reminderUrgentDays.trim() == '' || isNaN(reminderUrgentDays) || parseInt(reminderUrgentDays) < 0) {
            hasError = true;
            $("#reminderUrgentDays").addClass("is-invalid");
        } else {
            $("#reminderUrgentDays").removeClass("is-invalid");
        }
        if (reminderVeryUrgentDays.trim() == '' || isNaN(reminderVeryUrgentDays) || parseInt(reminderVeryUrgentDays) < 0) {
            hasError = true;
            $("#reminderVeryUrgentDays").addClass("is-invalid");
        } else {
            $("#reminderVeryUrgentDays").removeClass("is-invalid");
        }
        if (reminderUrgentDistance.trim() == '' || isNaN(reminderUrgentDistance) || parseInt(reminderUrgentDistance) < 0) {
            hasError = true;
            $("#reminderUrgentDistance").addClass("is-invalid");
        } else {
            $("#reminderUrgentDistance").removeClass("is-invalid");
        }
        if (reminderVeryUrgentDistance.trim() == '' || isNaN(reminderVeryUrgentDistance) || parseInt(reminderVeryUrgentDistance) < 0) {
            hasError = true;
            $("#reminderVeryUrgentDistance").addClass("is-invalid");
        } else {
            $("#reminderVeryUrgentDistance").removeClass("is-invalid");
        }
    }
    if (reminderOption == undefined) {
        hasError = true;
        $("#reminderMetricDate").addClass("is-invalid");
        $("#reminderMetricOdometer").addClass("is-invalid");
        $("#reminderMetricBoth").addClass("is-invalid");
    } else {
        $("#reminderMetricDate").removeClass("is-invalid");
        $("#reminderMetricOdometer").removeClass("is-invalid");
        $("#reminderMetricBoth").removeClass("is-invalid");
    }

    return {
        id: reminderId,
        hasError: hasError,
        vehicleId: vehicleId,
        date: reminderDate,
        mileage: reminderMileage,
        description: reminderDescription,
        notes: reminderNotes,
        metric: reminderOption,
        isRecurring: reminderIsRecurring,
        fixedIntervals: reminderFixedIntervals,
        useCustomThresholds: reminderUseCustomThresholds,
        customThresholds: {
            urgentDays: reminderUrgentDays,
            veryUrgentDays: reminderVeryUrgentDays,
            urgentDistance: reminderUrgentDistance,
            veryUrgentDistance: reminderVeryUrgentDistance
        },
        reminderMileageInterval: mappedMileageInterval,
        reminderMonthInterval: reminderRecurringMonth,
        customMileageInterval: recurringMileageNum,
        customMonthInterval: customMonthInterval,
        customMonthIntervalUnit: customMonthIntervalUnit,
        tags: reminderTags
    }
}
function createPlanRecordFromReminder(reminderRecordId) {
    //get values
    var formValues = getAndValidateReminderRecordValues();
    //validate
    if (formValues.hasError) {
        errorToast("Please check the form data");
        return;
    }
    var planModelInput = {
        id: 0,
        createdFromReminder: true,
        vehicleId: formValues.vehicleId,
        reminderRecordId: reminderRecordId,
        description: formValues.description,
        notes: formValues.notes
    };
    $.post('/Vehicle/GetAddPlanRecordPartialView', { planModel: planModelInput }, function (data) {
        $("#reminderRecordModal").modal("hide");
        $("#planRecordModalContent").html(data);
        $("#planRecordModal").modal("show");
    });
}

function filterReminderTable(sender) {
    var rowData = $(`#reminder-tab-pane table tbody tr`);
    if (sender == undefined) {
        rowData.removeClass('override-hide');
        return;
    }
    var tagName = sender.textContent;
    //check for other applied filters
    if ($(sender).hasClass("bg-primary")) {
            rowData.removeClass('override-hide');
            $(sender).removeClass('bg-primary');
            $(sender).addClass('bg-secondary');
            updateReminderAggregateLabels();
    } else {
        //hide table rows.
        rowData.addClass('override-hide');
        $(`[data-tags~='${tagName}']`).removeClass('override-hide');
        updateReminderAggregateLabels();
        if ($(".tagfilter.bg-primary").length > 0) {
            //disabling other filters
            $(".tagfilter.bg-primary").addClass('bg-secondary');
            $(".tagfilter.bg-primary").removeClass('bg-primary');
        }
        $(sender).addClass('bg-primary');
        $(sender).removeClass('bg-secondary');
    }
}
function updateReminderAggregateLabels() {
    //update main count
    var newCount = $("[data-record-type='cost']").parent(":not('.override-hide')").length;
    var countLabel = $("[data-aggregate-type='count']");
    countLabel.text(`${countLabel.text().split(':')[0]}: ${newCount}`);
    //update labels
    //paste due
    var pastDueCount = $("tr td span.badge.text-bg-secondary").parents("tr:not('.override-hide')").length;
    var pastDueLabel = $('[data-aggregate-type="pastdue-count"]');
    pastDueLabel.text(`${pastDueLabel.text().split(':')[0]}: ${pastDueCount}`);
    //very urgent
    var veryUrgentCount = $("tr td span.badge.text-bg-danger").parents("tr:not('.override-hide')").length;
    var veryUrgentLabel = $('[data-aggregate-type="veryurgent-count"]');
    veryUrgentLabel.text(`${veryUrgentLabel.text().split(':')[0]}: ${veryUrgentCount}`);
    //urgent
    var urgentCount = $("tr td span.badge.text-bg-warning").parents("tr:not('.override-hide')").length;
    var urgentLabel = $('[data-aggregate-type="urgent-count"]');
    urgentLabel.text(`${urgentLabel.text().split(':')[0]}: ${urgentCount}`);
    //not urgent
    var notUrgentCount = $("tr td span.badge.text-bg-success").parents("tr:not('.override-hide')").length;
    var notUrgentLabel = $('[data-aggregate-type="noturgent-count"]');
    notUrgentLabel.text(`${notUrgentLabel.text().split(':')[0]}: ${notUrgentCount}`);
}