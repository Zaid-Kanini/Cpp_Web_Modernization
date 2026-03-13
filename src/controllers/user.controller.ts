import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createUserSchema, updateUserSchema } from '../validators/user.validators';
import { createUser, updateUser, deleteUser, listUsers } from '../services/user.service';
import { logger } from '../utils/logger';

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Raw request body received', { body: req.body });
    const validatedData = createUserSchema.parse(req.body) as any;
    logger.info('Validated data after schema parse', { validatedData });
    const correlationId = req.correlationId || uuidv4();
    const createdBy = req.user!.user_id;

    const result = await createUser(validatedData, createdBy, correlationId);

    logger.info('User creation endpoint called', {
      email: validatedData.email,
      technology_specializations: validatedData.technology_specializations,
      correlation_id: correlationId,
    });

    res.status(201).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }
    next(error);
  }
}

export async function updateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);
    const correlationId = req.correlationId || uuidv4();
    const updatedBy = req.user!.user_id;

    const result = await updateUser(id, validatedData, updatedBy, correlationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }
    next(error);
  }
}

export async function deleteUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const correlationId = req.correlationId || uuidv4();
    const requestingUserId = req.user!.user_id;

    const result = await deleteUser(id, requestingUserId, correlationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error.message.includes('Cannot delete your own account')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }
    next(error);
  }
}

export async function listUsersHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await listUsers();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
