const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  topic: { type: String, required: true },
  session_date: { type: Date, required: true },
});

const StudySession = mongoose.model('StudySession', studySessionSchema);
module.exports = StudySession;
