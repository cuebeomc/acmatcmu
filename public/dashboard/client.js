/**
 * client.js
 */

/*
 ************************
 *      Login flow      *
 ************************
 */

 // TODO: For all getUI methods, add error handling where
 // the GET request fails and alert the user.

/**
 * getLoginUI gets the set of inputs that start the login flow.
 */
function getLoginUI() {
    fetch('/api/login', {
        method: 'GET'
    }).then(response => response.text())
    .then(res => {
        var mainBody = document.getElementById('main-body');
        mainBody.innerHTML = res;
        selectIcon('home');
    });
}

/**
 * loginUser logs in the user into firebase auth.
 * @param {event} e - the default event of submitting a form
 * 
 */
function loginUser(e) {
    e.preventDefault()

    var email = document.getElementById('login-email').value;
    var password = document.getElementById('login-password').value;
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessageDiv = document.getElementById('error-message');

        console.log(error)
        switch(errorCode) {
            case 'auth/invalid-email':
                errorMessageDiv.innerHTML = 'Invalid email.';
                break;
            case 'auth/user-disabled':
                errorMessageDiv.innerHTML = 'This user has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessageDiv.innerHTML = 'This user cannot be found.';
                break;
            case 'auth/wrong-password':
                errorMessageDiv.innerHTML = 'Wrong password. Please try again';
                break;
            default:
                errorMessageDiv.innerHTML = 'Unknown error occured.';
                break;
        };
    });
}

/**
 * showSignUp shows the signup page.
 */
function getSignUpUI() {
    fetch('/api/signUp', {
        method: 'GET'
    }).then(response => response.text())
    .then(res => {
        var mainBody = document.getElementById('main-body');
        mainBody.innerHTML = res;
        selectIcon('home');
    });
}

/**
 * signUpUser signs up the user with the given email and password.
 * @param {event} e - the default event of submitting a form
 * 
 */
function signUpUser(e) {
    e.preventDefault()

    var email = document.getElementById('login-email').value;
    var password = document.getElementById('login-password').value;
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessageDiv = document.getElementById('error-message');

        switch(errorCode) {
            case 'auth/email-already-in-use':
                errorMessageDiv.innerHTML = 'This email is already associated with an account.';
                break;
            case 'auth/invalid-email':
                errorMessageDiv.innerHTML = 'This email is invalid.';
                break;
            case 'auth/operation-not-allowed':
                errorMessageDiv.innerHTML = 'This shouldn\'t happen... Contact acm-exec@cs.cmu.edu.';
                break;
            case 'auth/weak-password':
                errorMessageDiv.innerHTML = 'This password is too weak. The password should be at least 6 characters.';
                break;
            default:
                errorMessageDiv.innerHTML = 'Unknown error occured.';
                break;
        };
    });
}

/**
 * sendVerification sends the verification email to the logged
 * in user's email account for verification. 
 */
function sendVerification() {
    var user = firebase.auth().currentUser;

    user.sendEmailVerification().then(function() {
        var message = document.getElementById('email-message');
        message.innerHTML = 'Email sent! Check your email.';
    }).catch(function(err) {
        // TODO: Add showing errors.
        console.log(err);
    });
}

/**
 * getForgotPasswordUI shows the UI to reset password.
 */
function getForgotPasswordUI() {
    fetch('/api/forgotPassword', {
        method: 'GET'
    }).then(response => response.text())
    .then(res => {
        var mainBody = document.getElementById('main-body');
        mainBody.innerHTML = res;
        selectIcon('home');
    });
}

/**
 * resetPassword resets the user's password and sends an email to
 * their email.
 * 
 * @param {event} e - the default event of submitting a form
 * 
 */
function resetPassword(e) {
    e.preventDefault()

    var email = document.getElementById('login-email').value;
    firebase.auth().sendPasswordResetEmail(email).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessageDiv = document.getElementById('error-message');

        switch(errorCode) {
            case 'auth/invalid-email':
                errorMessageDiv.innerHTML = 'This email is invalid.';
                break;
            case 'auth/missing-continue-uri':
                errorMessageDiv.innerHTML = 'missing continue uri';
                break;
            case 'auth/invalid-continue-uri':
                errorMessageDiv.innerHTML = 'invalid continue uri';
                break;
            case 'auth/unauthorized-continue-uri':
                errorMessageDiv.innerHTML = 'unauthorized continue uri';
                break;
            case 'auth/user-not-found':
                errorMessageDiv.innerHTML = 'This user is invalid.';
                break;
            default:
                errorMessageDiv.innerHTML = 'Unknown error occured.';
                break;
        };
    });

    getEmailSentUI();
}

/**
 * getEmailSentUI shows the "email sent" page.
 */
function getEmailSentUI() {
    fetch('/api/emailSent', {
        method: 'GET'
    }).then(response => response.text())
    .then(res => {
        var mainBody = document.getElementById('main-body');
        mainBody.innerHTML = res;
        selectIcon('home');
    });
}

/**
 * signOut signs out the user and directs them back to the beginning.
 */
function signOut() {
    firebase.auth().signOut().then(function() {
        getLoginUI();
    }).catch(function(err) {
        console.log(err)
    });
}

/*
 *************************
 *      Auth helper      *
 *************************
 */

/**
 * sendAuthReq is a wrapper to send authenticated requests for API endpoints
 * that require authentication. 
 * 
 * @param {string} method - The type of HTTP request to make
 * @param {string} url - The request URL for the HTTP request
 * @param {*} body - The body to send along with the request (if request is POST)
 */
function sendAuthReq(method, url, body) {
    if (!firebase.auth().currentUser) {
        throw new Error('Not authenticated. Make sure you\'re signed in!');
    }

    // Get the Firebase auth token to authenticate the request
    return firebase.auth().currentUser.getIdToken().then(function(token) {
        var request = {
            method: method,
            url: url,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        };

        if (method === 'POST') {
            request.body = body
        }

        return fetch(url, request)
        .then(response => {
            return response.text();
        });
    });
}


/*
 **********************************
 *     Dashboard/home UI flow     *
 **********************************
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
    if (iconId == 'home') {
        topbar.innerHTML = 'Home';
    } else if (iconId == 'profile') {
        topbar.innerHTML = 'Profile';
    }
}

/**
 * getStatus calls the server to get the user's current status in registration
 * and setting up the profile.
 */
function getStatus() {
    sendAuthReq('GET', '/api/status', null)
    .then(function(res) {
        var mainBody = document.getElementById('main-body');
        mainBody.innerHTML = res;
        selectIcon('home');
    }).catch(function(err) {
        mainBody.innerHTML = 'Failed to get home page. Please try again later.';
        console.log(err);
    })
}

/*
 *****************************
 *      Profile UI flow      *
 *****************************
 */

/**
 * getProfile gets the profile for the current user or gets the form to create
 * the profile for the current user if they have not created a profile yet.
 */
function getProfile() {
    sendAuthReq('GET', '/api/profile', null)
    .then(function(res) {
        var mainBody = document.getElementById('main-body');
        mainBody.innerHTML = res;

        var resumeDiv = document.getElementById('resume-name');
        if (resumeDiv != null) {
            var fileName = resumeDiv.innerHTML;

            var user = firebase.auth().currentUser;
            if (!user) {
                console.log('Why are you here? This is in an authorized request.');
                return;
            }

            var storage = firebase.storage();
            var fileRef = storage.ref('user-storage/' + user.uid + '/' + fileName);

            var downloadButton = document.getElementById('download-icon');
            fileRef.getDownloadURL()
            .then(fileURL => {
                downloadButton.target = '_blank';
                downloadButton.href = fileURL;
            }).catch(err => {
                console.log(err)
            });
        }

        selectIcon('profile');
    }).catch(function(err) {
        mainBody.innerHTML = 'Failed to get profile page. Please try again later.';
        console.log(err);
    })
}

/**
 * setProfile submits the form to create a brand new profile for the user.
 * 
 * @param {event} e - the default event of form submit
 */
function setProfile(e) {
    e.preventDefault();
    var fileInput = document.getElementById('resume-upload');
    var formData = new FormData();

    formData.append('name', document.getElementById('name').value);
    formData.append('year', document.querySelector('input[name="year"]:checked').value);
    formData.append('size', document.querySelector('input[name="size"]:checked').value);
    formData.append('resume', fileInput.files[0]);

    sendAuthReq('POST', '/api/profile', formData)
    .then(function(res) {
        // very bad hack for now
        var status = parseInt(res.substr(0, res.indexOf(':')));
        var message = res.substr(res.indexOf(':') + 2);
        if (status != 200) {
            var errorMessageDiv = document.getElementById('error-message');
            errorMessageDiv.innerHTML = message;
        } else {
            getStatus();
        }
    }).catch(function(err) {
        console.log(err);
    })
}

/**
 * enableEdit allows the form to be editable. If the user has already
 * created a profile but wants to change some fields, they can press
 * the "Edit profile" button to allow access to the fields. if they
 * have verified their Andrew ID, they are not allowed to change this field.
 */
function enableEdit() {
    var inputs = document.querySelectorAll('input');
    for (var elem of inputs) {
        if (elem.getAttribute('id') == 'resume-upload') {
            elem.style.display = 'block';
            var downloadElem = document.getElementById('resume-download');
            downloadElem.style.display = 'none';
        } else {
            elem.removeAttribute('disabled');
        }
    }

    var editButton = document.getElementById('edit-button');
    editButton.style.display = 'none';
    var setButton = document.getElementById('set-button');
    setButton.style.display = 'block';
}

/**
 * This page, on load, always goes to /dashboard, and so on load, we want to
 * load the login UI if the user is not logged in on the browser, or
 * we want to get the status (the home page) if the user is logged in.
 */
window.onload = function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            getStatus();
        } else {
            getLoginUI();
        }
    });
}
