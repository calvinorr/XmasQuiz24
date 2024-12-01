// Quiz Interface Module
export class QuizInterface {
    constructor() {
        this.quizState = null;
        this.currentTeam = '';
        this.isAdmin = false;
        this.selectedAnswer = null;
        this.quizConfig = null;
        this.currentRoundId = 1;
        this.basePath = window.basePath || '';

        // Try to restore team from localStorage
        const storedTeam = localStorage.getItem('currentTeam');
        if (storedTeam) {
            this.currentTeam = storedTeam;
            this.isAdmin = storedTeam === 'Quiz Master';
        }
    }

    async initialize() {
        try {
            const module = await import(`${this.basePath}/js/quizConfig.js`);
            const { QuizState, quizConfig } = module;
            this.quizState = new QuizState();
            this.quizConfig = quizConfig;

            // Initialize UI based on current page
            if (window.location.pathname.includes('round')) {
                this.initializeRoundPage();
            } else if (this.isAdmin) {
                // If admin is restored from localStorage, show admin controls
                this.showAdminControls();
            }
        } catch (error) {
            console.error('Error loading quiz configuration:', error);
            this.showError('Failed to load quiz configuration. Please refresh the page.');
        }
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

        if (teamName === 'Quiz Master' && password === 'quizmaster2024') {
            this.isAdmin = true;
            this.currentTeam = 'Quiz Master';
            localStorage.setItem('currentTeam', 'Quiz Master');
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

    showAdminControls() {
        // Hide login section
        document.querySelector('.login-section')?.classList.add('hidden');
        
        // Show admin controls
        const adminControls = document.querySelector('.admin-controls');
        if (adminControls) {
            adminControls.classList.remove('hidden');
        }
        
        // Show leaderboard
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
        if (teamPasswordInput) {
            teamPasswordInput.value = '';
            teamPasswordInput.focus();
        }
    }

    resetAllScores() {
        if (this.isAdmin && confirm('Are you sure you want to reset all scores? This cannot be undone.')) {
            this.quizState.resetAllScores();
            this.showLeaderboard();
        }
    }

    exportScores() {
        if (this.isAdmin) {
            this.quizState.exportScores();
        }
    }

    // ... rest of the class implementation remains the same ...
}
