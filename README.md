
# CourseMe

<div align="center">
  <img src="public/2.png" alt="CourseMe Logo" width="200"/>
  <p><em>Made for Dartmouth Students by Dartmouth Students</em></p>
  <p>Launching Fall 2024</p>
  
  [![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
</div>

## Overview

CourseMe is an AI-powered platform designed to help Dartmouth students navigate their academic journey by providing insightful course and professor reviews, personalized recommendations, and powerful analytical tools. Our mission is to enhance the course selection experience through transparent, data-driven insights from fellow students.

## Features

### For Students

- **Course Reviews & Ratings**: Detailed reviews and numerical ratings for all Dartmouth courses
- **Professor Analytics**: In-depth analysis of teaching styles and student experiences
- **Interactive Timetable Planning**: Build and visualize your course schedule
- **Personalized Recommendations**: Get course suggestions based on your academic interests and history
- **Search & Filter**: Find courses by department, professor, time slot, and more
- **Major Tracking**: Monitor your progress toward degree completion

### For Administrators

- **User Analytics Dashboard**: Track platform usage and engagement
- **Content Moderation Tools**: Ensure community guidelines are maintained
- **Recommendation Management**: Review and approve course recommendations
- **User-Specific Analytics Tracking**: Monitor which users are accessing specific analytics and when

## Tech Stack

CourseMe is built with modern web technologies:

- **Frontend**: React, Material UI, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Analytics**: Custom analytics service for precise tracking
- **Data Processing**: Natural language processing for sentiment analysis of reviews

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Ranvirdeshmukh/CourseMe.git

# Navigate to the project directory
cd CourseMe

# Install dependencies
npm install

# Start development server
npm start
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## Deployment

CourseMe is deployed using Render:

```bash
# Build for production
npm run build

# Deploy to production
npm run start:prod
```

Visit [courseme.ai](https://courseme.ai) to see the live application.

## Contributing

We welcome contributions from the Dartmouth community! Please read our [Contributing Guidelines](./CONTRIBUTING.md) for more information.

### Development Workflow

1. Create a feature branch from `main`
2. Implement your changes
3. Submit a pull request
4. Address any review feedback

## Analytics Features

CourseMe includes a sophisticated analytics system that:

- Tracks user interactions with course and professor data
- Records session information including device type and duration
- Provides administrators with insights on platform usage
- Helps identify the most valuable content for students

## License

This project is licensed under the [GNU AGPL v3.0](./LICENSE).  
You are free to use, modify, and distribute it under the same terms.

## Contact

- **Website**: [courseme.ai](https://courseme.ai)
- **Email**: team@courseme.ai
- **GitHub**: [github.com/Ranvirdeshmukh/CourseMe](https://github.com/Ranvirdeshmukh/CourseMe)

---

<p align="center">© 2025 CourseMe. All rights reserved.</p>
