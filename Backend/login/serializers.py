from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import UserProfile

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('Usuario inactivo')
            else:
                raise serializers.ValidationError('Credenciales incorrectas')
        else:
            raise serializers.ValidationError('Debe proporcionar username y password')

        return data

class UserProfileSerializer(serializers.ModelSerializer):
    current_task_count = serializers.ReadOnlyField()
    can_accept_more_tasks = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = ('role', 'created_at', 'updated_at', 'tasks_assigned', 
                 'tasks_completed', 'tasks_rejected', 'is_active_worker',
                 'max_tasks', 'current_task_count', 'can_accept_more_tasks')

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='userprofile', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'role')

    def create(self, validated_data):
        role = validated_data.pop('role', 'adiestrado')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Actualizar el perfil con el rol
        user.userprofile.role = role
        user.userprofile.save()
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, required=False)
    is_active_worker = serializers.BooleanField(required=False)
    max_tasks = serializers.IntegerField(required=False, min_value=1)

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active_worker', 'max_tasks')

    def update(self, instance, validated_data):
        role = validated_data.pop('role', None)
        is_active_worker = validated_data.pop('is_active_worker', None)
        max_tasks = validated_data.pop('max_tasks', None)
        
        # Actualizar campos básicos del usuario
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar perfil si se proporciona
        profile = instance.userprofile
        if role is not None:
            profile.role = role
        if is_active_worker is not None:
            profile.is_active_worker = is_active_worker
        if max_tasks is not None:
            profile.max_tasks = max_tasks
        profile.save()
        
        return instance