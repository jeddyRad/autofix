#This file is the main entry point for all API requests coming from the frontend.
# HOW IT WORKS: When the Angular frontend makes an HTTP request to 'http://localhost:8000/api/...', 
# Django receives it and uses these URL patterns to route the request to the correct app.

from django.contrib import admin
from django.urls import path, include
#Routes each frontend request to each concerned app 
urlpatterns = [
    path('admin/', admin.site.norm_url if hasattr(admin.site, 'norm_url') else admin.site.urls),
    # Routes frontend authentication requests
    path('api/auth/', include('accounts.urls')),
    
    # Routes general API requests
    path('api/', include('booking.urls')),
    
    # Routes chat-related API requests
    path('api/chat/', include('chat.urls')),
]
