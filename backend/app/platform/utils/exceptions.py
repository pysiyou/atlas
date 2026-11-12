"""
Custom exception classes
"""


class LabOperationError(Exception):
    """Raised when a lab operation fails (invalid transition, validation, etc.)."""

    def __init__(
        self, message: str, status_code: int = 400, error_code: str = "LAB_OPERATION_ERROR"
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)
