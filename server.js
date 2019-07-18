const express = require('express')
const path = require('path')
const app = express()
const port = 3000

const MongoClient = require('mongodb').MongoClient
var db

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/welcome.json'));
    console.log("GET to /welcome from " + req.hostname)
});

app.get('/aboutus', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/aboutus.json'))
    console.log("GET to /aboutus from " + req.hostname)
});

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/events.json'))
    console.log("GET to /events from " + req.hostname)
});

app.get('/sponsors', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/sponsors.json'))
    console.log("GET to /sponsors from " + req.hostname)
});

// Not supported for now; release mid-August
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/dummy_register.json'));
    console.log("GET to /register from " + req.hostname)
});

MongoClient.connect('mongodb://dev:acmdev1@ds151997.mlab.com:51997/heroku_mztvh6zg', (err, database) => {
    if (err) return console.log(err)
    db = database.db('heroku_mztvh6zg') // whatever database name is
    app.listen(process.env.PORT || port, () => console.log(`App listening on port ${port}!`))
})
