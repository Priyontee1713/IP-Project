const mongoose = require('mongoose');

const quizOptionSchema = new mongoose.Schema({
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestions', required: true },
  option_text: { type: String, required: true },
  is_correct: { type: Boolean, required: true },
});

const QuizOption = mongoose.model('QuizOption', quizOptionSchema);
module.exports = QuizOption;
