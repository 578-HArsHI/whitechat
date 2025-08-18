// Global variables
let currentUser = null;
let currentChat = null;
let chats = [];
let socket = null;
let isConnected = false;

// DOM elements
const loginModal = document.getElementById('loginModal');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const chatContainer = document.querySelector('.chat-container');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const chatList = document.getElementById('chatList');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterTabs = document.querySelectorAll('.filter-tab');
const chatHeader = document.getElementById('chatHeader');
const chatTitle = document.getElementById('chatTitle');
const chatStatus = document.getElementById('chatStatus');
const chatAvatar = document.getElementById('chatAvatar');
const chatStatusDot = document.getElementById('chatStatusDot');
const welcomeScreen = document.getElementById('welcomeScreen');
const welcomeContainer = document.getElementById('welcomeContainer');
const postLoginWelcome = document.getElementById('postLoginWelcome');
const welcomeContinueBtn = document.getElementById('welcomeContinueBtn');
const messageInputContainer = document.querySelector('.message-input-container');

// Settings and modals
const settingsBtn = document.getElementById('settingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');
const newGroupBtn = document.getElementById('newGroupBtn');
const activeSessionsBtn = document.getElementById('activeSessionsBtn');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const notificationIcon = document.getElementById('notificationIcon');
const notificationPanel = document.getElementById('notificationPanel');
const notificationClose = document.getElementById('notificationClose');

// Avatar Actions Modal
const avatarActionsModal = document.getElementById('avatarActionsModal');
const closeAvatarModal = document.getElementById('closeAvatarModal');
const avatarLargeInitial = document.getElementById('avatarLargeInitial');
const avatarUserName = document.getElementById('avatarUserName');
const avatarUserContact = document.getElementById('avatarUserContact');
const audioCallBtn = document.getElementById('audioCallBtn');
const videoCallBtn = document.getElementById('videoCallBtn');
const payBtn = document.getElementById('payBtn');
const searchBtn = document.getElementById('searchBtn');

// Chat Details Modal
const chatDetailsModal = document.getElementById('chatDetailsModal');
const closeChatDetailsModal = document.getElementById('closeChatDetailsModal');
const chatDetailsAvatar = document.getElementById('chatDetailsAvatar');
const chatDetailsName = document.getElementById('chatDetailsName');
const chatDetailsContact = document.getElementById('chatDetailsContact');
const detailsContent = document.getElementById('detailsContent');
const detailsSectionTitle = document.getElementById('detailsSectionTitle');
const detailAudioBtn = document.getElementById('detailAudioBtn');
const detailVideoBtn = document.getElementById('detailVideoBtn');
const detailSearchBtn = document.getElementById('detailSearchBtn');

// Active Sessions Modal
const activeSessionsModal = document.getElementById('activeSessionsModal');
const closeSessionsModal = document.getElementById('closeSessionsModal');
const sessionsContent = document.getElementById('sessionsContent');

// New Group Modal
const newGroupModal = document.getElementById('newGroupModal');
const closeNewGroupModal = document.getElementById('closeNewGroupModal');
const groupNameInput = document.getElementById('groupNameInput');
const availableUsersList = document.getElementById('availableUsersList');
const selectedUsersList = document.getElementById('selectedUsersList');
const createGroupBtn = document.getElementById('createGroupBtn');
const cancelGroupBtn = document.getElementById('cancelGroupBtn');

// User info elements
const currentUserName = document.getElementById('currentUserName');
const currentUserContact = document.getElementById('currentUserContact');
const userAvatar = document.getElementById('userAvatar');
const userStatusDot = document.getElementById('userStatusDot');
const connectionStatus = document.getElementById('connectionStatus');
const statusDot = connectionStatus.querySelector('.status-dot');
const statusText = connectionStatus.querySelector('.status-text');

// Filter counts
const allCount = document.getElementById('allCount');
const unreadCount = document.getElementById('unreadCount');
const personalCount = document.getElementById('personalCount');
const groupsCount = document.getElementById('groupsCount');

// Sample data for development
const sampleChats = [
    {
        id: 1,
        name: "John Doe",
        type: "personal",
        lastMessage: "Hey, how are you doing?",
        time: "2:30 PM",
        unread: 2,
        online: true,
        avatar: "JD"
    },
    {
        id: 2,
        name: "Team Alpha",
        type: "group",
        lastMessage: "Meeting at 3 PM",
        time: "1:45 PM",
        unread: 0,
        online: false,
        avatar: "TA",
        members: ["Alice", "Bob", "Charlie", "David", "Eve"]
    },
    {
        id: 3,
        name: "Sarah Wilson",
        type: "personal",
        lastMessage: "Thanks for the help!",
        time: "12:15 PM",
        unread: 1,
        online: true,
        avatar: "SW"
    },
    {
        id: 4,
        name: "Project Beta",
        type: "group",
        lastMessage: "Code review completed",
        time: "11:30 AM",
        unread: 0,
        online: false,
        avatar: "PB",
        members: ["Frank", "Grace", "Henry"]
    }
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Show login modal initially
    loginModal.style.display = 'flex';
    chatContainer.style.display = 'none';
    
    // Add event listeners
    addEventListeners();
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Load sample data for development
    chats = [...sampleChats];
}

function addEventListeners() {
    // Login
    loginBtn.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Message input
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    sendBtn.addEventListener('click', sendMessage);
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Search
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // Filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => handleFilterChange(tab.dataset.filter));
    });
    
    // Settings dropdown
    settingsBtn.addEventListener('click', toggleSettingsDropdown);
    document.addEventListener('click', function(e) {
        if (!settingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.remove('show');
        }
    });
    
    // Settings actions
    newGroupBtn.addEventListener('click', openNewGroupModal);
    activeSessionsBtn.addEventListener('click', openActiveSessionsModal);
    logoutBtn.addEventListener('click', handleLogout);
    refreshBtn.addEventListener('click', refreshChats);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Notification panel
    notificationIcon.addEventListener('click', toggleNotificationPanel);
    notificationClose.addEventListener('click', closeNotificationPanel);
    
    // Avatar Actions Modal
    closeAvatarModal.addEventListener('click', closeAvatarActionsModal);
    audioCallBtn.addEventListener('click', () => handleAction('audio_call'));
    videoCallBtn.addEventListener('click', () => handleAction('video_call'));
    payBtn.addEventListener('click', () => handleAction('pay'));
    searchBtn.addEventListener('click', () => handleAction('search'));
    
    // Chat Details Modal
    chatHeader.addEventListener('click', openChatDetailsModal);
    closeChatDetailsModal.addEventListener('click', closeChatDetailsModalHandler);
    detailAudioBtn.addEventListener('click', () => handleAction('audio_call'));
    detailVideoBtn.addEventListener('click', () => handleAction('video_call'));
    detailSearchBtn.addEventListener('click', () => handleAction('search'));
    
    // Active Sessions Modal
    closeSessionsModal.addEventListener('click', closeActiveSessionsModal);
    
    // New Group Modal
    closeNewGroupModal.addEventListener('click', closeNewGroupModalHandler);
    createGroupBtn.addEventListener('click', createGroup);
    cancelGroupBtn.addEventListener('click', closeNewGroupModalHandler);
    
    // Welcome continue
    welcomeContinueBtn.addEventListener('click', hideWelcomeScreen);
    
    // Close modals on backdrop click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            if (e.target === avatarActionsModal) closeAvatarActionsModal();
            if (e.target === chatDetailsModal) closeChatDetailsModalHandler();
            if (e.target === activeSessionsModal) closeActiveSessionsModal();
            if (e.target === newGroupModal) closeNewGroupModalHandler();
        }
    });
}

function handleLogin() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        showLoginError('Please enter a username');
        return;
    }
    
    // Simulate login
    currentUser = {
        name: username,
        avatar: username.charAt(0).toUpperCase(),
        contact: '+91 99450 26856'
    };
    
    // Hide login modal and show chat
    loginModal.style.display = 'none';
    chatContainer.style.display = 'flex';
    
    // Update user info
    updateUserInfo();
    
    // Show post-login welcome
    showPostLoginWelcome();
    
    // Render chats
    renderChats();
    updateFilterCounts();
    
    // Simulate connection
    simulateConnection();
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 3000);
}

function updateUserInfo() {
    if (currentUser) {
        currentUserName.textContent = currentUser.name;
        currentUserContact.textContent = currentUser.contact;
        userAvatar.textContent = currentUser.avatar;
        
        // Update welcome username
        const welcomeUsername = document.getElementById('welcomeUsername');
        const postLoginUsername = document.getElementById('postLoginUsername');
        if (welcomeUsername) welcomeUsername.textContent = currentUser.name;
        if (postLoginUsername) postLoginUsername.textContent = currentUser.name;
    }
}

function simulateConnection() {
    // Simulate connecting state
    statusDot.classList.remove('connected');
    statusText.textContent = 'Connecting...';
    userStatusDot.classList.remove('online');
    
    setTimeout(() => {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
        userStatusDot.classList.add('online');
        isConnected = true;
        
        // Enable message input
        messageInput.disabled = false;
        sendBtn.disabled = false;
        attachBtn.disabled = false;
    }, 2000);
}

function showPostLoginWelcome() {
    welcomeContainer.style.display = 'flex';
    postLoginWelcome.style.display = 'block';
    welcomeScreen.style.display = 'none';
    messageInputContainer.style.display = 'none';
    
    // Update welcome stats
    const welcomeTotalChats = document.getElementById('welcomeTotalChats');
    const welcomeOnlineChats = document.getElementById('welcomeOnlineChats');
    
    if (welcomeTotalChats) welcomeTotalChats.textContent = chats.length;
    if (welcomeOnlineChats) welcomeOnlineChats.textContent = chats.filter(chat => chat.online).length;
}

function hideWelcomeScreen() {
    welcomeContainer.style.display = 'none';
    messageInputContainer.style.display = 'block';
}

function renderChats(filter = 'all', searchTerm = '') {
    let filteredChats = [...chats];
    
    // Apply search filter
    if (searchTerm) {
        filteredChats = filteredChats.filter(chat => 
            chat.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Apply type filter
    switch (filter) {
        case 'unread':
            filteredChats = filteredChats.filter(chat => chat.unread > 0);
            break;
        case 'personal':
            filteredChats = filteredChats.filter(chat => chat.type === 'personal');
            break;
        case 'groups':
            filteredChats = filteredChats.filter(chat => chat.type === 'group');
            break;
    }
    
    chatList.innerHTML = '';
    
    if (filteredChats.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>No chats found</p>
            <span>Try adjusting your search or filters</span>
        `;
        chatList.appendChild(emptyState);
        return;
    }
    
    filteredChats.forEach(chat => {
        const chatItem = createChatItem(chat);
        chatList.appendChild(chatItem);
    });
}

function createChatItem(chat) {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${currentChat?.id === chat.id ? 'active' : ''}`;
    chatItem.dataset.chatId = chat.id;
    
    chatItem.innerHTML = `
        <div class="chat-item-avatar" data-chat-id="${chat.id}">
            <span>${chat.avatar}</span>
            <div class="chat-item-status-dot ${chat.online ? 'online' : 'offline'}"></div>
        </div>
        <div class="chat-item-content">
            <div class="chat-item-header">
                <div class="chat-item-name">${chat.name}</div>
                <div class="chat-item-time">${chat.time}</div>
            </div>
            <div class="chat-item-preview">
                <span>${chat.lastMessage}</span>
                ${chat.unread > 0 ? `<div class="chat-item-unread">${chat.unread}</div>` : ''}
            </div>
        </div>
    `;
    
    // Add click event for chat selection
    chatItem.addEventListener('click', (e) => {
        // Don't trigger chat selection if avatar was clicked
        if (!e.target.closest('.chat-item-avatar')) {
            selectChat(chat);
        }
    });
    
    // Add click event for avatar
    const avatar = chatItem.querySelector('.chat-item-avatar');
    avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        openAvatarActionsModal(chat);
    });
    
    return chatItem;
}

function selectChat(chat) {
    currentChat = chat;
    
    // Update active state
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-chat-id="${chat.id}"]`).classList.add('active');
    
    // Update chat header
    chatTitle.textContent = chat.name;
    chatAvatar.textContent = chat.avatar;
    chatStatusDot.className = `chat-status-dot ${chat.online ? 'online' : 'offline'}`;
    
    if (chat.type === 'group') {
        chatStatus.textContent = `${chat.members.length} members`;
    } else {
        chatStatus.textContent = chat.online ? 'Online' : 'Last seen recently';
    }
    
    // Hide welcome screen and show message input
    hideWelcomeScreen();
    
    // Load messages (simulate)
    loadMessages(chat);
    
    // Mark as read
    if (chat.unread > 0) {
        chat.unread = 0;
        renderChats();
        updateFilterCounts();
    }
}

function loadMessages(chat) {
    // Simulate loading messages
    const messagesList = document.createElement('div');
    messagesList.className = 'messages-list';
    
    // Sample messages
    const sampleMessages = [
        {
            id: 1,
            username: chat.type === 'group' ? 'Alice' : chat.name,
            content: 'Hello there!',
            time: '10:30 AM',
            type: 'received'
        },
        {
            id: 2,
            username: currentUser.name,
            content: 'Hi! How are you?',
            time: '10:32 AM',
            type: 'sent'
        },
        {
            id: 3,
            username: chat.type === 'group' ? 'Bob' : chat.name,
            content: chat.lastMessage,
            time: chat.time,
            type: 'received'
        }
    ];
    
    sampleMessages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesList.appendChild(messageElement);
    });
    
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(messagesList);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (message.type === 'received' && currentChat.type === 'group') {
        bubble.innerHTML = `
            <div class="message-header">
                <span class="message-username">${message.username}</span>
                <span class="message-time">${message.time}</span>
            </div>
            <div class="message-content">${message.content}</div>
        `;
    } else {
        bubble.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-status">
                <span class="message-time">${message.time}</span>
                ${message.type === 'sent' ? '<span class="message-tick seen-tick">✓✓</span>' : ''}
            </div>
        `;
    }
    
    messageDiv.appendChild(bubble);
    return messageDiv;
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentChat) return;
    
    const message = {
        id: Date.now(),
        username: currentUser.name,
        content: content,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        type: 'sent'
    };
    
    const messageElement = createMessageElement(message);
    const messagesList = messagesContainer.querySelector('.messages-list');
    messagesList.appendChild(messageElement);
    
    // Update chat preview
    currentChat.lastMessage = content;
    currentChat.time = message.time;
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Re-render chats to update preview
    renderChats();
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Show file list
    fileList.style.display = 'block';
    
    // Create file list content
    const fileListHeader = document.createElement('div');
    fileListHeader.className = 'file-list-header';
    fileListHeader.innerHTML = `
        <span class="file-list-title">Selected Files (${files.length})</span>
        <button class="remove-all-btn">Remove All</button>
    `;
    
    const filesContainer = document.createElement('div');
    
    files.forEach((file, index) => {
        const fileItem = createFileItem(file, index);
        filesContainer.appendChild(fileItem);
    });
    
    fileList.innerHTML = '';
    fileList.appendChild(fileListHeader);
    fileList.appendChild(filesContainer);
    
    // Add remove all functionality
    fileListHeader.querySelector('.remove-all-btn').addEventListener('click', () => {
        fileInput.value = '';
        fileList.style.display = 'none';
    });
}

function createFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileIcon = getFileIcon(file.type);
    const fileSize = formatFileSize(file.size);
    
    fileItem.innerHTML = `
        <div class="file-info">
            <span class="file-icon">${fileIcon}</span>
            <div class="file-details">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
        </div>
        <button class="file-remove-btn" data-index="${index}">×</button>
    `;
    
    // Add remove functionality
    fileItem.querySelector('.file-remove-btn').addEventListener('click', () => {
        // Remove file from input (simplified)
        fileItem.remove();
        
        // Check if no files left
        const remainingFiles = fileList.querySelectorAll('.file-item');
        if (remainingFiles.length === 0) {
            fileInput.value = '';
            fileList.style.display = 'none';
        }
    });
    
    return fileItem;
}

function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleSearch() {
    const searchTerm = searchInput.value.trim();
    const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
    
    if (searchTerm) {
        clearSearchBtn.style.display = 'flex';
    } else {
        clearSearchBtn.style.display = 'none';
    }
    
    renderChats(activeFilter, searchTerm);
}

function clearSearch() {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
    renderChats(activeFilter);
}

function handleFilterChange(filter) {
    // Update active tab
    filterTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Render filtered chats
    const searchTerm = searchInput.value.trim();
    renderChats(filter, searchTerm);
}

function updateFilterCounts() {
    const totalChats = chats.length;
    const unreadChats = chats.filter(chat => chat.unread > 0).length;
    const personalChats = chats.filter(chat => chat.type === 'personal').length;
    const groupChats = chats.filter(chat => chat.type === 'group').length;
    
    allCount.textContent = `(${totalChats})`;
    unreadCount.textContent = `(${unreadChats})`;
    personalCount.textContent = `(${personalChats})`;
    groupsCount.textContent = `(${groupChats})`;
}

// Avatar Actions Modal Functions
function openAvatarActionsModal(chat) {
    avatarLargeInitial.textContent = chat.avatar;
    avatarUserName.textContent = chat.name;
    
    if (chat.type === 'group') {
        avatarUserContact.textContent = `${chat.members.length} members`;
    } else {
        avatarUserContact.textContent = '+91 99450 26856'; // Sample contact
    }
    
    avatarActionsModal.style.display = 'flex';
    avatarActionsModal.dataset.chatId = chat.id;
}

function closeAvatarActionsModal() {
    avatarActionsModal.style.display = 'none';
    delete avatarActionsModal.dataset.chatId;
}

// Chat Details Modal Functions
function openChatDetailsModal() {
    if (!currentChat) return;
    
    chatDetailsAvatar.textContent = currentChat.avatar;
    chatDetailsName.textContent = currentChat.name;
    
    if (currentChat.type === 'group') {
        chatDetailsContact.textContent = `${currentChat.members.length} members`;
        detailsSectionTitle.textContent = 'Group Members';
        loadGroupMembers(currentChat);
    } else {
        chatDetailsContact.textContent = '+91 99450 26856'; // Sample contact
        detailsSectionTitle.textContent = 'Groups in Common';
        loadCommonGroups(currentChat);
    }
    
    chatDetailsModal.style.display = 'flex';
}

function closeChatDetailsModalHandler() {
    chatDetailsModal.style.display = 'none';
}

function loadGroupMembers(chat) {
    // Show loading spinner
    detailsContent.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading members...</p>
        </div>
    `;
    
    // Simulate API call
    setTimeout(() => {
        const membersHtml = chat.members.map(member => `
            <div class="user-item">
                <div class="user-avatar-small">
                    <span>${member.charAt(0).toUpperCase()}</span>
                </div>
                <div class="user-info-small">
                    <div class="user-name-small">${member}</div>
                    <div class="user-login-small">@${member.toLowerCase()}</div>
                </div>
            </div>
        `).join('');
        
        detailsContent.innerHTML = `
            <div class="users-list">
                ${membersHtml}
            </div>
        `;
    }, 1000);
}

function loadCommonGroups(chat) {
    // Show loading spinner
    detailsContent.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading common groups...</p>
        </div>
    `;
    
    // Simulate API call
    setTimeout(() => {
        const commonGroups = chats.filter(c => c.type === 'group').slice(0, 3);
        
        if (commonGroups.length === 0) {
            detailsContent.innerHTML = `
                <div class="empty-selection">
                    <p>No groups in common</p>
                </div>
            `;
            return;
        }
        
        const groupsHtml = commonGroups.map(group => `
            <div class="user-item">
                <div class="user-avatar-small">
                    <span>${group.avatar}</span>
                </div>
                <div class="user-info-small">
                    <div class="user-name-small">${group.name}</div>
                    <div class="user-login-small">${group.members.length} members</div>
                </div>
            </div>
        `).join('');
        
        detailsContent.innerHTML = `
            <div class="users-list">
                ${groupsHtml}
            </div>
        `;
    }, 1000);
}

// Settings Functions
function toggleSettingsDropdown() {
    settingsDropdown.classList.toggle('show');
}

function openNewGroupModal() {
    settingsDropdown.classList.remove('show');
    newGroupModal.style.display = 'flex';
    loadAvailableUsers();
}

function closeNewGroupModalHandler() {
    newGroupModal.style.display = 'none';
    groupNameInput.value = '';
    availableUsersList.innerHTML = '';
    selectedUsersList.innerHTML = '';
    createGroupBtn.disabled = true;
}

function loadAvailableUsers() {
    availableUsersList.innerHTML = `
        <div class="loading-users">
            <div class="spinner-small"></div>
            <p>Loading users...</p>
        </div>
    `;
    
    // Simulate loading users
    setTimeout(() => {
        const users = [
            { name: 'Alice Johnson', login: 'alice' },
            { name: 'Bob Smith', login: 'bob' },
            { name: 'Charlie Brown', login: 'charlie' },
            { name: 'Diana Prince', login: 'diana' },
            { name: 'Eve Wilson', login: 'eve' }
        ];
        
        const usersHtml = users.map(user => `
            <div class="user-item" data-user="${user.login}">
                <div class="user-avatar-small">
                    <span>${user.name.charAt(0)}</span>
                </div>
                <div class="user-info-small">
                    <div class="user-name-small">${user.name}</div>
                    <div class="user-login-small">@${user.login}</div>
                </div>
            </div>
        `).join('');
        
        availableUsersList.innerHTML = usersHtml;
        
        // Add click events to user items
        availableUsersList.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => toggleUserSelection(item));
        });
    }, 1000);
}

function toggleUserSelection(userItem) {
    userItem.classList.toggle('selected');
    updateCreateGroupButton();
}

function updateCreateGroupButton() {
    const selectedUsers = document.querySelectorAll('#availableUsersList .user-item.selected');
    const groupName = groupNameInput.value.trim();
    
    createGroupBtn.disabled = !groupName || selectedUsers.length === 0;
}

function createGroup() {
    const groupName = groupNameInput.value.trim();
    const selectedUsers = document.querySelectorAll('#availableUsersList .user-item.selected');
    
    if (!groupName || selectedUsers.length === 0) return;
    
    // Create new group
    const newGroup = {
        id: Date.now(),
        name: groupName,
        type: 'group',
        lastMessage: 'Group created',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        unread: 0,
        online: false,
        avatar: groupName.charAt(0).toUpperCase(),
        members: Array.from(selectedUsers).map(item => {
            const nameElement = item.querySelector('.user-name-small');
            return nameElement ? nameElement.textContent : 'Unknown';
        })
    };
    
    chats.unshift(newGroup);
    renderChats();
    updateFilterCounts();
    closeNewGroupModalHandler();
    
    showToast('Group created successfully!', 'success');
}

function openActiveSessionsModal() {
    settingsDropdown.classList.remove('show');
    activeSessionsModal.style.display = 'flex';
    loadActiveSessions();
}

function closeActiveSessionsModal() {
    activeSessionsModal.style.display = 'none';
}

function loadActiveSessions() {
    sessionsContent.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading sessions...</p>
        </div>
    `;
    
    // Simulate loading sessions
    setTimeout(() => {
        const sessionsHtml = `
            <div class="session-category">
                <div class="category-header">
                    <div class="category-title">
                        <span class="category-icon">💻</span>
                        <span class="category-name">Web Sessions</span>
                    </div>
                    <div class="category-count">2</div>
                </div>
                <div class="session-list">
                    <div class="session-item">
                        <div class="session-icon current">💻</div>
                        <div class="session-details">
                            <div class="session-type">Current Session</div>
                            <div class="session-info">
                                <div class="session-ip">192.168.1.100</div>
                                <div class="session-time">Active now</div>
                            </div>
                            <div class="session-status">
                                <div class="status-dot-small online"></div>
                                <span class="status-text-small">Online</span>
                            </div>
                        </div>
                    </div>
                    <div class="session-item">
                        <div class="session-icon active">💻</div>
                        <div class="session-details">
                            <div class="session-type">Chrome Browser</div>
                            <div class="session-info">
                                <div class="session-ip">192.168.1.101</div>
                                <div class="session-time">2 hours ago</div>
                            </div>
                            <div class="session-status">
                                <div class="status-dot-small online"></div>
                                <span class="status-text-small">Online</span>
                            </div>
                        </div>
                        <div class="session-actions">
                            <button class="terminate-btn" title="Terminate session">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        sessionsContent.innerHTML = sessionsHtml;
    }, 1000);
}

function handleAction(action) {
    const chatId = avatarActionsModal.dataset.chatId || currentChat?.id;
    if (!chatId) return;
    
    const chat = chats.find(c => c.id == chatId);
    if (!chat) return;
    
    let message = '';
    switch (action) {
        case 'audio_call':
            message = `Starting audio call with ${chat.name}...`;
            break;
        case 'video_call':
            message = `Starting video call with ${chat.name}...`;
            break;
        case 'pay':
            message = `Opening payment for ${chat.name}...`;
            break;
        case 'search':
            message = `Searching in ${chat.name}...`;
            break;
    }
    
    showToast(message, 'info');
    closeAvatarActionsModal();
}

function refreshChats() {
    showToast('Refreshing chats...', 'info');
    
    // Simulate refresh
    setTimeout(() => {
        renderChats();
        updateFilterCounts();
        showNotificationToast('Chats Refreshed', 'Chat list has been updated');
    }, 1000);
}

function handleLogout() {
    settingsDropdown.classList.remove('show');
    
    // Reset state
    currentUser = null;
    currentChat = null;
    chats = [];
    isConnected = false;
    
    // Show login modal
    loginModal.style.display = 'flex';
    chatContainer.style.display = 'none';
    
    // Clear inputs
    usernameInput.value = '';
    messageInput.value = '';
    searchInput.value = '';
    
    showToast('Logged out successfully', 'success');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

function initializeDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
}

function toggleNotificationPanel() {
    notificationPanel.classList.toggle('show');
}

function closeNotificationPanel() {
    notificationPanel.classList.remove('show');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    const toastContainer = document.getElementById('toastContainer');
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showNotificationToast(title, message) {
    const notificationToast = document.getElementById('notificationToast');
    const titleElement = notificationToast.querySelector('.notification-title');
    const messageElement = notificationToast.querySelector('.notification-message');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    notificationToast.classList.add('show');
    
    setTimeout(() => {
        notificationToast.classList.remove('show');
    }, 3000);
}

// Group name input validation
if (groupNameInput) {
    groupNameInput.addEventListener('input', updateCreateGroupButton);
}