import os
from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "dictator_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.image_task", "app.tasks.text_task"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    worker_prefetch_multiplier=1, # One task per worker at a time since ML models are heavy
)
