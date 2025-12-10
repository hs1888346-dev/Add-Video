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

// New Auth Inputs/Buttons
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const registerButton = document.getElementById('register-btn');
const loginButton = document.getElementById('login-btn');

// Video Form Elements
const videoForm = document.getElementById('video-form');
const videoDialog = document.getElementById('video-dialog');
const saveToDbButton = document.getElementById('save-to-db-btn');
const closeDialogButton = document.getElementById('close-dialog-btn');

let videoDataToSave = {};


// --- 1. Email/Password Authentication Functions ---

function handleRegistration() {
    console.log("LOG: Registration process started."); // LOG
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    
    if (!email || password.length < 6) {
        alert("Please enter a valid email and a password of at least 6 characters.");
        console.warn("WARN: Registration failed due to invalid input.");
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
    console.log("LOG: Login process started."); // LOG
    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        console.warn("WARN: Login failed due to empty input.");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("SUCCESS: Login Successful for:", userCredential.user.email);
            alert("Login successful!");
            // UI update handled by auth.onAuthStateChanged
        })
        .catch((error) => {
            console.error("ERROR: Login Error:", error.code, error.message);
            alert(`Login Failed: ${error.message}`);
        });
}

// --- Attaching Event Listeners ---
if (registerButton) {
    registerButton.addEventListener('click', handleRegistration);
    console.log("LOG: Register button event listener attached.");
} else {
    console.error("ERROR: Register button element not found (ID: register-btn).");
}

if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
    console.log("LOG: Login button event listener attached.");
} else {
    console.error("ERROR: Login button element not found (ID: login-btn).");
}


// --- 2. Authentication State Change (UI Management) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in. Show the main form.
        console.log("LOG: User is signed in. Showing main app.");
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
    } else {
        // User is signed out. Show the login form.
        console.log("LOG: User is signed out. Showing login form.");
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});


// --- 3. Form Submission (Video Details) and Database Save Logic (Same as before) ---
if (videoForm) {
    videoForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        console.log("LOG: Video Form Submission Started.");

        const title = document.getElementById('title-input').value;
        const description = document.getElementById('description-input').value;
        const botToken = document.getElementById('token-input').value;

        // --- MOCK LOGIC: (This should be replaced by your Telegram API call) ---
        const mockVideoId = "VID-" + Date.now().toString(36); 
        const mockThumbnailURL = "https://via.placeholder.com/150x100?text=MP4+Found"; 
        
        videoDataToSave = {
            videoId: mockVideoId,
            thumbnailId: "T-" + Date.now().toString(36),
            title: title,
            description: description,
            size: 52428800, // Mock size
            duration: 300,  // Mock duration
            timestamp: firebase.database.ServerValue.TIMESTAMP 
        };

        // Populate and show the confirmation dialog
        document.getElementById('dialog-thumbnail').src = mockThumbnailURL;
        document.getElementById('dialog-video-name').textContent = title + " (Mock Name)";
        videoDialog.style.display = 'flex';
        console.log("LOG: Confirmation Dialog Shown.");
    });
}

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
