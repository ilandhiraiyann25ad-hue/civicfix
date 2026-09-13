from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sqlite3
import os

app = FastAPI()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# UPLOADS FOLDER
os.makedirs("uploads", exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# DATABASE
def create_database():
    connection = sqlite3.connect("civic.db")
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)

    # Worker column
    try:
        cursor.execute("""
            ALTER TABLE complaints
            ADD COLUMN worker TEXT
        """)
    except sqlite3.OperationalError:
        pass

    # After-work photo column
    try:
        cursor.execute("""
            ALTER TABLE complaints
            ADD COLUMN after_photo TEXT
        """)
    except sqlite3.OperationalError:
        pass

    connection.commit()
    connection.close()


create_database()


@app.get("/")
def home():
    return {
        "message": "Smart Civic Complaint System Backend is Working!"
    }


# CREATE COMPLAINT
@app.post("/complaints")
def create_complaint(
    category: str = Form(...),
    location: str = Form(...),
    description: str = Form(...)
):

    connection = sqlite3.connect("civic.db")
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO complaints
        (category, location, description, status, worker, after_photo)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        category,
        location,
        description,
        "Pending",
        None,
        None
    ))

    connection.commit()

    complaint_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Complaint submitted successfully!",
        "complaint_id": complaint_id,
        "status": "Pending",
        "worker": None,
        "after_photo": None
    }


# GET ALL COMPLAINTS
@app.get("/complaints")
def get_complaints():

    connection = sqlite3.connect("civic.db")
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            category,
            location,
            description,
            status,
            worker,
            after_photo
        FROM complaints
    """)

    complaints = cursor.fetchall()

    connection.close()

    result = []

    for complaint in complaints:

        result.append({
            "id": complaint[0],
            "category": complaint[1],
            "location": complaint[2],
            "description": complaint[3],
            "status": complaint[4],
            "worker": complaint[5],
            "after_photo": complaint[6]
        })

    return result


# UPDATE COMPLAINT STATUS
@app.put("/complaints/{complaint_id}/status")
def update_status(
    complaint_id: int,
    status: str = Form(...)
):

    connection = sqlite3.connect("civic.db")
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE complaints
        SET status = ?
        WHERE id = ?
    """, (
        status,
        complaint_id
    ))

    connection.commit()
    connection.close()

    return {
        "message": "Complaint status updated successfully!",
        "complaint_id": complaint_id,
        "status": status
    }


# ASSIGN WORKER
@app.put("/complaints/{complaint_id}/worker")
def assign_worker(
    complaint_id: int,
    worker: str = Form(...)
):

    connection = sqlite3.connect("civic.db")
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE complaints
        SET worker = ?
        WHERE id = ?
    """, (
        worker,
        complaint_id
    ))

    connection.commit()
    connection.close()

    return {
        "message": "Worker assigned successfully!",
        "complaint_id": complaint_id,
        "worker": worker
    }


# UPLOAD AFTER-WORK PHOTO
@app.put("/complaints/{complaint_id}/after-photo")
async def upload_after_photo(
    complaint_id: int,
    photo: UploadFile = File(...)
):

    os.makedirs("uploads", exist_ok=True)

    filename = f"after_{complaint_id}_{photo.filename}"

    file_path = os.path.join(
        "uploads",
        filename
    )

    contents = await photo.read()

    with open(file_path, "wb") as file:
        file.write(contents)

    connection = sqlite3.connect("civic.db")
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE complaints
        SET after_photo = ?
        WHERE id = ?
    """, (
        filename,
        complaint_id
    ))

    connection.commit()
    connection.close()

    return {
        "message": "After-work photo uploaded successfully!",
        "complaint_id": complaint_id,
        "after_photo": filename,
        "photo_url": f"/uploads/{filename}"
    }