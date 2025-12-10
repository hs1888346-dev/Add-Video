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
        
        // Telegram API Endpoint
        const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;

        document.getElementById('save-btn').disabled = true;
        document.getElementById('save-btn').textContent = 'Fetching Video...';

        // Direct Telegram API call to get recent updates/messages
        fetch(`${TELEGRAM_API}/getUpdates`)
        .then(response => {
             if (!response.ok) {
                // Network error, maybe CORS or token issue
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("LOG: Data received from Telegram.", data);

            if (!data.ok) {
                alert(`Telegram API Error: ${data.description}. Check your Bot Token.`);
                return;
            }
            
            // Find the latest message containing a video object
            const latestUpdates = data.result;
            let latestVideoMessage = null;

            // Iterate backwards to find the most recent video
            for (let i = latestUpdates.length - 1; i >= 0; i--) {
                const message = latestUpdates[i].channel_post || latestUpdates[i].message;
                if (message && message.video) {
                    latestVideoMessage = message;
                    break; 
                }
            }

            if (!latestVideoMessage) {
                alert("Error: No recent video found in updates. Ensure the Bot can read messages in that chat/channel.");
                return;
            }

            const video = latestVideoMessage.video;
            
            // NOTE: Thumbnail URL cannot be generated directly without another API call (getFile)
            // and the Telegram file server URL construction. We use placeholder data.
            const realVideoId = video.file_unique_id;
            const realVideoName = title + " (" + (latestVideoMessage.caption || 'Video File') + ")";
            const realThumbnailURL = 'https://via.placeholder.com/150x100?text=VIDEO+FOUND'; 
            
            // Prepare data for the final save
            videoDataToSave = {
                videoId: realVideoId,
                // We use the thumb file unique ID if available, otherwise N/A
                thumbnailId: video.thumb ? video.thumb.file_unique_id : 'N/A', 
                title: title,
                description: description,
                size: video.file_size, 
                duration: video.duration, 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            };

            // Populate and show the confirmation dialog
            document.getElementById('dialog-thumbnail').src = realThumbnailURL;
            document.getElementById('dialog-video-name').textContent = realVideoName;
            videoDialog.style.display = 'flex';
            console.log("LOG: Confirmation Dialog Shown with Real Data.");

        })
        .catch(error => {
            console.error("ERROR: Network or Fetch Error (CORS/Token):", error);
            alert(`Video fetch failed: ${error.message}. Check browser console for details.`);
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
