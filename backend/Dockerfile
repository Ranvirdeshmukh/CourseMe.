# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV FLASK_ENV production
ENV GOOGLE_CLOUD_PROJECT courseme-chatbot

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Make sure the data directory is accessible
RUN mkdir -p /app/data && chmod -R 755 /app/data

# Create a non-root user and switch to it
RUN useradd -m myuser
USER myuser

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]