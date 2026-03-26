function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        if (isUserBanned(user)) {
            const banExpiry = new Date(user.banUntil).toLocaleString();
            showMessage(`⛔ ACCOUNT BANNED! Reason: ${user.banReason || 'Violation of terms'}. Ban expires: ${banExpiry}`, true);
            return;
        }
        
        currentUser = user;
        
        document.getElementById('authPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        
        updateSidebar();
        
        if (currentUser.role === 'admin') {
            loadPage('admin-dashboard');
            showMessage(`Welcome, Administrator ${currentUser.username}!`);
        } else {
            loadPage('dashboard');
            showMessage(`Welcome back, ${currentUser.username}!`);
        }
    } else {
        const pendingUser = pendingUsers.find(u => u.username === username && u.password === password);
        
        if (pendingUser) {
            showMessage(`⏳ Your account is pending admin approval. Please wait for confirmation.`, true);
        } else {
            showMessage('Invalid username or password!', true);
        }
    }
}

function logout() {
    currentUser = null;
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    showMessage('Logged out successfully!');
}

function updateSidebar() {
    if (!currentUser) return;
    
    document.getElementById('sidebarUsername').innerHTML = `👤 ${currentUser.username}`;
    
    let roleDisplay = '';
    if (currentUser.role === 'admin') {
        roleDisplay = '👑 Administrator';
    } else if (currentUser.role === 'moderator') {
        roleDisplay = '🛡️ Moderator';
    } else {
        roleDisplay = '🎮 Player';
    }
    document.getElementById('sidebarRole').innerHTML = roleDisplay;
    
    const referralCount = currentUser.referrals ? currentUser.referrals.length : 0;
    const referralInfo = document.getElementById('sidebarReferral');
    if (referralInfo) {
        referralInfo.innerHTML = `🤝 Referrals: ${referralCount} | Code: ${currentUser.referralCode}`;
    }
    
    const adminItems = document.querySelectorAll('.admin-only');
    adminItems.forEach(item => {
        item.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    });
    
    const moderatorItems = document.querySelectorAll('.moderator-only');
    moderatorItems.forEach(item => {
        item.style.display = currentUser.role === 'moderator' ? 'block' : 'none';
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// Admin creates account (instant approval)
function adminCreateAccount(username, password, role, initialPoints = 0, referrerUsername = null) {
    if (currentUser.role !== 'admin') {
        showMessage('Only administrators can create accounts!', true);
        return false;
    }
    
    if (!username || !password) {
        showMessage('Username and password required!', true);
        return false;
    }
    
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters!', true);
        return false;
    }
    
    if (password.length < 4) {
        showMessage('Password must be at least 4 characters!', true);
        return false;
    }
    
    if (users.find(u => u.username === username)) {
        showMessage('Username already exists!', true);
        return false;
    }
    
    const allowedRoles = ['user', 'moderator'];
    if (!allowedRoles.includes(role)) {
        showMessage('Invalid role!', true);
        return false;
    }
    
    const newUser = {
        id: users.length + 1,
        username: username,
        password: password,
        role: role,
        totalPoints: initialPoints,
        totalPeso: 0,
        todayPoints: initialPoints,
        totalEarned: 0,
        lastResetDate: new Date().toDateString(),
        referralCode: generateReferralCode(username),
        referredBy: null,
        referrals: [],
        registeredDate: new Date().toISOString(),
        registeredBy: currentUser.username,
        isBanned: false,
        banUntil: null,
        banReason: null
    };
    
    users.push(newUser);
    
    if (referrerUsername) {
        const referrer = users.find(u => u.username === referrerUsername);
        if (referrer && referrer.id !== newUser.id) {
            newUser.totalPoints += REFERRED_BONUS;
            newUser.todayPoints += REFERRED_BONUS;
            referrer.totalPoints += REFERRAL_BONUS;
            referrer.referrals = referrer.referrals || [];
            referrer.referrals.push(newUser.id);
            referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;
            referrer.referralBonusPoints = (referrer.referralBonusPoints || 0) + REFERRAL_BONUS;
            
            transactions.push({
                id: Date.now(),
                type: 'referral_bonus',
                referrerId: referrer.id,
                referredId: newUser.id,
                referrerBonus: REFERRAL_BONUS,
                referredBonus: REFERRED_BONUS,
                date: new Date().toISOString(),
                status: 'approved'
            });
            
            showMessage(`✅ Account created! ${username} got ${REFERRED_BONUS} points, ${referrer.username} got ${REFERRAL_BONUS} points`);
        }
    }
    
    saveUsers();
    saveTransactions();
    updateAdminStats();
    showMessage(`✅ Account created! Username: ${username} | Role: ${role}`);
    return true;
}

// Moderator creates pending account
function moderatorCreateAccount(username, password, initialPoints = 0, referrerUsername = null) {
    if (currentUser.role !== 'moderator') {
        showMessage('Only moderators can create pending accounts!', true);
        return false;
    }
    
    if (!username || !password) {
        showMessage('Username and password required!', true);
        return false;
    }
    
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters!', true);
        return false;
    }
    
    if (password.length < 4) {
        showMessage('Password must be at least 4 characters!', true);
        return false;
    }
    
    if (users.find(u => u.username === username)) {
        showMessage('Username already exists!', true);
        return false;
    }
    
    if (pendingUsers.find(u => u.username === username)) {
        showMessage('Username already pending approval!', true);
        return false;
    }
    
    const pendingUser = {
        id: pendingUsers.length + 1,
        username: username,
        password: password,
        role: 'user',
        totalPoints: initialPoints,
        totalPeso: 0,
        todayPoints: initialPoints,
        totalEarned: 0,
        referralCode: generateReferralCode(username),
        referredBy: null,
        referrals: [],
        registeredDate: new Date().toISOString(),
        registeredBy: currentUser.username,
        createdBy: currentUser.username,
        createdByRole: currentUser.role,
        status: 'pending',
        referrerUsername: referrerUsername || null
    };
    
    pendingUsers.push(pendingUser);
    savePendingUsers();
    
    showMessage(`✅ Account request submitted for ${username}! Waiting for admin approval.`);
    return true;
}

// Admin approves pending account
function adminApproveAccount(pendingId) {
    if (currentUser.role !== 'admin') {
        showMessage('Only administrators can approve accounts!', true);
        return false;
    }
    
    const pendingUser = pendingUsers.find(u => u.id === pendingId);
    if (!pendingUser) {
        showMessage('Pending account not found!', true);
        return false;
    }
    
    const newUser = {
        id: users.length + 1,
        username: pendingUser.username,
        password: pendingUser.password,
        role: pendingUser.role,
        totalPoints: pendingUser.totalPoints,
        totalPeso: 0,
        todayPoints: pendingUser.totalPoints,
        totalEarned: 0,
        lastResetDate: new Date().toDateString(),
        referralCode: pendingUser.referralCode,
        referredBy: null,
        referrals: [],
        registeredDate: new Date().toISOString(),
        registeredBy: pendingUser.registeredBy,
        isBanned: false,
        banUntil: null,
        banReason: null
    };
    
    users.push(newUser);
    
    if (pendingUser.referrerUsername) {
        const referrer = users.find(u => u.username === pendingUser.referrerUsername);
        if (referrer && referrer.id !== newUser.id) {
            newUser.totalPoints += REFERRED_BONUS;
            newUser.todayPoints += REFERRED_BONUS;
            referrer.totalPoints += REFERRAL_BONUS;
            referrer.referrals = referrer.referrals || [];
            referrer.referrals.push(newUser.id);
            referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;
            referrer.referralBonusPoints = (referrer.referralBonusPoints || 0) + REFERRAL_BONUS;
            
            transactions.push({
                id: Date.now(),
                type: 'referral_bonus',
                referrerId: referrer.id,
                referredId: newUser.id,
                referrerBonus: REFERRAL_BONUS,
                referredBonus: REFERRED_BONUS,
                date: new Date().toISOString(),
                status: 'approved'
            });
        }
    }
    
    pendingUsers = pendingUsers.filter(u => u.id !== pendingId);
    savePendingUsers();
    saveUsers();
    saveTransactions();
    updateAdminStats();
    
    showMessage(`✅ Account approved! ${newUser.username} can now login.`);
    return true;
}

function adminRejectAccount(pendingId, reason = '') {
    if (currentUser.role !== 'admin') {
        showMessage('Only administrators can reject accounts!', true);
        return false;
    }
    
    const pendingUser = pendingUsers.find(u => u.id === pendingId);
    if (!pendingUser) return false;
    
    pendingUsers = pendingUsers.filter(u => u.id !== pendingId);
    savePendingUsers();
    
    showMessage(`❌ Account for ${pendingUser.username} rejected. ${reason ? `Reason: ${reason}` : ''}`);
    return true;
}

function adminLogin(username, password) {
    if (username === 'Admin2026' && password === 'Marceljablo2003@') {
        const admin = users.find(u => u.username === 'Admin2026');
        if (admin) {
            currentUser = admin;
            document.getElementById('authPage').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
            updateSidebar();
            loadPage('admin-dashboard');
            showMessage('Welcome, Administrator!');
            return true;
        }
    }
    return false;
}

window.adminCreateAccount = adminCreateAccount;
window.moderatorCreateAccount = moderatorCreateAccount;
window.adminApproveAccount = adminApproveAccount;
window.adminRejectAccount = adminRejectAccount;
window.adminLogin = adminLogin;