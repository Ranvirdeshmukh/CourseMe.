# DartCourse Scripts

This directory contains utility scripts for managing DartCourse data.

## GCS Course Sync Script

The `syncGCSClasses.js` script synchronizes course data from the Google Cloud Storage timetable JSON to the Firebase courses collection.

### Features

- **Dry Run Mode**: Test the sync process without making changes to the database
- **Duplicate Detection**: Uses existing logic to determine if courses already exist
- **Comprehensive Logging**: Detailed logs for monitoring and debugging
- **Error Handling**: Graceful error handling with detailed error reporting
- **Progress Tracking**: Shows progress during long sync operations

### Prerequisites

1. **Firebase Admin SDK**: Uses environment variables for authentication
2. **Node.js**: Version 14 or higher
3. **Dependencies**: Install required packages

### Setup

#### 1. Get Your Firebase Service Account Credentials

**IMPORTANT**: Your Firebase project ID is `coursereview-98a89`

1. Go to [Firebase Console](https://console.firebase.google.com/project/coursereview-98a89)
2. Click the gear icon (⚙️) next to "Project Overview" to open Project Settings
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Download the JSON file and note these values:
   - `project_id`
   - `private_key`
   - `client_email`

#### 2. Create Environment Variables

1. Copy `env-template.txt` to your project root directory and rename it to `.env`
2. Fill in your Firebase service account values:

```bash
# In your project root directory (.env file)
REACT_APP_FIREBASE_PROJECT_ID=coursereview-98a89
REACT_APP_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
REACT_APP_FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@coursereview-98a89.iam.gserviceaccount.com
```

**Important Notes:**
- The private key must include the full key with `\n` for newlines
- The client email should match your service account email
- Keep your `.env` file secure and never commit it to version control

#### 3. Install Dependencies

```bash
cd scripts
npm install
```

#### 4. Test Firebase Connection

```bash
npm run setup
```

This will verify that your environment variables are working and can connect to Firestore.

### Usage

#### 1. Dry Run (Recommended First Step)

```bash
npm run sync-gcs-dry
```

This will:
- Fetch all courses from the GCS JSON
- Check which courses already exist in your Firebase database
- Show what would be added without making any changes
- Provide a detailed summary

#### 2. Full Sync

After reviewing the dry run logs and ensuring everything looks correct:

```bash
npm run sync-gcs-live
```

**⚠️ Warning**: This will actually add courses to your Firebase database. Make sure you've reviewed the dry run output first.

#### 3. Custom Execution

You can also run the script directly:

```bash
node syncGCSClasses.js
```

### How It Works

1. **Data Fetching**: Retrieves course data from `https://storage.googleapis.com/timetable-info/courses_detailed.json`

2. **Duplicate Detection**: For each course, checks if it already exists using:
   - `department` field (e.g., "AAAS", "ANTH")
   - `course_number` field (normalized to 3-digit format)

3. **Document Creation**: Creates new course documents with the following structure:
   ```javascript
   {
     department: "AAAS",
     course_number: "009",
     name: "Intro to Diaspora Studies",
     period_code: "10A",
     timing: "TuTh 10:10-12, F 3:30-4:20",
     room: "101",
     building: "37 Dewey Field Road",
     instructor: "Marvin Chochotte",
     xlist: "",
     wc: "CI",
     dist: "INT",
     layup: 0,
     numOfReviews: 0,
     distribs: ["INT"],
     lastUpdated: serverTimestamp(),
     source: "GCS_Timetable_Sync",
     syncDate: serverTimestamp()
   }
   ```

4. **Progress Logging**: Shows real-time progress and detailed logs for each operation

### Log Output Examples

#### Dry Run Output
```
+ Would add new course: AAAS 009 - Intro to Diaspora Studies
  Document: {
    "department": "AAAS",
    "course_number": "009",
    "name": "Intro to Diaspora Studies",
    ...
  }
```

#### Existing Course Output
```
✓ Course already exists: AAAS 010 - Intro African Amer Studies
```

#### Summary Output
```
=== SYNC SUMMARY ===
Total courses in GCS: 1234
Existing courses: 856
New courses: 378
Skipped courses: 0
Errors: 0
```

### Configuration

The script uses the same period code mapping and course number normalization logic as your existing application to ensure consistency.

### Troubleshooting

#### Common Issues

1. **Missing Environment Variables**
   - Ensure you've created a `.env` file in your project root directory
   - Check that all required variables are set correctly
   - Use `npm run setup` to test your configuration

2. **Firestore API Not Enabled**
   - Go to [Google Cloud Console](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=coursereview-98a89)
   - Click "Enable" to activate the Firestore API
   - Wait a few minutes for changes to propagate

3. **Permission Denied**
   - Ensure your service account has the "Firebase Admin" role
   - Check that your private key and client email are correct
   - Verify the private key includes the full key with `\n` for newlines

#### Testing Connection

Use the setup script to test your Firebase connection:

```bash
npm run setup
```

This will help identify and resolve common configuration issues.

### Safety Features

- **Dry Run by Default**: Script starts in dry run mode to prevent accidental changes
- **Comprehensive Logging**: All operations are logged for audit purposes
- **Error Handling**: Individual course errors don't stop the entire sync process
- **Progress Tracking**: Real-time progress updates during long operations

### Integration

This script can be integrated into your CI/CD pipeline or run manually as needed. The modular design allows you to import and use individual functions in other scripts.

### Project Information

- **Firebase Project ID**: `coursereview-98a89`
- **Collection**: `courses`
- **Data Source**: Google Cloud Storage timetable JSON
- **Sync Method**: Firebase Admin SDK with environment variable authentication
- **Environment File**: `.env` in project root directory
