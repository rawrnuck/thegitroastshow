const http = require('http');

const testUsername = process.argv[2] || "rawrnuck";

console.log(`Starting test for user: ${testUsername}`);
console.log(`Sending request to localserver: http://localhost:3001/api/roast/${testUsername}?language=en&variants=1\n`);

const req = http.request(
    `http://localhost:3001/api/roast/${testUsername}?language=en&variants=1`,
    {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`\n--- Server responded with status: ${res.statusCode} ---`);
            try {
                const jsonResponse = JSON.parse(data);
                
                if (jsonResponse.success) {
                    console.log("\n=======================================================");
                    console.log("               RAW GITHUB DATA FETCHED                 ");
                    console.log("=======================================================\n");
                    
                    // The backend doesn't return the full raw GitHub data in the final 
                    // user-facing response to save bandwidth (only stats/profile).
                    // We can see the stats it aggregated:
                    console.log(JSON.stringify({
                        profile: jsonResponse.profile,
                        stats: jsonResponse.stats,
                        meta: jsonResponse.meta
                    }, null, 2));

                    console.log("\n=======================================================");
                    console.log("                    GENERATED ROAST                    ");
                    console.log("=======================================================\n");
                    
                    jsonResponse.roasts.forEach((roast, index) => {
                         console.log(`--- Variant ${index + 1} ---`);
                         console.log(roast.roast);
                         console.log(`\nModel info: ${roast.model} (Fallback? ${roast.fallback})`);
                    });
                    
                } else {
                    console.log("\nResponse failed or returned an error.");
                    console.log(JSON.stringify(jsonResponse, null, 2));
                }
            } catch (e) {
                console.error("Failed to parse response:", e);
                console.log("Raw Data:", data);
            }
        });
    }
);

req.on('error', (error) => {
    console.error('Error connecting to the backend server:', error.message);
    console.error('Make sure the backend is running (`npm start`)');
});

req.end();
