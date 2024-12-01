// Quiz Interface Module
export class QuizInterface {
    constructor() {
        this.quizState = null;
        this.currentTeam = '';
        this.isAdmin = false;
        this.selectedAnswer = null;
        this.quizConfig = null;
        this.currentRoundId = 1;
        this.basePath = window.location.pathname.includes('XmasQuiz24') ? '/XmasQuiz24' : '';
        this.timer = null;
        this.timeLeft = 30; // 30 seconds per question

        // Create audio elements
        this.correctSound = new Audio(`${this.basePath}/sounds/correct.mp3`);
        this.incorrectSound = new Audio(`${this.basePath}/sounds/incorrect.mp3`);
        this.tickSound = new Audio(`${this.basePath}/sounds/tick.mp3`);

        // Try to restore team from localStorage
        const storedTeam = localStorage.getItem('currentTeam');
        if (storedTeam) {
            this.currentTeam = storedTeam;
        }

        // Bind keyboard navigation
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    initialize() {
        // First determine if we're on a round page
        const roundMatch = window.location.pathname.match(/round(\d+)\.html/);
        if (roundMatch) {
            this.currentRoundId = parseInt(roundMatch[1]);
        }

        import('./quizConfig.js').then(module => {
            const { QuizState, quizConfig, updateRoundIndicators } = module;
            this.quizState = new QuizState();
            this.quizConfig = quizConfig;
            this.updateRoundIndicators = updateRoundIndicators;

            // Initialize UI based on current page
            if (roundMatch) {
                this.initializeRoundPage();
            } else {
                this.initializeLoginPage();
            }

            // Add keyboard navigation
            document.addEventListener('keydown', this.handleKeyPress);
        }).catch(error => {
            console.error('Error loading quiz configuration:', error);
            this.showError('Failed to load quiz configuration. Please refresh the page.');
        });
    }

    handleKeyPress(event) {
        const activeQuestion = document.querySelector('.question.active');
        if (!activeQuestion) return;

        switch(event.key) {
            case 'ArrowLeft':
                document.getElementById('prev-btn')?.click();
                break;
            case 'ArrowRight':
                document.getElementById('next-btn')?.click();
                break;
            case '1':
            case 'a':
            case 'A':
                activeQuestion.querySelector('[data-answer="A"]')?.click();
                break;
            case '2':
            case 'b':
            case 'B':
                activeQuestion.querySelector('[data-answer="B"]')?.click();
                break;
            case '3':
            case 'c':
            case 'C':
                activeQuestion.querySelector('[data-answer="C"]')?.click();
                break;
            case 'Enter':
                if (this.selectedAnswer) {
                    activeQuestion.querySelector('.submit-answer')?.click();
                }
                break;
        }
    }

    startTimer() {
        this.timeLeft = 30;
        this.updateTimerDisplay();

        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 5) {
                this.tickSound.play().catch(() => {});
            }

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                const activeQuestion = document.querySelector('.question.active');
                if (activeQuestion && !activeQuestion.querySelector('.submit-answer').disabled) {
                    this.handleAnswerSubmit(true); // Force submit
                }
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerDisplay = document.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = this.timeLeft;
            if (this.timeLeft <= 5) {
                timerDisplay.classList.add('warning');
            }
        }
    }

    initializeRoundPage() {
        if (!this.currentTeam) {
            window.location.href = this.basePath + '/index.html';
            return;
        }

        // Update team info
        const team = this.quizState.getTeamProgress(this.currentTeam);
        if (!team) {
            window.location.href = this.basePath + '/index.html';
            return;
        }

        // Add timer display
        const roundInfo = document.querySelector('.round-info');
        if (roundInfo) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'timer-container';
            timerDiv.innerHTML = `
                <div class="timer-label">Time Remaining:</div>
                <div class="timer-display">30</div>
            `;
            roundInfo.appendChild(timerDiv);
        }

        const currentTeamElement = document.getElementById('current-team');
        const currentScoreElement = document.getElementById('current-score');
        
        if (currentTeamElement) currentTeamElement.textContent = this.currentTeam;
        if (currentScoreElement) currentScoreElement.textContent = team.score;

        // Initialize question navigation
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        // Initialize option buttons and submit buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleOptionSelect(btn));
        });

        document.querySelectorAll('.submit-answer').forEach(btn => {
            btn.addEventListener('click', () => this.handleAnswerSubmit());
        });

        // Initialize progress and timer
        this.updateProgress(1);
        this.startTimer();
    }

    handleAnswerSubmit(isTimeout = false) {
        if (!this.selectedAnswer && !isTimeout) {
            alert('Please select an answer first!');
            return;
        }

        clearInterval(this.timer);

        const activeQuestion = document.querySelector('.question.active');
        if (!activeQuestion) return;

        const questionId = parseInt(activeQuestion.dataset.questionId);
        if (!questionId) return;

        const isCorrect = this.selectedAnswer ? this.checkAnswer(this.currentRoundId, questionId, this.selectedAnswer) : false;
        
        // Play sound effect
        if (isCorrect) {
            this.correctSound.play().catch(() => {});
        } else {
            this.incorrectSound.play().catch(() => {});
        }

        this.showAnswerFeedback(isCorrect, activeQuestion, isTimeout);
        
        if (isCorrect) {
            this.quizState.updateTeamScore(this.currentTeam, this.currentRoundId, questionId, true);
            const team = this.quizState.getTeamProgress(this.currentTeam);
            const scoreElement = document.getElementById('current-score');
            if (scoreElement) scoreElement.textContent = team.score;
        }

        // Disable the submit button and options
        activeQuestion.querySelector('.submit-answer').disabled = true;
        activeQuestion.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            if (this.selectedAnswer && btn.dataset.answer === this.selectedAnswer) {
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        });

        // Show correct answer if wrong or timeout
        if (!isCorrect) {
            const correctAnswer = this.getCorrectAnswer(this.currentRoundId, questionId);
            activeQuestion.querySelector(`[data-answer="${correctAnswer}"]`)?.classList.add('correct');
        }

        // Enable next button after answering
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.disabled = false;
    }

    getCorrectAnswer(roundId, questionId) {
        const answers = {
            1: { // Round 1 - Picture Round
                1: "A", // The Nutcracker
                2: "B", // Home Alone
                3: "C", // Mistletoe
                4: "A", // Harrods
                5: "B"  // Gingerbread
            },
            2: { // Round 2 - Christmas Trivia
                1: "B", // Ten lords
                2: "B", // Germany
                3: "C", // White Rock Beverages
                4: "A", // Turkey
                5: "B"  // Eggnog
            }
        };
        return answers[roundId]?.[questionId];
    }

    nextQuestion() {
        const currentQuestion = document.querySelector('.question.active');
        const nextQuestion = currentQuestion.nextElementSibling;
        
        if (nextQuestion && nextQuestion.classList.contains('question')) {
            currentQuestion.classList.remove('active');
            nextQuestion.classList.add('active');
            
            const questionNumber = parseInt(nextQuestion.dataset.questionId);
            const totalQuestions = document.querySelectorAll('.question').length;
            
            document.getElementById('prev-btn').style.display = 'inline';
            document.getElementById('next-btn').textContent = questionNumber === totalQuestions ? 'Finish Round' : 'Next';
            
            this.updateProgress(questionNumber);
            this.startTimer();
        } else {
            // Show confirmation dialog before finishing round
            if (confirm('Are you sure you want to finish this round?')) {
                // Show loading animation
                this.showLoading();
                
                // Complete round
                this.quizState.completeRound(this.currentTeam, this.currentRoundId);
                
                // Navigate to next round after a short delay
                setTimeout(() => {
                    window.location.href = `${this.basePath}/rounds/round${this.currentRoundId + 1}.html`;
                }, 1000);
            }
        }
    }

    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading next round...</div>
        `;
        document.body.appendChild(loadingDiv);
    }

    // ... (rest of the class implementation remains the same)
}

// Initialize quiz interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const quizInterface = new QuizInterface();
    quizInterface.initialize();
    window.quizInterface = quizInterface;
});
