function performLogin() {
    let userName = $("#inputUserName").val();
    let userPassword = $("#inputUserPassword").val();
    let isPersistent = $("#inputPersistent").is(":checked");
    $.post('/Login/Login', {userName: userName, password: userPassword, isPersistent: isPersistent}, function (data) {
        if (data.success) {
            //set remember me setting in localStorage
            localStorage.setItem('persistLogin', JSON.stringify(isPersistent));
            //check for redirectURL
            var redirectURL = getRedirectURL().url;
            if (redirectURL.trim() != "") {
                window.location.href = redirectURL;
            } else {
                window.location.href = '/Home';
            }
        } else {
            errorToast(data.message);
        }
    })
}
function checkPersistLoginState() {
    let storedPersistLogin = localStorage.getItem('persistLogin');
    if (storedPersistLogin) {
        $('#inputPersistent').prop('checked', JSON.parse(storedPersistLogin));
    }
}
function checkPasswordComplexity(pwd) {
    var hasLength = pwd.length >= 8;
    var hasUpper = /[A-Z]/.test(pwd);
    var hasLower = /[a-z]/.test(pwd);
    var hasNumber = /[0-9]/.test(pwd);
    var hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    updateRequirementIndicator('req-length', hasLength);
    updateRequirementIndicator('req-upper', hasUpper);
    updateRequirementIndicator('req-lower', hasLower);
    updateRequirementIndicator('req-number', hasNumber);
    updateRequirementIndicator('req-special', hasSpecial);

    return hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
}

function updateRequirementIndicator(id, valid) {
    var elem = document.getElementById(id);
    if (!elem) return;
    var icon = elem.querySelector('i');
    if (valid) {
        elem.classList.remove('text-secondary');
        elem.classList.add('text-success');
        if (icon) icon.className = 'bi bi-check-circle-fill me-1';
    } else {
        elem.classList.remove('text-success');
        elem.classList.add('text-secondary');
        if (icon) icon.className = 'bi bi-circle me-1';
    }
}

function checkPasswordMatch() {
    var pwd = $("#inputUserPassword").val() || '';
    var confirm = $("#inputUserPasswordConfirm").val() || '';
    var matchElem = document.getElementById('req-match');
    if (!matchElem) return;
    if (confirm.length === 0) {
        matchElem.style.display = 'none';
        return;
    }
    matchElem.style.display = 'block';
    var icon = matchElem.querySelector('i');
    if (pwd === confirm) {
        matchElem.className = 'small text-success mt-1';
        matchElem.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Las contraseñas coinciden';
    } else {
        matchElem.className = 'small text-danger mt-1';
        matchElem.innerHTML = '<i class="bi bi-x-circle-fill me-1"></i>Las contraseñas no coinciden';
    }
}

function performRegistration() {
    let userName = $("#inputUserName").val()?.trim() || '';
    let userEmail = $("#inputEmail").val()?.trim() || '';
    let userPassword = $("#inputUserPassword").val() || '';
    let userPasswordConfirm = $("#inputUserPasswordConfirm").val() || '';

    if (!userEmail) {
        errorToast("Por favor, introduce tu correo electrónico.");
        return;
    }
    if (!userName) {
        errorToast("Por favor, introduce un nombre de usuario.");
        return;
    }
    if (!userPassword) {
        errorToast("Por favor, introduce una contraseña.");
        return;
    }
    if (!checkPasswordComplexity(userPassword)) {
        errorToast("La contraseña debe cumplir todos los requisitos de seguridad.");
        return;
    }
    if (userPasswordConfirm && userPassword !== userPasswordConfirm) {
        errorToast("Las contraseñas no coinciden.");
        return;
    }

    $.post('/Login/Register', { userName: userName, password: userPassword, emailAddress: userEmail }, function (data) {
        if (data.success) {
            successToast(data.message);
            setTimeout(function () { window.location.href = '/Login/Index' }, 800);
        } else {
            errorToast(data.message);
        }
    });
}

function requestPasswordReset() {
    let userName = $("#inputUserName").val();
    $.post('/Login/RequestResetPassword', { userName: userName }, function (data) {
        if (data.success) {
            successToast(data.message);
            setTimeout(function () { window.location.href = '/Login/Index' }, 500);
        } else {
            errorToast(data.message);
        }
    })
}
function performPasswordReset() {
    let token = $("#inputToken").val();
    let userPassword = $("#inputUserPassword").val();
    let userEmail = $("#inputEmail").val();

    if (!checkPasswordComplexity(userPassword)) {
        errorToast("La nueva contraseña debe cumplir los requisitos de seguridad.");
        return;
    }

    $.post('/Login/ResetPassword', { token: token, password: userPassword, emailAddress: userEmail }, function (data) {
        if (data.success) {
            successToast(data.message);
            setTimeout(function () { window.location.href = '/Login/Index' }, 500);
        } else {
            errorToast(data.message);
        }
    })
}
function sendRegistrationToken() {
    let userEmail = $("#inputEmail").val();
    $.post('/Login/SendRegistrationToken', { emailAddress: userEmail }, function (data) {
        if (data.success) {
            successToast(data.message);
        } else {
            errorToast(data.message);
        }
    })
}
function remoteLogin() {
    window.location.href = '/Login/RemoteLogin';
}
function performOpenIdRegistration() {
    let userName = $("#inputUserName").val();
    let userEmail = $("#inputEmail").val();
    $.post('/Login/RegisterOpenIdUser', { userName: userName, emailAddress: userEmail }, function (data) {
        if (data.success) {
            successToast(data.message);
            setTimeout(function () { window.location.href = '/Home' }, 500);
        } else {
            errorToast(data.message);
        }
    });
}
