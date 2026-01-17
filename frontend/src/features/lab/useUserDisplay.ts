/**
 * User display hook
 * Returns helper functions to display user information
 */
export const useUserDisplay = () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getUserDisplay: (_userId: string) => 'User',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getUserName: (_userId: string) => 'User',
  };
};
