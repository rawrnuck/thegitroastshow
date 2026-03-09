require('dotenv').config();
const githubService = require('./src/services/githubService');

async function checkData() {
    const user = process.argv[2] || "blancks";
    console.log(`Starting GitHub test fetch for: ${user}...\n`);

    try {
        const userData = await githubService.gatherUserData(user);
        
        console.log("\n=======================================================");
        console.log("             RAW DEEP REPO DATA (TERMINAL)             ");
        console.log("=======================================================\n");
        
        // Print the full object clearly formatted to the terminal
        console.log(JSON.stringify(userData, null, 2));

        console.log("\n=======================================================");
        console.log(`Successfully fetched details for ${userData.repositories?.length} targeted repos.`);
        
    } catch (e) {
        console.error("Test failed:", e);
    }
}

checkData();
