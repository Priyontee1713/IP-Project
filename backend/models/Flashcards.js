const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);
module.exports = Flashcard;
