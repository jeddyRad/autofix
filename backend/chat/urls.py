from django.urls import path
from .views import ConversationListView, MessageHistoryView, SendMessageView, UnreadTotalView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversations'),
    path('unread-total/', UnreadTotalView.as_view(), name='unread_total'),
    path('history/<uuid:partner_id>/', MessageHistoryView.as_view(), name='message_history'),
    path('send/', SendMessageView.as_view(), name='send_message'),
]
