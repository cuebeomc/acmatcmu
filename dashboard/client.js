/**
 * client.js
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
        .then(response => response.text());
    });
}

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
    }).catch(function(err) {
        console.log(err);
    })

    selectIcon('home');
}

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

            if (!firebase.auth().currentUser) {
                console.log('Why are you here? This is in an authorized request.');
                return;
            }

            var user = firebase.auth().currentUser;
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

    }).catch(function(err) {
        console.log(err);
    })

    selectIcon('profile');
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
    formData.append('andrewid', document.getElementById('andrewid').value);
    formData.append('year', document.querySelector('input[name="year"]:checked').value);
    formData.append('size', document.querySelector('input[name="size"]:checked').value);
    formData.append('resume', fileInput.files[0]);

    sendAuthReq('POST', '/api/profile', formData)
    .then(function(res) {
        getStatus();
    }).catch(function(err) {
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
        } else if (!elem.hasAttribute('verified')) {
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
            getStatus()
        } else {
            var uiConfig = {
                callbacks: {
                    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                        return false;
                    }
                },
                signInOptions: [
                    // Leave the lines as is for the providers you want to offer your users.
                    {
                        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                        requireDisplayName: false,
                    },
                    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                    firebase.auth.GithubAuthProvider.PROVIDER_ID,
                ],
                credentialHelper: firebaseui.auth.CredentialHelper.NONE
            };

            var mainBody = document.getElementById('main-body');
            mainBody.innerHTML = '<div id="firebaseui-auth-container"></div>';
            
    
            // Initialize the FirebaseUI Widget using Firebase.
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            // The start method will wait until the DOM is loaded.
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    });
}