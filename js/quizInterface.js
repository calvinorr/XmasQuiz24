// Quiz Interface Module
export class QuizInterface {
    constructor() {
        this.quizState = null;
        this.currentTeam = '';
        this.isAdmin = false;
        this.selectedAnswer = null;
    }

    initialize() {
        import('./quizConfig.js').then(module => {
            const { QuizState } = module;
            this.quizState = new QuizState();
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
            this.updateRoundIndicators(team.currentRound, team.roundsCompleted);
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

    initializeRoundEventListeners() {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleOptionSelect(btn));
        });

        document.querySelectorAll('.submit-answer').forEach(btn => {
            btn.addEventListener('click', () => this.handleAnswerSubmit());
        });
    }

    handleOptionSelect(button) {
        button.parentElement.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');
        this.selectedAnswer = button.dataset.answer;
    }

    handleAnswerSubmit() {
        if (!this.selectedAnswer) {
            alert('Please select an answer first!');
            return;
        }

        const activeQuestion = document.querySelector('.question.active');
        if (!activeQuestion) return;

        const questionId = activeQuestion.dataset.questionId;
        const roundId = parseInt(window.location.pathname.match(/round(\d+)\.html/)?.[1] || '1');
        
        if (!roundId || !questionId) return;

        const isCorrect = this.checkAnswer(roundId, questionId, this.selectedAnswer);
        this.showAnswerFeedback(isCorrect, activeQuestion);
        this.quizState.updateTeamScore(this.currentTeam, roundId, questionId, isCorrect);
        
        activeQuestion.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
        activeQuestion.querySelector('.submit-answer').disabled = true;

        const team = this.quizState.getTeamProgress(this.currentTeam);
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) scoreElement.textContent = team.score;
    }

    checkAnswer(roundId, questionId, answer) {
        // This would be implemented per round with the correct answers
        return false;
    }

    showAnswerFeedback(isCorrect, questionElement) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
        questionElement.appendChild(feedback);
        feedback.style.display = 'block';
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
