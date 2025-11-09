# Workflow-proyect

Sistema con usuarios y roles para una empresa que quiera gestionar las tareas que realizan sus trabajadores.

---

## 🚀 Instalación rápida

### Backend

# Clonar repositorio
git clone https://github.com/C-1412/Workflow-proyect.git
cd Backend

# Crear entorno virtual e instalar dependencias
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
pip install -r requirements.txt

# Migraciones y superusuario
python manage.py migrate
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver

Disponible en http://127.0.0.1:8000/admin

Frontend

cd Frontend
npm install
npm run dev

Disponible en http://localhost:5173/
