const mongoose = require("mongoose");
const colors = require("colors");

/**
 * Connect to MongoDB database
 * @returns {Promise} MongoDB connection
 */
const connectDB = async () => {
  try {
    // Get connection string from environment variables
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error(
        "MongoDB connection string not found in environment variables".red.bold
      );
      process.exit(1);
    }

    // Set mongoose options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(
      `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = connectDB;
