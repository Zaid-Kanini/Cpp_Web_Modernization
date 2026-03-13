import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import passport from '../../config/passport';
import { JwtPayload, UserRole } from '../../types/auth.types';

jest.mock('../../config/passport');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
      cookies: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should call next() and populate req.user with valid token', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      (passport.authenticate as jest.Mock).mockImplementation((_strategy, _options, callback) => {
        return (_req: Request, _res: Response, _next: NextFunction) => {
          callback(null, mockUser);
        };
      });

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token', () => {
      (passport.authenticate as jest.Mock).mockImplementation((_strategy, _options, callback) => {
        return (_req: Request, _res: Response, _next: NextFunction) => {
          callback(null, false, undefined); // Fix TypeScript unused parameter warnings for false callback
        };
      });

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should return 401 with missing token', () => {
      (passport.authenticate as jest.Mock).mockImplementation((_strategy, _options, callback) => {
        return (_req: Request, _res: Response, _next: NextFunction) => {
          callback(null, null);
        };
      });

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on authentication error', () => {
      const mockError = new Error('JWT verification failed');

      (passport.authenticate as jest.Mock).mockImplementation((_strategy, _options, callback) => {
        return (_req: Request, _res: Response, _next: NextFunction) => {
          callback(mockError, null);
        };
      });

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication error occurred.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 with expired token', () => {
      (passport.authenticate as jest.Mock).mockImplementation((_strategy, _options, callback) => {
        return (_req: Request, _res: Response, _next: NextFunction) => {
          callback(null, false, undefined); // Fix TypeScript unused parameter warnings for false callback
        };
      });

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not expose internal error details in response', () => {
      const mockError = new Error('Internal database connection failed');

      (passport.authenticate as jest.Mock).mockImplementation((_strategy, _options, callback) => {
        return (_req: Request, _res: Response, _next: NextFunction) => {
          callback(mockError, null);
        };
      });

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication error occurred.',
      });
      
      const responseBody = jsonMock.mock.calls[0][0];
      expect(responseBody.message).not.toContain('database');
      expect(responseBody.message).not.toContain('Internal');
    });

    it('should handle FACULTY role correctly', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'faculty@example.com',
        role: UserRole.FACULTY,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      (passport.authenticate as jest.Mock).mockImplementation((_strategy, _options, callback) => {
        return (_req: Request, _res: Response, _next: NextFunction) => {
          callback(null, mockUser);
        };
      });

      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Tests', () => {
    it('should complete authentication within 10ms', () => {
      const mockUser: JwtPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      (passport.authenticate as jest.Mock).mockImplementation((_strategy, _options, callback) => {
        return (_req: Request, _res: Response, _next: NextFunction) => {
          callback(null, mockUser);
        };
      });

      const startTime = Date.now();
      requireAuth(mockRequest as Request, mockResponse as Response, mockNext);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
    });
  });
});
