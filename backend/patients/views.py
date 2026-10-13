from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Patient, PatientVisit
from .serializers import PatientSerializer, PatientVisitSerializer


class PatientQuerysetMixin:
    def get_queryset(self):
        qs = Patient.objects.order_by("id")   
        user = self.request.user 
        return qs if user.is_staff else qs.filter(pk=user.pk)


class PatientListCreateView(PatientQuerysetMixin, generics.ListCreateAPIView):
    serializer_class = PatientSerializer

    def get_permissions(self):
        if self.request.method == "POST":     
            return [AllowAny()]
        return [IsAuthenticated()]


class PatientDetailView(PatientQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]


class PatientVisitCreateView(generics.ListCreateAPIView):
    serializer_class = PatientVisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PatientVisit.objects.order_by("-visit_date")
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if not user.is_staff:
            qs = qs.filter(patient=user)
        return qs