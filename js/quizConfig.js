// Quiz Configuration and Utilities
export const quizConfig = {
    adminPassword: 'quizmaster2024',
    rounds: [
        {
            id: 1,
            title: "Christmas Picture Round",
            description: "Can you identify these festive images? Each question shows a Christmas-themed picture - choose the correct answer from the options provided.",
            type: "image",
            path: "rounds/round1.html"
        },
        {
            id: 2,
            title: "Christmas Trivia",
            description: "Test your Christmas knowledge with these trivia questions!",
            type: "text",
            path: "rounds/round2.html"
        },
        {
            id: 3,
            title: "Christmas Music",
            description: "How well do you know your Christmas songs and carols?",
            type: "text",
            path: "rounds/round3.html"
        },
        {
            id: 4,
            title: "Christmas Movies",
            description: "Test your knowledge of classic Christmas films!",
            type: "text",
            path: "rounds/round4.html"
        },
        {
            id: 5,
            title: "Christmas Traditions",
            description: "Explore Christmas traditions from around the world!",
            type: "text",
            path: "rounds/round5.html"
        }
    ]
};

export class QuizState {
    constructor() {
        this.loadState();
    }

    loadState() {
        if (!localStorage.getItem('quizTeams')) {
            localStorage.setItem('quizTeams', JSON.stringify({}));
        }
        this.teams = JSON.parse(localStorage.getItem('quizTeams'));
    }

    saveState() {
        localStorage.setItem('quizTeams', JSON.stringify(this.teams));
    }

    addTeam(teamName, password) {
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
    }
}

export function updateProgress(currentQuestion, totalQuestions) {
    const progress = (currentQuestion / totalQuestions) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
}

export function updateRoundIndicators(currentRound, completedRounds) {
    for (let i = 1; i <= quizConfig.rounds.length; i++) {
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
