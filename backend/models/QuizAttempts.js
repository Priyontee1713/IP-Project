const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quizzes', required: true },
  score: { type: Number, required: true },
  attempt_date: { type: Date, required: true },
});

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
module.exports = QuizAttempt;
