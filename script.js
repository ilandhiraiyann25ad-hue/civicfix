const API_URL = "https://civicfix-backend-ef93.onrender.com";

const departmentMap = {
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


// ================================
// REPORT COMPLAINT
// ================================

const complaintForm = document.getElementById("complaintForm");

if (complaintForm) {

    const categorySelect = document.getElementById("category");
    const departmentInput = document.getElementById("department");

    if (categorySelect && departmentInput) {

        categorySelect.addEventListener("change", function () {

            const selectedCategory = categorySelect.value;

            departmentInput.value =
                departmentMap[selectedCategory] || "";

        });
    }


    complaintForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const category = document.getElementById("category").value;
        const location = document.getElementById("location").value;
        const description = document.getElementById("description").value;

        if (!category || !location || !description) {
            alert("Please fill all required fields.");
            return;
        }

        const formData = new FormData();

        formData.append("category", category);
        formData.append("location", location);
        formData.append("description", description);

        try {

            const response = await fetch(
                `${API_URL}/complaints`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (response.ok) {

                alert(
                    "Complaint submitted successfully!\nComplaint ID: CIV-" +
                    data.complaint_id
                );

                complaintForm.reset();

                if (departmentInput) {
                    departmentInput.value = "";
                }

            } else {

                alert("Unable to submit complaint.");

            }

        } catch (error) {

            console.error(error);

            alert(
                "Backend connection failed. Please try again."
            );
        }
    });
}


// ================================
// GET CURRENT LOCATION
// ================================

const locationButton =
    document.getElementById("getLocation");

if (locationButton) {

    locationButton.addEventListener("click", function () {

        if (!navigator.geolocation) {

            alert("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(

            function (position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                const locationInput =
                    document.getElementById("location");

                if (locationInput) {

                    locationInput.value =
                        `${latitude}, ${longitude}`;
                }
            },

            function () {

                alert(
                    "Unable to get your current location."
                );
            }
        );
    });
}


// ================================
// TRACK COMPLAINT
// ================================

const trackForm =
    document.getElementById("trackForm");

if (trackForm) {

    trackForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const complaintInput =
                document.getElementById("complaintId");

            const resultBox =
                document.getElementById("trackingResult");

            if (!complaintInput || !resultBox) {
                return;
            }

            const complaintId =
                complaintInput.value
                    .replace("CIV-", "")
                    .trim();

            if (!complaintId) {

                alert("Please enter a complaint ID.");
                return;
            }

            try {

                const response =
                    await fetch(
                        `${API_URL}/complaints`
                    );

                const complaints =
                    await response.json();

                const complaint =
                    complaints.find(
                        item =>
                            String(item.id) ===
                            String(complaintId)
                    );

                if (!complaint) {

                    resultBox.innerHTML = `
                        <div class="status-card">
                            <h3>Complaint Not Found</h3>
                            <p>
                                Please check your complaint ID.
                            </p>
                        </div>
                    `;

                    return;
                }

                let photoHTML = "";

                if (complaint.after_photo) {

                    photoHTML = `
                        <div class="after-photo">
                            <h4>After-Work Proof</h4>

                            <img
                                src="${API_URL}/uploads/${encodeURIComponent(
                                    complaint.after_photo
                                )}"
                                alt="After work proof"
                                style="
                                    max-width:300px;
                                    width:100%;
                                    border-radius:12px;
                                    margin-top:10px;
                                "
                            >
                        </div>
                    `;
                }

                resultBox.innerHTML = `

                    <div class="status-card">

                        <h3>
                            Complaint CIV-${complaint.id}
                        </h3>

                        <p>
                            <strong>Category:</strong>
                            ${complaint.category}
                        </p>

                        <p>
                            <strong>Location:</strong>
                            ${complaint.location}
                        </p>

                        <p>
                            <strong>Description:</strong>
                            ${complaint.description}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${complaint.status}
                        </p>

                        <p>
                            <strong>Worker:</strong>
                            ${
                                complaint.worker ||
                                "Not Assigned"
                            }
                        </p>

                        ${photoHTML}

                    </div>
                `;

            } catch (error) {

                console.error(error);

                resultBox.innerHTML = `
                    <div class="status-card">
                        <h3>Connection Error</h3>
                        <p>
                            Unable to connect to backend.
                        </p>
                    </div>
                `;
            }
        }
    );
}


// ================================
// UPDATE COMPLAINT STATUS
// ================================

async function updateComplaintStatus(
    complaintId,
    newStatus
) {

    const formData = new FormData();

    formData.append(
        "status",
        newStatus
    );

    try {

        const response =
            await fetch(
                `${API_URL}/complaints/${complaintId}/status`,
                {
                    method: "PUT",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (response.ok) {

            alert(
                "Complaint status updated successfully!"
            );

            updateDashboard();

        } else {

            alert(
                "Unable to update complaint status."
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Unable to update complaint status."
        );
    }
}


// ================================
// ASSIGN WORKER
// ================================

async function assignWorker(
    complaintId,
    workerName
) {

    const formData = new FormData();

    formData.append(
        "worker",
        workerName
    );

    try {

        const response =
            await fetch(
                `${API_URL}/complaints/${complaintId}/worker`,
                {
                    method: "PUT",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (response.ok) {

            alert(
                "Worker assigned successfully!"
            );

            updateDashboard();

        } else {

            alert(
                "Unable to assign worker."
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Unable to assign worker."
        );
    }
}


// ================================
// UPLOAD AFTER-WORK PHOTO
// ================================

async function uploadAfterPhoto(
    complaintId,
    file
) {

    if (!file) {

        alert(
            "Please select an after-work photo."
        );

        return;
    }

    const formData = new FormData();

    formData.append(
        "photo",
        file
    );

    try {

        const response =
            await fetch(
                `${API_URL}/complaints/${complaintId}/after-photo`,
                {
                    method: "PUT",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (response.ok) {

            alert(
                "After-work photo uploaded successfully!"
            );

            updateDashboard();

        } else {

            alert(
                "Unable to upload photo."
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Unable to upload photo."
        );
    }
}


// ================================
// DASHBOARD
// ================================

async function updateDashboard() {

    const table =
        document.getElementById(
            "complaintsTable"
        );

    if (!table) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/complaints`
            );

        const complaints =
            await response.json();

        table.innerHTML = "";

        let total = complaints.length;

        let pending =
            complaints.filter(
                item => item.status === "Pending"
            ).length;

        let inProgress =
            complaints.filter(
                item => item.status === "In Progress"
            ).length;

        let completed =
            complaints.filter(
                item => item.status === "Completed"
            ).length;


        const totalElement =
            document.getElementById("totalComplaints");

        const pendingElement =
            document.getElementById("pendingComplaints");

        const progressElement =
            document.getElementById("progressComplaints");

        const completedElement =
            document.getElementById("completedComplaints");


        if (totalElement) {
            totalElement.textContent = total;
        }

        if (pendingElement) {
            pendingElement.textContent = pending;
        }

        if (progressElement) {
            progressElement.textContent =
                inProgress;
        }

        if (completedElement) {
            completedElement.textContent =
                completed;
        }


        complaints.forEach(
            function (complaint) {

                const row =
                    document.createElement("tr");

                let photoHTML = "No Photo";

                if (complaint.after_photo) {

                    photoHTML = `
                        <img
                            src="${API_URL}/uploads/${encodeURIComponent(
                                complaint.after_photo
                            )}"
                            alt="After work"
                            style="
                                width:70px;
                                height:70px;
                                object-fit:cover;
                                border-radius:8px;
                            "
                        />
                    `;
                }

                row.innerHTML = `

                    <td>
                        CIV-${complaint.id}
                    </td>

                    <td>
                        ${complaint.category}
                    </td>

                    <td>
                        ${complaint.location}
                    </td>

                    <td>
                        ${complaint.status}
                    </td>

                    <td>
                        ${
                            complaint.worker ||
                            "Not Assigned"
                        }
                    </td>

                    <td>
                        ${photoHTML}
                    </td>

                `;

                table.appendChild(row);
            }
        );

    } catch (error) {

        console.error(error);

        console.log(
            "Online backend server may not be available."
        );
    }
}


// ================================
// DASHBOARD AUTO LOAD
// ================================

if (
    document.getElementById(
        "complaintsTable"
    )
) {

    updateDashboard();
}
