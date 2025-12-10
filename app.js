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
const saveButton = document.getElementById('save-btn'); 
const videoPreviewGroup = document.getElementById('video-preview-group');
const videoPreviewImage = document.getElementById('video-preview');

let videoDataToSave = {};
let availableVideos = {}; // Stores all fetched video data indexed by file_unique_id

// --- 1. Authentication Functions ---
function handleRegistration() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    if (!email || password.length < 6) {
        alert("Please enter a valid email and a password of at least 6 characters.");
        return;
    }
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert("Registration successful!"))
        .catch((error) => alert(`Registration Failed: ${error.message}`));
}

function handleLogin() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }
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


// --- Helper: Function to Fetch Thumbnail URL ---
async function getThumbnailUrl(botToken, thumbFileId) {
    const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;
    
    if (!thumbFileId) {
        return 'https://via.placeholder.com/150x100?text=NO+THUMBNAIL';
    }

    try {
        const response = await fetch(`${TELEGRAM_API}/getFile?file_id=${thumbFileId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const fileData = await response.json();
        const file_path = fileData.result.file_path;
        
        if (file_path) {
            // This is the full download/stream URL, valid for ~1 hour
            return `https://api.telegram.org/file/bot${botToken}/${file_path}`;
        }
        return 'https://via.placeholder.com/150x100?text=THUMBNAIL+PATH+FAIL';

    } catch (error) {
        console.error("ERROR: Failed to fetch thumbnail path:", error);
        return 'https://via.placeholder.com/150x100?text=THUMBNAIL+ERROR';
    }
}


// --- 2. Load Videos Logic ---
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
    videoPreviewGroup.style.display = 'none';

    // Fetch the latest 100 updates
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

            // Process updates, newest first (reverse)
            data.result.reverse().forEach(update => { 
                const message = update.channel_post || update.message;
                if (message && message.video) {
                    const video = message.video;
                    const videoTitle = (message.caption || 'No Caption') + ` | ${video.file_unique_id.substring(0, 8)}... | ${(video.file_size / 1024 / 1024).toFixed(2)} MB`;
                    
                    availableVideos[video.file_unique_id] = {
                        videoData: video,
                        caption: message.caption || '',
                        message
                    };

                    const option = document.createElement('option');
                    option.value = video.file_unique_id;
                    option.textContent = videoTitle;
                    videoSelect.appendChild(option);
                    videoCount++;
                }
            });

            if (videoCount === 0) {
                 videoSelect.innerHTML = '<option value="">No videos found in recent updates. Check token/permissions.</option>';
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


// --- 3. Video Selection Change Listener (Shows Preview) ---
if (videoSelect) {
    videoSelect.addEventListener('change', async () => {
        const selectedVideoId = videoSelect.value;
        const botToken = document.getElementById('token-input').value;

        if (!selectedVideoId || !botToken) {
            videoPreviewGroup.style.display = 'none';
            return;
        }

        const videoDetails = availableVideos[selectedVideoId].videoData;
        const thumbFileId = videoDetails.thumb ? videoDetails.thumb.file_id : null;

        videoPreviewGroup.style.display = 'block';
        videoPreviewImage.src = 'https://via.placeholder.com/150x100?text=Loading...';
        
        // Fetch and show the temporary thumbnail URL
        const realThumbnailURL = await getThumbnailUrl(botToken, thumbFileId);
        
        videoPreviewImage.src = realThumbnailURL;
        videoPreviewImage.onerror = () => {
            videoPreviewImage.src = 'https://via.placeholder.com/150x100?text=Preview+Error';
        };
        console.log("LOG: Preview Image Updated with URL:", realThumbnailURL);
    });
}


// --- 4. Form Submission (Get Details from Selected Video) ---
if (videoForm) {
    videoForm.addEventListener('submit', async (e) => {
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
        const thumbFileId = videoDetailsFromTelegram.thumb ? videoDetailsFromTelegram.thumb.file_id : null;

        saveButton.disabled = true;
        saveButton.textContent = 'Processing...';

        // Fetch the temporary thumbnail URL for the dialog display
        const realThumbnailURL = await getThumbnailUrl(botToken, thumbFileId);


        // Display Confirmation Dialog and Prepare Data
        // 🎯 CRITICAL: Saving Telegram File IDs for Stream Link generation
        const finalVideoFileId = videoDetailsFromTelegram.file_id; // Permanent File ID for video
        const finalThumbnailFileId = videoDetailsFromTelegram.thumb ? videoDetailsFromTelegram.thumb.file_id : 'N/A'; // Permanent File ID for thumbnail
        
        const firebaseKey = videoDetailsFromTelegram.file_unique_id; 

        const realVideoName = title + " (" + (latestVideoMessage.caption || 'Video File') + ")";

        videoDataToSave = {
            title: title,
            description: description,
            
            // Saving the Telegram File IDs (use this with /getFile for streaming link)
            videoId: finalVideoFileId, 
            thumbnailId: finalThumbnailFileId, 
            
            // Key for Firebase
            fileUniqueId: firebaseKey, 

            // Video Metadata
            size: videoDetailsFromTelegram.file_size, 
            duration: videoDetailsFromTelegram.duration, 
            mimeType: videoDetailsFromTelegram.mime_type, 
            width: videoDetailsFromTelegram.width, 
            height: videoDetailsFromTelegram.height, 
            
            // Thumbnail Data (Temporary URL for reference only)
            thumbnailURL: realThumbnailURL, 
            
            timestamp: firebase.database.ServerValue.TIMESTAMP 
        };

        // Populate and show the confirmation dialog
        document.getElementById('dialog-thumbnail').src = realThumbnailURL;
        document.getElementById('dialog-thumbnail').onerror = () => {
            document.getElementById('dialog-thumbnail').src = 'https://via.placeholder.com/150x100?text=Error+Loading';
        };
        document.getElementById('dialog-video-name').textContent = realVideoName;
        document.getElementById('dialog-title-display').textContent = title; 
        videoDialog.style.display = 'flex';
        saveButton.textContent = 'Get Details & Save';
        saveButton.disabled = false;
        console.log("LOG: Confirmation Dialog Shown. File IDs saved.");
    });
}


// --- 5. Save to Database Logic ---
if (closeDialogButton) {
    closeDialogButton.addEventListener('click', () => {
        videoDialog.style.display = 'none';
        console.log("LOG: Dialog Closed.");
    });
}

if (saveToDbButton) {
    saveToDbButton.addEventListener('click', () => {
        console.log("LOG: SaveTo Database Button Clicked.");
        
        if (videoDataToSave.fileUniqueId) {
            const firebaseKey = videoDataToSave.fileUniqueId;
            
            // Path: 'videos/'
            const videoRef = database.ref('videos/' + firebaseKey);

            videoRef.set(videoDataToSave)
                .then(() => {
                    console.log("SUCCESS: Data saved for fileUniqueId:", firebaseKey);
                    alert("Video metadata saved successfully!");
                    videoDialog.style.display = 'none'; 
                    videoForm.reset(); 
                    videoSelect.innerHTML = '<option value="">-- Load videos first --</option>'; 
                    videoPreviewGroup.style.display = 'none'; 
                })
                .catch((error) => {
                    console.error("ERROR: Database Save Error:", error.message);
                    alert(`Failed to save data: ${error.message}`);
                });
        } else {
            console.error("ERROR: videoDataToSave is empty or missing fileUniqueId.");
            alert("Error: Please select and process a video first.");
        }
    });
            }
