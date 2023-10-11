document.addEventListener("DOMContentLoaded", () => {
    var quizData;
    // Score variable at the top-level scope
    let score = 0;
    // Reference to the Firebase Realtime Database
    var database = firebase.database();

    var leaderboardRef = database.ref("Leaderboard");


    function fetchAndShuffleData(selectedGenre) {
        return new Promise((resolve, reject) => {
            var quizDataDb = []; // Initialize an array to store the quiz data

            // Update the database reference based on the selected genre
            const genreQuestionsRef = database.ref(selectedGenre + "Questions");

            genreQuestionsRef.on("value", function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var questionData = childSnapshot.val();
                    quizDataDb.push(questionData); // Add the question data to the array
                });

                // Shuffle the quizDataDb array
                shuffleArray(quizDataDb);

                // Select the number of game questions
                const numOfGameQuestions = 7;
                quizData = quizDataDb.slice(0, numOfGameQuestions);
                resolve(quizData); // Resolve the promise with the shuffled data
            });
        });
    }

    const loginContainer = document.getElementById("login-container");
    const usernameInput = document.getElementById("username-input");
    const loginButton = document.getElementById("login-button");
    const genreSelection = document.getElementById("genre-selection");
    const genreButtons = document.querySelectorAll(".genre-button");
    const backgroundMusic = document.getElementById('background-music');

    let username = ""; // Initialise username variable
    let selectedGenre = null; // Initialize genre variable

    loginButton.addEventListener("click", () => {
        username = usernameInput.value.trim(); // Get the entered username

        if (username !== "") {
            // Hide the login form and start the game
            loginContainer.style.display = "none";
            genreSelection.style.display = "block";
        } else {
            alert("Please enter a valid username.");
        }
    });

    // Add event listeners to genre buttons
    genreButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedGenre = button.getAttribute("data-genre");
            fetchAndShuffleData(selectedGenre)
                .then((data) => {
                    startGame();
                })
                .catch((error) => {
                    console.error("Error fetching and shuffling data:", error);
                });

            // Hide the genre selection after a genre is chosen
            genreSelection.style.display = "none";
        });
    });

    function initializeGame() {
        score = 0;
        currentQuestionIndex = 0;
        displayQuestion();
    }

    function startGame() {
        // Initialize the game when the page loads
        initializeGame();
        playBackgroundMusic();
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }


    let currentQuestionIndex = 0;
    let timeLeft = 10; // Initial time limit in secs
    let timerInterval; // Interval ID for timer


    function displayQuestion() {
        const questionElement = document.getElementById("question");
        const optionsElement = document.getElementById("options");
        const scoreContainer = document.getElementById("score-container");
        const questionContainer = document.getElementById("question-container");

        if (!questionElement) {
            console.error("Question element not found.");
            return;
        }

        // Check if there are no more questions
        if (currentQuestionIndex >= quizData.length) {
            // Handle the situation when there are no more questions, e.g., end the game or display a message
            showFinalScore();
            return; // Exit the function
        }

        const currentQuestion = quizData[currentQuestionIndex];

        questionElement.textContent = currentQuestion.question;
        optionsElement.innerHTML = "";

        currentQuestion.options.forEach((option, index) => {
            const optionButton = document.createElement("button");
            optionButton.className = "option-button";
            optionButton.textContent = option;
            optionButton.addEventListener("click", () => checkAnswer(index));
            optionsElement.appendChild(optionButton);
        });

        // Call the update score function to display the score
        updateScore();

        // Reset timer to initial time limit
        timeLeft = 10;
        updateTimer();

        // Show the score and timer elements when questions are loaded
        scoreContainer.style.display = "block";
        questionContainer.style.display = "block";
    }

    function checkAnswer(selectedOption) {
        // Clear the timer interval before checking the answer
        clearTimeout(timerInterval);

        const currentQuestion = quizData[currentQuestionIndex];
        const correctAnswer = parseInt(currentQuestion.correctAnswer); // Convert to number

        if (selectedOption === correctAnswer) {
            // If the selected answer is correct, calculate the score based on time remaining
            const timeRemaining = timeLeft * 1000; // Convert to milliseconds

            if (timeRemaining >= 7000) {
                // If time remaining is >= 7 seconds, add milliseconds remaining * 3 to the score
                score += timeRemaining * 3;
            } else if (timeRemaining > 3000) {
                // If time remaining is > 3 seconds but < 7 seconds, add milliseconds remaining * 2 to the score
                score += timeRemaining * 2;
            } else {
                // If time remaining is <= 3 seconds, add milliseconds remaining to the score
                score += timeRemaining;
            }
        } else {
            // If the selected answer is incorrect, award zero points
            score += 0;
        }

        currentQuestionIndex++;

        if (currentQuestionIndex < quizData.length) {
            displayQuestion();
        } else {
            // All questions have been answered, show the final score
            showFinalScore();
        }

        // Update the score display after calculating the score
        updateScore();
    }


    function updateScore() {
        const scoreElement = document.getElementById("score");
        scoreElement.textContent = `Score: ${score}`;
    }

    function showFinalScore() {
        const questionContainer = document.getElementById("question-container");
        const questionElement = document.getElementById("question");
        const optionsElement = document.getElementById("options");
        const scoreContainer = document.getElementById("score-container");

        // Check if elements exist before manipulating them
        if (questionElement && optionsElement) {
            questionElement.textContent = `${username}, You Scored: ${score}`;
            optionsElement.innerHTML = `
                <button id="leaderboard-button">View Leaderboard</button>
                <button id="play-again-button">Play Again</button>
            `;

            // Add event listeners for the buttons
            const leaderboardButton = document.getElementById("leaderboard-button");
            const playAgainButton = document.getElementById("play-again-button");

            leaderboardButton.addEventListener("click", () => {
                window.location.href = "leaderboard.html";
            });

            playAgainButton.addEventListener("click", () => {
                resetGame();
            });

            // Push player's name and score to the leaderboard
            leaderboardRef.push({
                name: username,
                score: score,
            });
            stopBackgroundMusic();

            // Hide the timer element
            const timerElement = document.getElementById("time");
            if (timerElement) {
                timerElement.style.display = "none";
            }

            // Hide the score container on the summary screen if it exists
            if (scoreContainer) {
                scoreContainer.style.display = "none";
            }
        }
    }

    function updateTimer() {
        const timeElement = document.getElementById("time");
        timeElement.textContent = timeLeft;
        if (timeLeft > 0) {
            timeLeft--;
            timerInterval = setTimeout(updateTimer, 1000); // update timer every 1 sec
        } else {
            // Time up, handle the answer
            checkAnswer(-1); // use -1 to indicate time is up
        }
    }

    function resetGame() {
        // Reset game variables and elements to their initial state
        currentQuestionIndex = 0;
        score = 0;

        // Show the genre selection
        const genreSelection = document.getElementById("genre-selection");
        genreSelection.style.display = "block";

        // Hide the question container
        const questionContainer = document.getElementById("question-container");
        questionContainer.style.display = "none";
    }

    // Function to start playing the background music
    function playBackgroundMusic() {
        backgroundMusic.play();
    }

    // Function to stop the background music
    function stopBackgroundMusic() {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Reset to the beginning
    }
});



