var leaderboardRef = firebase.database().ref("Leaderboard");

leaderboardRef.orderByChild("score").limitToLast(25).on("value", function(snapshot) {
    var leaderboardList = document.getElementById("leaderboard-list");
    leaderboardList.innerHTML = ""; // Clear previous entries

    // Convert the snapshot to an array and reverse it to get descending order
    var leaderboardEntries = Object.values(snapshot.val()).sort((a, b) => b.score - a.score);

    leaderboardEntries.forEach(function(leaderboardEntry) {
        var listItem = document.createElement("li");
        listItem.textContent = `${leaderboardEntry.name}: ${leaderboardEntry.score}`;
        leaderboardList.appendChild(listItem);
    });
});
