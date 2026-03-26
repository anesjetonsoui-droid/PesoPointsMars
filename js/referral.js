function getReferralLeaderboard() {
    const referrers = users.filter(u => u.role !== 'admin' && (u.referrals && u.referrals.length > 0));
    return referrers.sort((a, b) => (b.referrals?.length || 0) - (a.referrals?.length || 0));
}

function renderReferralPage() {
    const referralCount = currentUser.referrals ? currentUser.referrals.length : 0;
    const totalBonus = currentUser.referralBonusPoints || 0;
    const leaderboard = getReferralLeaderboard();
    const userRank = leaderboard.findIndex(u => u.id === currentUser.id) + 1;
    
    const referredUsers = currentUser.referrals ? currentUser.referrals.map(id => users.find(u => u.id === id)).filter(u => u) : [];
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>YOUR RANK</h4><div class="value">#${userRank || 'N/A'}</div></div>
            <div class="stat-card"><h4>TOTAL REFERRALS</h4><div class="value">${referralCount}</div></div>
            <div class="stat-card"><h4>BONUS EARNED</h4><div class="value">${totalBonus} pts</div></div>
            <div class="stat-card"><h4>PHP VALUE</h4><div class="value">₱${(totalBonus / CONVERSION_RATE).toFixed(2)}</div></div>
        </div>
        
        <div class="data-table">
            <h3>✨ Your Referral Code</h3>
            <div class="referral-code-box">${currentUser.referralCode}</div>
            <button class="copy-btn" onclick="copyReferralCode()">📋 Copy Code</button>
            <button class="copy-btn" onclick="copyReferralLink()">🔗 Copy Link</button>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">Share your code! Each referral gives you 500 points and your friend 200 points.</p>
        </div>
        
        <div class="data-table">
            <h3>🏆 Referral Leaderboard</h3>
            ${leaderboard.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table>
                        <thead><tr><th>Rank</th><th>User</th><th>Referrals</th><th>Bonus</th></tr></thead>
                        <tbody>
                            ${leaderboard.slice(0, 10).map((user, i) => `
                                <tr ${user.id === currentUser.id ? 'style="background:#fff3cd;"' : ''}>
                                    <td>${i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</td>
                                    <td><strong>${user.username}</strong> ${user.id === currentUser.id ? '(You)' : ''}</td>
                                    <td>${user.referrals?.length || 0}</td>
                                    <td>+${user.referralBonusPoints || 0} pts</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p>No referrals yet. Share your code to earn bonuses!</p>'}
        </div>
        
        <div class="data-table">
            <h3>📋 Your Referrals (${referredUsers.length})</h3>
            ${referredUsers.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table>
                        <thead><tr><th>Username</th><th>Joined</th><th>Points</th></tr></thead>
                        <tbody>
                            ${referredUsers.map(user => `
                                <tr><td><strong>${user.username}</strong></td><td>${new Date(user.registeredDate).toLocaleDateString()}</td><td>${user.totalPoints} pts</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p>No referrals yet. Share your code!</p>'}
        </div>
    `;
}

function copyReferralCode() {
    navigator.clipboard.writeText(currentUser.referralCode);
    showMessage('Referral code copied!');
}

function copyReferralLink() {
    const link = `${window.location.origin}${window.location.pathname}?ref=${currentUser.referralCode}`;
    navigator.clipboard.writeText(link);
    showMessage('Referral link copied!');
}