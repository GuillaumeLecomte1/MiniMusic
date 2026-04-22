#!/usr/bin/env python3
"""MiniMusic Deployment Script for Dokploy"""

import json
import subprocess
import sys

DOKPLOY_URL = "https://dokploy.guillaume-lcte.fr"
API_KEY = "testsjQuiJWrkpmbCCNLJzGmxeqKYTXNPzSXsGXxhzxXEWRFeLFblWriAffIBPfgIXcw"

def api_call(method, endpoint, body=None):
    cmd = ["curl", "-s", "-X", method, f"{DOKPLOY_URL}/api{endpoint}",
           "-H", f"x-api-key: {API_KEY}",
           "-H", "Content-Type: application/json"]
    if body:
        cmd.extend(["-d", json.dumps(body)])
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(result.stdout)
    except:
        return {"raw": result.stdout}

def main():
    print("[INFO] Starting MiniMusic deployment...")

    # 1. Get servers
    print("[INFO] Fetching servers...")
    servers = api_call("GET", "/server.all")
    server_id = servers[0].get("serverId") if servers else None
    print(f"[INFO] Using server: {server_id}")

    # 2. Get all projects
    print("[INFO] Checking existing projects...")
    projects = api_call("GET", "/project.all")
    print(f"[INFO] Found {len(projects) if isinstance(projects, list) else 0} projects")

    # 3. Find or create MiniMusic project
    project_id = None
    if isinstance(projects, list):
        for p in projects:
            if p.get("name") == "MiniMusic":
                project_id = p.get("projectId")
                break

    if not project_id:
        print("[INFO] Creating MiniMusic project...")
        new_project = api_call("POST", "/project.create", {"name": "MiniMusic", "description": "AI Music Generation App"})
        project_id = new_project.get("projectId")
        print(f"[INFO] Project created: {project_id}")
    else:
        print(f"[INFO] Project exists: {project_id}")

    # 4. Create production environment
    print("[INFO] Creating production environment...")
    envs = api_call("GET", f"/environment.byProjectId?projectId={project_id}")
    env_id = None
    if isinstance(envs, list):
        for e in envs:
            if e.get("name") == "production":
                env_id = e.get("environmentId")
                break

    if not env_id:
        new_env = api_call("POST", "/environment.create", {"name": "production", "projectId": project_id})
        env_id = new_env.get("environmentId")
        print(f"[INFO] Environment created: {env_id}")
    else:
        print(f"[INFO] Environment exists: {env_id}")

    # 5. Create application
    print("[INFO] Creating application...")
    app_data = {
        "name": "MiniMusic App",
        "appName": "minimusic",
        "environmentId": env_id,
        "serverId": server_id
    }
    new_app = api_call("POST", "/application.create", app_data)
    app_id = new_app.get("applicationId")
    print(f"[INFO] Application created: {app_id}")

    # 6. Configure GitHub provider
    print("[INFO] Configuring GitHub provider...")
    api_call("POST", "/application.saveGithubProvider", {
        "applicationId": app_id,
        "repository": "GuillaumeLecomte1/MiniMusic",
        "branch": "master",
        "owner": "GuillaumeLecomte1",
        "buildPath": "/",
        "githubId": None,
        "triggerType": "push"
    })
    print("[INFO] GitHub provider configured")

    # 7. Configure build type (Dockerfile)
    print("[INFO] Configuring build type...")
    api_call("POST", "/application.saveBuildType", {
        "applicationId": app_id,
        "buildType": "dockerfile",
        "dockerfile": "Dockerfile",
        "dockerContextPath": "/",
        "dockerBuildStage": None
    })
    print("[INFO] Build type configured")

    # 8. Set environment variables
    print("[INFO] Setting environment variables...")
    import secrets
    encryption_key = secrets.token_hex(16)
    api_call("POST", "/application.saveEnvironment", {
        "applicationId": app_id,
        "env": f"DATABASE_URL=postgresql://minimusic:minimusic123@postgres:5432/minimusic?schema=public\nENCRYPTION_KEY={encryption_key}\nMINIMAX_API_URL=https://api.minimax.io\nPORT=3001\nFRONTEND_URL=http://localhost:5173",
        "buildArgs": None,
        "buildSecrets": None,
        "createEnvFile": True
    })
    print("[INFO] Environment variables set")

    # 9. Create domain
    print("[INFO] Creating domain minimusic.guillaume-lcte.fr...")
    api_call("POST", "/domain.create", {
        "host": "minimusic.guillaume-lcte.fr",
        "https": True,
        "certificateType": "letsencrypt",
        "applicationId": app_id
    })
    print("[INFO] Domain created")

    # 10. Redeploy
    print("[INFO] Triggering deployment...")
    api_call("POST", "/application.redeploy", {"applicationId": app_id})
    print("[INFO] Deployment triggered!")

    print(f"\n[SUCCESS] MiniMusic deployed!")
    print(f"App ID: {app_id}")
    print(f"Check status at: {DOKPLOY_URL}/dashboard")

if __name__ == "__main__":
    main()
