from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .serializers import LoginSerializer, UserSerializer, UserCreateSerializer, UserUpdateSerializer
from .models import UserProfile

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        # Asegurarse de que el usuario tenga perfil
        if not hasattr(user, 'userprofile'):
            UserProfile.objects.create(user=user, role='user')
        
        user_data = UserSerializer(user).data
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data
        }, status=status.HTTP_200_OK)

class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Solo superusuarios y administradores pueden ver la lista de usuarios
        user_profile = request.user.userprofile
        if not (request.user.is_superuser or user_profile.role in ['superuser', 'admin']):
            return Response({'error': 'No tienes permisos para realizar esta acción'}, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class CreateUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Solo superusuarios y administradores pueden crear usuarios
        user_profile = request.user.userprofile
        if not (request.user.is_superuser or user_profile.role in ['superuser', 'admin']):
            return Response({'error': 'No tienes permisos para realizar esta acción'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UpdateUserView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, user_id):
        # Solo superusuarios y administradores pueden editar usuarios
        user_profile = request.user.userprofile
        if not (request.user.is_superuser or user_profile.role in ['superuser', 'admin']):
            return Response({'error': 'No tienes permisos para realizar esta acción'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        # Solo superusuarios y administradores pueden eliminar usuarios
        user_profile = request.user.userprofile
        if not (request.user.is_superuser or user_profile.role in ['superuser', 'admin']):
            return Response({'error': 'No tienes permisos para realizar esta acción'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # No permitir eliminarse a sí mismo
        if user == request.user:
            return Response({'error': 'No puedes eliminar tu propio usuario'}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response({'message': 'Usuario eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Asegurarse de que el usuario tenga perfil
        if not hasattr(request.user, 'userprofile'):
            UserProfile.objects.create(user=request.user, role='user')
            
        serializer = UserSerializer(request.user)
        return Response(serializer.data)