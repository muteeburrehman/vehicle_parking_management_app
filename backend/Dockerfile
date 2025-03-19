# Use official Python image as base
FROM python:3.10

# Set the working directory inside the container
WORKDIR /

# Copy requirements.txt
COPY requirements.txt /

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application code to maintain the backend.app structure
COPY . /backend

# Expose FastAPI's port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/

# Run FastAPI application using Uvicorn
CMD ["python", "/backend/app/main.py"]