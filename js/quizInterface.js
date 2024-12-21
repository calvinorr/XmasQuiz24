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
        this.loginAttempts = {};
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds

        // Try to restore team from localStorage
        const storedTeam = localStorage.getItem('currentTeam');
        if (storedTeam) {
            this.currentTeam = storedTeam;
            this.isAdmin = storedTeam === 'Quiz Master';
        }
    }

    async initialize() {
        try {
            console.log('QuizInterface initializing...');
            // Determine if we're in a round or on the main page
            const isRoundPage = window.location.pathname.includes('/rounds/');
            const modulePath = isRoundPage ? 
                `${this.basePath}/js/quizConfig.js`.replace('//', '/') : 
                `${this.basePath}/js/quizConfig.js`.replace('//', '/');

            console.log('Loading config from:', modulePath);
            const module = await import(modulePath);
            console.log('Config module loaded:', module);

            const { quizConfig, createQuizState, updateProgress, updateRoundIndicators } = module;
            this.quizState = createQuizState();
            console.log('QuizState created:', this.quizState);
            
            this.quizConfig = quizConfig;
            this.updateProgress = updateProgress;
            this.updateRoundIndicators = updateRoundIndicators;

            // Initialize UI based on current page
            if (isRoundPage) {
                console.log('Initializing round page');
                this.initializeRoundPage();
            } else if (localStorage.getItem('currentTeam') === 'Quiz Master') {
                console.log('Initializing admin view');
                this.isAdmin = true;
                this.showAdminControls();
            }
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
            throw error;
        }
    }

    initializeRoundPage() {
        // Set up event listeners for round page
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleOptionSelect(btn));
        });

        document.querySelectorAll('.submit-answer').forEach(btn => {
            btn.addEventListener('click', () => this.handleAnswerSubmit());
        });

        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        // Update team info
        const currentTeam = localStorage.getItem('currentTeam');
        if (!currentTeam) {
            window.location.href = this.basePath + '/index.html';
            return;
        }

        this.currentTeam = currentTeam;
        const currentTeamElement = document.getElementById('current-team');
        if (currentTeamElement) {
            currentTeamElement.textContent = this.currentTeam;
        }

        // Get current round from URL
        const roundMatch = window.location.pathname.match(/round(\d+)\.html/);
        if (roundMatch) {
            this.currentRoundId = parseInt(roundMatch[1]);
        }

        // Initialize progress
        const totalQuestions = document.querySelectorAll('.question').length;
        this.updateProgress(1, totalQuestions);
        this.updateRoundIndicators(this.currentRoundId, this.quizState.getTeamProgress(this.currentTeam)?.roundsCompleted || {});
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
            const scoreElement = document.getElementById('current-score');
            if (scoreElement) {
                const team = this.quizState.getTeamProgress(this.currentTeam);
                scoreElement.textContent = team.score;
            }
        }

        // Disable the submit button and options
        activeQuestion.querySelector('.submit-answer').disabled = true;
        activeQuestion.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.answer === this.selectedAnswer) {
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        });

        // Enable next button
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
            
            const totalQuestions = document.querySelectorAll('.question').length;
            this.updateProgress(questionNumber, totalQuestions);
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
            
            this.updateProgress(questionNumber, totalQuestions);
        } else {
            // Complete round
            this.quizState.completeRound(this.currentTeam, this.currentRoundId);
            window.location.href = `${this.basePath}/rounds/round${this.currentRoundId + 1}.html`;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }

    validateTeamName(teamName) {
        // Check length
        if (teamName.length < 2 || teamName.length > 30) {
            throw new Error('Team name must be between 2 and 30 characters');
        }

        // Check for valid characters (letters, numbers, spaces, and common punctuation)
        const validNameRegex = /^[a-zA-Z0-9\s\-_',.!]+$/;
        if (!validNameRegex.test(teamName)) {
            throw new Error('Team name contains invalid characters');
        }

        // Check for inappropriate content (basic filter)
        const inappropriateWords = ['admin', 'root', 'system', 'moderator'];
        if (inappropriateWords.some(word => teamName.toLowerCase().includes(word))) {
            throw new Error('Team name contains restricted words');
        }

        return true;
    }

    sanitizeInput(input) {
        // Remove any HTML tags
        input = input.replace(/<[^>]*>/g, '');
        // Convert special characters to HTML entities
        input = input.replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
        return input.trim();
    }

    isLockedOut(teamName) {
        const attempts = this.loginAttempts[teamName];
        if (!attempts) return false;

        if (attempts.count >= this.maxLoginAttempts && 
            Date.now() - attempts.lastAttempt < this.lockoutDuration) {
            return true;
        }

        // Reset if lockout period has passed
        if (Date.now() - attempts.lastAttempt >= this.lockoutDuration) {
            delete this.loginAttempts[teamName];
        }

        return false;
    }

    recordLoginAttempt(teamName, success) {
        if (!this.loginAttempts[teamName]) {
            this.loginAttempts[teamName] = { count: 0, lastAttempt: Date.now() };
        }

        if (!success) {
            this.loginAttempts[teamName].count++;
            this.loginAttempts[teamName].lastAttempt = Date.now();
        } else {
            // Reset on successful login
            delete this.loginAttempts[teamName];
        }
    }

    handleLogin() {
        try {
            let teamName = document.getElementById('team-name')?.value;
            let password = document.getElementById('team-password')?.value;

            if (!teamName || !password) {
                throw new Error('Please enter both team name and password!');
            }

            // Sanitize inputs
            teamName = this.sanitizeInput(teamName);
            password = this.sanitizeInput(password);

            // Check for lockout
            if (this.isLockedOut(teamName)) {
                const remainingTime = Math.ceil((this.lockoutDuration - 
                    (Date.now() - this.loginAttempts[teamName].lastAttempt)) / 60000);
                throw new Error(`Account is locked. Please try again in ${remainingTime} minutes.`);
            }

            // Admin login
            if (teamName === 'Quiz Master') {
                if (password === 'quizmaster2024') {
                    this.isAdmin = true;
                    localStorage.setItem('currentTeam', 'Quiz Master');
                    this.showAdminControls();
                    this.recordLoginAttempt(teamName, true);
                    return;
                } else {
                    this.recordLoginAttempt(teamName, false);
                    throw new Error('Invalid admin credentials');
                }
            }

            // Validate team name for non-admin users
            this.validateTeamName(teamName);

            // Regular team login
            const team = this.quizState.addTeam(teamName, password);
            this.currentTeam = teamName;
            localStorage.setItem('currentTeam', teamName);
            this.recordLoginAttempt(teamName, true);
            window.location.href = `${this.basePath}/rounds/round${team.currentRound}.html`;
        } catch (error) {
            alert(error.message);
        }
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
        localStorage.removeItem('currentTeam');
        window.location.href = this.basePath + '/index.html';
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
}
