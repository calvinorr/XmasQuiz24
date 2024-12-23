// Quiz Configuration and State Management
export const quizConfig = {
    adminPassword: 'quizmaster2024',
    rounds: [
        {
            id: 1,
            title: "Picture Round",
            description: "Can you identify these local landmarks?",
            type: "image",
            path: "rounds/round1.html"
        },
        {
            id: 2,
            title: "Christmas Trivia",
            description: "Test your Christmas knowledge!",
            type: "text",
            path: "rounds/round2.html"
        },
        {
            id: 3,
            title: "Christmas Music",
            description: "How well do you know your Christmas songs?",
            type: "text",
            path: "rounds/round3.html"
        },
        {
            id: 4,
            title: "Christmas Movies",
            description: "Test your Christmas movie knowledge!",
            type: "text",
            path: "rounds/round4.html"
        },
        {
            id: 5,
            title: "Christmas Traditions",
            description: "Explore Christmas traditions!",
            type: "text",
            path: "rounds/round5.html"
        }
    ]
};

class QuizState {
    constructor() {
        console.log('Initializing QuizState...');
        this.teams = {};
        this.loadState();
        console.log('QuizState initialized:', this.teams);
    }

    loadState() {
        try {
            console.log('Loading state from localStorage...');
            const savedState = localStorage.getItem('quizTeams');
            if (savedState) {
                this.teams = JSON.parse(savedState);
                console.log('State loaded:', this.teams);
            } else {
                console.log('No saved state found, using empty teams object');
                localStorage.setItem('quizTeams', JSON.stringify(this.teams));
            }
        } catch (error) {
            console.error('Error loading state:', error);
            this.teams = {};
            localStorage.setItem('quizTeams', JSON.stringify(this.teams));
        }
    }

    saveState() {
        try {
            console.log('Saving state:', this.teams);
            localStorage.setItem('quizTeams', JSON.stringify(this.teams));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    addTeam(teamName, password) {
        console.log('Adding/checking team:', teamName);
        if (this.teams[teamName]) {
            if (this.teams[teamName].password !== password) {
                throw new Error('Incorrect password!');
            }
        } else {
            this.teams[teamName] = {
                password,
                score: 0,
                currentRound: 1,
                roundsCompleted: {},
                answers: {}
            };
            this.saveState();
        }
        return this.teams[teamName];
    }

    updateTeamScore(teamName, roundId, questionId, isCorrect) {
        if (this.teams[teamName]) {
            const answerKey = `${roundId}-${questionId}`;
            if (!this.teams[teamName].answers[answerKey]) {
                if (isCorrect) {
                    this.teams[teamName].score += 1;
                }
                this.teams[teamName].answers[answerKey] = isCorrect;
                this.saveState();
            }
        }
    }

    completeRound(teamName, roundId) {
        if (this.teams[teamName]) {
            this.teams[teamName].roundsCompleted[roundId] = true;
            this.teams[teamName].currentRound = roundId + 1;
            this.saveState();
        }
    }

    getTeamProgress(teamName) {
        return this.teams[teamName] || null;
    }

    getRoundStatus(teamName, roundId) {
        if (!this.teams[teamName]) return null;
        return {
            completed: this.teams[teamName].roundsCompleted[roundId] || false,
            currentRound: this.teams[teamName].currentRound
        };
    }

    getLeaderboard() {
        return Object.entries(this.teams)
            .map(([name, data]) => ({
                name,
                score: data.score
            }))
            .sort((a, b) => b.score - a.score);
    }

    resetAllScores() {
        this.teams = {};
        this.saveState();
    }

    exportScores() {
        const csv = 'Team,Score\n' + 
            Object.entries(this.teams)
                .map(([team, data]) => `${team},${data.score}`)
                .join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'christmas-quiz-scores.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Export a function to create new QuizState instances
export function createQuizState() {
    console.log('Creating new QuizState instance...');
    return new QuizState();
}

export function updateProgress(currentQuestion, totalQuestions) {
    const progress = (currentQuestion / totalQuestions) * 100;
    const progressBar = document.getElementById('quiz-progress');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

export function updateRoundIndicators(currentRound, completedRounds) {
    for (let i = 1; i <= 5; i++) {
        const indicator = document.getElementById(`round${i}-indicator`);
        if (!indicator) continue;
        
        indicator.classList.remove('completed', 'current');
        if (completedRounds[i]) {
            indicator.classList.add('completed');
        } else if (i === currentRound) {
            indicator.classList.add('current');
        }
    }
}
