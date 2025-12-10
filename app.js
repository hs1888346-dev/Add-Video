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
    console.log("Firebase initialized successfully.");
} catch (e) {
    console.error("Firebase Initialization Failed:", e);
}

const auth = firebase.auth();
const database = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// --- UI Elements (IDs must match HTML) ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const signInButton = document.getElementById('google-signin-btn');
const videoForm = document.getElementById('video-form');
const videoDialog = document.getElementById('video-dialog');
const saveToDbButton = document.getElementById('save-to-db-btn');
const closeDialogButton = document.getElementById('close-dialog-btn');

// Variable to hold the final data before saving to DB
let videoDataToSave = {};

// --- 1. Google Sign-in Logic ---
if (signInButton) {
    signInButton.addEventListener('click', () => {
        console.log("TEST: Google Sign-in Button Clicked."); // DEBUG LOG
        auth.signInWithPopup(googleProvider)
            .catch((error) => {
                console.error("Google Sign-in Error:", error.message);
                alert("Sign-in failed. Please check the browser console.");
            });
    });
} else {
    console.error("ERROR: Sign-in button element not found (ID: google-signin-btn).");
}


// Listen for authentication state changes (UI management)
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User logged in:", user.displayName);
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
    } else {
        console.log("User logged out.");
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});


// --- 2. Form Submission (Get & Save Video Button) ---
if (videoForm) {
    videoForm.addEventListener('submit', (e) => {
        e.preventDefault(); // <--- Prevents page reload!
        console.log("TEST: Video Form Submitted."); // DEBUG LOG

        const title = document.getElementById('title-input').value;
        const description = document.getElementById('description-input').value;
        const botToken = document.getElementById('token-input').value;

        // --- MOCK LOGIC: Replace this with actual Telegram API call ---
        // For demonstration, we use mock data after a 'successful fetch'
        const mockVideoId = "VID-" + Date.now().toString(36); 
        const mockThumbnailId = "T-" + Date.now().toString(36);
        const mockVideoName = title + " (Fetched Video Name)";
        const mockThumbnailURL = "https://via.placeholder.com/150x100?text=MP4+Found"; 
        const mockVideoSize = 52428800; // 50MB
        const mockVideoDuration = 300; // 5 minutes
        
        // Prepare data for the final save
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
        videoDialog.style.display = 'flex'; // Show the dialog
        console.log("TEST: Confirmation Dialog Shown."); // DEBUG LOG
    });
} else {
    console.error("ERROR: Video form element not found (ID: video-form).");
}

// Close Dialog Logic
if (closeDialogButton) {
    closeDialogButton.addEventListener('click', () => {
        videoDialog.style.display = 'none';
        console.log("TEST: Dialog Closed."); // DEBUG LOG
    });
}


// --- 3. Save to Database Logic (SaveTo Database Button) ---
if (saveToDbButton) {
    saveToDbButton.addEventListener('click', () => {
        console.log("TEST: SaveTo Database Button Clicked."); // DEBUG LOG
        
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
                    alert("Failed to save data. Check the console for details.");
                });
        } else {
            console.error("ERROR: videoDataToSave is empty. Form not processed?");
            alert("Error: Please submit the form first.");
        }
    });
} else {
    console.error("ERROR: Save to DB button element not found (ID: save-to-db-btn).");
}
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
