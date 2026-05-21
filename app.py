import os
import json
from datetime import datetime
from flask import Flask, jsonify, request

app = Flask(__name__)
DATA_FILE = "courses.json"

# --- FONCTIONS D'AIDE (Gestion du fichier JSON) ---
def load_courses():
    """Lit les cours depuis le fichier JSON."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        # Gestion d'erreur en cas de problème de lecture du fichier
        return []

def save_courses(courses):
    """Sauvegarde la liste des cours dans le fichier JSON."""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        # Gestion d'erreur en cas de problème d'écriture du fichier
        return False

# --- POINTS DE TERMINAISON (API REST) ---

# Page d'accueil amicale (Évite l'erreur 404 au lancement)
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Bienvenue sur l'API CodeCraftHub !",
        "status": "En ligne",
        "endpoints_disponibles": {
            "tous_les_cours": "/api/courses",
            "statistiques": "/api/courses/stats"
        }
    }), 200

# 1. RECUPERER TOUS LES COURS (GET)
@app.route('/api/courses', methods=['GET'])
def get_courses():
    return jsonify(load_courses()), 200

# 2. RECUPERER UN COURS SPECIFIQUE (GET)
@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    courses = load_courses()
    course = next((c for c in courses if c['id'] == course_id), None)
    
    # Gestion d'erreur : Cours non trouvé
    if not course:
        return jsonify({"error": f"Cours avec l'id {course_id} introuvable"}), 404
        
    return jsonify(course), 200

# 3. AJOUTER UN NOUVEAU COURS (POST)
@app.route('/api/courses', methods=['POST'])
def create_course():
    data = request.get_json() or {}
    
    # Gestion d'erreur : Validation des champs requis
    required = ['name', 'description', 'target_date', 'status']
    for field in required:
        if field not in data or not str(data[field]).strip():
            return jsonify({"error": f"Le champ '{field}' est requis"}), 400

    # Gestion d'erreur : Validation des valeurs de statut
    valid_statuses = ["Non commencé", "En cours", "Terminé"]
    if data['status'] not in valid_statuses:
        return jsonify({"error": f"Statut invalide. Choisissez parmi : {valid_statuses}"}), 400

    courses = load_courses()
    next_id = max([c['id'] for c in courses], default=0) + 1

    new_course = {
        "id": next_id,
        "name": data['name'].strip(),
        "description": data['description'].strip(),
        "target_date": data['target_date'].strip(),
        "status": data['status'],
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    courses.append(new_course)
    
    # Gestion d'erreur : Problème de sauvegarde
    if not save_courses(courses):
        return jsonify({"error": "Erreur lors de la sauvegarde des données"}), 500
        
    return jsonify(new_course), 201

# 4. METTRE A JOUR UN COURS (PUT)
@app.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    courses = load_courses()
    course = next((c for c in courses if c['id'] == course_id), None)
    
    # Gestion d'erreur : Cours non trouvé
    if not course:
        return jsonify({"error": f"Cours avec l'id {course_id} introuvable"}), 404

    data = request.get_json() or {}
    
    if 'name' in data: course['name'] = data['name'].strip()
    if 'description' in data: course['description'] = data['description'].strip()
    if 'target_date' in data: course['target_date'] = data['target_date'].strip()
    
    # Gestion d'erreur : Validation du statut lors de la modification
    if 'status' in data:
        valid_statuses = ["Non commencé", "En cours", "Terminé"]
        if data['status'] not in valid_statuses:
            return jsonify({"error": f"Statut invalide. Choisissez parmi : {valid_statuses}"}), 400
        course['status'] = data['status']

    if not save_courses(courses):
        return jsonify({"error": "Erreur lors de la sauvegarde"}), 500
        
    return jsonify(course), 200

# 5. SUPPRIMER UN COURS (DELETE)
@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    courses = load_courses()
    course = next((c for c in courses if c['id'] == course_id), None)
    
    # Gestion d'erreur : Cours non trouvé
    if not course:
        return jsonify({"error": f"Cours avec l'id {course_id} introuvable"}), 404

    courses = [c for c in courses if c['id'] != course_id]
    
    if not save_courses(courses):
        return jsonify({"error": "Erreur lors de la suppression"}), 500
        
    return jsonify({"message": f"Cours {course_id} supprimé avec succès"}), 200

# --- BONUS : POINT DE TERMINAISON DES STATISTIQUES (GET) ---
@app.route('/api/courses/stats', methods=['GET'])
def get_stats():
    courses = load_courses()
    stats = {
        "Total des cours": len(courses),
        "Non commencé": 0,
        "En cours": 0,
        "Terminé": 0
    }
    for c in courses:
        status = c.get('status')
        if status in stats:
            stats[status] += 1
    return jsonify(stats), 200

if __name__ == '__main__':
    print("- CodeCraftHub API is starting...")
    print(f"- Data will be stored in: {os.path.abspath(DATA_FILE)}")
    print("- API will be available at: http://localhost:5000")
    app.run(debug=True, port=5000)