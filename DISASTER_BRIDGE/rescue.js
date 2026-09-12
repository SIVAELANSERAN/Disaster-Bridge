const API_URL = "http://localhost:5000/api/sos";

async function loadSOSRequests() {

    const table = document.getElementById("sosTable");

    table.innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
                Loading emergency requests...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Backend connection failed");
        }

        const result = await response.json();

        const requests = result.data || [];

        updateStatistics(requests);
        renderRequests(requests);

        document.getElementById("lastUpdated").textContent =
            "Last updated: " + new Date().toLocaleTimeString();

    } catch (error) {

        console.error("Dashboard Error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    ❌ Unable to connect to Disaster Bridge backend.
                    <br><br>
                    Make sure the backend server is running.
                </td>
            </tr>
        `;
    }
}


/* =========================================
   STATISTICS
   ========================================= */

function updateStatistics(requests) {

    const active = requests.filter(
        request =>
            request.status === "WAITING" ||
            request.status === "RESPONDING"
    ).length;

    const critical = requests.filter(
        request => request.priority === "CRITICAL"
    ).length;

    const high = requests.filter(
        request => request.priority === "HIGH"
    ).length;

    const gps = requests.filter(
        request =>
            request.latitude !== null &&
            request.longitude !== null
    ).length;

    document.getElementById("activeSOS").textContent = active;
    document.getElementById("criticalSOS").textContent = critical;
    document.getElementById("highSOS").textContent = high;
    document.getElementById("gpsCount").textContent = gps;
}


/* =========================================
   TABLE
   ========================================= */

function renderRequests(requests) {

    const table = document.getElementById("sosTable");

    if (requests.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No emergency requests found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = requests.map(request => {

        const priority =
            request.priority || "HIGH";

        const priorityClass =
            priority === "CRITICAL"
                ? "priority-critical"
                : priority === "HIGH"
                    ? "priority-high"
                    : "priority-medium";

        const score =
            request.ai_score ?? "N/A";

        const scoreClass =
            score >= 80
                ? "score-high"
                : "score-medium";

        const location =
            request.latitude && request.longitude
                ? `${request.latitude}, ${request.longitude}`
                : "Unavailable";


        /* STATUS */

        const currentStatus =
            request.status || "WAITING";


        /* ACTION BUTTONS */

        let action = "";

        if (
            request.latitude !== null &&
            request.longitude !== null
        ) {

            action += `
                <button
                    class="location-btn"
                    onclick="openLocation(${request.latitude}, ${request.longitude})">
                    VIEW MAP
                </button>
            `;
        }


        if (currentStatus === "WAITING") {

            action += `
                <button
                    class="response-btn"
                    onclick="updateSOSStatus(${request.id}, 'RESPONDING')">
                    RESPOND
                </button>
            `;

        } else if (currentStatus === "RESPONDING") {

            action += `
                <button
                    class="resolve-btn"
                    onclick="updateSOSStatus(${request.id}, 'RESOLVED')">
                    RESOLVE
                </button>
            `;
        }


        return `
            <tr>

                <td>
                    #DB-${request.id}
                </td>

                <td>
                    ${request.emergency_type || "Emergency SOS"}
                </td>

                <td>
                    📍 ${location}
                </td>

                <td>
                    <span class="priority ${priorityClass}">
                        ${priority}
                    </span>
                </td>

                <td>
                    <span class="ai-score ${scoreClass}">
                        ${score}
                    </span>
                </td>

                <td>
                    <span class="status status-${currentStatus.toLowerCase()}">
                        ${currentStatus}
                    </span>
                </td>

                <td>
                    ${action || "—"}
                </td>

            </tr>
        `;

    }).join("");
}


/* =========================================
   UPDATE SOS STATUS
   ========================================= */

async function updateSOSStatus(id, newStatus) {

    try {

        const response = await fetch(
            `http://localhost:5000/api/sos/${id}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: newStatus
                })
            }
        );


        if (!response.ok) {
            throw new Error("Status update failed");
        }


        const result = await response.json();

        console.log(
            "🚑 SOS STATUS UPDATED:",
            result
        );


        /* Refresh dashboard immediately */

        loadSOSRequests();


    } catch (error) {

        console.error(
            "Status Update Error:",
            error
        );

        alert(
            "Unable to update SOS status."
        );
    }
}


/* =========================================
   OPEN GPS LOCATION
   ========================================= */

function openLocation(latitude, longitude) {

    const url =
        `https://www.google.com/maps?q=${latitude},${longitude}`;

    window.open(url, "_blank");
}


/* =========================================
   AUTO REFRESH
   ========================================= */

loadSOSRequests();

setInterval(() => {

    loadSOSRequests();

}, 5000);