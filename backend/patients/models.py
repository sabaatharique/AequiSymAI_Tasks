from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

        
class PatientManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, mobile, password, **other_fields):
        if not mobile:
            raise ValueError("Enter mobile number.")
        user = self.model(mobile=mobile, **other_fields)
        user.set_password(password)         
        user.save(using=self._db)
        return user

    def create_user(self, mobile, password=None, **other_fields):
        other_fields.setdefault("is_staff", False)
        other_fields.setdefault("is_superuser", False)
        return self._create_user(mobile, password, **other_fields)

    def create_superuser(self, mobile, password=None, **other_fields):
        other_fields.setdefault("is_staff", True)
        other_fields.setdefault("is_superuser", True)
        if other_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if other_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(mobile, password, **other_fields)
    

class Patient(AbstractUser):
    class Gender(models.TextChoices):
        M = "MALE", "Male"
        F = "FEMALE", "Female"

    class BloodGroup(models.TextChoices):
        APos = "A+", "A+"
        ANeg = "A-", "A-"
        BPos = "B+", "B+"
        BNeg = "B-", "B-"
        ABPos = "AB+", "AB+"
        ABNeg = "AB-", "AB-"
        OPos = "O+", "O+"
        ONeg = "O-", "O-"

    username = None
    first_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=11, unique=True)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=6, choices=Gender)
    blood_group = models.CharField(max_length=3, choices=BloodGroup)
    total_visits = models.PositiveIntegerField(default=0)
    last_visit_date = models.DateTimeField(null=True, blank=True)
    address = models.CharField(max_length=255, blank=True)

    USERNAME_FIELD = 'mobile'
    REQUIRED_FIELDS = ['first_name', 'age', 'gender', 'blood_group']

    objects = PatientManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class PatientVisit(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="visits")
    doctor_name = models.CharField(max_length=255)
    visit_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    clinical_note = models.TextField(blank=True)



