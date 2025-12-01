"""
Helper functions for managing work order numbers
Add this to a new file: app/utils/work_order_helper.py
"""
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import WorkOrderCounter


def get_next_work_order_number(db: Session, counter_type: str = 'subscription') -> tuple[int, str]:
    """
    Get the next sequential work order number for a given type.
    Returns a tuple of (number, formatted_string)

    Args:
        db: Database session
        counter_type: Type of work order ('subscription' or 'cancellation')

    Returns:
        tuple: (number, formatted_string) e.g., (1, "1/25")
    """
    current_year = datetime.now().year % 100  # Get last 2 digits (e.g., 25 for 2025)

    # Try to get existing counter for this type and year
    counter = db.query(WorkOrderCounter).filter(
        WorkOrderCounter.counter_type == counter_type,
        WorkOrderCounter.year == current_year
    ).with_for_update().first()  # Lock row for update to prevent race conditions

    if counter:
        # Increment existing counter
        counter.current_number += 1
        next_number = counter.current_number
    else:
        # Create new counter for this type and year
        next_number = 1
        counter = WorkOrderCounter(
            counter_type=counter_type,
            current_number=next_number,
            year=current_year
        )
        db.add(counter)

    db.flush()  # Ensure the counter is updated in DB

    formatted_number = f"{next_number}/{current_year}"
    return next_number, formatted_number


def generate_work_order_filename(work_order_number: int, order_type: str = 'subscription') -> str:
    """
    Generate a unique filename for a work order PDF.

    Args:
        work_order_number: The sequential work order number
        order_type: Type of order ('subscription' or 'cancellation')

    Returns:
        str: Filename like "ODT_1.pdf" or "ODTBaja_1.pdf"
    """
    if order_type == 'cancellation':
        return f"ODTBaja_{work_order_number}.pdf"
    else:
        return f"ODT_{work_order_number}.pdf"


def initialize_counters(db: Session):
    """
    Initialize work order counters if they don't exist.
    Call this once during application startup or as a migration.
    """
    current_year = datetime.now().year % 100

    counter_types = ['subscription', 'cancellation']

    for counter_type in counter_types:
        existing = db.query(WorkOrderCounter).filter(
            WorkOrderCounter.counter_type == counter_type,
            WorkOrderCounter.year == current_year
        ).first()

        if not existing:
            counter = WorkOrderCounter(
                counter_type=counter_type,
                current_number=0,
                year=current_year
            )
            db.add(counter)

    db.commit()
    print(f"Work order counters initialized for year {current_year}")