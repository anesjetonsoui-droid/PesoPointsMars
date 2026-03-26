// ==================== QUEST FUNCTIONS ====================

function getUserCompletedQuests(userId) {
    return submissions.filter(s => s.userId === userId && s.status === 'approved' && s.type === 'quest');
}

function getUserPendingSubmissions(userId) {
    return submissions.filter(s => s.userId === userId && s.status === 'pending' && s.type === 'quest');
}

function getAvailableQuests() {
    const completedQuests = getUserCompletedQuests(currentUser.id).map(s => s.questId);
    return quests.filter(q => q.isActive && !completedQuests.includes(q.id));
}

function renderDashboard() {
    const totalPoints = currentUser.totalPoints;
    const totalPeso = (totalPoints / CONVERSION_RATE).toFixed(2);
    const pendingSubmissions = getUserPendingSubmissions(currentUser.id).length;
    const completedQuests = getUserCompletedQuests(currentUser.id).length;
    const referralCount = currentUser.referrals ? currentUser.referrals.length : 0;
    const referralBonus = currentUser.referralBonusPoints || 0;
    
    // Get recent transactions
    const userTransactions = transactions.filter(t => t.userId === currentUser.id).slice(0, 5);
    
    // Get quiz stats
    const quizSubmissions = submissions.filter(s => s.type === 'quiz' && s.userId === currentUser.id && s.status === 'approved');
    const quizPoints = quizSubmissions.reduce((sum, q) => sum + q.pointsEarned, 0);
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>💰 TOTAL POINTS</h4><div class="value">${totalPoints.toLocaleString()}</div></div>
            <div class="stat-card"><h4>💵 PHP VALUE</h4><div class="value">₱${totalPeso}</div></div>
            <div class="stat-card"><h4>📋 QUESTS DONE</h4><div class="value">${completedQuests}</div></div>
            <div class="stat-card"><h4>🤝 REFERRALS</h4><div class="value">${referralCount}</div></div>
        </div>
        <div class="dashboard-grid">
            <div class="stat-card"><h4>⏳ PENDING</h4><div class="value">${pendingSubmissions}</div></div>
            <div class="stat-card"><h4>🎮 QUIZ POINTS</h4><div class="value">${quizPoints}</div></div>
            <div class="stat-card"><h4>🎁 REFERRAL BONUS</h4><div class="value">${referralBonus} pts</div></div>
            <div class="stat-card"><h4>🔄 NEXT REWARD</h4><div class="value">${100 - (totalPoints % 100)} pts</div></div>
        </div>
        
        <div class="data-table">
            <h3>📈 Recent Activity</h3>
            ${userTransactions.map(t => `
                <div style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>${new Date(t.date).toLocaleString()}</strong><br>
                    ${t.type === 'conversion' ? `💱 Converted ${t.points} points → ₱${t.peso}` : 
                      t.type === 'quest_reward' ? `📋 Quest Reward: +${t.points} points` :
                      t.type === 'quiz_reward' ? `🎮 Quiz Reward: +${t.points} points` :
                      t.type === 'referral_bonus' ? `🤝 Referral Bonus: +${t.referredBonus} points` :
                      `🏦 Withdrawal: ₱${t.amount} (${t.status === 'pending' ? 'Pending' : 'Approved'})`}
                </div>
            `).join('') || '<p>No transactions yet</p>'}
        </div>
    `;
}

function renderQuestsPage() {
    const availableQuests = getAvailableQuests();
    const pendingCount = getUserPendingSubmissions(currentUser.id).length;
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>📋 Available Quests</h4><div class="value">${availableQuests.length}</div></div>
            <div class="stat-card"><h4>⏳ Pending Approval</h4><div class="value">${pendingCount}</div></div>
            <div class="stat-card"><h4>✅ Completed</h4><div class="value">${getUserCompletedQuests(currentUser.id).length}</div></div>
        </div>
        
        <div class="quests-grid">
            ${availableQuests.length > 0 ? availableQuests.map(quest => `
                <div class="quest-card">
                    <div class="quest-header">
                        <span class="quest-category">${quest.category || 'General'}</span>
                        <span class="quest-points">+${quest.points} pts</span>
                    </div>
                    <h3>${quest.title}</h3>
                    <p>${quest.description}</p>
                    <div class="quest-steps">
                        <strong>Steps:</strong>
                        <ol>${quest.steps.map(s => `<li>${s}</li>`).join('')}</ol>
                    </div>
                    ${quest.link ? `<a href="${quest.link}" target="_blank" class="quest-link" style="display:inline-block; margin:10px 0; color:#3498db;">🔗 Visit Link</a><br>` : ''}
                    <button class="submit-proof-btn" onclick="showSubmissionForm(${quest.id})">📤 Submit Proof</button>
                </div>
            `).join('') : '<div class="stat-card" style="text-align:center; padding:40px;">🎉 No quests available. Check back later!</div>'}
        </div>
    `;
}

function showSubmissionForm(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Submit Proof: ${quest.title}</h3>
            <form id="submissionForm">
                <div class="input-group"><label>Comments (Optional)</label><textarea id="comments" rows="3" placeholder="Add any details..."></textarea></div>
                <div class="input-group"><label>Proof Link (Optional)</label><input type="url" id="proofLink" placeholder="https://..."></div>
                <div class="input-group"><label>Screenshot/Image</label><input type="file" id="proofImage" accept="image/*" required></div>
                <button type="submit" class="auth-btn">Submit for Review</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('submissionForm').onsubmit = (e) => { e.preventDefault(); submitQuestProof(questId); };
}

function submitQuestProof(questId) {
    const comments = document.getElementById('comments')?.value || '';
    const proofLink = document.getElementById('proofLink')?.value || '';
    const imageFile = document.getElementById('proofImage')?.files[0];
    
    if (!imageFile) {
        showMessage('Please upload proof image!', true);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const quest = quests.find(q => q.id === questId);
        submissions.push({
            id: Date.now(),
            type: 'quest',
            questId: questId,
            questTitle: quest.title,
            userId: currentUser.id,
            username: currentUser.username,
            points: quest.points,
            comments: comments,
            proofLink: proofLink,
            proofImage: e.target.result,
            submittedAt: new Date().toISOString(),
            status: 'pending',
            adminNotes: ''
        });
        saveSubmissions();
        showMessage(`✅ Proof submitted for "${quest.title}"!`);
        document.querySelector('.modal')?.remove();
        loadPage('my-submissions');
    };
    reader.readAsDataURL(imageFile);
}

function renderMySubmissionsPage() {
    const userSubmissions = submissions.filter(s => s.userId === currentUser.id).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>📤 TOTAL</h4><div class="value">${userSubmissions.length}</div></div>
            <div class="stat-card"><h4>⏳ PENDING</h4><div class="value">${userSubmissions.filter(s => s.status === 'pending').length}</div></div>
            <div class="stat-card"><h4>✅ APPROVED</h4><div class="value">${userSubmissions.filter(s => s.status === 'approved').length}</div></div>
            <div class="stat-card"><h4>❌ REJECTED</h4><div class="value">${userSubmissions.filter(s => s.status === 'rejected').length}</div></div>
        </div>
        
        <div class="data-table">
            <h3>📋 My Submissions</h3>
            ${userSubmissions.length > 0 ? userSubmissions.map(sub => `
                <div style="padding: 12px; border-bottom: 1px solid #eee;">
                    <strong>${sub.questTitle || (sub.type === 'quiz' ? 'Programming Quiz' : 'Submission')}</strong><br>
                    <small>${new Date(sub.submittedAt).toLocaleString()}</small><br>
                    Points: ${sub.points || sub.pointsEarned || 0} | Status: ${sub.status === 'pending' ? '⏳ Pending' : sub.status === 'approved' ? '✅ Approved' : '❌ Rejected'}<br>
                    ${sub.adminNotes ? `<small>Admin: ${sub.adminNotes}</small><br>` : ''}
                    ${sub.proofImage ? `<img src="${sub.proofImage}" style="max-width: 100px; border-radius: 8px; margin-top: 5px; cursor: pointer;" onclick="viewProofImage('${sub.proofImage}')">` : ''}
                </div>
            `).join('') : '<p>No submissions yet.</p>'}
        </div>
    `;
}

function viewProofImage(imageData) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content"><span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span><img src="${imageData}" style="width: 100%; border-radius: 10px;"></div>`;
    document.body.appendChild(modal);
}

// ==================== CONVERSION & WITHDRAWAL FUNCTIONS ====================

function renderUserConvertPage() {
    const totalPoints = currentUser.totalPoints;
    const pointsValue = (totalPoints / CONVERSION_RATE).toFixed(2);
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>💰 YOUR POINTS</h4><div class="value">${totalPoints.toLocaleString()}</div></div>
            <div class="stat-card"><h4>💵 PHP VALUE</h4><div class="value">₱${pointsValue}</div></div>
            <div class="stat-card"><h4>🔄 CONVERSION RATE</h4><div class="value">100 pts = ₱1</div></div>
            <div class="stat-card"><h4>♾️ LIMIT</h4><div class="value">UNLIMITED</div></div>
        </div>
        
        <div class="data-table">
            <h3>💱 Convert Points to PHP</h3>
            <div class="input-group">
                <label>Points to Convert (minimum 100)</label>
                <input type="number" id="convertAmount" min="100" step="100" placeholder="Enter points" max="${totalPoints}">
            </div>
            <div class="input-group">
                <label>Or enter PHP amount</label>
                <input type="number" id="convertPHP" min="1" step="1" placeholder="Enter PHP amount">
                <small>100 points = ₱1.00</small>
            </div>
            <button class="auth-btn" onclick="handleConvertPoints()">💸 Convert to PHP</button>
            <button class="auth-btn" onclick="handleConvertAllPoints()" style="background: linear-gradient(135deg, #3498db, #2980b9); margin-top: 10px;">🎯 Convert ALL Points</button>
            <div style="margin-top: 15px; padding: 12px; background: #e8f5e9; border-radius: 10px;">
                <small>✅ UNLIMITED CONVERSION - Convert any amount anytime!</small>
            </div>
        </div>
        
        <div class="data-table">
            <h3>📜 Conversion History</h3>
            ${transactions.filter(t => t.userId === currentUser.id && t.type === 'conversion').slice(0, 10).map(t => `
                <div style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>${new Date(t.date).toLocaleString()}</strong><br>
                    ${t.points.toLocaleString()} points → ₱${t.peso.toFixed(2)}
                </div>
            `).join('') || '<p>No conversions yet</p>'}
        </div>
    `;
}

function renderUserWithdrawPage() {
    const pending = transactions.filter(t => t.userId === currentUser.id && t.type === 'withdraw' && t.status === 'pending');
    const approved = transactions.filter(t => t.userId === currentUser.id && t.type === 'withdraw' && t.status === 'approved');
    const rejected = transactions.filter(t => t.userId === currentUser.id && t.type === 'withdraw' && t.status === 'rejected');
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>💰 AVAILABLE BALANCE</h4><div class="value">₱${currentUser.totalPeso.toFixed(2)}</div><div style="font-size: 12px;">Min: ₱10.00</div></div>
            <div class="stat-card"><h4>💎 TOTAL EARNED</h4><div class="value">₱${(currentUser.totalEarned || 0).toFixed(2)}</div></div>
        </div>
        
        <div class="data-table">
            <h3>🏦 Request Withdrawal</h3>
            <div class="input-group">
                <label>Select Payment Method</label>
                <select id="paymentMethod" onchange="togglePaymentFields()">
                    <option value="gcash">📱 GCash</option>
                    <option value="maya">💳 Maya</option>
                </select>
            </div>
            <div id="gcashFields">
                <div class="input-group"><label>GCash Account Name</label><input type="text" id="gcashAccountName" placeholder="e.g., Juan Dela Cruz"></div>
                <div class="input-group"><label>GCash Number</label><input type="text" id="gcashNumber" placeholder="09xxxxxxxxx"></div>
            </div>
            <div id="mayaFields" style="display: none;">
                <div class="input-group"><label>Maya Account Name</label><input type="text" id="mayaAccountName" placeholder="e.g., Maria Santos"></div>
                <div class="input-group"><label>Maya Number</label><input type="text" id="mayaNumber" placeholder="09xxxxxxxxx"></div>
            </div>
            <div class="input-group"><label>Amount (PHP)</label><input type="number" id="withdrawAmount" min="10" step="10" placeholder="Enter amount" max="${currentUser.totalPeso}"></div>
            <button class="auth-btn" onclick="handleRequestWithdrawal()">📤 Request Withdrawal</button>
            <div style="margin-top: 15px; padding: 12px; background: #fff3cd; border-radius: 10px;">
                <small>⚠️ Withdrawal requests require admin approval. Funds will be deducted immediately and refunded if rejected.</small>
            </div>
        </div>
        
        <div class="data-table">
            <h3>⏳ Pending Withdrawals (${pending.length})</h3>
            ${pending.map(w => `
                <div style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>₱${w.amount}</strong> - ${new Date(w.date).toLocaleString()}<br>
                    <small>${w.paymentMethod === 'gcash' ? '📱 GCash' : '💳 Maya'}: ${w.accountName} | ⏳ Pending Approval</small>
                </div>
            `).join('') || '<p>No pending withdrawals.</p>'}
        </div>
        
        <div class="data-table">
            <h3>✅ Approved Withdrawals (${approved.length})</h3>
            ${approved.map(w => `
                <div style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>₱${w.amount}</strong> - ${new Date(w.date).toLocaleString()}<br>
                    <small>${w.paymentMethod === 'gcash' ? '📱 GCash' : '💳 Maya'}: ${w.accountName} | ✅ Completed</small>
                </div>
            `).join('') || '<p>No approved withdrawals.</p>'}
        </div>
        
        <div class="data-table">
            <h3>❌ Rejected Withdrawals (${rejected.length})</h3>
            ${rejected.map(w => `
                <div style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>₱${w.amount}</strong> - ${new Date(w.date).toLocaleString()}<br>
                    <small>${w.paymentMethod === 'gcash' ? '📱 GCash' : '💳 Maya'}: ${w.accountName} | ❌ Rejected${w.rejectReason ? ` - ${w.rejectReason}` : ''}</small>
                </div>
            `).join('') || '<p>No rejected withdrawals.</p>'}
        </div>
    `;
}

function handleConvertPoints() {
    let amount = parseInt(document.getElementById('convertAmount')?.value);
    const phpAmount = parseInt(document.getElementById('convertPHP')?.value);
    
    if (phpAmount && phpAmount > 0 && !amount) {
        amount = phpAmount * CONVERSION_RATE;
    }
    
    if (!amount || amount < 100) {
        showMessage('Minimum 100 points to convert!', true);
        return;
    }
    
    userConvertPoints(amount);
    loadPage('convert');
}

function handleConvertAllPoints() {
    if (currentUser.totalPoints < 100) {
        showMessage(`Need at least 100 points to convert!`, true);
        return;
    }
    
    const amount = currentUser.totalPoints;
    const pesoAmount = amount / CONVERSION_RATE;
    
    if (confirm(`Convert ALL ${amount.toLocaleString()} points to ₱${pesoAmount.toFixed(2)}?`)) {
        userConvertPoints(amount);
        loadPage('convert');
    }
}

function handleRequestWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount')?.value);
    const method = document.getElementById('paymentMethod').value;
    let accountName = '', accountNumber = '';
    
    if (method === 'gcash') {
        accountName = document.getElementById('gcashAccountName')?.value;
        accountNumber = document.getElementById('gcashNumber')?.value;
    } else {
        accountName = document.getElementById('mayaAccountName')?.value;
        accountNumber = document.getElementById('mayaNumber')?.value;
    }
    
    if (!amount || amount < 10) {
        showMessage('Minimum withdrawal is ₱10.00!', true);
        return;
    }
    if (amount > currentUser.totalPeso) {
        showMessage(`Insufficient balance! You have ₱${currentUser.totalPeso.toFixed(2)}`, true);
        return;
    }
    if (!accountName) {
        showMessage('Please enter account name!', true);
        return;
    }
    if (!accountNumber || !/^[0-9]{10,11}$/.test(accountNumber.replace(/\D/g, ''))) {
        showMessage(`Please enter a valid ${method === 'gcash' ? 'GCash' : 'Maya'} number (10-11 digits)!`, true);
        return;
    }
    
    userRequestWithdrawal(amount, method, accountName, accountNumber);
    
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('gcashAccountName').value = '';
    document.getElementById('gcashNumber').value = '';
    document.getElementById('mayaAccountName').value = '';
    document.getElementById('mayaNumber').value = '';
    
    loadPage('withdraw');
}

function togglePaymentFields() {
    const method = document.getElementById('paymentMethod').value;
    const gcashFields = document.getElementById('gcashFields');
    const mayaFields = document.getElementById('mayaFields');
    
    if (gcashFields && mayaFields) {
        gcashFields.style.display = method === 'gcash' ? 'block' : 'none';
        mayaFields.style.display = method === 'maya' ? 'block' : 'none';
    }
}