function showAddUpgradeRecordModal() {
    $.get('/Vehicle/GetAddUpgradeRecordPartialView', function (data) {
        if (data) {
            $("#upgradeRecordModalContent").html(data);
            //initiate datepicker
            initDatePicker($('#upgradeRecordDate'));
            initTagSelector($("#upgradeRecordTag"));
            $('#upgradeRecordModal').modal('show');
        }
    });
}
function showEditUpgradeRecordModal(upgradeRecordId, nocache) {
    if (!nocache) {
        var existingContent = $("#upgradeRecordModalContent").html();
        if (existingContent.trim() != '') {
            //check if id is same.
            var existingId = getUpgradeRecordModelData().id;
            if (existingId == upgradeRecordId && $('[data-changed=true]').length > 0) {
                $('#upgradeRecordModal').modal('show');
                $('.cached-banner').show();
                return;
            }
        }
    }
    $.get(`/Vehicle/GetUpgradeRecordForEditById?upgradeRecordId=${upgradeRecordId}`, function (data) {
        if (data) {
            $("#upgradeRecordModalContent").html(data);
            //initiate datepicker
            initDatePicker($('#upgradeRecordDate'));
            initTagSelector($("#upgradeRecordTag"));
            $('#upgradeRecordModal').modal('show');
            bindModalInputChanges('upgradeRecordModal');
            $('#upgradeRecordModal').off('shown.bs.modal').on('shown.bs.modal', function () {
                if (getGlobalConfig().useMarkDown) {
                    toggleMarkDownOverlay("upgradeRecordNotes");
                }
            });
        }
    });
}
function hideAddUpgradeRecordModal() {
    $('#upgradeRecordModal').modal('hide');
}
function deleteUpgradeRecord(upgradeRecordId) {
    $("#workAroundInput").show();
    confirmDelete("¿Deseas eliminar esta modificación? Esta acción no se puede deshacer.", (result) => {
        if (result.isConfirmed) {
            $.post(`/Vehicle/DeleteUpgradeRecordById?upgradeRecordId=${upgradeRecordId}`, function (data) {
                if (data.success) {
                    hideAddUpgradeRecordModal();
                    successToast("Modificación eliminada");
                    var vehicleId = GetVehicleId().vehicleId;
                    getVehicleUpgradeRecords(vehicleId);
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
function saveUpgradeRecordToVehicle(isEdit) {
    //get values
    var formValues = getAndValidateUpgradeRecordValues();
    //validate
    if (formValues.hasError) {
        errorToast("Please check the form data");
        return;
    }
    var shouldSyncToEquipment = $('#syncToEquipmentCheck').is(':checked');
    var eqDescription = $('#syncEquipmentDesc').val() ? $('#syncEquipmentDesc').val().trim() : '';
    var eqNotes = $('#syncEquipmentNotes').val() ? $('#syncEquipmentNotes').val().trim() : '';

    //save to db.
    $.post('/Vehicle/SaveUpgradeRecordToVehicleId', { upgradeRecord: formValues }, function (data) {
        if (data.success) {
            successToast(isEdit ? "Modificación actualizada" : "Modificación guardada");
            hideAddUpgradeRecordModal();
            saveScrollPosition();
            getVehicleUpgradeRecords(formValues.vehicleId);
            if (shouldSyncToEquipment) {
                var equipmentData = {
                    id: 0,
                    vehicleId: formValues.vehicleId,
                    description: eqDescription || formValues.description,
                    isEquipped: true,
                    notes: eqNotes || ('Instalado el ' + formValues.date + ' (Modificación: ' + formValues.description + ')'),
                    tags: formValues.tags || [],
                    files: []
                };
                $.post('/Vehicle/SaveEquipmentRecordToVehicleId', { equipmentRecord: equipmentData }, function (eqRes) {
                    if (eqRes && eqRes.success) {
                        successToast("Añadido también al Equipamiento actual");
                        if (typeof getVehicleEquipmentRecords === 'function') {
                            getVehicleEquipmentRecords(formValues.vehicleId);
                        }
                    }
                });
            }
            if (formValues.addReminderRecord) {
                setTimeout(function () { showAddReminderModal(formValues); }, 500);
            }
        } else {
            errorToast(data.message);
        }
    })
}
function getAndValidateUpgradeRecordValues() {
    var upgradeDate = $("#upgradeRecordDate").val();
    var upgradeMileage = parseInt(globalParseFloat($("#upgradeRecordMileage").val())).toString();
    var upgradeDescription = $("#upgradeRecordDescription").val();
    var upgradeCost = $("#upgradeRecordCost").val();
    var upgradeNotes = $("#upgradeRecordNotes").val();
    var upgradeTags = $("#upgradeRecordTag").val();
    var vehicleId = GetVehicleId().vehicleId;
    var upgradeRecordId = getUpgradeRecordModelData().id;
    var addReminderRecord = $("#addReminderCheck").is(":checked");
    //Odometer Adjustments
    if (isNaN(upgradeMileage) && GetVehicleId().odometerOptional) {
        upgradeMileage = '0';
    }
    upgradeMileage = GetAdjustedOdometer(upgradeRecordId, upgradeMileage);
    //validation
    var hasError = false;
    var extraFields = getAndValidateExtraFields();
    if (extraFields.hasError) {
        hasError = true;
    }
    if (upgradeDate.trim() == '') { //eliminates whitespace.
        hasError = true;
        $("#upgradeRecordDate").addClass("is-invalid");
    } else {
        $("#upgradeRecordDate").removeClass("is-invalid");
    }
    if (upgradeMileage.trim() == '' || isNaN(upgradeMileage) || parseInt(upgradeMileage) < 0) {
        hasError = true;
        $("#upgradeRecordMileage").addClass("is-invalid");
    } else {
        $("#upgradeRecordMileage").removeClass("is-invalid");
    }
    if (upgradeDescription.trim() == '') {
        hasError = true;
        $("#upgradeRecordDescription").addClass("is-invalid");
    } else {
        $("#upgradeRecordDescription").removeClass("is-invalid");
    }
    if (upgradeCost.trim() == '' || !isValidMoney(upgradeCost)) {
        hasError = true;
        $("#upgradeRecordCost").addClass("is-invalid");
    } else {
        $("#upgradeRecordCost").removeClass("is-invalid");
    }
    return {
        id: upgradeRecordId,
        hasError: hasError,
        vehicleId: vehicleId,
        date: upgradeDate,
        mileage: upgradeMileage,
        description: upgradeDescription,
        cost: upgradeCost,
        notes: upgradeNotes,
        files: uploadedFiles,
        supplies: typeof selectedSupplies !== 'undefined' ? selectedSupplies : [],
        tags: upgradeTags,
        addReminderRecord: addReminderRecord,
        extraFields: extraFields.extraFields,
        requisitionHistory: typeof supplyUsageHistory !== 'undefined' ? supplyUsageHistory : [],
        deletedRequisitionHistory: typeof deletedSupplyUsageHistory !== 'undefined' ? deletedSupplyUsageHistory : [],
        reminderRecordId: recurringReminderRecordId,
        copySuppliesAttachment: typeof copySuppliesAttachments !== 'undefined' ? copySuppliesAttachments : false
    }
}