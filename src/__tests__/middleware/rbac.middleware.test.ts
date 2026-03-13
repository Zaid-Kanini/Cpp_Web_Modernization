import { Request, Response, NextFunction } from 'express';
import { requireAdmin, requireFaculty } from '../../middleware/rbac.middleware';
import { JwtPayload, UserRole } from '../../types/auth.types';

describe('RBAC Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {};
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('requireAdmin', () => {
    it('should call next() when user has ADMIN role', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = mockUser;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 403 when user has FACULTY role', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'faculty@example.com',
        role: UserRole.FACULTY,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = mockUser;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Admin role required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when req.user is null', () => {
      mockRequest.user = null as any;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not expose internal details in error response', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'faculty@example.com',
        role: UserRole.FACULTY,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = mockUser;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      const responseBody = jsonMock.mock.calls[0][0];
      expect(responseBody.message).toBe('Access denied. Admin role required.');
      expect(responseBody.message).not.toContain('FACULTY');
      expect(responseBody.message).not.toContain('user_id');
      expect(responseBody.message).not.toContain('123e4567');
    });
  });

  describe('requireFaculty', () => {
    it('should call next() when user has FACULTY role', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'faculty@example.com',
        role: UserRole.FACULTY,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = mockUser;

      requireFaculty(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 403 when user has ADMIN role', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = mockUser;

      requireFaculty(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Faculty role required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined;

      requireFaculty(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when req.user is null', () => {
      mockRequest.user = null as any;

      requireFaculty(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work in middleware chain: requireAuth -> requireAdmin', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = mockUser;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should work in middleware chain: requireAuth -> requireFaculty', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'faculty@example.com',
        role: UserRole.FACULTY,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = mockUser;

      requireFaculty(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
