from flask import Flask, render_template, request, redirect, url_for, flash
from flask_bcrypt import Bcrypt
from flask_login import login_user, login_required, logout_user, current_user
from database import db, login_manager
from models import User, Property, FinancialRecord
from calculations import get_property_stats

app = Flask(__name__)
app.config['SECRET_KEY'] = 'makani_ultra_secret_luxury'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///makani.db'

db.init_app(app)
bcrypt = Bcrypt(app)
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def login_page():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password, password):
        login_user(user)
        return redirect(url_for('dashboard'))
    flash('Email ou mot de passe incorrect', 'error')
    return redirect(url_for('login_page'))

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'admin':
        properties = Property.query.all()
    else:
        properties = Property.query.filter_by(owner_id=current_user.id).all()
    
    # Calcul des stats pour chaque propriété
    for p in properties:
        p.stats = get_property_stats(p)
        
    return render_template('dashboard.html', properties=properties)

@app.route('/property/<int:id>')
@login_required
def property_detail(id):
    prop = Property.query.get_or_404(id)
    stats = get_property_stats(prop)
    return render_template('property.html', prop=prop, stats=stats)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login_page'))



# Ajoute ces imports en haut
from datetime import datetime

# --- NOUVELLE ROUTE : AJOUTER UNE PROPRIÉTÉ ---
@app.route('/add_property', methods=['POST'])
@login_required
def add_property():
    if current_user.role != 'admin':
        return redirect(url_for('dashboard'))
    
    name = request.form.get('name')
    location = request.form.get('location')
    rate = float(request.form.get('rate')) / 100 # Convertir % en décimal
    
    new_prop = Property(name=name, location=location, commission_rate=rate, owner_id=current_user.id)
    db.session.add(new_prop)
    db.session.commit()
    flash('Propriété ajoutée avec succès !', 'success')
    return redirect(url_for('dashboard'))

# --- NOUVELLE ROUTE : AJOUTER UNE TRANSACTION ---
@app.route('/add_record', methods=['POST'])
@login_required
def add_record():
    prop_id = request.form.get('property_id')
    amount = float(request.form.get('amount'))
    t_type = request.form.get('type') # 'revenue' ou 'expense'
    desc = request.form.get('description')
    
    new_record = FinancialRecord(
        amount=amount, 
        type=t_type, 
        description=desc, 
        property_id=prop_id,
        date=datetime.utcnow()
    )
    db.session.add(new_record)
    db.session.commit()
    flash('Transaction enregistrée !', 'success')
    return redirect(url_for('dashboard'))




# --- ROUTE : LISTER LES PROPRIÉTAIRES ---
@app.route('/owners')
@login_required
def list_owners():
    if current_user.role != 'admin':
        return redirect(url_for('dashboard'))
    # On récupère tous les utilisateurs qui ont le rôle 'owner'
    owners = User.query.filter_by(role='owner').all()
    return render_template('owners.html', owners=owners)

# --- ROUTE : CRÉER UN PROPRIÉTAIRE ---
@app.route('/add_owner', methods=['POST'])
@login_required
def add_owner():
    if current_user.role == 'admin':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Vérifier si l'email existe déjà
        if User.query.filter_by(email=email).first():
            flash('Cet email est déjà utilisé', 'error')
        else:
            hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
            new_owner = User(name=name, email=email, password=hashed_pw, role='owner')
            db.session.add(new_owner)
            db.session.commit()
            flash('Propriétaire créé avec succès', 'success')
            
    return redirect(url_for('list_owners'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Crée les tables
        
        # --- BLOC DE CRÉATION DE L'ADMIN ---
        if not User.query.filter_by(email='admin@makani.ma').first():
            # On hash le mot de passe pour la sécurité
            hashed_pw = bcrypt.generate_password_hash('admin123').decode('utf-8')
            test_admin = User(
                email='admin@makani.ma', 
                password=hashed_pw, 
                role='admin', 
                name="Directeur Agence"
            )
            db.session.add(test_admin)
            db.session.commit()
            print(">>> Compte Admin créé : admin@makani.ma / admin123")
        # -----------------------------------
        
    app.run(debug=True)