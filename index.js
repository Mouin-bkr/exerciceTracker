require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// In-memory data store
let users = []; // Array to store users

app.use(cors());
app.use(express.urlencoded({ extended: true })); // For handling form data
app.use(express.json());

// Serve static files
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// POST request to create a new user
app.post("/api/users", (req, res) => {
  const username = req.body.username;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const user = {
    username: username,
    _id: new Date().getTime().toString(), // Unique ID based on timestamp
    exercises: [], // Initialize exercises as an empty array
  };

  users.push(user); // Add user to the in-memory array
  res.json(user); // Return the user object
});

// GET request to list all users
app.get("/api/users", (req, res) => {
  const userList = users.map((user) => ({
    username: user.username,
    _id: user._id,
  }));
  res.json(userList); // Return the array of users
});

// POST request to add an exercise to a user
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  // Check if description and duration are provided
  if (!description || !duration) {
    return res
      .status(400)
      .json({ error: "Description and duration are required" });
  }

  // Create a new exercise object
  const exercise = {
    description: description.trim(), // Ensure description is a string
    duration: Number(duration), // Ensure duration is a number
    date: date || new Date().toDateString(), // Default to current date if no date provided
  };

  // Find the user by ID and add the exercise
  const user = users.find((u) => u._id === userId);
  if (user) {
    // Add the new exercise to the user's exercises array
    user.exercises.push(exercise);

    // Return the updated user object with the added exercise
    res.json({
      username: user.username,
      _id: user._id,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    });
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

    let filteredLogs = user.exercises;

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
      log: filteredLogs.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toString(), // Ensure the date is in string format
      })), // Ensure the log is an array of objects with description, duration, and date
    });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Start the server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
