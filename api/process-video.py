import json
import os
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler
import requests

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            video_id = data.get('videoId')
            start_time = data.get('startTime')
            end_time = data.get('endTime')
            clip_id = data.get('clipId')
            
            if not all([video_id, start_time is not None, end_time is not None, clip_id]):
                self.send_error(400, "Missing required parameters")
                return
            
            # Create temporary directory
            with tempfile.TemporaryDirectory() as temp_dir:
                output_path = os.path.join(temp_dir, f"clip_{clip_id}.mp4")
                
                # Download and process video using yt-dlp
                youtube_url = f"https://www.youtube.com/watch?v={video_id}"
                
                # Use yt-dlp to download specific segment
                cmd = [
                    'yt-dlp',
                    '--format', 'best[height<=1080][ext=mp4]/best[ext=mp4]/best',
                    '--download-sections', f"*{start_time}-{end_time}",
                    '--output', output_path,
                    '--no-warnings',
                    youtube_url
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    self.send_error(500, f"yt-dlp failed: {result.stderr}")
                    return
                
                # Check if file was created
                if not os.path.exists(output_path):
                    self.send_error(500, "Video file was not created")
                    return
                
                # Read the processed video file
                with open(output_path, 'rb') as video_file:
                    video_data = video_file.read()
                
                # Upload to Cloudflare R2
                r2_url = f"https://44936cff27d6568454e39cf5ca432fb7.r2.cloudflarestorage.com/nice-clips-1/clips/{clip_id}.mp4"
                
                upload_response = requests.put(
                    r2_url,
                    data=video_data,
                    headers={'Content-Type': 'video/mp4'}
                )
                
                if upload_response.status_code != 200:
                    self.send_error(500, f"R2 upload failed: {upload_response.text}")
                    return
                
                # Return success response
                response_data = {
                    "success": True,
                    "videoUrl": r2_url,
                    "thumbnailUrl": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
        except Exception as e:
            self.send_error(500, str(e))
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "Python video processor ready"}).encode('utf-8'))