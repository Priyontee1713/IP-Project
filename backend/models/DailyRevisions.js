const mongoose = require('mongoose');

const RevisionTopicSchema = new mongoose.Schema({
  topicName: String,
  timer: Number,
  completed: { type: Boolean, default: false },
});

const DailyRevisionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  revision_date: { type: String }, // Store date as YYYY-MM-DD
  revisionTopics: [RevisionTopicSchema],
});

module.exports = mongoose.model('DailyRevision', DailyRevisionSchema);
