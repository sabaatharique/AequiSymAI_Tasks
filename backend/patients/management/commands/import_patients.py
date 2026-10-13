import os
from pathlib import Path

import pandas as pd
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from patients.models import Patient
from patients.utils import normalize_mobile

REQUIRED_COLUMNS = {"EMP_NAME", "GENDER", "AGE", "BLOOD_GROUP", "PHONE_MOBILE"}


def read_sheet(path):
    suffix = path.suffix.lower()
    if suffix == ".csv":
        df = pd.read_csv(path, dtype=str, keep_default_na=False)
    elif suffix == ".xlsx":
        df = pd.read_excel(path, dtype=str, keep_default_na=False)
    else:
        raise CommandError(f"Unsupported file type '{suffix}'. Provide .csv or .xlsx.")
    df.columns = [str(c).strip().upper() for c in df.columns]
    return df


def clean_row(row):
    mobile = normalize_mobile(row["PHONE_MOBILE"])
    if mobile is None:
        raise ValueError(f"Invalid mobile {row['PHONE_MOBILE']!r}")

    # trim and collapse spaces, split first / last name based on first space
    name = " ".join(str(row["EMP_NAME"]).split())     
    if not name:
        raise ValueError("Name is empty")
    first_name, _, last_name = name.partition(" ")      

    gender = str(row["GENDER"]).strip().upper()
    if gender not in Patient.Gender.values:
        raise ValueError(f"Invalid gender {row['GENDER']!r}")

    blood_group = str(row["BLOOD_GROUP"]).strip().upper()
    if blood_group not in Patient.BloodGroup.values:
        raise ValueError(f"Invalid blood group {row['BLOOD_GROUP']!r}")

    try:
        age_value = float(str(row["AGE"]).strip())
    except ValueError:
        raise ValueError(f"Invalid age {row['AGE']!r}")
    if not age_value.is_integer() or not 0 <= age_value <= 150:
        raise ValueError(f"Invalid age {row['AGE']!r}")

    return {
        "mobile": mobile,
        "first_name": first_name,
        "last_name": last_name,
        "age": int(age_value),
        "gender": gender,
        "blood_group": blood_group,
    }


class Command(BaseCommand):
    help = (
        "Import patients from a CSV/XLSX sheet. Safe to re-run: patients are matched by mobile number, existing ones are refreshed, new ones added."
    )

    def add_arguments(self, parser):
        parser.add_argument("file", help="Path to the .csv or .xlsx file")
        parser.add_argument(
            "--password",
            help="Default password for newly created patients (DEFAULT_PATIENT_PASSWORD in .env)",
        )

    def handle(self, *args, **options):
        path = Path(options["file"])
        if not path.is_file():
            raise CommandError(f"File not found: {path}")

        password = options["password"] or os.getenv("DEFAULT_PATIENT_PASSWORD")
        if not password:
            raise CommandError(
                "No default password. Pass --password or set DEFAULT_PATIENT_PASSWORD in .env."
            )
        try:
            validate_password(password)
        except ValidationError as exc:
            raise CommandError("Default password rejected: " + " ".join(exc.messages))

        df = read_sheet(path)
        missing = REQUIRED_COLUMNS - set(df.columns)
        if missing:
            raise CommandError(f"Missing column(s): {', '.join(sorted(missing))}")

        created_count = existing_count = skipped = 0
        seen = set()

        with transaction.atomic():                       
            for line, row in enumerate(df.to_dict("records"), start=2): 
                try:
                    data = clean_row(row)
                except ValueError as exc:
                    skipped += 1
                    self.stderr.write(self.style.WARNING(f"Row {line} skipped: {exc}"))
                    continue

                mobile = data.pop("mobile")
                if mobile in seen:
                    skipped += 1
                    self.stderr.write(self.style.WARNING(
                        f"Row {line} skipped: duplicate mobile {mobile} in file"))
                    continue
                seen.add(mobile)

                patient, created = Patient.objects.update_or_create(
                    mobile=mobile,
                    defaults=data,     
                )
                if created:
                    patient.set_password(password)      
                    patient.save(update_fields=["password"])
                    created_count += 1
                else:
                    existing_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done: {created_count} created, {existing_count} already existed (refreshed), {skipped} skipped."
        ))