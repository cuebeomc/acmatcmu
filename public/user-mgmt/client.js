/**
 * client.js
 */

/**
 * selectIcon highlights the icon with the given iconId.
 * 
 * @param {string} iconId - id of the icon that should be selected
 */
function selectIcon(iconId) {
    var icons = document.querySelectorAll('.nav-icon');
    for (var icon of icons) {
        if (icon.getAttribute('id') == iconId) {
            icon.style.backgroundColor = '#D8B30E';
        } else if (icon.style.backgroundColor == 'rgb(216, 179, 14)') {
            icon.removeAttribute('style');
        }
    }

    // make this less hacky later
    var topbar = document.getElementById('topbar')
    switch (iconId) {
        case 'home':
            topbar.innerHTML = 'Home';
        case 'profile':
            topbar.innerHTML = 'Profile';
        case 'teams':
            topbar.innerHTML = 'Teams';
    }
}

/**
 * getResetPasswordUI gets the reset password UI.
 * 
 * @param {app} auth - the firebase auth app
 * @param {string} actionCode - the action code generated in email
 */
function getResetPasswordUI(auth, actionCode) {
    auth.verifyPasswordResetCode(actionCode).then(function(email) {
        fetch('/api/resetPassword', {
            method: 'GET'
        }).then(response => response.text())
        .then(res => {
            var mainBody = document.getElementById('main-body');
            mainBody.innerHTML = res;

            var emailDiv = document.getElementById('email');
            emailDiv.innerHTML = email;

            var form = document.getElementById('reset-form');
            form.onsubmit = function(event) {
                event.preventDefault();

                console.log("asdfasdf");
                var newPassword = document.getElementById('login-password').value;
                auth.confirmPasswordReset(actionCode, newPassword).then(function(resp) {
                    console.log('asdf');
                    redirectToDashboard();
                }).catch(function(err) {
                    console.log(err);
                });
            }
        });

    }).catch(function(err) {
        console.log(err)
    });
}

/**
 * verifyEmail verifies the action code.
 * 
 * @param {app} auth - the firebase auth app
 * @param {string} actionCode - the action code generated in email
 */
function verifyEmail(auth, actionCode) {
    auth.applyActionCode(actionCode).then(function(resp) {
        console.log(resp);
        redirectToDashboard();
    }).catch(function(err) {
        console.log(err);
    });
}

/**
 * redirecToDashboard does just that; displays a "success! redirecting
 * you to login..." then redirects you
 */
function redirectToDashboard() {
    fetch('/api/redirect', {
        method: 'GET'
    }).then(response => response.text())
    .then(res => {
        var mainBody = document.getElementById('main-body');
        mainBody.innerHTML = res;
        signOut();

        window.setTimeout(function() {
            window.location.href = '/dashboard';
        }, 5000);
    });
}

/**
 * signOut signs out the user and directs them back to the beginning.
 */
function signOut() {
    firebase.auth().signOut().then(function() {
        console.log('success');
    }).catch(function(err) {
        console.log(err)
    });
}

/**
 * On load, we check the query string for the mode. We currently only
 * support resetting password and verifying email. If the user tries
 * to recover email, shit outta luck. Good try breaking the system.
 */
window.onload = function() {
    var auth = firebase.auth()
    var urlParams = new URLSearchParams(window.location.search);
    selectIcon('home');
    
    var mode = urlParams.get('mode');
    var actionCode = urlParams.get('oobCode');

    switch (mode) {
        case 'resetPassword':
            // Display reset password handler and UI.
            getResetPasswordUI(auth, actionCode);
            break;
        case 'verifyEmail':
            // Display email verification handler and UI.
            verifyEmail(auth, actionCode);
            break;
        default:
            // Case 'recoverEmail' is also invalid for now.
    }
}
