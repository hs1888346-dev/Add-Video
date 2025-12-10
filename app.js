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
    console.log("Firebase initialized successfully.");
} catch (e) {
    console.error("Firebase Initialization Failed:", e);
}

const auth = firebase.auth();
const database = firebase.database();

// --- UI Elements ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
// New Auth Inputs/Buttons
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const registerButton = document.getElementById('register-btn');
const loginButton = document.getElementById('login-btn');

// Video Form Elements (Same as before)
const videoForm = document.getElementById('video-form');
const videoDialog = document.getElementById('video-dialog');
const saveToDbButton = document.getElementById('save-to-db-btn');
const closeDialogButton = document.getElementById('close-dialog-btn');

let videoDataToSave = {};


// --- 1. Email/Password Authentication Functions ---

function handleRegistration() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    if (!email || password.length < 6) {
        alert("Please enter a valid email and a password of at least 6 characters.");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Registration Successful:", userCredential.user.email);
            alert("Registration successful! You are now logged in.");
        })
        .catch((error) => {
            console.error("Registration Error:", error.message);
            alert(`Registration Failed: ${error.message}`);
        });
}

function handleLogin() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Login Successful:", userCredential.user.email);
            // UI management is handled by auth.onAuthStateChanged below
        })
        .catch((error) => {
            console.error("Login Error:", error.message);
            alert(`Login Failed: ${error.message}`);
        });
}

// Attach event listeners to the new buttons
if (registerButton) {
    registerButton.addEventListener('click', handleRegistration);
}
if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
}


// --- 2. Authentication State Change (UI Management) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log("User logged in:", user.email);
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
    } else {
        // User is signed out
        console.log("User logged out.");
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});


// --- 3. Form Submission (Video Details) and Database Save Logic (Same as before) ---
if (videoForm) {
    videoForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        console.log("TEST: Video Form Submitted.");

        const title = document.getElementById('title-input').value;
        const description = document.getElementById('description-input').value;
        const botToken = document.getElementById('token-input').value;

        // --- MOCK LOGIC: Replace with actual Telegram API call ---
        const mockVideoId = "VID-" + Date.now().toString(36); 
        const mockThumbnailId = "T-" + Date.now().toString(36);
        const mockVideoName = title + " (Fetched Video Name)";
        const mockThumbnailURL = "https://via.placeholder.com/150x100?text=MP4+Found"; 
        const mockVideoSize = 52428800;
        const mockVideoDuration = 300;
        
        videoDataToSave = {
            videoId: mockVideoId,
            thumbnailId: mockThumbnailId,
            title: title,
            description: description,
            size: mockVideoSize,
            duration: mockVideoDuration,
            timestamp: firebase.database.ServerValue.TIMESTAMP 
        };

        // Populate and show the confirmation dialog
        document.getElementById('dialog-thumbnail').src = mockThumbnailURL;
        document.getElementById('dialog-video-name').textContent = mockVideoName;
        videoDialog.style.display = 'flex';
        console.log("TEST: Confirmation Dialog Shown.");
    });
}

if (closeDialogButton) {
    closeDialogButton.addEventListener('click', () => {
        videoDialog.style.display = 'none';
        console.log("TEST: Dialog Closed.");
    });
}

if (saveToDbButton) {
    saveToDbButton.addEventListener('click', () => {
        console.log("TEST: SaveTo Database Button Clicked.");
        
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
                    console.error("Database Save Error:", error.message);
                    alert(`Failed to save data: ${error.message}`);
                });
        } else {
            console.error("ERROR: videoDataToSave is empty. Form not processed?");
            alert("Error: Please submit the form first.");
        }
    });
}
