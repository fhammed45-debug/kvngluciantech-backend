const express = require('express');
const router = express.Router();

// Add your subscription routes here
router.get('/', (req, res) => {
  res.json({ message: 'Subscription routes' });
});

// Example routes
router.post('/', (req, res) => {
  res.json({ message: 'Create subscription' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get subscription ${req.params.id}` });
});

module.exports = router;