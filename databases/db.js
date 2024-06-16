import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb+srv://newkingdom5878:exM9HFsg7GbBE3iF@cluster0.vpvoowb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log(`Connected To MongoDB Database ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error in MongoDB: ${error}`);
  }
};

export default connectDB;
