function getUserTransactions() {
    return transactions.filter(t => t.userId === currentUser.id);
}

function renderConvertPage() {
    const pointsValue = (currentUser.totalPoints / CONVERSION_RATE).toFixed(2);
    
    return `
        <div class="dashboard-grid">
            <div class="stat-card"><h4>💰 YOUR POINTS</h4><div class="value">${currentUser.totalPoints.toLocaleString()}</div></div>
            <div class="stat-card"><h4>💵 PHP VALUE</h4><div class="value">₱${pointsValue}</div></div>
            <div class="stat-card"><h4>🔄 CONVERSION RATE</h4><div class="value">100 pts = ₱1</div></div>
            <div class="stat-card"><h4>♾️ LIMIT</h4><div class="value">UNLIMITED</div></div>
        </div>
        
        <div class="data-table">
            <h3>💱 Convert Points to PHP</h3>
            <div class="input-group">
                <label>Points to Convert (minimum 100)</label>
                <input type="number" id="convertAmount" min="100" step="100" placeholder="Enter points" max="${currentUser.totalPoints}">
            </div>
            <div class="input-group">
                <label>Or enter PHP amount</label>
                <input type="number" id="convertPHP" min="1" step="1" placeholder="Enter PHP amount">
                <small>100 points = ₱1.00</small>
            </div>
            <button class="auth-btn" onclick="convertPoints()">💸 Convert to PHP</button>
            <button class="auth-btn" onclick="convertAllPoints()" style="background: linear-gradient(135deg, #3498db, #2980b9); margin-top: 10px;">🎯 Convert ALL Points</button>
            <div style="margin-top: 15px; padding: 12px; background: #e8f5e9; border-radius: 10px;">
                <small>✅ UNLIMITED CONVERSION - Convert any amount anytime!</small>
            </div>
        </div>
        
        <div class="data-table">
            <h3>📜 Conversion History</h3>
            ${getUserTransactions().filter(t => t.type === 'conversion').slice(0, 10).map(t => `
                <div style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>${new Date(t.date).toLocaleString()}</strong><br>
                    ${t.points.toLocaleString()} points → ₱${t.peso.toFixed(2)}
                </div>
            `).join('') || '<p>No conversions yet</p>'}
        </div>
    `;
}

function convertPoints() {
    let amount = parseInt(document.getElementById('convertAmount')?.value);
    const phpAmount = parseInt(document.getElementById('convertPHP')?.value);
    
    if (phpAmount && phpAmount > 0 && !amount) {
        amount = phpAmount * CONVERSION_RATE;
    }
    
    if (!amount || amount < 100) {
        showMessage('Minimum 100 points to convert!', true);
        return;
    }
    if (amount > currentUser.totalPoints) {
        showMessage(`Insufficient points! You have ${currentUser.totalPoints.toLocaleString()} points.`, true);
        return;
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
    document.getElementById('convertAmount').value = '';
    document.getElementById('convertPHP').value = '';
    loadPage('dashboard');
}

function convertAllPoints() {
    if (currentUser.totalPoints < 100) {
        showMessage(`Need at least 100 points to convert!`, true);
        return;
    }
    
    const amount = currentUser.totalPoints;
    const pesoAmount = amount / CONVERSION_RATE;
    
    if (confirm(`Convert ALL ${amount.toLocaleString()} points to ₱${pesoAmount.toFixed(2)}?`)) {
        currentUser.totalPoints = 0;
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
        
        showMessage(`✅ Converted ALL ${amount.toLocaleString()} points to ₱${pesoAmount.toFixed(2)}!`);
        loadPage('dashboard');
    }
}

function renderWithdrawPage() {
    const pending = transactions.filter(t => t.userId === currentUser.id && t.type === 'withdraw' && t.status === 'pending');
    const completed = transactions.filter(t => t.userId === currentUser.id && t.type === 'withdraw' && t.status === 'approved');
    
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
            <button class="auth-btn" onclick="requestWithdrawal()">📤 Request Withdrawal</button>
        </div>
        
        <div class="data-table">
            <h3>📋 Withdrawal History</h3>
            ${pending.map(w => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>₱${w.amount}</strong> - ${new Date(w.date).toLocaleString()}<br><small>${w.paymentMethod === 'gcash' ? '📱 GCash' : '💳 Maya'}: ${w.accountName} | ⏳ Pending</small></div>`).join('')}
            ${completed.map(w => `<div style="padding: 8px; border-bottom: 1px solid #eee;"><strong>₱${w.amount}</strong> - ${new Date(w.date).toLocaleString()}<br><small>✅ Completed</small></div>`).join('')}
            ${pending.length === 0 && completed.length === 0 ? '<p>No withdrawal history</p>' : ''}
        </div>
    `;
}

function togglePaymentFields() {
    const method = document.getElementById('paymentMethod').value;
    document.getElementById('gcashFields').style.display = method === 'gcash' ? 'block' : 'none';
    document.getElementById('mayaFields').style.display = method === 'maya' ? 'block' : 'none';
}

function requestWithdrawal() {
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
    
    if (!amount || amount < 10) { showMessage('Minimum ₱10!', true); return; }
    if (amount > currentUser.totalPeso) { showMessage(`Insufficient balance!`, true); return; }
    if (!accountName) { showMessage('Enter account name!', true); return; }
    if (!accountNumber || !/^[0-9]{10,11}$/.test(accountNumber)) { showMessage(`Valid ${method === 'gcash' ? 'GCash' : 'Maya'} number required!`, true); return; }
    
    transactions.push({
        id: Date.now(), userId: currentUser.id, type: 'withdraw', amount: amount,
        paymentMethod: method, accountName: accountName, accountNumber: accountNumber,
        date: new Date().toISOString(), status: 'pending'
    });
    
    currentUser.totalPeso -= amount;
    saveUsers();
    saveTransactions();
    updateAdminStats();
    
    showMessage(`✅ Withdrawal request for ₱${amount.toFixed(2)} submitted!`);
    loadPage('withdraw');
}