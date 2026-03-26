// Database Configuration
const CONVERSION_RATE = 100;
const REFERRAL_BONUS = 500;
const REFERRED_BONUS = 200;

// Fixed Admin Account
const FIXED_ADMIN = {
    id: 1,
    username: 'Admin2026',
    password: 'Marceljablo2003@',
    role: 'admin',
    totalPoints: 0,
    totalPeso: 0,
    todayPoints: 0,
    totalEarned: 0,
    lastResetDate: new Date().toDateString(),
    referralCode: 'ADMIN2026',
    referredBy: null,
    referrals: [],
    totalReferrals: 0,
    referralBonusPoints: 0,
    registeredDate: new Date().toISOString(),
    registeredBy: 'System',
    isBanned: false,
    banUntil: null,
    banReason: null
};

let currentUser = null;
let users = [];
let pendingUsers = [];
let transactions = [];
let quests = [];
let submissions = [];
let adminStats = {
    totalIncome: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    totalUsers: 0,
    totalPoints: 0,
    totalReferrals: 0,
    completedQuests: 0
};

function initDatabase() {
    // Load users
    if (!localStorage.getItem('users')) {
        users = [FIXED_ADMIN];
        localStorage.setItem('users', JSON.stringify(users));
    } else {
        users = JSON.parse(localStorage.getItem('users'));
        const adminExists = users.find(u => u.username === 'Admin2026');
        if (!adminExists) {
            users.push(FIXED_ADMIN);
        }
        users.forEach(user => {
            if (!user.isBanned) user.isBanned = false;
            if (!user.banUntil) user.banUntil = null;
            if (!user.banReason) user.banReason = null;
            if (!user.totalEarned) user.totalEarned = 0;
            if (!user.registeredBy) user.registeredBy = 'System';
            if (!user.referrals) user.referrals = [];
            if (!user.totalReferrals) user.totalReferrals = 0;
            if (!user.referralBonusPoints) user.referralBonusPoints = 0;
        });
        saveUsers();
    }
    
    // Load pending users
    if (!localStorage.getItem('pendingUsers')) {
        pendingUsers = [];
        localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
    } else {
        pendingUsers = JSON.parse(localStorage.getItem('pendingUsers'));
    }
    
    // Load quests
    if (!localStorage.getItem('quests')) {
        quests = [
            {
                id: 1,
                title: "Follow on Facebook",
                description: "Follow our Facebook page to earn points!",
                steps: ["Click the link below", "Like and follow our page", "Take a screenshot", "Upload as proof"],
                link: "https://facebook.com",
                points: 100,
                category: "Social Media",
                createdAt: new Date().toISOString(),
                isActive: true,
                totalCompletions: 0
            },
            {
                id: 2,
                title: "Share on Social Media",
                description: "Share our website on your social media!",
                steps: ["Copy your referral link", "Share on Facebook/Twitter", "Take a screenshot", "Upload as proof"],
                link: "",
                points: 150,
                category: "Social Media",
                createdAt: new Date().toISOString(),
                isActive: true,
                totalCompletions: 0
            }
        ];
        localStorage.setItem('quests', JSON.stringify(quests));
    } else {
        quests = JSON.parse(localStorage.getItem('quests'));
    }
    
    // Load submissions
    if (!localStorage.getItem('submissions')) {
        localStorage.setItem('submissions', JSON.stringify([]));
    }
    submissions = JSON.parse(localStorage.getItem('submissions'));
    
    // Load transactions
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }
    transactions = JSON.parse(localStorage.getItem('transactions'));
    
    // Update daily resets
    const today = new Date().toDateString();
    users.forEach(user => {
        if (user.lastResetDate !== today) {
            user.todayPoints = 0;
            user.lastResetDate = today;
        }
    });
    
    updateAdminStats();
    saveUsers();
}

function updateAdminStats() {
    const regularUsers = users.filter(u => u.role !== 'admin');
    
    adminStats.totalUsers = regularUsers.length;
    adminStats.totalPoints = regularUsers.reduce((sum, u) => sum + u.totalPoints, 0);
    adminStats.totalReferrals = regularUsers.reduce((sum, u) => sum + (u.referrals?.length || 0), 0);
    adminStats.completedQuests = submissions.filter(s => s.type === 'quest' && s.status === 'approved').length;
    
    const allConversions = transactions.filter(t => t.type === 'conversion');
    adminStats.totalIncome = allConversions.reduce((sum, t) => sum + t.peso, 0);
    
    adminStats.totalWithdrawals = transactions
        .filter(t => t.type === 'withdraw' && t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0);
    
    adminStats.pendingWithdrawals = transactions
        .filter(t => t.type === 'withdraw' && t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);
    
    localStorage.setItem('adminStats', JSON.stringify(adminStats));
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function savePendingUsers() {
    localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
}

function saveQuests() {
    localStorage.setItem('quests', JSON.stringify(quests));
}

function saveSubmissions() {
    localStorage.setItem('submissions', JSON.stringify(submissions));
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function generateReferralCode(username) {
    const baseCode = username.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const randomNum = Math.floor(Math.random() * 1000);
    return `${baseCode}${randomNum}`;
}

function showMessage(msg, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.style.background = isError ? '#e74c3c' : '#27ae60';
    msgDiv.textContent = msg;
    document.body.appendChild(msgDiv);
    setTimeout(() => msgDiv.remove(), 3000);
}

function isUserBanned(user) {
    if (!user.isBanned) return false;
    if (user.banUntil && new Date(user.banUntil) > new Date()) {
        return true;
    }
    if (user.banUntil && new Date(user.banUntil) <= new Date()) {
        user.isBanned = false;
        user.banUntil = null;
        user.banReason = null;
        saveUsers();
        return false;
    }
    return false;
}

// User converts points to PHP
function userConvertPoints(amount) {
    if (!currentUser) return false;
    
    if (amount < 100) {
        showMessage('Minimum 100 points to convert!', true);
        return false;
    }
    
    if (amount > currentUser.totalPoints) {
        showMessage(`Insufficient points! You have ${currentUser.totalPoints.toLocaleString()} points.`, true);
        return false;
    }
    
    const pesoAmount = amount / CONVERSION_RATE;
    
    currentUser.totalPoints -= amount;
    currentUser.totalPeso += pesoAmount;
    currentUser.totalEarned = (currentUser.totalEarned || 0) + pesoAmount;
    
    transactions.push({
        id: Date.now(),
        userId: currentUser.id,
        type: 'conversion',
        points: amount,
        peso: pesoAmount,
        date: new Date().toISOString(),
        status: 'approved'
    });
    
    saveUsers();
    saveTransactions();
    updateAdminStats();
    
    showMessage(`✅ Converted ${amount.toLocaleString()} points to ₱${pesoAmount.toFixed(2)}!`);
    return true;
}

// User requests withdrawal (pending admin approval)
function userRequestWithdrawal(amount, paymentMethod, accountName, accountNumber) {
    if (!currentUser) return false;
    
    if (amount < 10) {
        showMessage('Minimum withdrawal is ₱10.00!', true);
        return false;
    }
    
    if (amount > currentUser.totalPeso) {
        showMessage(`Insufficient balance! You have ₱${currentUser.totalPeso.toFixed(2)}`, true);
        return false;
    }
    
    if (!accountName || !accountNumber) {
        showMessage('Please enter account details!', true);
        return false;
    }
    
    // Deduct balance immediately (will be refunded if rejected)
    currentUser.totalPeso -= amount;
    
    transactions.push({
        id: Date.now(),
        userId: currentUser.id,
        type: 'withdraw',
        amount: amount,
        paymentMethod: paymentMethod,
        accountName: accountName,
        accountNumber: accountNumber,
        date: new Date().toISOString(),
        status: 'pending'
    });
    
    saveUsers();
    saveTransactions();
    updateAdminStats();
    
    showMessage(`✅ Withdrawal request for ₱${amount.toFixed(2)} submitted! Awaiting admin approval.`);
    return true;
}

// Admin approves withdrawal
function adminApproveWithdrawal(transactionId) {
    if (currentUser.role !== 'admin') {
        showMessage('Only administrators can approve withdrawals!', true);
        return false;
    }
    
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || transaction.type !== 'withdraw') {
        showMessage('Transaction not found!', true);
        return false;
    }
    
    if (transaction.status === 'approved') {
        showMessage('Withdrawal already approved!', true);
        return false;
    }
    
    transaction.status = 'approved';
    transaction.approvedAt = new Date().toISOString();
    
    saveTransactions();
    updateAdminStats();
    
    showMessage(`✅ Withdrawal of ₱${transaction.amount} approved! Sent to ${transaction.accountName} (${transaction.accountNumber})`);
    return true;
}

// Admin rejects withdrawal (refund balance)
function adminRejectWithdrawal(transactionId, reason = '') {
    if (currentUser.role !== 'admin') {
        showMessage('Only administrators can reject withdrawals!', true);
        return false;
    }
    
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || transaction.type !== 'withdraw') {
        showMessage('Transaction not found!', true);
        return false;
    }
    
    if (transaction.status === 'rejected' || transaction.status === 'approved') {
        showMessage('Withdrawal already processed!', true);
        return false;
    }
    
    // Refund the user
    const user = users.find(u => u.id === transaction.userId);
    if (user) {
        user.totalPeso += transaction.amount;
        saveUsers();
    }
    
    transaction.status = 'rejected';
    transaction.rejectedAt = new Date().toISOString();
    transaction.rejectReason = reason;
    
    saveTransactions();
    updateAdminStats();
    
    showMessage(`❌ Withdrawal of ₱${transaction.amount} rejected. ${reason ? `Reason: ${reason}` : ''}`);
    return true;
}

window.userConvertPoints = userConvertPoints;
window.userRequestWithdrawal = userRequestWithdrawal;
window.adminApproveWithdrawal = adminApproveWithdrawal;
window.adminRejectWithdrawal = adminRejectWithdrawal;