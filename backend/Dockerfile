FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (OpenCV requires libgl)
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
# Assuming this Dockerfile is run from the root of the project
# We will copy the `ml` folder and `backend` folder so imports work correctly
COPY ./ml /app/ml
COPY ./backend/app /app/backend/app
COPY ./backend/requirements.txt /app/backend/requirements.txt

# We set PYTHONPATH so it treats /app as the root, allowing `ml` imports
ENV PYTHONPATH=/app

WORKDIR /app/backend

# The startup command is usually overridden in docker-compose.yml
# to run either uvicorn or celery.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
