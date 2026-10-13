from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .models import Patient, PatientVisit
from django.db import transaction
from django.db.models import Value, F
from django.db.models.functions import Greatest
from .utils import MOBILE_RE


class PatientVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientVisit
        fields = ["id", "patient", "doctor_name", "visit_date", "clinical_note", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_visit_date(self, value):
        if value > timezone.now():
            raise serializers.ValidationError("Visit date cannot be in the future.")
        return value

    def validate_patient(self, patient):

        request = self.context["request"]
        if not request.user.is_staff and patient != request.user:
            raise serializers.ValidationError(
                "Only staff can add visits for another user."
            )
        return patient

    @transaction.atomic
    def create(self, validated_data):
        visit = super().create(validated_data)
        Patient.objects.filter(pk=visit.patient_id).update(
            total_visits=F("total_visits") + 1,
            last_visit_date=Greatest("last_visit_date", Value(visit.visit_date)),
        )
        return visit


class PatientSerializer(serializers.ModelSerializer):
    visits = PatientVisitSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = ["id", "mobile", "password", "first_name", "last_name", "age", "gender", "blood_group", "address", "total_visits", "last_visit_date", "is_staff", "visits"]
        read_only_fields = ["id", "total_visits", "last_visit_date", "is_staff", "visits"]
        extra_kwargs = {
            "password": {"write_only": True, "style": {"input_type": "password"}},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance is not None:
            self.fields["password"].required = False

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_mobile(self, value):
        if not MOBILE_RE.fullmatch(value):
            raise serializers.ValidationError("Enter a valid 11-digit mobile number.")
        return value

    def create(self, validated_data):
        return Patient.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance