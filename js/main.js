// ==================== PAGE LOADER ====================

function loadPage(page) {
    if (window.innerWidth <= 768) closeSidebar();
    const content = document.getElementById('pageContent');
    
    switch(page) {
        // User Pages
        case 'dashboard':
            content.innerHTML = renderDashboard();
            break;
        case 'quests':
            content.innerHTML = renderQuestsPage();
            break;
        case 'quiz':
            content.innerHTML = renderQuizPage();
            break;
        case 'my-submissions':
            content.innerHTML = renderMySubmissionsPage();
            break;
        case 'convert':
            content.innerHTML = renderUserConvertPage();
            break;
        case 'withdraw':
            content.innerHTML = renderUserWithdrawPage();
            break;
        case 'referral':
            content.innerHTML = renderReferralPage();
            break;
        
        // Admin Pages
        case 'admin-dashboard':
            if (currentUser.role === 'admin') content.innerHTML = renderAdminDashboard();
            break;
        case 'pending-accounts':
            if (currentUser.role === 'admin') content.innerHTML = renderAdminPendingAccounts();
            else if (currentUser.role === 'moderator') content.innerHTML = renderModeratorPendingRequests();
            break;
        case 'create-account':
            if (currentUser.role === 'admin') content.innerHTML = renderAdminCreateAccount();
            else if (currentUser.role === 'moderator') content.innerHTML = renderModeratorCreateAccount();
            break;
        case 'manage-users':
            if (currentUser.role === 'admin') content.innerHTML = renderAdminManageUsers();
            break;
        case 'manage-quests':
            if (currentUser.role === 'admin') content.innerHTML = renderAdminManageQuests();
            break;
        case 'approve-submissions':
            if (currentUser.role === 'admin') content.innerHTML = renderAdminApproveSubmissions();
            else if (currentUser.role === 'moderator') content.innerHTML = renderModeratorApproveSubmissions();
            break;
        case 'approve-withdrawals':
            if (currentUser.role === 'admin') content.innerHTML = renderAdminApproveWithdrawals();
            break;
    }
    
    // Update active nav
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) item.classList.add('active');
    });
    
    // Update mobile points display
    if (document.getElementById('mobilePoints')) {
        document.getElementById('mobilePoints').textContent = `${currentUser.totalPoints} pts`;
    }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    
    // Login button
    document.getElementById('authButton')?.addEventListener('click', login);
    document.getElementById('password')?.addEventListener('keypress', e => { if (e.key === 'Enter') login(); });
    
    // Navigation
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page) loadPage(page);
        });
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
            if (!sidebar.contains(event.target) && !menuToggle?.contains(event.target)) {
                closeSidebar();
            }
        }
    });
});

// ==================== SIDEBAR FUNCTIONS ====================

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// Make functions globally available
window.loadPage = loadPage;
window.closeSidebar = closeSidebar;
window.viewProofImage = viewProofImage;
window.togglePaymentFields = togglePaymentFields;
window.handleConvertPoints = handleConvertPoints;
window.handleConvertAllPoints = handleConvertAllPoints;
window.handleRequestWithdrawal = handleRequestWithdrawal;
window.startRandomQuiz = startRandomQuiz;
window.selectAnswer = selectAnswer;
window.closeQuiz = closeQuiz;
window.viewQuizDetails = viewQuizDetails;
window.closeResultsAndRefresh = closeResultsAndRefresh;