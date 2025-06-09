const express = require('express');
const router = express.Router();

console.log("tasks.js route file loaded explicitly again!");

router.get('/', (req, res) => {
  console.log("Received explicit GET request on /api/tasks");
  res.json([
    { id: 1, task: "Complete Benefit Enrollment" },
    { id: 2, task: "Attend Welcome Meeting" },
    { id: 3, task: "Sign into Entrata" },
    { id: 4, task: "Complete leasing training module" },
    { id: 5, task: "Tour your community property" }
  ]);
});

module.exports = router;
