const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const app = express();

// Enable CORS and parse JSON
app.use(cors());
app.use(express.json());

// Serve static files (index.html, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose
  .connect('mongodb://127.0.0.1:27017/cmsDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
  userEmail: String, // this will link the contact to the user
});

// Create the Contact model based on the schema
const Contact = mongoose.model('Contact', contactSchema);

module.exports = mongoose.model("Contact", contactSchema);

// ✅ Add this route to fix "Cannot GET /"
// In your backend code (server.js or app.js)
app.get("/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find();  // Fetch all contacts from MongoDB
    res.json({ contacts }); // Send the contacts as a JSON response
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});


// Signup Route (for users)
app.post("/signup", async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const newUser = new User({ email, name, password });
    await newUser.save();

    res.json({ success: true, message: "Signup successful" });
  } catch (error) {
    console.error("Signup error:", error);
    res.json({ success: false, message: "Signup failed. Try again." });
  }
});

// Signin Route (for users)
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Signin error:", error);
    res.json({ success: false, message: "Signin failed. Try again." });
  }
});

// Add a new contact (POST)
app.post("/addContact", async (req, res) => {
  try {
    const { name, phone, email, birthday, address, photo, userEmail } = req.body;

    const newContact = new Contact({
      name,
      phone,
      email,
      birthday,
      address,
      photo,
      userEmail, // associate with the logged-in user
    });

    await newContact.save();
    res.json({ success: true, message: "Contact added" });
  } catch (err) {
    console.error("Error adding contact:", err);
    res.status(500).json({ success: false, message: "Failed to add contact" });
  }
});



// Get all contacts (GET)
app.get("/contacts/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const userContacts = await Contact.find({ userEmail: email });
    res.json({ success: true, contacts: userContacts });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ success: false, message: "Error fetching contacts" });
  }
});


// Delete contact by ID (DELETE)
app.delete("/deleteContact/:id/:email", async (req, res) => {
  try {
    const { id, email } = req.params;

    // Only delete if the contact belongs to the user
    await Contact.findOneAndDelete({ _id: id, userEmail: email });

    res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Failed to delete contact" });
  }
});



// Update contact by ID (PUT)
app.put("/updateContact/:id", async (req, res) => {
  const { id } = req.params;
  const { photo, name, phone, email, birthday, address } = req.body;

  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { photo, name, phone, email, birthday, address },
      { new: true }
    );

    if (!updatedContact) {
      return res.json({ success: false, message: "Contact not found" });
    }

    res.json({ success: true, message: "Contact updated successfully", updatedContact });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.json({ success: false, message: "Failed to update contact" });
  }
});

// Start the server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
