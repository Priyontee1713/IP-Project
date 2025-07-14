// revision_planner.js

document.addEventListener('DOMContentLoaded', () => {
    // --- API Calls ---
    // Make sure this URL matches your backend server's address (e.g., http://localhost:5000/api)
    const API_BASE_URL = 'http://localhost:5000/api';

    const subjectListContainer = document.getElementById('subject-list-container');
    const addSubjectButton = document.getElementById('add-subject-button');
    const defaultRightContent = document.getElementById('default-right-content');
    const activeSubjectControls = document.getElementById('active-subject-controls');
    const currentDateDisplay = document.getElementById('current-date-display');

    // References to dynamic elements within activeSubjectControls (MUST MATCH HTML IDs)
    const activeSubjectNameElement = document.getElementById('active-subject-name');
    const topicListElement = document.getElementById('topic-list');
    const noTopicsMessage = document.getElementById('no-topics-message');
    const addTopicInput = document.getElementById('add-topic-input');
    const addTopicButton = document.getElementById('add-topic-button');
    const timeDisplayElement = document.getElementById('time-display');
    const startTimerButton = document.getElementById('start-timer-button');
    const pauseTimerButton = document.getElementById('pause-timer-button');
    const resetTimerButton = document.getElementById('reset-timer-button');
    const setTimerButtons = document.querySelectorAll('.set-timer-button');
    const dailyRevisionList = document.getElementById('daily-revision-list');
    const noDailyRevisionsMessage = document.getElementById('no-daily-revisions-message');
    const customTimerMinutesInput = document.getElementById('custom-timer-minutes'); // New
    const setCustomTimerButton = document.getElementById('set-custom-timer-button'); // New


    let currentTimerInterval;
    let timeRemaining = 0;
    let isTimerRunning = false;
    let currentActiveSubjectId = null; // To track which subject is active

    // Data structure: An array of subject objects
    let subjects = [];

    // --- Initialization ---
    loadSubjects();
    displayCurrentDate(); // Call function to display the current date
    showDefaultRightContent(); // Ensure default content is visible on load

    async function apiCall(method, url, data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            if (data) {
                options.body = JSON.stringify(data);
            }
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            // Handle 204 No Content for DELETE operations
            if (response.status === 204) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`API Call Error (${method} ${url}):`, error);
            alert(`Error: ${error.message}`);
            throw error; // Re-throw to propagate the error
        }
    }


    // --- Subject Functions ---

    async function loadSubjects() {
        try {
            const fetchedSubjects = await apiCall('GET', `${API_BASE_URL}/subjects`);
            subjects = fetchedSubjects || []; // Ensure subjects is an array
            renderSubjects(); // Re-render subjects after loading
        } catch (error) {
            console.error('Failed to load subjects:', error);
        }
    }

    function renderSubjects() {
        if (!subjectListContainer) {
            console.error('subjectListContainer element not found.');
            return;
        }
        subjectListContainer.innerHTML = ''; // Clear current list
        if (subjects.length === 0) {
            subjectListContainer.innerHTML = '<p>No subjects yet. Add one!</p>';
            return;
        }
        subjects.forEach(subject => {
            const subjectItem = document.createElement('div');
            subjectItem.className = 'subject-item';
            subjectItem.dataset.id = subject._id; // Use _id from MongoDB
            subjectItem.innerHTML = `
                <span class="subject-name">${subject.name}</span>
                <button class="delete-subject-btn"><i class="fas fa-trash-alt"></i></button>
            `;
            subjectListContainer.appendChild(subjectItem);
        });
    }

    async function addSubject() {
        const subjectName = prompt('Enter new subject name:');
        if (subjectName && subjectName.trim() !== '') {
            try {
                const newSubject = await apiCall('POST', `${API_BASE_URL}/subjects`, { name: subjectName.trim() });
                if (newSubject) {
                    subjects.push(newSubject);
                    renderSubjects();
                }
            } catch (error) {
                console.error('Failed to add subject:', error);
            }
        }
    }

    async function deleteSubject(subjectId) {
        if (confirm('Are you sure you want to delete this subject and all its topics/revisions?')) {
            try {
                await apiCall('DELETE', `${API_BASE_URL}/subjects/${subjectId}`);
                subjects = subjects.filter(subject => subject._id !== subjectId);
                renderSubjects(); // Re-render the list
                // If the deleted subject was the active one, show default content
                if (currentActiveSubjectId === subjectId) {
                    showDefaultRightContent();
                    currentActiveSubjectId = null;
                }
            } catch (error) {
                console.error('Failed to delete subject:', error);
            }
        }
    }

    async function activateSubject(subjectId) {
        currentActiveSubjectId = subjectId;
        const activeSubject = subjects.find(s => s._id === subjectId);

        if (activeSubject) {
            if (activeSubjectNameElement) { // Null check
                activeSubjectNameElement.textContent = activeSubject.name;
            }
            renderTopicList(activeSubject.topics); // Ensure topic list is rendered
            showActiveSubjectControls();
            // Load and render daily revision plan for the active subject
            await loadAndRenderDailyRevisionPlan(subjectId);
        }
    }

    // Controls the visibility of the default content and active subject controls
    // using the 'move-up' and 'show-controls' classes defined in revision_planner.css.
    function showDefaultRightContent() {
        if (defaultRightContent) { // Null check
            defaultRightContent.classList.remove('move-up');
        }
        if (activeSubjectControls) { // Null check
            activeSubjectControls.classList.remove('show-controls');
        }

        // Clear dynamic content from active controls when switching back to default
        if (activeSubjectNameElement) { // Null check for the problematic element
            activeSubjectNameElement.textContent = '';
        }
        if (topicListElement) { // Null check
            topicListElement.innerHTML = '';
        }
        if (addTopicInput) { // Null check
            addTopicInput.value = '';
        }
        if (timeDisplayElement) { // Null check
            timeDisplayElement.textContent = '00:00';
        }
        clearInterval(currentTimerInterval);
        isTimerRunning = false;
        if (dailyRevisionList) { // Null check
            dailyRevisionList.innerHTML = '';
        }
        if (noTopicsMessage) { // Null check
            noTopicsMessage.style.display = 'none';
        }
        if (noDailyRevisionsMessage) { // Null check
            noDailyRevisionsMessage.style.display = 'none';
        }
    }

    // Controls the visibility of the active subject controls and default content
    // using the 'move-up' and 'show-controls' classes defined in revision_planner.css.
    function showActiveSubjectControls() {
        if (defaultRightContent) { // Null check
            defaultRightContent.classList.add('move-up');
        }
        if (activeSubjectControls) { // Null check
            activeSubjectControls.classList.add('show-controls');
        }
    }

    // --- Topic Functions ---

    function renderTopicList(topics) {
        if (!topicListElement) {
            console.error('topicListElement element not found.');
            return;
        }
        topicListElement.innerHTML = ''; // Clear current topics
        const incompleteTopics = topics.filter(topic => !topic.completed);

        if (incompleteTopics.length === 0) {
            if (noTopicsMessage) { // Null check
                noTopicsMessage.style.display = 'block';
            }
            return;
        } else {
            if (noTopicsMessage) { // Null check
                noTopicsMessage.style.display = 'none';
            }
        }

        incompleteTopics.forEach(topic => {
            const topicItem = document.createElement('li');
            topicItem.className = 'topic-item';
            topicItem.dataset.topicId = topic._id; // Use _id for topics
            topicItem.dataset.subjectId = currentActiveSubjectId; // Add subjectId for easy access
            topicItem.innerHTML = `
                <input type="checkbox" id="topic-checkbox-${topic._id}" ${topic.completed ? 'checked' : ''}>
                <label for="topic-checkbox-${topic._id}">${topic.name}</label>
            `;
            topicListElement.appendChild(topicItem);
        });
    }

    async function addTopic(subjectId, topicName) {
        if (topicName && topicName.trim() !== '') {
            const timer = 1; // Default timer in minutes as per user request to not show prompt

            try {
                // API returns the newly added topic object which includes its _id
                const newTopic = await apiCall('POST', `${API_BASE_URL}/subjects/${subjectId}/topics`, { name: topicName.trim(), timer: timer });
                if (newTopic) {
                    const activeSubject = subjects.find(s => s._id === subjectId);
                    if (activeSubject) {
                        // Ensure activeSubject.topics is initialized
                        if (!activeSubject.topics) activeSubject.topics = [];
                        activeSubject.topics.push(newTopic); // Add the new topic to the local subject data
                        renderTopicList(activeSubject.topics); // Re-render topics for the active subject
                        if (addTopicInput) { // Null check
                            addTopicInput.value = ''; // Clear input field
                        }
                        // Removed: await loadAndRenderDailyRevisionPlan(subjectId);
                        // This prevents the new topic from immediately showing in the daily revision plan.
                        // It will still be saved to the daily revision in the backend.
                    }
                }
            } catch (error) {
                console.error('Failed to add topic:', error);
            }
        } else {
            alert('Topic name cannot be empty.');
        }
    }

    async function markTopicComplete(subjectId, topicId, isCompleted) {
        try {
            await apiCall('PATCH', `${API_BASE_URL}/subjects/${subjectId}/topics/${topicId}`, { completed: isCompleted });

            // Update local data
            const activeSubject = subjects.find(s => s._id === subjectId);
            if (activeSubject) {
                const topic = activeSubject.topics.find(t => t._id === topicId);
                if (topic) {
                    topic.completed = isCompleted;
                    // For visual effect, remove completed topic after a short delay
                    if (isCompleted) {
                        if (topicListElement) { // Null check for parent before querying children
                            const topicItemElement = topicListElement.querySelector(`[data-topic-id="${topicId}"]`);
                            if (topicItemElement) {
                                topicItemElement.classList.add('completed-topic'); // Add class for CSS transition
                                // Wait for the transition to finish before actually removing it
                                topicItemElement.addEventListener('transitionend', function handler() {
                                    topicItemElement.removeEventListener('transitionend', handler);
                                    if(topicItemElement.parentNode) topicItemElement.remove();
                                    updateNoTopicsMessage(activeSubject.topics); // Update message after actual DOM removal
                                });
                            }
                        }
                    } else {
                        // If unchecked, immediately re-render the list to show it again
                        renderTopicList(activeSubject.topics);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to update topic completion:', error);
        }
    }

    function updateNoTopicsMessage(topics) {
        const incompleteTopics = topics.filter(t => !t.completed);
        if (incompleteTopics.length === 0) {
            if (noTopicsMessage) { // Null check
                noTopicsMessage.style.display = 'block';
            }
        } else {
            if (noTopicsMessage) { // Null check
                noTopicsMessage.style.display = 'none';
            }
        }
    }


    // --- Timer Functions ---

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        if (timeDisplayElement) { // Null check
            timeDisplayElement.textContent = formatTime(timeRemaining);
        }
    }

    function startTimer() {
        if (!isTimerRunning && timeRemaining > 0) {
            isTimerRunning = true;
            currentTimerInterval = setInterval(() => {
                if (timeRemaining > 0) {
                    timeRemaining--;
                    updateTimerDisplay();
                } else {
                    clearInterval(currentTimerInterval);
                    isTimerRunning = false;
                    alert('Time is up!');
                    // Optionally play a sound
                }
            }, 1000);
        } else if (timeRemaining === 0) {
            alert('Set a timer duration first!');
        }
    }

    function pauseTimer() {
        clearInterval(currentTimerInterval);
        isTimerRunning = false;
    }

    function resetTimer() {
        clearInterval(currentTimerInterval);
        isTimerRunning = false;
        timeRemaining = 0;
        updateTimerDisplay();
    }

    function setTimer(seconds) {
        if (isTimerRunning) {
            clearInterval(currentTimerInterval);
        }
        timeRemaining = seconds;
        isTimerRunning = false;
        updateTimerDisplay();
    }

    // --- Daily Revision Plan Functions ---

    async function loadAndRenderDailyRevisionPlan(subjectId) {
        try {
            const today = new Date().toISOString().split('T')[0]; //YYYY-MM-DD
            const dailyRevisions = await apiCall('GET', `${API_BASE_URL}/revision/dailyRevisions/${subjectId}?date=${today}`);
            renderDailyRevisionPlan(dailyRevisions);
        } catch (error) {
            console.error('Failed to load daily revision plan:', error);
            // Even if an error, ensure UI state is correct
            renderDailyRevisionPlan([]); // Render empty to clear previous or show no plan message
        }
    }

    function renderDailyRevisionPlan(revisions) {
        if (!dailyRevisionList) {
            console.error('dailyRevisionList element not found.');
            return;
        }
        dailyRevisionList.innerHTML = ''; // Clear current plan
        if (!revisions || revisions.length === 0 || revisions.every(r => !r.revisionTopics || r.revisionTopics.length === 0)) {
            if (noDailyRevisionsMessage) { // Null check
                noDailyRevisionsMessage.style.display = 'block';
            }
            return;
        } else {
            if (noDailyRevisionsMessage) { // Null check
                noDailyRevisionsMessage.style.display = 'none';
            }
        }

        revisions.forEach(revision => {
            if (revision.revisionTopics && revision.revisionTopics.length > 0) {
                // Filter to show only incomplete daily revision topics
                const incompleteDailyTopics = revision.revisionTopics.filter(topic => !topic.completed);

                if (incompleteDailyTopics.length === 0) {
                    // This section will only hide the message if there are NO incomplete topics, even after filtering.
                    // This is for the overall state of the daily revision section.
                } else {
                    if (noDailyRevisionsMessage) { // Null check
                        noDailyRevisionsMessage.style.display = 'none';
                    }
                }

                incompleteDailyTopics.forEach(topic => {
                    const listItem = document.createElement('li');
                    listItem.className = 'daily-revision-item';
                    // The topic in dailyRevisions API response should have _id
                    listItem.dataset.topicId = topic._id;
                    listItem.dataset.subjectId = revision.subject; // Store subject ID
                    listItem.innerHTML = `
                        <input type="checkbox" id="daily-revision-topic-${topic._id}" ${topic.completed ? 'checked' : ''}>
                        <label for="daily-revision-topic-${topic._id}">${topic.topicName} - ${topic.timer} min</label>
                        <span class="daily-revision-status">${topic.completed ? '(Completed)' : '(Pending)'}</span>
                    `;
                    dailyRevisionList.appendChild(listItem);
                });
            }
        });

        // After all topics are potentially added, re-check if the list is truly empty
        if (dailyRevisionList.children.length === 0) {
            if (noDailyRevisionsMessage) {
                noDailyRevisionsMessage.style.display = 'block';
            }
        }
    }

    async function markDailyRevisionTopicComplete(subjectId, topicId, isCompleted) {
        try {
            await apiCall('PATCH', `${API_BASE_URL}/revision/dailyRevisions/${subjectId}/topics/${topicId}`, { completed: isCompleted });

            // After successful API call, re-load and re-render the daily revision plan
            await loadAndRenderDailyRevisionPlan(subjectId);
        } catch (error) {
            console.error('Failed to update daily revision topic completion:', error);
        }
    }

    // --- Date Display ---
    function displayCurrentDate() {
        if (currentDateDisplay) { // Null check
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentDateDisplay.textContent = today.toLocaleDateString('en-US', options);
        } else {
            console.error('currentDateDisplay element not found.');
        }
    }

    // --- Event Listeners ---
    if (addSubjectButton) { // Null check
        addSubjectButton.addEventListener('click', addSubject);
    } else {
        console.error('addSubjectButton element not found.');
    }


    // Event delegation for subject list
    if (subjectListContainer) { // Null check
        subjectListContainer.addEventListener('click', async (event) => {
            const target = event.target;
            const subjectItem = target.closest('.subject-item'); // Find the closest subject-item parent

            if (subjectItem) {
                const subjectId = subjectItem.dataset.id; // Use ._id from MongoDB

                if (target.classList.contains('delete-subject-btn')) {
                    // Clicked on delete button
                    await deleteSubject(subjectId);
                } else if (target.classList.contains('subject-name')) {
                    // Clicked on subject name (or any part of subject-item that's not the delete button)
                    await activateSubject(subjectId);
                }
            }
        });
    } else {
        console.error('subjectListContainer element not found for event listener.');
    }


    // Event listener for add topic button
    if (addTopicButton) { // Null check
        addTopicButton.addEventListener('click', async () => {
            const topicName = addTopicInput ? addTopicInput.value.trim() : ''; // Null check for input
            if (currentActiveSubjectId) {
                await addTopic(currentActiveSubjectId, topicName);
            } else {
                alert('No subject is active to add a topic to.');
            }
        });
    } else {
        console.error('addTopicButton element not found.');
    }


    // Event listener for topic completion checkboxes (for regular subject topics)
    // Using delegation on topicListElement which is now static
    if (topicListElement) { // Null check
        topicListElement.addEventListener('change', async (event) => {
            if (event.target.type === 'checkbox' && event.target.id.startsWith('topic-checkbox-')) {
                const topicItem = event.target.closest('.topic-item'); // Get the parent li element
                if (topicItem) {
                    const topicId = topicItem.dataset.topicId; // Get from li
                    const subjectId = topicItem.dataset.subjectId; // Get from li
                    const isChecked = event.target.checked;

                    // Only proceed if IDs are defined
                    if (subjectId && topicId) {
                        await markTopicComplete(subjectId, topicId, isChecked);
                    } else {
                        console.error('Subject ID or Topic ID is undefined when trying to mark topic complete.', { subjectId, topicId, eventTarget: event.target });
                    }
                } else {
                    console.error('Could not find parent .topic-item for checkbox:', event.target);
                }
            }
        });
    } else {
        console.error('topicListElement element not found for event listener.');
    }


    // Event listener for daily revision topic completion checkboxes
    if (dailyRevisionList) { // Null check
        dailyRevisionList.addEventListener('change', async (event) => {
            if (event.target.type === 'checkbox' && event.target.id.startsWith('daily-revision-topic-')) {
                const dailyRevisionItem = event.target.closest('.daily-revision-item'); // Get the parent li element
                if (dailyRevisionItem) {
                    const topicId = dailyRevisionItem.dataset.topicId;
                    const subjectId = dailyRevisionItem.dataset.subjectId;
                    const isChecked = event.target.checked;

                    if (subjectId && topicId) {
                        await markDailyRevisionTopicComplete(subjectId, topicId, isChecked);
                    } else {
                        console.error('Subject ID or Topic ID is undefined for daily revision topic.', { subjectId, topicId, eventTarget: event.target });
                    }
                } else {
                    console.error('Could not find parent .daily-revision-item for checkbox:', event.target);
                }
            }
        });
    } else {
        console.error('dailyRevisionList element not found for event listener.');
    }


    // Timer button event listeners (attached directly as they are static elements in HTML)
    if (startTimerButton) { // Null check
        startTimerButton.addEventListener('click', startTimer);
    } else {
        console.error('startTimerButton element not found.');
    }
    if (pauseTimerButton) { // Null check
        pauseTimerButton.addEventListener('click', pauseTimer);
    } else {
        console.error('pauseTimerButton element not found.');
    }
    if (resetTimerButton) { // Null check
        resetTimerButton.addEventListener('click', resetTimer);
    } else {
        console.error('resetTimerButton element not found.');
    }

    setTimerButtons.forEach(button => {
        button.addEventListener('click', (e) => setTimer(parseInt(e.target.dataset.time) * 60));
    });

    // Event listener for custom timer input
    if (setCustomTimerButton) {
        setCustomTimerButton.addEventListener('click', () => {
            if (customTimerMinutesInput) {
                const minutes = parseInt(customTimerMinutesInput.value);
                if (!isNaN(minutes) && minutes > 0) {
                    setTimer(minutes * 60);
                    customTimerMinutesInput.value = ''; // Clear input after setting
                } else {
                    alert('Please enter a valid positive number for custom timer minutes.');
                }
            } else {
                console.error('customTimerMinutesInput element not found.');
            }
        });
    } else {
        console.error('setCustomTimerButton element not found.');
    }
});
