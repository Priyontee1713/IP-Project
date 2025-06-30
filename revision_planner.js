document.addEventListener('DOMContentLoaded', () => {
    const subjectListContainer = document.getElementById('subject-list-container');
    const addSubjectButton = document.getElementById('add-subject-button');
    const defaultRightContent = document.getElementById('default-right-content');
    const activeSubjectControls = document.getElementById('active-subject-controls');
    const currentDateDisplay = document.getElementById('current-date-display'); // NEW: Get reference to the date display element


    let currentTimerInterval; // To store the interval ID for the timer
    let timeRemaining = 0;    // In seconds
    let isTimerRunning = false;
    let currentActiveSubjectId = null; // To track which subject is active
    
    // Data structure: An array of subject objects
    // Each subject object will have: { id: '...', name: '...', completed: false }
    let subjects = [];

    // --- Initialization ---
    loadSubjects();
    renderSubjects(); // Render subjects on page load
    displayCurrentDate(); // NEW: Call function to display the current date

    // Initially ensure default content is visible and controls are hidden
    defaultRightContent.classList.remove('move-up');
    activeSubjectControls.classList.remove('show-controls');
    activeSubjectControls.innerHTML = ''; // Clear any residual content


    // --- Event Listeners ---
    addSubjectButton.addEventListener('click', addSubject);

    // Event delegation for subject buttons and delete icons (since they are added dynamically)
    subjectListContainer.addEventListener('click', (event) => {
        // Check if a subject button was clicked (excluding the delete icon directly)
        const clickedSubjectButton = event.target.closest('.subject-button');
        if (clickedSubjectButton) {
            // Check if the click originated from the delete icon inside the button
            if (event.target.closest('.delete-subject-btn')) {
                const subjectIdToDelete = clickedSubjectButton.dataset.subject;
                deleteSubject(subjectIdToDelete);
            } else {
                // Regular subject button click
                const subjectId = clickedSubjectButton.dataset.subject;

                // If same subject clicked, toggle visibility of its controls
                if (subjectId === currentActiveSubjectId) { // Check if it's the currently active subject
                    clearSubjectControls(); // Clear controls and move default content back
                    currentActiveSubjectId = null; // No active subject displayed
                } else {
                    currentActiveSubjectId = subjectId;
                    displayTopicTimerControls(subjectId);
                }
            }
        }
    });

    // Event delegation for topic list (add/tick)
    activeSubjectControls.addEventListener('click', (event) => {
        if (event.target.closest('.add-topic-button')) {
            // Pass the current active subject ID to addTopic
            addTopic(currentActiveSubjectId); 
        } else if (event.target.closest('.topic-checkbox')) {
            const checkbox = event.target.closest('.topic-checkbox');
            const topicId = checkbox.dataset.topicId;
            const subject = subjects.find(s => s.id === currentActiveSubjectId);
            if (subject) {
                handleTopicCompletion(subject, topicId, checkbox.checked);
            }
        }
    });

    // --- NEW: Function to display the current date ---
    function displayCurrentDate() {
        // Get the current date in Chittagong, Bangladesh (GMT+6)
        const now = new Date();
        // Use toLocaleDateString with specific options for DD/MM/YYYY
        // This ensures the date is formatted correctly regardless of the user's local settings.
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        // Specify 'en-GB' locale for DD/MM/YYYY format
        const formattedDate = now.toLocaleDateString('en-GB', options); 
        currentDateDisplay.textContent = `Date: ${formattedDate}`;
    }


    // --- Subject Management Functions ---

    function loadSubjects() {
        const storedSubjects = localStorage.getItem('revisionSubjects');
        if (storedSubjects) {
            subjects = JSON.parse(storedSubjects);
        } else {
            // Add some default subjects if none are stored
            subjects = [
                { id: 'cse313', name: 'Cse 313', topics: [] },
                { id: 'cse335', name: 'Cse 335', topics: [] },
                { id: 'cse353', name: 'Cse 353', topics: [] },
                { id: 'cse331', name: 'Cse 331', topics: [] },
            ];
            saveSubjects(); // Save defaults
        }
    }

    function saveSubjects() {
        localStorage.setItem('revisionSubjects', JSON.stringify(subjects));
    }

    function renderSubjects() {
        subjectListContainer.innerHTML = ''; // Clear existing buttons
        subjects.forEach(subject => {
            const button = document.createElement('button');
            button.className = 'subject-button';
            button.dataset.subject = subject.id;
            button.innerHTML = `
                ${subject.name}
                <span class="delete-subject-btn" data-subject="${subject.id}" title="Delete Subject">
                    <i class="fas fa-times"></i> </span>
            `;
            subjectListContainer.appendChild(button);
        });
    }

    function addSubject() {
        const newSubjectName = prompt('Enter the new subject name:');
        if (newSubjectName && newSubjectName.trim() !== '') {
            // Check for duplicate subject names (case-insensitive)
            if (subjects.some(s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase())) {
                alert(`Subject "${newSubjectName.trim()}" already exists!`);
                return;
            }

            const subjectId = 'sub' + Date.now(); // Simple unique ID
            const newSubject = { id: subjectId, name: newSubjectName.trim(), topics: [] };
            subjects.push(newSubject);
            saveSubjects();
            renderSubjects(); // Re-render all subjects including the new one
        }
    }

    function deleteSubject(subjectId) {
        const subjectToDelete = subjects.find(s => s.id === subjectId);
        if (subjectToDelete) {
            const confirmDelete = confirm(`Are you sure you want to remove "${subjectToDelete.name}" and all its topics? This action cannot be undone.`);
            if (confirmDelete) {
                subjects = subjects.filter(subject => subject.id !== subjectId);
                saveSubjects();
                renderSubjects(); // Re-render remaining subjects

                // If the deleted subject was active, clear its controls and move default content back
                if (currentActiveSubjectId === subjectId) {
                    clearSubjectControls();
                    currentActiveSubjectId = null; // Reset active subject
                }
            }
        }
    }

    // --- Right Panel Display Management ---

    function clearSubjectControls() {
        clearInterval(currentTimerInterval); // Stop any running timer
        timeRemaining = 0;
        isTimerRunning = false;
        
        // Hide dynamic controls first
        activeSubjectControls.classList.remove('show-controls'); 
        
        // After dynamic controls have started their transition out (0.5s),
        // show default content by moving it back down.
        // There's no need to clear activeSubjectControls.innerHTML here
        // as the default content will just slide back on top.
        setTimeout(() => {
            activeSubjectControls.innerHTML = ''; // Clear its content after it transitions out
            defaultRightContent.classList.remove('move-up'); // Show default content
        }, 500); // Match activeSubjectControls transition duration (0.5s)
    }

    // --- Dynamic Topic/Timer Controls Functions ---

    function displayTopicTimerControls(subjectId) {
        // Immediately move default content up
        defaultRightContent.classList.add('move-up');

        // Allow default content to start moving out (0.5s), then prepare and show new controls
        setTimeout(() => {
            activeSubjectControls.innerHTML = ''; // Clear existing controls
            const activeSubject = subjects.find(s => s.id === subjectId);
            if (!activeSubject) {
                console.error('Subject not found:', subjectId);
                return;
            }

            // Create a container for the new controls for the active subject
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'dynamic-controls-panel';
            controlsContainer.id = `controls-${subjectId}`; // Give it a unique ID based on subject

            controlsContainer.innerHTML = `
                <h2>${activeSubject.name} Revision</h2>
                <div class="topic-input-group">
                    <label for="topic-name-${subjectId}">Add New Topic:</label>
                    <input type="text" id="topic-name-${subjectId}" class="topic-input" placeholder="Enter your topic here...">
                    <button class="add-topic-button"><i class="fas fa-plus-circle"></i> Add Topic</button>
                </div>

                <div class="topic-list-container">
                    <h3>Topics for ${activeSubject.name}</h3>
                    <ul id="topic-list-${subjectId}">
                        </ul>
                    <p id="no-topics-message" style="text-align: center; color: #888; font-style: italic; margin-top: 10px;"></p>
                </div>

                <div class="timer-controls">
                    <label>Set Timer:</label>
                    <div class="timer-inputs">
                        <input type="number" id="minutes-input-${subjectId}" class="timer-input" value="25" min="0" max="999">
                        <span>min</span>
                        <input type="number" id="seconds-input-${subjectId}" class="timer-input" value="00" min="0" max="59">
                        <span>sec</span>
                    </div>
                    <div id="time-display-${subjectId}" class="time-display">00:00</div>
                    <div class="timer-buttons">
                        <button class="timer-button" id="start-button-${subjectId}">Start</button>
                        <button class="timer-button" id="pause-button-${subjectId}">Pause</button>
                        <button class="timer-button" id="reset-button-${subjectId}">Reset</button>
                    </div>
                </div>
            `;

            activeSubjectControls.appendChild(controlsContainer);
            // Show dynamic controls after appending content
            activeSubjectControls.classList.add('show-controls');
            
            // Get references to the newly created elements (scoped to controlsContainer)
            const topicInput = controlsContainer.querySelector(`#topic-name-${subjectId}`);
            // Add event listener for Enter key on topic input
            topicInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent default form submission
                    addTopic(subjectId); // Pass subjectId
                }
            });

            // The add topic button listener is handled by event delegation on activeSubjectControls
            const topicListElement = controlsContainer.querySelector(`#topic-list-${subjectId}`);
            const noTopicsMessage = controlsContainer.querySelector('#no-topics-message');
            const minutesInput = controlsContainer.querySelector(`#minutes-input-${subjectId}`);
            const secondsInput = controlsContainer.querySelector(`#seconds-input-${subjectId}`);
            const timeDisplay = controlsContainer.querySelector(`#time-display-${subjectId}`);
            const startButton = controlsContainer.querySelector(`#start-button-${subjectId}`);
            const pauseButton = controlsContainer.querySelector(`#pause-button-${subjectId}`);
            const resetButton = controlsContainer.querySelector(`#reset-button-${subjectId}`);
            
            // Render topics for the currently active subject
            renderTopicList(activeSubject.topics, topicListElement, noTopicsMessage);

            // Ensure timeDisplay is correctly updated initially
            updateTimeDisplay();

            // Attach timer button event listeners
            startButton.addEventListener('click', () => {
                if (!isTimerRunning) {
                    const minutes = parseInt(minutesInput.value) || 0;
                    const seconds = parseInt(secondsInput.value) || 0;
                    
                    // Only set new time if timer is not running or time was 0
                    if (timeRemaining === 0) {
                       timeRemaining = (minutes * 60) + seconds;
                    }

                    if (timeRemaining > 0) {
                        isTimerRunning = true;
                        startButton.textContent = 'Resume';
                        startTimer();
                    } else {
                        alert('Please set a valid time!');
                    }
                }
            });

            pauseButton.addEventListener('click', () => {
                if (isTimerRunning) {
                    clearInterval(currentTimerInterval);
                    isTimerRunning = false;
                    startButton.textContent = 'Resume';
                }
            });

            resetButton.addEventListener('click', () => {
                clearInterval(currentTimerInterval);
                isTimerRunning = false;
                timeRemaining = 0;
                updateTimeDisplay();
                startButton.textContent = 'Start';
                minutesInput.value = '25';
                secondsInput.value = '00';
            });

            // Timer functions (scoped locally or passed timeDisplay ref)
            function startTimer() {
                if (isTimerRunning && timeRemaining > 0) {
                    currentTimerInterval = setInterval(() => {
                        timeRemaining--;
                        updateTimeDisplay();

                        if (timeRemaining <= 0) {
                            clearInterval(currentTimerInterval);
                            isTimerRunning = false;
                            timeDisplay.textContent = 'Time\'s Up!';
                            // alert('Time for revision is over!'); // Consider a less intrusive notification
                            startButton.textContent = 'Start';
                        }
                    }, 1000);
                }
            }

            function updateTimeDisplay() {
                const minutes = Math.floor(timeRemaining / 60);
                const seconds = timeRemaining % 60;
                timeDisplay.textContent = 
                    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 500); // Matches defaultRightContent.move-up transition
    }

    // --- Topic Management Functions ---

    function renderTopicList(topics, listElement, noTopicsMessageElement) {
        listElement.innerHTML = ''; // Clear existing topics
        
        const incompleteTopics = topics.filter(t => !t.completed);

        if (incompleteTopics.length === 0) {
            noTopicsMessageElement.textContent = 'All topics completed for this subject, or no topics added yet.';
        } else {
            noTopicsMessageElement.textContent = '';
            incompleteTopics.forEach(topic => {
                const listItem = document.createElement('li');
                listItem.className = 'topic-item';
                listItem.dataset.topicId = topic.id; 
                
                listItem.innerHTML = `
                    <div class="topic-content">
                        <input type="checkbox" class="topic-checkbox" data-topic-id="${topic.id}">
                        <span class="topic-text">${topic.name}</span>
                    </div>
                `;
                listElement.appendChild(listItem);
            });
        }
    }

    // Helper function to update the "no topics" message based on *visible* topics
    function updateNoTopicsMessage(topics, noTopicsMessageElement) {
        const incompleteTopicsCount = topics.filter(t => !t.completed).length;
        if (incompleteTopicsCount === 0) {
            noTopicsMessageElement.textContent = 'All topics completed for this subject, or no topics added yet!';
        } else {
            noTopicsMessageElement.textContent = '';
        }
    }

    function addTopic(subjectId) {
        const controlsPanel = document.getElementById(`controls-${subjectId}`); // Get the specific controls panel
        if (!controlsPanel) return; // Exit if the panel isn't found

        const topicInput = controlsPanel.querySelector('.topic-input');
        const topicListElement = controlsPanel.querySelector('ul');
        const noTopicsMessage = controlsPanel.querySelector('#no-topics-message');
        
        const newTopicName = topicInput.value.trim();

        if (newTopicName) {
            const activeSubject = subjects.find(s => s.id === subjectId); // Use subjectId
            if (activeSubject) {
                // Topic names can now be duplicated as requested
                
                const newTopicId = 'topic' + Date.now();
                activeSubject.topics.push({ id: newTopicId, name: newTopicName, completed: false });
                saveSubjects();
                renderTopicList(activeSubject.topics, topicListElement, noTopicsMessage);
                topicInput.value = ''; // Clear input
            }
        } else {
            alert('Please enter a topic name.');
        }
    }

    function handleTopicCompletion(subject, topicId, isChecked) {
        const topicIndex = subject.topics.findIndex(t => t.id === topicId);
        if (topicIndex > -1) {
            subject.topics[topicIndex].completed = isChecked;
            saveSubjects();
            
            const topicItemElement = activeSubjectControls.querySelector(`[data-topic-id="${topicId}"]`);
            const topicListElement = activeSubjectControls.querySelector('ul');
            const noTopicsMessage = activeSubjectControls.querySelector('#no-topics-message');

            if (topicItemElement) {
                if (isChecked) {
                    // Apply class for visual transition
                    topicItemElement.classList.add('completed-topic');
                    // Wait for the transition to finish before actually removing it from the DOM
                    // Adjusted timeout to match new, slower CSS transition (0.7s)
                    topicItemElement.addEventListener('transitionend', function handler() {
                        topicItemElement.removeEventListener('transitionend', handler); // Remove listener to prevent multiple calls
                        if(topicItemElement.parentNode) topicItemElement.remove(); // Remove from DOM
                        updateNoTopicsMessage(subject.topics, noTopicsMessage); // Update message after removal
                    });
                } else {
                    // If unchecked, immediately re-render the list to show it again
                    // Re-add it to the list by finding its place (e.g., at the end of incomplete topics)
                    renderTopicList(subject.topics, topicListElement, noTopicsMessage);
                }
            }
        }
    }
});