#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
while ! python -c "
import os, sys
import psycopg2
try:
    conn = psycopg2.connect(
        dbname=os.environ.get('DATABASE_NAME', 'autofix'),
        user=os.environ.get('DATABASE_USER', 'autofix'),
        password=os.environ.get('DATABASE_PASSWORD', ''),
        host=os.environ.get('DATABASE_HOST', 'db'),
        port=os.environ.get('DATABASE_PORT', '5432'),
    )
    conn.close()
except Exception:
    sys.exit(1)
" 2>/dev/null; do
  sleep 2
done
echo "PostgreSQL is ready."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ "$DJANGO_RUNSERVER" = "true" ]; then
  echo "Starting Django development server..."
  exec python manage.py runserver 0.0.0.0:8000
else
  echo "Starting Gunicorn..."
  exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
fi
