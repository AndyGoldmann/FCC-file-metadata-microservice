const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.MONGODB_DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true });
