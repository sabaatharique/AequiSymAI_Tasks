from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Patient, PatientVisit


@admin.register(Patient)
class PatientAdmin(UserAdmin):
    list_display = ("mobile", "first_name", "last_name", "age", "gender", "blood_group", "total_visits", "last_visit_date")
    list_filter = ("gender", "blood_group", "is_staff", "is_active")
    search_fields = ("mobile", "first_name", "last_name")
    ordering = ("mobile",)

    fieldsets = (
        (None, {"fields": ("mobile", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "age", "gender", "blood_group", "address")}),
        ("Visit info", {"fields": ("total_visits", "last_visit_date")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("mobile", "first_name", "last_name", "age", "gender", "blood_group", "password1", "password2"),
        }),
    )


@admin.register(PatientVisit)
class PatientVisitAdmin(admin.ModelAdmin):
    list_display = ("patient", "doctor_name", "visit_date", "created_at")
    list_filter = ("doctor_name", "visit_date")
    search_fields = ("patient__mobile", "doctor_name")
    readonly_fields = ("created_at",)