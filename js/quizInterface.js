// Quiz Interface Module
export class QuizInterface {
    constructor() {
        this.quizState = null;
        this.currentTeam = '';
        this.isAdmin = false;
        this.selectedAnswer = null;
        this.quizConfig = null;
        this.currentRoundId = 1;
    }

    initialize() {
        import('./quizConfig.js').then(module => {
            const { QuizState, quizConfig, updateRoundIndicators } = module;
            this.quizState = new QuizState();
            this.quizConfig = quizConfig;
            this.updateRoundIndicators = updateRoundIndicators;
            
            // Determine current round from URL
            const roundMatch = window.location.pathname.match(/round(\d+)\.html/);
            if (roundMatch) {
                this.currentRoundId = parseInt(roundMatch[1]);
            }
            
            this.initializeEventListeners();
        }).catch(error => {
            console.error('Error loading quiz configuration:', error);
        });
    }

    initializeEventListeners() {
        const loginForm = document.getElementById('login-form');
        const adminLink = document.getElementById('admin-link');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (adminLink) {
            adminLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAdminLogin();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Initialize navigation buttons
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
            this.loadTeamProgress(team);
        } catch (error) {
            alert(error.message);
        }
    }

    loadTeamProgress(team) {
        const currentTeamElement = document.getElementById('current-team');
        const currentScoreElement = document.getElementById('current-score');
        
        if (currentTeamElement) currentTeamElement.textContent = this.currentTeam;
        if (currentScoreElement) currentScoreElement.textContent = team.score;
        
        const roundStatus = this.quizState.getRoundStatus(this.currentTeam, team.currentRound);
        if (roundStatus) {
            this.loadRound(team.currentRound);
            if (this.updateRoundIndicators) {
                this.updateRoundIndicators(team.currentRound, team.roundsCompleted);
            }
        }
    }

    async loadRound(roundId) {
        try {
            const response = await fetch(`rounds/round${roundId}.html`);
            const html = await response.text();
            const quizContent = document.getElementById('quiz-content');
            if (quizContent) {
                quizContent.innerHTML = html;
                quizContent.classList.remove('hidden');
                document.querySelector('.login-section')?.classList.add('hidden');
                this.initializeRoundEventListeners();
            }
        } catch (error) {
            console.error('Error loading round:', error);
            alert('Error loading round content');
        }
    }

    handleOptionSelect(button) {
        const optionsContainer = button.closest('.options');
        if (optionsContainer) {
            optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            button.classList.add('selected');
            this.selectedAnswer = button.dataset.answer;

            // Remove any existing feedback
            const existingFeedback = button.closest('.question').querySelector('.feedback');
            if (existingFeedback) {
                existingFeedback.remove();
            }
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

        // Disable the submit button but not the options
        activeQuestion.querySelector('.submit-answer').disabled = true;

        // Enable next button after answering
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.disabled = false;
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

        const correctAnswer = answers[roundId]?.[questionId];
        console.log(`Checking answer for round ${roundId}, question ${questionId}: given ${answer}, correct ${correctAnswer}`);
        return correctAnswer === answer;
    }

    showAnswerFeedback(isCorrect, questionElement) {
        // Remove any existing feedback first
        const existingFeedback = questionElement.querySelector('.feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        const feedback = document.createElement('div');
        feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
        
        // Insert feedback after the options but before the submit button
        const submitButton = questionElement.querySelector('.submit-answer');
        submitButton.parentNode.insertBefore(feedback, submitButton);
        feedback.style.display = 'block';
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
            window.location.href = `round${this.currentRoundId + 1}.html`;
        }
    }

    updateProgress(questionNumber) {
        const totalQuestions = document.querySelectorAll('.question').length;
        const progress = (questionNumber / totalQuestions) * 100;
        document.getElementById('quiz-progress').style.width = `${progress}%`;
    }

    showAdminControls() {
        const adminControls = document.querySelector('.admin-controls');
        if (adminControls) {
            adminControls.style.display = 'block';
            this.showLeaderboard();
        }
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
        document.querySelector('.quiz-container')?.classList.add('hidden');
    }

    handleLogout() {
        this.currentTeam = '';
        this.isAdmin = false;
        this.selectedAnswer = null;
        document.querySelector('.admin-controls').style.display = 'none';
        document.querySelector('.leaderboard')?.classList.add('hidden');
        document.querySelector('.quiz-container')?.classList.add('hidden');
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

// Initialize quiz interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const quizInterface = new QuizInterface();
    quizInterface.initialize();
    window.quizInterface = quizInterface;
});