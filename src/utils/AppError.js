export class AppError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
  }
}

export const handleFirestoreError = (error) => {
  console.error('Firestore Error:', error);
  let message = 'Произошла ошибка при работе с базой данных.';
  const code = error?.code || 'unknown';

  if (error?.code) {
    switch (error.code) {
      case 'permission-denied':
        message = 'У вас нет прав для выполнения этой операции.';
        break;
      case 'not-found':
        message = 'Запрашиваемый документ не найден.';
        break;
      case 'already-exists':
        message = 'Документ уже существует.';
        break;
      case 'failed-precondition':
        message = 'Операция отклонена из-за невыполненных условий.';
        break;
      case 'resource-exhausted':
        message = 'Лимит запросов исчерпан. Пожалуйста, попробуйте позже.';
        break;
      case 'unauthenticated':
        message = 'Пользователь не авторизован.';
        break;
      case 'unavailable':
        message = 'Сервис временно недоступен. Проверьте подключение к сети.';
        break;
      default:
        if (error.message) {
          message = error.message;
        }
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return new AppError(message, code, error);
};
