const express = require('express')
const path = require('path')
const app = express()
const port = 3000

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/welcome.json'));
    console.log("GET to /welcome from " + req.hostname)
});

app.get('/aboutus', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/aboutus.json'))
    console.log("GET to /aboutus from " + req.hostname)
})

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/events.json'))
    console.log("GET to /events from " + req.hostname)
})

app.get('/sponsors', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/sponsors.json'))
    console.log("GET to /sponsors from " + req.hostname)
})

app.get('/contactus', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/contactus.json'))
    console.log("GET to /contactus from " + req.hostname)
})
// Not supported for now; release mid-August
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/dummy_register.json'));
    console.log("GET to /register from " + req.hostname)
});

app.listen(process.env.PORT || port, () => console.log(`App listening on port ${port}!`))