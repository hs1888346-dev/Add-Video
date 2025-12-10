// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyCh3l_nm0h0rftal0-NZH0Nl5Vuf0MU_gM",
    authDomain: "noteapp-1ad69.firebaseapp.com",
    databaseURL: "https://noteapp-1ad69-default-rtdb.firebaseio.com",
    projectId: "noteapp-1ad69",
    storageBucket: "noteapp-1ad69.appspot.com",
    messagingSenderId: "33056669455",
    appId: "1:33056669455:web:21b7f7f58847112b9a487a",
    measurementId: "G-RXS945QBFY"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("LOG: Firebase initialized successfully.");
} catch (e) {
    console.error("ERROR: Firebase Initialization Failed:", e);
}

const auth = firebase.auth();
const database = firebase.database();

// --- UI Elements ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const registerButton = document.getElementById('register-btn');
const loginButton = document.getElementById('login-btn');

const videoForm = document.getElementById('video-form');
const videoDialog = document.getElementById('video-dialog');
const saveToDbButton = document.getElementById('save-to-db-btn');
const closeDialogButton = document.getElementById('close-dialog-btn');

const loadVideosButton = document.getElementById('load-videos-btn');
const videoSelect = document.getElementById('video-select');
const saveButton = document.getElementById('save-btn'); // Renamed for clarity

let videoDataToSave = {};
let availableVideos = {}; // Stores all fetched video data indexed by file_unique_id

// --- 1. Authentication Functions ---

function handleRegistration() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    // ... (Error handling and Firebase call remains the same)
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert("Registration successful!"))
        .catch((error) => alert(`Registration Failed: ${error.message}`));
}

function handleLogin() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    // ... (Error handling and Firebase call remains the same)
    auth.signInWithEmailAndPassword(email, password)
        .then(() => console.log("Login successful!"))
        .catch((error) => alert(`Login Failed: ${error.message}`));
}

// Attach event listeners
if (registerButton) registerButton.addEventListener('click', handleRegistration);
if (loginButton) loginButton.addEventListener('click', handleLogin);

// Authentication State Change (UI Management)
auth.onAuthStateChanged((user) => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});


// --- 2. Load Videos Logic (New Functionality) ---
function fetchVideosForDropdown() {
    const botToken = document.getElementById('token-input').value;
    if (!botToken) {
        alert("Please enter the Telegram Bot Token first.");
        return;
    }

    const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;
    loadVideosButton.disabled = true;
    loadVideosButton.textContent = 'Loading...';
    videoSelect.innerHTML = '<option value="">Loading videos...</option>';
    saveButton.disabled = true;

    // Fetch the latest 100 updates (limit=100)
    fetch(`${TELEGRAM_API}/getUpdates?limit=100`)
        .then(response => {
             if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
             return response.json();
        })
        .then(data => {
            if (!data.ok) throw new Error(data.description || 'API error. Check Token/Permissions.');
            
            availableVideos = {};
            let videoCount = 0;
            videoSelect.innerHTML = '<option value="">-- Select a Video --</option>';

            data.result.reverse().forEach(update => { // Process newest updates first
                const message = update.channel_post || update.message;
                if (message && message.video) {
                    const video = message.video;
                    const videoTitle = (message.caption || video.file_unique_id) + ` (Size: ${(video.file_size / 1024 / 1024).toFixed(2)} MB)`;
                    
                    // Store full video data using unique ID as the key
                    availableVideos[video.file_unique_id] = {
                        videoData: video,
                        caption: message.caption || '',
                        message
                    };

                    // Add option to the dropdown
                    const option = document.createElement('option');
                    option.value = video.file_unique_id;
                    option.textContent = videoTitle;
                    videoSelect.appendChild(option);
                    videoCount++;
                }
            });

            if (videoCount === 0) {
                 videoSelect.innerHTML = '<option value="">No videos found in recent updates.</option>';
            }
            console.log(`LOG: Successfully loaded ${videoCount} videos.`);
            saveButton.disabled = (videoCount === 0);
        })
        .catch(error => {
            console.error("ERROR: Failed to load videos:", error);
            alert(`Failed to load videos: ${error.message}`);
            videoSelect.innerHTML = '<option value="">Failed to load videos.</option>';
        })
        .finally(() => {
            loadVideosButton.textContent = 'Load Videos';
            loadVideosButton.disabled = false;
        });
}

if (loadVideosButton) {
    loadVideosButton.addEventListener('click', fetchVideosForDropdown);
}


// --- 3. Form Submission (Get Details from Selected Video) ---
if (videoForm) {
    videoForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const selectedVideoId = videoSelect.value;
        const title = document.getElementById('title-input').value;
        const description = document.getElementById('description-input').value;
        const botToken = document.getElementById('token-input').value;

        if (!selectedVideoId) {
            alert("Please select a video from the dropdown list.");
            return;
        }

        const videoDetailsFromTelegram = availableVideos[selectedVideoId].videoData;
        const latestVideoMessage = availableVideos[selectedVideoId].message;
        const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;
        
        saveButton.disabled = true;
        saveButton.textContent = 'Fetching Details...';

        
        let realThumbnailURL;

        // Step 1: Check for thumbnail ID
        if (videoDetailsFromTelegram.thumb && videoDetailsFromTelegram.thumb.file_id) {
            // Step 2: Call getFile API to get the file_path for the thumbnail
            fetch(`${TELEGRAM_API}/getFile?file_id=${videoDetailsFromTelegram.thumb.file_id}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(fileData => {
                const file_path = fileData.result.file_path;
                // Step 3: Construct the final downloadable URL for the thumbnail
                realThumbnailURL = `https://api.telegram.org/file/bot${botToken}/${file_path}`;
                return realThumbnailURL;
            })
            .catch(error => {
                console.error("ERROR: Thumbnail fetch failed, using placeholder:", error);
                realThumbnailURL = 'https://via.placeholder.com/150x100?text=THUMBNAIL+ERROR';
                return realThumbnailURL; // Return placeholder to continue
            })
            .finally(() => {
                displayConfirmationDialog(title, description, videoDetailsFromTelegram, latestVideoMessage, realThumbnailURL);
            });
        } else {
            // If no thumbnail exists, display the dialog immediately
            realThumbnailURL = 'https://via.placeholder.com/150x100?text=NO+THUMBNAIL';
            displayConfirmationDialog(title, description, videoDetailsFromTelegram, latestVideoMessage, realThumbnailURL);
        }
    });
}

// Helper function to handle dialog display and data preparation
function displayConfirmationDialog(title, description, videoDetailsFromTelegram, latestVideoMessage, realThumbnailURL) {
    const realVideoId = videoDetailsFromTelegram.file_unique_id;
    const realVideoName = title + " (" + (latestVideoMessage.caption || 'Video File') + ")";

    // Prepare all data for the final save
    videoDataToSave = {
        title: title,
        description: description,
        
        // Essential Telegram IDs
        videoId: realVideoId,
        telegramFileId: videoDetailsFromTelegram.file_id, 
        thumbnailId: videoDetailsFromTelegram.thumb ? videoDetailsFromTelegram.thumb.file_unique_id : 'N/A', 
        
        // Video Metadata
        size: videoDetailsFromTelegram.file_size, 
        duration: videoDetailsFromTelegram.duration, 
        mimeType: videoDetailsFromTelegram.mime_type, 
        width: videoDetailsFromTelegram.width, 
        height: videoDetailsFromTelegram.height, 
        
        // Thumbnail Data
        thumbnailURL: realThumbnailURL, 
        
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    };

    // Populate and show the confirmation dialog
    document.getElementById('dialog-thumbnail').src = realThumbnailURL;
    document.getElementById('dialog-thumbnail').onerror = () => {
        document.getElementById('dialog-thumbnail').src = 'https://via.placeholder.com/150x100?text=Error+Loading';
    };
    document.getElementById('dialog-video-name').textContent = realVideoName;
    document.getElementById('dialog-title-display').textContent = title; // Display user-entered title in dialog
    videoDialog.style.display = 'flex';
    saveButton.textContent = 'Get Details & Save';
    saveButton.disabled = false;
    console.log("LOG: Confirmation Dialog Shown with All Data.");
}


// --- 4. Save to Database Logic ---
if (closeDialogButton) {
    closeDialogButton.addEventListener('click', () => {
        videoDialog.style.display = 'none';
        console.log("LOG: Dialog Closed.");
    });
}

if (saveToDbButton) {
    saveToDbButton.addEventListener('click', () => {
        console.log("LOG: SaveTo Database Button Clicked.");
        
        if (videoDataToSave.videoId) {
            const videoId = videoDataToSave.videoId;
            
            // Path: 'videos/'
            const videoRef = database.ref('videos/' + videoId);

            videoRef.set(videoDataToSave)
                .then(() => {
                    console.log("SUCCESS: Data saved for video ID:", videoId);
                    alert("Video metadata saved successfully!");
                    videoDialog.style.display = 'none'; 
                    videoForm.reset(); 
                    // Clear the selection after saving
                    videoSelect.innerHTML = '<option value="">-- Load videos first --</option>'; 
                })
                .catch((error) => {
                    console.error("ERROR: Database Save Error:", error.message);
                    alert(`Failed to save data: ${error.message}`);
                });
        } else {
            console.error("ERROR: videoDataToSave is empty. Form not processed?");
            alert("Error: Please select and process a video first.");
        }
    });
                               }
                                
