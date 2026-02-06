// 全局变量
let gameData = null;
let currentFaction = 'all';
let currentCategory = 'roles';
let isModalOpen = false;

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    setupEventListeners();
    initScrollToTop();
});

// 加载JSON数据
async function loadData() {
    try {
        // 显示加载状态
        showLoadingState();

        const response = await fetch('data.json');
        if (!response.ok) throw new Error('无法加载数据文件');

        gameData = await response.json();

        // 添加延迟以展示加载动画
        setTimeout(() => {
            renderPage();
            hideLoadingState();
        }, 500);

    } catch (error) {
        console.error('加载数据失败:', error);
        showError('无法加载数据文件，请检查 data.json 是否存在');
        hideLoadingState();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 检测是否为移动设备
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        document.body.classList.add('is-mobile');

        // 防止双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // 关闭公告
    document.getElementById('closeAnnouncement').addEventListener('click', function () {
        document.getElementById('announcement').classList.add('hidden');
        localStorage.setItem('announcementClosed', 'true');
    });

    // 显示公告按钮
    document.getElementById('showAnnouncement').addEventListener('click', function () {
        document.getElementById('announcement').classList.remove('hidden');
        playSound('open');
    });

    // 分类选择按钮
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // 移除所有active状态
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));

            // 添加当前按钮active状态
            this.classList.add('active');
            currentCategory = this.dataset.category;

            // 播放点击声音
            playSound('click');

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

            // 在移动设备上滚动到顶部
            if (isMobile) {
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // 阵营筛选按钮
    document.querySelectorAll('.faction-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // 移除所有active状态
            document.querySelectorAll('.faction-btn').forEach(b => b.classList.remove('active'));

            // 添加当前按钮active状态
            this.classList.add('active');
            currentFaction = this.dataset.faction;

            // 播放点击声音
            playSound('click');

            // 添加动画效果
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
                renderRoleGrid();
            }, 150);
        });
    });

    // 刷新数据按钮
    document.getElementById('refreshData').addEventListener('click', function () {
        playSound('refresh');
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
        this.disabled = true;

        loadData();

        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新数据';
            this.disabled = false;
        }, 1000);
    });

    // 关闭模态框
    document.getElementById('closeModal').addEventListener('click', function () {
        closeModal('roleModal');
    });

    document.getElementById('closeFeatureModal').addEventListener('click', function () {
        closeModal('featureModal');
    });

    // 模态框关闭按钮
    document.querySelectorAll('.close-action').forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });

    // 复制信息按钮
    document.querySelector('.copy-action').addEventListener('click', function () {
        copyRoleInfo();
    });

    // 点击模态框外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal')) {
                closeModal(this.id);
            }
        });
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isModalOpen) {
            closeModal();
        }
    });

    // 滚动到顶部
    document.getElementById('scrollToTop').addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        playSound('click');
    });

    // 工具提示
    setupTooltips();
}

// 初始化回到顶部按钮
function initScrollToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        playSound('click');
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

    // 更新页脚统计
    updateFooterStats();

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

    // 动画更新数字
    animateCounter('killerCount', killerCount);
    animateCounter('innocentCount', innocentCount);
    animateCounter('neutralCount', neutralCount);
    animateCounter('totalCount', totalCount);

    // 更新页脚总计
    animateCounter('footerTotalCount', totalCount);
}

// 动画计数器
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;

    if (currentValue === targetValue) return;

    const duration = 1000;
    const step = Math.abs(targetValue - currentValue) / (duration / 16);
    let current = currentValue;

    function updateCounter() {
        if (current < targetValue) {
            current = Math.min(current + step, targetValue);
        } else {
            current = Math.max(current - step, targetValue);
        }

        element.textContent = Math.round(current);

        if (current !== targetValue) {
            requestAnimationFrame(updateCounter);
        }
    }

    requestAnimationFrame(updateCounter);
}

// 更新页脚统计
function updateFooterStats() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('updateDate').textContent = formattedDate;
}

// 渲染角色网格
function renderRoleGrid() {
    if (!gameData) return;

    const roleGrid = document.getElementById('roleGrid');

    // 显示加载状态
    roleGrid.innerHTML = `
        <div class="loading-placeholder">
            <div class="spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p>正在加载角色数据...</p>
        </div>
    `;

    // 延迟渲染以获得更好的用户体验
    setTimeout(() => {
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

        // 排序：按名称字母顺序
        rolesToShow.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

        // 如果没有角色
        if (rolesToShow.length === 0) {
            roleGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 4rem 2rem;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary);">暂无角色数据</h3>
                    <p style="color: var(--text-muted);">请检查 data.json 文件格式是否正确</p>
                </div>
            `;
            return;
        }

        // 清空网格
        roleGrid.innerHTML = '';

        // 渲染角色卡片
        rolesToShow.forEach((role, index) => {
            const card = createRoleCard(role, index);
            roleGrid.appendChild(card);
        });
    }, 300);
}

// 渲染特性网格
function renderFeaturesGrid() {
    if (!gameData) return;

    const featuresGrid = document.getElementById('featuresGrid');

    // 显示加载状态
    featuresGrid.innerHTML = `
        <div class="loading-placeholder">
            <div class="spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p>正在加载特质数据...</p>
        </div>
    `;

    setTimeout(() => {
        // 获取特性数据
        const features = gameData.特性 || {};

        // 如果没有特性
        if (Object.keys(features).length === 0) {
            featuresGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 4rem 2rem;">
                    <i class="fas fa-star" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary);">暂无特质数据</h3>
                    <p style="color: var(--text-muted);">请在 data.json 中添加特质数据</p>
                </div>
            `;
            return;
        }

        // 清空网格
        featuresGrid.innerHTML = '';

        // 渲染特性卡片
        Object.entries(features).forEach(([name, data], index) => {
            const card = createFeatureCard(name, data, index);
            featuresGrid.appendChild(card);
        });
    }, 300);
}

// 创建角色卡片
function createRoleCard(role, index) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.dataset.index = index;
    card.style.animationDelay = `${index * 50}ms`;
    card.style.opacity = '0';
    card.style.animation = `fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms forwards`;

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
                <span class="faction-badge" style="color: ${factionColors[role.faction] || '#94a3b8'}; border-color: ${factionColors[role.faction]}40">
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
        playSound('open');
        showRoleDetail(role);
    });

    return card;
}

// 创建特性卡片
function createFeatureCard(name, data, index) {
    const card = document.createElement('div');
    card.className = 'feature-card';
    card.dataset.index = index;
    card.style.animationDelay = `${index * 50}ms`;
    card.style.opacity = '0';
    card.style.animation = `fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms forwards`;

    // 简化的特性描述
    const shortDescription = data.介绍 && data.介绍.length > 120 ?
        data.介绍.substring(0, 120) + '...' :
        (data.介绍 || '暂无介绍');

    card.innerHTML = `
        <div class="feature-header">
            <div class="feature-icon">
                <i class="fas fa-star"></i>
            </div>
            <div class="feature-name">${name}</div>
        </div>
        <div class="feature-description">${shortDescription}</div>
        <div class="role-footer" style="margin-top: auto; padding-top: 1.5rem;">
            <div class="view-details">
                查看详情 <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `;

    // 点击事件
    card.addEventListener('click', function () {
        playSound('open');
        showFeatureDetail(name, data);
    });

    return card;
}

// 显示角色详情
function showRoleDetail(role) {
    // 设置模态框打开状态
    isModalOpen = true;
    document.body.style.overflow = 'hidden';

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
    factionBadge.style.background = `linear-gradient(135deg, ${factionColors[role.faction]}20, ${factionColors[role.faction]}10)`;
    factionBadge.style.color = factionColors[role.faction];
    factionBadge.style.border = `1px solid ${factionColors[role.faction]}30`;

    // 透视徽章
    const visionBadge = document.getElementById('modalVision');
    visionBadge.textContent = role.能否透视 === '是' ? '可透视' : '不可透视';
    visionBadge.style.background = role.能否透视 === '是' ?
        'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))' :
        'linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1))';
    visionBadge.style.color = role.能否透视 === '是' ? '#10b981' : '#94a3b8';
    visionBadge.style.border = role.能否透视 === '是' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)';

    // 难度徽章（模拟）
    const difficultyBadge = document.getElementById('modalDifficulty');
    const difficulty = getDifficulty(role);
    difficultyBadge.textContent = difficulty.text;
    difficultyBadge.style.background = difficulty.background;
    difficultyBadge.style.color = difficulty.color;
    difficultyBadge.style.border = difficulty.border;

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

        // 物品颜色数组
        const itemColors = [
            'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
            'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
            'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
            'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
            'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))'
        ];

        const borderColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

        role.物品.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';

            const colorIndex = index % itemColors.length;
            itemDiv.style.background = itemColors[colorIndex];
            itemDiv.style.borderLeftColor = borderColors[colorIndex];

            if (typeof item === 'string') {
                const parts = item.split('：');
                const itemName = parts[0] || item;
                const itemDesc = parts[1] || '暂无描述';

                itemDiv.innerHTML = `
                    <div class="item-name">
                        <i class="fas fa-cube" style="color: ${borderColors[colorIndex]}"></i>
                        ${itemName}
                    </div>
                    <div class="item-desc">${itemDesc}</div>
                `;
            } else if (typeof item === 'object') {
                itemDiv.innerHTML = `
                    <div class="item-name">
                        <i class="fas fa-cube" style="color: ${borderColors[colorIndex]}"></i>
                        ${item.name || '物品'}
                    </div>
                    <div class="item-desc">${item.desc || '暂无描述'}</div>
                `;
            }

            itemsContainer.appendChild(itemDiv);
        });
        itemsSection.style.display = 'block';
    } else {
        itemsSection.style.display = 'block'; // 总是显示物品区域，但显示空状态
        itemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>该角色没有携带物品</p>
            </div>
        `;
    }

    // 游戏提示
    const tipsSection = document.getElementById('modalTipsSection');
    if (role.提示 && role.提示.trim()) {
        document.getElementById('modalTips').textContent = role.提示;
        tipsSection.style.display = 'block';
    } else {
        tipsSection.style.display = 'block'; // 总是显示提示区域
        document.getElementById('modalTips').textContent = '暂无提示信息';
    }

    // 显示模态框
    document.getElementById('roleModal').classList.add('show');
}

// 显示特性详情
function showFeatureDetail(name, data) {
    // 设置模态框打开状态
    isModalOpen = true;
    document.body.style.overflow = 'hidden';

    // 更新模态框内容
    document.getElementById('modalFeatureName').textContent = name;
    document.getElementById('modalFeatureDescription').textContent = data.介绍 || '暂无介绍';

    // 显示模态框
    document.getElementById('featureModal').classList.add('show');
}

// 关闭模态框
function closeModal(modalId = null) {
    playSound('close');

    if (modalId) {
        document.getElementById(modalId).classList.remove('show');
    } else {
        // 关闭所有打开的模态框
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    isModalOpen = false;
    document.body.style.overflow = '';
}

// 复制角色信息
function copyRoleInfo() {
    const roleName = document.getElementById('modalRoleName').textContent;
    const faction = document.getElementById('modalFaction').textContent;
    const description = document.getElementById('modalDescription').textContent;
    const winCondition = document.getElementById('modalWinCondition').textContent;

    const text = `角色：${roleName}
阵营：${faction}
描述：${description}
获胜条件：${winCondition}
---
来自哈比列车指南`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('角色信息已复制到剪贴板');
        playSound('success');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制', 'error');
    });
}

// 获取角色难度（模拟函数）
function getDifficulty(role) {
    // 这里可以根据角色特性计算难度
    let difficulty = 'medium';

    if (role.特殊机制 && role.特殊机制.length > 50) {
        difficulty = 'hard';
    } else if (role.faction === '平民' && !role.能否透视) {
        difficulty = 'easy';
    }

    const difficulties = {
        easy: {
            text: '简单',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)'
        },
        medium: {
            text: '中等',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)'
        },
        hard: {
            text: '困难',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)'
        }
    };

    return difficulties[difficulty];
}

// 显示加载状态
function showLoadingState() {
    const roleGrid = document.getElementById('roleGrid');
    const featuresGrid = document.getElementById('featuresGrid');

    if (roleGrid) {
        roleGrid.innerHTML = `
            <div class="loading-placeholder">
                <div class="spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>正在加载数据...</p>
            </div>
        `;
    }

    if (featuresGrid) {
        featuresGrid.innerHTML = `
            <div class="loading-placeholder">
                <div class="spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>正在加载数据...</p>
            </div>
        `;
    }
}

// 隐藏加载状态
function hideLoadingState() {
    // 这里可以添加加载完成的动画
    document.querySelectorAll('.spinner').forEach(spinner => {
        spinner.innerHTML = '<i class="fas fa-check"></i>';
        spinner.style.color = '#10b981';
        spinner.style.animation = 'none';
    });
}

// 显示错误信息
function showError(message) {
    const roleGrid = document.getElementById('roleGrid');
    const featuresGrid = document.getElementById('featuresGrid');

    const errorHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 4rem 2rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #ef4444;"></i>
            <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary);">加载失败</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${message}</p>
            <button id="retryLoad" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; transition: all 0.3s;">
                <i class="fas fa-redo"></i> 重试加载
            </button>
        </div>
    `;

    if (roleGrid) roleGrid.innerHTML = errorHTML;
    if (featuresGrid) featuresGrid.innerHTML = errorHTML;

    document.getElementById('retryLoad')?.addEventListener('click', loadData);
}

// 播放音效
function playSound(type) {
    // 这里可以添加实际音效
    console.log(`播放音效: ${type}`);
}

// 显示Toast通知
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 设置工具提示
function setupTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    const tooltip = document.getElementById('tooltip');

    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const text = element.getAttribute('data-tooltip');
            if (!text) return;

            const rect = element.getBoundingClientRect();
            tooltip.textContent = text;
            tooltip.classList.add('show');

            // 定位工具提示
            const top = rect.bottom + 8;
            const left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);

            // 确保工具提示在视口内
            const viewportWidth = window.innerWidth;
            const tooltipWidth = tooltip.offsetWidth;

            let finalLeft = left;
            if (left < 10) finalLeft = 10;
            if (left + tooltipWidth > viewportWidth - 10) {
                finalLeft = viewportWidth - tooltipWidth - 10;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${finalLeft}px`;
        });

        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });
    });
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: var(--shadow-lg);
        transform: translateX(100%);
        opacity: 0;
        transition: all var(--transition-normal);
        z-index: 9999;
    }
    
    .toast.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .toast-error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease-out forwards;
    }
`;
document.head.appendChild(style);