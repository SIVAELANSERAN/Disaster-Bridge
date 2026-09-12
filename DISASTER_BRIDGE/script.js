/* =========================================================
   DISASTER BRIDGE
   Frontend Interaction Controller
   ========================================================= */


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let activeSOSCount = 7;
let meshNodeCount = 24;

let emergencyRequests = [
    {
        priority: "CRITICAL",
        id: "#DB-1042",
        emergency: "Trapped Person",
        location: "2.4 km NE",
        hops: 4,
        status: "WAITING"
    },
    {
        priority: "HIGH",
        id: "#DB-1041",
        emergency: "Medical Emergency",
        location: "1.8 km SE",
        hops: 2,
        status: "ASSIGNED"
    },
    {
        priority: "HIGH",
        id: "#DB-1039",
        emergency: "Fire",
        location: "3.1 km NW",
        hops: 5,
        status: "WAITING"
    },
    {
        priority: "MEDIUM",
        id: "#DB-1037",
        emergency: "Missing Person",
        location: "4.6 km SW",
        hops: 6,
        status: "RESOLVED"
    }
];


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const sosModal = document.getElementById("sosModal");
const locationText = document.getElementById("locationText");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const activeSOSElement = document.getElementById("activeSOS");
const meshNodesElement = document.getElementById("meshNodes");
const systemStatus = document.getElementById("systemStatus");

const sosTable = document.getElementById("sosTable");


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    updateStatistics();

    renderSOSRequests();

    initializeNetwork();

});


/* =========================================================
   SOS BUTTON
   ========================================================= */

function sendSOS() {

    if (!sosModal) {
        showToast("SOS system is unavailable.");
        return;
    }

    sosModal.classList.add("show");

    locationText.textContent = "Detecting location...";

    detectLocation();

}


/* =========================================================
   CLOSE SOS MODAL
   ========================================================= */

function closeSOS() {

    if (!sosModal) {
        return;
    }

    sosModal.classList.remove("show");

}


/* =========================================================
   LOCATION DETECTION
   ========================================================= */

function detectLocation() {

    if (!navigator.geolocation) {

        locationText.textContent =
            "Location service unavailable";

        return;
    }

    navigator.geolocation.getCurrentPosition(

        (position) => {

            const latitude =
                position.coords.latitude.toFixed(6);

            const longitude =
                position.coords.longitude.toFixed(6);

            // Store coordinates separately
            window.userLatitude = latitude;
            window.userLongitude = longitude;

            // Display coordinates
            locationText.textContent =
                `Latitude: ${latitude}, Longitude: ${longitude}`;

        },

        (error) => {

            console.error("GPS Error:", error);

            locationText.textContent =
                "Location permission unavailable";

            window.userLatitude = null;
            window.userLongitude = null;

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}
/* =========================================================
   CONFIRM SOS
   ========================================================= */
async function confirmSOS() {

    const latitude = window.userLatitude || null;
    const longitude = window.userLongitude || null;

    const sosData = {

        latitude: latitude,

        longitude: longitude,

        emergencyType: document.getElementById("emergencyType").value

    };

    try {

        const response = await fetch(
            "/api/sos",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(sosData)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error("SOS request failed");
        }

        activeSOSCount++;

        const newRequest = {

            priority: result.data.priority,

            id: `#${result.data.id}`,

            emergency: result.data.emergencyType,

            location:
                latitude && longitude
                    ? `${latitude}, ${longitude}`
                    : "Location unavailable",

            hops: 0,

            status: result.data.status

        };

        emergencyRequests.unshift(newRequest);

        updateStatistics();

        renderSOSRequests();

        closeSOS();

        showToast(
            `🚨 SOS transmitted successfully. AI Priority: ${result.data.priority}`
        );

        console.log(
            "SOS Response:",
            result
        );

        simulateMessageTransmission();

    } catch (error) {

    console.error("SOS Error:", error);

    // Store SOS locally when backend/network is unavailable
    saveSOSOffline(sosData);

}

}
/* =========================================================
   UPDATE STATISTICS
   ========================================================= */

function updateStatistics() {

    if (activeSOSElement) {

        activeSOSElement.textContent =
            activeSOSCount;

    }


    if (meshNodesElement) {

        meshNodesElement.textContent =
            meshNodeCount;

    }

}


/* =========================================================
   RENDER SOS TABLE
   ========================================================= */

function renderSOSRequests() {

    if (!sosTable) {
        return;
    }


    sosTable.innerHTML = "";


    emergencyRequests.forEach((request) => {

        const row =
            document.createElement("tr");


        const priorityClass =
            request.priority.toLowerCase();


        const statusClass =
            request.status.toLowerCase();


        row.innerHTML = `

            <td>
                <span class="priority ${priorityClass}">
                    ${request.priority}
                </span>
            </td>

            <td>${request.id}</td>

            <td>${request.emergency}</td>

            <td>${request.location}</td>

            <td>${request.hops} hops</td>

            <td>
                <span class="request-status ${statusClass}">
                    ${request.status}
                </span>
            </td>

        `;


        sosTable.appendChild(row);

    });

}


/* =========================================================
   REFRESH REQUESTS
   ========================================================= */

function refreshRequests() {

    showToast("Refreshing Disaster Bridge emergency network...");


    setTimeout(() => {

        meshNodeCount =
            Math.floor(
                Math.random() * 8
            ) + 20;


        updateStatistics();


        showToast(
            "Network data synchronized successfully."
        );

    }, 900);

}


/* =========================================================
   NETWORK SIMULATION
   ========================================================= */

function initializeNetwork() {

    const nodes =
        document.querySelectorAll(".node");


    nodes.forEach((node, index) => {

        node.style.animation =
            `networkPulse ${1.5 + index * 0.15}s infinite`;

    });

}


/* =========================================================
   MESSAGE TRANSMISSION SIMULATION
   ========================================================= */

function simulateMessageTransmission() {

    const newRequest =
        emergencyRequests[0];


    if (!newRequest) {
        return;
    }


    let currentHop = 0;


    const transmission =
        setInterval(() => {

            currentHop++;

            newRequest.hops =
                currentHop;


            renderSOSRequests();


            if (currentHop >= 4) {

                clearInterval(transmission);


                newRequest.status =
                    "ASSIGNED";


                renderSOSRequests();


                showToast(
                    `${newRequest.id} reached a rescue-connected node.`
                );

            }

        }, 700);

}


/* =========================================================
   TOAST MESSAGE
   ========================================================= */

let toastTimer;


function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }


    clearTimeout(toastTimer);


    toastMessage.textContent =
        message;


    toast.classList.add("show");


    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);

}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
   ========================================================= */

if (sosModal) {

    sosModal.addEventListener(
        "click",
        (event) => {

            if (event.target === sosModal) {

                closeSOS();

            }

        }
    );

}


/* =========================================================
   ESC KEY CLOSE
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            sosModal &&
            sosModal.classList.contains("show")
        ) {

            closeSOS();

        }

    }
);


/* =========================================================
   NETWORK PULSE ANIMATION
   ========================================================= */

const animationStyle =
    document.createElement("style");


animationStyle.textContent = `

    @keyframes networkPulse {

        0% {
            transform: scale(1);
            opacity: 1;
        }

        50% {
            transform: scale(1.08);
            opacity: 0.65;
        }

        100% {
            transform: scale(1);
            opacity: 1;
        }

    }

`;


document.head.appendChild(animationStyle);


/* =========================================================
   SYSTEM STATUS
   ========================================================= */

function updateSystemStatus() {

    if (!systemStatus) {
        return;
    }


    if (navigator.onLine) {

        systemStatus.textContent =
            "SYSTEM ONLINE";

    } else {

        systemStatus.textContent =
            "OFFLINE MODE";

    }

}


window.addEventListener(
    "online",
    updateSystemStatus
);


window.addEventListener(
    "offline",
    updateSystemStatus
);


updateSystemStatus();

/* =========================================
   DISASTER BRIDGE - OFFLINE STORE & FORWARD
   ========================================= */

const OFFLINE_SOS_KEY = "disasterBridgeOfflineSOS";


function saveSOSOffline(sosData) {

    const existingSOS =
        JSON.parse(localStorage.getItem(OFFLINE_SOS_KEY)) || [];

    existingSOS.push({
        ...sosData,
        queuedAt: new Date().toISOString()
    });

    localStorage.setItem(
        OFFLINE_SOS_KEY,
        JSON.stringify(existingSOS)
    );

    console.log("📦 SOS stored offline:", sosData);

    showToast(
        "📦 Network unavailable. SOS stored safely and will be forwarded automatically."
    );
}


/* Forward stored SOS when connection returns */

async function forwardOfflineSOS() {

    const offlineSOS =
        JSON.parse(localStorage.getItem(OFFLINE_SOS_KEY)) || [];

    if (offlineSOS.length === 0) {
        return;
    }

    console.log(
        `📡 Found ${offlineSOS.length} offline SOS. Forwarding...`
    );

    const remainingSOS = [];

    for (const sos of offlineSOS) {

        try {

            const response = await fetch(
                "/api/sos",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        latitude: sos.latitude,
                        longitude: sos.longitude,
                        emergencyType: sos.emergencyType
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Forward failed");
            }

            console.log("📡 Offline SOS forwarded successfully.");

        } catch (error) {

            console.log(
                "⏳ Still offline. SOS kept in queue."
            );

            remainingSOS.push(sos);
        }
    }

    localStorage.setItem(
        OFFLINE_SOS_KEY,
        JSON.stringify(remainingSOS)
    );

    if (remainingSOS.length === 0) {

        showToast(
            "📡 Offline SOS successfully forwarded to rescue network."
        );
    }
}


/* Check for queued SOS whenever connection returns */

window.addEventListener("online", () => {

    console.log("🟢 Network connection restored.");

    forwardOfflineSOS();
});


/* Try forwarding when page loads */

window.addEventListener("load", () => {

    forwardOfflineSOS();

});