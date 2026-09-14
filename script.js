const API_URL = "https://civicfix-backend-ef93.onrender.com";

const departments = {
    "Road Damage": "Engineering Department",
    "Drainage Leakage": "Drainage Department",
    "Garbage Dump": "Sanitation Department",
    "Waterlogging": "Drainage Department",
    "Street Light Problem": "Electrical Department",
    "Public Toilet - No Water": "Water Supply Department",
    "Public Toilet - No Electricity": "Electrical Department",
    "Public Toilet - Blockage": "Sanitation Department",
    "Unclean Public Toilet": "Sanitation Department",
    "Open Manhole": "Drainage Department",
    "Dead Animal Removal": "Sanitation Department"
};


/* ==============================
   CURRENT LOCATION
============================== */

function getLocation() {

    if (!navigator.geolocation) {
        alert("Your browser does not support location.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const locationInput =
                document.getElementById("location");

            if (locationInput) {
                locationInput.value =
                    latitude + ", " + longitude;
            }

            const googleMapsUrl =
                "https://www.google.com/maps?q=" +
                latitude + "," + longitude;

            window.open(
                googleMapsUrl,
                "_blank"
            );
        },

        function(error) {

            console.error(
                "Location Error:",
                error
            );

            if (error.code === 1) {
                alert(
                    "Location permission denied. Please allow location access."
                );
            }
            else if (error.code === 2) {
                alert(
                    "Location unavailable. Please try again."
                );
            }
            else if (error.code === 3) {
                alert(
                    "Location request timed out. Please try again."
                );
            }
            else {
                alert(
                    "Unable to get your current location."
                );
            }
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}


/* ==============================
   SUBMIT COMPLAINT
============================== */

async function submitComplaint() {

    const category =
        document.getElementById("category");

    const location =
        document.getElementById("location");

    const description =
        document.getElementById("description");


    if (!category || !location || !description) {

        alert(
            "Form elements not found."
        );

        return;
    }


    if (category.value === "") {

        alert(
            "Please select a problem."
        );

        return;
    }


    if (location.value.trim() === "") {

        alert(
            "Please enter the problem location."
        );

        return;
    }


    if (description.value.trim() === "") {

        alert(
            "Please describe the problem."
        );

        return;
    }


    const formData =
        new FormData();

    formData.append(
        "category",
        category.value
    );

    formData.append(
        "location",
        location.value
    );

    formData.append(
        "description",
        description.value
    );


    try {

        const response =
            await fetch(
                API_URL + "/complaints",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Backend request failed"
            );
        }


        const data =
            await response.json();


        const complaintId =
            "CIV-" +
            data.complaint_id;


        const complaintIdElement =
            document.getElementById(
                "complaintId"
            );


        if (complaintIdElement) {

            complaintIdElement.innerText =
                complaintId;
        }


        const successBox =
            document.getElementById(
                "successBox"
            );


        if (successBox) {

            successBox.style.display =
                "block";
        }


        alert(
            "Complaint submitted successfully!\n\n" +
            "Complaint ID: " +
            complaintId
        );


        category.value = "";
        location.value = "";
        description.value = "";


        const photo =
            document.getElementById("photo");


        if (photo) {
            photo.value = "";
        }


    }
    catch (error) {

        console.error(
            "Submit Error:",
            error
        );

        alert(
            "Unable to submit complaint.\n\n" +
            "Please try again."
        );
    }
}


/* ==============================
   TRACK COMPLAINT
============================== */

async function trackComplaint() {

    const input =
        document.getElementById("complaintId") ||
        document.getElementById("searchId");


    const result =
        document.getElementById("trackingResult");


    if (!input || !result) {
        return;
    }


    let searchId =
        input.value
            .trim()
            .toUpperCase();


    if (searchId === "") {

        result.innerHTML =
            "<div class='status-card'>" +
            "<h3>Enter Complaint ID</h3>" +
            "</div>";

        return;
    }


    if (!searchId.startsWith("CIV-")) {

        searchId =
            "CIV-" + searchId;
    }


    try {

        const response =
            await fetch(
                API_URL + "/complaints"
            );


        if (!response.ok) {

            throw new Error(
                "Backend connection failed"
            );
        }


        const complaints =
            await response.json();


        const complaint =
            complaints.find(
                function(item) {

                    return (
                        "CIV-" +
                        item.id
                    ) === searchId;

                }
            );


        if (!complaint) {

            result.innerHTML =
                "<div class='status-card'>" +
                "<h3>Complaint Not Found</h3>" +
                "<p>Please check your Complaint ID.</p>" +
                "</div>";

            return;
        }


        const department =
            departments[
                complaint.category
            ] || "Not Assigned";


        result.innerHTML =
            "<div class='status-card'>" +

            "<h3>Complaint ID: CIV-" +
            complaint.id +
            "</h3>" +

            "<p><strong>Problem:</strong> " +
            complaint.category +
            "</p>" +

            "<p><strong>Location:</strong> " +
            complaint.location +
            "</p>" +

            "<p><strong>Department:</strong> " +
            department +
            "</p>" +

            "<p><strong>Description:</strong> " +
            complaint.description +
            "</p>" +

            "<p><strong>Worker:</strong> " +
            (
                complaint.worker ||
                "Not Assigned"
            ) +
            "</p>" +

            "<p><strong>Status:</strong> " +
            complaint.status +
            "</p>" +

            "</div>";

    }
    catch (error) {

        console.error(
            "Track Error:",
            error
        );

        result.innerHTML =
            "<div class='status-card'>" +
            "<h3>Backend Connection Error</h3>" +
            "<p>Please try again.</p>" +
            "</div>";
    }
}


/* ==============================
   DASHBOARD
============================== */

async function updateDashboard() {

    try {

        const response =
            await fetch(
                API_URL + "/complaints"
            );


        if (!response.ok) {

            throw new Error(
                "Backend connection failed"
            );
        }


        const complaints =
            await response.json();


        const total =
            document.getElementById("total");

        const pending =
            document.getElementById("pending");

        const progress =
            document.getElementById("progress");

        const completed =
            document.getElementById("completed");


        if (total) {

            total.innerText =
                complaints.length;
        }


        if (pending) {

            pending.innerText =
                complaints.filter(
                    function(c) {
                        return c.status === "Pending";
                    }
                ).length;
        }


        if (progress) {

            progress.innerText =
                complaints.filter(
                    function(c) {
                        return c.status === "In Progress";
                    }
                ).length;
        }


        if (completed) {

            completed.innerText =
                complaints.filter(
                    function(c) {
                        return c.status === "Completed";
                    }
                ).length;
        }


        const table =
            document.getElementById(
                "complaintTable"
            );


        if (!table) {
            return;
        }


        table.innerHTML = "";


        complaints.forEach(
            function(c) {

                const row =
                    document.createElement(
                        "tr"
                    );


                const department =
                    departments[
                        c.category
                    ] || "Not Assigned";


                row.innerHTML =
                    "<td>CIV-" +
                    c.id +
                    "</td>" +

                    "<td>" +
                    c.category +
                    "</td>" +

                    "<td>" +
                    c.location +
                    "</td>" +

                    "<td>" +
                    department +
                    "</td>" +

                    "<td>" +
                    c.status +
                    "</td>";


                table.appendChild(row);
            }
        );

    }
    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );
    }
}


/* ==============================
   PAGE LOAD
============================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateDashboard();

    }
);