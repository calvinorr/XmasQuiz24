// Quiz Interface Module
import { QuizState, quizConfig, updateProgress, updateRoundIndicators } from './quizConfig.js';

class QuizInterface {
    constructor() {
        this.quizState = new QuizState();
        this.currentTeam = '';
        this.isAdmin = false;
        this.selectedAnswer = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('admin-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAdminLogin();
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });
    }

    handleLogin() {
        const teamName = document.getElementById('team-name').value;
        const password = document.getElementById('team-password').value;

        if (!teamName || !password) {
            alert('Please enter both team name and password!');
            return;
        }

        if (password === quizConfig.adminPassword) {
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
        document.getElementById('current-team').textContent = this.currentTeam;
        document.getElementById('current-score').textContent = team.score;
        
        const roundStatus = this.quizState.getRoundStatus(this.currentTeam, team.currentRound);
        if (roundStatus) {
            this.loadRound(team.currentRound);
            updateRoundIndicators(team.currentRound, team.roundsCompleted);
        }
    }

    async loadRound(roundId) {
        const round = quizConfig.rounds.find(r => r.id === roundId);
        if (!round) return;

        try {
            const response = await fetch(round.path);
            const html = await response.text();
            document.getElementById('quiz-content').innerHTML = html;
            
            this.initializeRoundEventListeners();
            document.getElementById('round-title').textContent = round.title;
            document.getElementById('round-description').textContent = round.description;
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
        // Remove selection from other options
        button.parentElement.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Select this option
        button.classList.add('selected');
        this.selectedAnswer = button.dataset.answer;
    }

    handleAnswerSubmit() {
        if (!this.selectedAnswer) {
            alert('Please select an answer first!');
            return;
        }

        const questionId = document.querySelector('.question.active').dataset.questionId;
        const roundId = quizConfig.rounds.find(r => r.path === window.location.pathname)?.id;
        
        if (!roundId || !questionId) return;

        const isCorrect = this.checkAnswer(roundId, questionId, this.selectedAnswer);
        this.showAnswerFeedback(isCorrect);
        this.quizState.updateTeamScore(this.currentTeam, roundId, questionId, isCorrect);
        
        // Disable options after submission
        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
        document.querySelector('.submit-answer').disabled = true;

        // Update score display
        const team = this.quizState.getTeamProgress(this.currentTeam);
        document.getElementById('current-score').textContent = team.score;
    }

    checkAnswer(roundId, questionId, answer) {
        // This would be implemented per round with the correct answers
        return false;
    }

    showAnswerFeedback(isCorrect) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
        
        const questionContainer = document.querySelector('.question.active');
        questionContainer.appendChild(feedback);
        feedback.style.display = 'block';
    }

    showAdminControls() {
        document.querySelector('.admin-controls').style.display = 'block';
        this.showLeaderboard();
    }

    showLeaderboard() {
        const leaderboard = this.quizState.getLeaderboard();
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = leaderboard
            .map((team, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${team.name}</td>
                    <td>${team.score}</td>
                </tr>
            `).join('');

        document.querySelector('.leaderboard').classList.remove('hidden');
        document.querySelector('.quiz-container').classList.add('hidden');
    }

    handleLogout() {
        this.currentTeam = '';
        this.isAdmin = false;
        this.selectedAnswer = null;
        document.querySelector('.admin-controls').style.display = 'none';
        document.querySelector('.leaderboard').classList.add('hidden');
        document.querySelector('.quiz-container').classList.add('hidden');
        document.querySelector('.login-section').classList.remove('hidden');
        document.getElementById('team-name').value = '';
        document.getElementById('team-password').value = '';
    }

    showAdminLogin() {
        document.getElementById('team-name').value = 'Quiz Master';
        document.getElementById('team-password').focus();
    }
}

// Initialize quiz interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quizInterface = new QuizInterface();
});
