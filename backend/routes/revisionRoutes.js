const express = require('express');
const router = express.Router();
const DailyRevision = require('../models/DailyRevisions');

// GET today's revisions for subject
router.get('/dailyRevisions/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  const { date } = req.query;

  const revisions = await DailyRevision.find({
    subject: subjectId,
    revision_date: date,
  });
  res.json(revisions);
});

// PATCH revision topic completion
router.patch('/dailyRevisions/:subjectId/topics/:topicId', async (req, res) => {
  const { subjectId, topicId } = req.params;
  const { completed } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const revision = await DailyRevision.findOne({
    subject: subjectId,
    revision_date: today,
  });

  if (!revision) return res.status(404).json({ message: "Revision not found" });

  const topic = revision.revisionTopics.id(topicId);
  topic.completed = completed;
  await revision.save();
  res.json(topic);
});

module.exports = router;
