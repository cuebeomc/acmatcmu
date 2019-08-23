const admin = require('firebase-admin');
const express = require('express');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');

const app = express();
const port = 3000;

const andrewDomain = 'andrew.cmu.edu';

var storage = multer.memoryStorage();
var upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb
    }
});

// initialize admin SDK
admin.initializeApp({
    credential: admin.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL
    }),
    databaseURL: "https://users-service-7a96a.firebaseio.com",
    storageBucket: "users-service-7a96a.appspot.com"
});

// set useful firebase-related databases/storage links
var firestore = admin.firestore();
var storage = admin.storage();
var users = storage.bucket();
var userData = firestore.collection('users');

// define valid values for profile forms
var validYears = ['freshman', 'sophomore', 'junior', 'senior', 'graduate'];
var shirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// add authentication middleware
async function authenticate(req, res, next) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        res.status(403).send('Unauthorized');
        return;
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;

        var email = req.user.email;
        var domain = email.replace(/.*@/, "");

        if (domain != andrewDomain) {
            res.status(403).sendFile(path.join(__dirname, 'schemas/error-pages/wrong-email-domain.html'));
            return;
        }

        if (!req.user.email_verified) {
            res.sendFile(path.join(__dirname, 'schemas/status/verify-andrewid.html'));
            return;
        }

        next();
        return;
    } catch(e) {
        console.log(e)
        res.status(403).send('Unauthorized');
        return;
    }
}

/**
 *********************************
 *        HOMEPAGE ROUTES        *
 *********************************
 */

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/homepage/welcome.json'));
    console.log("GET to /welcome from " + req.hostname)
});

app.get('/aboutus', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/homepage/aboutus.json'))
    console.log("GET to /aboutus from " + req.hostname)
});

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/homepage/events.json'))
    console.log("GET to /events from " + req.hostname)
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/homepage/dummy_register.json'));
    console.log("GET to /register from " + req.hostname)
});

app.get('/sponsors', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/homepage/sponsors.json'))
    console.log("GET to /sponsors from " + req.hostname)
});


/**
 ********************************
 *       DASHBOARD ROUTES       *
 ********************************
 */

/**
 * GET /dashboard is for the "home" page of the login system
 */
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));


/**
 * GET /api/login responds with the UI for the login prompt.
 */
app.get('/api/login', (req, res) => {
    console.log('GET to /api/login');
    res.sendFile(path.join(__dirname, 'schemas/status/login-ui.html'));
});

/**
 * GET /api/signup responds with the UI for the signup prompt.
 */
app.get('/api/signUp', (req, res) => {
    console.log('GET to /api/signUp');
    res.sendFile(path.join(__dirname, 'schemas/status/signup-ui.html'));
});

/**
 * GET /api/status responds with the correct page depending on how far the
 * user is into the registration. requires authentication.
 */
app.get('/api/status', authenticate, (req, res) => {
    console.log('GET to /api/status');
    var docRef = firestore.collection('users').doc(req.user.uid);
    docRef.get().then(documentSnapshot => {
        if (documentSnapshot.exists) {
            res.sendFile(path.join(__dirname, 'schemas/status/register-event.html'));
            return;
        }
        else {
            res.sendFile(path.join(__dirname, 'schemas/status/set-profile.html'));
            return;
        }
    });
});

/**
 * GET /api/profile responds with either the profile form if the user
 * has no profile associated with it, or a "disabled" form filled with
 * user data that the user can then choose to edit
 */
app.get('/api/profile', authenticate, (req, res) => {
    console.log('GET to /api/profile');
    var docRef = firestore.collection('users').doc(req.user.uid);

    docRef.get().then(documentSnapshot => {
        if (documentSnapshot.exists) {
            var doc = documentSnapshot.data()
            var data = {
                name: doc.name,
                year: doc.classYear,
                size: doc.shirtSize,
            }

            if (doc.resumeName != null) {
                data.resumeExists = true;
                data.resumeName = doc.resumeName;
            } else {
                data.resumeExists = false;
            }

            ejs.renderFile(path.join(__dirname, 'schemas/profile/edit-profile.ejs'), data, (err, str) => {
                if (err) {
                    console.log(err);
                    res.status(500).send("Internal server error");
                } else {
                    res.send(str)
                }
            })
        }
        else {
            res.sendFile(path.join(__dirname, 'schemas/profile/create-profile.html'));
        }
    });
});

/**
 * uploadFile uploads the given file through a multipart request to
 * Google Cloud storage
 */
function uploadFile (req, res) {
    users.get({
        autoCreate: true,
        project: "users-service-7a96a"
    }, function(err, bucket, apiResponse) {
        if(err) {
            return err;
        }

        const name = 'user-storage/' + req.user.uid + '/' + req.file.originalname;
        const file = bucket.file(name);
    
        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            },
            resumable: false
        });
    
        stream.on('error', (err) => {
            req.file.cloudStorageError = err;
            return err
        });
    
        stream.on('finish', () => {
            req.file.cloudStorageObject = name;
        });

        stream.end(req.file.buffer);
    });
}

/**
 * isIn simply checks if a string is in an array
 */
function isIn(arr, str) {
    for (const year of arr) {
        if (year == str) {
            return true;
        }
    }
    return false;
}

/**
 * POST /api/profile is endpoint to set the user's profile data. it
 * requires authentication and performs data validation to make sure
 * no invalid data comes in.
 * 
 * A "valid" form (which results in an update/write) is as follows:
 *  1. the name/andrewid fields are not empty
 *  2. the given year and shirt size are valid years/shirt sizes
 *  3. if the user has verified their andrewID, additional edits to
 *     their profile will no longer change their andrewID.
 */
app.post('/api/profile', [authenticate, upload.single('resume')], (req, res) => {
    console.log('POST to /api/profile');

    // validate data
    if ( req.body.name == '' || !isIn(validYears, req.body.year) || !isIn(shirtSizes, req.body.size)) {
        res.status(400).send('Bad request: invalid form data');
        return;
    }

    var email = req.user.email;
    var andrewID = email.replace(/@.*$/,"");

    // baseline data that gets sent with every request
    var data = {
        name: req.body.name,
        andrewID: andrewID,
        classYear: req.body.year,
        shirtSize: req.body.size,
        role: 'participant'
    };

    // now we check the database for the user's data
    userData.doc(req.user.uid).get()
    .then(documentSnapshot => {
        data.andrewID = req.body.andrewid;

        // if a file exists
        if (req.file) {
            // first, we validate the file type
            if (req.file.mimetype != 'application/pdf') {
                res.status(400).send('Bad request: invalid form data');
                return;
            }

            // upload file to storage
            var resumeName = req.file.originalname;
            var err = uploadFile(req, res);
            if (err != null) {
                res.status(500).send('Internal server error.');
                return;
            }

            // then add the resume name to our data
            data.resumeName = resumeName;
        }

        // note that if the user has not uploaded a file and if they have user
        // data, their old document (if it exists) will not be overwritten.
        // if the user does not have user data, there may not exist a resume name/
        // resume stored backend, since we do not require an upload of the resume.

        // if the user has a document
        if (documentSnapshot.exists) {
            // we UPDATE data, not set data, since user may not have updated resume
            userData.doc(req.user.uid).update(data)
            .then(result => {
                res.status(200).send('success');
            }).catch(err => {
                console.log(err)
                res.status(500).send('Internal server error.');
            })
        } else {
            // otherwise, if no document stored for this user,
            // we set data; should not have any impact
            userData.doc(req.user.uid).set(data)
            .then(result => {
                res.status(200).send('success');
            }).catch(err => {
                console.log(err)
                res.status(500).send('Internal server error.');
            })
        }

    }).catch(err => {
        console.log(err);
        res.status(500).send('Internal server error');
    });
});

/**
 *******************************
 *       User Management       *
 *******************************
 */

app.get('/usermgmt', (req, res) => {
    // have to handle multiple queries
    res.send('asdf');
});

app.listen(process.env.PORT || port, () => console.log(`App listening on port ${port}!`));
