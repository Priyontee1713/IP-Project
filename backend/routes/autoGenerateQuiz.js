const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcards');
const Quiz = require('../models/Quizzes');
const QuizQuestion = require('../models/QuizQuestions');
const QuizOption = require('../models/QuizOptions');
const mongoose = require('mongoose');

// POST /api/quizzes/generate-from-flashcards/:subject_id
router.post('/generate-from-flashcards/:subject_id', async (req, res) => {
  try {
    const subjectId = req.params.subject_id;

    // 1. Fetch flashcards for the subject
    const flashcards = await Flashcard.find({ subject_id: subjectId });

    if (flashcards.length < 4) {
      return res.status(400).json({ error: 'Need at least 4 flashcards to generate quiz questions.' });
    }

    // 2. Create a new Quiz
    const newQuiz = new Quiz({
      title: `Auto-generated Quiz (${new Date().toLocaleString()})`,
      subject_id: subjectId,
    });

    await newQuiz.save();

    // 3. For each flashcard, generate a quiz question
    for (const flashcard of flashcards) {
      const question = new QuizQuestion({
        question_text: flashcard.question,
        quiz_id: newQuiz._id,
        note_id: flashcard._id,
      });
      await question.save();

      // Correct option
      const correctOption = new QuizOption({
        option_text: flashcard.answer,
        is_correct: true,
        question_id: question._id,
      });

      // Get 3 incorrect options (random flashcards, not this one)
      const incorrectFlashcards = flashcards
        .filter(f => f._id.toString() !== flashcard._id.toString())
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const incorrectOptions = incorrectFlashcards.map(f => ({
        option_text: f.answer,
        is_correct: false,
        question_id: question._id,
      }));

      // Save all options
      await QuizOption.insertMany([correctOption, ...incorrectOptions]);
    }

    res.status(201).json({ message: 'Quiz generated successfully.', quiz_id: newQuiz._id });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Server error while generating quiz.' });
  }
});

module.exports = router;
