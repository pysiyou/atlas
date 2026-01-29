"""
Custom exception classes
"""


class NotFoundException(Exception):
    """Raised when a resource is not found"""
    pass


class ValidationException(Exception):
    """Raised when validation fails"""
    pass


class AuthorizationException(Exception):
    """Raised when user lacks permission"""
    pass


class BusinessRuleException(Exception):
    """Raised when a business rule is violated"""
    pass


class LabOperationError(Exception):
    """Raised when a lab operation fails (invalid transition, validation, etc.)."""
    def __init__(self, message: str, status_code: int = 400, error_code: str = "LAB_OPERATION_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)
