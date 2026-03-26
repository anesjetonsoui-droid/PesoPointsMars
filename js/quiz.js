let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let quizScore = 0;
let quizAnswers = [];
let quizStartTime = null;

function renderQuizPage() {
    const completedQuizzes = submissions.filter(s => s.type === 'quiz' && s.userId === currentUser.id && s.status === 'approved');
    const totalPointsEarned = completedQuizzes.reduce((sum, q) => sum + q.pointsEarned, 0);
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>🎮 Quizzes Taken</h4><div class="value">${completedQuizzes.length}</div></div>
            <div class="stat-card"><h4>🏆 Points Earned</h4><div class="value">${totalPointsEarned.toLocaleString()}</div></div>
            <div class="stat-card"><h4>💰 PHP Value</h4><div class="value">₱${(totalPointsEarned / CONVERSION_RATE).toFixed(2)}</div></div>
            <div class="stat-card"><h4>📊 Questions Pool</h4><div class="value">50</div><div style="font-size:12px;">Random 10 each time</div></div>
        </div>
        
        <div class="quiz-info-card">
            <div class="quiz-header-info"><h2>🎯 Programming Quiz</h2><p>Test your knowledge! Each quiz gives 10 random questions.</p></div>
            <div class="quiz-stats-info">
                <div class="stat-item"><span class="stat-label">📚 Categories:</span><span>HTML, CSS, JavaScript, Python, Concepts</span></div>
                <div class="stat-item"><span class="stat-label">🎯 Points:</span><span>Easy: 10 pts | Medium: 20 pts</span></div>
                <div class="stat-item"><span class="stat-label">🔄 Each Game:</span><span>10 Random Questions</span></div>
            </div>
            <button class="auth-btn start-quiz-btn-large" onclick="startRandomQuiz()">🎮 Start Random Quiz (10 Questions)</button>
        </div>
        
        <div class="data-table">
            <h3>📊 Your Quiz History</h3>
            ${completedQuizzes.length > 0 ? completedQuizzes.slice(0, 10).map(quiz => `
                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div><strong>${new Date(quiz.completedAt).toLocaleDateString()}</strong><br>Score: ${quiz.score}/${quiz.totalPossiblePoints}</div>
                    <div><span style="color:#2ecc71;">+${quiz.pointsEarned} pts</span><br><button class="view-details-btn" onclick="viewQuizDetails(${quiz.id})">View</button></div>
                </div>
            `).join('') : '<p>No quizzes taken yet. Click "Start Random Quiz" to begin!</p>'}
        </div>
    `;
}

function startRandomQuiz() {
    const shuffled = [...QUESTION_DATABASE];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    currentQuizQuestions = shuffled.slice(0, 10);
    currentQuestionIndex = 0;
    quizScore = 0;
    quizAnswers = [];
    quizStartTime = new Date();
    showQuizQuestion();
}

function showQuizQuestion() {
    if (!currentQuizQuestions || currentQuestionIndex >= currentQuizQuestions.length) { finishQuiz(); return; }
    const q = currentQuizQuestions[currentQuestionIndex];
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content quiz-modal">
            <span class="close-modal" onclick="closeQuiz()">&times;</span>
            <div class="quiz-header"><div class="quiz-progress">Question ${currentQuestionIndex+1}/${currentQuizQuestions.length}</div><div class="quiz-points">🎯 ${q.points} pts</div></div>
            <div class="quiz-category-badge ${q.difficulty}">${q.category} • ${q.difficulty.toUpperCase()}</div>
            <h3 class="quiz-question">${q.question}</h3>
            <div class="quiz-options">${q.options.map((opt, idx) => `<button class="quiz-option" onclick="selectAnswer(${idx})"><span class="option-letter">${String.fromCharCode(65+idx)}.</span><span class="option-text">${opt}</span></button>`).join('')}</div>
        </div>`;
    document.body.appendChild(modal);
}

function selectAnswer(selected) {
    const q = currentQuizQuestions[currentQuestionIndex];
    const isCorrect = selected === q.correct;
    if (isCorrect) { quizScore += q.points; showMessage(`✅ Correct! +${q.points} points`); }
    else { showMessage(`❌ Wrong! Correct: ${q.options[q.correct]}`, true); }
    quizAnswers.push({...q, selected: selected, selectedText: q.options[selected], isCorrect: isCorrect, pointsEarned: isCorrect ? q.points : 0});
    currentQuestionIndex++;
    document.querySelector('.modal')?.remove();
    if (currentQuestionIndex < currentQuizQuestions.length) showQuizQuestion();
    else finishQuiz();
}

function finishQuiz() {
    const totalPossible = currentQuizQuestions.reduce((sum, q) => sum + q.points, 0);
    const submission = {
        id: Date.now(), type: 'quiz', userId: currentUser.id, username: currentUser.username,
        questions: quizAnswers, score: quizScore, totalPossiblePoints: totalPossible,
        pointsEarned: quizScore, percentage: (quizScore / totalPossible) * 100,
        completedAt: new Date().toISOString(), duration: Math.round((new Date() - quizStartTime) / 1000), status: 'approved'
    };
    submissions.push(submission);
    currentUser.totalPoints += quizScore;
    currentUser.todayPoints += quizScore;
    currentUser.totalEarned = (currentUser.totalEarned || 0) + (quizScore / CONVERSION_RATE);
    transactions.push({ id: Date.now(), userId: currentUser.id, type: 'quiz_reward', points: quizScore, date: new Date().toISOString() });
    saveUsers(); saveSubmissions(); saveTransactions();
    showQuizResults(submission);
}

function showQuizResults(sub) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content quiz-results-modal">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div class="results-header"><h2>🎉 Quiz Completed!</h2><div class="score-circle"><span class="score-number">${sub.score}</span><span class="score-total">/${sub.totalPossiblePoints}</span></div><div class="score-percentage">${Math.round(sub.percentage)}% Correct</div></div>
            <div class="results-stats"><div class="stat"><strong>💰 Points Earned:</strong> <span style="color:#2ecc71;">+${sub.pointsEarned} pts</span></div><div class="stat"><strong>⏱️ Time:</strong> ${Math.floor(sub.duration/60)}m ${sub.duration%60}s</div></div>
            <div class="answers-review"><h3>📝 Answer Review</h3>${sub.questions.map((q, i) => `<div class="answer-item ${q.isCorrect ? 'correct' : 'incorrect'}"><div class="answer-question"><strong>${i+1}. ${q.question}</strong>${q.isCorrect ? '<span class="badge-correct">✓ Correct</span>' : '<span class="badge-wrong">✗ Wrong</span>'}</div><div class="answer-details"><div>Your answer: <span class="${q.isCorrect ? 'correct-text' : 'wrong-text'}">${q.selectedText}</span></div>${!q.isCorrect ? `<div>Correct: <span class="correct-text">${q.options[q.correct]}</span></div>` : ''}<div class="explanation">💡 ${q.explanation}</div></div></div>`).join('')}</div>
            <div class="quiz-actions"><button class="auth-btn" onclick="closeResultsAndRefresh()">Continue</button><button class="auth-btn secondary" onclick="startRandomQuiz()">🎮 Play Again</button></div>
        </div>`;
    document.body.appendChild(modal);
}

function closeResultsAndRefresh() { document.querySelector('.modal')?.remove(); loadPage('quiz'); }
function closeQuiz() { document.querySelector('.modal')?.remove(); showMessage('Quiz cancelled.', true); }
function viewQuizDetails(id) { const quiz = submissions.find(s => s.id === id); if(!quiz) return;
    const modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content"><span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span><h2>Quiz Results</h2><div class="results-stats"><div class="stat"><strong>Date:</strong> ${new Date(quiz.completedAt).toLocaleString()}</div><div class="stat"><strong>Score:</strong> ${quiz.score}/${quiz.totalPossiblePoints}</div><div class="stat"><strong>Time:</strong> ${Math.floor(quiz.duration/60)}m ${quiz.duration%60}s</div></div><div class="answers-review">${quiz.questions.map((q,i)=>`<div class="answer-item ${q.isCorrect?'correct':'incorrect'}"><strong>${i+1}. ${q.question}</strong><br>Your answer: ${q.selectedText}<br>${!q.isCorrect?`Correct: ${q.options[q.correct]}<br>`:''}<div class="explanation">${q.explanation}</div></div>`).join('')}</div></div>`;
    document.body.appendChild(modal);
}