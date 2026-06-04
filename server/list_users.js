const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campus-sports-connect';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB.');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('USERS_LIST:' + JSON.stringify(users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      isVerified: u.isVerified
    }))));
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
