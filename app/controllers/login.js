const path = require('path');

exports.index = function(req, res) {
    // res.render('login/index', {
    //     title: 'djsklfajksldjfklsjdlfk'
    // });
    res.sendFile(path.join(__dirname, '../views/login/index.html'));
};