const asyncHandler = require('express-async-handler');
const Subject = require('../models/Subjects');
const User = require('../models/Users'); // Import your User model (for user validation)
const { v4: uuidv4 } = require('uuid'); // Import uuid

// Placeholder User ID for when authentication is bypassed.
// IMPORTANT: In a real application, you would ensure a proper user session.
// For development/testing without auth, you can use a fixed ID.
// Ideally, this should be an actual User._id from your database,
// or you can create a dummy user in your database and use its ID here.
// For now, I'm using a generic placeholder. You might need to adjust this.
const DEFAULT_USER_ID = '60d5ec49f1b7c2001c1f5e8b'; // Replace with a valid ObjectId from your DB if you have one

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (temporarily open for testing)
const createSubject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Please add a subject name');
    }

    // Determine the user ID to associate with the subject
    // If req.user exists (meaning auth is active), use its ID.
    // Otherwise, use the DEFAULT_USER_ID for unauthenticated access.
    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID;

    // Generate a unique subject_id using uuid
    const newSubjectId = uuidv4();

    const subject = new Subject({
        subject_id: newSubjectId, // Assign the unique ID here
        name,
        description, // Ensure your Subject model can accept a description if provided
        user: userIdToUse, // Associate the subject with a user
        topics: [] // Initialize with an empty topics array
    });

    const createdSubject = await subject.save();
    res.status(201).json(createdSubject);
});

// @desc    Get all subjects for a user
// @route   GET /api/subjects
// @access  Private (temporarily open for testing)
const getSubjects = asyncHandler(async (req, res) => {
    // Determine the user ID to filter subjects by
    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID;

    const subjects = await Subject.find({ user: userIdToUse }); // Filter by user
    res.status(200).json(subjects);
});

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private (temporarily open for testing)
const updateSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const subject = await Subject.findById(id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    // Ensure the user modifying the subject is the owner (or the default user if auth bypassed)
    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID;
    if (subject.user.toString() !== userIdToUse) {
        res.status(401);
        throw new Error('Not authorized to update this subject');
    }

    subject.name = name || subject.name;
    subject.description = description || subject.description; // Update description if available

    const updatedSubject = await subject.save();
    res.status(200).json(updatedSubject);
});

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private (temporarily open for testing)
const deleteSubject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subject = await Subject.findById(id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    // Ensure the user deleting the subject is the owner (or the default user if auth bypassed)
    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID;
    if (subject.user.toString() !== userIdToUse) {
        res.status(401);
        throw new Error('Not authorized to delete this subject');
    }

    // Optionally, also delete all daily revisions associated with this subject (if you have them)
    // You'll need to import DailyRevision model if you uncomment this
    // const DailyRevision = require('../models/DailyRevisions');
    // await DailyRevision.deleteMany({ subject: id, user: userIdToUse });

    await subject.deleteOne(); // Use deleteOne() for Mongoose 6+
    res.status(200).json({ message: 'Subject deleted successfully' });
});

// @desc    Add a topic to a subject
// @route   POST /api/subjects/:id/topics
// @access  Private (temporarily open for testing)
const addTopic = asyncHandler(async (req, res) => {
    const { id } = req.params; // Subject ID
    const { name } = req.body; // Topic name

    if (!name) {
        res.status(400);
        throw new Error('Please provide a topic name');
    }

    const subject = await Subject.findById(id);
    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID;
    if (subject.user.toString() !== userIdToUse) {
        res.status(401);
        throw new Error('Not authorized to add topic to this subject');
    }

    // Mongoose automatically adds an _id to subdocuments when pushed
    subject.topics.push({ name, completed: false });
    await subject.save();

    // Return the newly added topic (which will have an _id from MongoDB)
    res.status(201).json(subject.topics[subject.topics.length - 1]);
});

// @desc    Update topic completion status within a subject
// @route   PATCH /api/subjects/:subjectId/topics/:topicId
// @access  Private (temporarily open for testing)
const updateTopicCompletion = asyncHandler(async (req, res) => {
    const { subjectId, topicId } = req.params;
    const { completed } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID;
    if (subject.user.toString() !== userIdToUse) {
        res.status(401);
        throw new Error('Not authorized to update topic in this subject');
    }

    // Find the specific topic within the subject's topics array
    const topic = subject.topics.id(topicId); // Mongoose provides .id() for subdocuments
    if (!topic) {
        res.status(404);
        throw new Error('Topic not found within subject');
    }

    topic.completed = completed;
    await subject.save();

    res.status(200).json(topic);
});

module.exports = {
    createSubject,
    getSubjects,
    updateSubject,
    deleteSubject,
    addTopic,
    updateTopicCompletion,
};