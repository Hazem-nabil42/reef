const mongoose = require('mongoose');
const connect = mongoose.connect('mongodb+srv://reefdb:Hilal2002@12@cluster0.0ompfxv.mongodb.net/');

connect.then(()  => {
    console.log("Database connected successfully");
})
.catch((err) => {
    console.log(`Error: ${err}`);
});

const Loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

const collection = new mongoose.model('user', Loginschema);

module.exports = collection;
