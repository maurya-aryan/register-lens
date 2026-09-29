# Deploying to Google Cloud Run

Prerequisites: a Google Cloud project with billing linked, the `gcloud` CLI, and a Gemini API key from https://aistudio.google.com.

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# from the repository root (uses the Dockerfile; builds in the cloud, no local Docker needed)
gcloud run deploy register-lens \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 1Gi --timeout 300 \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```
The command prints the live URL. For a longer-lived key, store it in Secret Manager and use `--set-secrets GEMINI_API_KEY=name:latest` instead.

Notes: the SQLite demo database is recreated on each container start (it is mock data). Uploaded photos are ephemeral.
