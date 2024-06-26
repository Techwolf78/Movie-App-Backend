import express from "express";
import path from "path";
import cors from "cors";
import connectDB from "./databases/db.js";
import userRoutes from "./routes/userRoute.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import nodemailer from "nodemailer";

dotenv.config();

connectDB();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const app = express();

app.use(express.json());

// Configure CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://movie-app-self-five.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    optionsSuccessStatus: 200,
    credentials: true, // Enable credentials
  })
);

// Handle preflight requests for /api/v1/auth routes
app.options("/api/v1/auth/*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.send();
});

app.use("/api/v1/auth", userRoutes);

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send({ error: error.message });
  }
});

app.post("/confirm-booking", async (req, res) => {
  const { email, bookingDetails } = req.body;

  if (!email || !bookingDetails) {
    return res
      .status(400)
      .send({ error: "Email and booking details are required" });
  }

  if (
    !bookingDetails.selectedMovie ||
    !bookingDetails.selectedScreen ||
    !bookingDetails.selectedShowtime ||
    !bookingDetails.selectedSeats ||
    !bookingDetails.totalPrice
  ) {
    return res.status(400).send({ error: "Incomplete booking details" });
  }

  try {
    await sendConfirmationEmail(email, bookingDetails);

    res.status(200).send({ message: "Booking confirmed and email sent" });
  } catch (error) {
    console.error("Error confirming booking:", error);
    res.status(500).send({ error: error.message });
  }
});

async function sendConfirmationEmail(email, bookingDetails) {
  if (
    !bookingDetails ||
    !bookingDetails.selectedMovie ||
    !bookingDetails.selectedScreen ||
    !bookingDetails.selectedShowtime ||
    !bookingDetails.selectedSeats ||
    !bookingDetails.totalPrice
  ) {
    throw new Error("Incomplete booking details");
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Booking Confirmation",
      text: `Thank you for your booking! Here are the details: 
        Movie Name: ${bookingDetails.selectedMovie}
        Screen Name: ${bookingDetails.selectedScreen}
        Showtime: ${bookingDetails.selectedShowtime}
        Selected Seat Number: ${bookingDetails.selectedSeats.join(", ")}
        Total Price: ₹${bookingDetails.totalPrice}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

app.use(express.static(path.join(process.cwd(), "client", "build")));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
