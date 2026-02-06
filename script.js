// 全局变量
let gameData = null;
let currentFaction = 'all';
let currentCategory = 'roles';

// 初始化
document.addEventListener('DOMContentLoaded', function () {
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
    document.getElementById('closeAnnouncement').addEventListener('click', function () {
        document.getElementById('announcement').classList.add('hidden');
        localStorage.setItem('announcementClosed', 'true');
    });

    // 显示公告按钮
    document.getElementById('showAnnouncement').addEventListener('click', function () {
        document.getElementById('announcement').classList.remove('hidden');
    });

    // 分类选择按钮
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;

            // 切换显示的部分
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${currentCategory}Section`).classList.add('active');

            // 根据当前分类渲染内容
            if (currentCategory === 'roles') {
                renderRoleGrid();
            } else if (currentCategory === 'features') {
                renderFeaturesGrid();
            }
        });
    });

    // 阵营筛选按钮
    document.querySelectorAll('.faction-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.faction-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFaction = this.dataset.faction;
            renderRoleGrid();
        });
    });

    // 刷新数据按钮
    document.getElementById('refreshData').addEventListener('click', loadData);

    // 关闭模态框
    document.getElementById('closeModal').addEventListener('click', function () {
        document.getElementById('roleModal').classList.remove('show');
    });

    document.getElementById('closeFeatureModal').addEventListener('click', function () {
        document.getElementById('featureModal').classList.remove('show');
    });

    // 点击模态框外部关闭
    document.getElementById('roleModal').addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });

    document.getElementById('featureModal').addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.getElementById('roleModal').classList.remove('show');
            document.getElementById('featureModal').classList.remove('show');
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
        if (gameData.杀手) {
            Object.entries(gameData.杀手).forEach(([name, data]) => {
                rolesToShow.push({ name, faction: '杀手', ...data });
            });
        }

        if (gameData.平民) {
            Object.entries(gameData.平民).forEach(([name, data]) => {
                rolesToShow.push({ name, faction: '平民', ...data });
            });
        }

        if (gameData.中立) {
            Object.entries(gameData.中立).forEach(([name, data]) => {
                rolesToShow.push({ name, faction: '中立', ...data });
            });
        }
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
            <div class="no-roles" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem;"></i>
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

// 渲染特性网格
function renderFeaturesGrid() {
    if (!gameData) return;

    const featuresGrid = document.getElementById('featuresGrid');
    featuresGrid.innerHTML = '';

    // 获取特性数据
    const features = gameData.特性 || {};

    // 如果没有特性
    if (Object.keys(features).length === 0) {
        featuresGrid.innerHTML = `
            <div class="no-features" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;">
                <i class="fas fa-star" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>暂无特性数据</h3>
                <p>请在 data.json 中添加特性数据</p>
            </div>
        `;
        return;
    }

    // 渲染特性卡片
    Object.entries(features).forEach(([name, data]) => {
        const card = createFeatureCard(name, data);
        featuresGrid.appendChild(card);
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
    const visionIcon = role.能否透视 === '是' ?
        '<i class="fas fa-eye"></i> 可透视' :
        '<i class="fas fa-eye-slash"></i> 不可透视';

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
    card.addEventListener('click', function () {
        showRoleDetail(role);
    });

    return card;
}

// 创建特性卡片
function createFeatureCard(name, data) {
    const card = document.createElement('div');
    card.className = 'feature-card';

    // 简化的特性描述
    const shortDescription = data.介绍.length > 100 ?
        data.介绍.substring(0, 100) + '...' :
        data.介绍;

    card.innerHTML = `
        <div class="feature-header">
            <div class="feature-icon">
                <i class="fas fa-star"></i>
            </div>
            <div class="feature-name">${name}</div>
        </div>
        <div class="feature-description">${shortDescription}</div>
        <div class="role-footer" style="margin-top: 1rem;">
            <div class="view-details">
                查看详情 <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `;

    // 点击事件
    card.addEventListener('click', function () {
        showFeatureDetail(name, data);
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
    const mechanismEl = document.getElementById('modalMechanism');
    if (role.特殊机制 && role.特殊机制.trim()) {
        mechanismEl.textContent = role.特殊机制;
    } else {
        mechanismEl.textContent = '无特殊机制';
    }

    // 物品装备
    const itemsContainer = document.getElementById('modalItems');
    const itemsSection = document.getElementById('modalItemsSection');

    if (Array.isArray(role.物品) && role.物品.length > 0) {
        itemsContainer.innerHTML = '';
        role.物品.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';

            if (typeof item === 'string') {
                const parts = item.split('：');
                itemDiv.innerHTML = `
                    <div class="item-name">${parts[0] || item}</div>
                    <div class="item-desc">${parts[1] || '暂无描述'}</div>
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
    if (role.提示 && role.提示.trim()) {
        document.getElementById('modalTips').textContent = role.提示;
        tipsSection.style.display = 'block';
    } else {
        tipsSection.style.display = 'none';
    }

    // 显示模态框
    document.getElementById('roleModal').classList.add('show');
}

// 显示特性详情
function showFeatureDetail(name, data) {
    // 更新模态框内容
    document.getElementById('modalFeatureName').textContent = name;
    document.getElementById('modalFeatureDescription').textContent = data.介绍 || '暂无介绍';

    // 显示模态框
    document.getElementById('featureModal').classList.add('show');
}

// 显示错误信息
function showError(message) {
    const roleGrid = document.getElementById('roleGrid');
    roleGrid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>加载失败</h3>
            <p>${message}</p>
            <button id="retryLoad" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                重试加载
            </button>
        </div>
    `;

    document.getElementById('retryLoad').addEventListener('click', loadData);
}