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

        // Try to restore team from localStorage
        const storedTeam = localStorage.getItem('currentTeam');
        if (storedTeam) {
            this.currentTeam = storedTeam;
        }
    }

    initialize() {
        import('./quizConfig.js').then(module => {
            const { QuizState, quizConfig } = module;
            this.quizState = new QuizState();
            this.quizConfig = quizConfig;

            // Initialize UI based on current page
            if (window.location.pathname.includes('round')) {
                this.initializeRoundPage();
            }
        }).catch(error => {
            console.error('Error loading quiz configuration:', error);
            this.showError('Failed to load quiz configuration. Please refresh the page.');
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }

    handleLogin() {
        const teamName = document.getElementById('team-name')?.value;
        const password = document.getElementById('team-password')?.value;

        if (!teamName || !password) {
            alert('Please enter both team name and password!');
            return;
        }

        if (password === 'quizmaster2024') {
            this.isAdmin = true;
            this.showAdminControls();
            return;
        }

        try {
            const team = this.quizState.addTeam(teamName, password);
            this.currentTeam = teamName;
            localStorage.setItem('currentTeam', teamName);
            window.location.href = `${this.basePath}/rounds/round${team.currentRound}.html`;
        } catch (error) {
            alert(error.message);
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

        const currentTeamElement = document.getElementById('current-team');
        const currentScoreElement = document.getElementById('current-score');
        
        if (currentTeamElement) currentTeamElement.textContent = this.currentTeam;
        if (currentScoreElement) currentScoreElement.textContent = team.score;

        // Initialize option buttons and submit buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleOptionSelect(btn));
        });

        document.querySelectorAll('.submit-answer').forEach(btn => {
            btn.addEventListener('click', () => this.handleAnswerSubmit());
        });

        // Initialize navigation
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        // Initialize progress
        this.updateProgress(1);
    }

    handleOptionSelect(button) {
        const optionsContainer = button.closest('.options');
        if (optionsContainer) {
            optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            button.classList.add('selected');
            this.selectedAnswer = button.dataset.answer;
        }
    }

    handleAnswerSubmit() {
        if (!this.selectedAnswer) {
            alert('Please select an answer first!');
            return;
        }

        const activeQuestion = document.querySelector('.question.active');
        if (!activeQuestion) return;

        const questionId = parseInt(activeQuestion.dataset.questionId);
        if (!questionId) return;

        const isCorrect = this.checkAnswer(this.currentRoundId, questionId, this.selectedAnswer);
        this.showAnswerFeedback(isCorrect, activeQuestion);
        
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
            if (btn.dataset.answer === this.selectedAnswer) {
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        });
    }

    checkAnswer(roundId, questionId, answer) {
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

        return answers[roundId]?.[questionId] === answer;
    }

    showAnswerFeedback(isCorrect, questionElement) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
        
        // Insert feedback after the options but before the submit button
        const submitButton = questionElement.querySelector('.submit-answer');
        submitButton.parentNode.insertBefore(feedback, submitButton);
    }

    previousQuestion() {
        const currentQuestion = document.querySelector('.question.active');
        const prevQuestion = currentQuestion.previousElementSibling;
        
        if (prevQuestion && prevQuestion.classList.contains('question')) {
            currentQuestion.classList.remove('active');
            prevQuestion.classList.add('active');
            
            const questionNumber = parseInt(prevQuestion.dataset.questionId);
            document.getElementById('prev-btn').style.display = questionNumber === 1 ? 'none' : 'inline';
            document.getElementById('next-btn').textContent = 'Next';
            
            this.updateProgress(questionNumber);
        }
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
        } else {
            // Complete round
            this.quizState.completeRound(this.currentTeam, this.currentRoundId);
            window.location.href = `${this.basePath}/rounds/round${this.currentRoundId + 1}.html`;
        }
    }

    updateProgress(questionNumber) {
        const totalQuestions = document.querySelectorAll('.question').length;
        const progress = (questionNumber / totalQuestions) * 100;
        document.getElementById('quiz-progress').style.width = `${progress}%`;
    }

    showAdminControls() {
        document.querySelector('.login-section')?.classList.add('hidden');
        document.querySelector('.admin-controls')?.classList.remove('hidden');
        this.showLeaderboard();
    }

    showLeaderboard() {
        const leaderboard = this.quizState.getLeaderboard();
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = leaderboard
                .map((team, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${team.name}</td>
                        <td>${team.score}</td>
                    </tr>
                `).join('');
        }

        document.querySelector('.leaderboard')?.classList.remove('hidden');
    }

    handleLogout() {
        this.currentTeam = '';
        this.isAdmin = false;
        this.selectedAnswer = null;
        localStorage.removeItem('currentTeam');
        
        document.querySelector('.admin-controls')?.classList.add('hidden');
        document.querySelector('.leaderboard')?.classList.add('hidden');
        document.querySelector('.login-section')?.classList.remove('hidden');
        
        const teamNameInput = document.getElementById('team-name');
        const teamPasswordInput = document.getElementById('team-password');
        if (teamNameInput) teamNameInput.value = '';
        if (teamPasswordInput) teamPasswordInput.value = '';
    }

    showAdminLogin() {
        const teamNameInput = document.getElementById('team-name');
        const teamPasswordInput = document.getElementById('team-password');
        if (teamNameInput) teamNameInput.value = 'Quiz Master';
        if (teamPasswordInput) teamPasswordInput.focus();
    }
}
