const flashcardData = {
    english: [
      { front: "Simile", back: "A comparison using 'like' or 'as'." },
      { front: "Metaphor", back: "One thing becomes another." },
      { front: "Allusion", back: "Reference to outside work." },
      { front: "Symbol", back: "Object representing an idea." },
      { front: "Motif", back: "Repetitive image/idea in a work." },
      { front: "Tone", back: "Author's attitude toward subject." },
      { front: "Mood", back: "Emotional impact on reader." },
      { front: "Imagery", back: "Appeals to the senses." }
    ],
    science: [
      { front: "Atom", back: "Basic unit of matter." },
      { front: "Gravity", back: "Force pulling objects together." },
      { front: "Cell", back: "Basic unit of life." },
      { front: "Energy", back: "Ability to do work." },
      { front: "Photosynthesis", back: "Plants making food from sunlight." },
      { front: "Evolution", back: "Change in species over time." },
      { front: "DNA", back: "Molecule with genetic instructions." },
      { front: "Ecosystem", back: "Community of organisms & environment." }
    ],
    math: [
      { front: "Algebra", back: "Using letters to represent numbers." },
      { front: "Geometry", back: "Study of shapes and space." },
      { front: "Fraction", back: "Part of a whole." },
      { front: "Pi (π)", back: "Ratio of circumference to diameter." },
      { front: "Equation", back: "Statement showing two values are equal." },
      { front: "Variable", back: "Symbol for an unknown number." },
      { front: "Angle", back: "Formed by two rays." },
      { front: "Prime Number", back: "Only divisible by 1 and itself." }
    ]
  };
  
  function renderFlashcards(subject) {
    const grid = document.getElementById('flashcardGrid');
    const title = document.getElementById('flashcardTitle');
    title.innerHTML = `<h2>Subject: ${subject.charAt(0).toUpperCase() + subject.slice(1)}</h2>`;
    grid.innerHTML = '';
  
    flashcardData[subject].forEach(card => {
      const cardHTML = `
        <div class="flashcard">
          <div class="card-inner">
            <div class="card-front">${card.front}</div>
            <div class="card-back">${card.back}</div>
          </div>
        </div>
      `;
      grid.innerHTML += cardHTML;
    });
  
    addFlipEventListeners(); // re-bind flip functionality
  }
  
  function addFlipEventListeners() {
    document.querySelectorAll('.card-inner').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('flipped');
      });
    });
  }
  
  document.getElementById('subjectSelector').addEventListener('change', (e) => {
    renderFlashcards(e.target.value);
  });
  
  window.onload = () => {
    renderFlashcards('english'); // Default
  };
  