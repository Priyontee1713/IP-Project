const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema({
  attempt_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempts', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestions', required: true },
  option_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizOptions', required: true },
  answer_text: { type: String },
  is_correct: { type: Boolean, required: true },
});

const UserAnswer = mongoose.model('UserAnswer', userAnswerSchema);
module.exports = UserAnswer;
