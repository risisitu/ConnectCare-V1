# ConnectCare Healthcare Portal API Documentation

## Authentication Endpoints

### Doctor Authentication
- **POST /api/doctors/signup**
  - Register a new doctor
  - Body: 
    ```json
    {
      "email": "string",
      "password": "string",
      "firstName": "string",
      "lastName": "string",
      "phoneNumber": "string",
      "specialization": "string",
      "licenseNumber": "string",
      "experienceYears": "number",
      "clinicAddress": "string",
      "profileImage": "string (optional)"
    }
    ```

- **POST /api/doctors/login**
  - Login for doctors
  - Body:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```

### Patient Authentication
- **POST /api/patients/signup**
  - Register a new patient
  - Body:
    ```json
    {
      "email": "string",
      "password": "string",
      "firstName": "string",
      "lastName": "string",
      "phoneNumber": "string",
      "dateOfBirth": "date",
      "gender": "enum('male', 'female', 'other')",
      "bloodGroup": "string (optional)",
      "allergies": "string (optional)",
      "profileImage": "string (optional)"
    }
    ```

- **POST /api/patients/login**
  - Login for patients
  - Body:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```

## Doctor Endpoints

### Profile Management
- **GET /api/doctors/profile**
  - Get doctor's profile
  - Requires Authentication

- **PUT /api/doctors/profile**
  - Update doctor's profile
  - Requires Authentication
  - Body: (all fields optional)
    ```json
    {
      "firstName": "string",
      "lastName": "string",
      "phoneNumber": "string",
      "specialization": "string",
      "clinicAddress": "string",
      "profileImage": "string"
    }
    ```

### Patient Management
- **GET /api/doctors/patients**
  - Get list of doctor's patients
  - Requires Authentication

- **GET /api/doctors/patients/:patientId**
  - Get specific patient details
  - Requires Authentication

### Report Management
- **GET /api/doctors/reports**
  - Get all reports
  - Requires Authentication
  - Query Parameters: status, date

- **PUT /api/doctors/reports/:reportId**
  - Update report status
  - Requires Authentication
  - Body:
    ```json
    {
      "status": "enum('approved', 'rejected', 'iterated')",
      "notes": "string"
    }
    ```

## Patient Endpoints

### Profile Management
- **GET /api/patients/profile**
  - Get patient's profile
  - Requires Authentication

- **PUT /api/patients/profile**
  - Update patient's profile
  - Requires Authentication
  - Body: (all fields optional)
    ```json
    {
      "firstName": "string",
      "lastName": "string",
      "phoneNumber": "string",  
      "bloodGroup": "string",
      "allergies": "string",
      "profileImage": "string"
    }
    ```

## Appointment Endpoints

### For Patients
- **POST /api/appointments**
  - Book a new appointment
  - Requires Authentication
  - Body:
    ```json
    {
      "doctorId": "string",
      "appointmentDate": "date",
      "appointmentTime": "time",
      "appointmentType": "enum('video', 'in-person')",
      "reason": "string"
    }
    ```

- **GET /api/appointments**
  - Get patient's appointments
  - Requires Authentication
  - Query Parameters: status, date

### For Doctors
- **GET /api/doctors/appointments**
  - Get doctor's appointments
  - Requires Authentication
  - Query Parameters: status, date

- **PUT /api/appointments/:appointmentId**
  - Update appointment status
  - Requires Authentication
  - Body:
    ```json
    {
      "status": "enum('completed', 'cancelled')"
    }
    ```

## Video Call Endpoints

- **POST /api/appointments/:appointmentId/video**
  - Generate video call link
  - Requires Authentication
  - Response:
    ```json
    {
      "videoCallLink": "string"
    }
    ```

## Report Endpoints

- **POST /api/appointments/:appointmentId/reports**
  - Generate AI report after video call
  - Requires Authentication
  - Body:
    ```json
    {
      "diagnosis": "string",
      "prescription": "string",
      "notes": "string"
    }
    ```

- **GET /api/reports/:reportId**
  - Get specific report details
  - Requires Authentication