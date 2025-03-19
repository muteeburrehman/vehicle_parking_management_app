# Use official Python image as base
FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Copy requirements.txt from backend directory
COPY requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy the application code from backend/app to /app in the container
COPY ./app /app

# Expose FastAPI's port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run FastAPI application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
