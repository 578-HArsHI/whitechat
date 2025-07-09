/**
 * WebSocket Chat Client
 * Handles real-time messaging with automatic reconnection
 */

class WebSocketChat {
    constructor() {
        this.ws = null;
        this.username = '';
        this.userProfile = null;
        this.sessionId = '';
        this.currentRoomId = '';
        this.currentChatName = '';
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.chats = [];
        this.filteredChats = [];
        this.messages = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeDarkMode();
        this.showLoginModal();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Login elements
        this.loginModal = document.getElementById('loginModal');
        this.usernameInput = document.getElementById('usernameInput');
        this.loginBtn = document.getElementById('loginBtn');
        this.loginError = document.getElementById('loginError');
        
        // Chat elements
        this.chatContainer = document.querySelector('.chat-container');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.currentUserSpan = document.getElementById('currentUser');
        this.currentUserName = document.getElementById('currentUserName');
        this.userAvatar = document.getElementById('userAvatar');
        this.chatList = document.getElementById('chatList');
        this.chatTitle = document.getElementById('chatTitle');
        this.chatStatus = document.getElementById('chatStatus');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.reconnectToast = document.getElementById('reconnectToast');
        this.reconnectMessage = document.getElementById('reconnectMessage');
        
        // Search and filter elements
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.filterTabs = document.querySelectorAll('.filter-tab');
        
        // Settings dropdown
        this.settingsDropdown = document.getElementById('settingsDropdown');
        this.newGroupBtn = document.getElementById('newGroupBtn');
        this.activeSessionsBtn = document.getElementById('activeSessionsBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Dark mode toggle
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Toast container
        this.toastContainer = document.getElementById('toastContainer');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Login events
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Message events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Search and filter events
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => this.handleFilterChange(tab.dataset.filter));
        });

        // Action buttons
        this.refreshBtn.addEventListener('click', () => this.loadChats());
        this.settingsBtn.addEventListener('click', () => this.toggleSettingsDropdown());
        
        // Settings dropdown actions
        this.newGroupBtn.addEventListener('click', () => this.handleNewGroup());
        this.activeSessionsBtn.addEventListener('click', () => this.handleActiveSessions());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Close settings dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.settingsBtn.contains(e.target) && !this.settingsDropdown.contains(e.target)) {
                this.settingsDropdown.classList.remove('show');
            }
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    /**
     * Initialize dark mode
     */
    initializeDarkMode() {
        // Set dark mode as default
        document.body.classList.add('dark-mode');
        this.darkModeToggle.innerHTML = '☀️';
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        this.darkModeToggle.innerHTML = isDark ? '☀️' : '🌙';
        
        // Save preference
        localStorage.setItem('darkMode', isDark);
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        this.loginModal.style.display = 'flex';
        this.usernameInput.focus();
        this.chatContainer.style.display = 'none';
    }

    /**
     * Hide login modal
     */
    hideLoginModal() {
        this.loginModal.style.display = 'none';
        this.chatContainer.style.display = 'flex';
    }

    /**
     * Handle login process
     */
    handleLogin() {
        const username = this.usernameInput.value.trim();
        
        if (!username) {
            this.showLoginError('Please enter a username');
            return;
        }

        this.username = username;
        this.sessionId = this.generateSessionId();
        this.loginError.textContent = '';
        this.loginBtn.disabled = true;
        this.loginBtn.textContent = 'Connecting...';
        
        this.connect();
    }

    /**
     * Show login error
     */
    showLoginError(message) {
        this.loginError.textContent = message;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate unique batch ID
     */
    generateBatchId() {
        return 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        this.updateConnectionStatus('Connecting...', false);
        
        try {
            this.ws = new WebSocket('ws://localhost:3000');
            
            this.ws.onopen = () => this.handleConnect();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = () => this.handleDisconnect();
            this.ws.onerror = (error) => this.handleError(error);
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleConnectionError();
        }
    }

    /**
     * Handle successful connection
     */
    handleConnect() {
        console.log('Connected to WebSocket server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('Connected', true);
        this.hideReconnectToast();
        
        // Send login message
        this.sendLoginMessage();
    }

    /**
     * Send login message to server
     */
    sendLoginMessage() {
        const loginData = {
            action: 'login',
            username: this.username,
            sessionid: this.sessionId,
            deviceip: '127.0.0.1',
            batchId: this.generateBatchId(),
            requestId: this.generateBatchId()
        };

        this.sendJSON(loginData);
    }

    /**
     * Handle incoming WebSocket message
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            
            this.handleServerResponse(data);
            
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    /**
     * Handle server response
     */
    handleServerResponse(data) {
        const { phpOutput, originalData } = data;
        
        if (!phpOutput) return;

        // Handle login response
        if (originalData?.action === 'login') {
            this.handleLoginResponse(phpOutput);
        }
        
        // Handle chat list response
        if (phpOutput.get_chats) {
            this.handleChatsResponse(phpOutput.get_chats);
        }
        
        // Handle messages response
        if (phpOutput.get_messages) {
            this.handleMessagesResponse(phpOutput.get_messages);
        }
        
        // Handle send message response
        if (phpOutput.send_message) {
            this.handleSendMessageResponse(phpOutput.send_message);
        }
        
        // Handle receiver sessions (incoming messages)
        if (phpOutput.get_receiver_sessions) {
            this.handleIncomingMessage(phpOutput.get_receiver_sessions);
        }
    }

    /**
     * Handle login response
     */
    handleLoginResponse(phpOutput) {
        if (phpOutput.login?.status === 'success') {
            // Get user profile from response
            if (phpOutput.get_user_profile?.status === 'success') {
                this.userProfile = phpOutput.get_user_profile.user_profile;
            }
            
            this.hideLoginModal();
            this.updateUserInfo();
            this.enableChat();
            this.loadChats();
            this.showToast('Login successful!', 'success');
        } else {
            const errorMessage = phpOutput.login?.message || 'Login failed';
            this.handleLoginError(errorMessage);
            this.showToast(errorMessage, 'error');
        }
    }

    /**
     * Handle login error
     */
    handleLoginError(message) {
        this.showLoginError(message);
        this.loginBtn.disabled = false;
        this.loginBtn.textContent = 'Connect';
    }

    /**
     * Handle chats response
     */
    handleChatsResponse(chatsData) {
        if (chatsData.status === 'success') {
            this.chats = chatsData.chats || [];
            this.applyFiltersAndSearch();
        }
    }

    /**
     * Handle messages response
     */
    handleMessagesResponse(messagesData) {
        if (messagesData.status === 'success') {
            this.messages = messagesData.messages || [];
            this.renderMessages();
        }
    }

    /**
     * Handle send message response
     */
    handleSendMessageResponse(sendData) {
        if (sendData.status === 'success') {
            this.loadMessages();
        }
    }

    /**
     * Handle incoming message
     */
    handleIncomingMessage(receiverData) {
        if (receiverData.receiver_sessions && receiverData.receiver_sessions.length > 0) {
            const session = receiverData.receiver_sessions[0];
            
            if (session.RoomId === this.currentRoomId) {
                this.loadMessages();
            }
            
            this.loadChats();
        }
    }

    /**
     * Update user info in UI
     */
    updateUserInfo() {
        const displayName = this.userProfile?.name || this.username;
        this.currentUserSpan.textContent = this.username;
        this.currentUserName.textContent = displayName;
        this.userAvatar.textContent = displayName.charAt(0).toUpperCase();
    }

    /**
     * Enable chat functionality
     */
    enableChat() {
        this.messageInput.disabled = false;
        this.sendBtn.disabled = false;
        this.messageInput.placeholder = 'Type your message...';
    }

    /**
     * Load chats from server
     */
    loadChats() {
        const chatsData = {
            action: 'get_chats',
            username: this.username,
            sessionid: this.sessionId,
            batchId: this.generateBatchId(),
            requestId: this.generateBatchId()
        };

        this.sendJSON(chatsData);
    }

    /**
     * Load messages for current room
     */
    loadMessages() {
        if (!this.currentRoomId) return;

        const messagesData = {
            action: 'get_messages',
            username: this.username,
            roomid: this.currentRoomId,
            sessionid: this.sessionId,
            batchId: this.generateBatchId(),
            requestId: this.generateBatchId()
        };

        this.sendJSON(messagesData);
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.clearSearchBtn.style.display = query ? 'block' : 'none';
        this.applyFiltersAndSearch();
    }

    /**
     * Clear search
     */
    clearSearch() {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.clearSearchBtn.style.display = 'none';
        this.applyFiltersAndSearch();
    }

    /**
     * Handle filter change
     */
    handleFilterChange(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        this.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        
        this.applyFiltersAndSearch();
    }

    /**
     * Apply filters and search
     */
    applyFiltersAndSearch() {
        let filtered = [...this.chats];
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(chat => {
                switch (this.currentFilter) {
                    case 'users':
                        return chat.ChatType === 'Single';
                    case 'groups':
                        return chat.ChatType === 'Group';
                    case 'online':
                        return chat.Status === 'Online' || chat.Status.includes('Online');
                    default:
                        return true;
                }
            });
        }
        
        // Apply search
        if (this.searchQuery) {
            filtered = filtered.filter(chat => 
                chat.Name.toLowerCase().includes(this.searchQuery) ||
                chat.MsgTxt.toLowerCase().includes(this.searchQuery)
            );
        }
        
        this.filteredChats = filtered;
        this.renderChatList();
    }

    /**
     * Render chat list
     */
    renderChatList() {
        this.chatList.innerHTML = '';
        
        if (this.filteredChats.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <p>No chats found</p>
                <small>${this.searchQuery ? 'Try a different search term' : 'Start a conversation'}</small>
            `;
            this.chatList.appendChild(emptyState);
            return;
        }
        
        this.filteredChats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.roomId = chat.RoomId;
            
            const isOnline = chat.Status === 'Online' || chat.Status.includes('Online');
            const statusDot = `<div class="status-dot ${isOnline ? 'online' : 'offline'}"></div>`;
            
            const unreadCount = chat.Unread > 0 ? 
                `<div class="unread-count">${chat.Unread}</div>` : '';
            
            chatItem.innerHTML = `
                <div class="avatar">
                    <span>${chat.Name.charAt(0).toUpperCase()}</span>
                    ${statusDot}
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-name">${chat.Name}</div>
                    <div class="chat-item-preview">${chat.MsgTxt}</div>
                </div>
                <div class="chat-item-meta">
                    <div class="chat-item-time">${chat.Status}</div>
                    ${unreadCount}
                </div>
            `;
            
            chatItem.addEventListener('click', () => {
                this.selectChat(chat.RoomId, chat.Name);
            });
            
            this.chatList.appendChild(chatItem);
        });
    }

    /**
     * Select a chat
     */
    selectChat(roomId, chatName) {
        this.currentRoomId = roomId;
        this.currentChatName = chatName;
        
        // Update active chat in UI
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-room-id="${roomId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        // Update chat header
        this.chatTitle.textContent = chatName;
        this.chatStatus.textContent = 'Click to view info';
        
        // Load messages for this chat
        this.loadMessages();
        
        // Clear welcome message
        this.messagesContainer.innerHTML = '';
    }

    /**
     * Render messages
     */
    renderMessages() {
        this.messagesContainer.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageEl = this.createMessageElement(message);
            this.messagesContainer.appendChild(messageEl);
        });
        
        this.scrollToBottom();
    }

    /**
     * Create message element
     */
    createMessageElement(message) {
        const messageEl = document.createElement('div');
        const isOwnMessage = message.User === this.username;
        
        messageEl.className = `message ${isOwnMessage ? 'sent' : 'received'}`;
        
        const time = new Date(message.Sent_At).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageEl.innerHTML = `
            <div class="message-bubble">
                <div class="message-header">
                    <span class="message-username">${message.Name || message.User}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-content">${this.escapeHtml(message.MsgTxt)}</div>
            </div>
        `;
        
        return messageEl;
    }

    /**
     * Send message
     */
    sendMessage() {
        const messageText = this.messageInput.value.trim();
        
        if (!messageText || !this.currentRoomId) return;
        
        const messageData = {
            action: 'send_message',
            username: this.username,
            roomid: this.currentRoomId,
            message: messageText,
            sessionid: this.sessionId,
            batchId: this.generateBatchId(),
            requestId: this.generateBatchId()
        };
        
        this.sendJSON(messageData);
        this.messageInput.value = '';
    }

    /**
     * Toggle settings dropdown
     */
    toggleSettingsDropdown() {
        this.settingsDropdown.classList.toggle('show');
    }

    /**
     * Handle new group action
     */
    handleNewGroup() {
        this.settingsDropdown.classList.remove('show');
        this.showToast('New group feature coming soon!', 'info');
    }

    /**
     * Handle active sessions action
     */
    handleActiveSessions() {
        this.settingsDropdown.classList.remove('show');
        this.showToast('Active sessions feature coming soon!', 'info');
    }

    /**
     * Handle logout
     */
    handleLogout() {
        this.settingsDropdown.classList.remove('show');
        
        // Send logout request
        const logoutData = {
            action: 'logout',
            username: this.username,
            sessionid: this.sessionId,
            deviceip: '127.0.0.1',
            batchId: this.generateBatchId(),
            requestId: this.generateBatchId()
        };
        
        this.sendJSON(logoutData);
        
        // Disconnect and reset
        this.disconnect();
        this.resetApplication();
        this.showLoginModal();
        this.showToast('Logged out successfully', 'success');
    }

    /**
     * Reset application state
     */
    resetApplication() {
        this.username = '';
        this.userProfile = null;
        this.sessionId = '';
        this.currentRoomId = '';
        this.currentChatName = '';
        this.chats = [];
        this.filteredChats = [];
        this.messages = [];
        this.searchQuery = '';
        this.currentFilter = 'all';
        
        // Reset UI
        this.usernameInput.value = '';
        this.loginBtn.disabled = false;
        this.loginBtn.textContent = 'Connect';
        this.loginError.textContent = '';
        this.searchInput.value = '';
        this.clearSearchBtn.style.display = 'none';
        
        // Reset filter tabs
        this.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === 'all');
        });
        
        this.disableChat();
    }

    /**
     * Send JSON data through WebSocket
     */
    sendJSON(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            console.log('Sent:', data);
        } else {
            console.error('WebSocket not connected');
            this.handleConnectionError();
        }
    }

    /**
     * Handle disconnect
     */
    handleDisconnect() {
        console.log('Disconnected from WebSocket server');
        this.isConnected = false;
        this.updateConnectionStatus('Disconnected', false);
        this.disableChat();
        this.attemptReconnect();
    }

    /**
     * Handle WebSocket error
     */
    handleError(error) {
        console.error('WebSocket error:', error);
        this.handleConnectionError();
    }

    /**
     * Handle connection error
     */
    handleConnectionError() {
        this.isConnected = false;
        this.updateConnectionStatus('Connection Error', false);
        this.disableChat();
        this.attemptReconnect();
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.showReconnectToast('Maximum reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        this.showReconnectToast(`Reconnecting in ${delay / 1000} seconds... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(text, isConnected) {
        const statusDot = this.connectionStatus.querySelector('.status-dot');
        const statusText = this.connectionStatus.querySelector('.status-text');
        
        statusText.textContent = text;
        
        if (isConnected) {
            statusDot.classList.add('connected');
        } else {
            statusDot.classList.remove('connected');
        }
    }

    /**
     * Show reconnect toast
     */
    showReconnectToast(message) {
        this.reconnectMessage.textContent = message;
        this.reconnectToast.classList.add('show');
    }

    /**
     * Hide reconnect toast
     */
    hideReconnectToast() {
        this.reconnectToast.classList.remove('show');
    }

    /**
     * Disable chat functionality
     */
    disableChat() {
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
        this.messageInput.placeholder = 'Reconnecting...';
    }

    /**
     * Scroll messages to bottom
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Initialize the chat application when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WebSocketChat();
});