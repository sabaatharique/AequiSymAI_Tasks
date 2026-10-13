from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_staff'] = user.is_staff
        token['user_id'] = user.id
        token['mobile'] = user.mobile
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['is_staff'] = self.user.is_staff
        data['user_id'] = self.user.id
        data['mobile'] = self.user.mobile
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('patients.urls')),
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token-obtain"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
