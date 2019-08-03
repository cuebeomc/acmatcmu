const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    googleId: { type: Number },
    school: { type: String, default: '' },
    major: { type: String, default: '' },
    p_email: { type: String, default: '' },
    t_size: { type: String, default: '' },
    resume: { type: String }
});

UserSchema.method({});

UserSchema.static({});

mongoose.model('User', UserSchema);