// ==================== ADMIN DASHBOARD ====================

function renderAdminDashboard() {
    const regularUsers = users.filter(u => u.role !== 'admin');
    const totalPoints = regularUsers.reduce((sum, u) => sum + u.totalPoints, 0);
    const totalPesoBalance = regularUsers.reduce((sum, u) => sum + u.totalPeso, 0);
    const totalEarned = regularUsers.reduce((sum, u) => sum + (u.totalEarned || 0), 0);
    const pendingCount = pendingUsers.length;
    const moderators = users.filter(u => u.role === 'moderator').length;
    const players = users.filter(u => u.role === 'user').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>👥 TOTAL USERS</h4><div class="value">${regularUsers.length}</div><div style="font-size:12px;">${players} Players | ${moderators} Mods</div></div>
            <div class="stat-card"><h4>⏳ PENDING ACCOUNTS</h4><div class="value">${pendingCount}</div><div style="font-size:12px;">Awaiting approval</div></div>
            <div class="stat-card"><h4>💰 TOTAL POINTS</h4><div class="value">${totalPoints.toLocaleString()}</div></div>
            <div class="stat-card"><h4>💵 TOTAL PHP BALANCE</h4><div class="value">₱${totalPesoBalance.toFixed(2)}</div></div>
        </div>
        <div class="dashboard-grid">
            <div class="stat-card"><h4>💎 LIFETIME EARNINGS</h4><div class="value">₱${totalEarned.toFixed(2)}</div></div>
            <div class="stat-card"><h4>🤝 TOTAL REFERRALS</h4><div class="value">${adminStats.totalReferrals}</div></div>
            <div class="stat-card"><h4>📋 COMPLETED QUESTS</h4><div class="value">${adminStats.completedQuests}</div></div>
            <div class="stat-card"><h4>💰 TOTAL INCOME</h4><div class="value">₱${adminStats.totalIncome.toFixed(2)}</div></div>
        </div>
        <div class="dashboard-grid">
            <div class="stat-card"><h4>🏦 TOTAL WITHDRAWALS</h4><div class="value">₱${adminStats.totalWithdrawals.toFixed(2)}</div></div>
            <div class="stat-card"><h4>⏳ PENDING WITHDRAWALS</h4><div class="value">₱${adminStats.pendingWithdrawals.toFixed(2)}</div></div>
            <div class="stat-card"><h4>📋 PENDING SUBMISSIONS</h4><div class="value">${pendingSubmissions}</div></div>
            <div class="stat-card"><h4>📊 NEW USERS (30d)</h4><div class="value">${regularUsers.filter(u => new Date(u.registeredDate) > new Date(Date.now() - 30*24*60*60*1000)).length}</div></div>
        </div>
    `;
}

// ==================== PENDING ACCOUNTS ====================

function renderAdminPendingAccounts() {
    return `
        <div class="data-table">
            <h3>⏳ Pending Account Approvals (${pendingUsers.length})</h3>
            ${pendingUsers.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Username</th><th>Role</th><th>Created By</th><th>Created Date</th><th>Initial Points</th><th>Referrer</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${pendingUsers.map(pending => `
                                <tr>
                                    <td>${pending.id}</td>
                                    <td><strong>${pending.username}</strong></td>
                                    <td><span class="role-badge user">🎮 Player</span></td>
                                    <td>${pending.createdBy} (${pending.createdByRole})</td>
                                    <td>${new Date(pending.registeredDate).toLocaleDateString()}</td>
                                    <td>${pending.totalPoints} pts</td>
                                    <td>${pending.referrerUsername || '-'}</td>
                                    <td>
                                        <textarea id="approve_notes_${pending.id}" placeholder="Admin notes..." style="width:100%; padding:5px; margin-bottom:5px; border-radius:5px;"></textarea>
                                        <button class="approve-btn" onclick="approvePendingAccount(${pending.id})">✅ Approve</button>
                                        <button class="reject-btn" onclick="rejectPendingAccount(${pending.id})">❌ Reject</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p>No pending accounts awaiting approval.</p>'}
        </div>
    `;
}

function approvePendingAccount(pendingId) {
    adminApproveAccount(pendingId);
    loadPage('pending-accounts');
}

function rejectPendingAccount(pendingId) {
    const notes = document.getElementById(`approve_notes_${pendingId}`)?.value || '';
    if (confirm(`Reject this account? ${notes ? `Reason: ${notes}` : 'No reason provided'}`)) {
        adminRejectAccount(pendingId, notes);
        loadPage('pending-accounts');
    }
}

// ==================== CREATE ACCOUNT ====================

function renderAdminCreateAccount() {
    const existingUsers = users.filter(u => u.role !== 'admin').map(u => u.username);
    
    return `
        <div class="data-table">
            <h3>➕ Create New User Account</h3>
            <form id="createAccountForm" onsubmit="event.preventDefault(); createUserAccount()">
                <div class="input-group"><label>Username *</label><input type="text" id="newUsername" required placeholder="min 3 characters"></div>
                <div class="input-group"><label>Password *</label><input type="password" id="newPassword" required placeholder="min 4 characters"></div>
                <div class="input-group"><label>Role *</label><select id="newRole"><option value="user">🎮 Player</option><option value="moderator">🛡️ Moderator</option></select></div>
                <div class="input-group"><label>Initial Points</label><input type="number" id="initialPoints" min="0" step="100" value="0"></div>
                <div class="input-group"><label>Referrer Username (Optional)</label><input type="text" id="referrerUsername" list="usersList" placeholder="Enter existing username"><datalist id="usersList">${existingUsers.map(u => `<option value="${u}">`).join('')}</datalist></div>
                <button type="submit" class="auth-btn">✅ Create Account</button>
            </form>
        </div>
    `;
}

function createUserAccount() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    const initialPoints = parseInt(document.getElementById('initialPoints').value) || 0;
    const referrerUsername = document.getElementById('referrerUsername').value;
    
    adminCreateAccount(username, password, role, initialPoints, referrerUsername);
    loadPage('create-account');
}

// ==================== MANAGE USERS ====================

function renderAdminManageUsers() {
    const regularUsers = users.filter(u => u.role !== 'admin');
    return `<div class="data-table"><h3>👥 Manage Users (${regularUsers.length})</h3><div style="overflow-x:auto;"><table><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Points</th><th>PHP</th><th>Referrals</th><th>Status</th><th>Actions</th></tr></thead><tbody>${regularUsers.map(user => `<tr style="${user.isBanned ? 'background:#ffe6e6' : ''}"><td>${user.id}</td><td><strong>${user.username}</strong><br><small>by ${user.registeredBy}</small></td><td><span class="role-badge ${user.role}">${user.role === 'moderator' ? '🛡️ Moderator' : '🎮 Player'}</span></td><td>${user.totalPoints.toLocaleString()}</td><td>₱${user.totalPeso.toFixed(2)}</td><td>${user.referrals?.length || 0}</td><td>${user.isBanned ? '<span class="status-rejected">⛔ Banned</span>' : '<span class="status-approved">✅ Active</span>'}</td><td><button class="approve-btn" onclick="resetUserPoints(${user.id})">Reset</button>${!user.isBanned ? `<button class="reject-btn" onclick="showBanModal(${user.id},'${user.username}')">Ban</button>` : `<button class="approve-btn" onclick="unbanUser(${user.id})">Unban</button>`}${user.role !== 'moderator' ? `<button class="approve-btn" onclick="promoteToModerator(${user.id})">Promote</button>` : `<button class="reject-btn" onclick="demoteToUser(${user.id})">Demote</button>`}<button class="reject-btn" onclick="deleteUser(${user.id})">Delete</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

function promoteToModerator(id) { const u = users.find(u => u.id === id); if(u && u.role !== 'admin') { u.role = 'moderator'; saveUsers(); showMessage(`✅ ${u.username} promoted to Moderator`); loadPage('manage-users'); } }
function demoteToUser(id) { const u = users.find(u => u.id === id); if(u && u.role === 'moderator') { u.role = 'user'; saveUsers(); showMessage(`⬇️ ${u.username} demoted to Player`); loadPage('manage-users'); } }
function showBanModal(id, name) { const modal = document.createElement('div'); modal.className = 'modal'; modal.innerHTML = `<div class="modal-content"><span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span><h3>⛔ Ban ${name}</h3><div class="input-group"><label>Duration</label><select id="banDuration"><option value="1">1 Hour</option><option value="3">3 Hours</option><option value="6">6 Hours</option><option value="12">12 Hours</option><option value="24">24 Hours</option><option value="48">48 Hours</option><option value="168">7 Days</option></select></div><div class="input-group"><label>Reason</label><textarea id="banReason" rows="3"></textarea></div><button class="auth-btn" onclick="banUser(${id})">Confirm Ban</button></div>`; document.body.appendChild(modal); }
function banUser(id) { const duration = parseInt(document.getElementById('banDuration').value); const reason = document.getElementById('banReason').value || 'Violation'; const u = users.find(u => u.id === id); if(u) { const until = new Date(); until.setHours(until.getHours() + duration); u.isBanned = true; u.banUntil = until.toISOString(); u.banReason = reason; saveUsers(); showMessage(`⛔ ${u.username} banned for ${duration} hours`); document.querySelector('.modal')?.remove(); loadPage('manage-users'); } }
function unbanUser(id) { const u = users.find(u => u.id === id); if(u) { u.isBanned = false; u.banUntil = null; u.banReason = null; saveUsers(); showMessage(`🔓 ${u.username} unbanned`); loadPage('manage-users'); } }
function resetUserPoints(id) { if(confirm('Reset points?')) { const u = users.find(u => u.id === id); if(u && u.username !== 'Admin2026') { u.totalPoints = 0; u.totalPeso = 0; u.todayPoints = 0; saveUsers(); showMessage(`Reset ${u.username}'s points`); loadPage('manage-users'); } } }
function deleteUser(id) { if(confirm('Permanently delete user?')) { const u = users.find(u => u.id === id); if(u && u.username !== 'Admin2026') { users = users.filter(u => u.id !== id); transactions = transactions.filter(t => t.userId !== id); submissions = submissions.filter(s => s.userId !== id); saveUsers(); saveTransactions(); saveSubmissions(); showMessage(`Deleted ${u.username}`); loadPage('manage-users'); } } }

// ==================== MANAGE QUESTS ====================

function renderAdminManageQuests() {
    return `
        <div class="data-table">
            <h3>✏️ Create New Quest</h3>
            <form onsubmit="event.preventDefault(); createQuest()">
                <div class="input-group"><label>Title</label><input type="text" id="qTitle" required></div>
                <div class="input-group"><label>Description</label><textarea id="qDesc" rows="2" required></textarea></div>
                <div class="input-group"><label>Steps (one per line)</label><textarea id="qSteps" rows="4" required></textarea></div>
                <div class="input-group"><label>Link (Optional)</label><input type="url" id="qLink"></div>
                <div class="input-group"><label>Points</label><input type="number" id="qPoints" required min="10" value="100"></div>
                <div class="input-group"><label>Category</label><select id="qCat"><option>Social Media</option><option>Learning</option><option>Survey</option><option>Download</option><option>Other</option></select></div>
                <button type="submit" class="auth-btn">Create Quest</button>
            </form>
        </div>
        
        <div class="data-table">
            <h3>📋 Existing Quests (Editable)</h3>
            <div style="overflow-x: auto;">
                <table>
                    <thead><tr><th>ID</th><th>Title</th><th>Points</th><th>Category</th><th>Status</th><th>Completions</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${quests.map(quest => {
                            const completions = submissions.filter(s => s.questId === quest.id && s.status === 'approved').length;
                            return `
                                <tr>
                                    <td>${quest.id}</td>
                                    <td><strong>${quest.title}</strong></td>
                                    <td>+${quest.points} pts</td>
                                    <td>${quest.category || 'General'}</td>
                                    <td><span class="status-${quest.isActive ? 'approved' : 'rejected'}">${quest.isActive ? '✅ Active' : '❌ Inactive'}</span></td>
                                    <td>${completions}</td>
                                    <td>
                                        <button class="edit-btn" onclick="editQuest(${quest.id})">✏️ Edit</button>
                                        <button class="approve-btn" onclick="toggleQuestStatus(${quest.id})">${quest.isActive ? 'Disable' : 'Enable'}</button>
                                        <button class="delete-btn" onclick="deleteQuest(${quest.id})">Delete</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function createQuest() {
    const steps = document.getElementById('qSteps').value.split('\n').filter(s => s.trim());
    quests.push({
        id: Date.now(),
        title: document.getElementById('qTitle').value,
        description: document.getElementById('qDesc').value,
        steps: steps,
        link: document.getElementById('qLink').value,
        points: parseInt(document.getElementById('qPoints').value),
        category: document.getElementById('qCat').value,
        createdAt: new Date().toISOString(),
        isActive: true,
        totalCompletions: 0
    });
    saveQuests();
    showMessage('Quest created!');
    loadPage('manage-quests');
}

function editQuest(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Edit Quest: ${quest.title}</h3>
            <form onsubmit="event.preventDefault(); updateQuest(${questId})">
                <div class="input-group"><label>Title</label><input type="text" id="editTitle" value="${quest.title.replace(/"/g, '&quot;')}" required></div>
                <div class="input-group"><label>Description</label><textarea id="editDesc" rows="2" required>${quest.description}</textarea></div>
                <div class="input-group"><label>Steps (one per line)</label><textarea id="editSteps" rows="4" required>${quest.steps.join('\n')}</textarea></div>
                <div class="input-group"><label>Link</label><input type="url" id="editLink" value="${quest.link || ''}"></div>
                <div class="input-group"><label>Points</label><input type="number" id="editPoints" value="${quest.points}" required min="10"></div>
                <div class="input-group"><label>Category</label><select id="editCat"><option ${quest.category === 'Social Media' ? 'selected' : ''}>Social Media</option><option ${quest.category === 'Learning' ? 'selected' : ''}>Learning</option><option ${quest.category === 'Survey' ? 'selected' : ''}>Survey</option><option ${quest.category === 'Download' ? 'selected' : ''}>Download</option><option ${quest.category === 'Other' ? 'selected' : ''}>Other</option></select></div>
                <button type="submit" class="auth-btn">Save Changes</button>
                <button type="button" class="auth-btn" onclick="this.closest('.modal').remove()" style="background:#95a5a6; margin-top:5px;">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function updateQuest(questId) {
    const quest = quests.find(q => q.id === questId);
    if (quest) {
        quest.title = document.getElementById('editTitle').value;
        quest.description = document.getElementById('editDesc').value;
        quest.steps = document.getElementById('editSteps').value.split('\n').filter(s => s.trim());
        quest.link = document.getElementById('editLink').value;
        quest.points = parseInt(document.getElementById('editPoints').value);
        quest.category = document.getElementById('editCat').value;
        saveQuests();
        showMessage('Quest updated!');
        document.querySelector('.modal')?.remove();
        loadPage('manage-quests');
    }
}

function toggleQuestStatus(id) { const q = quests.find(q => q.id === id); if(q) { q.isActive = !q.isActive; saveQuests(); showMessage(`Quest ${q.isActive ? 'activated' : 'deactivated'}`); loadPage('manage-quests'); } }
function deleteQuest(id) { if(confirm('Delete quest?')) { quests = quests.filter(q => q.id !== id); saveQuests(); showMessage('Quest deleted'); loadPage('manage-quests'); } }

// ==================== APPROVE SUBMISSIONS ====================

function renderAdminApproveSubmissions() {
    const pending = submissions.filter(s => s.status === 'pending' && s.type === 'quest');
    return `<div class="dashboard-grid"><div class="stat-card"><h4>⏳ Pending Submissions</h4><div class="value">${pending.length}</div></div></div>${pending.map(sub => `<div class="data-table" style="margin-bottom:15px;"><h3>📋 ${sub.questTitle}</h3><p><strong>User:</strong> ${sub.username}</p><p><strong>Submitted:</strong> ${new Date(sub.submittedAt).toLocaleString()}</p><p><strong>Points:</strong> +${sub.points} pts</p><p><strong>Comments:</strong> ${sub.comments || 'None'}</p>${sub.proofLink ? `<p><strong>Link:</strong> <a href="${sub.proofLink}" target="_blank">${sub.proofLink}</a></p>` : ''}${sub.proofImage ? `<img src="${sub.proofImage}" style="max-width:200px;border-radius:10px;cursor:pointer;" onclick="viewProofImage('${sub.proofImage}')">` : ''}<textarea id="notes_${sub.id}" placeholder="Admin notes..." style="width:100%;padding:8px;margin:10px 0;border-radius:8px;"></textarea><button class="approve-btn" onclick="approveSubmission(${sub.id})">✅ Approve (+${sub.points} pts)</button><button class="reject-btn" onclick="rejectSubmission(${sub.id})">❌ Reject</button></div>`).join('') || '<div class="data-table"><p>No pending submissions.</p></div>'}`;
}

function approveSubmission(id) { const sub = submissions.find(s => s.id === id); if(!sub) return; const notes = document.getElementById(`notes_${id}`)?.value||''; const user = users.find(u=>u.id===sub.userId); if(user){ user.totalPoints += sub.points; user.todayPoints += sub.points; user.totalEarned = (user.totalEarned||0)+(sub.points/CONVERSION_RATE); sub.status='approved'; sub.adminNotes=notes; transactions.push({id:Date.now(), userId:user.id, type:'quest_reward', questTitle:sub.questTitle, points:sub.points, date:new Date().toISOString()}); saveUsers(); saveSubmissions(); saveTransactions(); updateAdminStats(); showMessage(`Approved! +${sub.points} points`); loadPage('approve-submissions'); } }
function rejectSubmission(id) { const sub = submissions.find(s=>s.id===id); if(!sub) return; const notes = document.getElementById(`notes_${id}`)?.value||'Proof does not meet requirements'; sub.status='rejected'; sub.adminNotes=notes; saveSubmissions(); showMessage('Submission rejected'); loadPage('approve-submissions'); }

// ==================== APPROVE WITHDRAWALS ====================

function renderAdminApproveWithdrawals() {
    const pending = transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');
    const totalPending = pending.reduce((sum, w) => sum + w.amount, 0);
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>💰 Pending Withdrawals</h4><div class="value">₱${totalPending.toFixed(2)}</div><div style="font-size:12px;">${pending.length} requests</div></div>
            <div class="stat-card"><h4>✅ Total Processed</h4><div class="value">₱${adminStats.totalWithdrawals.toFixed(2)}</div></div>
        </div>
        
        ${pending.map(w => {
            const user = users.find(u => u.id === w.userId);
            return `
                <div class="data-table" style="margin-bottom: 15px;">
                    <h3>💰 Withdrawal Request #${w.id}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin-bottom: 15px;">
                        <div><strong>User:</strong> ${user?.username || 'Unknown'}</div>
                        <div><strong>Amount:</strong> <span style="color: #2ecc71; font-size: 20px;">₱${w.amount.toFixed(2)}</span></div>
                        <div><strong>Method:</strong> ${w.paymentMethod === 'gcash' ? '📱 GCash' : '💳 Maya'}</div>
                        <div><strong>Account Name:</strong> ${w.accountName}</div>
                        <div><strong>Account Number:</strong> ${w.accountNumber}</div>
                        <div><strong>Requested:</strong> ${new Date(w.date).toLocaleString()}</div>
                    </div>
                    <div class="input-group">
                        <label>Admin Notes</label>
                        <textarea id="withdraw_notes_${w.id}" rows="2" placeholder="Add notes about this withdrawal..." style="width:100%; padding:8px; border-radius:8px; border:1px solid #ddd;"></textarea>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="approve-btn" onclick="handleApproveWithdrawal(${w.id})">✅ Approve & Send Payment</button>
                        <button class="reject-btn" onclick="handleRejectWithdrawal(${w.id})">❌ Reject & Refund</button>
                    </div>
                </div>
            `;
        }).join('') || '<div class="data-table"><p>No pending withdrawal requests.</p></div>'}
    `;
}

function handleApproveWithdrawal(transactionId) {
    const notes = document.getElementById(`withdraw_notes_${transactionId}`)?.value || '';
    if (confirm(`Approve this withdrawal? ${notes ? `Notes: ${notes}` : ''}`)) {
        adminApproveWithdrawal(transactionId);
        loadPage('approve-withdrawals');
    }
}

function handleRejectWithdrawal(transactionId) {
    const notes = document.getElementById(`withdraw_notes_${transactionId}`)?.value || '';
    const reason = prompt('Reason for rejection:', notes || 'Does not meet requirements');
    if (reason !== null) {
        adminRejectWithdrawal(transactionId, reason);
        loadPage('approve-withdrawals');
    }
}

// ==================== MODERATOR FUNCTIONS ====================

function renderModeratorCreateAccount() {
    const existingUsers = users.filter(u => u.role !== 'admin').map(u => u.username);
    return `
        <div class="data-table">
            <h3>➕ Request New User Account (Pending Admin Approval)</h3>
            <div style="background:#fff3cd; padding:10px; border-radius:8px; margin-bottom:15px;">⚠️ Accounts created by moderators require admin approval before users can login.</div>
            <form id="createAccountForm" onsubmit="event.preventDefault(); createModeratorAccount()">
                <div class="input-group"><label>Username *</label><input type="text" id="newUsername" required placeholder="min 3 characters"></div>
                <div class="input-group"><label>Password *</label><input type="password" id="newPassword" required placeholder="min 4 characters"></div>
                <div class="input-group"><label>Initial Points</label><input type="number" id="initialPoints" min="0" step="100" value="0"></div>
                <div class="input-group"><label>Referrer Username (Optional)</label><input type="text" id="referrerUsername" list="usersList" placeholder="Enter existing username"><datalist id="usersList">${existingUsers.map(u => `<option value="${u}">`).join('')}</datalist></div>
                <button type="submit" class="auth-btn">📤 Submit for Admin Approval</button>
            </form>
        </div>
    `;
}

function createModeratorAccount() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const initialPoints = parseInt(document.getElementById('initialPoints').value) || 0;
    const referrerUsername = document.getElementById('referrerUsername').value;
    moderatorCreateAccount(username, password, initialPoints, referrerUsername);
    loadPage('create-account');
}

function renderModeratorPendingRequests() {
    const myRequests = pendingUsers.filter(p => p.createdBy === currentUser.username);
    return `
        <div class="data-table">
            <h3>⏳ My Pending Account Requests (${myRequests.length})</h3>
            ${myRequests.length > 0 ? myRequests.map(p => `
                <div style="padding:12px; border-bottom:1px solid #eee;">
                    <strong>${p.username}</strong><br>
                    Created: ${new Date(p.registeredDate).toLocaleString()}<br>
                    Points: ${p.totalPoints} pts | Referrer: ${p.referrerUsername || 'None'}<br>
                    Status: <span class="status-pending">⏳ Pending Approval</span>
                </div>
            `).join('') : '<p>No pending requests.</p>'}
        </div>
    `;
}

function renderModeratorApproveSubmissions() {
    const pending = submissions.filter(s => s.status === 'pending' && s.type === 'quest');
    return `<div class="dashboard-grid"><div class="stat-card"><h4>⏳ Pending Submissions</h4><div class="value">${pending.length}</div></div></div>${pending.map(sub => `<div class="data-table" style="margin-bottom:15px;"><h3>📋 ${sub.questTitle}</h3><p><strong>User:</strong> ${sub.username}</p><p><strong>Submitted:</strong> ${new Date(sub.submittedAt).toLocaleString()}</p><p><strong>Points:</strong> +${sub.points} pts</p><p><strong>Comments:</strong> ${sub.comments || 'None'}</p>${sub.proofLink ? `<p><strong>Link:</strong> <a href="${sub.proofLink}" target="_blank">${sub.proofLink}</a></p>` : ''}${sub.proofImage ? `<img src="${sub.proofImage}" style="max-width:200px;border-radius:10px;cursor:pointer;" onclick="viewProofImage('${sub.proofImage}')">` : ''}<textarea id="notes_${sub.id}" placeholder="Moderator notes..." style="width:100%;padding:8px;margin:10px 0;border-radius:8px;"></textarea><button class="approve-btn" onclick="moderatorApproveSubmission(${sub.id})">✅ Approve (+${sub.points} pts)</button><button class="reject-btn" onclick="moderatorRejectSubmission(${sub.id})">❌ Reject</button></div>`).join('') || '<div class="data-table"><p>No pending submissions.</p></div>'}`;
}

function moderatorApproveSubmission(id) { approveSubmission(id); }
function moderatorRejectSubmission(id) { rejectSubmission(id); }

// Make functions globally available
window.renderAdminDashboard = renderAdminDashboard;
window.renderAdminPendingAccounts = renderAdminPendingAccounts;
window.renderAdminCreateAccount = renderAdminCreateAccount;
window.renderAdminManageUsers = renderAdminManageUsers;
window.renderAdminManageQuests = renderAdminManageQuests;
window.renderAdminApproveSubmissions = renderAdminApproveSubmissions;
window.renderAdminApproveWithdrawals = renderAdminApproveWithdrawals;
window.renderModeratorCreateAccount = renderModeratorCreateAccount;
window.renderModeratorPendingRequests = renderModeratorPendingRequests;
window.renderModeratorApproveSubmissions = renderModeratorApproveSubmissions;
window.approvePendingAccount = approvePendingAccount;
window.rejectPendingAccount = rejectPendingAccount;
window.createUserAccount = createUserAccount;
window.createModeratorAccount = createModeratorAccount;
window.promoteToModerator = promoteToModerator;
window.demoteToUser = demoteToUser;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.showBanModal = showBanModal;
window.resetUserPoints = resetUserPoints;
window.deleteUser = deleteUser;
window.createQuest = createQuest;
window.editQuest = editQuest;
window.updateQuest = updateQuest;
window.toggleQuestStatus = toggleQuestStatus;
window.deleteQuest = deleteQuest;
window.approveSubmission = approveSubmission;
window.rejectSubmission = rejectSubmission;
window.moderatorApproveSubmission = moderatorApproveSubmission;
window.moderatorRejectSubmission = moderatorRejectSubmission;
window.handleApproveWithdrawal = handleApproveWithdrawal;
window.handleRejectWithdrawal = handleRejectWithdrawal;