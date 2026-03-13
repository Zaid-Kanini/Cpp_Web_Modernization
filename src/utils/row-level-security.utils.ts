export const addFacultyFilter = <T extends Record<string, any>>(
  userId: string,
  baseQuery: T
): T & { user_id: string } => {
  return {
    ...baseQuery,
    user_id: userId,
  };
};
