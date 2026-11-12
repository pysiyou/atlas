"""Derive order/invoice payment status from the payment ledger."""

from app.shared.contracts.enums import PaymentStatus


def money(value: float | int | None) -> float:
    """Round currency to cents so float sums do not skip `partial`."""
    if value is None:
        return 0.0
    return round(float(value), 2)


def remaining_balance(order_total: float, total_paid: float) -> float:
    """Amount still due, never negative, rounded to cents."""
    return max(0.0, money(order_total) - money(total_paid))


def derive_payment_status(total_paid: float, order_total: float) -> PaymentStatus:
    """
    Map summed payment rows onto unpaid | partial | paid.

    - unpaid: nothing recorded
    - paid: recorded amount covers the order total
    - partial: some payment recorded, remaining balance > 0
    """
    paid = money(total_paid)
    total = money(order_total)
    if paid <= 0:
        return PaymentStatus.UNPAID
    if paid >= total:
        return PaymentStatus.PAID
    return PaymentStatus.PARTIAL
