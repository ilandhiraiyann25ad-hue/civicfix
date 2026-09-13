let complaints = [];


/* BACKEND URL */

const API_URL = "https://civicfix-backend-ef93.onrender.com";


/* DEPARTMENT MAPPING */

const departments = {

    "Road Damage": "Engineering Department",

    "Drainage Leakage": "Drainage Department",

    "Garbage Dump": "Sanitation Department",

    "Waterlogging": "Drainage Department",

    "Street Light Problem": "Electrical Department",

    "Public Toilet - No Water":
        "Water Supply Department",

    "Public Toilet - No Electricity":
        "Electrical Department",

    "Public Toilet - Blockage":
        "Sanitation Department",

    "Unclean Public Toilet":
        "Sanitation Department",

    "Open Manhole":
        "Drainage Department",

    "Dead Animal Removal":
        "Sanitation Department"
};


/* GET LOCATION */

function getLocation() {

    if (!navigator.geolocation) {

        alert("Location is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            let latitude =
                position.coords.latitude;

            let longitude =
                position.coords.longitude;

            document.getElementById("location").value =
                latitude + ", " + longitude;
        },

        function() {

            alert("Unable to get your location.");
        }
    );
}


/* SUBMIT COMPLAINT */

async function submitComplaint() {

    console.log("Connecting to online backend...");


    let category =
        document.getElementById("category").value;

    let location =
        document.getElementById("location").value;

    let description =
        document.getElementById("description").value;

    let photo =
        document.getElementById("photo").files[0];


    if (
        category === "" ||
        location === "" ||
        description === ""
    ) {

        alert("Please fill all required fields.");
        return;
    }


    let formData = new FormData();

    formData.append("category", category);
    formData.append("location", location);
    formData.append("description", description);


    try {

        let response =
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


        let data =
            await response.json();


        console.log("Backend response:", data);


        let id =
            "CIV-" + data.complaint_id;


        let complaint = {

            id: id,

            category: category,

            location: location,

            description: description,

            department:
                departments[category],

            status: "Pending",

            worker: null,

            after_photo: null,

            date:
                new Date().toLocaleDateString(),

            photo:
                photo ? photo.name : "No photo"
        };


        complaints.push(complaint);


        document.getElementById(
            "complaintId"
        ).innerText = id;


        document.getElementById(
            "successBox"
        ).style.display = "block";


        document.getElementById(
            "category"
        ).value = "";

        document.getElementById(
            "location"
        ).value = "";

        document.getElementById(
            "description"
        ).value = "";

        document.getElementById(
            "photo"
        ).value = "";


        updateDashboard();


        window.location.hash = "track";


    } catch (error) {

        console.error(error);

        alert(
            "Backend connection failed. Please try again."
        );
    }
}


/* TRACK COMPLAINT */

async function trackComplaint() {

    let searchId =
        document
            .getElementById("searchId")
            .value
            .trim();


    let result =
        document.getElementById(
            "trackingResult"
        );


    if (searchId === "") {

        result.innerHTML = `
            <div class="status-card">

                <h3>
                    ⚠️ Enter Complaint ID
                </h3>

                <p>
                    Please enter your Complaint ID.
                </p>

            </div>
        `;

        return;
    }


    try {

        let response =
            await fetch(
                API_URL + "/complaints"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to get complaints"
            );
        }


        let backendComplaints =
            await response.json();


        let complaint =
            backendComplaints.find(
                function(item) {

                    return (
                        "CIV-" + item.id
                        === searchId
                    );
                }
            );


        if (!complaint) {

            result.innerHTML = `
                <div class="status-card">

                    <h3>
                        ❌ Complaint Not Found
                    </h3>

                    <p>
                        Please check your Complaint ID.
                    </p>

                </div>
            `;

            return;
        }


        let afterPhotoHTML =
            complaint.after_photo

            ? `
                <div>

                    <strong>
                        After Work Proof:
                    </strong>

                    <br><br>

                    <img
                        src="${API_URL}/uploads/${encodeURIComponent(complaint.after_photo)}"
                        alt="After Work Photo"
                        style="
                            width:200px;
                            max-width:100%;
                            border-radius:10px;
                            border:1px solid #ddd;
                        "
                    >

                    <br>

                    <small>
                        ${complaint.after_photo}
                    </small>

                </div>
              `

            : `
                <p>
                    <strong>
                        After Work Proof:
                    </strong>

                    Not Uploaded
                </p>
              `;


        result.innerHTML = `

            <div class="status-card">

                <h3>
                    Complaint ID: CIV-${complaint.id}
                </h3>

                <p>
                    <strong>Problem:</strong>
                    ${complaint.category}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${complaint.location}
                </p>

                <p>
                    <strong>Department:</strong>
                    ${departments[complaint.category]}
                </p>

                <p>
                    <strong>Description:</strong>
                    ${complaint.description}
                </p>

                <p>
                    <strong>Worker:</strong>
                    ${complaint.worker || "Not Assigned"}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${complaint.status}
                </p>

                ${afterPhotoHTML}

                <br>

                <span class="status">
                    ${complaint.status}
                </span>

            </div>
        `;


    } catch (error) {

        console.error(error);

        result.innerHTML = `
            <div class="status-card">

                <h3>
                    ⚠️ Backend Error
                </h3>

                <p>
                    Unable to connect to backend.
                </p>

            </div>
        `;
    }
}


/* UPDATE COMPLAINT STATUS */

async function updateStatus(
    complaintId,
    newStatus
) {

    console.log(
        "Updating complaint:",
        complaintId,
        "New status:",
        newStatus
    );


    let formData = new FormData();

    formData.append(
        "status",
        newStatus
    );


    try {

        let response =
            await fetch(
                API_URL +
                "/complaints/" +
                complaintId +
                "/status",
                {
                    method: "PUT",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Status update failed"
            );
        }


        let data =
            await response.json();


        console.log(
            "Status update response:",
            data
        );


        alert(
            "Complaint status updated to " +
            newStatus
        );


        updateDashboard();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to update complaint status."
        );
    }
}


/* ASSIGN WORKER */

async function assignWorker(
    complaintId,
    worker
) {

    console.log(
        "Assigning worker:",
        worker,
        "to complaint:",
        complaintId
    );


    if (worker === "") {

        alert("Please select a worker.");
        return;
    }


    let formData = new FormData();

    formData.append(
        "worker",
        worker
    );


    try {

        let response =
            await fetch(
                API_URL +
                "/complaints/" +
                complaintId +
                "/worker",
                {
                    method: "PUT",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Worker assignment failed"
            );
        }


        let data =
            await response.json();


        console.log(
            "Worker assignment response:",
            data
        );


        alert(
            "Worker " +
            worker +
            " assigned successfully!"
        );


        updateDashboard();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to assign worker."
        );
    }
}


/* AFTER WORK PHOTO */

async function uploadAfterPhoto(
    complaintId,
    file
) {

    console.log(
        "Uploading after-work photo for complaint:",
        complaintId
    );


    if (!file) {

        return;
    }


    let formData = new FormData();

    formData.append(
        "photo",
        file
    );


    try {

        let response =
            await fetch(
                API_URL +
                "/complaints/" +
                complaintId +
                "/after-photo",
                {
                    method: "PUT",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "After photo upload failed"
            );
        }


        let data =
            await response.json();


        console.log(
            "After photo response:",
            data
        );


        alert(
            "After-work photo uploaded successfully!"
        );


        updateDashboard();


    } catch (error) {

        console.error(error);

        alert(
            "Unable to upload after-work photo."
        );
    }
}


/* DASHBOARD */

async function updateDashboard() {

    try {

        let response =
            await fetch(
                API_URL + "/complaints"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load complaints"
            );
        }


        let backendComplaints =
            await response.json();


        complaints =
            backendComplaints.map(
                function(c) {

                    return {

                        id:
                            "CIV-" + c.id,

                        category:
                            c.category,

                        location:
                            c.location,

                        description:
                            c.description,

                        department:
                            departments[c.category],

                        status:
                            c.status,

                        worker:
                            c.worker,

                        after_photo:
                            c.after_photo,

                        date:
                            new Date()
                                .toLocaleDateString(),

                        photo:
                            "No photo"
                    };
                }
            );


        /* STATISTICS */

        let total =
            complaints.length;


        let pending =
            complaints.filter(
                c => c.status === "Pending"
            ).length;


        let progress =
            complaints.filter(
                c => c.status === "In Progress"
            ).length;


        let completed =
            complaints.filter(
                c => c.status === "Completed"
            ).length;


        document.getElementById(
            "total"
        ).innerText = total;


        document.getElementById(
            "pending"
        ).innerText = pending;


        document.getElementById(
            "progress"
        ).innerText = progress;


        document.getElementById(
            "completed"
        ).innerText = completed;


        /* DASHBOARD TABLE */

        let table =
            document.getElementById(
                "complaintTable"
            );


        if (!table) {
            return;
        }


        table.innerHTML = "";


        complaints.forEach(
            function(c) {

                let row =
                    document.createElement("tr");


                let numericId =
                    c.id.replace("CIV-", "");


                let afterPhotoHTML =
                    c.after_photo

                    ? `
                        <div>

                            <img
                                src="${API_URL}/uploads/${encodeURIComponent(c.after_photo)}"
                                alt="After Work Photo"
                                style="
                                    width:100px;
                                    height:80px;
                                    object-fit:cover;
                                    border-radius:8px;
                                    border:1px solid #ddd;
                                "
                            >

                            <br>

                            <small>
                                Uploaded
                            </small>

                        </div>
                      `

                    : `
                        <small>
                            Not Uploaded
                        </small>
                      `;


                row.innerHTML = `

                    <td>
                        ${c.id}
                    </td>

                    <td>
                        ${c.category}
                    </td>

                    <td>
                        ${c.location}
                    </td>

                    <td>
                        ${c.department}
                    </td>

                    <td>
                        ${c.status}
                    </td>

                    <td>

                        <select
                            onchange="updateStatus(${numericId}, this.value)"
                        >

                            <option
                                value="Pending"
                                ${c.status === "Pending" ? "selected" : ""}
                            >
                                Pending
                            </option>

                            <option
                                value="In Progress"
                                ${c.status === "In Progress" ? "selected" : ""}
                            >
                                In Progress
                            </option>

                            <option
                                value="Completed"
                                ${c.status === "Completed" ? "selected" : ""}
                            >
                                Completed
                            </option>

                        </select>

                    </td>

                    <td>

                        <select
                            onchange="assignWorker(${numericId}, this.value)"
                        >

                            <option value="">
                                Select Worker
                            </option>

                            <option
                                value="Worker 1"
                                ${c.worker === "Worker 1" ? "selected" : ""}
                            >
                                Worker 1
                            </option>

                            <option
                                value="Worker 2"
                                ${c.worker === "Worker 2" ? "selected" : ""}
                            >
                                Worker 2
                            </option>

                            <option
                                value="Worker 3"
                                ${c.worker === "Worker 3" ? "selected" : ""}
                            >
                                Worker 3
                            </option>

                            <option
                                value="Worker 4"
                                ${c.worker === "Worker 4" ? "selected" : ""}
                            >
                                Worker 4
                            </option>

                        </select>

                    </td>

                    <td>

                        <input
                            type="file"
                            accept="image/*"
                            onchange="uploadAfterPhoto(${numericId}, this.files[0])"
                        >

                        <br><br>

                        ${afterPhotoHTML}

                    </td>

                `;


                table.appendChild(row);

            }
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        console.log(
            "Online backend server may not be available."
        );
    }
}


/* INITIAL LOAD */

updateDashboard();