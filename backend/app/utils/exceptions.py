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
