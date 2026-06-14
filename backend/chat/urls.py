from django.urls import path
from .views import ConversationListView, MessageHistoryView, SendMessageView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversations'),
    path('history/<uuid:partner_id>/', MessageHistoryView.as_view(), name='message_history'),
    path('send/', SendMessageView.as_view(), name='send_message'),
]
