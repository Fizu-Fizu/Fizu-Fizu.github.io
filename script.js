// 全局变量
let gameData = null;
let currentFaction = 'all';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// 加载JSON数据
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('无法加载数据文件');
        
        gameData = await response.json();
        renderPage();
    } catch (error) {
        console.error('加载数据失败:', error);
        showError('无法加载数据文件，请检查 data.json 是否存在');
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 关闭公告
    document.getElementById('closeAnnouncement').addEventListener('click', function() {
        document.getElementById('announcement').classList.add('hidden');
        localStorage.setItem('announcementClosed', 'true');
    });
    
    // 显示公告按钮
    document.getElementById('showAnnouncement').addEventListener('click', function() {
        document.getElementById('announcement').classList.remove('hidden');
    });
    
    // 阵营筛选按钮
    document.querySelectorAll('.faction-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.faction-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFaction = this.dataset.faction;
            renderRoleGrid();
        });
    });
    
    // 刷新数据按钮
    document.getElementById('refreshData').addEventListener('click', loadData);
    
    // 关闭模态框
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('roleModal').classList.remove('show');
    });
    
    // 点击模态框外部关闭
    document.getElementById('roleModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.getElementById('roleModal').classList.remove('show');
        }
    });
}

// 渲染页面
function renderPage() {
    if (!gameData) return;
    
    // 渲染公告
    const announcementText = document.getElementById('announcementText');
    if (gameData.公告) {
        announcementText.textContent = gameData.公告;
        
        // 检查是否已经关闭过公告
        const announcementClosed = localStorage.getItem('announcementClosed');
        if (announcementClosed) {
            document.getElementById('announcement').classList.add('hidden');
        }
    }
    
    // 更新统计数据
    updateStats();
    
    // 渲染角色网格
    renderRoleGrid();
}

// 更新统计数据
function updateStats() {
    if (!gameData) return;
    
    const killerCount = Object.keys(gameData.杀手 || {}).length;
    const innocentCount = Object.keys(gameData.平民 || {}).length;
    const neutralCount = Object.keys(gameData.中立 || {}).length;
    const totalCount = killerCount + innocentCount + neutralCount;
    
    document.getElementById('killerCount').textContent = killerCount;
    document.getElementById('innocentCount').textContent = innocentCount;
    document.getElementById('neutralCount').textContent = neutralCount;
    document.getElementById('totalCount').textContent = totalCount;
    
    // 更新颜色
    document.getElementById('killerCount').style.color = '#ef4444';
    document.getElementById('innocentCount').style.color = '#3b82f6';
    document.getElementById('neutralCount').style.color = '#8b5cf6';
}

// 渲染角色网格
function renderRoleGrid() {
    if (!gameData) return;
    
    const roleGrid = document.getElementById('roleGrid');
    roleGrid.innerHTML = '';
    
    // 获取要显示的角色
    let rolesToShow = [];
    
    if (currentFaction === 'all') {
        // 合并所有角色
        Object.entries(gameData.杀手 || {}).forEach(([name, data]) => {
            rolesToShow.push({ name, faction: '杀手', ...data });
        });
        Object.entries(gameData.平民 || {}).forEach(([name, data]) => {
            rolesToShow.push({ name, faction: '平民', ...data });
        });
        Object.entries(gameData.中立 || {}).forEach(([name, data]) => {
            rolesToShow.push({ name, faction: '中立', ...data });
        });
    } else {
        // 显示特定阵营
        const factionData = gameData[currentFaction] || {};
        Object.entries(factionData).forEach(([name, data]) => {
            rolesToShow.push({ name, faction: currentFaction, ...data });
        });
    }
    
    // 如果没有角色
    if (rolesToShow.length === 0) {
        roleGrid.innerHTML = `
            <div class="no-roles">
                <i class="fas fa-search" style="font-size: 3rem; color: #64748b; margin-bottom: 1rem;"></i>
                <h3>暂无角色数据</h3>
                <p>请检查 data.json 文件格式是否正确</p>
            </div>
        `;
        return;
    }
    
    // 渲染角色卡片
    rolesToShow.forEach(role => {
        const card = createRoleCard(role);
        roleGrid.appendChild(card);
    });
}

// 创建角色卡片
function createRoleCard(role) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.dataset.color = role.颜色 || 'blue';
    
    // 阵营颜色映射
    const factionColors = {
        '杀手': '#ef4444',
        '平民': '#3b82f6',
        '中立': '#8b5cf6'
    };
    
    // 透视图标
    const visionIcon = role.能否透视 === '是' ? '<i class="fas fa-eye"></i> 可透视' : '<i class="fas fa-eye-slash"></i> 不可透视';
    
    // 物品数量
    const itemCount = Array.isArray(role.物品) ? role.物品.length : 0;
    
    card.innerHTML = `
        <div class="role-header">
            <div class="role-name">${role.name}</div>
            <div class="role-badges">
                <span class="vision-badge">${visionIcon}</span>
                <span class="faction-badge" style="color: ${factionColors[role.faction] || '#94a3b8'}">
                    ${role.faction}
                </span>
            </div>
        </div>
        <div class="role-description">${role.描述 || '暂无描述'}</div>
        <div class="role-footer">
            <div class="role-items-count">
                <i class="fas fa-backpack"></i>
                ${itemCount} 个物品
            </div>
            <div class="view-details">
                查看详情 <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `;
    
    // 点击事件
    card.addEventListener('click', function() {
        showRoleDetail(role);
    });
    
    return card;
}

// 显示角色详情
function showRoleDetail(role) {
    // 更新模态框内容
    document.getElementById('modalRoleName').textContent = role.name;
    
    // 阵营徽章
    const factionBadge = document.getElementById('modalFaction');
    factionBadge.textContent = role.faction;
    
    // 阵营颜色
    const factionColors = {
        '杀手': '#ef4444',
        '平民': '#3b82f6',
        '中立': '#8b5cf6'
    };
    factionBadge.style.backgroundColor = factionColors[role.faction] + '20';
    factionBadge.style.color = factionColors[role.faction];
    factionBadge.style.border = `1px solid ${factionColors[role.faction]}40`;
    
    // 透视徽章
    const visionBadge = document.getElementById('modalVision');
    visionBadge.textContent = role.能否透视 === '是' ? '可透视' : '不可透视';
    visionBadge.style.backgroundColor = role.能否透视 === '是' ? '#3b82f620' : '#64748b20';
    visionBadge.style.color = role.能否透视 === '是' ? '#3b82f6' : '#94a3b8';
    visionBadge.style.border = role.能否透视 === '是' ? '1px solid #3b82f640' : '1px solid #64748b40';
    
    // 描述
    document.getElementById('modalDescription').textContent = role.描述 || '暂无描述';
    
    // 获胜条件
    document.getElementById('modalWinCondition').textContent = role.获胜条件 || '未知';
    
    // 特殊机制
    document.getElementById('modalMechanism').textContent = role.特殊机制 || '无特殊机制';
    
    // 物品装备
    const itemsContainer = document.getElementById('modalItems');
    const itemsSection = document.getElementById('modalItemsSection');
    
    if (Array.isArray(role.物品) && role.物品.length > 0) {
        itemsContainer.innerHTML = '';
        role.物品.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            
            if (typeof item === 'string') {
                // 如果物品是字符串格式
                const parts = item.split('：');
                itemDiv.innerHTML = `
                    <div class="item-name">${parts[0] || item}</div>
                    <div class="item-desc">${parts[1] || '暂无描述'}</div>
                `;
            } else if (typeof item === 'object') {
                // 如果物品是对象格式
                itemDiv.innerHTML = `
                    <div class="item-name">${item.name || '未命名物品'}</div>
                    <div class="item-desc">${item.description || '暂无描述'}</div>
                `;
            }
            
            itemsContainer.appendChild(itemDiv);
        });
        itemsSection.style.display = 'block';
    } else {
        itemsSection.style.display = 'none';
    }
    
    // 游戏提示
    const tipsSection = document.getElementById('modalTipsSection');
    if (role.提示) {
        document.getElementById('modalTips').textContent = role.提示;
        tipsSection.style.display = 'block';
    } else {
        tipsSection.style.display = 'none';
    }
    
    // 显示模态框
    document.getElementById('roleModal').classList.add('show');
}

// 显示错误信息
function showError(message) {
    const roleGrid = document.getElementById('roleGrid');
    roleGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
            <h3>加载失败</h3>
            <p>${message}</p>
            <button id="retryLoad" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                重试加载
            </button>
        </div>
    `;
    
    document.getElementById('retryLoad')?.addEventListener('click', loadData);
}

// 暴露函数到全局
window.loadData = loadData;
window.showRoleDetail = showRoleDetail;