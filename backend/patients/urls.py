from django.urls import path

from . import views

urlpatterns = [
    path("patients/", views.PatientListCreateView.as_view(), name="patient-list"),
    path("patients/<int:pk>/", views.PatientDetailView.as_view(), name="patient-detail"),
    path("visits/", views.PatientVisitCreateView.as_view(), name="visit-create"),
]