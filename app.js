/**
 * WebSocket Chat Client
 * Handles real-time messaging with automatic reconnection
 */

class WebSocketChat {
    constructor() {
        this.ws = null;
        this.username = '';
        this.sessionId = '';
        this.currentRoomId = '';
        this.currentChatName = '';
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.chats = [];
        this.messages = [];
        
        this.initializeElements();
        this.attachEventListeners();
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
        this.userAvatar = document.getElementById('userAvatar');
        this.chatList = document.getElementById('chatList');
        this.chatTitle = document.getElementById('chatTitle');
        this.chatStatus = document.getElementById('chatStatus');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.reconnectToast = document.getElementById('reconnectToast');
        this.reconnectMessage = document.getElementById('reconnectMessage');
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

        // Refresh button
        this.refreshBtn.addEventListener('click', () => this.loadChats());

        // Window events
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        this.loginModal.style.display = 'flex';
        this.usernameInput.focus();
    }

    /**
     * Hide login modal
     */
    hideLoginModal() {
        this.loginModal.style.display = 'none';
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
            deviceip: '127.0.0.1', // Default IP for local testing
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
            this.hideLoginModal();
            this.updateUserInfo();
            this.enableChat();
            this.loadChats();
        } else {
            this.handleLoginError(phpOutput.login?.message || 'Login failed');
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
            this.renderChatList();
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
            // Message sent successfully, reload messages
            this.loadMessages();
        }
    }

    /**
     * Handle incoming message
     */
    handleIncomingMessage(receiverData) {
        if (receiverData.receiver_sessions && receiverData.receiver_sessions.length > 0) {
            const session = receiverData.receiver_sessions[0];
            
            // If this is for the current room, reload messages
            if (session.RoomId === this.currentRoomId) {
                this.loadMessages();
            }
            
            // Update chat list to show new message
            this.loadChats();
        }
    }

    /**
     * Update user info in UI
     */
    updateUserInfo() {
        this.currentUserSpan.textContent = this.username;
        this.userAvatar.textContent = this.username.charAt(0).toUpperCase();
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
     * Render chat list
     */
    renderChatList() {
        this.chatList.innerHTML = '';
        
        this.chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.roomId = chat.RoomId;
            
            const unreadCount = chat.Unread > 0 ? 
                `<div class="unread-count">${chat.Unread}</div>` : '';
            
            chatItem.innerHTML = `
                <div class="avatar">
                    <span>${chat.Name.charAt(0).toUpperCase()}</span>
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
        
        // Scroll to bottom
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