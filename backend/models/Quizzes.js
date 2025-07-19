const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  option_text: { type: String, required: true },
  is_correct: { type: Boolean, required: true },
});

const questionSchema = new mongoose.Schema({
  question_text: { type: String, required: true },
  options: [optionSchema],
  note_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Notes' },
  flashcard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Flashcards' },
});

const quizSchema = new mongoose.Schema({
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: [questionSchema],
});

const Quiz = mongoose.model('Quizzes', quizSchema);
module.exports = Quiz;
