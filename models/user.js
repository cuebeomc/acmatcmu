var mongoose = require('mongoose')

module.exports = mongoose.model('User', {
    first_name: String,
    last_name: String,
    email: String,
    school: String,
    major: String,
    p_email: String,
    t_size: String,
    resume: BSON
})