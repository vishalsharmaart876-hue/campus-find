"""
CampusFind AI Image Matching Microservice
Uses OpenCV and NumPy for computer vision feature extraction and visual similarity matching.
Combines HSV color histogram comparison with ORB feature keypoint matching.
"""

import os
import sys
import json
import base64
import urllib.request
import io
import cv2
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

def load_image_from_source(source):
    """
    Load an image from either a local file path, a remote HTTP/HTTPS URL, 
    or a base64 encoded data URI.
    """
    try:
        if not source:
            return None

        # Check if base64 data uri
        if source.startswith('data:image'):
            header, encoded = source.split(',', 1)
            img_bytes = base64.b64decode(encoded)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img

        # Check if HTTP/HTTPS URL
        if source.startswith('http://') or source.startswith('https://'):
            req = urllib.request.Request(
                source, 
                headers={'User-Agent': 'Mozilla/5.0 (CampusFind-AI-Matcher/1.0)'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                img_array = np.asarray(bytearray(response.read()), dtype=np.uint8)
                img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                return img

        # Check if local file path
        if os.path.exists(source):
            return cv2.imread(source)

        return None
    except Exception as e:
        print(f"Error loading image from {source}: {e}", file=sys.stderr)
        return None

def compute_color_histogram(image):
    """
    Compute normalized 2D HSV histogram (Hue & Saturation).
    """
    try:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        # 30 bins for hue, 32 bins for saturation
        hist = cv2.calcHist([hsv], [0, 1], None, [30, 32], [0, 180, 0, 256])
        cv2.normalize(hist, hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        return hist
    except Exception as e:
        print(f"Error computing histogram: {e}", file=sys.stderr)
        return None

def compute_orb_descriptors(image):
    """
    Extract ORB (Oriented FAST and Rotated BRIEF) keypoints and descriptors.
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        orb = cv2.ORB_create(nfeatures=500)
        keypoints, descriptors = orb.detectAndCompute(gray, None)
        return keypoints, descriptors
    except Exception as e:
        print(f"Error computing ORB descriptors: {e}", file=sys.stderr)
        return None, None

def match_orb_descriptors(desc1, desc2):
    """
    Match ORB descriptors using BFMatcher with Hamming distance.
    Returns match ratio score between 0.0 and 1.0.
    """
    if desc1 is None or desc2 is None or len(desc1) == 0 or len(desc2) == 0:
        return 0.0
    
    try:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(desc1, desc2)
        if not matches:
            return 0.0
        
        # Sort matches by distance
        matches = sorted(matches, key=lambda x: x.distance)
        
        # Count good matches (distance < 50)
        good_matches = [m for m in matches if m.distance < 50]
        min_keypoints = min(len(desc1), len(desc2))
        
        if min_keypoints == 0:
            return 0.0
        
        score = min(1.0, (len(good_matches) * 1.5) / min_keypoints)
        return float(score)
    except Exception as e:
        print(f"Error matching descriptors: {e}", file=sys.stderr)
        return 0.0

def compare_images(img1, img2):
    """
    Compare two images using combined color histogram correlation 
    and ORB feature matching.
    """
    if img1 is None or img2 is None:
        return 0.0, 0.0, 0.0

    # Resize both to standard dimensions for consistent comparison
    img1_std = cv2.resize(img1, (300, 300))
    img2_std = cv2.resize(img2, (300, 300))

    # 1. Color Histogram Comparison (Correlation method)
    hist1 = compute_color_histogram(img1_std)
    hist2 = compute_color_histogram(img2_std)
    
    color_score = 0.0
    if hist1 is not None and hist2 is not None:
        raw_corr = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
        # Normalize from [-1, 1] to [0, 1]
        color_score = max(0.0, float(raw_corr))

    # 2. Structural ORB feature comparison
    _, desc1 = compute_orb_descriptors(img1_std)
    _, desc2 = compute_orb_descriptors(img2_std)
    orb_score = match_orb_descriptors(desc1, desc2)

    # 3. Weighted ensemble score: 55% color fidelity, 45% structural features
    combined_score = (0.55 * color_score) + (0.45 * orb_score)
    final_score = round(min(100.0, combined_score * 100.0), 1)

    return final_score, round(color_score * 100, 1), round(orb_score * 100, 1)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "CampusFind AI Image Matching Service",
        "version": "1.0.0",
        "opencv_version": cv2.__version__
    }), 200

@app.route('/api/match', methods=['POST'])
def match_items():
    """
    Accepts:
    {
      "query_image": "url or path",
      "candidates": [
         { "id": "...", "image": "url or path", "title": "...", "category": "..." }
      ],
      "min_threshold": 25.0
    }
    """
    data = request.get_json(force=True, silent=True)
    if not data or 'query_image' not in data or 'candidates' not in data:
        return jsonify({"error": "Missing 'query_image' or 'candidates' in payload"}), 400

    query_img_source = data['query_image']
    candidates = data.get('candidates', [])
    min_threshold = float(data.get('min_threshold', 20.0))

    query_img = load_image_from_source(query_img_source)
    if query_img is None:
        return jsonify({
            "error": "Could not read query image source",
            "matches": []
        }), 400

    results = []
    for cand in candidates:
        cand_img_source = cand.get('image') or cand.get('imageUrl') or cand.get('photo')
        if not cand_img_source:
            continue

        cand_img = load_image_from_source(cand_img_source)
        if cand_img is None:
            continue

        score, color_score, feature_score = compare_images(query_img, cand_img)
        
        confidence = "Low"
        if score >= 70:
            confidence = "High"
        elif score >= 45:
            confidence = "Moderate"

        if score >= min_threshold:
            results.append({
                "item_id": cand.get("id") or cand.get("_id"),
                "title": cand.get("title") or cand.get("name"),
                "category": cand.get("category"),
                "image": cand_img_source,
                "similarity_score": score,
                "color_score": color_score,
                "feature_score": feature_score,
                "confidence": confidence,
                "note": "AI visual suggestion only - verify ownership questions before returning."
            })

    # Sort descending by similarity score
    results = sorted(results, key=lambda x: x['similarity_score'], reverse=True)

    return jsonify({
        "success": True,
        "query_processed": True,
        "total_candidates": len(candidates),
        "matches_found": len(results),
        "matches": results
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('AI_PORT', 5001))
    print(f"Starting CampusFind AI Matcher on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
