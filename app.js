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
        this.selectedFiles = [];
        this.pendingFiles = [];
        this.pendingFiles = [];
        
        // Add remove all files button event
        this.removeAllFilesBtn = document.getElementById('removeAllFilesBtn');
        if (this.removeAllFilesBtn) {
            this.removeAllFilesBtn.addEventListener('click', () => this.removeAllFiles());
        }
        
        // File upload tracking
        this.uploadProgress = new Map(); // Track upload progress for each file
        this.CHUNK_SIZE = 15 * 1024 * 1024; // 15 MB
        
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
        this.currentUserName = document.getElementById('currentUserName');
        this.welcomeUsername = document.getElementById('welcomeUsername');
        this.chatList = document.getElementById('chatList');
        this.chatTitle = document.getElementById('chatTitle');
        this.chatStatus = document.getElementById('chatStatus');
        this.chatAvatar = document.getElementById('chatAvatar');
        this.chatStatusDot = document.getElementById('chatStatusDot');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.fileInput = document.getElementById('fileInput');
        this.attachBtn = document.getElementById('attachBtn');
        this.fileList = document.getElementById('fileList');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.totalChatsCount = document.getElementById('totalChatsCount');
        
        // Search and filter elements
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.filterTabs = document.querySelectorAll('.filter-tab');
        
        // Filter count elements
        this.allCount = document.getElementById('allCount');
        this.unreadCount = document.getElementById('unreadCount');
        this.groupsCount = document.getElementById('groupsCount');
        this.onlineCount = document.getElementById('onlineCount');
        
        // Settings dropdown
        this.settingsDropdown = document.getElementById('settingsDropdown');
        this.newGroupBtn = document.getElementById('newGroupBtn');
        this.activeSessionsBtn = document.getElementById('activeSessionsBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Dark mode toggle
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Add missing currentUserContact element
        this.currentUserContact = document.getElementById('currentUserContact');
        
        // Toast container
        this.toastContainer = document.getElementById('toastContainer');
        this.notificationToast = document.getElementById('notificationToast');
        
        // Notification elements
        this.notificationIcon = document.getElementById('notificationIcon');
        this.notificationPanel = document.getElementById('notificationPanel');
        this.notificationClose = document.getElementById('notificationClose');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Login events
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key == 'Enter') this.handleLogin();
        });

        // Message events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key == 'Enter') this.sendMessage();
        });
        this.messageInput.addEventListener('input', () => this.updateSendButtonState());

        // File attachment events
        this.attachBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));

        // Search and filter events
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => this.handleFilterChange(tab.dataset.filter));
        });

        // Action buttons
        this.refreshBtn.addEventListener('click', () => this.refreshChats());
        this.settingsBtn.addEventListener('click', () => this.toggleSettingsDropdown());
        
        // Settings dropdown actions
        this.newGroupBtn.addEventListener('click', () => this.handleNewGroup());
        this.activeSessionsBtn.addEventListener('click', () => this.handleActiveSessions());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Notification events
        this.notificationIcon.addEventListener('click', () => this.showNotificationPanel());
        this.notificationClose.addEventListener('click', () => this.hideNotificationPanel());

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
        this.updateDarkModeIcon(true);
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        this.updateDarkModeIcon(isDark);
        
        // Save preference
        localStorage.setItem('darkMode', isDark);
    }

    /**
     * Update dark mode icon
     */
    updateDarkModeIcon(isDark) {
        this.darkModeToggle.innerHTML = isDark ? 
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>` :
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>`;
    }

    /**
     * Show notification panel
     */
    showNotificationPanel() {
        this.notificationPanel.classList.add('show');
    }

    /**
     * Hide notification panel
     */
    hideNotificationPanel() {
        this.notificationPanel.classList.remove('show');
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
        console.log('Hiding login modal');
        this.loginModal.style.display = 'none';
        this.chatContainer.style.display = 'flex';
        
        // Reset login button state
        this.loginBtn.disabled = false;
        this.loginBtn.textContent = 'Connect';
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
                <span class="toast-icon">${type == 'error' ? '❌' : type == 'success' ? '✅' : 'ℹ️'}</span>
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
     * Show notification toast
     */
    showNotificationToast(title, message) {
        const titleEl = this.notificationToast.querySelector('.notification-title');
        const messageEl = this.notificationToast.querySelector('.notification-message');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        this.notificationToast.classList.add('show');
        
        setTimeout(() => {
            this.notificationToast.classList.remove('show');
        }, 3000);
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
            // Add connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.ws && this.ws.readyState == WebSocket.CONNECTING) {
                    this.ws.close();
                    this.handleConnectionError();
                }
            }, 10000); // 10 second timeout
            
            this.ws = new WebSocket('ws://localhost:3000');
            
            this.ws.onopen = () => {
                clearTimeout(connectionTimeout);
                this.handleConnect();
            };
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = () => {
                clearTimeout(connectionTimeout);
                this.handleDisconnect();
            };
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
            
            // Check if we have a valid response structure
            if (data && (data.phpOutput || data.status)) {
                this.handleServerResponse(data);
            } else {
                console.warn('Invalid response structure:', data);
            }
            
        } catch (error) {
            console.error('Error parsing message:', error, 'Raw data:', event.data);
            // Try to handle non-JSON responses
            if (event.data) {
                console.log('Raw message received:', event.data);
            }
        }
    }

    /**
     * Handle server response
     */
    handleServerResponse(data) {
        console.log('Processing server response:', data);
        
        const { phpOutput, originalData, status } = data;
        
        if (!phpOutput) {
            console.warn('No phpOutput in response:', data);
            return;
        }

        // Handle login response
        if (originalData?.action == 'login' || (originalData && originalData.action == 'login')) {
            this.handleLoginResponse(phpOutput);
        }
        
        // Handle chat list response
        if (phpOutput.get_chats) {
            this.handleChatsResponse(phpOutput.get_chats);
        }
        
        // Handle messages response
        if (phpOutput.get_messages) {
            this.handleMessagesResponse(phpOutput);
        }
        
        // Handle send message response
        if (phpOutput.send_message) {
            this.handleSendMessageResponse(phpOutput.send_message);
        }
        
        // Handle chunk upload response
        if (phpOutput.chunk_upload) {
            this.handleChunkUploadResponse(phpOutput.chunk_upload);
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
        console.log('Handling login response:', phpOutput);
        
        // Check for successful login in multiple possible response formats
        const loginSuccess = (phpOutput.login && phpOutput.login.status == 'success') ||
                           (phpOutput.get_chats && phpOutput.get_chats.status == 'success');
        
        if (loginSuccess) {
            // Get user profile from response
            if (phpOutput.get_user_profile && phpOutput.get_user_profile.status == 'success') {
                this.userProfile = phpOutput.get_user_profile.user_profile;
                console.log('User profile loaded:', this.userProfile);
            }
            
            console.log('Login successful, hiding modal and enabling chat');
            this.hideLoginModal();
            this.updateUserInfo();
            this.enableChat();
            
            // If we already have chats in the response, use them
            if (phpOutput.get_chats) {
                this.handleChatsResponse(phpOutput.get_chats);
            } else {
                this.loadChats();
            }
            
            this.showToast('Login successful!', 'success');
        } else {
            const errorMessage = (phpOutput.login && phpOutput.login.message) || 'Login failed';
            console.log('Login failed:', errorMessage);
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
        this.updateConnectionStatus('Connection Error', false);
    }

    /**
     * Handle chats response
     */
    handleChatsResponse(chatsData) {
        console.log('Handling chats response:', chatsData);
        
        if (chatsData.status == 'success') {
            this.chats = chatsData.chats || [];
            console.log('Loaded chats:', this.chats.length);
            this.updateChatCounts();
            this.applyFiltersAndSearch();
        } else {
            console.warn('Failed to load chats:', chatsData);
            this.showToast('Failed to load conversations', 'error');
        }
    }

    handleMessagesResponse(responseData) {
        const messagesData = responseData.get_messages;
        const filesData = responseData.get_message_files;
        console.log('Handling messages response:', messagesData);

        if (messagesData && messagesData.status == 'success') {
            this.messages = messagesData.messages || [];
            
            // Handle message files from get_message_files response
            if (filesData && filesData.status == 'success') {
                this.messageFiles = filesData.message_files || [];
            } else {
                this.messageFiles = [];
            }
            
            // Update chat list with latest message info
            if (this.messages.length > 0 && this.currentRoomId) {
                this.updateChatFromMessages(this.currentRoomId, this.messages);
            }
            
            this.renderMessages();
        } else {
            console.warn('Failed to load messages:', responseData);
        }
    }

    /**
     * Handle send message response
     */
    handleSendMessageResponse(sendData) {
        console.log('Handling send message response:', sendData);
        
        if (sendData.status == 'success') {
            // Handle file uploads if files were sent
            if (sendData.files && sendData.files.length > 0) {
                this.handleFileUploads(sendData.files);
            }
            this.loadMessages();
        } else {
            console.warn('Failed to send message:', sendData);
            this.showToast('Failed to send message', 'error');
        }
    }

    /**
     * Handle file uploads after successful message send
     */
    handleFileUploads(files) {
        console.log('Starting file uploads:', files);
        
        // Show notification panel
        this.showNotificationPanel();
        
        // Start uploading each file
        files.forEach(fileInfo => {
            const originalFile = this.pendingFiles.find(f => f.name === fileInfo.FileName);
            if (originalFile) {
                this.sendFileInChunks(originalFile, fileInfo.FileId);
            }
        });
    }

    /**
     * Send file in chunks
     */
    sendFileInChunks(file, fileId) {
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
        
        // Initialize progress tracking
        const progressKey = `${fileId}_${file.name}`;
        this.uploadProgress.set(progressKey, {
            fileId: fileId,
            fileName: file.name,
            roomName: this.currentChatName,
            fileSize: file.size,
            totalChunks: totalChunks,
            currentChunk: 0,
            percentage: 0
        });
        
        this.updateUploadProgressDisplay();
        
        // Start with first chunk
        this.sendNextChunk(file, fileId, 0, totalChunks);
    }

    /**
     * Send next chunk of file
     */
    sendNextChunk(file, fileId, chunkIndex, totalChunks) {
        const offset = chunkIndex * this.CHUNK_SIZE;
        const blob = file.slice(offset, offset + this.CHUNK_SIZE);
        const reader = new FileReader();
        const sessionId = this.generateSessionId();

        reader.onload = (e) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const header = JSON.stringify({
                    action: 'chunk_upload',
                    username: this.username,
                    fileId: fileId,
                    fileName: file.name,
                    sessionid: sessionId,
                    chunkIndex: chunkIndex,
                    totalChunks: totalChunks,
                    batchId: this.generateBatchId(),
                    requestId: this.generateBatchId()
                });

                const encoder = new TextEncoder();
                const headerBytes = encoder.encode(header);
                const headerLengthBuffer = new Uint32Array([headerBytes.length]).buffer;
                const chunkBuffer = new Uint8Array(e.target.result);

                const fullBuffer = new Uint8Array(4 + headerBytes.length + chunkBuffer.length);
                fullBuffer.set(new Uint8Array(headerLengthBuffer), 0);
                fullBuffer.set(headerBytes, 4);
                fullBuffer.set(chunkBuffer, 4 + headerBytes.length);

                // Store pending chunk info for response handling
                this.pendingChunks = this.pendingChunks || new Map();
                this.pendingChunks.set(`${fileId}_${chunkIndex}`, {
                    file: file,
                    fileId: fileId,
                    chunkIndex: chunkIndex,
                    totalChunks: totalChunks
                });

                this.ws.send(fullBuffer);
                console.log(`Sent chunk ${chunkIndex + 1}/${totalChunks} for file ${file.name}`);
            }
        };

        reader.readAsArrayBuffer(blob);
    }

    /**
     * Handle chunk upload response
     */
    handleChunkUploadResponse(chunkData) {
        console.log('Handling chunk upload response:', chunkData);
        
        if (chunkData.status === 'success') {
            const fileId = chunkData.fileId;
            const chunkIndex = parseInt(chunkData.chunkIndex);
            const totalChunks = parseInt(chunkData.totalChunks);
            
            // Find pending chunk info
            const pendingKey = `${fileId}_${chunkIndex}`;
            const pendingChunk = this.pendingChunks?.get(pendingKey);
            
            if (pendingChunk) {
                // Update progress
                const progressKey = `${fileId}_${pendingChunk.file.name}`;
                const progress = this.uploadProgress.get(progressKey);
                
                if (progress) {
                    progress.currentChunk = chunkIndex + 1;
                    progress.percentage = Math.round((progress.currentChunk / progress.totalChunks) * 100);
                    this.updateUploadProgressDisplay();
                }
                
                // Send next chunk if not finished
                if (chunkIndex + 1 < totalChunks) {
                    this.sendNextChunk(pendingChunk.file, fileId, chunkIndex + 1, totalChunks);
                } else {
                    // Upload completed
                    console.log(`File upload completed: ${pendingChunk.file.name}`);
                    this.showNotificationToast('Upload Complete', `${pendingChunk.file.name} uploaded successfully`);
                    
                    // Remove from progress tracking after a delay
                    setTimeout(() => {
                        this.uploadProgress.delete(progressKey);
                        this.updateUploadProgressDisplay();
                    }, 2000);
                }
                
                // Clean up pending chunk
                this.pendingChunks.delete(pendingKey);
            }
        } else {
            console.error('Chunk upload failed:', chunkData);
            this.showToast('Chunk upload failed', 'error');
        }
    }

    /**
     * Update upload progress display in notification panel
     */
    updateUploadProgressDisplay() {
        // Don't clear existing items, just update or add new ones
        if (!this.notificationPanel) return;
        
        const content = this.notificationPanel.querySelector('.notification-panel-content');
        if (!content) return;
        
        const uploadCount = this.uploadProgress.size;
        
        if (uploadCount === 0) return;
        
        // Create or find upload section
        let uploadSection = content.querySelector('.upload-section');
        if (!uploadSection) {
            uploadSection = document.createElement('div');
            uploadSection.className = 'upload-section';
            uploadSection.innerHTML = '<h4>File Uploads</h4>';
            content.appendChild(uploadSection);
        }
        
        this.uploadProgress.forEach((progress, fileId) => {
            // Check if progress item already exists
            let progressItem = content.querySelector(`[data-file-id="${fileId}"]`);
            
            if (!progressItem) {
                // Create new progress item
                progressItem = document.createElement('div');
                progressItem.className = 'upload-progress-item';
                progressItem.dataset.fileId = fileId;
                content.appendChild(progressItem);
            }
            
            const percentage = progress.percentage;
            
            progressItem.innerHTML = `
                <div class="upload-info">
                    <div class="upload-header">
                        <div class="upload-icon">📁</div>
                        <div class="upload-details">
                            <div class="upload-filename">${this.escapeHtml(progress.fileName)}</div>
                            <div class="upload-room">Room: ${this.escapeHtml(progress.roomName)}</div>
                        </div>
                        <div class="upload-percentage">${percentage}%</div>
                    </div>
                    <div class="upload-progress-bar">
                        <div class="upload-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="upload-stats">
                        <span>Chunk ${progress.currentChunk}/${progress.totalChunks}</span>
                        <span>${this.formatFileSize(progress.fileSize)}</span>
                    </div>
                </div>
            `;
        });
    }

    /**
     * Handle incoming message
     */
    handleIncomingMessage(receiverData) {
        console.log('Handling incoming message:', receiverData);
        
        if (receiverData.receiver_sessions && receiverData.receiver_sessions.length > 0) {
            const session = receiverData.receiver_sessions[0];
            
            // Update chat list with new message info instead of making get_chats request
            this.updateChatFromReceiverSession(session);
            
            if (session.RoomId == this.currentRoomId) {
                this.loadMessages();
            }
        }
    }

    /**
     * Update chat from receiver session (incoming message)
     */
    updateChatFromReceiverSession(session) {
        const chatIndex = this.chats.findIndex(chat => chat.RoomId == session.RoomId);
        
        if (chatIndex != -1) {
            // Update existing chat
            this.chats[chatIndex].MsgTxt = session.MsgTxt;
            this.chats[chatIndex].Status = session.Sent_at;
            
            // Only increment unread if it's not the current active chat
            if (session.RoomId != this.currentRoomId) {
                this.chats[chatIndex].Unread = (this.chats[chatIndex].Unread || 0) + 1;
            }
            
            // Move chat to top of list
            const updatedChat = this.chats.splice(chatIndex, 1)[0];
            this.chats.unshift(updatedChat);
            
            this.updateChatCounts();
            this.applyFiltersAndSearch();
        }
    }

    /**
     * Update chat from messages response
     */
    updateChatFromMessages(roomId, messages) {
        const chatIndex = this.chats.findIndex(chat => chat.RoomId == roomId);
        
        if (chatIndex != -1 && messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            
            // Update chat with latest message and reset unread count
            this.chats[chatIndex].MsgTxt = latestMessage.MsgTxt;
            this.chats[chatIndex].Status = latestMessage.Sent_At;
            this.chats[chatIndex].Unread = 0; // Reset unread count when viewing messages
            
            this.updateChatCounts();
            this.applyFiltersAndSearch();
        }
    }

    /**
     * Update user info in UI
     */
    updateUserInfo() {
        console.log('Updating user info with profile:', this.userProfile);
        
        // Display name and contact info separately
        const displayName = this.userProfile?.name || this.username;
        const contactInfo = this.userProfile?.email || this.userProfile?.mobile || this.username;
        
        this.currentUserName.textContent = displayName;
        this.currentUserContact.textContent = contactInfo;
        this.welcomeUsername.textContent = displayName;
    }

    /**
     * Handle file selection
     */
    handleFileSelection(event) {
        const files = Array.from(event.target.files);
        const maxSize = 1024 * 1024 * 1024; // 1GB in bytes
        
        // Filter files that exceed size limit
        const validFiles = [];
        const invalidFiles = [];
        
        files.forEach(file => {
            if (file.size <= maxSize) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });
        
        // Show error for files that exceed limit
        if (invalidFiles.length > 0) {
            this.showToast(`Files exceed 1GB limit: ${invalidFiles.join(', ')}`, 'error');
        }
        
        // Add valid files to selection
        this.selectedFiles = [...this.selectedFiles, ...validFiles];
        this.renderFileList();
        this.updateSendButtonState();
        
        // Clear file input
        event.target.value = '';
    }

    /**
     * Remove file from selection
     */
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderFileList();
        this.updateSendButtonState();
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Remove all files from selection
     */
    removeAllFiles() {
        this.selectedFiles = [];
        this.renderFileList();
        this.updateSendButtonState();
    }

    /**
     * Render file list
     */
    renderFileList() {
        if (this.selectedFiles.length === 0) {
            this.fileList.style.display = 'none';
            return;
        }
        
        this.fileList.style.display = 'block';
        this.fileList.innerHTML = `
            <div class="file-list-header">
                <span class="file-list-title">Selected Files (${this.selectedFiles.length})</span>
                <button class="remove-all-btn" onclick="window.chatApp.removeAllFiles()" title="Remove all files">
                    Remove All
                </button>
            </div>
        `;
        
        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">📎</div>
                    <div class="file-details">
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="file-remove-btn" onclick="window.chatApp.removeFile(${index})" title="Remove file">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            `;
            
            this.fileList.appendChild(fileItem);
        });
    }

    /**
     * Update send button state
     */
    updateSendButtonState() {
        const hasMessage = this.messageInput.value.trim().length > 0;
        const hasFiles = this.selectedFiles.length > 0;
        
        this.sendBtn.disabled = !(hasMessage || hasFiles) || !this.isConnected;
    }

    /**
     * Update chat counts
     */
    updateChatCounts() {
        const allCount = this.chats.length;
        const unreadCount = this.chats.filter(chat => chat.Unread > 0).length;
        const groupsCount = this.chats.filter(chat => chat.ChatType == 'Group').length;
        const onlineCount = this.chats.filter(chat => 
            chat.Status == 'Online' || chat.Status.includes('Online')
        ).length;
        
        this.allCount.textContent = `(${allCount})`;
        this.unreadCount.textContent = `(${unreadCount})`;
        this.groupsCount.textContent = `(${groupsCount})`;
        this.onlineCount.textContent = `(${onlineCount})`;
        
        this.totalChatsCount.textContent = `${allCount} conversation${allCount != 1 ? 's' : ''}`;
    }

    /**
     * Enable chat functionality
     */
    enableChat() {
        this.messageInput.disabled = false;
        this.attachBtn.disabled = false;
        this.messageInput.placeholder = 'Type a message...';
        this.updateSendButtonState();
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
     * Refresh chats
     */
    refreshChats() {
        this.loadChats();
        this.showNotificationToast('Chats Refreshed', 'Chat list has been updated');
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
            tab.classList.toggle('active', tab.dataset.filter == filter);
        });
        
        this.applyFiltersAndSearch();
    }

    /**
     * Apply filters and search
     */
    applyFiltersAndSearch() {
        let filtered = [...this.chats];
        
        // Apply filter
        if (this.currentFilter != 'all') {
            filtered = filtered.filter(chat => {
                switch (this.currentFilter) {
                    case 'unread':
                        return chat.Unread > 0;
                    case 'groups':
                        return chat.ChatType == 'Group';
                    case 'online':
                        return chat.Status == 'Online' || chat.Status.includes('Online');
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
        
        if (this.filteredChats.length == 0) {
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
            
            const isOnline = chat.Status == 'Online' || chat.Status.includes('Online');
            const statusClass = isOnline ? 'online' : 'offline';
            
            const unreadBadge = chat.Unread > 0 ? 
                `<div class="chat-item-unread">${chat.Unread}</div>` : '';
            
            chatItem.innerHTML = `
                <div class="chat-item-avatar">
                    <span>${chat.Name.charAt(0).toUpperCase()}</span>
                    <div class="chat-item-status-dot ${statusClass}"></div>
                </div>
                <div class="chat-item-content">
                    <div class="chat-item-header">
                        <div class="chat-item-name">${chat.Name}</div>
                        <div class="chat-item-time">${this.formatTime(chat.Status)}</div>
                    </div>
                    <div class="chat-item-preview">
                        <span>${chat.MsgTxt || 'No messages yet'}</span>
                        ${unreadBadge}
                    </div>
                </div>
            `;
            
            chatItem.addEventListener('click', () => {
                this.selectChat(chat.RoomId, chat.Name, isOnline);
            });
            
            this.chatList.appendChild(chatItem);
        });
    }

    /**
     * Format time for display
     */
    formatTime(timeString) {
        if (timeString == 'Online') return 'Online';
        if (timeString.includes('Online')) return 'Online';
        return timeString;
    }

    /**
     * Select a chat
     */
    selectChat(roomId, chatName, isOnline = false) {
        // Clear selected files when switching conversations
        this.selectedFiles = [];
        this.renderFileList();
        this.updateSendButtonState();
        
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
        this.chatStatus.textContent = isOnline ? 'Online' : 'Offline';
        this.chatAvatar.textContent = chatName.charAt(0).toUpperCase();
        this.chatStatusDot.className = `chat-status-dot ${isOnline ? 'online' : ''}`;
        
        // Load messages for this chat
        this.loadMessages();
        
        // Hide welcome screen and show messages
        this.messagesContainer.innerHTML = '<div class="messages-list" id="messagesList"></div>';
    }

    /**
     * Render messages
     */
    renderMessages() {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;
        
        messagesList.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageEl = this.createMessageElement(message);
            messagesList.appendChild(messageEl);
        });
        
        this.scrollToBottom();
    }

    /**
     * Create message element
     */
    createMessageElement(message) {
        const messageEl = document.createElement('div');
        const isOwnMessage = message.User == this.username;
        
        messageEl.className = `message ${isOwnMessage ? 'sent' : 'received'}`;
        
        const time = new Date(message.Sent_At).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Get files for this message
        const messageFiles = this.messageFiles ? this.messageFiles.filter(file => parseInt(file.MsgId) === parseInt(message.MsgId)) : [];
        
        let filesHtml = '';
        if (messageFiles.length > 0) {
            filesHtml = `
                <div class="message-files">
                    ${messageFiles.map(file => `
                        <div class="message-file">
                            <div class="message-file-icon">📎</div>
                            <div class="message-file-info">
                                <div class="message-file-name">${this.escapeHtml(file.FileName)}</div>
                                <div class="message-file-size">${file.FileSize}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        messageEl.innerHTML = `
            <div class="message-bubble">
                <div class="message-header">
                    <span class="message-username">${message.Name || message.User}</span>
                    <span class="message-time">${time}</span>
                </div>
                ${message.MsgTxt ? `<div class="message-content">${this.escapeHtml(message.MsgTxt)}</div>` : ''}
                ${filesHtml}
            </div>
        `;
        
        return messageEl;
    }

    /**
     * Send message
     */
    sendMessage() {
        const messageText = this.messageInput.value.trim();
        
        if ((!messageText && this.selectedFiles.length === 0) || !this.currentRoomId) return;
        
        // Store files before clearing for upload process
        this.pendingFiles = [...this.selectedFiles];
        
        const messageData = {
            action: 'send_message',
            username: this.username,
            roomid: this.currentRoomId,
            message: messageText || '',
            sessionid: this.sessionId,
            batchId: this.generateBatchId(),
            requestId: this.generateBatchId()
        };
        
        // Add file data if files are selected
        if (this.selectedFiles.length > 0) {
            messageData.files = this.selectedFiles.map(file => file.name);
            messageData.size = this.selectedFiles.map(file => file.size);
        }
        
        this.sendJSON(messageData);
        this.messageInput.value = '';
        this.selectedFiles = [];
        this.renderFileList();
        this.updateSendButtonState();
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
        this.selectedFiles = [];
        
        // Reset UI
        this.usernameInput.value = '';
        this.loginBtn.disabled = false;
        this.loginBtn.textContent = 'Connect';
        this.loginError.textContent = '';
        this.searchInput.value = '';
        this.clearSearchBtn.style.display = 'none';
        this.selectedFiles = [];
        this.renderFileList();
        
        // Reset filter tabs
        this.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter == 'all');
        });
        
        this.disableChat();
        this.resetWelcomeScreen();
    }

    /**
     * Reset welcome screen
     */
    resetWelcomeScreen() {
        this.messagesContainer.innerHTML = `
            <div class="welcome-screen" id="welcomeScreen">
                <div class="welcome-icon">💬</div>
                <h3>Welcome to Nimble Chat</h3>
                <p>Hi <span id="welcomeUsername"></span>! Select a conversation to start chatting</p>
                <div class="connection-info">
                    <div class="connection-indicator">
                        <span class="connection-dot"></span>
                        <span>Connected</span>
                    </div>
                    <div class="chat-count">
                        <span class="chat-count-icon">👥</span>
                        <span id="totalChatsCount">0 conversations</span>
                    </div>
                </div>
            </div>
            
            <!-- Post-login welcome page -->
            <div class="post-login-welcome" id="postLoginWelcome" style="display: none;">
                <div class="welcome-animation">
                    <div class="welcome-logo">💬</div>
                    <div class="welcome-pulse"></div>
                </div>
                <h2>Welcome to Nimble Chat!</h2>
                <p>Hi <span id="postLoginUsername"></span>! You're now connected and ready to chat.</p>
                <div class="welcome-stats">
                    <div class="stat-item">
                        <div class="stat-icon">👥</div>
                        <div class="stat-text">
                            <span class="stat-number" id="welcomeTotalChats">0</span>
                            <span class="stat-label">Conversations</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📱</div>
                        <div class="stat-text">
                            <span class="stat-number" id="welcomeOnlineChats">0</span>
                            <span class="stat-label">Online</span>
                        </div>
                    </div>
                </div>
                <button class="welcome-continue-btn" id="welcomeContinueBtn">Start Chatting</button>
            </div>
        `;
        
        // Re-initialize elements
        this.welcomeUsername = document.getElementById('welcomeUsername');
        this.totalChatsCount = document.getElementById('totalChatsCount');
        this.postLoginWelcome = document.getElementById('postLoginWelcome');
        this.postLoginUsername = document.getElementById('postLoginUsername');
        this.welcomeContinueBtn = document.getElementById('welcomeContinueBtn');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.welcomeTotalChats = document.getElementById('welcomeTotalChats');
        this.welcomeOnlineChats = document.getElementById('welcomeOnlineChats');
        
        // Re-attach event listener
        if (this.welcomeContinueBtn) {
            this.welcomeContinueBtn.addEventListener('click', () => this.hidePostLoginWelcome());
        }
    }

    /**
     * Send JSON data through WebSocket
     */
    sendJSON(data) {
        if (this.ws && this.ws.readyState == WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            console.log('Sent:', data);
        } else {
            console.error('WebSocket not connected, readyState:', this.ws ? this.ws.readyState : 'null');
            this.showToast('Connection lost. Reconnecting...', 'warning');
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
        
        if (this.username && this.sessionId) {
            console.log('handleDisconnect()');
            this.attemptReconnect();
        }
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
        
        // Only attempt reconnect if user is logged in
        if (this.username && this.sessionId) {
            this.attemptReconnect();
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.showToast('Maximum reconnection attempts reached', 'error');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        this.showToast(`Reconnecting in ${delay / 1000} seconds... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'warning');
        
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
     * Disable chat functionality
     */
    disableChat() {
        this.messageInput.disabled = true;
        this.attachBtn.disabled = true;
        this.messageInput.placeholder = 'Reconnecting...';
        this.updateSendButtonState();
    }

    /**
     * Scroll messages to bottom
     */
    scrollToBottom() {
        const messagesList = document.getElementById('messagesContainer');
        if (messagesList) {
            messagesList.scrollTop = messagesList.scrollHeight;
        }
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
    window.chatApp = new WebSocketChat();
});