const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: String,
  completed: { type: Boolean, default: false },
});

const SubjectSchema = new mongoose.Schema({
  name: String,
  topics: [TopicSchema],
  deleted: { type: Boolean, default: false },
});

module.exports = mongoose.model('Subject', SubjectSchema);
