// backend/controllers/revisionController.js

const Subject = require('../models/Subjects');
const DailyRevision = require('../models/DailyRevisions');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose'); // Make sure mongoose is imported for ObjectId

// Placeholder User ID for when authentication is bypassed.
// IMPORTANT: In a real application, you would ensure a proper user session.
// For development/testing without auth, you can use a fixed ID.
// Ideally, this should be an actual User._id from your database,
// or you can create a dummy user in your database and use its ID here.
const DEFAULT_USER_ID = new mongoose.Types.ObjectId('60d5ec49f1b7c2001c1f5e8b'); // Use a valid ObjectId string.
// If you don't have a specific dummy ID, you could generate one once and use it.
// e.g., const DEFAULT_USER_ID = new mongoose.Types.ObjectId(); console.log(DEFAULT_USER_ID.toString());

// Add or update daily revision plan for a user, date & subject
exports.addOrUpdateDailyRevision = asyncHandler(async (req, res) => {
    const { revisionDate, subject, revisionTopics } = req.body;

    if (!subject) {
        res.status(400);
        throw new Error('Please provide a subject ID for the revision plan.');
    }
    if (!revisionDate) {
        res.status(400);
        throw new Error('Please provide a revision date.');
    }
    if (!revisionTopics || !Array.isArray(revisionTopics)) {
        res.status(400);
        throw new Error('Please provide revision topics as an array.');
    }

    // Determine the user ID to associate with the revision plan
    // If req.user exists (meaning auth is active), use its ID.
    // Otherwise, use the DEFAULT_USER_ID for unauthenticated access.
    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID;

    // Convert revisionDate to a Date object, ensuring it's at the start of the day for consistent querying
    const startOfDay = new Date(revisionDate);
    startOfDay.setHours(0, 0, 0, 0);

    let dailyRevision = await DailyRevision.findOne({
        user: userIdToUse,
        subject: subject,
        revisionDate: startOfDay,
    });

    if (dailyRevision) {
        // Update existing entry
        dailyRevision.revisionTopics = revisionTopics;
        dailyRevision.updatedAt = Date.now(); // Manually update if timestamps not enabled or for clarity
    } else {
        // Create new entry
        dailyRevision = new DailyRevision({
            user: userIdToUse,
            revisionDate: startOfDay,
            subject,
            revisionTopics,
        });
    }

    const savedRevision = await dailyRevision.save();
    res.status(200).json(savedRevision); // Return 200 for update, 201 for create if preferred (check dailyRevision._id for new)
});

// @desc    Get daily revisions for a user, optionally by subjectId and date
// @route   GET /api/revision/dailyRevisions
// @access  Private (temporarily open for testing)
exports.getDailyRevisions = asyncHandler(async (req, res) => {
    const { subjectId, date } = req.query; // Expect subjectId and date as query parameters
    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID; // Use DEFAULT_USER_ID if no authenticated user

    const query = { user: userIdToUse };
    if (subjectId) {
        query.subject = subjectId;
    }
    if (date) {
        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0); // Start of the day
        const nextDay = new Date(queryDate);
        nextDay.setDate(queryDate.getDate() + 1); // Start of the next day

        query.revisionDate = {
            $gte: queryDate,
            $lt: nextDay,
        };
    }

    const dailyRevisions = await DailyRevision.find(query)
                                             .populate('subject'); // Populate the subject details

    res.status(200).json(dailyRevisions);
});


// @desc    Mark a topic complete within a daily revision
// @route   PUT /api/revision/dailyRevisions/:dailyRevisionId/topics/:topicId
// @access  Private (temporarily open for testing)
exports.markTopicComplete = asyncHandler(async (req, res) => {
    const { dailyRevisionId, topicId } = req.params;
    const { completed } = req.body; // Expect 'completed: true/false' in body

    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID; // Use DEFAULT_USER_ID if no authenticated user

    const dailyRevision = await DailyRevision.findOne({ _id: dailyRevisionId, user: userIdToUse });

    if (!dailyRevision) {
        res.status(404);
        throw new Error('Daily revision not found or not authorized');
    }

    const topic = dailyRevision.revisionTopics.id(topicId); // Find subdocument by its _id

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found in this daily revision');
    }

    topic.completed = completed;
    if (completed) {
        topic.completedAt = new Date();
    } else {
        topic.completedAt = undefined; // Clear timestamp if uncompleting
    }

    await dailyRevision.save();
    res.status(200).json(topic); // Return the updated topic
});


// @desc    Delete a daily revision plan
// @route   DELETE /api/revision/dailyRevisions/:id
// @access  Private (temporarily open for testing)
exports.deleteDailyRevision = asyncHandler(async (req, res) => { // <--- WRAPPED IN ASYNCHANDLER
    const { id } = req.params;
    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID; // Use DEFAULT_USER_ID if no authenticated user

    const dailyRevision = await DailyRevision.findOne({ _id: id, user: userIdToUse });
    if (!dailyRevision) {
        res.status(404);
        throw new Error('Daily revision not found or not authorized');
    }

    await dailyRevision.deleteOne(); // Use deleteOne() for Mongoose 6+
    res.json({ message: 'Daily revision deleted successfully' });
});

// Delete a subject (this might be redundant if you have subjectController handling this)
// Keeping it for now as per the previous iteration, but subjectController is more appropriate
exports.deleteSubject = asyncHandler(async (req, res) => { // <--- WRAPPED IN ASYNCHANDLER
    const { id } = req.params;
    const userIdToUse = req.user ? req.user.id : DEFAULT_USER_ID; // Use DEFAULT_USER_ID if no authenticated user

    const subject = await Subject.findOne({ _id: id, user: userIdToUse });
    if (!subject) {
        res.status(404);
        throw new Error('Subject not found or not authorized');
    }

    // Optionally, also delete all daily revisions associated with this subject
    await DailyRevision.deleteMany({ subject: id, user: userIdToUse });

    await subject.deleteOne(); // Use deleteOne() for Mongoose 6+
    res.json({ message: 'Subject deleted successfully' });
});
