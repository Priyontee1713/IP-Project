const mongoose = require('mongoose');

// Define the schema for the quiz questions
const quizQuestionSchema = new mongoose.Schema({
  question_id: { 
    type: Number, 
    required: true, 
    unique: true  // Make sure the question_id is unique across questions
  },  // Unique identifier for the question

  quiz_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quizzes', 
    required: true 
  },  // Foreign key referencing the Quiz the question belongs to

  question_text: { 
    type: String, 
    required: true 
  },  // The actual text of the question
  
  note_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Notes' 
  },  // Foreign key referencing Notes (nullable)
  
  flashcard_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Flashcards' 
  },  // Foreign key referencing Flashcards (nullable)
}, { timestamps: true });

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
module.exports = QuizQuestion;
