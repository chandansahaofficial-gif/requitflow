const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all audiences for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const audiences = await prisma.targetAudience.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(audiences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch audiences' });
  }
});

// Create audience
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, industry, location, keywords, painPoints } = req.body;
    const audience = await prisma.targetAudience.create({
      data: {
        userId: req.user.userId,
        name,
        industry: industry || null,
        location: location || null,
        keywords: keywords || null,
        painPoints: painPoints || null
      }
    });
    res.json(audience);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create audience' });
  }
});

// Delete audience
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const audience = await prisma.targetAudience.findUnique({ where: { id: req.params.id } });
    if (!audience || audience.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Audience not found' });
    }
    await prisma.targetAudience.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete audience' });
  }
});

module.exports = router;
