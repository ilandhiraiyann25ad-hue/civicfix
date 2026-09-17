from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import sqlite3
import os

import ollama


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI()


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# UPLOADS FOLDER
# =========================================================

os.makedirs("uploads", exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# =========================================================
# DATABASE
# =========================================================

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


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message": "Smart Civic Complaint System Backend is Working!"
    }


# =========================================================
# CREATE COMPLAINT
# =========================================================

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


# =========================================================
# GET ALL COMPLAINTS
# =========================================================

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


# =========================================================
# UPDATE COMPLAINT STATUS
# =========================================================

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


# =========================================================
# ASSIGN WORKER
# =========================================================

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


# =========================================================
# UPLOAD AFTER-WORK PHOTO
# =========================================================

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


# =========================================================
# CIVICFIX AI ASSISTANT - OLLAMA
# =========================================================

@app.post("/ai-chat")
def ai_chat(
    message: str = Form(...)
):

    if not message.strip():

        return {
            "reply": "Please type your question."
        }


    try:

        response = ollama.chat(

            model="llama3.2:3b",

            messages=[
                {
                    "role": "system",

                    "content": """
You are CivicFix AI Assistant.

CivicFix is a Smart Civic Complaint & Action Tracking System.

Your main job is to help citizens with civic complaints.

Available complaint categories:

1. Road Damage
2. Drainage Leakage
3. Garbage Dump
4. Waterlogging
5. Street Light Problem
6. Public Toilet - No Water
7. Public Toilet - No Electricity
8. Public Toilet - Blockage
9. Unclean Public Toilet
10. Open Manhole
11. Dead Animal Removal


Department mapping:

Road Damage -> Engineering Department

Drainage Leakage -> Drainage Department

Garbage Dump -> Sanitation Department

Waterlogging -> Drainage Department

Street Light Problem -> Electrical Department

Public Toilet - No Water -> Water Supply Department

Public Toilet - No Electricity -> Electrical Department

Public Toilet - Blockage -> Sanitation Department

Unclean Public Toilet -> Sanitation Department

Open Manhole -> Drainage Department

Dead Animal Removal -> Sanitation Department


IMPORTANT RULES:

- Help citizens understand their civic problem.
- If a citizen describes a problem, identify the most suitable CivicFix category.
- Tell the citizen which department normally handles that category.
- Respond in English, Tamil, or Tanglish according to the user's language.
- Keep answers short, simple and friendly.
- Never invent a complaint ID.
- Never claim that a complaint was submitted.
- Never invent a worker name.
- Never invent a complaint status.
- If the user wants to submit a complaint, tell them to use the CivicFix Report Problem page.
- If the user wants to check a complaint, tell them to use the CivicFix Track Complaint page.
- If the user asks something unrelated to CivicFix, politely explain that you mainly help with CivicFix civic complaints.
- Never request passwords, API keys, bank details or other sensitive information.
"""
                },

                {
                    "role": "user",
                    "content": message
                }
            ]
        )


        return {
            "reply": response["message"]["content"]
        }


    except Exception as error:

        print("OLLAMA AI ERROR:", error)

        return {
            "reply": "CivicFix AI is currently unavailable. Please make sure Ollama is running."
        }