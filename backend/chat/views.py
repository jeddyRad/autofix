from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Message
from .serializers import MessageSerializer
from accounts.serializers import UserSerializer

User = get_user_model()

class ConversationListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        messages = Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-timestamp')
        
        partners = {}
        for msg in messages:
            partner = msg.receiver if msg.sender == user else msg.sender
            if partner.id not in partners:
                partners[partner.id] = {
                    'partner': UserSerializer(partner).data,
                    'last_message': MessageSerializer(msg).data
                }
                
        return Response(list(partners.values()))

class MessageHistoryView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        partner_id = self.kwargs.get('partner_id')
        
        Message.objects.filter(sender_id=partner_id, receiver=user, is_read=False).update(is_read=True)
        
        return Message.objects.filter(
            Q(sender=user, receiver_id=partner_id) |
            Q(sender_id=partner_id, receiver=user)
        ).order_by('timestamp')

class SendMessageView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        receiver_id = self.request.data.get('receiver')
        if not receiver_id:
            raise serializers.ValidationError("Le champ 'receiver' est requis.")
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("Le destinataire n'existe pas.")
            
        serializer.save(sender=self.request.user, receiver=receiver)
