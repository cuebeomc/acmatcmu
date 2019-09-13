const UIDGenerator = require('uid-generator');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const express = require('express');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');
const app = express();
const port = 3000;

const uidgen = new UIDGenerator(40, UIDGenerator.BASE36);
const andrewDomain = 'andrew.cmu.edu';
const eduTLD = '.edu';

var storage = multer.memoryStorage();
var upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb
    }
});

if (process.env.NODE_ENV == 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

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
var teamData = firestore.collection('teams');

// define valid values for profile forms
var validYears = ['freshman', 'sophomore', 'junior', 'senior', 'graduate'];
var validSizes = ['S', 'M', 'L', 'XL'];
var validRoles = ['participant', 'mentor'];

// add authentication middleware
async function authUser(req, res, next) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;

        var email = req.user.email;
        var domain = email.replace(/.*@/, '');

        var lastPeriod = domain.lastIndexOf('.');
        var tld = domain.substring(lastPeriod);

        if (lastPeriod < 0 || tld != eduTLD) {
            var data = {
                statusMessage: 'INVALID',
                todoMessage: 'You\'re not logged in using a student email! Please log in/sign up with a student email to continue.'
            }
    
            ejs.renderFile(path.join(__dirname, 'schemas/status/status.ejs'), data, (err, str) => {
                if (err) {
                    console.log(err);
                    res.status(500).send("Internal server error");
                } else {
                    res.status(403).send(str)
                }
            })
            return;
        }

        next();
        return;
    } catch(e) {
        console.log(e)
        res.status(401).send('Unauthorized');
        return;
    }
}


/**
 *********************************
 *        HOMEPAGE ROUTES        *
 *********************************
 */


app.use('/', express.static(path.join(__dirname, 'public/homepage')));

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
 *********************************
 *    USER MANAGEMENT UI/FLOW    *
 *********************************
 */


/**
 * GET /usermgmt handles user management (the link that verifies email,
 * recover email, forgot password). We don't handle this backend and let
 * the client handle it instead.
 */
app.use('/usermgmt', express.static(path.join(__dirname, 'public/user-mgmt')));

/**
 * GET /api/redirect sends the redirect UI.
 */
app.get('/api/redirect', (req, res) => {
    console.log('GET to /redirect')
    res.sendFile(path.join(__dirname, 'schemas/login/redirect-ui.html'));
});

/**
 * GET /api/login responds with the UI for the login prompt.
 */
app.get('/api/login', (req, res) => {
    console.log('GET to /api/login');
    res.sendFile(path.join(__dirname, 'schemas/login/login-ui.html'));
});

/**
 * GET /api/signup responds with the UI for the signup prompt.
 */
app.get('/api/signUp', (req, res) => {
    console.log('GET to /api/signUp');
    res.sendFile(path.join(__dirname, 'schemas/login/signup-ui.html'));
});

/**
 * GET /api/forgotPassword sends the forgotPassword UI.
 */
app.get('/api/forgotPassword', (req, res) => {
    console.log('GET to /forgotPassword')
    res.sendFile(path.join(__dirname, 'schemas/login/forgot-password-ui.html'));
});

/**
 * GET /api/resetPassword sends the resetPassword UI.
 */
app.get('/api/resetPassword', (req, res) => {
    console.log('GET to /resetPassword')
    res.sendFile(path.join(__dirname, 'schemas/login/reset-password-ui.html'));
});

/**
 * GET /api/emailSent sends the messages that shows that the verification email
 * has been sent.
 */
app.get('/api/emailSent', (req, res) => {
    console.log('GET to /emailSent')
    res.sendFile(path.join(__dirname, 'schemas/status/email-sent.html'));
});


/**
 ********************************
 *       DASHBOARD ROUTES       *
 ********************************
 */


/**
 * GET /dashboard is for the "home" page of the login system
 */
app.use('/dashboard', express.static(path.join(__dirname, 'public/dashboard')));

/**
 * GET /api/status responds with the correct page depending on how far the
 * user is into the registration. requires authentication.
 */
app.get('/api/status', authUser, (req, res) => {
    console.log('GET to /api/status');

    if (!req.user.email_verified) {
        var data = {
            statusMessage: 'Not registered',
            todoMessage: 'You\'re not done yet! Two more things to do; first, verify your email by clicking <div class="hover-button" onclick="sendVerification()">here.</div> <div id="email-message">&nbsp;</div>'
        }

        ejs.renderFile(path.join(__dirname, 'schemas/status/status.ejs'), data, (err, str) => {
            if (err) {
                console.log(err);
                res.status(500).send("Internal server error");
            } else {
                res.send(str)
            }
        })
        return;
    }
    var docRef = userData.doc(req.user.uid);
    docRef.get().then(documentSnapshot => {
        if (documentSnapshot.exists) {
            var doc = documentSnapshot.data()

            var data = {
                statusMessage: "Registered",
                todoMessage: "Emails have been sent regarding statuses. Please check your email. If you have not received contact, contact us ASAP."
            }

            if (doc.status != null && doc.status == "late") {
                data.statusMessage = "On waitlist";
                data.todoMessage = "Thanks for registering late! Although we can't guarantee you a spot, please come to Rashid Auditorium at 5:45 for a chance to get off the waitlist."
            }

            ejs.renderFile(path.join(__dirname, 'schemas/status/status.ejs'), data, (err, str) => {
                if (err) {
                    console.log(err);
                    res.status(500).send("Internal server error");
                } else {
                    res.send(str)
                }
            })
            return;
        }
        else {
            var data = {
                statusMessage: 'Not registered',
                todoMessage: 'One last thing to do! Set your profile in the Profile tab.'
            }
    
            ejs.renderFile(path.join(__dirname, 'schemas/status/status.ejs'), data, (err, str) => {
                if (err) {
                    console.log(err);
                    res.status(500).send("Internal server error");
                } else {
                    res.send(str)
                }
            })
            return;
        }
    });
});

/**
 * GET /api/profile responds with either the profile form if the user
 * has no profile associated with it, or a "disabled" form filled with
 * user data that the user can then choose to edit
 */
app.get('/api/profile', authUser, (req, res) => {
    console.log('GET to /api/profile');

    if (!req.user.email_verified) {
        res.status(403).send('Your email has not been verified!');
        return;
    }

    var docRef = userData.doc(req.user.uid);
    docRef.get().then(documentSnapshot => {
        if (documentSnapshot.exists) {
            var doc = documentSnapshot.data()
            var data = {
                name: doc.name,
                year: doc.classYear,
                size: doc.shirtSize,
                role: doc.role
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
 *  1. the name field is not empty
 *  2. the given year and shirt size are valid years/shirt sizes
 */
app.post('/api/profile', [authUser, upload.single('resume')], (req, res) => {
    console.log('POST to /api/profile');

    // validate data
    if ( req.body.name == '' || !isIn(validYears, req.body.year) 
      || !isIn(validSizes, req.body.size) || !isIn(validRoles, req.body.role) ) {
        res.status(400).send('400: Invalid form data.');
        return;
    }

    var email = req.user.email;
    var domain = email.replace(/.*@/, '');
    var id = email.replace(/@.*$/, '');

    if (!req.user.email_verified) {
        res.status(403).send('403: Your email has not been verified!');
        return;
    }

    // TODO: add checking CMU directory for major data

    // baseline data that gets sent with every request
    var data = {
        name: req.body.name,
        classYear: req.body.year,
        shirtSize: req.body.size,
        role: req.body.role
    };

    if (domain == andrewDomain) {
        data.andrewID = id;
    } else {
        data.ID = id;
    }

    // now we check the database for the user's data
    userData.doc(req.user.uid).get()
    .then(documentSnapshot => {
        // if a file exists
        if (req.file) {
            // first, we validate the file type
            if (req.file.mimetype != 'application/pdf') {
                res.status(400).send('400: Invalid resume file type.');
                return;
            }

            // upload file to storage
            var resumeName = req.file.originalname;
            var err = uploadFile(req, res);
            if (err != null) {
                res.status(500).send('500: Internal server error.');
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
            var doc = documentSnapshot.data();
            if (doc.team != null && req.body.role == 'mentor') {
                res.status(400).send('400: You are in a team - leave the team first before becoming a mentor!');
                return;
            }
            // we UPDATE data, not set data, since user may not have updated resume
            userData.doc(req.user.uid).update(data)
            .then(result => {
                res.status(200).send('200: Success!');
            }).catch(err => {
                console.log(err)
                res.status(500).send('500: Internal server error.');
            })
        } else {
            data.status = "late";

            // otherwise, if no document stored for this user,
            // we set data; should not have any impact
            userData.doc(req.user.uid).set(data)
            .then(result => {
                res.status(200).send('200: Success!');
            }).catch(err => {
                console.log(err)
                res.status(500).send('500: Internal server error.');
            })
        }

    }).catch(err => {
        console.log(err);
        res.status(500).send('500: Internal server error');
    });
});

/**
 ****************************
 *       TEAMS ROUTES       *
 ****************************
 */

/**
 * GET /api/teams shows the Join or Create team page if the
 * user is not in a team, and otherwise it shows the members
 * of the team that the user is in. 
 */
app.get('/api/teams', authUser, (req, res) => {
    console.log('GET to /api/teams');

    // if email isn't verified, show error msg
    if (!req.user.email_verified) {
        res.status(403).send('Your email has not been verified!');
        return;
    }

    // look up the user
    var docRef = userData.doc(req.user.uid);
    docRef.get().then(documentSnapshot => {

        // if the user has set profile, we check if they're in a team
        if (documentSnapshot.exists) {
            var doc = documentSnapshot.data();

            // if they're in a team, we look up the team and show the UI
            if (doc.team != null && doc.role == 'participant') {
                var teamRef = teamData.doc(doc.team);
                teamRef.get().then(teamSnapshot => {
                    if (teamSnapshot.exists) {
                        var team = teamSnapshot.data();

                        // get all users in this team
                        userData.where('team', '==', doc.team).get()
                        .then(snapshot => {
                            var andrewIDs = [];
                            snapshot.forEach(doc => {
                                var data = doc.data();
                                if (data.andrewID != null) {
                                    andrewIDs.push(data.andrewID);
                                } else {
                                    andrewIDs.push(data.ID);
                                }
                            });

                            var data = {
                                teamName: team.name,
                                accessCode: team.accessCode,
                                members: andrewIDs,
                                isOwner: (team.owner == req.user.uid)
                            }

                            ejs.renderFile(path.join(__dirname, 'schemas/teams/team-page.ejs'), data, (err, str) => {
                                if (err) {
                                    console.log(err);
                                    res.status(500).send("Internal server error");
                                } else {
                                    res.send(str)
                                }
                            })

                        }).catch(err => {
                            // failed to get data
                            console.log(err);
                            res.status(500).send('Internal server error.');
                            return;
                        });

                    } else {
                        // should never get here; that means some data is inconsistent
                        res.status(500).send('Internal server error.');
                        return;
                    }
                })
            } else if (doc.role == 'mentor') {
                // if the user is a mentor, don't display the Teams page at all.
                res.status(200).send('This page is not available for mentors.');
                return;
            } else {
                res.sendFile(path.join(__dirname, 'schemas/teams/join-create-team.html'));
                return;
            }
        } else {
            // if the user has no profile, we send them a simple one-liner
            res.status(403).send('Your profile has not been created yet!');
            return;
        }
    }); 
});

/**
 * POST /api/teams creates a team for the user with the given
 * team name. The team name must not be empty and should be unique.
 * It generates an access code other users can use to join the team.
 */
app.post('/api/teams', [authUser, bodyParser.json()], (req, res) => {
    console.log('POST to /api/teams');

    // validate form
    if (req.body.teamName == '') {
        res.status(400).send("400: Please enter a team name.");
        return;
    }

    var docRef = userData.doc(req.user.uid);
    docRef.get().then(documentSnapshot => {

        // if the user has set profile, we check if they're allowed
        // to create a team (participant + not already in a team)
        if (documentSnapshot.exists) {
            var doc = documentSnapshot.data();

            // user must be a participant
            if (doc.role != 'participant') {
                res.status(403).send('400: You cannot create a team as a mentor!');
            }

            if (doc.team != null) {
                res.status(400).send('400: User is already in a team.');
                return;
            }

            // check if team name is unique
            teamData.where('name', '==', req.body.teamName).get()
            .then(querySnapshot => {
                // if no team is found, continue 
                if (querySnapshot.size == 0) {

                    // add team with randomly generated uid and access code
                    teamData.add({
                        name: req.body.teamName,
                        accessCode: uidgen.generateSync(),
                        owner: req.user.uid
                    }).then(ref => {

                        // update the creator's team status
                        userData.doc(req.user.uid).update({
                            team: ref.id
                        }).then(result => {
                            res.send('200: Success.');
                            return;
                        }).catch(err => {
                            res.status(500).send('500: Internal server error.');
                            return;
                        })

                    }).catch(err => {
                        res.status(500).send('500: Internal server error.');
                        return;
                    });

                } else {
                    res.status(400).send('400: Name already taken.');
                    return;
                }
            }).catch(err => {
                res.status(500).send('500: Internal server error.');
                return;
            })
        
        } else {
            res.status(403).send('403: You have not set your profile!');
            return;
        }
    });
});

/**
 * POST /api/joinTeam requires a team name and an access code that is
 * to verify the correct team that the user is looking for and adds
 * them to the team if they are not already in a team and they are participants.
 */
app.post('/api/joinTeam', [authUser, bodyParser.json()], (req, res) => {
    console.log('POST to /api/joinTeam');

    // validate form
    if (req.body.teamName == '' || req.body.accessCode == '') {
        res.status(400).send("400: Invalid form data.");
        return;
    }

    teamData.where('name', '==', req.body.teamName).get()
    .then(querySnapshot => {

        // if no team is found, send 404
        if (querySnapshot.size == 0) {
            res.status(404).send('404: Team not found.');
            return;
        }

        // the forEach should only fire once; require unique names
        querySnapshot.forEach(teamSnapshot => {
            var teamDoc = teamSnapshot.data();

            // if access code is valid, check user
            if (teamDoc.accessCode == req.body.accessCode) {
                var docRef = userData.doc(req.user.uid);
                docRef.get().then(userSnapshot => {
                    if (userSnapshot.exists) {
                        var doc = userSnapshot.data();

                        // user must be a participant
                        if (doc.role != 'participant') {
                            res.status(403).send('400: You cannot create a team as a mentor!');
                        }

                        // check that user is not in a team
                        if (doc.team != null) {
                            res.status(400).send('400: User is already in a team.');
                            return;
                        }

                        // check that the team has < 4 members
                        userData.where('team', '==', teamSnapshot.id).get()
                        .then(snapshot => {
                            if (snapshot.size < 4) {
                                // update the user's team data
                                docRef.update({
                                    team: teamSnapshot.id
                                }).then(result => {
                                    res.send('200: Success!');
                                    return;
                                }).catch(err => {
                                    res.status(500).send('500: Internal server error.');
                                    return;
                                });

                            } else {
                                res.status(403).send('403: This team is full.');
                                return;
                            }
                        }).catch(err => {
                            res.status(500).send('500: Internal server error.');
                            return;
                        })

                    } else {
                        // if no snapshot, user should create profile first
                        res.status(403).send('403: Create your profile first!');
                        return;
                    }

                }).catch(err => {
                    res.status(500).send('500: Internal server error.');
                    return;
                });

            } else {
                // if invalid access code, deny access
                res.status(403).send('403: Wrong access code.');
                return;
            }
        })

    }).catch(err => {
        res.status(500).send('500: Internal server error.');
        return;
    });
});

/**
 * DELETE /api/teams deletes the entire team if the owner of the team
 * is calling this method; if a non-owner calls this method, then
 * the user simply leaves the team.
 */
app.delete('/api/teams', authUser, (req, res) => {
    console.log('DELETE to /api/teams');

    var docRef = userData.doc(req.user.uid);
    docRef.get().then(documentSnapshot => {
        if (documentSnapshot.exists) {
            var userDoc = documentSnapshot.data();

            // user must be in a team to delete or leave 
            if (userDoc.team == null) {
                res.status(400).send('400: Cannot leave/delete a team if you\'re not in one!');
                return;
            }

            // check if user is owner of team
            var teamRef = teamData.doc(userDoc.team);
            teamRef.get().then(teamSnapshot => {

                if (teamSnapshot.exists) {
                    var team = teamSnapshot.data();

                    // if user is owner, remove everyone
                    if (team.owner == req.user.uid) {
                        userData.where('team', '==', userDoc.team).get()
                        .then(snapshot => {
                            var batch = firestore.batch();
                            snapshot.forEach(doc => {
                                batch.update(userData.doc(doc.id), 'team', admin.firestore.FieldValue.delete());
                            });
                            batch.delete(teamRef);

                            batch.commit().then(result => {
                                res.send('200: Success!');
                                return;
                            }).catch(err => {
                                console.log(err);
                                res.status(500).send('500: Internal server error.');
                                return;
                            });
                        }).catch(err => {
                            // failed to get data
                            console.log(err);
                            res.status(500).send('500: Internal server error.');
                            return;
                        });
                    } else {
                        // otherwise just remove the user only
                        docRef.update({
                            team: admin.firestore.FieldValue.delete()
                        }).then(result => {
                            res.send('200: Success!');
                            return;
                        }).catch(err => {
                            console.log(err);
                            res.status(500).send('500: Internal server error.');
                            return;
                        });
                    }
                }

            }).catch(err => {
                // failed to get data
                console.log(err);
                res.status(500).send('500: Internal server error.');
                return;
            });
        
        } else {
            res.status(403).send('403: You have not set your profile!');
            return;
        }
    }).catch(err => {
        res.status(500).send('500: Internal server error.');
        return;
    });;
});

app.listen(process.env.PORT || port, () => console.log(`App listening on port ${port}!`));
