require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// In-memory data store
let users = []; // Array to store users
let exercises = []; // Array to store exercises for each user

app.use(cors());
app.use(express.json());

// Serve static files
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// POST request to create a new user
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const user = {
    username: username,
    _id: new Date().getTime().toString(), // Unique ID based on timestamp
  };
  users.push(user); // Add user to the in-memory array
  res.json(user); // Return the user object
});

// GET request to list all users
app.get("/api/users", (req, res) => {
  res.json(users); // Return the array of users
});

// POST request to add an exercise to a user
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  const exercise = {
    description,
    duration,
    date: date || new Date().toDateString(), // Default to current date if no date provided
  };

  // Find user by ID and add the exercise
  const user = users.find((u) => u._id === userId);
  if (user) {
    // If the user exists, add exercise
    user.exercises = user.exercises || [];
    user.exercises.push(exercise);
    res.json(user); // Return user with added exercise
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// GET request to get a user's exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const user = users.find((u) => u._id === userId);

  if (user) {
    const { from, to, limit } = req.query;

    let filteredLogs = user.exercises || [];

    // Filter by 'from' date if provided
    if (from) {
      filteredLogs = filteredLogs.filter(
        (exercise) => new Date(exercise.date) >= new Date(from)
      );
    }

    // Filter by 'to' date if provided
    if (to) {
      filteredLogs = filteredLogs.filter(
        (exercise) => new Date(exercise.date) <= new Date(to)
      );
    }

    // Limit the number of logs if 'limit' is provided
    if (limit) {
      filteredLogs = filteredLogs.slice(0, parseInt(limit));
    }

    const count = filteredLogs.length;

    res.json({
      username: user.username,
      count: count,
      _id: user._id,
      log: filteredLogs,
    });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Start the server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
