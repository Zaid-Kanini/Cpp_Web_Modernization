import 'express';
import { JwtPayload } from './auth.types';

declare module 'express' {
  export interface Request {
    user?: JwtPayload;
    correlationId?: string;
  }
}
