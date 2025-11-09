from django.urls import path
from .views import LoginView, UserListView, CreateUserView, CurrentUserView, UpdateUserView, DeleteUserView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/create/', CreateUserView.as_view(), name='user-create'),
    path('users/update/<int:user_id>/', UpdateUserView.as_view(), name='user-update'),
    path('users/delete/<int:user_id>/', DeleteUserView.as_view(), name='user-delete'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]