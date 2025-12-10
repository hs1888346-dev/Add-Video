// Firebase Configuration provided by the user
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// UI Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const signInButton = document.getElementById('google-signin-btn');
const videoForm = document.getElementById('video-form');
const videoDialog = document.getElementById('video-dialog');
const saveToDbButton = document.getElementById('save-to-db-btn');
const closeDialogButton = document.getElementById('close-dialog-btn');

// --- 1. Firebase Authentication (Sign-in With Google) ---

// Handle Google Sign-in
signInButton.addEventListener('click', () => {
    auth.signInWithPopup(googleProvider)
        .catch((error) => {
            console.error("Google Sign-in Error:", error.message);
            alert("Sign-in failed. Check the console for details.");
        });
});

// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        console.log("User logged in:", user.displayName);
    } else {
        // User is signed out
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        console.log("User logged out");
    }
});

// --- 2. Form Submission and Dialog Logic ---

// Variable to hold the final data before saving to DB
let videoDataToSave = {};

videoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title-input').value;
    const description = document.getElementById('description-input').value;
    const botToken = document.getElementById('token-input').value;

    // --- MOCK LOGIC for fetching the last MP4 ---
    // *In a real scenario, this is where you'd call a server-side endpoint*
    // *that uses the botToken to fetch the video data (thumbnail, size, duration, etc.)*
    
    // Mock Data for the Dialog
    const mockVideoId = "VID-" + Date.now(); 
    const mockThumbnailId = "T-" + Date.now();
    const mockVideoName = title + " (Fetched from Bot)";
    const mockThumbnailURL = "https://via.placeholder.com/200x150?text=MP4+Thumbnail"; 
    const mockVideoSize = 1024 * 1024 * 50; // 50MB
    const mockVideoDuration = 300; // 5 minutes

    // Store the data that will be saved to the database
    videoDataToSave = {
        videoId: mockVideoId,
        thumbnailId: mockThumbnailId,
        title: title,
        description: description,
        size: mockVideoSize,
        duration: mockVideoDuration
    };

    // Populate and show the dialog
    document.getElementById('dialog-thumbnail').src = mockThumbnailURL;
    document.getElementById('dialog-video-name').textContent = mockVideoName;
    videoDialog.style.display = 'flex';
});

// Close Dialog Logic
closeDialogButton.addEventListener('click', () => {
    videoDialog.style.display = 'none';
});

// --- 3. Save to Database Logic ---

saveToDbButton.addEventListener('click', () => {
    if (videoDataToSave.videoId) {
        const videoId = videoDataToSave.videoId;
        // The path is root/videos/<videoId>/
        const videoRef = database.ref('root/videos/' + videoId);

        // Save the data to Firebase Realtime Database
        videoRef.set(videoDataToSave)
            .then(() => {
                alert("Video metadata saved successfully!");
                videoDialog.style.display = 'none'; // Hide the dialog
                videoForm.reset(); // Clear the form
            })
            .catch((error) => {
                console.error("Database Save Error:", error.message);
                alert("Failed to save data. Check the console for details.");
            });
    } else {
        alert("Error: No video data prepared for saving.");
    }
});
