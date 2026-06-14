from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'sender', 'receiver', 'content', 'timestamp', 'is_read', 'sender_email', 'receiver_email')
        read_only_fields = ('sender', 'timestamp', 'is_read', 'sender_email', 'receiver_email')
