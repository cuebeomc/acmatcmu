const express = require('express')
const path = require('path')
const app = express()
const port = 3000

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/welcome.json'));
    console.log("GET to /welcome from " + req.hostname)
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'schemas/register.json'));
    console.log("GET to /register from " + req.hostname)
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))