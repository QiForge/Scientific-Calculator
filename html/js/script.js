// ===== Local Storage Management =====
const getFromStorage = (key) => {
    return JSON.parse(localStorage.getItem(key));
};

const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// ===== Global Variables =====
let currentUser = null;
let userProfile = null;
let chatHistory = [];

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    loadApp();
    setupEventListeners();
});

// ===== Load App State =====
function loadApp() {
    currentUser = getFromStorage('currentUser');
    
    if (currentUser) {
        userProfile = getFromStorage(`profile_${currentUser.email}`);
        chatHistory = getFromStorage(`history_${currentUser.email}`) || [];
        
        if (userProfile) {
            showDashboard();
        } else {
            showProfileForm();
        }
    } else {
        showLoginForm();
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Profile Form
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
    
    // Chat
    document.getElementById('chatForm').addEventListener('submit', handleChatSubmit);
    
    // Dashboard
    document.getElementById('editProfileBtn').addEventListener('click', handleEditProfile);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

// ===== Toggle Auth (Login/Signup) =====
function toggleAuth() {
    const loginBox = document.querySelector('.login-box');
    const signupBox = document.getElementById('signupBox');
    
    loginBox.style.display = loginBox.style.display === 'none' ? 'block' : 'none';
    signupBox.style.display = signupBox.style.display === 'none' ? 'block' : 'none';
}

// ===== Login Handler =====
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Demo: No backend validation, just save user
    currentUser = {
        email: email,
        password: password,
        name: email.split('@')[0]
    };
    
    saveToStorage('currentUser', currentUser);
    
    userProfile = getFromStorage(`profile_${email}`);
    
    if (userProfile) {
        showDashboard();
    } else {
        showProfileForm();
    }
    
    // Clear form
    document.getElementById('loginForm').reset();
}

// ===== Signup Handler =====
function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    currentUser = {
        name: name,
        email: email,
        password: password
    };
    
    saveToStorage('currentUser', currentUser);
    
    showProfileForm();
    document.getElementById('signupForm').reset();
}

// ===== Profile Form Handler =====
function handleProfileSubmit(e) {
    e.preventDefault();
    
    const profile = {
        name: document.getElementById('userName').value,
        age: parseInt(document.getElementById('userAge').value),
        gender: document.getElementById('userGender').value,
        weight: parseFloat(document.getElementById('userWeight').value),
        height: parseFloat(document.getElementById('userHeight').value),
        goal: document.getElementById('userGoal').value,
        activityLevel: document.getElementById('userActivityLevel').value,
        createdAt: new Date().toISOString()
    };
    
    userProfile = profile;
    saveToStorage(`profile_${currentUser.email}`, profile);
    
    showDashboard();
    document.getElementById('profileForm').reset();
}

// ===== Display Profile Data =====
function displayProfileData() {
    if (!userProfile) return;
    
    document.getElementById('displayName').textContent = userProfile.name;
    document.getElementById('displayAge').textContent = userProfile.age;
    document.getElementById('displayHeight').textContent = userProfile.height;
    document.getElementById('displayWeight').textContent = userProfile.weight;
    document.getElementById('displayGoal').textContent = capitalizeFirst(userProfile.goal);
    
    // Calculate BMI
    const bmi = calculateBMI(userProfile.weight, userProfile.height);
    document.getElementById('displayBMI').textContent = bmi.toFixed(1);
    
    // Calculate daily recommendations
    const dailyCalories = calculateDailyCalories(userProfile);
    document.getElementById('dailyCalories').textContent = dailyCalories;
    
    document.getElementById('sleepHours').textContent = userProfile.age > 18 ? '7-9 hours' : '8-10 hours';
    document.getElementById('waterIntake').textContent = (userProfile.weight * 0.033).toFixed(1);
    
    // Load history
    loadChatHistory();
}

// ===== Calculate BMI =====
function calculateBMI(weight, height) {
    // height in cm, weight in kg
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

// ===== Calculate Daily Calories =====
function calculateDailyCalories(profile) {
    let bmr;
    
    // Harris-Benedict Equation
    if (profile.gender === 'male') {
        bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
    } else {
        bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    }
    
    // Activity Factor
    const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725
    };
    
    let tdee = bmr * (activityFactors[profile.activityLevel] || 1.2);
    
    // Adjust for goal
    if (profile.goal === 'lose') {
        tdee = tdee - 500; // 500 calorie deficit
    } else if (profile.goal === 'gain') {
        tdee = tdee + 500; // 500 calorie surplus
    }
    
    return Math.round(tdee);
}

// ===== Chat Handler =====
function handleChatSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessageToChat('user', message);
    
    // Get bot response
    const response = generateResponse(message);
    setTimeout(() => {
        addMessageToChat('bot', response);
    }, 500);
    
    // Save to history
    chatHistory.push({
        timestamp: new Date().toISOString(),
        user: message,
        bot: response
    });
    saveToStorage(`history_${currentUser.email}`, chatHistory);
    
    input.value = '';
    input.focus();
}

// ===== Generate Response =====
function generateResponse(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('eat') || msg.includes('food') || msg.includes('meal')) {
        return generateMealRecommendation();
    } else if (msg.includes('exercise') || msg.includes('workout') || msg.includes('gym')) {
        return generateExerciseRecommendation();
    } else if (msg.includes('water') || msg.includes('hydration') || msg.includes('drink')) {
        const water = (userProfile.weight * 0.033).toFixed(1);
        return `💧 You should drink approximately ${water}L of water daily. Aim for 8-10 glasses per day.`;
    } else if (msg.includes('sleep') || msg.includes('rest')) {
        return `😴 Adults should get 7-9 hours of sleep daily. Try to maintain a consistent sleep schedule!`;
    } else if (msg.includes('bmi') || msg.includes('weight')) {
        const bmi = calculateBMI(userProfile.weight, userProfile.height);
        return `📊 Your BMI is ${bmi.toFixed(1)}. ${getBMICategory(bmi)}`;
    } else if (msg.includes('calorie') || msg.includes('calor')) {
        const calories = calculateDailyCalories(userProfile);
        return `🔥 Your daily calorie requirement is approximately ${calories} calories based on your profile.`;
    } else {
        return `Hi! 👋 I can help you with:
        • Meal recommendations
        • Exercise plans
        • Water & hydration
        • Sleep advice
        • BMI calculation
        • Calorie information
        
        What would you like to know?`;
    }
}

// ===== Generate Meal Recommendation =====
function generateMealRecommendation() {
    const meals = [
        {
            breakfast: 'Oatmeal with berries and nuts (350 cal)',
            lunch: 'Grilled chicken with brown rice and vegetables (450 cal)',
            dinner: 'Baked salmon with sweet potato and broccoli (500 cal)',
            snacks: 'Greek yogurt, almonds, fruit (200 cal)'
        },
        {
            breakfast: 'Eggs and whole wheat toast (320 cal)',
            lunch: 'Lentil soup with whole grain bread (400 cal)',
            dinner: 'Lean beef stir-fry with brown rice (480 cal)',
            snacks: 'Cottage cheese, carrots, hummus (180 cal)'
        }
    ];
    
    const meal = meals[Math.floor(Math.random() * meals.length)];
    
    return `🍽️ Here's your meal recommendation:
    
    🌅 Breakfast: ${meal.breakfast}
    🥗 Lunch: ${meal.lunch}
    🍽️ Dinner: ${meal.dinner}
    🍿 Snacks: ${meal.snacks}
    
    Total: ~1530 calories (adjust portions based on your daily needs)`;
}

// ===== Generate Exercise Recommendation =====
function generateExerciseRecommendation() {
    const exercises = [
        {
            type: 'Cardio',
            duration: '30 mins',
            activities: 'Running, Cycling, Swimming',
            intensity: 'Moderate'
        },
        {
            type: 'Strength Training',
            duration: '45 mins',
            activities: 'Weight lifting, Bodyweight exercises',
            intensity: 'High'
        },
        {
            type: 'Flexibility',
            duration: '20 mins',
            activities: 'Yoga, Stretching',
            intensity: 'Low'
        }
    ];
    
    const exercise = exercises[Math.floor(Math.random() * exercises.length)];
    
    return `💪 Exercise Recommendation:
    
    📋 Type: ${exercise.type}
    ⏱️ Duration: ${exercise.duration}
    🏋️ Activities: ${exercise.activities}
    📈 Intensity: ${exercise.intensity}
    
    Do this 3-4 times per week for best results!`;
}

// ===== Get BMI Category =====
function getBMICategory(bmi) {
    if (bmi < 18.5) return '📍 You are Underweight. Consider consulting a nutritionist.';
    if (bmi < 25) return '✅ You are at a healthy weight!';
    if (bmi < 30) return '⚠️ You are Overweight. Consider increasing exercise and controlling diet.';
    return '⛔ You are Obese. Please consult a healthcare professional.';
}

// ===== Add Message to Chat =====
function addMessageToChat(sender, message) {
    const chatBox = document.getElementById('chatBox');
    
    // Remove welcome message if exists
    const welcome = chatBox.querySelector('.welcome-message');
    if (welcome) welcome.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = message;
    
    messageDiv.appendChild(bubble);
    chatBox.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== Load Chat History =====
function loadChatHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (chatHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-message">No recommendations yet</p>';
        return;
    }
    
    // Show last 5 items
    const recentHistory = chatHistory.slice(-5);
    
    recentHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        const date = new Date(item.timestamp).toLocaleDateString();
        historyItem.textContent = `${date}: ${item.user.substring(0, 30)}...`;
        historyList.appendChild(historyItem);
    });
}

// ===== Quick Action =====
function quickAction(action) {
    const chatInput = document.getElementById('chatInput');
    
    switch(action) {
        case 'recommendation':
            chatInput.value = 'What should I eat today?';
            break;
        case 'meals':
            chatInput.value = 'Give me meal ideas';
            break;
        case 'exercise':
            chatInput.value = 'What exercise should I do?';
            break;
        case 'clear':
            if (confirm('Are you sure you want to clear chat history?')) {
                chatHistory = [];
                saveToStorage(`history_${currentUser.email}`, []);
                document.getElementById('chatBox').innerHTML = '<div class="welcome-message"><h2>Welcome to Health Assistant</h2><p>Ask me anything about your health, diet, or fitness!</p></div>';
                loadChatHistory();
            }
            return;
    }
    
    chatInput.focus();
}

// ===== Edit Profile =====
function handleEditProfile() {
    // Prefill profile form
    document.getElementById('userName').value = userProfile.name;
    document.getElementById('userAge').value = userProfile.age;
    document.getElementById('userGender').value = userProfile.gender;
    document.getElementById('userWeight').value = userProfile.weight;
    document.getElementById('userHeight').value = userProfile.height;
    document.getElementById('userGoal').value = userProfile.goal;
    document.getElementById('userActivityLevel').value = userProfile.activityLevel;
    
    showProfileForm();
}

// ===== Logout =====
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        userProfile = null;
        chatHistory = [];
        
        localStorage.removeItem('currentUser');
        
        showLoginForm();
    }
}

// ===== Show/Hide Containers =====
function showLoginForm() {
    hideAllContainers();
    document.getElementById('loginContainer').classList.add('active');
    document.querySelector('.login-box').style.display = 'block';
    document.getElementById('signupBox').style.display = 'none';
}

function showSignupForm() {
    showLoginForm();
    document.querySelector('.login-box').style.display = 'none';
    document.getElementById('signupBox').style.display = 'block';
}

function showProfileForm() {
    hideAllContainers();
    document.getElementById('profileContainer').classList.add('active');
}

function showDashboard() {
    hideAllContainers();
    document.getElementById('dashboardContainer').classList.add('active');
    displayProfileData();
}

function hideAllContainers() {
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('profileContainer').classList.remove('active');
    document.getElementById('dashboardContainer').classList.remove('active');
}

// ===== Utility Functions =====
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}
