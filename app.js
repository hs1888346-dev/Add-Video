// --- Firebase Configuration (Same as before) ---
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

let videoDataToSave = {};

// --- 1. Email/Password Authentication Functions ---

function handleRegistration() {
    console.log("LOG: Registration process started."); 
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    
    if (!email || password.length < 6) {
        alert("Please enter a valid email and a password of at least 6 characters.");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("SUCCESS: Registration Successful for:", userCredential.user.email);
            alert("Registration successful! You are now logged in.");
        })
        .catch((error) => {
            console.error("ERROR: Registration Error:", error.code, error.message);
            alert(`Registration Failed: ${error.message}`);
        });
}

function handleLogin() {
    console.log("LOG: Login process started."); 
    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("SUCCESS: Login Successful for:", userCredential.user.email);
            alert("Login successful!");
        })
        .catch((error) => {
            console.error("ERROR: Login Error:", error.code, error.message);
            alert(`Login Failed: ${error.message}`);
        });
}

// Attach event listeners
if (registerButton) {
    registerButton.addEventListener('click', handleRegistration);
}
if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
}

// Authentication State Change (UI Management)
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("LOG: User is signed in. Showing main app.");
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
    } else {
        console.log("LOG: User is signed out. Showing login form.");
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});


// --- 2. Form Submission (Direct Telegram API Call) ---
if (videoForm) {
    videoForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        console.log("LOG: Video Form Submission Started. Calling Telegram API Directly.");

        const title = document.getElementById('title-input').value;
        const description = document.getElementById('description-input').value;
        const botToken = document.getElementById('token-input').value;
        
        // Telegram API Endpoint Base URL
        const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;

        document.getElementById('save-btn').disabled = true;
        document.getElementById('save-btn').textContent = 'Fetching Video...';

        let videoData; // Video object will be stored here
        let latestVideoMessage; // Full message object

        // Step 1: Get recent updates/messages
        fetch(`${TELEGRAM_API}/getUpdates`)
        .then(response => {
             if (!response.ok) {
                // If status is not 200-299, throw an error
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.ok) {
                // Telegram API returned an error message (e.g., wrong token)
                throw new Error(data.description || 'Unknown Telegram API error. Check Bot Token.');
            }
            
            const latestUpdates = data.result;
            
            // Find the latest message containing a video object
            for (let i = latestUpdates.length - 1; i >= 0; i--) {
                const message = latestUpdates[i].channel_post || latestUpdates[i].message;
                if (message && message.video) {
                    latestVideoMessage = message;
                    break; 
                }
            }

            if (!latestVideoMessage) {
                throw new Error("No recent video found. Ensure the Bot has access to the chat/channel.");
            }

            videoData = latestVideoMessage.video;

            // Check if thumbnail exists
            if (videoData.thumb && videoData.thumb.file_id) {
                console.log("LOG: Thumbnail File ID found. Proceeding to get File Path...");
                // Step 2: Call getFile API to get the file_path for the thumbnail
                return fetch(`${TELEGRAM_API}/getFile?file_id=${videoData.thumb.file_id}`);
            } else {
                console.warn("WARN: No thumbnail available for the latest video. Skipping getFile.");
                // If no thumbnail, we return a fallback object to proceed to the next step
                return { json: () => Promise.resolve({ ok: true, result: { file_path: 'NO_THUMBNAIL_FOUND' } }) };
            }
        })
        .then(response => {
            // Check if it's the real fetch response or the fallback JSON function
            if (typeof response.json === 'function') {
                return response.json();
            } else {
                 throw new Error("Internal logic error during getFile step."); 
            }
        })
        .then(fileData => {
            const file_path = fileData.result.file_path;
            
            let realThumbnailURL;

            if (file_path && file_path !== 'NO_THUMBNAIL_FOUND') {
                 // Step 3: Construct the final downloadable URL for the thumbnail
                 realThumbnailURL = `https://api.telegram.org/file/bot${botToken}/${file_path}`;
                 console.log("SUCCESS: Thumbnail URL constructed:", realThumbnailURL);
            } else {
                 // Fallback if no thumbnail path was available
                 realThumbnailURL = 'https://via.placeholder.com/150x100?text=NO+THUMBNAIL';
                 console.log("WARN: Using placeholder thumbnail.");
            }

            // Final data preparation using videoData from Step 1
            const realVideoId = videoData.file_unique_id;
            const realVideoName = title + " (" + (latestVideoMessage.caption || 'Video File') + ")";

            // Prepare data for the final save
            videoDataToSave = {
                videoId: realVideoId,
                thumbnailId: videoData.thumb ? videoData.thumb.file_unique_id : 'N/A', 
                title: title,
                description: description,
                size: videoData.file_size, 
                duration: videoData.duration, 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            };

            // Populate and show the confirmation dialog
            document.getElementById('dialog-thumbnail').src = realThumbnailURL;
            document.getElementById('dialog-thumbnail').onerror = () => {
                // If the constructed URL fails to load (e.g., token or file path issue), show a generic error image
                document.getElementById('dialog-thumbnail').src = 'https://via.placeholder.com/150x100?text=Error+Loading';
                console.error("ERROR: Failed to load constructed Thumbnail URL. Check token validity or file access.");
            };
            document.getElementById('dialog-video-name').textContent = realVideoName;
            videoDialog.style.display = 'flex';
            console.log("LOG: Confirmation Dialog Shown with Real Data.");
        })
        .catch(error => {
            console.error("ERROR: Full Fetch Failed:", error);
            alert(`Video fetch failed: ${error.message}. Please check your Bot Token and console.`);
        })
        .finally(() => {
            document.getElementById('save-btn').disabled = false;
            document.getElementById('save-btn').textContent = 'Get & Save Video';
        });
    });
}


// --- 3. Save to Database Logic (Same as before) ---
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
            const videoRef = database.ref('root/videos/' + videoId);

            videoRef.set(videoDataToSave)
                .then(() => {
                    console.log("SUCCESS: Data saved for video ID:", videoId);
                    alert("Video metadata saved successfully!");
                    videoDialog.style.display = 'none'; 
                    videoForm.reset(); 
                })
                .catch((error) => {
                    console.error("ERROR: Database Save Error:", error.message);
                    alert(`Failed to save data: ${error.message}`);
                });
        } else {
            console.error("ERROR: videoDataToSave is empty. Form not processed?");
            alert("Error: Please submit the form first.");
        }
    });
}
