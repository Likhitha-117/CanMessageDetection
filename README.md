# 🛡️ CAN Intrusion Detection Platform

**Sequence-Based Multi-Class CAN IDS using LSTM with Role-Based Access Control**

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (running on `localhost:27017`)

### 1. Backend Setup
```bash```
cd backend
# Activate virtual environment
..\venv\Scripts\activate   # Windows
# or: source ../venv/bin/activate   # Linux/Mac

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm run dev
```
Frontend runs at `http://localhost:5173` with API proxied to `:8000`.

### 3. Usage Flow

1. **Register an Admin** at `/register` (auto-approved).
2. **Register an Owner & Engineer** (require admin approval).
3. **Login as Admin** → Approve pending users → Create a vehicle → Note the `vehicle_api_key`.
4. **Run the simulator**:
   ```bash
   cd simulator
   python vehicle_simulator.py <VEHICLE_API_KEY>
   ```
5. **Login as Owner/Engineer** and view dashboards.

## Project Structure
```
├── backend/
│   ├── app/
│   │   ├── api/          # auth, admin, owner, engineer, logs
│   │   ├── core/         # config, database, security, dependencies
│   │   ├── models/       # Pydantic schemas
│   │   ├── services/     # LSTM AI service
│   │   └── main.py
│   └── requirements.txt
├── frontend/             # React + Vite + Tailwind
│   └── src/
│       ├── components/   # Navbar, LogTable, SummaryCards, AttackChart
│       ├── pages/        # Login, Register, Admin/Owner/Engineer Dashboards
│       ├── context/      # AuthContext
│       └── api.js        # Axios client
├── simulator/
│   ├── vehicle_simulator.py
│   └── data/sample_can_logs.csv
```

## API Endpoints
| Group | Endpoint | Auth |
|-------|----------|------|
| Auth | `POST /api/auth/register`, `/login` | Public |
| Admin | `GET /api/admin/pending-users`, `POST /approve-user/{id}`, `/create-vehicle`, `/assign-engineer`, `GET /all-logs`, `/system-stats` | Admin JWT |
| Owner | `GET /api/owner/my-vehicle`, `/my-logs`, `/attack-summary` | Owner JWT |
| Engineer | `GET /api/engineer/assigned-vehicles`, `/vehicle-logs/{id}`, `/attack-distribution/{id}`, `/download-csv/{id}` | Engineer JWT |
| Ingestion | `POST /api/logs/ingest` | Vehicle API Key |

## 🛠️ Technology Stack

### Backend (FastAPI + AI)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Python web framework)
- **AI/ML Engine**: [TensorFlow](https://www.tensorflow.org/) & [Keras](https://keras.io/)
- **Data Processing**: [NumPy](https://numpy.org/), [Pandas](https://pandas.pydata.org/), [Scikit-learn](https://scikit-learn.org/) (StandardScaler for feature normalization)
- **Database Driver**: [Motor](https://motor.readthedocs.io/) (Async MongoDB driver)
- **Security**: [PyJWT](https://pyjwt.readthedocs.io/) (Authentication), [Passlib](https://passlib.readthedocs.io/) with Bcrypt (Password hashing)
- **Server**: [Uvicorn](https://www.uvicorn.org/)

### Frontend (React + Vite)
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v3.4](https://tailwindcss.com/)
- **Data Visualization**: [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **API Client**: [Axios](https://axios-http.com/)

### Infrastructure
- **Database**: [MongoDB](https://www.mongodb.com/) (NoSQL document store)
- **Simulations**: Python-based CAN bus traffic generator

---

## 🔄 System Workflow

### 1. User & Access Management
1.  **Onboarding**: 
    - **Admins** register and are auto-approved.
    - **Owners** and **Engineers** register but remain "pending" until an Admin approves them.
2.  **Asset Management**:
    - **Admin** creates a **Vehicle** (assigns it a name, VIN, etc.).
    - System generates a unique `vehicle_api_key` for that vehicle.
    - **Admin** assigns the **Vehicle** to an **Owner** and an **Engineer**.

### 2. Live Data Ingestion Pipeline
1.  **Traffic Simulation**: The `vehicle_simulator.py` reads raw CAN logs and sends them to the `/api/logs/ingest` endpoint using the `vehicle_api_key`.
2.  **Feature Extraction**: The backend extracts 10 features from each CAN message (CAN ID, DLC, and Data Bytes D0-D7).
3.  **Scaling**: Features are normalized using the same `StandardScaler` used during model training (loaded via `joblib`).

### 3. Intrusion Detection Logic (AI)
1.  **Sliding Window**: The system maintains a `deque` buffer of size **20** for each vehicle.
2.  **Prediction Trigger**: Once the 20-step sequence is full, the **LSTM model** performs inference on the sequence.
3.  **Classification**: The model classifies the sequence into one of 5 categories:
    - `Normal`
    - `DoS` (Denial of Service)
    - `Fuzzy`
    - `Spoofing`
    - `Replay`
4.  **Storage**: Both raw data and AI predictions (with confidence scores) are stored in MongoDB.

### 4. Dashboards & Visualization
- **Admin**: System-wide statistics and user approval management.
- **Owner**: Real-time health status and attack summaries for their specific vehicle.
- **Engineer**: Deep-dive log analysis, full payload inspection, and historical attack distribution charts for assigned vehicles.
