const mongoose = require("mongoose");
const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/main';

mongoose.connect(url, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
});
