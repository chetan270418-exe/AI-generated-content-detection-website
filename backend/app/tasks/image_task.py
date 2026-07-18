from .celery_app import celery_app
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
import sys

# Ensure ml package is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

@celery_app.task(name="app.tasks.image_task.analyze_image_task")
def analyze_image_task(analysis_id: str):
    # Connect to MongoDB synchronously for Celery
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "dictator")
    
    client = MongoClient(mongo_uri)
    db = client[db_name]
    analyses_collection = db["analyses"]
    
    try:
        # Find analysis
        analysis = analyses_collection.find_one({"_id": ObjectId(analysis_id)})
        if not analysis:
            return {"error": "Analysis not found"}
            
        # Update status
        analyses_collection.update_one(
            {"_id": ObjectId(analysis_id)},
            {"$set": {"status": "processing"}}
        )
        
        # Import ML predictor here so it loads within worker
        from ml.image_detector.predict import predict_image
        
        file_path = analysis.get("file_path")
        
        # Run prediction
        result = predict_image(file_path)
        
        # Update with success
        analyses_collection.update_one(
            {"_id": ObjectId(analysis_id)},
            {
                "$set": {
                    "status": "completed",
                    "verdict": result.get("verdict"),
                    "confidence_score": result.get("confidence"),
                    "explanation": result.get("explanation"),
                    "detailed_results": result.get("detailed_results"),
                    "completed_at": datetime.utcnow()
                }
            }
        )
        return {"status": "success", "analysis_id": analysis_id}
        
    except Exception as e:
        analyses_collection.update_one(
            {"_id": ObjectId(analysis_id)},
            {
                "$set": {
                    "status": "failed",
                    "explanation": f"Analysis failed: {str(e)}",
                    "completed_at": datetime.utcnow()
                }
            }
        )
        return {"status": "failed", "error": str(e)}
    finally:
        client.close()
