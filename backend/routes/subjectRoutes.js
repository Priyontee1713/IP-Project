const express = require('express');
const router = express.Router();
const Subject = require('../models/Subjects');
const DailyRevision = require('../models/DailyRevisions');

// GET all subjects
router.get('/', async (req, res) => {
  const subjects = await Subject.find();
  res.json(subjects);
});

// POST new subject (adds in both collections)
router.post('/', async (req, res) => {
  const { name } = req.body;
  const newSubject = new Subject({ name, topics: [] });
  const savedSubject = await newSubject.save();

  const today = new Date().toISOString().split('T')[0];
  await DailyRevision.create({
    subject: savedSubject._id,
    revision_date: today,
    revisionTopics: [],
  });

  res.status(201).json(savedSubject);
});

// DELETE subject
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  //await Subject.findByIdAndDelete(id);
  //await DailyRevision.deleteMany({ subject: id });
  res.status(204).send();
});

// POST topic under subject
router.post('/:id/topics', async (req, res) => {
  const subjectId = req.params.id;
  const { name, timer } = req.body;

  if (!name || !timer) {
    return res.status(400).json({ message: "Name and timer are required." });
  }

  const subject = await Subject.findById(subjectId);
  const newTopic = { name, completed: false };
  subject.topics.push(newTopic);
  await subject.save();

  // Also add to today's DailyRevision
  const today = new Date().toISOString().split('T')[0];
  const dailyRevision = await DailyRevision.findOne({ subject: subjectId, revision_date: today });

  if (dailyRevision) {
    dailyRevision.revisionTopics.push({
      topicName: name,
      timer: timer,
      completed: false,
    });
    await dailyRevision.save();
  }

  res.status(201).json(subject.topics[subject.topics.length - 1]);
});

// PATCH topic completion
router.patch('/:subjectId/topics/:topicId', async (req, res) => {
  const { subjectId, topicId } = req.params;
  const { completed } = req.body;
  const subject = await Subject.findById(subjectId);
  const topic = subject.topics.id(topicId);
  topic.completed = completed;
  await subject.save();
  res.json(topic);
});

module.exports = router;
