// ==========================================================================
// EXPERIMENT 8: DEVELOPING SERVER-SIDE APPLICATION USING NODE.JS
// Web Technology Lab — Semester 5
// Native Node.js HTTP Server Implementation (No Frameworks)
// ==========================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// In-memory users data store
let users = [
    { id: 1, name: "Alice Johnson", role: "Software Engineer" },
    { id: 2, name: "Bob Martinez", role: "DevOps Specialist" },
    { id: 3, name: "Carol Davis", role: "Cloud Architect" }
];

/**
 * Helper function to send JSON responses with appropriate headers
 */
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data, null, 2));
}

/**
 * Helper function to send HTML responses
 */
function sendHTML(res, statusCode, htmlContent) {
    res.writeHead(statusCode, {
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.end(htmlContent);
}

/**
 * Generate the dynamic homepage HTML containing live server info and endpoints
 */
function renderHomepage() {
    const serverTime = new Date().toLocaleString();
    const userCount = users.length;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TechPulse — Server-Side Application (Exp 8)</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>

    <div class="container">
        <!-- TechPulse Header -->
        <header class="header">
            <h1>TechPulse</h1>
            <p>Server-Side Application Powered by Node.js</p>
        </header>

        <!-- Main Card Container -->
        <main class="card">
            <!-- Active Status Banner -->
            <div class="status-banner">
                <span class="status-indicator"></span>
                <span><strong>Server Status:</strong> <span class="status-badge active">Active</span></span>
            </div>

            <!-- Live Server Information -->
            <section class="info-section">
                <h2>Live Server Information</h2>
                <div class="info-grid">
                    <div class="info-box">
                        <span class="info-label">Server Time</span>
                        <span class="info-value">${serverTime}</span>
                    </div>
                    <div class="info-box">
                        <span class="info-label">Registered Users</span>
                        <span class="info-value" id="userCount">${userCount} Users</span>
                    </div>
                    <div class="info-box">
                        <span class="info-label">Node.js Version</span>
                        <span class="info-value">${process.version}</span>
                    </div>
                    <div class="info-box">
                        <span class="info-label">Port</span>
                        <span class="info-value">${PORT}</span>
                    </div>
                </div>
            </section>

            <!-- Available API Endpoints -->
            <section class="endpoints-section">
                <h2>Available API Endpoints</h2>
                <table class="endpoints-table">
                    <thead>
                        <tr>
                            <th>Method</th>
                            <th>Endpoint</th>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="badge badge-get">GET</span></td>
                            <td><code>/</code></td>
                            <td>Serve HTML Homepage &amp; Documentation</td>
                            <td><a href="/" class="btn-link">Refresh</a></td>
                        </tr>
                        <tr>
                            <td><span class="badge badge-get">GET</span></td>
                            <td><code>/api/status</code></td>
                            <td>Check server active health status (JSON)</td>
                            <td><a href="/api/status" target="_blank" class="btn-link">Test &rarr;</a></td>
                        </tr>
                        <tr>
                            <td><span class="badge badge-get">GET</span></td>
                            <td><code>/api/users</code></td>
                            <td>Retrieve all sample users (JSON)</td>
                            <td><a href="/api/users" target="_blank" class="btn-link">Test &rarr;</a></td>
                        </tr>
                        <tr>
                            <td><span class="badge badge-post">POST</span></td>
                            <td><code>/api/users</code></td>
                            <td>Add a new user (Requires JSON body: name, role)</td>
                            <td><span class="text-muted">Use POST</span></td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <!-- Sample Request Guide -->
            <section class="sample-section">
                <h3>Testing POST /api/users</h3>
                <pre class="code-box">curl -X POST http://localhost:${PORT}/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "David Smith", "role": "Cybersecurity Analyst"}'</pre>
            </section>
        </main>
    </div>

</body>
</html>`;
}

/**
 * Create HTTP Server using Node.js native http module
 */
const server = http.createServer((req, res) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // Parse URL and extract pathname
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Terminal Logging of incoming requests
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${pathname}`);

    try {
        // ---------------------------------------------------------------------
        // Route 1: Serve External CSS Stylesheet
        // ---------------------------------------------------------------------
        if (method === 'GET' && (pathname === '/style.css' || pathname === '/public/style.css')) {
            const cssFilePath = path.join(__dirname, 'public', 'style.css');
            fs.readFile(cssFilePath, 'utf8', (err, content) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Stylesheet not found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/css' });
                    res.end(content);
                }
            });
            return;
        }

        // ---------------------------------------------------------------------
        // Route 2: GET / (Homepage)
        // ---------------------------------------------------------------------
        if (method === 'GET' && pathname === '/') {
            sendHTML(res, 200, renderHomepage());
            return;
        }

        // ---------------------------------------------------------------------
        // Route 3: GET /api/status (Health Check)
        // ---------------------------------------------------------------------
        if (method === 'GET' && pathname === '/api/status') {
            sendJSON(res, 200, {
                success: true,
                status: "Active",
                message: "Server is healthy and active.",
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
            return;
        }

        // ---------------------------------------------------------------------
        // Route 4: GET /api/users (List Users)
        // ---------------------------------------------------------------------
        if (method === 'GET' && pathname === '/api/users') {
            sendJSON(res, 200, {
                success: true,
                count: users.length,
                data: users
            });
            return;
        }

        // ---------------------------------------------------------------------
        // Route 5: POST /api/users (Create User)
        // ---------------------------------------------------------------------
        if (method === 'POST' && pathname === '/api/users') {
            let body = '';

            // Collect request payload chunks
            req.on('data', chunk => {
                body += chunk.toString();
            });

            // Process payload on completion
            req.on('end', () => {
                try {
                    // Check for empty body
                    if (!body || body.trim() === '') {
                        sendJSON(res, 400, {
                            success: false,
                            message: "Bad Request: Request body cannot be empty. Both 'name' and 'role' are required."
                        });
                        return;
                    }

                    // Parse JSON safely
                    const parsedData = JSON.parse(body);
                    const { name, role } = parsedData;

                    // Validate presence and data type
                    if (!name || typeof name !== 'string' || name.trim() === '' ||
                        !role || typeof role !== 'string' || role.trim() === '') {
                        sendJSON(res, 400, {
                            success: false,
                            message: "Bad Request: Validation failed. 'name' and 'role' must be non-empty strings."
                        });
                        return;
                    }

                    // Create new user object
                    const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
                    const newUser = {
                        id: nextId,
                        name: name.trim(),
                        role: role.trim()
                    };

                    // Add to in-memory array
                    users.push(newUser);

                    // Return HTTP 201 Created
                    sendJSON(res, 201, {
                        success: true,
                        message: "User created successfully.",
                        data: newUser
                    });

                } catch (parseError) {
                    // JSON Syntax Error
                    sendJSON(res, 400, {
                        success: false,
                        message: "Bad Request: Invalid JSON syntax in request body."
                    });
                }
            });
            return;
        }

        // ---------------------------------------------------------------------
        // Route 6: Unknown Routes (HTTP 404)
        // ---------------------------------------------------------------------
        sendJSON(res, 404, {
            success: false,
            message: `Route '${pathname}' with method '${method}' was not found.`
        });

    } catch (unexpectedError) {
        // ---------------------------------------------------------------------
        // Route 7: Unexpected Errors (HTTP 500)
        // ---------------------------------------------------------------------
        console.error("Internal Server Error:", unexpectedError);
        sendJSON(res, 500, {
            success: false,
            message: "Internal Server Error."
        });
    }
});

// Start the server if executed directly
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`TechPulse Server is running at http://localhost:${PORT}/`);
        console.log(`Press Ctrl+C to stop the server.`);
        console.log(`====================================================`);
    });
}

module.exports = server;
