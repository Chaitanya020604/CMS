const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require('dotenv').config();
const app = express();
const bcrypt = require('bcryptjs');

// Enable CORS and parse JSON
app.use(cors());
app.use(express.json());

// Serve static files (index.html, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => console.log('❌ Error connecting to MongoDB:', error));

// Define the User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model('User', userSchema);

// Define the Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  birthday: String,
  address: String,
  photo: String,
  userEmail: String,
});

const Contact = mongoose.model('Contact', contactSchema);

// Signup Route (for users)
app.post("/signup", async (req, res, next) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, name, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Signup successful" });
  } catch (error) {
    next(error);
  }
});

// Signin Route (for users)
app.post("/signin", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    next(error);
  }
});

// Add a new contact (POST)
app.post("/addContact", async (req, res, next) => {
  try {
    const { name, phone, email, birthday, address, photo, userEmail } = req.body;

    const newContact = new Contact({
      name,
      phone,
      email,
      birthday,
      address,
      photo,
      userEmail,
    });

    await newContact.save();
    res.status(201).json({ success: true, message: "Contact added" });
  } catch (err) {
    next(err);
  }
});

// Get all contacts (GET) by user email
app.get("/contacts/:email", async (req, res, next) => {
  try {
    const email = req.params.email;
    const userContacts = await Contact.find({ userEmail: email });
    res.json({ success: true, contacts: userContacts });
  } catch (err) {
    next(err);
  }
});

// Delete contact by ID (DELETE)
app.delete("/deleteContact/:id/:email", async (req, res, next) => {
  try {
    const { id, email } = req.params;
    await Contact.findOneAndDelete({ _id: id, userEmail: email });
    res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    next(err);
  }
});

// Update contact by ID (PUT)
app.put("/updateContact/:id", async (req, res, next) => {
  const { id } = req.params;
  const { photo, name, phone, email, birthday, address } = req.body;

  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { photo, name, phone, email, birthday, address },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    res.json({ success: true, message: "Contact updated successfully", updatedContact });
  } catch (error) {
    next(error);
  }
});

// Catch 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "Duplicate entry detected" });
  }

  res.status(500).json({ success: false, message: "Internal server error" });
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
